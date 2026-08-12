const asyncHandler = require("../utils/asyncHandler");
const AuditLog = require("../models/AuditLog");

const listAuditLogs = asyncHandler(async (req, res) => {
  const { userId, action, limit = 200 } = req.query;
  const filter = {};

  if (userId) {
    filter.user = userId;
  }

  if (action) {
    filter.action = action;
  }

  const safeLimit = Math.min(Number(limit) || 200, 500);

  const logs = await AuditLog.find(filter)
    .populate("user", "username role")
    .sort({ timestamp: -1 })
    .limit(safeLimit);

  return res.json(logs);
});

module.exports = {
  listAuditLogs,
};
