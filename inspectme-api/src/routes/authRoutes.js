const express = require("express");
const { login, me, changePassword } = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", login);
router.get("/me", requireAuth, me);
router.patch("/change-password", requireAuth, changePassword);

module.exports = router;
