// // routes/customerRoutes.js
// const express = require('express');
// const router = express.Router();
// const { 
//     searchCustomer, 
//     deleteCustomer 
// } = require("../controllers/deliveryCustomerController");
// const { isVerifiedUser } = require('../middleware/tokenVerification');

// // GET: Search customer by phone number (?phone={number}). Used for auto-fill in order creation.
// // This is typically accessible to any user who can create an order.
// router.route("/search")
//     .get(isVerifiedUser, searchCustomer); 

// // DELETE: Delete a customer record (Admin/Manager role only)
// router.route("/:id")
//     .delete(isVerifiedUser, deleteCustomer);

// module.exports = router;



const express = require('express');
const router = express.Router();
const { 
    addCustomer,    // <-- New import for POST request
    searchCustomer, 
    deleteCustomer 
} = require("../controllers/deliveryCustomerController");
const { isVerifiedUser } = require('../middleware/tokenVerification');

// Base Route: /api/customers
router.route("/")
    // POST: Add a new customer record
    .post(isVerifiedUser, addCustomer); 

// GET: Search customer by phone number (?phone={number}). Used for auto-fill in order creation.
router.route("/search")
    .get(isVerifiedUser, searchCustomer); 

// DELETE: Delete a customer record by its unique phone number
// NOTE: The parameter is now expected to be the phone number, not the MongoDB _id.
router.route("/:phone")
    .delete(isVerifiedUser, deleteCustomer);

module.exports = router;