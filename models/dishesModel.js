// const mongoose = require("mongoose");

// const dishSchema = new mongoose.Schema({
//     dishName: {
//         type: String,
//         required: true,
//     },
   
//     dishPrice: {
//         type: Number,
//         required: true,
//     },
//     category: {
//         type: mongoose.Schema.Types.ObjectId, // Reference to Category model
//         ref: "Category", // Name of the Category model
//         required: true,
//     },
    
// });

// module.exports = mongoose.model("Dish", dishSchema);






// changing schema for variation in dishes size and price

// const mongoose = require("mongoose");

// // --- 1. Sub-Schema for Product Variations ---
// // This defines what a single size/portion option looks like (e.g., "Small" at "100")
// const variationSchema = new mongoose.Schema({
//     // Examples: "Small", "Medium", "1 Piece", "Full Plate"
//     name: {
//         type: String,
//         required: true,
//         trim: true,
//     },
    
//     // The specific price for this variation (e.g., 100, 200, 400)
//     // IMPORTANT: Store price in the smallest currency unit (e.g., cents or fils) 
//     // to avoid floating point errors.
//     price: {
//         type: Number,
//         required: true,
//         min: 0,
//     },
    
//     // Optional flag to set which variation is automatically selected in the POS
//     isDefault: {
//         type: Boolean,
//         default: false,
//     }
// }, { _id: false }); // Prevents Mongoose from creating an ID for every sub-document

// // --- 2. Main Dish Schema ---
// const dishSchema = new mongoose.Schema({
//     dishName: {
//         type: String,
//         required: true,
//         trim: true,
//     },
    
//     // 💡 NEW FIELD: Replaces the simple dishPrice field. 
//     // This array holds all the different sizes, portions, or plate options.
//     variations: {
//         type: [variationSchema],
//         required: true, 
//         // Validation: Ensures every dish entry has at least one variation (price)
//         validate: {
//             validator: function(v) {
//                 return v && v.length > 0;
//             },
//             message: 'A dish must have at least one defined variation (size/price).',
//         },
//     },
    
//     category: {
//         type: mongoose.Schema.Types.ObjectId, // Reference to Category model
//         ref: "Category", 
//         required: true,
//     },
    
//     // You can add other fields here (e.g., imageUrl, description)
    
// }, { timestamps: true });

// module.exports = mongoose.model("Dish", dishSchema);








// const mongoose = require("mongoose");

// // 1. Define the Schema for a single Dish Variation
// const VariationSchema = new mongoose.Schema({
//     name: { 
//         type: String, 
//         required: [true, 'Variation name is required.'],
//         trim: true
//     },
//     price: { 
//         type: Number, 
//         required: [true, 'Variation price is required.'],
//         min: [0, 'Price cannot be negative.'],
//         // Ensure price is an integer (fils/cents)
//         validate: {
//             validator: Number.isInteger,
//             message: 'Price must be an integer (smallest currency unit).'
//         }
//     }, 
//     isDefault: { 
//         type: Boolean, 
//         default: false 
//     }
// }, { _id: false }); // We set _id: false because these are embedded documents

// // 2. Define the main Dish Schema
// const DishSchema = new mongoose.Schema({
//     dishName: { 
//         type: String, 
//         required: true,
//         trim: true,
//         // The uniqueness check in your controller handles the scope (name + category)
//     },
//     category: { 
//         type: mongoose.Schema.Types.ObjectId, 
//         ref: 'Category', 
//         required: true 
//     },
//     // CRITICAL CHANGE: The variations array is now defined using the VariationSchema
//     variations: {
//         type: [VariationSchema], // This tells Mongoose to expect an array of VariationSchema objects
//         required: [true, 'A dish must have at least one variation.'],
//         validate: {
//             // Custom validator to enforce array is not empty
//             validator: function(v) {
//                 return v.length > 0;
//             },
//             message: 'A dish must have at least one variation.'
//         }
//     }
// }, { timestamps: true });

// // NOTE: Ensure the file where the model is defined uses 'Dishes' as the exported variable 
// // to match the import in your controller: const Dishes = require("../models/dishesModel");
// const Dishes = mongoose.model("Dish", DishSchema);
// module.exports = Dishes;


// updated this code to add the section field for kitchen,grill or null

const mongoose = require("mongoose");

// 1. Define the Schema for a single Dish Variation
const VariationSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Variation name is required.'],
        trim: true
    },
    // price: { 
    //     type: Number, 
    //     required: [true, 'Variation price is required.'],
    //     min: [0, 'Price cannot be negative.'],
    //     validate: {
    //         validator: Number.isInteger,
    //         message: 'Price must be an integer (smallest currency unit).'
    //     }
    // }, 
    price: {
    type: mongoose.Schema.Types.Decimal128,
    required: [true, 'Variation price is required.'],
    min: [0, 'Price cannot be negative.'],
    get: v => v ? parseFloat(v.toString()) : v, // Convert Decimal128 to float when reading
    set: v => mongoose.Types.Decimal128.fromString(parseFloat(v).toFixed(3)) // Force 3 decimals when saving
},

    isDefault: { 
        type: Boolean, 
        default: false 
    }
}, { _id: false });

// 2. Define the main Dish Schema
const DishSchema = new mongoose.Schema({
    dishName: { 
        type: String, 
        required: true,
        trim: true,
    },
    category: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Category', 
        required: true 
    },
    variations: {
        type: [VariationSchema],
        required: [true, 'A dish must have at least one variation.'],
        validate: {
            validator: function(v) {
                return v.length > 0;
            },
            message: 'A dish must have at least one variation.'
        }
    },

    // 🆕 Added field to determine where the dish belongs
    section: {
        type: String,
        enum: ["Kitchen", "Grill", null],
        default: null, // e.g., drinks, desserts, etc. go nowhere
    }

}, { timestamps: true });

// Export model
const Dishes = mongoose.model("Dish", DishSchema);
module.exports = Dishes;
