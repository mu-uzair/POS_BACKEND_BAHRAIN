// const mongoose = require('mongoose');

// const productSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   unit: {
//     type: String,
//     required: true,
//     enum: ['pcs', 'kg', 'L'], // Restrict to specific units
//   },
//   quantity_in_stock: {
//     type: Number,
//     required: true,
//     min: 0,
//   },
//   reorder_threshold: {
//     type: Number,
//     required: true,
//     min: 0,
//   },
//   cost_per_unit: {
//     type: Number,
//     required: true,
//     min: 0,
//   },
//   vendor: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Vendor',
//     required: true,
//   },
// }, { timestamps: true });

// module.exports = mongoose.model('Product', productSchema);

// models/Product.js
// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },

  unit: {
    type: String,
    required: true,
    enum: ['pcs', 'kg', 'L', 'g', 'ml'],
  },

  quantity_in_stock: { type: Number, required: true, min: 0 },
  reorder_threshold: { type: Number, required: true, min: 0 },

  cost_per_unit: {
    type: mongoose.Decimal128,
    required: true,
    min: 0,
    get: (value) => parseFloat(value?.toString() || '0'), // for readable output in JSON
    set: (value) => mongoose.Types.Decimal128.fromString(parseFloat(value).toFixed(3)), // keep 3 decimals
  },

  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },

  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
  toJSON: { getters: true }, // ensure .get() runs when converting to JSON
  toObject: { getters: true },
});

productSchema.virtual('isLowStock').get(function () {
  return this.quantity_in_stock <= this.reorder_threshold;
});

module.exports = mongoose.model('Product', productSchema);

