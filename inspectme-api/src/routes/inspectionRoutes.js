const express = require("express");
const { listInspections, createInspection } = require("../controllers/inspectionController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth);

router.get("/", listInspections);
router.post("/", requireRole("Administrator", "Inspector", "Manager"), createInspection);

module.exports = router;
