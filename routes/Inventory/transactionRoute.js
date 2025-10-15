const express = require('express');
const router = express.Router();
const { isVerifiedUser } = require("../../middleware/tokenVerification");
const { getTransactions, deleteTransaction,} = require('../../controllers/Inventory/transactionController');

// Get all transactions
router.route('/').get ( isVerifiedUser, getTransactions);

// // Delete a transaction
// router.delete('/:transactionId',isVerifiedUser, deleteTransaction);


router.route('/:id')
  
  .delete(isVerifiedUser, deleteTransaction);  

module.exports = router;

// router.route("/").get( isVerifiedUser, getAllVendors );