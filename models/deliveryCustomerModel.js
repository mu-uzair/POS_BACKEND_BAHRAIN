// models/DeliveryCustomerModel.js
const mongoose = require('mongoose');

const deliveryCustomerSchema = new mongoose.Schema({
    phone_number: { type: String, required: true, unique: true, index: true }, // Key for fast lookup
    name: { type: String, default: "" , required: false },
    address: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model('Customer', deliveryCustomerSchema);