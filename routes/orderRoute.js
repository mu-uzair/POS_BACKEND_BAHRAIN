const express = require('express');
const router = express.Router();
const {addOrder, getOrders, getOrderById, updateOrderStatus, deleteOrder, updateOrder} = require("../controllers/orderController")
const { isVerifiedUser } = require('../middleware/tokenVerification');



router.route("/").post(isVerifiedUser,addOrder)
router.route("/").get(isVerifiedUser,getOrders)
router.route("/:id").get(isVerifiedUser,getOrderById)
router.route("/:id").put(isVerifiedUser,updateOrderStatus)
router.route("/by-order-id/:orderId").put(isVerifiedUser,updateOrder)
router.route("/:id").delete(isVerifiedUser,deleteOrder)

module.exports = router;


