const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');

const app = require('../src/app');
const Bid = require('../src/models/Bid');
const Tender = require('../src/models/Tender');
const tenderService = require('../src/services/tenderService');

const tenderId = '507f1f77bcf86cd799439011';
const originalMethods = {
  bidCreate: Bid.create,
  getTender: tenderService.getTender,
  listTenders: tenderService.listTenders,
  tenderCreate: Tender.create,
  tenderFindById: Tender.findById,
};

let baseUrl;
let server;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  Bid.create = originalMethods.bidCreate;
  Tender.create = originalMethods.tenderCreate;
  Tender.findById = originalMethods.tenderFindById;
  tenderService.getTender = originalMethods.getTender;
  tenderService.listTenders = originalMethods.listTenders;
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

async function request(path, options) {
  const response = await fetch(`${baseUrl}${path}`, options);
  return { response, body: await response.json() };
}

test('GET / identifies the API', async () => {
  const { response, body } = await request('/');

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    name: 'PennyBid API',
    status: 'ok',
    endpoints: '/api/tenders',
  });
});

test('GET /api/health reports database readiness', async () => {
  const { response, body } = await request('/api/health');

  assert.equal(response.status, 200);
  assert.match(body.status, /^(ok|degraded)$/);
  assert.match(body.database, /^(connected|disconnected)$/);
  assert.ok(!Number.isNaN(Date.parse(body.timestamp)));
});

test('unknown routes return a JSON 404 response', async () => {
  const { response, body } = await request('/api/missing');

  assert.equal(response.status, 404);
  assert.deepEqual(body, { error: 'Route not found.' });
});

test('malformed JSON returns a controlled 400 response', async () => {
  const { response, body } = await request('/api/tenders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  });

  assert.equal(response.status, 400);
  assert.deepEqual(body, { error: 'Request body contains invalid JSON.' });
});

test('POST /api/tenders validates request fields', async () => {
  const { response, body } = await request('/api/tenders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'x', quantity: 0, deadline: 'invalid' }),
  });

  assert.equal(response.status, 400);
  assert.equal(body.error, 'Validation failed');
  assert.equal(body.details.length, 3);
});

test('POST /api/tenders creates and returns an aggregated tender', async () => {
  const createdTender = { _id: { toString: () => tenderId } };
  const aggregatedTender = {
    id: tenderId,
    title: 'Office chairs',
    description: 'Ergonomic chairs',
    quantity: 80,
    deadline: '2026-09-01T12:00:00.000Z',
    status: 'Open',
    lowestBid: null,
    bidsCount: 0,
  };
  Tender.create = async () => createdTender;
  tenderService.getTender = async () => aggregatedTender;

  const { response, body } = await request('/api/tenders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Office chairs',
      description: 'Ergonomic chairs',
      quantity: 80,
      deadline: '2026-09-01T12:00:00.000Z',
    }),
  });

  assert.equal(response.status, 201);
  assert.deepEqual(body, aggregatedTender);
});

test('GET /api/tenders/:id rejects an invalid MongoDB id', async () => {
  const { response, body } = await request('/api/tenders/not-an-id');

  assert.equal(response.status, 400);
  assert.deepEqual(body, { error: 'Tender ID must be a valid MongoDB ObjectId.' });
});

test('POST /api/tenders/:id/bids prevents bidding on a closed tender', async () => {
  Tender.findById = async () => ({ _id: tenderId, status: 'Closed' });

  const { response, body } = await request(`/api/tenders/${tenderId}/bids`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ vendorName: 'Acme Supplies', amount: 25000 }),
  });

  assert.equal(response.status, 409);
  assert.deepEqual(body, { error: 'This tender is not accepting bids.' });
});

test('POST /api/tenders/:id/bids submits a valid bid', async () => {
  const submittedAt = new Date('2026-08-05T08:00:00.000Z');
  Tender.findById = async () => ({ _id: tenderId, status: 'Open' });
  Bid.create = async (value) => ({
    _id: { toString: () => '507f191e810c19729de860ea' },
    tenderId: { toString: () => tenderId },
    ...value,
    createdAt: submittedAt,
  });
  tenderService.getTender = async () => ({
    id: tenderId,
    status: 'Open',
    lowestBid: 24500,
    bidsCount: 1,
  });

  const { response, body } = await request(`/api/tenders/${tenderId}/bids`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ vendorName: 'Acme Supplies', amount: 24500 }),
  });

  assert.equal(response.status, 201);
  assert.equal(body.message, 'Bid submitted successfully.');
  assert.equal(body.bid.vendorName, 'Acme Supplies');
  assert.equal(body.bid.amount, 24500);
  assert.equal(body.tender.bidsCount, 1);
});
