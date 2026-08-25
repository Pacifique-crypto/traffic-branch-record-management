const mongoose = require("mongoose");

const demoDriverLicenceSchema = new mongoose.Schema(
  {
    licenceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      default: "",
      trim: true
    },
    age: {
      type: Number,
      required: true
    },
    nic: {
      type: String,
      required: true,
      trim: true
    },
    licenceStatus: {
      type: String,
      default: "Valid",
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DemoDriverLicence", demoDriverLicenceSchema);
