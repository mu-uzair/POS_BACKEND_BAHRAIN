const express = require("express");
const { addCategory,getCategories, deleteCategory, updateCategory } = require("../controllers/categoryController");
const router = express.Router();
const {isVerifiedUser} = require("../middleware/tokenVerification");


router.route("/").post(isVerifiedUser, addCategory);
router.route("/").get( getCategories);
router.route("/:id").delete(isVerifiedUser,deleteCategory)
router.put('/:categoryId', isVerifiedUser, updateCategory);





module.exports = router;