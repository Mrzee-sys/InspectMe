const mongoose = require("mongoose");

const siteSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    siteCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 20,
    },
    siteName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
  },
  {
    versionKey: false,
  }
);

siteSchema.index({ owner: 1, siteCode: 1 }, { unique: true });

module.exports = mongoose.model("Site", siteSchema);
