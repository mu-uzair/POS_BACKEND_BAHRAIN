const express = require('express');
const router = express.Router();
const { addVendor,getAllVendors, deleteVendor ,updateVendor } = require('../../controllers/Inventory/vendorController');
const { isVerifiedUser } = require("../../middleware/tokenVerification");

router.route("/").get( isVerifiedUser, getAllVendors );
router.route("/").post( isVerifiedUser, addVendor );
// Routes for /api/vendor/:_id
router.route('/:_id')
  .put(isVerifiedUser, updateVendor)  // PUT /api/vendor/:_id
  .delete(isVerifiedUser, deleteVendor);  // DELETE /api/vendor/:_id

module.exports = router;