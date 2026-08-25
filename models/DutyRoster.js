const mongoose = require("mongoose");

const dutyAssignmentSchema = new mongoose.Schema({
  officer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Officer",
    required: true
  },
  officerName: String,
  officerRank: String,
  officerPoliceId: String,
  location: {
    type: String,
    required: true
  },
  dutyType: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  shift: {
    type: String,
    required: true
  },
  aiRecommendationReason: {
    type: String,
    default: ""
  }
});

const dutyRosterSchema = new mongoose.Schema({
  rosterType: {
    type: String,
    enum: ["Daily", "Weekly"],
    required: true
  },
  status: {
    type: String,
    enum: ["Draft", "Pending Approval", "Approved", "Rejected", "Published"],
    default: "Draft"
  },
  date: Date, // For daily rosters
  weekStart: Date, // For weekly rosters
  weekEnd: Date, // For weekly rosters
  shift: String, // For daily rosters (Morning, Afternoon, Night)
  createdBy: {
    type: String,
    required: true
  },
  approvedBy: String,
  publishedDate: Date,
}, { timestamps: true });

// Indexes for high-performance roster filtering and officer mobile app queries
dutyRosterSchema.index({ status: 1, rosterType: 1 });
dutyRosterSchema.index({ weekStart: 1, weekEnd: 1 });
dutyRosterSchema.index({ date: 1 });
dutyRosterSchema.index({ "assignments.officer": 1, status: 1 });

module.exports = mongoose.model("DutyRoster", dutyRosterSchema);
