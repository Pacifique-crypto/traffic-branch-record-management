const mongoose = require("mongoose");

const officerAvailabilitySchema = new mongoose.Schema({
  officer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Officer",
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  leaveType: {
    type: String,
    required: true
  },
  remarks: {
    type: String,
    default: ""
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true
  }
}, { timestamps: true });

// Compound index for querying officer leave periods
officerAvailabilitySchema.index({ officer: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model("OfficerAvailability", officerAvailabilitySchema);

