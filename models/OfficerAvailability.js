const mongoose = require("mongoose");

const officerAvailabilitySchema = new mongoose.Schema({
  officer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Officer",
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["Available", "On Leave"],
    default: "Available"
  },
  shift: {
    type: String,
    enum: ["Morning", "Afternoon", "Night", "All"],
    default: "All"
  }
}, { timestamps: true });

// Compound index to avoid duplicate availability entries for the same officer on the same date
officerAvailabilitySchema.index({ officer: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("OfficerAvailability", officerAvailabilitySchema);
