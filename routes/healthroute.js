const express = require("express");
const router = express.Router();

// ⚡ Fast HEAD request (used by your frontend check)
router.head("/", (req, res) => {
  return res.sendStatus(200);
});

// Optional GET for debugging
router.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Backend is running",
    time: new Date().toISOString()
  });
});

module.exports = router;
