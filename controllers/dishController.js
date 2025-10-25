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
const { Decimal128 } = require("mongodb");
const createHttpError = require("http-errors");
const Dishes = require("../models/dishesModel");


const validateVariations = (variations) => {
    console.log("Validating variations:", variations);
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

        // ✅ Normalize price (handle Decimal128, string, or number)
        let price;
        if (v.price instanceof Decimal128) {
            price = parseFloat(v.price.toString());
        } else if (typeof v.price === "string") {
            price = parseFloat(v.price);
        } else {
            price = v.price;
        }

        if (typeof price !== "number" || isNaN(price) || price < 0) {
            return "All variation prices must be valid non-negative numbers.";
        }

        // ✅ Round to 3 decimals
        const rounded = Number(price.toFixed(3));
        if (Math.abs(price - rounded) > 1e-9) {
            return "All variation prices must have up to 3 decimal places.";
        }

        // ✅ Replace with rounded number for consistent saving
        v.price = rounded;
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
        // Convert all variation prices to Decimal128 with 3 decimals
        const formattedVariations = variations.map(v => ({
            ...v,
            price: mongoose.Types.Decimal128.fromString(parseFloat(v.price).toFixed(3))
        }));

     

        const newDish = new Dishes({
            dishName,
            variations: formattedVariations,
            category,
            section: section || null,
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



const getDishesByCategory = async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            const error = createHttpError(400, "Invalid Category ID!");
            return next(error);
        }

        // use .lean() so we get plain JS objects we can mutate safely
        const dishes = await Dishes.find({ category: categoryId }).lean();

        // mutate dishes in-place to convert Decimal128 price -> number with 3 decimals
        for (const dish of dishes) {
            if (Array.isArray(dish.variations)) {
                for (const v of dish.variations) {
                    // defensive checks
                    if (v && v.price != null) {
                        // convert Decimal128 -> string -> float -> round to 3 decimals -> number
                        const asNum = parseFloat(v.price.toString ? v.price.toString() : v.price);
                        v.price = parseFloat(asNum.toFixed(3));
                    } else {
                        // ensure price exists and is numeric (optional: set to 0 or null per your rules)
                        v.price = null;
                    }
                }
            }
        }

        // keep data: dishes to avoid breaking downstream consumers
        res.status(200).json({ success: true, data: dishes });
    } catch (error) {
        console.error("Error fetching dishes:", error);
        return next(error);
    }
};




const getDishes = async (req, res, next) => {
    try {
        const dishes = await Dishes.find().lean();

        if (!dishes || dishes.length === 0) {
            const error = createHttpError(404, "No dishes found!");
            return next(error);
        }

        // mutate dishes in-place to convert Decimal128 price -> number with 3 decimals
        for (const dish of dishes) {
            if (Array.isArray(dish.variations)) {
                for (const v of dish.variations) {
                    if (v && v.price != null) {
                        const asNum = parseFloat(v.price.toString ? v.price.toString() : v.price);
                        v.price = parseFloat(asNum.toFixed(3));
                    } else {
                        v.price = null;
                    }
                }
            }
        }

        // keep data: dishes unchanged (same reference), but contents are formatted
        res.status(200).json({ success: true, data: dishes });
    } catch (error) {
        console.error("Error fetching dishes:", error);
        return next(error);
    }
};





const updateDish = async (req, res, next) => {
    try {
        const { dishId } = req.params;
        const { dishName, variations, category, section } = req.body;

        console.log("Request Body:", req.body);

        // 1️⃣ Validate IDs
        if (!mongoose.Types.ObjectId.isValid(dishId)) {
            return next(createHttpError(400, "Invalid Dish ID!"));
        }

        if (category && !mongoose.Types.ObjectId.isValid(category)) {
            return next(createHttpError(400, "Invalid Category ID!"));
        }

        if (!dishName && !variations && !category && section === undefined) {
            return next(createHttpError(400, "Please provide at least one field to update!"));
        }

        // 2️⃣ Convert prices to Decimal128 before validation
        let formattedVariations = variations;
        if (Array.isArray(variations)) {
            formattedVariations = variations.map(v => {
                const priceFloat = parseFloat(v.price);
                if (isNaN(priceFloat) || priceFloat < 0) {
                    throw createHttpError(400, `Invalid price for variation: ${v.name || 'Unnamed Variation'}.`);
                }

                // Convert to Decimal128 for exact BHD precision
                const decimalPrice = mongoose.Types.Decimal128.fromString(priceFloat.toFixed(3));

                return {
                    ...v,
                    price: decimalPrice,
                };
            });

            // Reuse your validator (skip Number.isInteger now)
            const variationError = validateVariations(formattedVariations);
            if (variationError) {
                return next(createHttpError(400, variationError));
            }
        }

        // // 3️⃣ Validate section
        // const sectionError = validateSection(section);
        // if (sectionError) {
        //     return next(createHttpError(400, sectionError));
        // }

        // 4️⃣ Find and update dish
        const dishToUpdate = await Dishes.findById(dishId);
        if (!dishToUpdate) {
            return next(createHttpError(404, "Dish not found!"));
        }

        if (dishName) dishToUpdate.dishName = dishName;
        if (formattedVariations) dishToUpdate.variations = formattedVariations;
        if (category) dishToUpdate.category = category;
        if (section !== undefined) dishToUpdate.section = section || null;

        await dishToUpdate.save();

        // 5️⃣ Convert Decimal128 to float for response
        const safeDish = dishToUpdate.toObject();
        if (Array.isArray(safeDish.variations)) {
            for (const v of safeDish.variations) {
                if (v.price && v.price.toString) {
                    v.price = parseFloat(parseFloat(v.price.toString()).toFixed(3));
                }
            }
        }

        res.status(200).json({
            success: true,
            message: "Dish updated successfully!",
            data: safeDish,
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
