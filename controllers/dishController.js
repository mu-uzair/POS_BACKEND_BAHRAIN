// const createHttpError = require("http-errors");
// const Dishes = require("../models/dishesModel");
// const mongoose = require("mongoose");

// const addDish = async (req, res, next) => {
//     try {
//         const { dishName, dishPrice, category } = req.body;

//         console.log("Request Body:", req.body);

//         // Input validation
//         if (!dishName || !dishPrice || !category) {
//             const error = createHttpError(400, "Please provide Dish Name, Price, and Category!");
//             return next(error);
//         }

//         if (isNaN(dishPrice)) {
//             const error = createHttpError(400, "Dish Price must be a valid number!");
//             return next(error);
//         }

//         if (!mongoose.Types.ObjectId.isValid(category)) {
//             const error = createHttpError(400, "Invalid Category ID!");
//             return next(error);
//         }

//         // Uniqueness check (case-insensitive)
//         const isDishPresent = await Dishes.findOne({
//             dishName: { $regex: new RegExp(`^${dishName}$`, "i") },
//             category,
//         });

//         if (isDishPresent) {
//             console.log("Dish already exists in this category!");
//             const error = createHttpError(400, "Dish already exists in this category!");
//             return next(error);
//         }

//         // Create and save the new dish
//         const newDish = new Dishes({ dishName, dishPrice, category });
//         await newDish.save();

//         res.status(201).json({
//             success: true,
//             message: "Dish added!",
//             data: newDish,
//         });
//     } catch (error) {
//         console.error("Error adding dish:", error);
//         return next(error);
//     }
// };



// const getDishesByCategory = async (req, res, next) => {
//         try {
//             const { categoryId } = req.params; // Get categoryId from the route parameters
    
//             // Validate categoryId
//             if (!mongoose.Types.ObjectId.isValid(categoryId)) {
//                 const error = createHttpError(400, "Invalid Category ID!");
//                 return next(error);
//             }
    
//             // Fetch dishes for the specified category
//             const dishes = await Dishes.find({ category: categoryId }); // Use Dishes, not Dish
    
//             res.status(200).json({
//                 success: true,
//                 data: dishes,
//             });
//         } catch (error) {
//             console.error("Error fetching dishes:", error);
//             return next(error);
//         }
//     };

// const getDishes = async (req, res, next) => {
//     try {
//         // Fetch all dishes (without filtering by category)
//         const dishes = await Dishes.find();

//         // If no dishes are found, return a 404 error
//         if (!dishes || dishes.length === 0) {
//             const error = createHttpError(404, "No dishes found!");
//             return next(error);
//         }

//         res.status(200).json({
//             success: true,
//             data: dishes,
//         });
//     } catch (error) {
//         console.error("Error fetching dishes:", error);
//         return next(error);
//     }
// };

// const updateDish = async (req, res, next) => {
//     try {
//         const { dishId } = req.params;
//         const { dishName, dishPrice, category } = req.body;


//         console.log("Request Body:", req.body);
//         console.log("Dish ID:", dishId);

//         // Validate dishId
//         if (!mongoose.Types.ObjectId.isValid(dishId)) {
//             const error = createHttpError(400, "Invalid Dish ID!");
//             return next(error);
//         }

//         // Input validation (optional, you might want to allow partial updates)
//         if (!dishName && !dishPrice && !category) {
//             const error = createHttpError(400, "Please provide at least one field to update!");
//             return next(error);
//         }

//         if (dishPrice && isNaN(dishPrice)) {
//             const error = createHttpError(400, "Dish Price must be a valid number!");
//             return next(error);
//         }

//         if (category && !mongoose.Types.ObjectId.isValid(category)) {
//             const error = createHttpError(400, "Invalid Category ID!");
//             return next(error);
//         }

//         // Find the dish to update
//         const dishToUpdate = await Dishes.findById(dishId);
//         if (!dishToUpdate) {
//             const error = createHttpError(404, "Dish not found!");
//             return next(error);
//         }

//         // Update dish properties
//         if (dishName) {
//             dishToUpdate.dishName = dishName;
//         }
//         if (dishPrice) {
//             dishToUpdate.dishPrice = dishPrice;
//         }
//         if (category) {
//             dishToUpdate.category = category;
//         }

//         // Save the updated dish
//         await dishToUpdate.save();

//         res.status(200).json({
//             success: true,
//             message: "Dish updated!",
//             data: dishToUpdate,
//         });
//     } catch (error) {
//         console.error("Error updating dish:", error);
//         return next(error);
//     }
// };

// const deleteDish = async (req, res, next) => {
//     try {
//         const { id } = req.params;

//         // Validate the category ID
//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             const error = createHttpError(404, "Invalid id!");
//             return next(error);
//         }

//         // Find and delete the category
//         const Dish = await Dishes.findByIdAndDelete(id);

//         // If category not found
//         if (!Dish) {
//             const error = createHttpError(404, "Dish not found!");
//             return next(error);
//         }

//         // Success response
//         res.status(200).json({ success: true, message: "Dish deleted successfully!" });
//     } catch (error) {
//         next(error);
//     }
// };
// module.exports = { addDish, getDishes, getDishesByCategory, updateDish, deleteDish };


// #################           Major Changes Made Below          #####################

// changing controller for variation in dishes size and price

// const createHttpError = require("http-errors");
// const Dishes = require("../models/dishesModel"); // Assumes your model is exported as Dishes
// const mongoose = require("mongoose");

// // Helper function to check for valid variations array
// const validateVariations = (variations) => {
//     if (!Array.isArray(variations) || variations.length === 0) {
//         return "Variations must be a non-empty array.";
//     }
    
//     for (const v of variations) {
//         if (!v.name || typeof v.name !== 'string' || v.name.trim() === '') {
//             return "All variations must have a name.";
//         }
//         if (typeof v.price !== 'number' || v.price < 0 || isNaN(v.price)) {
//             return "All variation prices must be a valid non-negative number.";
//         }
//     }
//     return null; // Return null if validation passes
// }

// // ----------------------------------------------------
// // ADD DISH CONTROLLER
// // Handles the new 'variations' array from the request body
// // ----------------------------------------------------
// const addDish = async (req, res, next) => {
//     try {
//         // 💡 CHANGE: dishPrice is replaced by the variations array
//         const { dishName, variations, category } = req.body;

//         console.log("Request Body:", req.body);

//         // 1. Input validation
//         if (!dishName || !category) {
//             const error = createHttpError(400, "Please provide Dish Name and Category!");
//             return next(error);
//         }

//         if (!mongoose.Types.ObjectId.isValid(category)) {
//             const error = createHttpError(400, "Invalid Category ID!");
//             return next(error);
//         }

//         // 💡 NEW VALIDATION: Check the variations array
//         const variationError = validateVariations(variations);
//         if (variationError) {
//             const error = createHttpError(400, variationError);
//             return next(error);
//         }

//         // 2. Uniqueness check (case-insensitive)
//         const isDishPresent = await Dishes.findOne({
//             dishName: { $regex: new RegExp(`^${dishName}$`, "i") },
//             category,
//         });

//         if (isDishPresent) {
//             console.log("Dish already exists in this category!");
//             const error = createHttpError(400, "Dish already exists in this category!");
//             return next(error);
//         }

//         // 3. Create and save the new dish (using the new model structure)
//         // Note: The frontend must ensure 'variations' are already in fils/cents.
//         const newDish = new Dishes({ dishName, variations, category });
//         await newDish.save();

//         res.status(201).json({
//             success: true,
//             message: "Dish added!",
//             data: newDish,
//         });
//     } catch (error) {
//         console.error("Error adding dish:", error);
//         // Mongoose validation errors (like requiring at least one variation) will be caught here
//         return next(error);
//     }
// };


// // Helper function to check for valid variations array
// const validateVariations = (variations) => {
//     if (!Array.isArray(variations) || variations.length === 0) {
//         return "Variations must be a non-empty array.";
//     }
    
//     // Check for exactly one default variation (good practice)
//     const defaultCount = variations.filter(v => v.isDefault).length;
//     if (defaultCount === 0) {
//          return "You must set exactly one variation as the default price.";
//     }
//     if (defaultCount > 1) {
//          return "Only one variation can be set as the default price.";
//     }
    
//     for (const v of variations) {
//         if (!v.name || typeof v.name !== 'string' || v.name.trim() === '') {
//             return "All variations must have a name.";
//         }
//         // Added check for integer price (Mongoose will fail on non-integer otherwise)
//         if (typeof v.price !== 'number' || v.price < 0 || isNaN(v.price) || !Number.isInteger(v.price)) {
//             return "All variation prices must be a valid non-negative integer number (in smallest currency unit).";
//         }
//     }
//     return null; // Return null if validation passes
// }

// // ----------------------------------------------------
// // ADD DISH CONTROLLER
// // ----------------------------------------------------
// const addDish = async (req, res, next) => {
//     try {
//         const { dishName, variations, category } = req.body;

//         console.log("Request Body:", req.body);

//         // 1. Input validation
//         if (!dishName || !category) {
//             const errorMessage = "Please provide Dish Name and Category!";
//             console.warn("400 Error Triggered:", errorMessage); // NEW LOGGING
//             const error = createHttpError(400, errorMessage);
//             return next(error);
//         }

//         if (!mongoose.Types.ObjectId.isValid(category)) {
//             const errorMessage = "Invalid Category ID!";
//             console.warn("400 Error Triggered:", errorMessage); // NEW LOGGING
//             const error = createHttpError(400, errorMessage);
//             return next(error);
//         }

//         // 2. Custom Variations Validation
//         const variationError = validateVariations(variations);
//         if (variationError) {
//             console.warn("400 Error Triggered (Validation):", variationError); // NEW LOGGING
//             const error = createHttpError(400, variationError);
//             return next(error);
//         }

//         // 3. Uniqueness check (case-insensitive)
//         const isDishPresent = await Dishes.findOne({
//             dishName: { $regex: new RegExp(`^${dishName}$`, "i") },
//             category,
//         });

//         if (isDishPresent) {
//             const errorMessage = "Dish already exists in this category!";
//             console.warn("400 Error Triggered (Uniqueness):", errorMessage); // NEW LOGGING
//             const error = createHttpError(400, errorMessage);
//             return next(error);
//         }

//         // 4. Create and save the new dish
//         const newDish = new Dishes({ dishName, variations, category });
//         await newDish.save();

//         res.status(201).json({
//             success: true,
//             message: "Dish added!",
//             data: newDish,
//         });
//     } catch (error) {
//         // This catches Mongoose errors (e.g., failed to connect, unexpected field types)
//         console.error("Critical Error adding dish:", error); // Use a strong log for critical failures
//         // Pass the error to the global handler
//         return next(error);
//     }
// };





// // ----------------------------------------------------
// // GET DISHES BY CATEGORY CONTROLLER (Minimal changes needed)
// // ----------------------------------------------------
// const getDishesByCategory = async (req, res, next) => {
//     try {
//         const { categoryId } = req.params; 

//         if (!mongoose.Types.ObjectId.isValid(categoryId)) {
//             const error = createHttpError(400, "Invalid Category ID!");
//             return next(error);
//         }

//         // The query remains the same, as the field name 'category' didn't change.
//         const dishes = await Dishes.find({ category: categoryId }); 

//         res.status(200).json({
//             success: true,
//             data: dishes,
//         });
//     } catch (error) {
//         console.error("Error fetching dishes:", error);
//         return next(error);
//     }
// };

// // ----------------------------------------------------
// // GET ALL DISHES CONTROLLER (No functional changes needed)
// // ----------------------------------------------------
// const getDishes = async (req, res, next) => {
//     try {
//         const dishes = await Dishes.find();

//         if (!dishes || dishes.length === 0) {
//             const error = createHttpError(404, "No dishes found!");
//             return next(error);
//         }

//         res.status(200).json({
//             success: true,
//             data: dishes,
//         });
//     } catch (error) {
//         console.error("Error fetching dishes:", error);
//         return next(error);
//     }
// };

// // ----------------------------------------------------
// // UPDATE DISH CONTROLLER
// // Must be updated to handle the 'variations' array instead of dishPrice
// // ----------------------------------------------------
// const updateDish = async (req, res, next) => {
//     try {
//         const { dishId } = req.params;
//         // 💡 CHANGE: dishPrice is replaced by the variations array
//         const { dishName, variations, category } = req.body; 

//         console.log("Request Body:", req.body);

//         if (!mongoose.Types.ObjectId.isValid(dishId)) {
//             const error = createHttpError(400, "Invalid Dish ID!");
//             return next(error);
//         }

//         // Check if at least one field is provided for update
//         if (!dishName && !variations && !category) {
//             const error = createHttpError(400, "Please provide at least one field to update!");
//             return next(error);
//         }

//         if (category && !mongoose.Types.ObjectId.isValid(category)) {
//             const error = createHttpError(400, "Invalid Category ID!");
//             return next(error);
//         }
        
//         // 💡 NEW VALIDATION: Check variations if they are part of the update request
//         if (variations) {
//             const variationError = validateVariations(variations);
//             if (variationError) {
//                 const error = createHttpError(400, variationError);
//                 return next(error);
//             }
//         }

//         const dishToUpdate = await Dishes.findById(dishId);
//         if (!dishToUpdate) {
//             const error = createHttpError(404, "Dish not found!");
//             return next(error);
//         }

//         // Update dish properties
//         if (dishName) {
//             dishToUpdate.dishName = dishName;
//         }
        
//         // 💡 CRITICAL CHANGE: Update the entire variations array if provided
//         if (variations) {
//             dishToUpdate.variations = variations;
//         }
        
//         if (category) {
//             dishToUpdate.category = category;
//         }

//         // Save the updated dish
//         await dishToUpdate.save();

//         res.status(200).json({
//             success: true,
//             message: "Dish updated!",
//             data: dishToUpdate,
//         });
//     } catch (error) {
//         console.error("Error updating dish:", error);
//         return next(error);
//     }
// };

// // ----------------------------------------------------
// // DELETE DISH CONTROLLER (No functional changes needed)
// // ----------------------------------------------------
// const deleteDish = async (req, res, next) => {
//     try {
//         const { id } = req.params;

//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             const error = createHttpError(404, "Invalid id!");
//             return next(error);
//         }

//         const Dish = await Dishes.findByIdAndDelete(id);

//         if (!Dish) {
//             const error = createHttpError(404, "Dish not found!");
//             return next(error);
//         }

//         res.status(200).json({ success: true, message: "Dish deleted successfully!" });
//     } catch (error) {
//         next(error);
//     }
// };

// module.exports = { addDish, getDishes, getDishesByCategory, updateDish, deleteDish };



//  update models/dishesModel.js to add section field for kitchen, grill or null

const mongoose = require("mongoose");
const createHttpError = require("http-errors");
const Dishes = require("../models/dishesModel");

// ----------------------------------------------------
// Helper function to check for valid variations array
// ----------------------------------------------------
const validateVariations = (variations) => {
    if (!Array.isArray(variations) || variations.length === 0) {
        return "Variations must be a non-empty array.";
    }

    const defaultCount = variations.filter(v => v.isDefault).length;
    if (defaultCount === 0) {
        return "You must set exactly one variation as the default price.";
    }
    if (defaultCount > 1) {
        return "Only one variation can be set as the default price.";
    }

    for (const v of variations) {
        if (!v.name || typeof v.name !== 'string' || v.name.trim() === '') {
            return "All variations must have a name.";
        }
        if (typeof v.price !== 'number' || v.price < 0 || isNaN(v.price) || !Number.isInteger(v.price)) {
            return "All variation prices must be valid non-negative integers (in smallest currency unit).";
        }
    }
    return null;
};

// ----------------------------------------------------
// Helper function to validate section
// ----------------------------------------------------
const validateSection = (section) => {
    const allowedSections = ["Kitchen", "Grill", null];
    if (section === undefined) return null; // optional
    if (!allowedSections.includes(section)) {
        return "Invalid section! Must be 'Kitchen', 'Grill', or null.";
    }
    return null;
};

// ----------------------------------------------------
// ADD DISH CONTROLLER
// ----------------------------------------------------
const addDish = async (req, res, next) => {
    try {
        const { dishName, variations, category, section } = req.body;

        console.log("Request Body:", req.body);

        // 1️⃣ Validate inputs
        if (!dishName || !category) {
            const error = createHttpError(400, "Please provide Dish Name and Category!");
            return next(error);
        }

        if (!mongoose.Types.ObjectId.isValid(category)) {
            const error = createHttpError(400, "Invalid Category ID!");
            return next(error);
        }

        const variationError = validateVariations(variations);
        if (variationError) {
            const error = createHttpError(400, variationError);
            return next(error);
        }

        const sectionError = validateSection(section);
        if (sectionError) {
            const error = createHttpError(400, sectionError);
            return next(error);
        }

        // 2️⃣ Uniqueness check (dish name + category)
        const isDishPresent = await Dishes.findOne({
            dishName: { $regex: new RegExp(`^${dishName}$`, "i") },
            category,
        });

        if (isDishPresent) {
            const error = createHttpError(400, "Dish already exists in this category!");
            return next(error);
        }

        // 3️⃣ Create and save
        const newDish = new Dishes({
            dishName,
            variations,
            category,
            section: section || null, // optional
        });

        await newDish.save();

        res.status(201).json({
            success: true,
            message: "Dish added successfully!",
            data: newDish,
        });

    } catch (error) {
        console.error("❌ Error adding dish:", error);
        return next(error);
    }
};

// ----------------------------------------------------
// GET DISHES BY CATEGORY
// ----------------------------------------------------
const getDishesByCategory = async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            const error = createHttpError(400, "Invalid Category ID!");
            return next(error);
        }

        const dishes = await Dishes.find({ category: categoryId });
        res.status(200).json({ success: true, data: dishes });
    } catch (error) {
        console.error("Error fetching dishes:", error);
        return next(error);
    }
};

// ----------------------------------------------------
// GET ALL DISHES
// ----------------------------------------------------
const getDishes = async (req, res, next) => {
    try {
        const dishes = await Dishes.find();
        if (!dishes || dishes.length === 0) {
            const error = createHttpError(404, "No dishes found!");
            return next(error);
        }

        res.status(200).json({ success: true, data: dishes });
    } catch (error) {
        console.error("Error fetching dishes:", error);
        return next(error);
    }
};

// ----------------------------------------------------
// UPDATE DISH CONTROLLER
// ----------------------------------------------------
const updateDish = async (req, res, next) => {
    try {
        const { dishId } = req.params;
        const { dishName, variations, category, section } = req.body;

        console.log("Request Body:", req.body);

        if (!mongoose.Types.ObjectId.isValid(dishId)) {
            const error = createHttpError(400, "Invalid Dish ID!");
            return next(error);
        }

        if (!dishName && !variations && !category && section === undefined) {
            const error = createHttpError(400, "Please provide at least one field to update!");
            return next(error);
        }

        if (category && !mongoose.Types.ObjectId.isValid(category)) {
            const error = createHttpError(400, "Invalid Category ID!");
            return next(error);
        }

        if (variations) {
            const variationError = validateVariations(variations);
            if (variationError) {
                const error = createHttpError(400, variationError);
                return next(error);
            }
        }

        const sectionError = validateSection(section);
        if (sectionError) {
            const error = createHttpError(400, sectionError);
            return next(error);
        }

        const dishToUpdate = await Dishes.findById(dishId);
        if (!dishToUpdate) {
            const error = createHttpError(404, "Dish not found!");
            return next(error);
        }

        if (dishName) dishToUpdate.dishName = dishName;
        if (variations) dishToUpdate.variations = variations;
        if (category) dishToUpdate.category = category;
        if (section !== undefined) dishToUpdate.section = section || null;

        await dishToUpdate.save();

        res.status(200).json({
            success: true,
            message: "Dish updated successfully!",
            data: dishToUpdate,
        });
    } catch (error) {
        console.error("Error updating dish:", error);
        return next(error);
    }
};

// ----------------------------------------------------
// DELETE DISH CONTROLLER
// ----------------------------------------------------
const deleteDish = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid id!");
            return next(error);
        }

        const Dish = await Dishes.findByIdAndDelete(id);
        if (!Dish) {
            const error = createHttpError(404, "Dish not found!");
            return next(error);
        }

        res.status(200).json({ success: true, message: "Dish deleted successfully!" });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    addDish,
    getDishes,
    getDishesByCategory,
    updateDish,
    deleteDish,
};
