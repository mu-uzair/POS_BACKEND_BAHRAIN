const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    contact: {
      type: String,
      trim: true,
      required: false, // Explicitly optional
    },
    address: {
      type: String,
      trim: true,
      required: false, // Explicitly optional
    },
    notes: {
      type: String,
      trim: true,
      required: false, // Explicitly optional
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Vendor', vendorSchema);