const express = require("express");
const { listUsers, createUser, updateUserStatus } = require("../controllers/userController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("Administrator"));

router.get("/", listUsers);
router.post("/", createUser);
router.patch("/:id/status", updateUserStatus);

module.exports = router;
