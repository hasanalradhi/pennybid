const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema(
  {
    tenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tender',
      required: true,
      index: true,
    },
    vendorName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

bidSchema.index({ tenderId: 1, amount: 1 });

module.exports = mongoose.model('Bid', bidSchema);
