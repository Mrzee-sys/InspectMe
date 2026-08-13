const mongoose = require("mongoose");

const healthSafetyInspectionSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    period: {
      type: String,
      required: true,
      enum: ["Morning", "Afternoon"],
    },
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
      required: true,
      index: true,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
      index: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    inspectionType: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "FIRST_AID_BOX_CONTENTS_CHECKLIST",
        "VEHICLES_FORKLIFT_DAILY_INSPECTION",
        "FIRE_FIGHTING_EQUIPMENT_INSPECTION_REGISTER",
      ],
      index: true,
    },
    formPayload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
    status: {
      type: String,
      required: true,
      enum: ["Green", "Amber", "Red"],
      default: "Green",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

healthSafetyInspectionSchema.index({ date: 1, period: 1, site: 1, location: 1, employee: 1 });

module.exports = mongoose.model("HealthSafetyInspection", healthSafetyInspectionSchema);