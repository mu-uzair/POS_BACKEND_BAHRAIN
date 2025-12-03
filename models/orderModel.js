// // const mongoose = require("mongoose")

// // const orderSchema = new mongoose.Schema({


// //     orderId:{
// //         orderId: { type: String, required: true},
// //       },
// //     customerDetails: {
// //         name: { type: String, required: true},
// //         phone: {type: String, required: true},
// //         guests: {type: String},
// //         orderType: {type:String, requried: true}

// //     },
// //     orderStatus: {
// //         type: String,
// //         required : true,
// //     },
// //     bills: {
// //         total: {type: Number, required: true},
// //         tax: {type: Number, required: true},
// //         totalWithTax: {type: Number, required: true},
// //         discountPercentage: Number,
// //         discountAmount: Number
// //     },
// //     items: [],
// //     table: { type: mongoose.Schema.Types.ObjectId, ref: "Table"},
// //     paymentMethod: {type: String}
// // },{timestamps: true})

// // module.exports = mongoose.model("Order", orderSchema);


// const mongoose = require("mongoose");

// const orderSchema = new mongoose.Schema({
    
//     // --- 1. CORE ORDER ID (Cleaned up) ---
//     // Assuming 'orderId' is the human-readable identifier (e.g., "ORD-001")
//     // Note: MongoDB automatically assigns the '_id' ObjectId primary key.
//     orderNo: {
//         type: String,
//         required: true,

//     },
//     orderId: {
//         type: String,
//         required: true,
//         unique: true // Ensure no two orders share the same display ID
//     },

//     // --- 2. CUSTOMER & ORDER TYPE DETAILS (Enhanced) ---
//     customerDetails: {
//         // These fields are snapshots taken at the time of the order
//         name: { type: String }, 
//         phone: { type: String }, // Snapshot of phone used (from lookup or manual entry)
//         guests: { type: Number, default: 1 }, // Changed to Number as it represents a count
//         orderType: {
//             type: String,
//             required: true,
//         }
//     },

//     comment: { type: String, default: "" , trim:true},

//     // --- 3. DELIVERY LOGISTICS (NEW FIELDS) ---
//     // Foreign Key Reference to the assigned Delivery Boy
//     deliveryBoyId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'DeliveryBoy',
//         default: null, // Null for non-delivery orders
//         // Required: false, but the business logic should enforce assignment for orderType: 'Delivery'
//     },
    
//     // Delivery Snapshot Data: Crucial for historical record, even if the Customer model is updated or archived later.
//     deliveryAddress: {
//         type: String,
//         default: null // Will contain the final, editable address for this specific delivery
//     },

//     // --- 4. STATUS & BILLING ---
//     orderStatus: {
//         type: String,
//         required: true,
//     },
    
//     bills: {
//         total: { type: Number, required: true },
//         tax: { type: Number, required: true },
//         totalWithTax: { type: Number, required: true },
//         discountPercentage: { type: Number, default: 0 },
//         discountAmount: { type: Number, default: 0 }
//     },

//     // --- 5. ASSOCIATED DATA ---
//     items: [{    }],
    
//     table: { 
//         type: mongoose.Schema.Types.ObjectId, 
//         ref: "Table",
//     },
//     paymentMethod: { type: String }
// }, { timestamps: true });

// // 🔹 Add this for faster queries by creation date
// orderSchema.index({ createdAt: -1 });

// module.exports = mongoose.model("Order", orderSchema);


// const mongoose = require("mongoose");

// const orderSchema = new mongoose.Schema({
    
//     orderNo: {
//         type: String,
//         required: true,
//     },
//     orderId: {
//         type: String,
//         required: true,
//         unique: true
//     },

//     customerDetails: {
//         name: { type: String }, 
//         phone: { type: String },
//         guests: { type: Number, default: 1 },
//         orderType: {
//             type: String,
//             required: true,
//         }
//     },

//     comment: { type: String, default: "" , trim:true},

//     deliveryBoyId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'DeliveryBoy',
//         default: null,
//     },
    
//     deliveryAddress: {
//         type: String,
//         default: null
//     },

//     orderStatus: {
//         type: String,
//         required: true,
//     },
    
//     bills: {
//         total: { type: Number, required: true },
//         tax: { type: Number, required: true },
//         totalWithTax: { type: Number, required: true },
//         discountPercentage: { type: Number, default: 0 },
//         discountAmount: { type: Number, default: 0 }
//     },

//     items: [{}],
    
//     table: { 
//         type: mongoose.Schema.Types.ObjectId, 
//         ref: "Table",
//     },
//     paymentMethod: { type: String }
// }, { timestamps: true });

// // ============================================
// // 🔥 CRITICAL PERFORMANCE INDEXES
// // ============================================

// // 1. Basic date sorting (most queries sort by createdAt)
// orderSchema.index({ createdAt: -1 });

// // 2. Status + Date (for filtering In Progress, Ready, Completed)
// orderSchema.index({ orderStatus: 1, createdAt: -1 });

// // 3. Order Type + Date (for filtering Dine-in, Delivery, Take Away)
// orderSchema.index({ 'customerDetails.orderType': 1, createdAt: -1 });

// // 4. Payment Method + Date (for payment filtering)
// orderSchema.index({ paymentMethod: 1, createdAt: -1 });

// // 5. Compound index for complex filters (Status + Order Type + Date)
// orderSchema.index({ 
//     orderStatus: 1, 
//     'customerDetails.orderType': 1, 
//     createdAt: -1 
// });

// // 6. Item names (for popular dishes aggregation)
// orderSchema.index({ 'items.name': 1 });

// // 7. Delivery boy queries (for delivery tracking)
// orderSchema.index({ deliveryBoyId: 1, orderStatus: 1 });

// // 8. Order lookup by orderId
// orderSchema.index({ orderId: 1 });

// module.exports = mongoose.model("Order", orderSchema);

const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    
    orderNo: {
        type: String,
        required: true,
    },
    orderId: {
        type: String,
        required: true,
        unique: true // ✅ Keep unique constraint, remove duplicate index below
    },

    customerDetails: {
        name: { type: String }, 
        phone: { type: String },
        guests: { type: Number, default: 1 },
        orderType: {
            type: String,
            required: true,
        }
    },

    comment: { type: String, default: "" , trim:true},

    deliveryBoyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryBoy',
        default: null,
    },
    
    deliveryAddress: {
        type: String,
        default: null
    },

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

    items: [{}],
    
    table: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Table",
    },
    paymentMethod: { type: String }
}, { timestamps: true });

// ============================================
// 🔥 PERFORMANCE INDEXES (NO DUPLICATES)
// ============================================

// 1. Basic date sorting (most queries sort by createdAt)
orderSchema.index({ createdAt: -1 });

// 2. Status + Date (for filtering In Progress, Ready, Completed)
orderSchema.index({ orderStatus: 1, createdAt: -1 });

// 3. Order Type + Date (for filtering Dine-in, Delivery, Take Away)
orderSchema.index({ 'customerDetails.orderType': 1, createdAt: -1 });

// 4. Payment Method + Date (for payment filtering)
orderSchema.index({ paymentMethod: 1, createdAt: -1 });

// 5. Compound index for complex filters (Status + Order Type + Date)
orderSchema.index({ 
    orderStatus: 1, 
    'customerDetails.orderType': 1, 
    createdAt: -1 
});

// 6. Item names (for popular dishes aggregation)
orderSchema.index({ 'items.name': 1 });

// 7. Delivery boy queries (for delivery tracking)
orderSchema.index({ deliveryBoyId: 1, orderStatus: 1 });

// ❌ REMOVED: orderSchema.index({ orderId: 1 }); 
// ✅ Already covered by unique: true in the schema

module.exports = mongoose.model("Order", orderSchema);