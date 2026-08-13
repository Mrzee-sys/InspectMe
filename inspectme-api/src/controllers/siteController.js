const asyncHandler = require("../utils/asyncHandler");
const Site = require("../models/Site");
const AuditLog = require("../models/AuditLog");

const listSites = asyncHandler(async (req, res) => {
  const sites = await Site.find({ owner: req.user.id }).sort({ siteCode: 1 });
  return res.json(sites);
});

const createSite = asyncHandler(async (req, res) => {
  const { siteCode, siteName } = req.body;

  if (!siteCode || !siteName) {
    return res.status(400).json({ message: "siteCode and siteName are required." });
  }

  const site = await Site.create({
    owner: req.user.id,
    siteCode: String(siteCode).toUpperCase().trim(),
    siteName: String(siteName).trim(),
  });

  await AuditLog.create({
    user: req.user.id,
    action: "CREATE_SITE",
    entity: "Site",
    entityId: String(site._id),
  });

  return res.status(201).json(site);
});

module.exports = {
  listSites,
  createSite,
};
