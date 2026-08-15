const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");
const Vehicle = require("../models/Vehicle");

// Helper to safely format dates without throwing RangeError
const formatDateSafe = (dateVal) => {
  if (!dateVal) return new Date().toISOString().split("T")[0];
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toISOString().split("T")[0];
  } catch (e) {
    return String(dateVal);
  }
};

// GET ALL VEHICLES (Strict Real Database Data)
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
            assignedDate: formatDateSafe(req.body.registrationDate || new Date()),
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

    const newOfficer = req.body.assignedOfficer;
    const oldOfficer = existing.assignedOfficer;
    const nowStr = formatDateSafe(req.body.transferDate || req.body.assignmentDate || new Date());

    // Auto-update assignmentHistory array in MongoDB if assignedOfficer changes
    if (newOfficer !== undefined && newOfficer !== oldOfficer && !req.body.assignmentHistory) {
      let history = Array.isArray(existing.assignmentHistory) ? [...existing.assignmentHistory] : [];

      // 1. Mark any existing Active item as Completed
      history = history.map(item => {
        if (item.status === "Active" || item.returnDate === "--") {
          return { ...item, returnDate: nowStr, status: "Completed" };
        }
        return item;
      });

      // 2. Archive previous assigned officer if not already recorded in history as Completed
      if (oldOfficer && oldOfficer !== "Unassigned" && oldOfficer !== "Not Assigned") {
        const existsAsCompleted = history.some(h => h.officerName === oldOfficer && h.status === "Completed");
        if (!existsAsCompleted) {
          const assignDate = formatDateSafe(existing.assignmentDate || existing.createdAt || new Date());
          history.push({
            officerName: oldOfficer,
            assignedDate: assignDate,
            returnDate: nowStr,
            status: "Completed"
          });
        }
      }

      // 3. Add new assigned officer as Active
      if (newOfficer && newOfficer !== "Unassigned" && newOfficer !== "Not Assigned") {
        history.push({
          officerName: newOfficer,
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
    console.error("Error updating vehicle:", err);
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
