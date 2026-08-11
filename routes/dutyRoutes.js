const express = require("express");
const router = express.Router();
const DutyRule = require("../models/DutyRule");
const DutyRoster = require("../models/DutyRoster");
const OfficerAvailability = require("../models/OfficerAvailability");
const Officer = require("../models/Officer");
const Shift = require("../models/Shift");
const Vehicle = require("../models/Vehicle");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");
const { recommendOfficer } = require("../services/AIRecommendationService");

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
    const rules = await DutyRule.find({});
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
      shift: shift || "Morning (06:00 - 14:00)",
      requiresVehicle: Boolean(requiresVehicle),
      vehicleType: vehicleType || "",
      maxConsecutiveAssignments: Number(maxConsecutiveAssignments || 3)
    });
    await rule.save();
    res.status(201).json(rule);
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
        shift: shift || "Morning (06:00 - 14:00)",
        requiresVehicle: Boolean(requiresVehicle),
        vehicleType: vehicleType || "",
        maxConsecutiveAssignments: Number(maxConsecutiveAssignments || 3)
      },
      { new: true }
    );
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
    // status: 'Available', 'On Leave'
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
// DUTY ROSTERS & AI GENERATION ENGINE
// ==========================================

// Get all rosters (with filters)
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

// Helper: Rank values hierarchy for scoring
const RANK_HIERARCHY = {
  "Constable": 1,
  "Sergeant": 2,
  "Sub-Inspector": 3,
  "Inspector": 4
};

// AI RECOMMENDATION ENGINE (Rule-Based Generator)
router.post("/rosters/generate", verifyToken, authorizeRoles("admin", "it officer"), async (req, res) => {
  try {
    const { rosterType, date, shift, weekStart, weekEnd, enableAI } = req.body;

    const activeOfficers = await Officer.find({ status: { $ne: "Pending" } });
    let rules = await DutyRule.find({});
    const activeShifts = await Shift.find({ isActive: true });
    
    if (rules.length === 0) {
      rules = [
        { location: "Negombo Clock Tower Junction", dutyType: "Traffic Control", requiredOfficers: 2, minRank: "Constable", priority: "High" },
        { location: "Beach Road Tourism Zone", dutyType: "Patrol Duty", requiredOfficers: 2, minRank: "Constable", priority: "Medium" },
        { location: "Colombo-Chilaw Highway (A3)", dutyType: "Speed Check & Inspection", requiredOfficers: 2, minRank: "Sergeant", priority: "High" },
        { location: "Kochchikade Bridge Checkpoint", dutyType: "Security Checkpoint", requiredOfficers: 1, minRank: "Constable", priority: "Medium" }
      ];
    }

    const assignments = [];
    const dateRange = [];

    if (rosterType === "Daily") {
      dateRange.push(new Date(date));
    } else {
      // Weekly: generate array of 7 dates
      const start = new Date(weekStart);
      const end = new Date(weekEnd);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dateRange.push(new Date(d));
      }
    }

    // Keep track of assignments in-memory during generator run to check workload
    // Key format: officerId -> Count of shifts assigned during this generator run
    const weeklyWorkload = {};
    activeOfficers.forEach(o => {
      weeklyWorkload[o._id.toString()] = 0;
    });

    // Fetch existing published/approved assignments in this range to populate workload
    const rangeStart = dateRange[0];
    const rangeEnd = dateRange[dateRange.length - 1];
    const rangeStartDay = new Date(rangeStart);
    rangeStartDay.setHours(0, 0, 0, 0);
    const rangeEndDay = new Date(rangeEnd);
    rangeEndDay.setHours(23, 59, 59, 999);

    const existingRosters = await DutyRoster.find({
      status: { $in: ["Approved", "Published"] },
      $or: [
        { date: { $gte: rangeStartDay, $lte: rangeEndDay } },
        { weekStart: { $gte: rangeStartDay }, weekEnd: { $lte: rangeEndDay } }
      ]
    });

    existingRosters.forEach(r => {
      r.assignments.forEach(asg => {
        if (asg.officer) {
          const offIdStr = asg.officer.toString();
          if (weeklyWorkload[offIdStr] !== undefined) {
            weeklyWorkload[offIdStr] += 1;
          }
        }
      });
    });

    // Custom availabilities / leaves
    const leaves = await OfficerAvailability.find({
      startDate: { $lte: rangeEndDay },
      endDate: { $gte: rangeStartDay }
    });

    const isOfficerOnLeave = (officerId, targetDate) => {
      const offIdStr = officerId.toString();
      const target = new Date(targetDate);
      target.setHours(12, 0, 0, 0);
      const tTime = target.getTime();

      return leaves.some(l => {
        if (!l.officer || l.officer.toString() !== offIdStr) return false;
        const s = new Date(l.startDate);
        s.setHours(0, 0, 0, 0);
        const e = new Date(l.endDate);
        e.setHours(23, 59, 59, 999);
        return tTime >= s.getTime() && tTime <= e.getTime();
      });
    };

    // Fetch all published rosters & available vehicles
    const publishedRosters = await DutyRoster.find({ status: "Published" });
    const availableVehicles = await Vehicle.find({ status: { $in: ["AVAILABLE", "Active", "Approved"] } });
    const assignedVehiclesPerShift = new Set();

    const getOfficerConsecutiveCount = (officerId, targetDate) => {
      let count = 0;
      const offIdStr = officerId.toString();
      let checkDate = new Date(targetDate);
      checkDate.setDate(checkDate.getDate() - 1);

      for (let i = 0; i < 7; i++) {
        const dayStr = checkDate.toDateString();
        const workedInPublished = publishedRosters.some(r =>
          r.assignments && r.assignments.some(a =>
            a.officer && a.officer.toString() === offIdStr &&
            new Date(a.date).toDateString() === dayStr
          )
        );
        const workedInCurrent = assignments.some(a =>
          a.officer && a.officer.toString() === offIdStr &&
          new Date(a.date).toDateString() === dayStr
        );
        if (workedInPublished || workedInCurrent) {
          count++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      return count;
    };

    // Sort rules by priority (High first) so we assign important slots first
    const sortedRules = [...rules].sort((a, b) => {
      const priorityMap = { High: 3, Medium: 2, Low: 1 };
      return (priorityMap[b.priority] || 2) - (priorityMap[a.priority] || 2);
    });

    // Generate assignments day by day
    for (const d of dateRange) {
      const dayStr = d.toDateString();
      const shifts = rosterType === "Daily" ? [shift] : activeShifts.map(s => s.name);

      for (const sh of shifts) {
        // Track which officers are already assigned to a duty on this date and shift
        const shiftAssignedOfficers = new Set();

        for (const rule of sortedRules) {
          const required = rule.requiredOfficers || 1;

          for (let count = 0; count < required; count++) {
            let bestOfficer = null;
            let highestScore = -Infinity;
            let bestReason = "";

            // Check vehicle allocation for this rule slot
            let allocatedVehicle = null;
            if (rule.requiresVehicle) {
              allocatedVehicle = availableVehicles.find(v =>
                !assignedVehiclesPerShift.has(`${v._id.toString()}_${dayStr}_${sh}`) &&
                (!rule.vehicleType || v.vehicleType === rule.vehicleType)
              ) || null;
            }

            if (!enableAI) {
              // Select first eligible officer without scoring
              for (const officer of activeOfficers) {
                const offIdStr = officer._id.toString();
                if (shiftAssignedOfficers.has(offIdStr)) continue;
                if (isOfficerOnLeave(officer._id, d)) continue;
                
                const officerRankVal = RANK_HIERARCHY[officer.rank] || 1;
                const requiredRankVal = RANK_HIERARCHY[rule.minRank] || 1;
                if (officerRankVal < requiredRankVal) continue;

                const consecutiveCount = getOfficerConsecutiveCount(officer._id, d);
                if (consecutiveCount >= (rule.maxConsecutiveAssignments || 3)) continue;

                bestOfficer = officer;
                bestReason = "✓ Available\n✓ Rank Eligible";
                if (rule.requiresVehicle && allocatedVehicle) {
                  bestReason += `\n✓ Vehicle Allocated: ${allocatedVehicle.vehicleType} (${allocatedVehicle.registrationNo})`;
                }
                break;
              }
            } else {
              // Run AI Rule-Based scoring using AIRecommendationService
              const yesterday = new Date(d);
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toDateString();

              // Get all assignments for yesterday
              const yesterdayAsgs = [];
              assignments.forEach(asg => {
                if (new Date(asg.date).toDateString() === yesterdayStr) {
                  yesterdayAsgs.push({
                    officer: asg.officer,
                    location: asg.location,
                    shift: asg.shift,
                    date: asg.date
                  });
                }
              });

              existingRosters.forEach(r => {
                r.assignments.forEach(asg => {
                  if (new Date(asg.date).toDateString() === yesterdayStr) {
                    yesterdayAsgs.push({
                      officer: asg.officer,
                      location: asg.location,
                      shift: asg.shift,
                      date: asg.date
                    });
                  }
                });
              });

              // Construct leaves array
              const customLeaves = leaves.filter(l => new Date(l.date).toDateString() === dayStr);

              // Construct currentAssignments in this run + shiftAssignedOfficers
              const currentAssignments = assignments.map(asg => ({
                officer: asg.officer,
                date: asg.date,
                shift: asg.shift
              }));
              shiftAssignedOfficers.forEach(offId => {
                if (!currentAssignments.some(asg => asg.officer.toString() === offId && asg.shift === sh)) {
                  currentAssignments.push({
                    officer: offId,
                    date: d,
                    shift: sh
                  });
                }
              });

              for (const officer of activeOfficers) {
                const consecutiveCount = getOfficerConsecutiveCount(officer._id, d);
                const { score, reason } = recommendOfficer(
                  officer,
                  rule,
                  d,
                  sh,
                  yesterdayAsgs,
                  currentAssignments,
                  customLeaves,
                  consecutiveCount,
                  allocatedVehicle
                );

                if (score > highestScore) {
                  highestScore = score;
                  bestOfficer = officer;
                  bestReason = reason;
                }
              }
            }

            if (bestOfficer) {
              const offIdStr = bestOfficer._id.toString();
              shiftAssignedOfficers.add(offIdStr);
              weeklyWorkload[offIdStr] += 1;
              if (allocatedVehicle) {
                assignedVehiclesPerShift.add(`${allocatedVehicle._id.toString()}_${dayStr}_${sh}`);
              }

              assignments.push({
                officer: bestOfficer._id,
                officerName: bestOfficer.fullName,
                officerRank: bestOfficer.rank,
                officerPoliceId: bestOfficer.policeId,
                location: rule.location,
                dutyType: rule.dutyType,
                date: d,
                shift: sh,
                aiRecommendationReason: bestReason
              });
            }
          }
        }
      }
    }

    res.json({
      rosterType,
      status: "Draft",
      date: rosterType === "Daily" ? date : undefined,
      weekStart: rosterType === "Weekly" ? weekStart : undefined,
      weekEnd: rosterType === "Weekly" ? weekEnd : undefined,
      shift: rosterType === "Daily" ? shift : undefined,
      createdBy: req.user.username,
      assignments
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create/save Roster (Draft or Submit)
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

// Update Roster (Approval workflow, Publish status, Draft updates)
router.put("/rosters/:id", verifyToken, async (req, res) => {
  try {
    const { status, assignments, approvedBy } = req.body;
    
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
    if (assignments) {
      updateData.assignments = assignments;
    }

    const roster = await DutyRoster.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    // If published, we can automatically trigger a notification here or let frontend do it
    res.json(roster);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// MOBILE APP ASSIGNED DUTIES ENDPOINT
// ==========================================
router.get("/officer/:policeId", verifyToken, async (req, res) => {
  try {
    // Find the officer first
    const officer = await Officer.findOne({ policeId: req.params.policeId });
    if (!officer) return res.status(404).json({ message: "Officer not found" });

    // Find all published rosters that contain this officer in assignments
    const rosters = await DutyRoster.find({
      status: "Published",
      "assignments.officer": officer._id
    }).sort({ createdAt: -1 });

    // Map and extract only assignments belonging to this officer
    const officerDuties = [];
    rosters.forEach(r => {
      r.assignments.forEach(asg => {
        if (asg.officer.toString() === officer._id.toString()) {
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
    });

    res.json(officerDuties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
