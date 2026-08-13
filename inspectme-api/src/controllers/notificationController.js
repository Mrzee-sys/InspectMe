const asyncHandler = require("../utils/asyncHandler");
const Notification = require("../models/Notification");

const listNotifications = asyncHandler(async (req, res) => {
  const { inspectionId, healthSafetyInspectionId } = req.query;
  const filter = {};

  if (inspectionId) {
    filter.inspectionId = inspectionId;
  }

  if (healthSafetyInspectionId) {
    filter.healthSafetyInspectionId = healthSafetyInspectionId;
  }

  const notifications = await Notification.find(filter)
    .populate("inspectionId", "date time period status")
    .populate("healthSafetyInspectionId", "date time period status inspectionType")
    .sort({ createdAt: -1 });

  return res.json(notifications);
});

module.exports = {
  listNotifications,
};
