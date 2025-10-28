const DishRecipe = require('../../models/Inventory/dishRecipeModel'); // Your new model
const Product = require('../../models/Inventory/productModel'); // Your existing Inventory
const Dish = require('../../models/dishesModel'); // Assuming your Dish model is here
const createHttpError = require('http-errors');
const mongoose = require('mongoose');

// Helper to validate all ingredients' product IDs
const validateIngredients = async (ingredients) => {
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
        throw createHttpError(400, 'Recipe must contain at least one ingredient.');
    }

    // 1. Check for duplicate product IDs within the recipe list
    const productIds = ingredients.map(i => i.productId.toString());
    if (new Set(productIds).size !== productIds.length) {
        throw createHttpError(400, 'Duplicate inventory items found in the recipe list.');
    }

    // 2. Validate all product IDs against the Inventory
    const existingProducts = await Product.find({ _id: { $in: productIds } }).select('_id');
    if (existingProducts.length !== ingredients.length) {
        const foundIds = existingProducts.map(p => p._id.toString());
        const missingIds = productIds.filter(id => !foundIds.includes(id));
        throw createHttpError(404, `One or more ingredient products were not found in inventory: ${missingIds.join(', ')}`);
    }

    // 3. Validate quantityUsed
    for (const ingredient of ingredients) {
        if (typeof ingredient.quantityUsed !== 'number' || ingredient.quantityUsed <= 0) {
            throw createHttpError(400, 'All ingredient quantities must be positive numbers.');
        }
    }
};

// ---------------------------
// Add New Recipe (Create)
// ---------------------------
const addRecipe = async (req, res) => {
    try {
        const { dishId, variationName, ingredients } = req.body;

        // Basic validation
        if (!dishId || !variationName || !ingredients) {
            throw createHttpError(400, 'Dish ID, variation name, and ingredients are required.');
        }

        // Validate references (Dish exists)
        const dishExists = await Dish.findById(dishId);
        if (!dishExists) throw createHttpError(404, 'Referenced Dish not found.');

        // Validate ingredients and their product IDs
        await validateIngredients(ingredients);

        // Check for existing recipe to enforce uniqueness (using the index)
        const existingRecipe = await DishRecipe.findOne({ dishId, variationName });
        if (existingRecipe) {
            throw createHttpError(409, `Recipe already exists for this dish variation: ${variationName}`);
        }

        // Create the recipe
        const newRecipe = new DishRecipe({
            dishId,
            variationName,
            ingredients
        });

        await newRecipe.save();

        // Populate product details for the immediate response
        const populatedRecipe = await DishRecipe.findById(newRecipe._id)
            .populate('dishId', 'name')
            .populate({ path: 'ingredients.productId', select: 'name unit' });

        res.status(201).json({
            success: true,
            message: 'Dish recipe created successfully.',
            data: populatedRecipe,
        });
    } catch (error) {
        console.error('Error adding dish recipe:', error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Failed to add dish recipe.',
        });
    }
};

// ---------------------------
// Get All Recipes (Read for UI)
// ---------------------------
const getAllRecipes = async (req, res) => {
    try {
        const recipes = await DishRecipe.find()
            .populate('dishId', 'name category') // Assume dish name and category are useful
            .populate({ path: 'ingredients.productId', select: 'name unit' }) // Get inventory item name and unit
            .lean();

        res.status(200).json({ success: true, data: recipes });
    } catch (error) {
        console.error('Error fetching dish recipes:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dish recipes.' });
    }
};

// ---------------------------
// Get Single Recipe by ID (Read)
// ---------------------------
const getRecipeById = async (req, res) => {
    try {
        const { id } = req.params;

        const recipe = await DishRecipe.findById(id)
            .populate('dishId', 'name category')
            .populate({ path: 'ingredients.productId', select: 'name unit' })
            .lean();

        if (!recipe) throw createHttpError(404, 'Recipe not found.');

        res.status(200).json({ success: true, data: recipe });
    } catch (error) {
        console.error('Error fetching recipe:', error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Failed to fetch recipe.',
        });
    }
};

// ---------------------------
// Get Recipe by Dish and Variation (CRITICAL for Automation Service)
// NOTE: This endpoint is often best implemented as a direct database call
// within the `stockService`, but providing a public route for testing/API access is helpful.
// ---------------------------
const getRecipeByDishAndVariation = async (req, res) => {
    try {
        const { dishId, variationName } = req.params;

        if (!dishId || !variationName) {
            throw createHttpError(400, 'Dish ID and variation name are required.');
        }

        const recipe = await DishRecipe.findOne({ dishId, variationName })
            .populate({ path: 'ingredients.productId', select: 'name unit' })
            .lean();

        if (!recipe) throw createHttpError(404, `Recipe not found for dish ${dishId} and variation ${variationName}.`);

        res.status(200).json({ success: true, data: recipe });
    } catch (error) {
        console.error('Error fetching recipe for automation:', error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Failed to fetch recipe.',
        });
    }
};


// ---------------------------
// Update Recipe
// ---------------------------
const updateRecipe = async (req, res) => {
    try {
        const { id } = req.params;
        const { dishId, variationName, ingredients } = req.body;

        const recipe = await DishRecipe.findById(id);
        if (!recipe) throw createHttpError(404, 'Recipe not found.');

        // Re-validate ingredients if they are being updated
        if (ingredients) {
            await validateIngredients(ingredients);
        }

        // Check for uniqueness clash if dishId or variationName is changed
        if (dishId !== recipe.dishId.toString() || variationName !== recipe.variationName) {
            const clash = await DishRecipe.findOne({ dishId, variationName, _id: { $ne: id } });
            if (clash) {
                 throw createHttpError(409, `A recipe already exists for the new dish/variation combination: ${variationName}`);
            }
        }
        
        // Apply updates
        recipe.dishId = dishId || recipe.dishId;
        recipe.variationName = variationName || recipe.variationName;
        recipe.ingredients = ingredients || recipe.ingredients;

        await recipe.save();

        const updatedRecipe = await DishRecipe.findById(id)
            .populate('dishId', 'name')
            .populate({ path: 'ingredients.productId', select: 'name unit' });

        res.status(200).json({
            success: true,
            message: 'Dish recipe updated successfully.',
            data: updatedRecipe,
        });
    } catch (error) {
        console.error('Error updating dish recipe:', error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Failed to update dish recipe.',
        });
    }
};

// ---------------------------
// Delete Recipe
// ---------------------------
const deleteRecipe = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await DishRecipe.findByIdAndDelete(id);

        if (!result) throw createHttpError(404, 'Recipe not found.');

        res.status(200).json({
            success: true,
            message: 'Dish recipe deleted successfully.',
        });
    } catch (error) {
        console.error('Error deleting dish recipe:', error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Failed to delete dish recipe.',
        });
    }
};

module.exports = {
    addRecipe,
    getAllRecipes,
    getRecipeById,
    getRecipeByDishAndVariation,
    updateRecipe,
    deleteRecipe,
};
