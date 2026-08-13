const asyncHandler = require("../utils/asyncHandler");
const { getPeriodFromTime } = require("../utils/period");
const { sendInspectionSubmissionEmail } = require("../services/emailService");
const HealthSafetyInspection = require("../models/HealthSafetyInspection");
const Notification = require("../models/Notification");
const AuditLog = require("../models/AuditLog");

function deriveHealthSafetyStatus(inspectionType, formPayload = {}) {
  if (inspectionType === "FIRST_AID_BOX_CONTENTS_CHECKLIST") {
    const checklist = formPayload.checklist || {};
    const hasMissing = Object.values(checklist).some((isChecked) => !isChecked);
    return hasMissing ? "Amber" : "Green";
  }

  if (inspectionType === "VEHICLES_FORKLIFT_DAILY_INSPECTION") {
    const itemStatus = formPayload.itemStatus || {};
    const hasDefect = Object.values(itemStatus).some((status) => status === "DEF");
    return hasDefect ? "Amber" : "Green";
  }

  if (inspectionType === "FIRE_FIGHTING_EQUIPMENT_INSPECTION_REGISTER") {
    const deviations = formPayload.deviations || {};
    const sectionValues = [
      ...(Object.values(deviations.fireExtinguishers || {})),
      ...(Object.values(deviations.hoseReels || {})),
      ...(Object.values(deviations.hydrants || {})),
    ];

    const hasDeviation = sectionValues.some((value) => Boolean(String(value || "").trim()));
    return hasDeviation ? "Amber" : "Green";
  }

  return "Green";
}

function buildHealthSafetyEmailAnswers(inspectionType, formPayload = {}) {
  if (inspectionType === "FIRST_AID_BOX_CONTENTS_CHECKLIST") {
    const details = formPayload.details || {};
    const checklist = formPayload.checklist || {};
    const signatures = formPayload.signatures || {};

    const metadata = [
      { question: "Box No", result: "N/A", comment: details.boxNo || "", photoUrl: "" },
      { question: "Location", result: "N/A", comment: details.location || "", photoUrl: "" },
      { question: "First Aider", result: "N/A", comment: details.firstAider || "", photoUrl: "" },
      { question: "Year", result: "N/A", comment: details.year || "", photoUrl: "" },
      {
        question: "Signature: First Aider",
        result: "N/A",
        comment: signatures.firstAider || "",
        photoUrl: "",
      },
      {
        question: "Signature: Section 16(2)",
        result: "N/A",
        comment: signatures.section16_2 || "",
        photoUrl: "",
      },
    ];

    const checklistAnswers = Object.entries(checklist).map(([label, checked]) => ({
      question: label,
      result: checked ? "Pass" : "N/A",
      comment: checked ? "" : "Not checked/available at time of inspection.",
      photoUrl: "",
    }));

    return [...metadata, ...checklistAnswers];
  }

  if (inspectionType === "VEHICLES_FORKLIFT_DAILY_INSPECTION") {
    const details = formPayload.details || {};
    const itemStatus = formPayload.itemStatus || {};

    const metadata = [
      { question: "REG. No", result: "N/A", comment: details.regNo || "", photoUrl: "" },
      { question: "DATE FROM", result: "N/A", comment: details.dateFrom || "", photoUrl: "" },
      { question: "DATE TO", result: "N/A", comment: details.dateTo || "", photoUrl: "" },
      { question: "DRIVER", result: "N/A", comment: details.driver || "", photoUrl: "" },
      { question: "TIME Out", result: "N/A", comment: details.timeOut || "", photoUrl: "" },
      { question: "TIME In", result: "N/A", comment: details.timeIn || "", photoUrl: "" },
    ];

    const itemAnswers = Object.entries(itemStatus).map(([label, value]) => ({
      question: label,
      result: value === "OK" ? "Pass" : "N/A",
      comment: value === "DEF" ? "Marked DEF (Defective)." : "",
      photoUrl: "",
    }));

    return [...metadata, ...itemAnswers];
  }

  if (inspectionType === "FIRE_FIGHTING_EQUIPMENT_INSPECTION_REGISTER") {
    const details = formPayload.details || {};
    const deviations = formPayload.deviations || {};

    const metadata = [
      { question: "AREA", result: "N/A", comment: details.area || "", photoUrl: "" },
      { question: "INSPECTOR", result: "N/A", comment: details.inspector || "", photoUrl: "" },
      { question: "YEAR", result: "N/A", comment: details.year || "", photoUrl: "" },
    ];

    const sectionAnswers = [];

    for (const [sectionName, items] of Object.entries(deviations)) {
      for (const [itemLabel, code] of Object.entries(items || {})) {
        const hasCode = Boolean(String(code || "").trim());
        sectionAnswers.push({
          question: `${sectionName}: ${itemLabel}`,
          result: hasCode ? "N/A" : "Pass",
          comment: hasCode ? `Deviation ${code}` : "",
          photoUrl: "",
        });
      }
    }

    return [...metadata, ...sectionAnswers];
  }

  return [];
}

const listHealthSafetyInspections = asyncHandler(async (req, res) => {
  const { siteId, locationId, date, inspectionType } = req.query;
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
  if (inspectionType) {
    filter.inspectionType = inspectionType;
  }

  const inspections = await HealthSafetyInspection.find(filter)
    .populate("site", "siteCode siteName")
    .populate("location", "locationName inspectionType")
    .populate("employee", "username role")
    .sort({ createdAt: -1 });

  return res.json(inspections);
});

const createHealthSafetyInspection = asyncHandler(async (req, res) => {
  const { date, time, period, site, location, employee, inspectionType, formPayload = {} } = req.body;

  if (!date || !time || !period || !site || !location || !employee || !inspectionType || !formPayload) {
    return res.status(400).json({
      message: "date, time, period, site, location, employee, inspectionType, and formPayload are required.",
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

  const status = deriveHealthSafetyStatus(inspectionType, formPayload);

  const inspection = await HealthSafetyInspection.create({
    date,
    time,
    period,
    site,
    location,
    employee,
    inspectionType,
    formPayload,
    status,
  });

  const inspectionForEmail = await HealthSafetyInspection.findById(inspection._id)
    .populate("site", "siteCode siteName")
    .populate("location", "locationName")
    .populate("employee", "username");

  const emailAnswers = buildHealthSafetyEmailAnswers(inspectionType, formPayload);
  const displayType = inspectionType.replaceAll("_", " ");
  const emailInspection = {
    _id: inspection._id,
    date: inspection.date,
    time: inspection.time,
    period: inspection.period,
    status: inspection.status,
    type: `Health And Safety - ${displayType}`,
    answers: emailAnswers,
  };

  const emailMessage = [
    "New health and safety inspection submitted.",
    `Inspection ID: ${inspection._id}`,
    `Date: ${inspection.date}`,
    `Time: ${inspection.time}`,
    `Period: ${inspection.period}`,
    `Status: ${inspection.status}`,
    `Inspection Type: ${displayType}`,
  ].join("\n");

  let emailSent = false;
  try {
    const mailResult = await sendInspectionSubmissionEmail({
      subject: "InspectMe Health And Safety Submission",
      text: emailMessage,
      inspection: emailInspection,
      siteName: inspectionForEmail?.site?.siteName || "Unknown Site",
      locationName: inspectionForEmail?.location?.locationName || "Unknown Location",
      employeeName: inspectionForEmail?.employee?.username || "Unknown Inspector",
    });
    emailSent = Boolean(mailResult.sent);
  } catch (_error) {
    emailSent = false;
  }

  await Notification.create({
    healthSafetyInspectionId: inspection._id,
    type: "EMAIL",
    message: emailMessage,
    emailSent,
  });

  await AuditLog.create({
    user: req.user.id,
    action: "CREATE_HEALTH_SAFETY_INSPECTION",
    entity: "HealthSafetyInspection",
    entityId: String(inspection._id),
  });

  return res.status(201).json(inspection);
});

module.exports = {
  listHealthSafetyInspections,
  createHealthSafetyInspection,
};