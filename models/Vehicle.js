const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    registrationNo: {
      type: String,
      required: true,
      unique: true,
    },

    deptNo: {
      type: String,
      required: false,
      default: "N/A",
    },

    vehicleType: {
      type: String,
      required: true,
    },

    assignedOfficer: {
      type: String,
      default: "Unassigned",
    },

    status: {
      type: String,
      enum: [
        "Pending", "PENDING",
        "AVAILABLE", "Available",
        "MAINTENANCE", "Maintenance", "Under Maintenance", "UNDER MAINTENANCE",
        "OUT OF SERVICE", "Out of Service", "Out of Stock", "OUT OF STOCK",
        "Rejected", "Approved", "Active"
      ],
      default: "Pending",
    },

    submittedBy: {
      type: String,
      default: "IT Officer",
    },

    rejectionRemarks: {
      type: String,
      default: "",
    },

    chassisNo: String,
    engineNo: String,
    makeModel: String,
    year: Number,
    color: String,
    fuelType: String,
    engineCapacity: String,
    cylinders: Number,
    tyreSize: String,
    fuelTankCapacity: String,
    oilCapacity: String,
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    revenueLicenseExpiry: Date,
    insuranceExpiry: Date,
    emissionTestExpiry: Date,
    remarks: String,
    assignmentDate: Date,
    transferDate: Date,
    branch: {
      type: String,
      default: "Negombo Traffic Div."
    },
    pendingAssignedOfficer: {
      type: String,
      default: ""
    },
    pendingAssignmentType: {
      type: String,
      default: ""
    },
    pendingAssignmentDate: Date,
    assignmentApprovalStatus: {
      type: String,
      default: "NONE"
    },
    assignmentHistory: [
      {
        officerName: String,
        rank: String,
        policeId: String,
        assignedDate: String,
        returnDate: String,
        status: String,
      }
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
