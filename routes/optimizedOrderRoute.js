const express = require("express");
const router = express.Router();

const {
  getPaginatedOrders,
  getOrderStats,
  getPaymentTotals
} = require("../controllers/optimizedOrderController");


router.get("/list", getPaginatedOrders);
router.get("/stats", getOrderStats);
router.get("/payments", getPaymentTotals);

module.exports = router;
