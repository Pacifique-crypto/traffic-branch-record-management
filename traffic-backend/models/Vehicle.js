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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
