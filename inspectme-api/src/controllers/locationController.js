const asyncHandler = require("../utils/asyncHandler");
const Location = require("../models/Location");
const Site = require("../models/Site");
const AuditLog = require("../models/AuditLog");

const listLocations = asyncHandler(async (req, res) => {
  const { siteId } = req.query;
  const filter = {
    owner: req.user.id,
    ...(siteId ? { siteCode: siteId } : {}),
  };

  const locations = await Location.find(filter)
    .populate("siteCode", "siteCode siteName")
    .sort({ locationName: 1 });

  return res.json(locations);
});

const createLocation = asyncHandler(async (req, res) => {
  const { siteCode, locationName, inspectionType = "Server Room", active = true } = req.body;

  if (!siteCode || !locationName) {
    return res.status(400).json({ message: "siteCode and locationName are required." });
  }

  const site = await Site.findOne({ _id: siteCode, owner: req.user.id });

  if (!site) {
    return res.status(404).json({ message: "Selected site was not found for this user." });
  }

  const location = await Location.create({
    owner: req.user.id,
    siteCode,
    locationName: String(locationName).trim(),
    inspectionType,
    active,
  });

  await AuditLog.create({
    user: req.user.id,
    action: "CREATE_LOCATION",
    entity: "Location",
    entityId: String(location._id),
  });

  return res.status(201).json(location);
});

module.exports = {
  listLocations,
  createLocation,
};
