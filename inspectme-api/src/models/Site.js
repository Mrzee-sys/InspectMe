const mongoose = require("mongoose");

const siteSchema = new mongoose.Schema(
  {
    siteCode: {
      type: String,
      required: true,
      unique: true,
      enum: ["JNB", "DBN", "CPT"],
      uppercase: true,
      trim: true,
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

module.exports = mongoose.model("Site", siteSchema);
