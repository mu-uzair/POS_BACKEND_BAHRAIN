const InventoryCategory = require('../../models/Inventory/inventoryCategoryModel');
const createHttpError = require('http-errors');

// ─────────────────────────────
// @desc    Get all inventory categories
// @route   GET /api/inventory-category
// @access  Authenticated
// ─────────────────────────────
const getAllCategories = async (req, res, next) => {
  try {
    const categories = await InventoryCategory.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: "Inventory categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    next(createHttpError(500, "Failed to fetch inventory categories"));
  }
};

// ─────────────────────────────
// @desc    Get single inventory category by ID
// @route   GET /api/inventory-category/:id
// @access  Authenticated
// ─────────────────────────────
const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await InventoryCategory.findById(id);

    if (!category) {
      return next(createHttpError(404, "Inventory category not found"));
    }

    res.status(200).json({
      success: true,
      message: "Inventory category fetched successfully",
      data: category,
    });
  } catch (error) {
    next(createHttpError(500, "Failed to fetch inventory category"));
  }
};

// ─────────────────────────────
// @desc    Add new inventory category
// @route   POST /api/inventory-category
// @access  Admin
// ─────────────────────────────
const addInventoryCategory = async (req, res, next) => {
  try {
    console.log("📩 Incoming Category Data:", req.body);

    const { name } = req.body;
    if (!name || name.trim() === "") {
      throw createHttpError(400, "Please provide a category name");
    }

    // Prevent duplicate category names (case-insensitive)
    const existing = await InventoryCategory.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existing) {
      throw createHttpError(400, "Category already exists");
    }

    const category = new InventoryCategory({ name: name.trim() });
    await category.save();

    res.status(201).json({
      success: true,
      message: "Inventory category created successfully",
      data: category,
    });
  } catch (error) {
    next(
      createHttpError(
        error.status || 500,
        error.message || "Failed to create inventory category"
      )
    );
  }
};

// ─────────────────────────────
// @desc    Update inventory category
// @route   PUT /api/inventory-category/:id
// @access  Admin
// ─────────────────────────────
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === "") {
      throw createHttpError(400, "Category name is required");
    }

    const existing = await InventoryCategory.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existing && existing._id.toString() !== id) {
      throw createHttpError(400, "Category with this name already exists");
    }

    const updatedCategory = await InventoryCategory.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      throw createHttpError(404, "Inventory category not found");
    }

    res.status(200).json({
      success: true,
      message: "Inventory category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    next(
      createHttpError(
        error.status || 500,
        error.message || "Failed to update inventory category"
      )
    );
  }
};

// ─────────────────────────────
// @desc    Delete inventory category
// @route   DELETE /api/inventory-category/:id
// @access  Admin
// ─────────────────────────────
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await InventoryCategory.findById(id);
    if (!category) {
      throw createHttpError(404, "Inventory category not found");
    }

    await InventoryCategory.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Inventory category deleted successfully",
    });
  } catch (error) {
    next(
      createHttpError(
        error.status || 500,
        error.message || "Failed to delete inventory category"
      )
    );
  }
};

// ─────────────────────────────
// Export all controllers
// ─────────────────────────────
module.exports = {
  getAllCategories,
  getCategoryById,
  addInventoryCategory,
  updateCategory,
  deleteCategory,
};
