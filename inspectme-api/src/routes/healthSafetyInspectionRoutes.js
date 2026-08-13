const express = require("express");
const {
  listHealthSafetyInspections,
  createHealthSafetyInspection,
} = require("../controllers/healthSafetyInspectionController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth);

router.get("/", listHealthSafetyInspections);
router.post("/", requireRole("Administrator", "Inspector", "Manager"), createHealthSafetyInspection);

module.exports = router;