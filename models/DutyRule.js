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
  }
}, { timestamps: true });

module.exports = mongoose.model("DutyRule", dutyRuleSchema);
