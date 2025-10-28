const express = require('express');
const router = express.Router();
const {
  addInventoryCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require('../../controllers/Inventory/inventoryCategoryController');

const { isVerifiedUser } = require("../../middleware/tokenVerification");

// Routes for /api/category
router.route('/')
  .post(isVerifiedUser, addInventoryCategory)   // POST /api/category → Create new category
  .get(isVerifiedUser, getAllCategories); // GET /api/category → Get all categories

// Routes for /api/category/:id
router.route('/:id')
  .get(isVerifiedUser, getCategoryById)   // GET /api/category/:id → Get single category
  .put(isVerifiedUser, updateCategory)    // PUT /api/category/:id → Update category
  .delete(isVerifiedUser, deleteCategory); // DELETE /api/category/:id → Delete category

module.exports = router;
