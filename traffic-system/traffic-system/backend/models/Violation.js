 const mongoose = require("mongoose");
const ViolationSchema = new mongoose.Schema({
  violationId:     { type: String, required: true, unique: true },
  date:            { type: String, required: true },
  time:            String, location: { type: String, required: true },
  type:            String,
  status:          { type: String, enum: ["Pending","Paid"], default: "Pending" },
  fine:            String, reportingOffice: { type: String, default: "Negombo" },
  driver:  { name: String, nic: String, phone: String },
  vehicle: { plate: String, make: String, model: String, vin: String },
  officer: { name: String, badge: String, station: String },
  evidence: [String],
}, { timestamps: true });
module.exports = mongoose.model("Violation", ViolationSchema);