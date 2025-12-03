const express = require("express");
const router = express.Router();

const {
  getDashboardAnalytics,
  getTodayAnalytics,
  
} = require("../controllers/analyticsController");
const { getPopularDishes } = require("../controllers/optimizedOrderController");
const {isVerifiedUser} = require("../middleware/tokenVerification");

router.get("/dashboard", getDashboardAnalytics);
router.get("/today", getTodayAnalytics);
router.get('/popular-dishes', getPopularDishes);

module.exports = router;
