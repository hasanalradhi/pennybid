const TENDER_STATUSES = new Set(['Open', 'Under Review', 'Closed']);

function validateTenderInput(body) {
  const errors = [];
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const quantity = Number(body.quantity);
  const deadline = typeof body.deadline === 'string' ? new Date(body.deadline) : null;

  if (title.length < 3 || title.length > 120) {
    errors.push('Title must be between 3 and 120 characters.');
  }

  if (description.length > 1000) {
    errors.push('Description must not exceed 1000 characters.');
  }

  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    errors.push('Quantity must be a positive integer.');
  }

  if (!deadline || Number.isNaN(deadline.getTime())) {
    errors.push('Deadline must be a valid date.');
  }

  if (body.status !== undefined && !TENDER_STATUSES.has(body.status)) {
    errors.push('Status must be Open, Under Review, or Closed.');
  }

  return {
    errors,
    value: {
      title,
      description,
      quantity,
      deadline: deadline && !Number.isNaN(deadline.getTime()) ? deadline : null,
      status: body.status || 'Open',
    },
  };
}

function validateBidInput(body) {
  const errors = [];
  const amount = Number(body.amount);
  const vendorName = typeof body.vendorName === 'string' ? body.vendorName.trim() : '';

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push('Amount must be a positive number.');
  }

  if (vendorName.length < 2 || vendorName.length > 100) {
    errors.push('Vendor name must be between 2 and 100 characters.');
  }

  return { errors, value: { amount, vendorName } };
}

module.exports = { validateBidInput, validateTenderInput };
