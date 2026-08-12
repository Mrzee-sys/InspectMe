const asyncHandler = require("../utils/asyncHandler");
const { getPeriodFromTime } = require("../utils/period");
const { sendInspectionSubmissionEmail } = require("../services/emailService");
const Inspection = require("../models/Inspection");
const Notification = require("../models/Notification");
const AuditLog = require("../models/AuditLog");

function deriveStatusFromAnswers(answers) {
  const hasFail = answers.some((answer) => answer.result === "Fail");
  return hasFail ? "Amber" : "Green";
}

const listInspections = asyncHandler(async (req, res) => {
  const { siteId, locationId, date } = req.query;
  const filter = {};

  if (siteId) {
    filter.site = siteId;
  }
  if (locationId) {
    filter.location = locationId;
  }
  if (date) {
    filter.date = date;
  }

  const inspections = await Inspection.find(filter)
    .populate("site", "siteCode siteName")
    .populate("location", "locationName inspectionType")
    .populate("employee", "username role")
    .sort({ createdAt: -1 });

  return res.json(inspections);
});

const createInspection = asyncHandler(async (req, res) => {
  const { date, time, period, site, location, type = "Server Room", employee, answers = [], photos = [] } = req.body;

  if (!date || !time || !period || !site || !location || !employee || !Array.isArray(answers)) {
    return res.status(400).json({
      message: "date, time, period, site, location, employee, and answers are required.",
    });
  }

  const expectedPeriod = getPeriodFromTime(time);
  if (!expectedPeriod) {
    return res.status(400).json({
      message: "Inspection time must be between 06:00 and 18:00 local time.",
    });
  }

  if (period !== expectedPeriod) {
    return res.status(400).json({
      message: `Period does not match time. Expected ${expectedPeriod}.`,
    });
  }

  const status = deriveStatusFromAnswers(answers);

  const inspection = await Inspection.create({
    date,
    time,
    period,
    site,
    location,
    type,
    employee,
    answers,
    photos,
    status,
  });

  const inspectionForEmail = await Inspection.findById(inspection._id)
    .populate("site", "siteCode siteName")
    .populate("location", "locationName")
    .populate("employee", "username");

  const emailMessage = [
    "New inspection submitted.",
    `Inspection ID: ${inspection._id}`,
    `Date: ${inspection.date}`,
    `Time: ${inspection.time}`,
    `Period: ${inspection.period}`,
    `Status: ${inspection.status}`,
  ].join("\n");

  let emailSent = false;
  try {
    const mailResult = await sendInspectionSubmissionEmail({
      subject: "InspectMe Inspection Submission",
      text: emailMessage,
      inspection: inspectionForEmail,
      siteName: inspectionForEmail?.site?.siteName || "Unknown Site",
      locationName: inspectionForEmail?.location?.locationName || "Unknown Location",
      employeeName: inspectionForEmail?.employee?.username || "Unknown Inspector",
    });
    emailSent = Boolean(mailResult.sent);
  } catch (_error) {
    emailSent = false;
  }

  await Notification.create({
    inspectionId: inspection._id,
    type: "EMAIL",
    message: emailMessage,
    emailSent,
  });

  await AuditLog.create({
    user: req.user.id,
    action: "CREATE_INSPECTION",
    entity: "Inspection",
    entityId: String(inspection._id),
  });

  return res.status(201).json(inspection);
});

module.exports = {
  listInspections,
  createInspection,
};
