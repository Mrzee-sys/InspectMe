const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    inspectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inspection",
      required: false,
      index: true,
    },
    healthSafetyInspectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HealthSafetyInspection",
      required: false,
      index: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      enum: ["EMAIL", "SYSTEM"],
      default: "EMAIL",
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
