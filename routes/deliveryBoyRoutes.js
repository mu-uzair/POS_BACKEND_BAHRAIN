// routes/deliveryBoyRoutes.js
const express = require('express');
const router = express.Router();
const { 
    addDeliveryBoy, 
    getDeliveryBoys, 
    updateDeliveryBoy, 
    deleteDeliveryBoy 
} = require("../controllers/deliveryBoyController");
const { isVerifiedUser } = require('../middleware/tokenVerification');

// NOTE: All these routes require authorization (isVerifiedUser)

// GET: Get all active delivery boys (for order assignment dropdown)
// POST: Add a new delivery boy
router.route("/")
    .get(isVerifiedUser, getDeliveryBoys)
    .post(isVerifiedUser, addDeliveryBoy);

// PATCH: Update a delivery boy's details or status
// DELETE: Remove a delivery boy
router.route("/:id")
    .patch(isVerifiedUser, updateDeliveryBoy)
    .delete(isVerifiedUser, deleteDeliveryBoy);

module.exports = router;