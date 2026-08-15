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
    const { registrationNo, vehicleType, assignedOfficer, status, submittedBy } = req.body;
    
    const existing = await Vehicle.findOne({ registrationNo });
    if (existing) {
      return res.status(400).json({ message: "Vehicle already registered with this Registration Number." });
    }

    const isOfficerAssigned = Boolean(
      assignedOfficer && assignedOfficer !== "Unassigned" && assignedOfficer !== "Not Assigned"
    );

    const initialHistory = isOfficerAssigned
      ? [
          {
            officerName: assignedOfficer,
            assignedDate: req.body.registrationDate || new Date().toISOString().split("T")[0],
            returnDate: "--",
            status: "Active"
          }
        ]
      : [];

    const newVehicle = new Vehicle({
      ...req.body,
      deptNo: req.body.deptNo || req.body.registrationNo || "N/A",
      assignedOfficer: assignedOfficer || "Unassigned",
      status: status || "PENDING",
      submittedBy: submittedBy || "IT Officer",
      assignmentHistory: req.body.assignmentHistory || initialHistory
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
    const existing = await Vehicle.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    let updateData = { ...req.body };

    // Auto-update assignmentHistory array if assignedOfficer changes and assignmentHistory not explicitly provided
    if (
      req.body.assignedOfficer !== undefined &&
      req.body.assignedOfficer !== existing.assignedOfficer &&
      !req.body.assignmentHistory
    ) {
      let history = Array.isArray(existing.assignmentHistory) ? [...existing.assignmentHistory] : [];
      const nowStr = req.body.transferDate || req.body.assignmentDate || new Date().toISOString().split("T")[0];

      // Mark current active assignment in history as completed
      history = history.map(item => {
        if (item.status === "Active") {
          return { ...item, returnDate: nowStr, status: "Completed" };
        }
        return item;
      });

      // If previous assignedOfficer existed but wasn't recorded in history, record as completed
      if (
        existing.assignedOfficer &&
        existing.assignedOfficer !== "Unassigned" &&
        existing.assignedOfficer !== "Not Assigned"
      ) {
        const alreadyInHistory = history.some(h => h.officerName === existing.assignedOfficer);
        if (!alreadyInHistory) {
          const assignDate = existing.assignmentDate
            ? new Date(existing.assignmentDate).toISOString().split("T")[0]
            : (existing.createdAt ? new Date(existing.createdAt).toISOString().split("T")[0] : nowStr);
          history.push({
            officerName: existing.assignedOfficer,
            assignedDate: assignDate,
            returnDate: nowStr,
            status: "Completed"
          });
        }
      }

      // Append new active assignment if assignedOfficer is not Unassigned
      if (
        req.body.assignedOfficer &&
        req.body.assignedOfficer !== "Unassigned" &&
        req.body.assignedOfficer !== "Not Assigned"
      ) {
        history.push({
          officerName: req.body.assignedOfficer,
          assignedDate: nowStr,
          returnDate: "--",
          status: "Active"
        });
      }

      updateData.assignmentHistory = history;
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      updateData,
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
