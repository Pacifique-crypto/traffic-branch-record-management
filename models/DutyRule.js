const mongoose = require("mongoose");

const dutyRuleSchema = new mongoose.Schema({
  location: {
    type: String,
    required: true
  },
  dutyType: {
    type: String,
    required: true
  },
  requiredOfficers: {
    type: Number,
    required: true,
    default: 1
  },
  minRank: {
    type: String,
    enum: ["Constable", "Sergeant", "Sub-Inspector", "Inspector"],
    default: "Constable"
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium"
  },
  shift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shift"
  },
  requiresVehicle: {
    type: Boolean,
    default: false
  },
  vehicleType: {
    type: String,
    default: ""
  },
  maxConsecutiveAssignments: {
    type: Number,
    default: 3,
    min: 1,
    max: 7
  }
}, { timestamps: true });

module.exports = mongoose.model("DutyRule", dutyRuleSchema);
