const mongoose = require('mongoose');

const HttpError = require('../errors/HttpError');

function notFoundHandler(request, response) {
  response.status(404).json({ error: 'Route not found.' });
}

function errorHandler(error, request, response, next) {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return response.status(400).json({ error: 'Request body contains invalid JSON.' });
  }

  if (error instanceof HttpError) {
    const body = { error: error.message };
    if (error.details) {
      body.details = error.details;
    }
    return response.status(error.status).json(body);
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return response.status(400).json({
      error: 'Validation failed',
      details: Object.values(error.errors).map((validationError) => validationError.message),
    });
  }

  console.error(error);
  return response.status(500).json({ error: 'An unexpected server error occurred.' });
}

module.exports = { errorHandler, notFoundHandler };
