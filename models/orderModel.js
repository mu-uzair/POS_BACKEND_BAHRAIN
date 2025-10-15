const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({


    orderId:{
        orderId: { type: String, required: true},
      },
    customerDetails: {
        name: { type: String, required: true},
        phone: {type: String, required: true},
        guests: {type: String},
        orderType: {type:String, requried: true}

    },
    orderStatus: {
        type: String,
        required : true,
    },
    bills: {
        total: {type: Number, required: true},
        tax: {type: Number, required: true},
        totalWithTax: {type: Number, required: true},
        discountPercentage: Number,
        discountAmount: Number
    },
    items: [],
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table"},
    paymentMethod: {type: String}
},{timestamps: true})

module.exports = mongoose.model("Order", orderSchema);