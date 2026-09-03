const mongoose = require("mongoose");

const inspectionAnswerSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    result: {
      type: String,
      required: true,
      enum: ["Pass", "Fail", "N/A"],
    },
    comment: {
      type: String,
      trim: true,
      default: "",
    },
    photoUrl: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  }
);

inspectionAnswerSchema.pre("validate", function enforceFailRequirements(next) {
  if (this.result !== "Fail") {
    return next();
  }

  const hasComment = Boolean(this.comment && this.comment.trim().length > 0);
  const hasPhoto = Boolean(this.photoUrl && this.photoUrl.trim().length > 0);

  if (!hasComment || !hasPhoto) {
    return next(new Error("Fail results require both a comment and a photoUrl."));
  }

  return next();
});

const inspectionSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: false,
    },
    time: {
      type: String,
      required: false,
    },
    period: {
      type: String,
      required: false,
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
      required: false,
      index: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      default: "Server Room",
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    answers: {
      type: [inspectionAnswerSchema],
      required: false,
      default: [],
    },
    photos: {
      type: [String],
      default: [],
    },
    score: {
      type: Number,
    },
    status: {
      type: String,
      required: true,
      enum: ["Green", "Amber", "Red", "Completed", "Pending", "In Progress"],
      default: "Green",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

inspectionSchema.index({ date: 1, period: 1, site: 1, location: 1, employee: 1 });

module.exports = mongoose.model("Inspection", inspectionSchema);
