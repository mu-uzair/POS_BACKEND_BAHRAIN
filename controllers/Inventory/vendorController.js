const createHttpError = require("http-errors");
const Vendor = require("../../models/Inventory/vendormodel");
const Product = require("../../models/Inventory/productModel");

const addVendor = async (req, res, next) => {
  try {
    const { name, contact, address, notes } = req.body;

    // Log incoming request data
    console.log("Incoming Vendor Data:", { name, contact, address, notes });

    // Validate required fields
    if (!name) {
      const error = createHttpError(400, "Please provide Vendor Name!");
      return next(error);
    }

    // Check if vendor already exists
    const isVendorPresent = await Vendor.findOne({ name });
    if (isVendorPresent) {
      const error = createHttpError(400, "Vendor already exists!");
      return next(error);
    }

    // Create new vendor
    const newVendor = new Vendor({
      name,
      contact,
      address,
      notes,
    });

    await newVendor.save();

    res.status(201).json({
      success: true,
      message: "Vendor added successfully!",
      data: newVendor,
    });
  } catch (error) {
    return next(error);
  }
};


const getAllVendors = async (req, res, next) => {
  try {
    const vendors = await Vendor.find().select("name _id contact address notes");
    res.status(200).json({
      success: true,
      data: {data:vendors}, // Simplified response structure
    });
  } catch (error) {
    return next(createHttpError(500, "Failed to fetch vendors", { error: error.message }));
  }
};

const updateVendor = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { name, contact, address, notes } = req.body;

    // Validate required fields
    if (!name) {
      return next(createHttpError(400, "Please provide Vendor Name!"));
    }

    // Check if vendor exists
    const vendor = await Vendor.findById(_id);
    if (!vendor) {
      return next(createHttpError(404, "Vendor not found"));
    }

    // Check if the new name conflicts with another vendor (excluding the current vendor)
    const isVendorPresent = await Vendor.findOne({ name, _id: { $ne: _id } });
    if (isVendorPresent) {
      return next(createHttpError(400, "Vendor name already exists!"));
    }

    // Update vendor fields
    vendor.name = name;
    vendor.contact = contact || "";
    vendor.address = address || "";
    vendor.notes = notes || "";
    await vendor.save();

    res.status(200).json({
      success: true,
      message: "Vendor updated successfully!",
      data: vendor,
    });
  } catch (error) {
    return next(createHttpError(500, "Failed to update vendor", { error: error.message }));
  }
};

const deleteVendor = async (req, res, next) => {
  try {
    const { _id } = req.params;

    // Check if vendor exists
    const vendor = await Vendor.findById(_id);
    if (!vendor) {
      return next(createHttpError(404, "Vendor not found"));
    }

    // Check if vendor is linked to any products
    const products = await Product.find({ vendor: _id });
    if (products.length > 0) {
      return next(createHttpError(400, "Cannot delete vendor because it is linked to existing products"));
    }

    // Delete the vendor
    await Vendor.findByIdAndDelete(_id);

    res.status(200).json({
      success: true,
      message: "Vendor deleted successfully!",
    });
  } catch (error) {
    return next(createHttpError(500, "Failed to delete vendor", { error: error.message }));
  }
};

module.exports = { addVendor, getAllVendors, updateVendor, deleteVendor };