const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');

const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const tenderRoutes = require('./routes/tenderRoutes');

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:4200')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '100kb' }));

app.get('/', (request, response) => {
  response.json({ name: 'PennyBid API', status: 'ok', endpoints: '/api/tenders' });
});

app.get('/api/health', (request, response) => {
  response.json({
    status: mongoose.connection.readyState === 1 ? 'ok' : 'degraded',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/tenders', tenderRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
