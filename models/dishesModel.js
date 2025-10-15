const mongoose = require("mongoose");

const dishSchema = new mongoose.Schema({
    dishName: {
        type: String,
        required: true,
    },
   
    dishPrice: {
        type: Number,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId, // Reference to Category model
        ref: "Category", // Name of the Category model
        required: true,
    },
    
});

module.exports = mongoose.model("Dish", dishSchema);