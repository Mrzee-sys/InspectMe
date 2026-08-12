const asyncHandler = require("../utils/asyncHandler");
const Notification = require("../models/Notification");

const listNotifications = asyncHandler(async (req, res) => {
  const { inspectionId } = req.query;
  const filter = inspectionId ? { inspectionId } : {};

  const notifications = await Notification.find(filter)
    .populate("inspectionId", "date time period status")
    .sort({ createdAt: -1 });

  return res.json(notifications);
});

module.exports = {
  listNotifications,
};
