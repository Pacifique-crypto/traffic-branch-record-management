const mongoose = require("mongoose");
const { DUTY_TYPES } = require("../config/rosterConfig");

const dutyAssignmentSchema = new mongoose.Schema(
  {
    roster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DutyRoster",
      required: true
    },
    officer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Officer",
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    dutyType: {
      type: String,
      required: true,
      trim: true
    },
    specialDutyText: {
      type: String,
      default: "",
      trim: true
    },
    shift: {
      type: String,
      required: true,
      trim: true
    },
    startTime: {
      type: String,
      default: "06:00"
    },
    endTime: {
      type: String,
      default: "14:00"
    },
    location: {
      type: String,
      default: "Main Station / Field",
      trim: true
    },
    status: {
      type: String,
      enum: ["ASSIGNED", "CONFIRMED", "CANCELLED"],
      default: "ASSIGNED"
    },
    requiredOfficerCount: {
      type: Number,
      default: 1
    },
    remarks: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for fast lookup and validations
dutyAssignmentSchema.index({ officer: 1, date: 1 });
dutyAssignmentSchema.index({ roster: 1, date: 1 });
dutyAssignmentSchema.index({ date: 1, dutyType: 1 });

module.exports = mongoose.model("DutyAssignment", dutyAssignmentSchema);
