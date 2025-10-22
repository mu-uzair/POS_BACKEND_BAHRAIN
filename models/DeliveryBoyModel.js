// models/DeliveryBoyModel.js
const mongoose = require('mongoose');

const DeliveryBoySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    is_active: { type: Boolean, default: true },  
}, { timestamps: true });

module.exports = mongoose.model('DeliveryBoy', DeliveryBoySchema);