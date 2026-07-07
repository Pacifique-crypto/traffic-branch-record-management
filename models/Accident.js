const mongoose = require("mongoose");

const accidentSchema = new mongoose.Schema({

  severity: {
    type: String,
    required: true,
  },

  driver: {
    type: String,
    required: true,
  },

  location: {
    type: String,
    required: true,
  },

  accidentDate: {
    type: String,
    required: true,
  },

  vehicle: {
    type: String,
    required: true,
  },

  evidencePhoto: {
    type: String,
    default: "",
  },

  officer: {
    type: String,
    default: "",
  },

  status: {
    type: String,
    default: "Pending",
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("Accident", accidentSchema);