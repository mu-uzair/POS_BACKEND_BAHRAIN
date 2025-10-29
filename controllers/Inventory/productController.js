const Product = require('../../models/Inventory/productModel');
const Vendor = require('../../models/Inventory/vendormodel');
const Category = require('../../models/Inventory/inventoryCategoryModel');
const Transaction = require('../../models/Inventory/transactionModel');
const createHttpError = require('http-errors');
const mongoose = require('mongoose');

// ---------------------------
// Add Product
// ---------------------------
const addProduct = async (req, res) => {
  try {
    const { name, category, unit, quantity_in_stock, reorder_threshold, cost_per_unit, vendor } = req.body;

    // --- Validation ---
    if (!name || !category || !unit || quantity_in_stock == null || reorder_threshold == null || cost_per_unit == null || !vendor) {
      throw createHttpError(400, 'All fields are required');
    }

    if (typeof name !== 'string' || name.trim() === '') {
      throw createHttpError(400, 'Name must be a non-empty string');
    }

    if (!['pcs', 'kg', 'L', 'g', 'ml'].includes(unit)) {
      throw createHttpError(400, 'Invalid unit type');
    }

    if (typeof quantity_in_stock !== 'number' || quantity_in_stock < 0) {
      throw createHttpError(400, 'Quantity in stock must be a non-negative number');
    }

    if (typeof reorder_threshold !== 'number' || reorder_threshold < 0) {
      throw createHttpError(400, 'Reorder threshold must be a non-negative number');
    }

    if (typeof cost_per_unit !== 'number' || cost_per_unit < 0) {
      throw createHttpError(400, 'Cost per unit must be a non-negative number');
    }

    // --- Validate related documents ---
    const vendorExists = await Vendor.findById(vendor);
    if (!vendorExists) throw createHttpError(404, 'Vendor not found');

    const categoryExists = await Category.findById(category);
    if (!categoryExists) throw createHttpError(404, 'Category not found');

    // --- Create Product ---
    const product = new Product({
      name: name.trim(),
      category,
      unit,
      quantity_in_stock,
      reorder_threshold,
      cost_per_unit: mongoose.Types.Decimal128.fromString(parseFloat(cost_per_unit).toFixed(3)),
      vendor,
    });

    await product.save();

    // Update vendor record
    await Vendor.findByIdAndUpdate(vendor, { $addToSet: { productsSupplied: product._id } });

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

// ---------------------------
// Get All Products
// ---------------------------
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('vendor', 'name')

      .lean();

    // Convert Decimal128 to Number for frontend
    const formatted = products.map(p => ({
      ...p,
      cost_per_unit: parseFloat(p.cost_per_unit?.toString() || '0'),
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};

// ---------------------------
// Update Product
// ---------------------------
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, unit, quantity_in_stock, reorder_threshold, cost_per_unit, vendor } = req.body;

    if (!name || !category || !unit || quantity_in_stock == null || reorder_threshold == null || cost_per_unit == null || !vendor) {
      throw createHttpError(400, 'All fields are required');
    }

    const product = await Product.findById(id);
    if (!product) throw createHttpError(404, 'Product not found');

    const vendorExists = await Vendor.findById(vendor);
    if (!vendorExists) throw createHttpError(404, 'Vendor not found');

    const categoryExists = await Category.findById(category);
    if (!categoryExists) throw createHttpError(404, 'Category not found');

    // If vendor changed, adjust vendor references
    if (product.vendor.toString() !== vendor) {
      await Vendor.findByIdAndUpdate(product.vendor, { $pull: { productsSupplied: product._id } });
      await Vendor.findByIdAndUpdate(vendor, { $addToSet: { productsSupplied: product._id } });
    }

    // Update fields
    product.name = name.trim();
    product.category = category;
    product.unit = unit;
    product.quantity_in_stock = quantity_in_stock;
    product.reorder_threshold = reorder_threshold;
    product.cost_per_unit = mongoose.Types.Decimal128.fromString(parseFloat(cost_per_unit).toFixed(3));
    product.vendor = vendor;

    await product.save();

    const updated = await Product.findById(id)
      .populate('vendor', 'name')
      .populate('category', 'name')
      .lean();

    updated.cost_per_unit = parseFloat(updated.cost_per_unit?.toString() || '0');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to update product',
    });
  }
};

// ---------------------------
// Delete Product
// ---------------------------
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) throw createHttpError(404, 'Product not found');

    await Vendor.findByIdAndUpdate(product.vendor, { $pull: { productsSupplied: product._id } });
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

// ---------------------------
// Adjust Stock (In / Out) - Refactored for Atomic Update
// ---------------------------
const adjustStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, type, notes } = req.body; // Added notes field

        if (!quantity || quantity <= 0) {
            throw createHttpError(400, 'Quantity must be greater than 0');
        }

        if (!['in', 'out'].includes(type)) {
            throw createHttpError(400, 'Type must be "in" or "out"');
        }
        
        // Convert quantity to negative for deduction ($inc)
        const updateAmount = type === 'in' ? quantity : -quantity;

        // Use atomic update ($inc) instead of read-modify-write
        const updatedProduct = await Product.findOneAndUpdate(
            { _id: id },
            { $inc: { quantity_in_stock: updateAmount } },
            { new: true } // Return the updated document
        ).populate('vendor', 'name');

        if (!updatedProduct) throw createHttpError(404, 'Product not found');

        // Optional: Check if stock went negative (only necessary if strict validation is needed)
        // Note: For 'out', the $inc update might make stock negative if it was insufficient.
        // We trust this manual endpoint because a manager is clicking 'save', but the automated
        // deduction will be much safer.

        // Log transaction
        const transaction = new Transaction({
            productId: updatedProduct._id,
            productName: updatedProduct.name,
            vendorName: updatedProduct.vendor?.name || 'Unknown Vendor',
            type,
            quantity,
            unitCost: updatedProduct.cost_per_unit,
            date: new Date(),
            notes: notes || `Stock ${type === 'in' ? 'added' : 'removed'} manually`,
        });

        await transaction.save();

        res.status(200).json({
            success: true,
            message: 'Stock adjusted successfully',
            data: updatedProduct,
        });
    } catch (error) {
        console.error('Error adjusting stock:', error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Failed to adjust stock',
        });
    }
};



module.exports = {
    addProduct,
    getAllProducts,
    updateProduct,
    deleteProduct,
    adjustStock,
    // EXPORT THE NEW AUTOMATED FUNCTION for the POS controller to use
  
};
