const express = require("express");
const { listLocations, createLocation } = require("../controllers/locationController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth);

router.get("/", listLocations);
router.post("/", createLocation);

module.exports = router;
