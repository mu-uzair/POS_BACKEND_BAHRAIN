// const DeliveryBoy = require('../models/DeliveryBoyModel');
// const mongoose = require("mongoose");
// const createHttpError = require("http-errors");

// // Helper to check for valid ID
// const isValidId = (id, entity) => {
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//         throw createHttpError(404, `Invalid ${entity} ID!`);
//     }
// };

// // GET: List all ACTIVE delivery boys
// const getDeliveryBoys = async (req, res, next) => {
//     try {
//         // Fetch only active boys for the frontend assignment dropdown
//         const boys = await DeliveryBoy.find({ is_active: true }).select('name phone is_active');
//         res.status(200).json({ success: true, data: boys });
//     } catch (error) {
//         next(error);
//     }
// };

// const addDeliveryBoy = async (req, res, next) => {
//     try {
//         const { name, phone } = req.body;
        
//         // 1. Basic validation
//         if (!name || !phone) {
//             throw createHttpError(400, "Name and phone number are required.");
//         }

//         // 2. Check for existing name (Optional: Check only if active)
//         const existingBoyByName = await DeliveryBoy.findOne({ name: name });
//         if (existingBoyByName) {
//             // Throw a specific error if a boy with the same name exists
//             return next(createHttpError(409, `A Delivery Boy named '${name}' already exists. Please use a unique name or confirm if this is a duplicate entry.`));
//         }

//         // 3. Create the new Delivery Boy
//         const newBoy = await DeliveryBoy.create(req.body);
        
//         res.status(201).json({ success: true, message: "Delivery Boy Added!", data: newBoy });
        
//     } catch (error) {
//         // Handle duplicate key error (unique phone constraint, code 11000)
//         if (error.code === 11000) { 
//             // This is triggered if the phone number already exists
//             error = createHttpError(409, "Phone number already registered.");
//         }
//         next(error);
//     }
// };

// // PATCH: Edit delivery boy details (Admin/Manager role required)
// const updateDeliveryBoy = async (req, res, next) => {
//     try {
//         const { id } = req.params;
//         isValidId(id, 'Delivery Boy');

//         const boy = await DeliveryBoy.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        
//         if (!boy) {
//             throw createHttpError(404, "Delivery Boy not found.");
//         }

//         res.status(200).json({ success: true, message: "Delivery Boy updated!", data: boy });
//     } catch (error) {
//         next(error);
//     }
// };



// // DELETE: Delete a delivery boy (Admin/Manager role required)
// const deleteDeliveryBoy = async (req, res, next) => {
//     try {
//         const { id } = req.params;
//         isValidId(id, 'Delivery Boy');

//         const boy = await DeliveryBoy.findByIdAndDelete(id);
        
//         if (!boy) {
//             throw createHttpError(404, "Delivery Boy not found.");
//         }
        
//         // NOTE: Consider adding logic here to unassign this boy from any active orders.

//         res.status(200).json({ success: true, message: "Delivery Boy deleted successfully." });
//     } catch (error) {
//         next(error);
//     }
// };

// module.exports = { getDeliveryBoys, addDeliveryBoy, updateDeliveryBoy, deleteDeliveryBoy };


const DeliveryBoy = require('../models/DeliveryBoyModel');
const mongoose = require("mongoose");
const createHttpError = require("http-errors");

// Helper to check for valid ID
const isValidId = (id, entity) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw createHttpError(404, `Invalid ${entity} ID!`);
    }
};

// GET: List all delivery boys (for admin panel - shows all)
// You can add a query param to filter by active status if needed
const getDeliveryBoys = async (req, res, next) => {
    try {
        const { active_only } = req.query;
        
        // If active_only=true is passed, filter for active boys only
        // Otherwise, return all boys (for admin/edit panel)
        const filter = active_only === 'true' ? { is_active: true } : {};
        
        const boys = await DeliveryBoy.find(filter).select('name phone vehicle_type vehicle_number is_active');
        
        res.status(200).json({ success: true, data: boys });
    } catch (error) {
        next(error);
    }
};

const addDeliveryBoy = async (req, res, next) => {
    try {
        const { name, phone } = req.body;
        
        // 1. Basic validation
        if (!name || !phone) {
            throw createHttpError(400, "Name and phone number are required.");
        }

        // 2. Check for existing name (Optional: Check only if active)
        const existingBoyByName = await DeliveryBoy.findOne({ name: name });
        if (existingBoyByName) {
            return next(createHttpError(409, `A Delivery Boy named '${name}' already exists. Please use a unique name or confirm if this is a duplicate entry.`));
        }

        // 3. Create the new Delivery Boy
        const newBoy = await DeliveryBoy.create(req.body);
        
        res.status(201).json({ success: true, message: "Delivery Boy Added!", data: newBoy });
        
    } catch (error) {
        // Handle duplicate key error (unique phone constraint, code 11000)
        if (error.code === 11000) { 
            error = createHttpError(409, "Phone number already registered.");
        }
        next(error);
    }
};

// PATCH: Edit delivery boy details (Admin/Manager role required)
const updateDeliveryBoy = async (req, res, next) => {
    try {
        const { id } = req.params;
        isValidId(id, 'Delivery Boy');

        // Find the existing delivery boy first
        const existingBoy = await DeliveryBoy.findById(id);
        
        if (!existingBoy) {
            throw createHttpError(404, "Delivery Boy not found.");
        }

        // Merge the existing data with the updates
        // This ensures fields that aren't being updated retain their values
        const updateData = {
            name: req.body.name !== undefined ? req.body.name : existingBoy.name,
            phone: req.body.phone !== undefined ? req.body.phone : existingBoy.phone,
            vehicle_type: req.body.vehicle_type !== undefined ? req.body.vehicle_type : existingBoy.vehicle_type,
            vehicle_number: req.body.vehicle_number !== undefined ? req.body.vehicle_number : existingBoy.vehicle_number,
            is_active: req.body.is_active !== undefined ? req.body.is_active : existingBoy.is_active,
        };

        // Update with the merged data
        const boy = await DeliveryBoy.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, message: "Delivery Boy updated!", data: boy });
    } catch (error) {
        // Handle duplicate errors
        if (error.code === 11000) {
            error = createHttpError(409, "Phone number already registered to another delivery boy.");
        }
        next(error);
    }
};

// DELETE: Delete a delivery boy (Admin/Manager role required)
const deleteDeliveryBoy = async (req, res, next) => {
    try {
        const { id } = req.params;
        isValidId(id, 'Delivery Boy');

        const boy = await DeliveryBoy.findByIdAndDelete(id);
        
        if (!boy) {
            throw createHttpError(404, "Delivery Boy not found.");
        }
        
        // NOTE: Consider adding logic here to unassign this boy from any active orders.

        res.status(200).json({ success: true, message: "Delivery Boy deleted successfully." });
    } catch (error) {
        next(error);
    }
};

module.exports = { getDeliveryBoys, addDeliveryBoy, updateDeliveryBoy, deleteDeliveryBoy };