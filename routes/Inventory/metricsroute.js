const express = require('express');
const router = express.Router();
const { getMetrics } = require('../../controllers/Inventory/metricsController');
const { isVerifiedUser } = require("../../middleware/tokenVerification");

// Get inventory metrics
router.get('/', isVerifiedUser, getMetrics);

module.exports = router;