const express = require("express");
const { addTable, getTable, updateTable, deleteTable, updateTableData } = require("../controllers/tableController");
const router = express.Router();
const {isVerifiedUser} = require("../middleware/tokenVerification")



router.route("/").post(isVerifiedUser, addTable);
router.route("/").get(isVerifiedUser, getTable);


// For updating status and order
router.route("/:id/status").put(isVerifiedUser, updateTable);

// For updating table number and seats
router.route("/:id/data").put(isVerifiedUser, updateTableData);

router.route("/:id").delete(isVerifiedUser, deleteTable)

module.exports = router;