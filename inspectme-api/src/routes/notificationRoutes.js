const express = require("express");
const { listNotifications } = require("../controllers/notificationController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth);
router.get("/", requireRole("Administrator", "Manager"), listNotifications);

module.exports = router;
