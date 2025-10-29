// routes/dishRecipeRoutes.js
const express = require('express');
const router = express.Router();

const {
  addRecipe,
  getAllRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  getRecipeByDishAndVariation,
} = require('../../controllers/Inventory/dishRecipeController');

const { adjustStockByRecipe, rollbackRecipeStock } = require('../../controllers/Inventory/recipeStockController');

const { isVerifiedUser } = require('../../middleware/tokenVerification');

// Routes for /api/dish-recipe
router.route('/')
  .post(isVerifiedUser, addRecipe)      // POST /api/dish-recipe → Create new recipe
  .get(isVerifiedUser, getAllRecipes);  // GET /api/dish-recipe → Get all recipes

// Routes for /api/dish-recipe/:id
router.route('/:id')
  .get(isVerifiedUser, getRecipeById)   // GET /api/dish-recipe/:id → Get single recipe
  .put(isVerifiedUser, updateRecipe)    // PUT /api/dish-recipe/:id → Update recipe
  .delete(isVerifiedUser, deleteRecipe);// DELETE /api/dish-recipe/:id → Delete recipe

// Route for /api/dish-recipe/by/dish-variation
router.get('/by/dish-variation', isVerifiedUser, getRecipeByDishAndVariation); // GET by dish + variation

// new:
router.post('/:id/stock-out', isVerifiedUser, adjustStockByRecipe);
router.post('/txn/:id/rollback', isVerifiedUser, rollbackRecipeStock);

module.exports = router;
