const mongoose = require("mongoose");

const violationSchema = new mongoose.Schema({

  violationType: {
    type: String,
    required: true,
  },

  driver: {
    type: String,
    required: true,
  },

  driverNIC: {
    type: String,
    required: true,
  },

  vehicle: {
    type: String,
    required: true,
  },

  vehicleType: {
    type: String,
    required: true,
  },

  location: {
    type: String,
    required: true,
  },

  violationDate: {
    type: String,
    required: true,
  },

  fineAmount: {
    type: Number,
    required: true,
  },

  remarks: {
    type: mongoose.Schema.Types.Mixed,
    default: "",
  },

  evidencePhoto: {
    type: mongoose.Schema.Types.Mixed,
    default: [],
  },

  voiceNote: {
    type: String,
    default: "",
  },

  attachment: {
    type: String,
    default: "",
  },

  status: {
    type: String,
    default: "Pending",
  },

}, {
  timestamps: true,
});

module.exports = mongoose.model("Violation", violationSchema);