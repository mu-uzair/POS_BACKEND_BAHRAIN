const createHttpError = require("http-errors");
const Table = require("../models/tableModel")
const mongoose = require("mongoose")

const addTable = async (req, res, next) => {

    try {
        
        const { tableNo, seats } = req.body;

        if(!tableNo){
            return next(createHttpError(400, "Please provide table No!"));
        }

        const isTablePresent = await Table.findOne({tableNo});

        if(isTablePresent){
            return next(createHttpError(400, "Table already exists!"));
        }

        const newTable = new Table({tableNo, seats});
        await newTable.save();

        res.status(201).json({success: true, message: "Table added!",
             data: newTable });

    } catch (error) {
        next(error)
        
    }

}

const getTable = async (req,res,next) => {

    try {
        
        const tables = await Table.find().populate({
            path: "currentOrder",
            select: "customerDetails"
        });
        res.status(200).json({success: true, data: tables});


    } catch (error) {
        next(error)
    }

}

const updateTable = async (req, res, next) => {
   
    try {

        const { status, orderId } = req.body;

 const {id} = req.params


        if(!mongoose.Types.ObjectId.isValid(id)){
            const error = createHttpError(404, "Invalid id!");
            return next(error);
        }

        const table = await Table.findByIdAndUpdate(
            id,
            {status, currentOrder: orderId},
            {new: true}
        );

        if(!table){
            return next(createHttpError(404, "Table not found!"));
        }

        res.status(200).json({success: true, message: "table updated bug!",data: table});

    } catch (error) {
        next(error)
        
    }
    
};



const updateTableData = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // 👉 Check what is coming from frontend
        console.log("Received updates from frontend:", updates);

        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(400, "Invalid table ID!"));
        }

        // Allowed fields - Added 'status'
        const allowedUpdates = ['tableNo', 'seats', 'status']; // Note: I used 'tableNo' to match your data structure

        // Check for invalid fields
        const invalidFields = Object.keys(updates).filter(
            (key) => !allowedUpdates.includes(key)
        );

        if (invalidFields.length > 0) {
            return next(
                createHttpError(400, `Invalid fields: ${invalidFields.join(", ")}`)
            );
        }

        // Prepare sanitized updates
        const sanitizedUpdates = {};
        const validStatuses = ['Available', 'Booked'];

        // Handle tableNo if provided (assuming frontend sends 'tableNo' to match DB, not 'tableNumber')
        if (updates.tableNo !== undefined) {
            const tableNo = Number(updates.tableNo);
            console.log("Parsed tableNo:", tableNo); // Debugging value
            if (isNaN(tableNo) || tableNo <= 0) {
                return next(createHttpError(400, "Table number must be a valid positive number!"));
            }
            sanitizedUpdates.tableNo = tableNo;
        }

        // Handle seats if provided
        if (updates.seats !== undefined) {
            const seats = Number(updates.seats);
            console.log("Parsed seats:", seats); // Debugging value
            if (isNaN(seats) || seats <= 0) {
                return next(createHttpError(400, "Seats must be a valid positive number!"));
            }
            sanitizedUpdates.seats = seats;
        }

        // 🟢 NEW: Handle status if provided and validate its value
        if (updates.status !== undefined) {
            const status = updates.status;
            console.log("Received status:", status);

            if (!validStatuses.includes(status)) {
                return next(createHttpError(400, "Invalid status value. Status must be 'Available' or 'Booked'."));
            }
            sanitizedUpdates.status = status;
        }

        // Check if there are any updates to apply
        if (Object.keys(sanitizedUpdates).length === 0) {
            return res.status(200).json({
                success: false,
                message: "No valid fields provided for update.",
                data: null,
            });
        }
        
        // 👉 Check final sanitized updates before sending to DB
        console.log("Final sanitized updates to apply:", sanitizedUpdates);

        // Update the table
        const table = await Table.findByIdAndUpdate(id, sanitizedUpdates, { new: true });

        if (!table) {
            return next(createHttpError(404, "Table not found!"));
        }

        res.status(200).json({
            success: true,
            message: "Table updated!",
            data: table,
        });
    } catch (error) {
        console.error("Error updating table:", error);
        return next(error);
    }
};



const deleteTable = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate the table ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid id!");
            return next(error);
        }

        // Find and delete the table
        const table = await Table.findByIdAndDelete(id);

        // If table not found
        if (!table) {
            const error = createHttpError(404, "table not found!");
            return next(error);
        }

        // Success response
        res.status(200).json({ success: true, message: "table deleted successfully!" });
    } catch (error) {
        next(error);
    }
};

module.exports = { addTable,getTable,updateTable, deleteTable, updateTableData };