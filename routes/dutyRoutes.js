const express = require("express");
const router = express.Router();

// ==========================================
// DEMO DRIVER LICENCE VERIFICATION API (FALLBACK ROUTE)
// Preserved for Accident & Violation licence verification
// ==========================================
router.get("/demo-driver-licences/verify/:licenceNumber", async (req, res) => {
  try {
    const DemoDriverLicence = require("../models/DemoDriverLicence");
    const licenceNumber = (req.params.licenceNumber || "").trim();
    const driver = await DemoDriverLicence.findOne({ licenceNumber: new RegExp(`^${licenceNumber}$`, "i") });

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
        nic: driver.nic,
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

module.exports = router;
