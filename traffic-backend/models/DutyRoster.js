const mongoose = require("mongoose");
const { ROSTER_STATUSES } = require("../config/rosterConfig");

const dutyRosterSchema = new mongoose.Schema(
  {
    rosterReference: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    title: {
      type: String,
      default: ""
    },
    weekStart: {
      type: Date,
      required: true
    },
    weekEnd: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(ROSTER_STATUSES),
      default: ROSTER_STATUSES.DRAFT,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Officer",
      required: false
    },
    submittedAt: {
      type: Date
    },
    approvedAt: {
      type: Date
    },
    publishedAt: {
      type: Date
    },
    oicComment: {
      type: String,
      default: ""
    },
    rejectionReason: {
      type: String,
      default: ""
    },
    notes: {
      type: String,
      default: ""
    },
    conflicts: [
      {
        type: String
      }
    ],
    regularDuties: {
      type: mongoose.Schema.Types.Mixed,
      default: []
    },
    specialDuties: {
      type: mongoose.Schema.Types.Mixed,
      default: []
    },
    courtDutyOfficers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Officer"
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual relationship to DutyAssignment
dutyRosterSchema.virtual("assignments", {
  ref: "DutyAssignment",
  localField: "_id",
  foreignField: "roster"
});

// Index for efficient week range and status querying
dutyRosterSchema.index({ weekStart: 1, weekEnd: 1, status: 1 });

module.exports = mongoose.model("DutyRoster", dutyRosterSchema);
