const mongoose = require("mongoose");

const officerAvailabilitySchema = new mongoose.Schema({
  officer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Officer",
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  leaveType: {
    type: String,
    required: true
  },
  remarks: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending"
  },
  medicalCertificateUrl: {
    type: String,
    default: ""
  },
  actingOfficer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Officer",
    required: false
  },
  handoverNotes: {
    type: String,
    default: ""
  },
  contactNo: {
    type: String,
    default: ""
  },
  address: {
    type: String,
    default: ""
  },
  duration: {
    type: Number,
    default: 1
  },
  supportingDocuments: [
    {
      fileName: { type: String, default: "" },
      fileUrl: { type: String, default: "" },
      mimeType: { type: String, default: "" }
    }
  ],
  rejectionRemarks: {
    type: String,
    default: ""
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: false
  }
}, { timestamps: true });

// Compound index for querying officer leave periods
officerAvailabilitySchema.index({ officer: 1, startDate: 1, endDate: 1 });

const OfficerAvailability = mongoose.model("OfficerAvailability", officerAvailabilitySchema);

// Auto-drop legacy `officer_1_date_1` index if it exists in MongoDB Atlas/collection
OfficerAvailability.on("index", async () => {
  try {
    const indexes = await OfficerAvailability.collection.indexes();
    if (indexes.some(idx => idx.name === "officer_1_date_1")) {
      await OfficerAvailability.collection.dropIndex("officer_1_date_1");
      console.log("Legacy index officer_1_date_1 dropped from MongoDB collection! ✅");
    }
  } catch (err) {
    // Ignore error if index is already absent or during initial connection
  }
});

module.exports = OfficerAvailability;
