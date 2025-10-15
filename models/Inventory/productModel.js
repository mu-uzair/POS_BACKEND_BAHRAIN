const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  unit: {
    type: String,
    required: true,
    enum: ['pcs', 'kg', 'L'], // Restrict to specific units
  },
  quantity_in_stock: {
    type: Number,
    required: true,
    min: 0,
  },
  reorder_threshold: {
    type: Number,
    required: true,
    min: 0,
  },
  cost_per_unit: {
    type: Number,
    required: true,
    min: 0,
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);