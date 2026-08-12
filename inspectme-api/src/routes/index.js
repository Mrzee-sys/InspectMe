const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const siteRoutes = require("./siteRoutes");
const locationRoutes = require("./locationRoutes");
const inspectionRoutes = require("./inspectionRoutes");
const notificationRoutes = require("./notificationRoutes");
const auditLogRoutes = require("./auditLogRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/sites", siteRoutes);
router.use("/locations", locationRoutes);
router.use("/inspections", inspectionRoutes);
router.use("/notifications", notificationRoutes);
router.use("/audit-logs", auditLogRoutes);

module.exports = router;
