const express = require("express");
const router = express.Router();
const DemoDriverLicence = require("../models/DemoDriverLicence");

/**
 * GET /api/demo-driver-licences/verify/:licenceNumber
 * Verify a demo driving licence number and return driver details
 */
router.get("/verify/:licenceNumber", async (req, res) => {
  try {
    const { licenceNumber } = req.params;
    if (!licenceNumber) {
      return res.status(400).json({
        success: false,
        message: "Licence number is required"
      });
    }

    const cleanLicence = licenceNumber.trim();

    // Exact case-insensitive match on licenceNumber
    const driver = await DemoDriverLicence.findOne({
      licenceNumber: { $regex: new RegExp(`^${cleanLicence.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driving licence could not be verified"
      });
    }

    return res.json({
      success: true,
      driver: {
        licenceNumber: driver.licenceNumber,
        fullName: driver.fullName,
        address: driver.address,
        age: driver.age,
        licenceStatus: driver.licenceStatus
      }
    });
  } catch (error) {
    console.error("Error verifying demo licence:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during licence verification",
      error: error.message
    });
  }
});

/**
 * GET /api/demo-driver-licences
 * List all demo driver records (for verification & testing)
 */
router.get("/", async (req, res) => {
  try {
    const drivers = await DemoDriverLicence.find().sort({ licenceNumber: 1 });
    return res.json({
      success: true,
      count: drivers.length,
      drivers: drivers.map(d => ({
        licenceNumber: d.licenceNumber,
        fullName: d.fullName,
        address: d.address,
        age: d.age,
        licenceStatus: d.licenceStatus
      }))
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching demo driver records",
      error: error.message
    });
  }
});

module.exports = router;
