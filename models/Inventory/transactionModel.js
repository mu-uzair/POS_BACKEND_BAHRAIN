const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  vendorName: {
    type: String,
    required: true, // Store the vendor's name at the time of transaction creation
  },
  type: {
    type: String,
    enum: ['in', 'out'],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
  },
  unitCost: {
    type: Number,
    required: false, // Optional field
  },
});

module.exports = mongoose.model('Transaction', transactionSchema);