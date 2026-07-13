const mongoose = require("mongoose");

const accidentSchema = new mongoose.Schema(

{
  // ===========================
  // ACCIDENT DETAILS
  // ===========================

  accidentDate: {
    type: String,
    required: true,
  },

  station: {
    type: String,
    required: true,
  },

  location: {
    type: String,
    required: true,
  },

  assistantOfficer: {
    type: String,
    default: "",
  },

  // ===========================
  // VEHICLE DETAILS
  // ===========================

  vehicleNumber: {
    type: String,
    required: true,
  },

  vehicleClass: {
    type: String,
    required: true,
  },

  vehicleAge: {
    type: Number,
    default: 0,
  },

  // ===========================
  // DRIVER DETAILS
  // ===========================

  driverName: {
    type: String,
    required: true,
  },

  driverAddress: {
    type: String,
    default: "",
  },

  driverAge: {
    type: Number,
    default: 0,
  },

  drivingLicence: {
    type: String,
    default: "",
  },

  // ===========================
  // CASUALTY DETAILS
  // ===========================

  casualtyName: {
    type: String,
    default: "",
  },

  casualtyAddress: {
    type: String,
    default: "",
  },

  casualtyAge: {
    type: Number,
    default: 0,
  },

  casualtyGender: {
    type: String,
    enum: ["Male", "Female", "Other", ""],
    default: "",
  },

  casualtyStatus: {
    type: String,
    enum: ["Killed", "Injured", ""],
    default: "",
  },

  // ===========================
  // DESCRIPTION
  // ===========================

  description: {
    type: String,
    default: "",
  },

  // ===========================
  // EVIDENCE
  // ===========================

  evidencePhoto: {
    type: String,
    default: "",
  },

  attachment: {
    type: String,
    default: "",
  },

  voiceNote: {
    type: String,
    default: "",
  },

  // ===========================
  // RECORD STATUS
  // ===========================

  status: {
    type: String,
    enum: [
      "Pending",
      "Under Investigation",
      "Completed",
    ],
    default: "Pending",
  },

  severity: {
    type: String,
    enum: [
      "FATAL",
      "SERIOUS",
      "MINOR",
      "PROPERTY",
      ""
    ],
    default: "MINOR",
  },

},

{
  timestamps: true,
}

);

module.exports = mongoose.model(
  "Accident",
  accidentSchema
);