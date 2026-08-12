const express = require("express");
const { listLocations, createLocation } = require("../controllers/locationController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth);

router.get("/", listLocations);
router.post("/", requireRole("Administrator", "Manager"), createLocation);

module.exports = router;
