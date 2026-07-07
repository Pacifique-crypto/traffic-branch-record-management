 const mongoose = require("mongoose");
const AccidentSchema = new mongoose.Schema({
  accidentId:      { type: String, required: true, unique: true },
  date:            { type: String, required: true },
  time:            { type: String },
  location:        { type: String, required: true },
  type:            { type: String },
  severity:        { type: String, enum: ["High", "Medium", "Low"] },
  reportingOffice: { type: String, default: "Negombo" },
  driver:  { name: String, badge: String, phone: String },
  vehicle: { plate: String, make: String, model: String, vin: String },
  evidence: [String],
}, { timestamps: true });
module.exports = mongoose.model("Accident", AccidentSchema);