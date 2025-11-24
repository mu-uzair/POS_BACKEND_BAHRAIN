const Customer = require('../models/deliveryCustomerModel');
const mongoose = require("mongoose");
const createHttpError = require("http-errors");

// Helper to check for valid ID
const isValidId = (id, entity) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw createHttpError(404, `Invalid ${entity} ID!`);
    }
};


// const addCustomer = async (req, res, next) => {
//   try {
//     const { phone_number, name, address } = req.body;

//     if (!phone_number) {
//       throw createHttpError(400, "Phone number is required.");
//     }

//     // ✅ 1. Check if customer already exists
//     let existingCustomer = await Customer.findOne({ phone_number: phone_number.trim() });

//     if (existingCustomer) {
//       // ✅ 2. Update existing customer info if name or address changed
//       if (name || address) {
//         existingCustomer.name = name || existingCustomer.name;
//         existingCustomer.address = address || existingCustomer.address;
//         await existingCustomer.save();
//       }

//       return res.status(200).json({
//         success: true,
//         message: "Existing customer found and updated.",
//         data: existingCustomer,
//       });
//     }

//     // ✅ 3. If not found → create new one
//     const newCustomer = await Customer.create({
//       phone_number: phone_number.trim(),
//       name: name || "",
//       address: address || "",
//     });

//     res.status(201).json({
//       success: true,
//       message: "New customer created successfully.",
//       data: newCustomer,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

const addCustomer = async (req, res, next) => {
  try {
    const { phone_number, phone, name, address } = req.body;
    const customerPhone = (phone_number || phone || "").trim();

    if (!customerPhone) {
      throw createHttpError(400, "Phone number is required.");
    }

    let existingCustomer = await Customer.findOne({ phone_number: customerPhone });

    if (existingCustomer) {
      if (name || address) {
        existingCustomer.name = name || existingCustomer.name;
        existingCustomer.address = address || existingCustomer.address;
        await existingCustomer.save();
      }

      return res.status(200).json({
        success: true,
        message: "Existing customer found and updated.",
        data: existingCustomer,
      });
    }

    const newCustomer = await Customer.create({
      phone_number: customerPhone,
      name: name || "",
      address: address || "",
    });

    res.status(201).json({
      success: true,
      message: "New customer created successfully.",
      data: newCustomer,
    });
  } catch (error) {
    next(error);
  }
};


// GET: Search customer by phone number for auto-fill (Endpoint: /customers/search?phone=...)
const searchCustomer = async (req, res, next) => {
    try {
        const { phone } = req.query;
        if (!phone) {
            throw createHttpError(400, "Phone number query parameter is required.");
        }
        
        // Find customer by phone_number (indexed for performance)
        const customer = await Customer.findOne({ phone_number: phone.trim() }).select('name address phone_number');
        
        if (!customer) {
            // Return success with null data to indicate a new customer
            return res.status(200).json({ success: true, data: null, message: "New customer detected." });
        }
        
        res.status(200).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

// DELETE: Delete a customer record (Admin/Manager role required)
const deleteCustomer = async (req, res, next) => {
    try {
        const { id } = req.params;
        isValidId(id, 'Customer');

        const customer = await Customer.findByIdAndDelete(id);
        
        if (!customer) {
            throw createHttpError(404, "Customer record not found.");
        }

        res.status(200).json({ success: true, message: "Customer data deleted successfully." });
    } catch (error) {
        next(error);
    }
};




const getAllCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find({}, '_id  phone_number name address'); // select only necessary fields
    res.status(200).json({ success: true, data: customers });
  } catch (err) {
    next(createHttpError(500, err.message || 'Failed to fetch customers'));
  }
};

module.exports = {  };


module.exports = { searchCustomer, deleteCustomer, addCustomer, getAllCustomers };
