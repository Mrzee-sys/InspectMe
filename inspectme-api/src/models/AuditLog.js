const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    entity: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    entityId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
