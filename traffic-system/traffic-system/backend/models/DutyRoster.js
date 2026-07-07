 const mongoose = require("mongoose");
const DutyRosterSchema = new mongoose.Schema({
  shift:     { type: String, required: true },
  officerId: { type: String, required: true },
  location:  { type: String, required: true },
  date:      { type: String, required: true },
  week:      String, status: { type: String, default: "Active" },
}, { timestamps: true });
module.exports = mongoose.model("DutyRoster", DutyRosterSchema);