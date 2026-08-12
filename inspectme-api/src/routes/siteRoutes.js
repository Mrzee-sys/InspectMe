const express = require("express");
const { listSites, createSite } = require("../controllers/siteController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth);

router.get("/", listSites);
router.post("/", requireRole("Administrator"), createSite);

module.exports = router;
