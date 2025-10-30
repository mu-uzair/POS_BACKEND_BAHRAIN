// const mongoose = require("mongoose")

// const orderSchema = new mongoose.Schema({


//     orderId:{
//         orderId: { type: String, required: true},
//       },
//     customerDetails: {
//         name: { type: String, required: true},
//         phone: {type: String, required: true},
//         guests: {type: String},
//         orderType: {type:String, requried: true}

//     },
//     orderStatus: {
//         type: String,
//         required : true,
//     },
//     bills: {
//         total: {type: Number, required: true},
//         tax: {type: Number, required: true},
//         totalWithTax: {type: Number, required: true},
//         discountPercentage: Number,
//         discountAmount: Number
//     },
//     items: [],
//     table: { type: mongoose.Schema.Types.ObjectId, ref: "Table"},
//     paymentMethod: {type: String}
// },{timestamps: true})

// module.exports = mongoose.model("Order", orderSchema);


const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    // --- 1. CORE ORDER ID (Cleaned up) ---
    // Assuming 'orderId' is the human-readable identifier (e.g., "ORD-001")
    // Note: MongoDB automatically assigns the '_id' ObjectId primary key.
    orderNo: {
        type: String,
        required: true,

    },
    orderId: {
        type: String,
        required: true,
        unique: true // Ensure no two orders share the same display ID
    },

    // --- 2. CUSTOMER & ORDER TYPE DETAILS (Enhanced) ---
    customerDetails: {
        // These fields are snapshots taken at the time of the order
        name: { type: String }, 
        phone: { type: String }, // Snapshot of phone used (from lookup or manual entry)
        guests: { type: Number, default: 1 }, // Changed to Number as it represents a count
        orderType: {
            type: String,
            required: true,
        }
    },

    // --- 3. DELIVERY LOGISTICS (NEW FIELDS) ---
    // Foreign Key Reference to the assigned Delivery Boy
    deliveryBoyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryBoy',
        default: null, // Null for non-delivery orders
        // Required: false, but the business logic should enforce assignment for orderType: 'Delivery'
    },
    
    // Delivery Snapshot Data: Crucial for historical record, even if the Customer model is updated or archived later.
    deliveryAddress: {
        type: String,
        default: null // Will contain the final, editable address for this specific delivery
    },

    // --- 4. STATUS & BILLING ---
    orderStatus: {
        type: String,
        required: true,
    },
    
    bills: {
        total: { type: Number, required: true },
        tax: { type: Number, required: true },
        totalWithTax: { type: Number, required: true },
        discountPercentage: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 }
    },

    // --- 5. ASSOCIATED DATA ---
    items: [{    }],
    
    table: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Table",
    },
    paymentMethod: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
