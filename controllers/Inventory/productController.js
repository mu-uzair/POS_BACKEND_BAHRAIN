const Product = require('../../models/Inventory/productModel');
const Vendor = require("../../models/Inventory/vendormodel");
const Transaction = require('../../models/Inventory/transactionModel'); // Add Transaction model
const createHttpError = require("http-errors");

const addProduct = async (req, res) => {
  try {
    const { name, unit, quantity_in_stock, reorder_threshold, cost_per_unit, vendor } = req.body;

    // Validate required fields
    if (!name || !unit || quantity_in_stock == null || reorder_threshold == null || cost_per_unit == null || !vendor) {
      throw createHttpError(400, 'All fields are required');
    }

    // Additional validation
    if (typeof name !== 'string' || name.trim() === '') {
      throw createHttpError(400, 'Name must be a non-empty string');
    }
    if (typeof unit !== 'string' || unit.trim() === '') {
      throw createHttpError(400, 'Unit must be a non-empty string');
    }
    if (typeof quantity_in_stock !== 'number' || quantity_in_stock < 0) {
      throw createHttpError(400, 'Quantity in stock must be a non-negative number');
    }
    if (typeof reorder_threshold !== 'number' || reorder_threshold < 0) {
      throw createHttpError(400, 'Reorder threshold must be a non-negative number');
    }
    if (typeof cost_per_unit !== 'number' || cost_per_unit <= 0) {
      throw createHttpError(400, 'Cost per unit must be a positive number');
    }

    // Validate vendor exists
    const vendorExists = await Vendor.findById(vendor);
    if (!vendorExists) {
      throw createHttpError(404, 'Vendor not found');
    }

    // Create new product
    const product = new Product({
      name: name.trim(),
      unit: unit.trim(),
      quantity_in_stock,
      reorder_threshold,
      cost_per_unit,
      vendor,
    });

    await product.save();

    // Update vendor's productsSupplied, avoiding duplicates
    await Vendor.findByIdAndUpdate(
      vendor,
      { $addToSet: { productsSupplied: product._id } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      data: product,
    });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to add product',
    });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('vendor', 'name').lean();
    res.status(200).json({ data: products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, unit, quantity_in_stock, reorder_threshold, cost_per_unit, vendor } = req.body;

    // Validate required fields
    if (!name || !unit || quantity_in_stock == null || reorder_threshold == null || cost_per_unit == null || !vendor) {
      throw createHttpError(400, 'All fields are required');
    }

    // Additional validation
    if (typeof name !== 'string' || name.trim() === '') {
      throw createHttpError(400, 'Name must be a non-empty string');
    }
    if (typeof unit !== 'string' || unit.trim() === '') {
      throw createHttpError(400, 'Unit must be a non-empty string');
    }
    if (typeof quantity_in_stock !== 'number' || quantity_in_stock < 0) {
      throw createHttpError(400, 'Quantity in stock must be a non-negative number');
    }
    if (typeof reorder_threshold !== 'number' || reorder_threshold < 0) {
      throw createHttpError(400, 'Reorder threshold must be a non-negative number');
    }
    if (typeof cost_per_unit !== 'number' || cost_per_unit <= 0) {
      throw createHttpError(400, 'Cost per unit must be a positive number');
    }

    // Validate vendor exists
    const vendorExists = await Vendor.findById(vendor);
    if (!vendorExists) {
      throw createHttpError(404, 'Vendor not found');
    }

    // Find the product to update
    const product = await Product.findById(id);
    if (!product) {
      throw createHttpError(404, 'Product not found');
    }

    // If the vendor is changing, update the productsSupplied array in both old and new vendors
    if (product.vendor.toString() !== vendor) {
      // Remove product from old vendor's productsSupplied
      await Vendor.findByIdAndUpdate(
        product.vendor,
        { $pull: { productsSupplied: product._id } },
        { new: true }
      );
      // Add product to new vendor's productsSupplied
      await Vendor.findByIdAndUpdate(
        vendor,
        { $addToSet: { productsSupplied: product._id } },
        { new: true }
      );
    }

    // Update product fields
    product.name = name.trim();
    product.unit = unit.trim();
    product.quantity_in_stock = quantity_in_stock;
    product.reorder_threshold = reorder_threshold;
    product.cost_per_unit = cost_per_unit;
    product.vendor = vendor;

    await product.save();

    // Populate vendor name for response
    const updatedProduct = await Product.findById(id).populate('vendor', 'name').lean();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to update product',
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the product to delete
    const product = await Product.findById(id);
    if (!product) {
      throw createHttpError(404, 'Product not found');
    }

    // Remove product from vendor's productsSupplied
    await Vendor.findByIdAndUpdate(
      product.vendor,
      { $pull: { productsSupplied: product._id } },
      { new: true }
    );

    // Delete the product
    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to delete product',
    });
  }
};


// const adjustStock = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { quantity, type, notes } = req.body;
//     console.log("adjustStock - Request Data:", { id, quantity, type, notes });

//     // Validate inputs
//     if (quantity == null || typeof quantity !== 'number' || quantity <= 0) {
//       throw createHttpError(400, 'Quantity must be a positive number');
//     }
//     if (!['in', 'out'].includes(type)) {
//       throw createHttpError(400, 'Invalid stock adjustment type. Use "in" or "out"');
//     }

//     // Find the product
//     const product = await Product.findById(id);
//     if (!product) {
//       throw createHttpError(404, 'Product not found');
//     }
//     console.log("adjustStock - Product Found:", product);

//     // Adjust stock
//     if (type === 'in') {
//       product.quantity_in_stock += quantity;
//     } else if (type === 'out') {
//       const newStock = product.quantity_in_stock - quantity;
//       if (newStock < 0) {
//         throw createHttpError(400, 'Stock cannot be reduced below 0');
//       }
//       product.quantity_in_stock = newStock;
//     }

//     await product.save();
//     console.log("adjustStock - Product Updated:", product);

//     // Create a transaction record
//     const transactionData = {
//       productId: product._id,
//       productName: product.name,
//       type,
//       quantity,
//       notes: notes || 'Stock adjustment via Edit Panel',
//       unitCost: type === 'in' ? product.cost_per_unit : undefined,
//     };
//     console.log("adjustStock - Transaction Data Before Save:", transactionData);

//     const transaction = new Transaction(transactionData);
//     await transaction.save();
//     console.log("adjustStock - Transaction Created:", transaction);

//     // Populate vendor name for response
//     const updatedProduct = await Product.findById(id).populate('vendor', 'name').lean();

//     res.status(200).json({
//       message: 'Stock adjusted successfully',
//       data: updatedProduct,
//     });
//   } catch (error) {
//     console.error("adjustStock - Error:", error);
//     res.status(error.status || 500).json({
//       success: false,
//       message: error.message || 'Failed to adjust stock',
//     });
//   }
// };

// Adjust stock and create a transaction
const adjustStock = async (req, res) => {
  try {
    const { id } = req.params; // Product ID
    const { quantity, type } = req.body;

    if (!quantity || quantity <= 0) {
      throw createHttpError(400, 'Quantity must be greater than 0');
    }

    if (!['in', 'out'].includes(type)) {
      throw createHttpError(400, 'Type must be "in" or "out"');
    }

    const product = await Product.findById(id).populate('vendor', 'name');
    if (!product) {
      throw createHttpError(404, 'Product not found');
    }

    // Adjust stock based on type
    if (type === 'in') {
      product.quantity_in_stock += quantity;
    } else {
      if (product.quantity_in_stock < quantity) {
        throw createHttpError(400, 'Insufficient stock to subtract');
      }
      product.quantity_in_stock -= quantity;
    }

    await product.save();

    // Create a transaction
    const transaction = new Transaction({
      productId: product._id,
      productName: product.name,
      vendorName: product.vendor?.name || 'Unknown Vendor', // Fetch vendorName from the populated vendor
      type: type,
      quantity: quantity,
      unitCost: product.cost_per_unit,
      date: new Date(),
      notes: `Stock ${type === 'in' ? 'added' : 'removed'} via Inventory Edit Panel`,
    });

    await transaction.save();

    res.status(200).json({ message: 'Stock adjusted successfully', data: product });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to adjust stock',
    });
  }
};

module.exports = { addProduct, getAllProducts, updateProduct, deleteProduct, adjustStock };