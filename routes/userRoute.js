const express = require("express");
const { register, login, getUserData, logout, verifyAdminPasswordController } = require("../controllers/userController");
const router = express.Router();
const {isVerifiedUser} = require("../middleware//tokenVerification")


//Authentication Routes
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").post(isVerifiedUser,logout);
// New route for password verification
router.route("/").post(verifyAdminPasswordController);

router.route("/").get( isVerifiedUser , getUserData );

module.exports = router;