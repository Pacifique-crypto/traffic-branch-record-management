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
      required: true,
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
      enum: ["AVAILABLE", "MAINTENANCE", "OUT OF SERVICE"],
      default: "AVAILABLE",
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
    branch: {
      type: String,
      default: "Negombo Traffic Div."
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
