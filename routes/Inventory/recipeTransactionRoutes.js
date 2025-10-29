const express = require('express');
const router = express.Router();
const {
    getAllRecipeTransactions,
    getRecipeTransactionById,
    deleteRecipeTransaction,
    // rollbackRecipeTransaction,
    getRecipeTransactionSummary,
} = require('../../controllers/Inventory/recipeTransactionController');

const { rollbackRecipeStock,adjustStockByRecipe } = require('../../controllers/Inventory/recipeStockController');

const { isVerifiedUser } = require('../../middleware/tokenVerification');

// Routes for /api/recipe-transaction (assuming this is the base path)

// Routes for /api/recipe-transaction/
router.route('/')
    .get(isVerifiedUser, getAllRecipeTransactions); // GET all transactions

// Route for /api/recipe-transaction/summary
router.route('/summary')
    .get(isVerifiedUser, getRecipeTransactionSummary); // GET transaction summary metrics

// Routes for /api/recipe-transaction/:id
router.route('/:id')
    .get(isVerifiedUser, getRecipeTransactionById)   // GET single transaction
    .delete(isVerifiedUser, deleteRecipeTransaction); // DELETE transaction (Admin only)

    // Route for /api/recipe-transaction/:id/rollback - NOW ACTIVE
router.route('/:id/rollback')
    .post(isVerifiedUser, rollbackRecipeStock); // POST to rollback transaction using atomic logic

router.route('/:id/stock-out')
    .post(isVerifiedUser, adjustStockByRecipe); // POST to rollback transaction using atomic logic

// // Route for /api/recipe-transaction/:id/rollback
// router.route('/:id/rollback')
//     .post(isVerifiedUser, rollbackRecipeTransaction); // POST to rollback transaction (Admin only)

module.exports = router;
