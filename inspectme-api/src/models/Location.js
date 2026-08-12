const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    siteCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
      required: true,
      index: true,
    },
    locationName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    inspectionType: {
      type: String,
      required: true,
      trim: true,
      default: "Server Room",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    versionKey: false,
  }
);

locationSchema.index({ siteCode: 1, locationName: 1 }, { unique: true });

module.exports = mongoose.model("Location", locationSchema);
