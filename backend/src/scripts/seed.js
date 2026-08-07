require('dotenv').config();

const { connectDatabase, disconnectDatabase } = require('../config/database');
const Bid = require('../models/Bid');
const Tender = require('../models/Tender');

async function seed() {
  await connectDatabase();

  const existingTenders = await Tender.countDocuments();
  if (existingTenders > 0) {
    console.log(`Seed skipped: database already contains ${existingTenders} tender(s).`);
    return;
  }

  const tenders = await Tender.insertMany([
    {
      title: '500 Corporate Laptops',
      description: 'Supply and delivery of business laptops for the operations team.',
      quantity: 500,
      deadline: new Date('2026-08-15T15:00:00.000Z'),
      status: 'Open',
    },
    {
      title: 'Office Furniture Supply',
      description: 'Desks and ergonomic chairs for the new office floor.',
      quantity: 80,
      deadline: new Date('2026-08-10T15:00:00.000Z'),
      status: 'Under Review',
    },
  ]);

  await Bid.insertMany([
    { tenderId: tenders[0]._id, vendorName: 'Gulf Systems', amount: 120000 },
    { tenderId: tenders[0]._id, vendorName: 'TechSource', amount: 123500 },
    { tenderId: tenders[0]._id, vendorName: 'Orbit IT', amount: 126000 },
    { tenderId: tenders[0]._id, vendorName: 'Vertex Digital', amount: 129500 },
    { tenderId: tenders[1]._id, vendorName: 'Modern Office', amount: 15000 },
    { tenderId: tenders[1]._id, vendorName: 'Workspace Co.', amount: 15750 },
  ]);

  console.log('Seed complete: 2 tenders and 6 bids created.');
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(disconnectDatabase);
