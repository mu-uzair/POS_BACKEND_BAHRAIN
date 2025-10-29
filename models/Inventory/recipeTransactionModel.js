// models/Inventory/recipeTransactionModel.js
const mongoose = require('mongoose');

const recipeTransactionSchema = new mongoose.Schema({
   orderId: {
        type: String,  // Store as String, not ObjectId
        required: true,
        index: true
    },
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'DishRecipe', required: true },
  recipeName: { type: String, required: true }, // e.g. "Chicken - Small"
  dishId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish', required: true },
  variationName: { type: String },
  quantityOfDishes: { type: Number, required: true }, // how many dishes were deducted
  productsAdjusted: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      productName: String,
      qtyChanged: Number, // amount deducted from that product (positive number)
      unit: String,
    }
  ],
  type: { type: String, enum: ['out', 'in'], default: 'out' }, // mostly 'out'
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional
  createdAt: { type: Date, default: Date.now },
  rollbackOf: { type: mongoose.Schema.Types.ObjectId, ref: 'RecipeTransaction' } // if this record is a rollback reference
});

module.exports = mongoose.model('RecipeTransaction', recipeTransactionSchema);
