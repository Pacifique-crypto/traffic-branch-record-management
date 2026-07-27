const express = require("express");
const router = express.Router();
const DutyRule = require("../models/DutyRule");
const DutyRoster = require("../models/DutyRoster");
const OfficerAvailability = require("../models/OfficerAvailability");
const Officer = require("../models/Officer");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");

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
    const { location, dutyType, requiredOfficers, minRank, priority } = req.body;
    const rule = new DutyRule({ location, dutyType, requiredOfficers: Number(requiredOfficers), minRank, priority });
    await rule.save();
    res.status(201).json(rule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/rules/:id", verifyToken, authorizeRoles("admin", "it officer"), async (req, res) => {
  try {
    const { location, dutyType, requiredOfficers, minRank, priority } = req.body;
    const rule = await DutyRule.findByIdAndUpdate(
      req.params.id,
      { location, dutyType, requiredOfficers: Number(requiredOfficers), minRank, priority },
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
    const rules = await DutyRule.find({});
    
    if (rules.length === 0) {
      return res.status(400).json({ message: "No duty rules configured. Please set up duty rules first." });
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
        const offIdStr = asg.officer.toString();
        if (weeklyWorkload[offIdStr] !== undefined) {
          weeklyWorkload[offIdStr] += 1;
        }
      });
    });

    // Custom availabilities / leaves
    const leaves = await OfficerAvailability.find({
      status: "On Leave",
      date: { $gte: rangeStartDay, $lte: rangeEndDay }
    });
    const leaveSet = new Set(leaves.map(l => `${l.officer.toString()}_${new Date(l.date).toDateString()}`));

    // Sort rules by priority (High first) so we assign important slots first
    const sortedRules = [...rules].sort((a, b) => {
      const priorityMap = { High: 3, Medium: 2, Low: 1 };
      return (priorityMap[b.priority] || 2) - (priorityMap[a.priority] || 2);
    });

    // Generate assignments day by day
    for (const d of dateRange) {
      const dayStr = d.toDateString();
      const shifts = rosterType === "Daily" ? [shift] : ["Morning", "Afternoon", "Night"];

      for (const sh of shifts) {
        // Track which officers are already assigned to a duty on this date and shift
        const shiftAssignedOfficers = new Set();

        for (const rule of sortedRules) {
          const required = rule.requiredOfficers || 1;

          for (let count = 0; count < required; count++) {
            let bestOfficer = null;
            let highestScore = -Infinity;
            let bestReason = "";

            if (!enableAI) {
              // Select first eligible officer without scoring
              for (const officer of activeOfficers) {
                const offIdStr = officer._id.toString();
                if (shiftAssignedOfficers.has(offIdStr)) continue;
                if (leaveSet.has(`${offIdStr}_${dayStr}`)) continue;
                
                const officerRankVal = RANK_HIERARCHY[officer.rank] || 1;
                const requiredRankVal = RANK_HIERARCHY[rule.minRank] || 1;
                if (officerRankVal < requiredRankVal) continue;

                bestOfficer = officer;
                bestReason = "Manual / Rule-based selection (AI recommendation disabled).";
                break;
              }
            } else {
              // Run AI Rule-Based scoring
              for (const officer of activeOfficers) {
                const offIdStr = officer._id.toString();

                // 1. Availability check
                if (shiftAssignedOfficers.has(offIdStr)) continue;
                if (leaveSet.has(`${offIdStr}_${dayStr}`)) continue;

                // 2. Rank eligibility check
                const officerRankVal = RANK_HIERARCHY[officer.rank] || 1;
                const requiredRankVal = RANK_HIERARCHY[rule.minRank] || 1;
                if (officerRankVal < requiredRankVal) continue;

                // 3. Night Shift rest rule check
                // Check if officer worked Night shift on previous day, cannot work Morning or Afternoon shift today
                let isRestrictedByNightShift = false;
                if (sh === "Morning" || sh === "Afternoon") {
                  const yesterday = new Date(d);
                  yesterday.setDate(yesterday.getDate() - 1);
                  const yesterdayStr = yesterday.toDateString();
                  // Check if this officer is assigned to Night shift yesterday
                  const workedNightYesterday = assignments.some(asg => 
                    asg.officer.toString() === offIdStr && 
                    new Date(asg.date).toDateString() === yesterdayStr && 
                    asg.shift === "Night"
                  );
                  if (workedNightYesterday) {
                    isRestrictedByNightShift = true;
                  }
                }
                if (isRestrictedByNightShift) continue;

                // Calculate active score starting from base
                let score = 100;
                const scoreDetails = ["Available today", `Correct rank (${officer.rank} matches or exceeds required ${rule.minRank})`];

                // Heuristic Mock Experience: derived deterministically from police ID or DOB
                const experience = Math.abs(officer._id.toString().charCodeAt(officer._id.toString().length - 1) % 10) + 1;
                score += experience;
                scoreDetails.push(`Experience score +${experience}`);

                // Workload balancer: deduct 15 points per assigned shift this week
                const workloadCount = weeklyWorkload[offIdStr] || 0;
                score -= (workloadCount * 15);
                scoreDetails.push(`Balanced workload (${workloadCount} shifts assigned this week, -${workloadCount * 15} points)`);

                // Previous day workload balance: check if they worked yesterday
                const yesterday = new Date(d);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toDateString();
                const workedYesterday = assignments.some(asg => 
                  asg.officer.toString() === offIdStr && 
                  new Date(asg.date).toDateString() === yesterdayStr
                );
                if (workedYesterday) {
                  score -= 20;
                  scoreDetails.push("Assigned to duty yesterday (-20 points)");
                } else {
                  scoreDetails.push("Not assigned yesterday (+0 points)");
                }

                // Rank fit bonus: give 10 points if rank is exact match (prevents overqualifying tasks)
                if (officerRankVal === requiredRankVal) {
                  score += 10;
                  scoreDetails.push("Rank matches requirement exactly (+10 points)");
                }

                if (score > highestScore) {
                  highestScore = score;
                  bestOfficer = officer;
                  bestReason = `Recommended because: ${scoreDetails.join(", ")}.`;
                }
              }
            }

            if (bestOfficer) {
              const offIdStr = bestOfficer._id.toString();
              shiftAssignedOfficers.add(offIdStr);
              weeklyWorkload[offIdStr] += 1;

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
