const express = require('express');
const router = express.Router();
const { addProduct, getAllProducts, deleteProduct, adjustStock, updateProduct } = require('../../controllers/Inventory/productController');
const { isVerifiedUser } = require("../../middleware/tokenVerification");

// Routes for /api/product
router.route('/')
  .post(isVerifiedUser, addProduct)  // POST /api/product
  .get(isVerifiedUser, getAllProducts);  // GET /api/product

// Routes for /api/product/:id
router.route('/:id')
  .put(isVerifiedUser, updateProduct)  // PUT /api/product/:id
  .delete(isVerifiedUser, deleteProduct);  // DELETE /api/product/:id

// Route for adjusting stock
router.route('/:id/stock')
  .patch(isVerifiedUser, adjustStock);  // PATCH /api/product/:id/stock

module.exports = router;