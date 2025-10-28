const mongoose = require('mongoose');

// --- 1. Sub-Schema for a single ingredient in the recipe ---
const ingredientSchema = new mongoose.Schema({
    // productId: Links directly to the _id in your existing 'Product' model (Rice, Meat, etc.)
    productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
    },
    // quantityUsed: The exact amount of this product consumed for ONE serving of the dish.
    // The unit is inherited from the linked Product model (e.g., if Product is 'kg', this is 0.25)
    quantityUsed: { 
        type: Number, 
        required: true, 
        min: 0 
    }
}, { _id: false }); // Prevents Mongoose from creating an extra _id for each ingredient sub-document

// --- 2. Main DishRecipe Schema ---
const dishRecipeSchema = new mongoose.Schema({
    // dishId: Links to the main dish record (e.g., Biryani)
    dishId: { 
        type: mongoose.Schema.Types.ObjectId, 
        // NOTE: Replace 'Dish' with the actual model name for your dishes if it's different (e.g., 'MenuItem')
        ref: 'Dish', 
        required: true
    },
    // variationName: Corresponds to the dish variation (e.g., "1 Prs", "2 Prs")
    variationName: { 
        type: String, 
        required: true 
    },
    // ingredients: The array holding all the BOM components
    ingredients: { 
        type: [ingredientSchema], 
        required: true 
    }
}, { timestamps: true });

// --- 3. Index for Fast Lookup and Uniqueness ---
// This ensures you can quickly fetch a recipe based on the dish and its specific size (variation)
// It also prevents a manager from accidentally creating two recipes for the same dish/size combination.
dishRecipeSchema.index({ dishId: 1, variationName: 1 }, { unique: true });

module.exports = mongoose.model('DishRecipe', dishRecipeSchema);
