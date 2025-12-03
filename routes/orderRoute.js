const express = require('express');
const router = express.Router();
const {addOrder, getOrders, getOrderById, updateOrderStatus, deleteOrder, updateOrder, getOrdersByStatus, updateSectionItemsReady, assignDeliveryBoyToOrder} = require("../controllers/orderController")
const { isVerifiedUser } = require('../middleware/tokenVerification');
const { completeAllOrders } = require('../controllers/optimizedOrderController');

// // ✅ NEW ROUTE: Get next order number
// router.route("/next-order-number").get(isVerifiedUser, getNextOrderNumber);

// ✅ Keep more specific routes ABOVE generic ":id" routes

router.route("/").post(isVerifiedUser, addOrder);
router.route("/").get(isVerifiedUser, getOrders);
router.route("/status/:status").get(isVerifiedUser, getOrdersByStatus);

// ✅ This one must come BEFORE "/:id"
router.route("/by-order-id/:orderId").put(isVerifiedUser, updateOrder);

router.route("/:id/section-ready").put(isVerifiedUser, updateSectionItemsReady);
router.route("/:id").get(isVerifiedUser, getOrderById);
router.route("/:id").put(isVerifiedUser, updateOrderStatus);
router.route("/:id").delete(isVerifiedUser, deleteOrder);
// ✅ New endpoint for assigning/changing delivery boy
router.patch("/:id/assign-delivery", isVerifiedUser, assignDeliveryBoyToOrder);

// ✅ New endpoint for completing multiple orders
router.patch("/complete-multiple", isVerifiedUser, completeAllOrders);
module.exports = router;


