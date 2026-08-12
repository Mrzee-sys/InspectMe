const express = require("express");
const { listAuditLogs } = require("../controllers/auditLogController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth);
router.get("/", requireRole("Administrator"), listAuditLogs);

module.exports = router;
