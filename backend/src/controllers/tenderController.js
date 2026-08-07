const mongoose = require('mongoose');

const HttpError = require('../errors/HttpError');
const Bid = require('../models/Bid');
const Tender = require('../models/Tender');
const tenderService = require('../services/tenderService');
const { validateBidInput, validateTenderInput } = require('../validation/tenderValidation');

function validateObjectId(value) {
  if (!mongoose.isObjectIdOrHexString(value)) {
    throw new HttpError(400, 'Tender ID must be a valid MongoDB ObjectId.');
  }
}

async function listTenders(request, response) {
  const tenders = await tenderService.listTenders();
  response.json(tenders);
}

async function createTender(request, response) {
  const { errors, value } = validateTenderInput(request.body);

  if (errors.length > 0) {
    throw new HttpError(400, 'Validation failed', errors);
  }

  const createdTender = await Tender.create(value);
  const tender = await tenderService.getTender(createdTender._id.toString(), false);
  response.status(201).json(tender);
}

async function getTender(request, response) {
  validateObjectId(request.params.id);

  const tender = await tenderService.getTender(request.params.id, true);
  if (!tender) {
    throw new HttpError(404, 'Tender not found.');
  }

  response.json(tender);
}

async function submitBid(request, response) {
  validateObjectId(request.params.id);

  const tender = await Tender.findById(request.params.id);
  if (!tender) {
    throw new HttpError(404, 'Tender not found.');
  }

  if (tender.status !== 'Open') {
    throw new HttpError(409, 'This tender is not accepting bids.');
  }

  const { errors, value } = validateBidInput(request.body);
  if (errors.length > 0) {
    throw new HttpError(400, 'Validation failed', errors);
  }

  const bid = await Bid.create({ tenderId: tender._id, ...value });
  const updatedTender = await tenderService.getTender(tender._id.toString(), false);

  response.status(201).json({
    message: 'Bid submitted successfully.',
    bid: tenderService.toBidResponse(bid),
    tender: updatedTender,
  });
}

module.exports = { createTender, getTender, listTenders, submitBid };
