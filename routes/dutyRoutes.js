const express = require("express");
const router = express.Router();
const DutyRule = require("../models/DutyRule");
const DutyRoster = require("../models/DutyRoster");
const OfficerAvailability = require("../models/OfficerAvailability");
const Officer = require("../models/Officer");
const Shift = require("../models/Shift");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");

// ==========================================
// DUTY SHIFTS CRUD
// ==========================================
router.get("/shifts", verifyToken, async (req, res) => {
  try {
    let list = await Shift.find({ isActive: true });
    if (list.length === 0) {
      console.log("No shifts found. Seeding Sri Lanka Traffic Police Shifts on the fly...");
      list = await Shift.insertMany([
        { name: "Full Day Duty", startTime: "06:00", endTime: "18:00", description: "Traffic Control and General Duties", isActive: true },
        { name: "Early Motorcycle Patrol", startTime: "06:00", endTime: "14:00", description: "Motorcycle Patrol (Morning)", isActive: true },
        { name: "Late Motorcycle Patrol", startTime: "14:00", endTime: "22:00", description: "Motorcycle Patrol (Evening)", isActive: true },
        { name: "Evening Duty", startTime: "14:00", endTime: "22:00", description: "Traffic Control (Evening Peak)", isActive: true },
        { name: "Night Duty", startTime: "18:00", endTime: "06:00", description: "Night Patrol and Security Checks", isActive: true }
      ]);
    }
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/shifts", verifyToken, authorizeRoles("admin", "it officer"), async (req, res) => {
  try {
    const { name, startTime, endTime, description, isActive } = req.body;
    const shift = new Shift({ name, startTime, endTime, description, isActive });
    await shift.save();
    res.status(201).json(shift);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/shifts/:id", verifyToken, authorizeRoles("admin", "it officer"), async (req, res) => {
  try {
    const { name, startTime, endTime, description, isActive } = req.body;
    const shift = await Shift.findByIdAndUpdate(
      req.params.id,
      { name, startTime, endTime, description, isActive },
      { new: true }
    );
    res.json(shift);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/shifts/:id", verifyToken, authorizeRoles("admin", "it officer"), async (req, res) => {
  try {
    await Shift.findByIdAndDelete(req.params.id);
    res.json({ message: "Shift deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// DUTY RULES CRUD
// ==========================================
router.get("/rules", verifyToken, async (req, res) => {
  try {
    const rules = await DutyRule.find({}).populate("shift");
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/rules", verifyToken, authorizeRoles("admin", "it officer"), async (req, res) => {
  try {
    const { location, dutyType, requiredOfficers, minRank, priority, shift, requiresVehicle, vehicleType, maxConsecutiveAssignments } = req.body;
    const rule = new DutyRule({
      location,
      dutyType,
      requiredOfficers: Number(requiredOfficers),
      minRank,
      priority,
      shift: shift || null,
      requiresVehicle: Boolean(requiresVehicle),
      vehicleType: vehicleType || "",
      maxConsecutiveAssignments: Number(maxConsecutiveAssignments || 3)
    });
    await rule.save();
    const populatedRule = await DutyRule.findById(rule._id).populate("shift");
    res.status(201).json(populatedRule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/rules/:id", verifyToken, authorizeRoles("admin", "it officer"), async (req, res) => {
  try {
    const { location, dutyType, requiredOfficers, minRank, priority, shift, requiresVehicle, vehicleType, maxConsecutiveAssignments } = req.body;
    const rule = await DutyRule.findByIdAndUpdate(
      req.params.id,
      {
        location,
        dutyType,
        requiredOfficers: Number(requiredOfficers),
        minRank,
        priority,
        shift: shift || null,
        requiresVehicle: Boolean(requiresVehicle),
        vehicleType: vehicleType || "",
        maxConsecutiveAssignments: Number(maxConsecutiveAssignments || 3)
      },
      { new: true }
    ).populate("shift");
    res.json(rule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/rules/:id", verifyToken, authorizeRoles("admin", "it officer"), async (req, res) => {
  try {
    await DutyRule.findByIdAndDelete(req.params.id);
    res.json({ message: "Rule deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// OFFICER AVAILABILITY (LEAVE MANAGEMENT)
// ==========================================
router.get("/availability", verifyToken, async (req, res) => {
  try {
    const list = await OfficerAvailability.find({}).populate("officer", "fullName policeId rank");
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/availability", verifyToken, async (req, res) => {
  try {
    const { officerId, date, status, shift } = req.body;
    const availability = await OfficerAvailability.findOneAndUpdate(
      { officer: officerId, date: new Date(date) },
      { officer: officerId, date: new Date(date), status, shift: shift || "All" },
      { upsert: true, new: true }
    );
    res.json(availability);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// DUTY ROSTERS API
// ==========================================

// Get all rosters
router.get("/rosters", verifyToken, async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.rosterType) query.rosterType = req.query.rosterType;

    const rosters = await DutyRoster.find(query)
      .sort({ createdAt: -1 })
      .populate("assignments.officer", "fullName policeId rank");
    res.json(rosters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single roster
router.get("/rosters/:id", verifyToken, async (req, res) => {
  try {
    const roster = await DutyRoster.findById(req.params.id)
      .populate("assignments.officer", "fullName policeId rank");
    if (!roster) return res.status(404).json({ message: "Roster not found" });
    res.json(roster);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create/save Roster
router.post("/rosters", verifyToken, authorizeRoles("admin", "it officer"), async (req, res) => {
  try {
    const { rosterType, status, date, weekStart, weekEnd, shift, assignments } = req.body;

    const roster = new DutyRoster({
      rosterType,
      status: status || "Draft",
      date,
      weekStart,
      weekEnd,
      shift,
      createdBy: req.user.username,
      assignments
    });

    await roster.save();
    res.status(201).json(roster);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update Roster
router.put("/rosters/:id", verifyToken, async (req, res) => {
  try {
    const { status, assignments, approvedBy, rejectionRemarks } = req.body;
    
    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === "Approved") {
        updateData.approvedBy = req.user.username;
      }
      if (status === "Published") {
        updateData.publishedDate = new Date();
      }
    }
    if (rejectionRemarks !== undefined) {
      updateData.rejectionRemarks = rejectionRemarks;
    }
    if (assignments) {
      updateData.assignments = assignments;
    }

    const roster = await DutyRoster.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(roster);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Roster
router.delete("/rosters/:id", verifyToken, authorizeRoles("admin", "it officer", "oic"), async (req, res) => {
  try {
    const deleted = await DutyRoster.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Roster not found" });
    res.json({ message: "Roster deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// MOBILE APP ASSIGNED DUTIES ENDPOINT
// ==========================================
router.get("/officer/:policeId", verifyToken, async (req, res) => {
  try {
    const officer = await Officer.findOne({ policeId: req.params.policeId });
    if (!officer) return res.status(404).json({ message: "Officer not found" });

    const rosters = await DutyRoster.find({
      status: "Published",
      "assignments.officer": officer._id
    }).sort({ createdAt: -1 });

    const officerDuties = [];
    rosters.forEach(r => {
      if (Array.isArray(r.assignments)) {
        r.assignments.forEach(asg => {
          if (asg && asg.officer && asg.officer.toString() === officer._id.toString()) {
            officerDuties.push({
              id: asg._id,
              rosterId: r._id,
              rosterType: r.rosterType,
              location: asg.location,
              dutyType: asg.dutyType,
              date: asg.date,
              shift: asg.shift,
              publishedDate: r.publishedDate
            });
          }
        });
      }
    });

    res.json(officerDuties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
