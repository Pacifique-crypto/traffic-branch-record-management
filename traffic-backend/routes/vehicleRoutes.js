const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");
const Vehicle = require("../models/Vehicle");

// GET ALL VEHICLES
router.get("/", verifyToken, authorizeRoles("oic", "admin"), async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REGISTER NEW VEHICLE
router.post("/", verifyToken, authorizeRoles("oic", "admin"), async (req, res) => {
  try {
    const { registrationNo, deptNo, vehicleType, assignedOfficer, status, submittedBy } = req.body;
    
    const existing = await Vehicle.findOne({ registrationNo });
    if (existing) {
      return res.status(400).json({ message: "Vehicle already registered with this Registration Number." });
    }

    const newVehicle = new Vehicle({
      ...req.body,
      assignedOfficer: assignedOfficer || "Unassigned",
      status: status || "PENDING",
      submittedBy: submittedBy || "IT Officer"
    });

    await newVehicle.save();
    res.status(201).json(newVehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE VEHICLE
router.put("/:id", verifyToken, authorizeRoles("oic", "admin"), async (req, res) => {
  try {
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedVehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE VEHICLE
router.delete("/:id", verifyToken, authorizeRoles("admin", "oic"), async (req, res) => {
  try {
    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ message: "Vehicle deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
