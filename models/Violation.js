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

  assistantOfficer: {
    type: String,
    default: "",
  },

  submittingOfficer: {
    type: String,
    default: "",
  },

  lawSection: {
    type: String,
    default: "",
  },

  actionTaken: {
    type: String,
    default: "",
  },

  driverAddress: {
    type: String,
    default: "",
  },

  drivingLicence: {
    type: String,
    default: "",
  },

  referenceNumber: {
    type: String,
    unique: true,
  },

}, {
  timestamps: true,
});

violationSchema.index({ createdAt: -1 });

violationSchema.pre("save", async function() {
  if (!this.referenceNumber) {
    const count = await mongoose.model("Violation").countDocuments();
    this.referenceNumber = `VO-${1020 + count + 1}`;
  }
});

module.exports = mongoose.model("Violation", violationSchema);