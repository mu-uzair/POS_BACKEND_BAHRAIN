const createHttpError = require("http-errors");
const Dishes = require("../models/dishesModel");
const mongoose = require("mongoose");

const addDish = async (req, res, next) => {
    try {
        const { dishName, dishPrice, category } = req.body;

        console.log("Request Body:", req.body);

        // Input validation
        if (!dishName || !dishPrice || !category) {
            const error = createHttpError(400, "Please provide Dish Name, Price, and Category!");
            return next(error);
        }

        if (isNaN(dishPrice)) {
            const error = createHttpError(400, "Dish Price must be a valid number!");
            return next(error);
        }

        if (!mongoose.Types.ObjectId.isValid(category)) {
            const error = createHttpError(400, "Invalid Category ID!");
            return next(error);
        }

        // Uniqueness check (case-insensitive)
        const isDishPresent = await Dishes.findOne({
            dishName: { $regex: new RegExp(`^${dishName}$`, "i") },
            category,
        });

        if (isDishPresent) {
            console.log("Dish already exists in this category!");
            const error = createHttpError(400, "Dish already exists in this category!");
            return next(error);
        }

        // Create and save the new dish
        const newDish = new Dishes({ dishName, dishPrice, category });
        await newDish.save();

        res.status(201).json({
            success: true,
            message: "Dish added!",
            data: newDish,
        });
    } catch (error) {
        console.error("Error adding dish:", error);
        return next(error);
    }
};



const getDishesByCategory = async (req, res, next) => {
        try {
            const { categoryId } = req.params; // Get categoryId from the route parameters
    
            // Validate categoryId
            if (!mongoose.Types.ObjectId.isValid(categoryId)) {
                const error = createHttpError(400, "Invalid Category ID!");
                return next(error);
            }
    
            // Fetch dishes for the specified category
            const dishes = await Dishes.find({ category: categoryId }); // Use Dishes, not Dish
    
            res.status(200).json({
                success: true,
                data: dishes,
            });
        } catch (error) {
            console.error("Error fetching dishes:", error);
            return next(error);
        }
    };

const getDishes = async (req, res, next) => {
    try {
        // Fetch all dishes (without filtering by category)
        const dishes = await Dishes.find();

        // If no dishes are found, return a 404 error
        if (!dishes || dishes.length === 0) {
            const error = createHttpError(404, "No dishes found!");
            return next(error);
        }

        res.status(200).json({
            success: true,
            data: dishes,
        });
    } catch (error) {
        console.error("Error fetching dishes:", error);
        return next(error);
    }
};

const updateDish = async (req, res, next) => {
    try {
        const { dishId } = req.params;
        const { dishName, dishPrice, category } = req.body;


        console.log("Request Body:", req.body);
        console.log("Dish ID:", dishId);

        // Validate dishId
        if (!mongoose.Types.ObjectId.isValid(dishId)) {
            const error = createHttpError(400, "Invalid Dish ID!");
            return next(error);
        }

        // Input validation (optional, you might want to allow partial updates)
        if (!dishName && !dishPrice && !category) {
            const error = createHttpError(400, "Please provide at least one field to update!");
            return next(error);
        }

        if (dishPrice && isNaN(dishPrice)) {
            const error = createHttpError(400, "Dish Price must be a valid number!");
            return next(error);
        }

        if (category && !mongoose.Types.ObjectId.isValid(category)) {
            const error = createHttpError(400, "Invalid Category ID!");
            return next(error);
        }

        // Find the dish to update
        const dishToUpdate = await Dishes.findById(dishId);
        if (!dishToUpdate) {
            const error = createHttpError(404, "Dish not found!");
            return next(error);
        }

        // Update dish properties
        if (dishName) {
            dishToUpdate.dishName = dishName;
        }
        if (dishPrice) {
            dishToUpdate.dishPrice = dishPrice;
        }
        if (category) {
            dishToUpdate.category = category;
        }

        // Save the updated dish
        await dishToUpdate.save();

        res.status(200).json({
            success: true,
            message: "Dish updated!",
            data: dishToUpdate,
        });
    } catch (error) {
        console.error("Error updating dish:", error);
        return next(error);
    }
};

const deleteDish = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate the category ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid id!");
            return next(error);
        }

        // Find and delete the category
        const Dish = await Dishes.findByIdAndDelete(id);

        // If category not found
        if (!Dish) {
            const error = createHttpError(404, "Dish not found!");
            return next(error);
        }

        // Success response
        res.status(200).json({ success: true, message: "Dish deleted successfully!" });
    } catch (error) {
        next(error);
    }
};
module.exports = { addDish, getDishes, getDishesByCategory, updateDish, deleteDish };