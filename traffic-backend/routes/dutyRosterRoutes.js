const express = require("express");
const router = express.Router();
const DutyRoster = require("../models/DutyRoster");
const DutyAssignment = require("../models/DutyAssignment");
const Officer = require("../models/Officer");
const OfficerAvailability = require("../models/OfficerAvailability");
const Notification = require("../models/Notification");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");
const { validateAssignment, formatDateStr, toMidnight, parseShiftTimes } = require("../services/rosterValidator");
const { ROSTER_STATUSES, SHIFT_PRESETS } = require("../config/rosterConfig");

/**
 * @route   POST /api/duty-rosters
 * @desc    Create a new weekly roster
 * @access  Private (IT Officer / Admin)
 */
router.post("/", verifyToken, authorizeRoles("it officer", "admin"), async (req, res) => {
  try {
    const weekStart = req.body.weekStart || req.body.startDate || req.body.startDateISO;
    const { title, notes } = req.body;

    if (!weekStart || isNaN(new Date(weekStart).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Valid weekStart date is required."
      });
    }

    const start = toMidnight(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6); // 7-day weekly roster

    // Generate Roster Reference e.g. ROSTER-2026-0913
    const startStr = formatDateStr(start).replace(/-/g, "");
    const rosterReference = `ROSTER-${startStr}`;

    // Check if roster for this week already exists
    let existing = await DutyRoster.findOne({ weekStart: start });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A duty roster for week starting ${formatDateStr(start)} already exists (${existing.rosterReference}).`
      });
    }

    const roster = await DutyRoster.create({
      rosterReference,
      title: title || `${formatDateStr(start)} to ${formatDateStr(end)} Weekly Roster`,
      weekStart: start,
      weekEnd: end,
      status: req.body.status && Object.values(ROSTER_STATUSES).includes(req.body.status.toUpperCase())
        ? req.body.status.toUpperCase()
        : ROSTER_STATUSES.DRAFT,
      createdBy: req.user?.id || req.user?._id || null,
      notes: notes || "",
      regularDuties: req.body.regularDuties || [],
      specialDuties: req.body.specialDuties || []
    });

    return res.status(201).json({
      success: true,
      message: "Weekly duty roster created successfully.",
      roster
    });
  } catch (error) {
    console.error("Error creating duty roster:", error);
    return res.status(500).json({
      success: false,
      message: "Server error creating duty roster",
      error: error.message
    });
  }
});

/**
 * @route   GET /api/duty-rosters
 * @desc    Get all weekly rosters (filterable by status, weekStart)
 * @access  Private
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    const { status, weekStart } = req.query;
    const filter = {};

    const userRole = (req.user && req.user.role) ? (req.user.role || "").toLowerCase() : "";
    const isOIC = userRole.includes("oic");

    if (status) {
      filter.status = status.toUpperCase();
    } else if (isOIC) {
      filter.status = { $ne: "DRAFT" };
    }

    if (weekStart) {
      filter.weekStart = toMidnight(weekStart);
    }

    const rosters = await DutyRoster.find(filter)
      .populate("createdBy", "fullName username policeId rank")
      .populate({
        path: "assignments",
        populate: { path: "officer", select: "fullName username policeId rank" }
      })
      .sort({ weekStart: -1 });

    return res.json({
      success: true,
      count: rosters.length,
      rosters
    });
  } catch (error) {
    console.error("Error fetching duty rosters:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching duty rosters",
      error: error.message
    });
  }
});

/**
 * @route   GET /api/duty-rosters/week
 * @desc    Get roster for specific week starting date
 * @access  Private
 */
router.get("/week", verifyToken, async (req, res) => {
  try {
    const { startDate } = req.query;
    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: "startDate parameter is required (e.g. ?startDate=2026-09-13)."
      });
    }

    const start = toMidnight(startDate);
    const userRole = (req.user && req.user.role) ? (req.user.role || "").toLowerCase() : "";
    const isOIC = userRole.includes("oic");

    const queryFilter = { weekStart: start };
    if (isOIC) {
      queryFilter.status = { $ne: "DRAFT" };
    }

    const roster = await DutyRoster.findOne(queryFilter)
      .populate("createdBy", "fullName username policeId rank")
      .populate({
        path: "assignments",
        populate: { path: "officer", select: "fullName username policeId rank" }
      });

    if (!roster) {
      return res.status(404).json({
        success: false,
        message: `No duty roster found for week starting ${formatDateStr(start)}.`
      });
    }

    return res.json({
      success: true,
      roster,
      duties: roster ? roster.assignments : []
    });
  } catch (error) {
    console.error("Error fetching week roster:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching week roster",
      error: error.message
    });
  }
});

/**
 * @route   GET /api/duty-rosters/:id
 * @desc    Get single duty roster by ID
 * @access  Private
 */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const roster = await DutyRoster.findById(req.params.id)
      .populate("createdBy", "fullName username policeId rank")
      .populate({
        path: "assignments",
        populate: { path: "officer", select: "fullName username policeId rank" }
      });

    if (!roster) {
      return res.status(404).json({
        success: false,
        message: "Duty roster not found."
      });
    }

    return res.json({
      success: true,
      roster
    });
  } catch (error) {
    console.error("Error fetching duty roster:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching duty roster",
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/duty-rosters/:id
 * @desc    Update roster details or status lifecycle (DRAFT -> PENDING_APPROVAL -> APPROVED/CHANGES_REQUESTED -> PUBLISHED)
 * @access  Private
 */
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const roster = await DutyRoster.findById(req.params.id);
    if (!roster) {
      return res.status(404).json({
        success: false,
        message: "Duty roster not found."
      });
    }

    const { status, title, oicComment, rejectionReason, notes } = req.body;

    // RULE 8: Do not allow an already PUBLISHED roster to simply change back to DRAFT
    if (roster.status === ROSTER_STATUSES.PUBLISHED && status === ROSTER_STATUSES.DRAFT) {
      return res.status(400).json({
        success: false,
        message: "Constraint violation: A published roster cannot be set back to DRAFT."
      });
    }

    let notificationCount = 0;

    if (status && Object.values(ROSTER_STATUSES).includes(status.toUpperCase())) {
      const newStatus = status.toUpperCase();
      roster.status = newStatus;

      if (newStatus === ROSTER_STATUSES.PENDING_APPROVAL) {
        roster.submittedAt = new Date();
      } else if (newStatus === ROSTER_STATUSES.APPROVED) {
        roster.approvedAt = new Date();
      } else if (newStatus === ROSTER_STATUSES.PUBLISHED) {
        roster.publishedAt = new Date();

        // Create notifications for assigned officers with duplicate prevention
        const assignments = await DutyAssignment.find({ roster: roster._id }).populate("officer");
        for (const assignment of assignments) {
          if (!assignment.officer || assignment.dutyType === "OFF") continue;

          const recipientId = assignment.officer._id || assignment.officer;

          // Duplicate prevention check
          const existingNotif = await Notification.findOne({
            recipient: recipientId,
            type: "DUTY_ASSIGNED",
            relatedDuty: assignment._id
          });

          if (!existingNotif) {
            const dutyDateStr = new Date(assignment.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            const dutyName = assignment.dutyType === 'Special Duty' ? (assignment.specialDutyText || 'Special Duty') : assignment.dutyType;

            await Notification.create({
              recipient: recipientId,
              title: "New Duty Assigned",
              message: `You have been assigned ${dutyName} on ${dutyDateStr} (${assignment.shift}) at ${assignment.location || 'Main Station'}.`,
              type: "DUTY_ASSIGNED",
              relatedDuty: assignment._id,
              relatedRoster: roster._id
            });
            notificationCount++;
          }
        }
      }
    }

    if (title) roster.title = title;
    if (oicComment !== undefined) roster.oicComment = oicComment;
    if (rejectionReason !== undefined) roster.rejectionReason = rejectionReason;
    if (notes !== undefined) roster.notes = notes;
    if (req.body.regularDuties) roster.regularDuties = req.body.regularDuties;
    if (req.body.specialDuties) roster.specialDuties = req.body.specialDuties;

    await roster.save();

    const updatedRoster = await DutyRoster.findById(roster._id)
      .populate("createdBy", "fullName username policeId rank")
      .populate({
        path: "assignments",
        populate: { path: "officer", select: "fullName username policeId rank" }
      });

    return res.json({
      success: true,
      message: roster.status === ROSTER_STATUSES.PUBLISHED
        ? "Roster published successfully. Officer notifications created."
        : `Duty roster updated successfully. Status is now '${roster.status}'.`,
      notificationCount,
      roster: updatedRoster
    });
  } catch (error) {
    console.error("Error updating duty roster:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating duty roster",
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/duty-rosters/:id
 * @desc    Delete a duty roster and its associated assignments
 * @access  Private (IT Officer / Admin)
 */
router.delete("/:id", verifyToken, authorizeRoles("it officer", "admin"), async (req, res) => {
  try {
    const roster = await DutyRoster.findById(req.params.id);
    if (!roster) {
      return res.status(404).json({
        success: false,
        message: "Duty roster not found."
      });
    }

    if (roster.status === ROSTER_STATUSES.PUBLISHED) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete an active published duty roster."
      });
    }

    await DutyAssignment.deleteMany({ roster: roster._id });
    await DutyRoster.findByIdAndDelete(roster._id);

    return res.json({
      success: true,
      message: "Duty roster and associated assignments deleted successfully."
    });
  } catch (error) {
    console.error("Error deleting duty roster:", error);
    return res.status(500).json({
      success: false,
      message: "Server error deleting duty roster",
      error: error.message
    });
  }
});

/**
 * @route   POST /api/duty-rosters/generate
 * @desc    Generate Weekly Roster Backend Engine - High-Performance In-Memory Batch Architecture
 * @access  Private (IT Officer / Admin)
 */
const generateDutyRosterHandler = async (req, res) => {
  const t0 = Date.now();
  try {
    const weekStart = req.body.weekStart || req.body.startDate || req.body.startDateISO;
    const { regularDuties = [], specialDuties = [] } = req.body;

    if (!weekStart || isNaN(new Date(weekStart).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Valid weekStart date is required for roster generation."
      });
    }

    const start = toMidnight(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const startStr = formatDateStr(start).replace(/-/g, "");
    const rosterReference = `ROSTER-${startStr}`;

    // Get or create draft roster
    let roster = await DutyRoster.findOne({ weekStart: start });
    if (!roster) {
      roster = await DutyRoster.create({
        rosterReference,
        title: `${formatDateStr(start)} to ${formatDateStr(end)} Weekly Roster`,
        weekStart: start,
        weekEnd: end,
        status: ROSTER_STATUSES.DRAFT,
        createdBy: req.user?.id || req.user?._id || null,
        regularDuties,
        specialDuties
      });
    } else {
      if (roster.status === ROSTER_STATUSES.APPROVED || roster.status === ROSTER_STATUSES.PUBLISHED) {
        return res.status(400).json({
          success: false,
          code: "ROSTER_ALREADY_APPROVED",
          message: `Constraint violation: An ${roster.status.toLowerCase()} roster cannot be re-generated.`
        });
      }
      // Clear existing draft assignments for fresh generation if in DRAFT status
      if (roster.status === ROSTER_STATUSES.DRAFT) {
        await DutyAssignment.deleteMany({ roster: roster._id });
        roster.regularDuties = regularDuties;
        roster.specialDuties = specialDuties;
      }
    }

    // ── 1. PREFETCH ACTIVE OFFICERS ──
    const activeOfficers = await Officer.find({ status: "Active" });
    const t1 = Date.now();
    if (activeOfficers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No active officers available for roster generation."
      });
    }

    const officerMap = {};
    activeOfficers.forEach((o) => {
      officerMap[String(o._id)] = o;
    });

    // ── 2. PREFETCH APPROVED LEAVES ──
    const leaveWindowStart = new Date(start);
    leaveWindowStart.setDate(leaveWindowStart.getDate() - 7);
    const leaveWindowEnd = new Date(end);
    leaveWindowEnd.setDate(leaveWindowEnd.getDate() + 7);

    const approvedLeaves = await OfficerAvailability.find({
      status: "Approved",
      startDate: { $lte: leaveWindowEnd },
      endDate: { $gte: leaveWindowStart }
    });
    const t2 = Date.now();

    const leaveMap = {};
    approvedLeaves.forEach((leave) => {
      const oId = String(leave.officer);
      if (!leaveMap[oId]) leaveMap[oId] = [];
      leaveMap[oId].push({
        startDate: toMidnight(leave.startDate),
        endDate: toMidnight(leave.endDate),
        leaveType: leave.leaveType
      });
    });

    // ── 3. PREFETCH ACTIVE ROSTERS ──
    const activeRosters = await DutyRoster.find({
      status: { $in: [ROSTER_STATUSES.APPROVED, ROSTER_STATUSES.PUBLISHED] }
    }).select("_id");
    const t3 = Date.now();

    const activeRosterIds = activeRosters.map((r) => String(r._id));
    if (roster._id) activeRosterIds.push(String(roster._id));

    // ── 4. PREFETCH EXISTING ASSIGNMENTS ──
    const assignmentWindowStart = new Date(start);
    assignmentWindowStart.setDate(assignmentWindowStart.getDate() - 7);
    const assignmentWindowEnd = new Date(end);
    assignmentWindowEnd.setDate(assignmentWindowEnd.getDate() + 7);

    const existingAssignments = await DutyAssignment.find({
      roster: { $in: activeRosterIds },
      date: { $gte: assignmentWindowStart, $lte: assignmentWindowEnd }
    });
    const t4 = Date.now();

    const assignmentsMap = {};
    activeOfficers.forEach((o) => {
      assignmentsMap[String(o._id)] = [];
    });

    existingAssignments.forEach((a) => {
      const oId = String(a.officer);
      if (!assignmentsMap[oId]) assignmentsMap[oId] = [];
      assignmentsMap[oId].push({
        _id: a._id,
        officer: a.officer,
        date: toMidnight(a.date),
        dutyType: a.dutyType,
        shift: a.shift,
        startTime: a.startTime,
        endTime: a.endTime,
        roster: a.roster
      });
    });

    // ── 5. BUILD IN-MEMORY VALIDATION CONTEXT ──
    const dbReadCounter = { count: 0 };
    const validationContext = {
      officerMap,
      leaveMap,
      activeRosterIds: new Set(activeRosterIds),
      assignmentsMap,
      roster,
      dbReadCounter
    };

    // Standard default duties if none provided in request
    const standardRegDuties = regularDuties.length > 0 ? regularDuties : [
      { name: "Accident Investigation Duty", shift: "06:00–18:00", location: "Main Station / Field", count: 2, frequency: "everyday" },
      { name: "Motorcycle Patrol", shift: "06:00–18:00", location: "Sector Patrol Area", count: 2, frequency: "everyday" },
      { name: "119 Motorcycle Patrol", shift: "06:00–18:00", location: "Emergency Patrol", count: 2, frequency: "everyday" },
      { name: "Point Duty", shift: "06:00–14:00", location: "Poruthota Junction", count: 3, frequency: "everyday" },
      { name: "Traffic Branch Duty", shift: "06:00–18:00", location: "Traffic Branch HQ", count: 2, frequency: "everyday" },
      { name: "Court Duty", shift: "08:00–16:00", location: "Magistrate Court", count: 1, frequency: "selected", selectedDays: ["Mon", "Wed", "Fri"] }
    ];

    // Workload Map Initialization
    const workloadMap = {};
    activeOfficers.forEach((o) => {
      workloadMap[String(o._id)] = 0;
    });

    const generatedAssignments = [];
    const conflicts = [];
    let candidateEvaluationsCount = 0;

    const dayNamesFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const tGenStart = Date.now();

    // ── 6. IN-MEMORY ROSTER GENERATION LOOP ──
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + dayOffset);
      const dateISOStr = formatDateStr(currentDate);

      const todayNameFull = dayNamesFull[currentDate.getDay()];
      const todayNameShort = dayNamesShort[currentDate.getDay()];

      // Filter regular duties based on frequency and selectedDays
      const todayRegDuties = standardRegDuties.filter((slot) => {
        if (!slot) return false;
        if (slot.frequency === "selected" || (Array.isArray(slot.selectedDays) && slot.selectedDays.length > 0)) {
          const daysList = (slot.selectedDays || []).map((d) => String(d).trim().toLowerCase());
          const isTodaySelected = daysList.some(d => 
            d === todayNameFull.toLowerCase() ||
            d === todayNameShort.toLowerCase() ||
            d === String(currentDate.getDay())
          );
          return isTodaySelected;
        }
        return true;
      });

      // Collect duties for today: filtered regular duties + special duties for today
      const todaySpecial = specialDuties.filter((sd) => sd.date === dateISOStr || sd.date === formatDateStr(currentDate));
      const todaySlots = [...todayRegDuties, ...todaySpecial];

      for (const slot of todaySlots) {
        const dutyName = slot.name || slot.type || "Point Duty";
        const shiftStr = slot.shift || "06:00–14:00";
        const locStr = slot.location || "Main Station / Field";
        const reqCount = slot.count || 1;
        const specText = slot.type || slot.specialDutyText || "";

        let assignedForThisSlot = 0;
        const eligibleCandidates = [];

        // Evaluate all active officers in-memory
        for (const candidate of activeOfficers) {
          const candIdStr = String(candidate._id);
          candidateEvaluationsCount++;

          const validation = await validateAssignment(
            {
              officer: candidate._id,
              date: currentDate,
              dutyType: dutyName,
              shift: shiftStr,
              location: locStr,
              roster: roster._id
            },
            { context: validationContext }
          );

          if (validation.valid) {
            eligibleCandidates.push({
              officer: candidate,
              workload: workloadMap[candIdStr] || 0
            });
          }
        }

        // WORKLOAD BALANCING: Sort eligible candidates by workload ascending (fewest assigned duties first)
        eligibleCandidates.sort((a, b) => a.workload - b.workload);

        // Assign up to required officer count
        for (let i = 0; i < eligibleCandidates.length && assignedForThisSlot < reqCount; i++) {
          const selectedObj = eligibleCandidates[i].officer;
          const selIdStr = String(selectedObj._id);
          const { startTime: pStart, endTime: pEnd } = parseShiftTimes(shiftStr);

          const assignmentDoc = {
            roster: roster._id,
            officer: selectedObj._id,
            date: currentDate,
            dutyType: dutyName,
            specialDutyText: specText,
            shift: shiftStr,
            startTime: pStart,
            endTime: pEnd,
            location: locStr,
            requiredOfficerCount: reqCount
          };

          generatedAssignments.push(assignmentDoc);

          // Update in-memory assignmentsMap immediately for subsequent evaluations
          if (!assignmentsMap[selIdStr]) assignmentsMap[selIdStr] = [];
          assignmentsMap[selIdStr].push({
            officer: selectedObj._id,
            date: toMidnight(currentDate),
            dutyType: dutyName,
            shift: shiftStr,
            startTime: pStart,
            endTime: pEnd,
            roster: roster._id
          });

          workloadMap[selIdStr] = (workloadMap[selIdStr] || 0) + 1;
          assignedForThisSlot++;
        }

        // Handle Unfilled or Partially Filled Slots
        if (assignedForThisSlot < reqCount) {
          conflicts.push(`⚠ ${dutyName} on ${dateISOStr} requires ${reqCount} officer(s), but only ${assignedForThisSlot} eligible officer(s) could be assigned due to rule constraints.`);
        }
      }
    }
    const tGenEnd = Date.now();

    // ── 7. BULK SAVE ASSIGNMENTS IN DATABASE ──
    const tSaveStart = Date.now();
    if (generatedAssignments.length > 0) {
      await DutyAssignment.insertMany(generatedAssignments);
    }
    roster.conflicts = conflicts;
    await roster.save();
    const tSaveEnd = Date.now();

    // ── 8. PERFORMANCE INSTRUMENTATION LOGS ──
    console.log(`[ROSTER PERF] Prefetch officers: ${t1 - t0} ms`);
    console.log(`[ROSTER PERF] Prefetch leave: ${t2 - t1} ms`);
    console.log(`[ROSTER PERF] Prefetch rosters: ${t3 - t2} ms`);
    console.log(`[ROSTER PERF] Prefetch assignments: ${t4 - t3} ms`);
    console.log(`[ROSTER PERF] Generation (In-Memory): ${tGenEnd - tGenStart} ms`);
    console.log(`[ROSTER PERF] Database save (Bulk): ${tSaveEnd - tSaveStart} ms`);
    console.log(`[ROSTER PERF] Total: ${tSaveEnd - t0} ms`);
    console.log(`[ROSTER PERF] Candidate evaluations: ${candidateEvaluationsCount}, DB Reads inside loop: ${dbReadCounter.count}`);

    const populatedRoster = await DutyRoster.findById(roster._id)
      .populate("createdBy", "fullName username policeId rank")
      .populate("courtDutyOfficers", "fullName username policeId rank")
      .populate({
        path: "assignments",
        populate: { path: "officer", select: "fullName username policeId rank" }
      });

    return res.status(200).json({
      success: true,
      message: `Weekly draft roster generated successfully with ${generatedAssignments.length} duty assignments.`,
      conflicts,
      roster: populatedRoster,
      duties: populatedRoster ? populatedRoster.assignments : []
    });
  } catch (error) {
    console.error("Error generating duty roster:", error);
    return res.status(500).json({
      success: false,
      message: "Server error generating duty roster",
      error: error.message
    });
  }
};

router.post("/generate", verifyToken, authorizeRoles("it officer", "admin"), generateDutyRosterHandler);

module.exports = router;
module.exports.generateDutyRosterHandler = generateDutyRosterHandler;
