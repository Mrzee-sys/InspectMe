const express = require("express");
const { listSites, createSite } = require("../controllers/siteController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth);

router.get("/", listSites);
router.post("/", createSite);

module.exports = router;
