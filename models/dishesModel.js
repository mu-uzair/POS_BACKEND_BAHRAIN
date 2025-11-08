// updated this code to add the section field for kitchen,grill or null

const mongoose = require("mongoose");

// 1. Define the Schema for a single Dish Variation
const VariationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Variation name is required.'],
        trim: true
    },

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
            validator: function (v) {
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
