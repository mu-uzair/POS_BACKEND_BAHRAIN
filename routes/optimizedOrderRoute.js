const express = require("express");
const router = express.Router();

const {
  getPaginatedOrders,
  getOrderStats,
  getPaymentTotals,
  getSalesReport
} = require("../controllers/optimizedOrderController");


router.get("/list", getPaginatedOrders);
router.get("/stats", getOrderStats);
router.get("/payments", getPaymentTotals);
router.get('/sales-report', getSalesReport);

module.exports = router;
