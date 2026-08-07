const mongoose = require('mongoose');

const Bid = require('../models/Bid');
const Tender = require('../models/Tender');

function createTenderPipeline(match = {}, includeBids = false) {
  const projection = {
    _id: 0,
    id: { $toString: '$_id' },
    title: 1,
    description: 1,
    quantity: 1,
    deadline: 1,
    status: 1,
    lowestBid: 1,
    bidsCount: 1,
    createdAt: 1,
  };

  if (includeBids) {
    projection.bids = {
      $map: {
        input: '$bids',
        as: 'bid',
        in: {
          id: { $toString: '$$bid._id' },
          tenderId: { $toString: '$$bid.tenderId' },
          vendorName: '$$bid.vendorName',
          amount: '$$bid.amount',
          submittedAt: '$$bid.createdAt',
        },
      },
    };
  }

  return [
    { $match: match },
    {
      $lookup: {
        from: Bid.collection.name,
        let: { currentTenderId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$tenderId', '$$currentTenderId'] } } },
          { $sort: { amount: 1, createdAt: 1 } },
        ],
        as: 'bids',
      },
    },
    {
      $addFields: {
        lowestBid: {
          $cond: [{ $gt: [{ $size: '$bids' }, 0] }, { $min: '$bids.amount' }, null],
        },
        bidsCount: { $size: '$bids' },
      },
    },
    { $project: projection },
    { $sort: { createdAt: -1 } },
  ];
}

async function listTenders() {
  return Tender.aggregate(createTenderPipeline());
}

async function getTender(tenderId, includeBids = true) {
  const objectId = new mongoose.Types.ObjectId(tenderId);
  const results = await Tender.aggregate(createTenderPipeline({ _id: objectId }, includeBids));
  return results[0] || null;
}

function toBidResponse(bid) {
  return {
    id: bid._id.toString(),
    tenderId: bid.tenderId.toString(),
    vendorName: bid.vendorName,
    amount: bid.amount,
    submittedAt: bid.createdAt.toISOString(),
  };
}

module.exports = {
  getTender,
  listTenders,
  toBidResponse,
};
