const express = require("express");
const router = express.Router();
const DutyRoster = require("../models/DutyRoster");
const DutyAssignment = require("../models/DutyAssignment");
const Officer = require("../models/Officer");
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

    if (status) {
      filter.status = status.toUpperCase();
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
    const roster = await DutyRoster.findOne({ weekStart: start })
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
 * @desc    Generate Weekly Roster Backend Engine - Validates rules, court duty restriction, max 2 consecutive same duty, workload balancing, and returns DRAFT roster with conflicts/warnings
 * @access  Private (IT Officer / Admin)
 */
const generateDutyRosterHandler = async (req, res) => {
  try {
    const weekStart = req.body.weekStart || req.body.startDate || req.body.startDateISO;
    const { regularDuties = [], specialDuties = [], courtDutyOfficerIds = [] } = req.body;

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

    // Fetch active officers
    const activeOfficers = await Officer.find({ status: "Active" });
    if (activeOfficers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No active officers available for roster generation."
      });
    }

    // Standard default duties if none provided in request
    const standardRegDuties = regularDuties.length > 0 ? regularDuties : [
      { name: "Accident Investigation Duty", shift: "06:00–18:00", location: "Main Station / Field", count: 2, frequency: "everyday" },
      { name: "Motorcycle Patrol", shift: "06:00–18:00", location: "Sector Patrol Area", count: 2, frequency: "everyday" },
      { name: "119 Motorcycle Patrol", shift: "06:00–18:00", location: "Emergency Patrol", count: 2, frequency: "everyday" },
      { name: "Point Duty", shift: "06:00–14:00", location: "Poruthota Junction", count: 3, frequency: "everyday" },
      { name: "Traffic Branch Duty", shift: "06:00–18:00", location: "Traffic Branch HQ", count: 2, frequency: "everyday" },
      { name: "Court Duty", shift: "08:00–16:00", location: "Magistrate Court", count: 1, frequency: "selected", selectedDays: ["Mon", "Wed", "Fri"] }
    ];

    // Check if Court Duty is included in regularDuties or specialDuties
    const hasCourtDuty = standardRegDuties.some(d => (d.name || "").toLowerCase().includes("court")) ||
                         specialDuties.some(s => (s.type || s.name || "").toLowerCase().includes("court"));

    // Extract unique Court Duty Officer IDs passed from request
    const uniqueCourtOfficerIds = Array.from(
      new Set((courtDutyOfficerIds || []).map((id) => String(id)).filter(Boolean))
    );

    if (hasCourtDuty) {
      // CASE 4: Duplicate officer selected twice
      if ((courtDutyOfficerIds || []).length !== uniqueCourtOfficerIds.length) {
        return res.status(400).json({
          success: false,
          code: "DUPLICATE_COURT_OFFICERS",
          message: "Invalid Court Duty configuration: The same officer cannot be selected twice as a Court Duty officer."
        });
      }

      // CASE 1, CASE 2, CASE 5: Exactly 2 designated officers required
      if (uniqueCourtOfficerIds.length !== 2) {
        return res.status(400).json({
          success: false,
          code: "INVALID_COURT_OFFICERS_COUNT",
          message: `Invalid Court Duty configuration: Exactly 2 designated Court Duty officers are required (found ${uniqueCourtOfficerIds.length}).`
        });
      }

      // Check if designated court officers exist in active officers list
      const activeOfficerIds = activeOfficers.map(o => String(o._id));
      const validActiveCourtOfficers = uniqueCourtOfficerIds.filter(id => activeOfficerIds.includes(id));
      if (validActiveCourtOfficers.length !== 2) {
        return res.status(400).json({
          success: false,
          code: "INVALID_COURT_OFFICERS",
          message: "Invalid Court Duty configuration: Specified Court Duty officers must be active officers in database."
        });
      }
    }

    const designatedCourtOfficerIds = uniqueCourtOfficerIds;
    roster.courtDutyOfficers = designatedCourtOfficerIds;
    await roster.save();

    // Track workload (number of assigned duty slots in current roster period)
    const workloadMap = {};
    activeOfficers.forEach((o) => {
      workloadMap[String(o._id)] = 0;
    });

    const generatedAssignments = [];
    const conflicts = [];

    const dayNamesFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Loop through days 0 to 6 (Sunday to Saturday)
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

      // Sort todaySlots so restricted duties (like Court Duty) are evaluated first before general duties
      todaySlots.sort((a, b) => {
        const nameA = (a.name || a.type || "").toLowerCase();
        const nameB = (b.name || b.type || "").toLowerCase();
        if (nameA.includes("court") && !nameB.includes("court")) return -1;
        if (!nameA.includes("court") && nameB.includes("court")) return 1;
        return 0;
      });

      for (const slot of todaySlots) {
        const dutyName = slot.name || slot.type || "Point Duty";
        const shiftStr = slot.shift || "06:00–14:00";
        const locStr = slot.location || "Main Station / Field";
        const reqCount = slot.count || 1;
        const specText = slot.type || slot.specialDutyText || "";

        let assignedForThisSlot = 0;
        const eligibleCandidates = [];

        // Evaluate all active officers for this duty slot
        for (const candidate of activeOfficers) {
          const candIdStr = String(candidate._id);

          const validation = await validateAssignment(
            {
              officer: candidate._id,
              date: currentDate,
              dutyType: dutyName,
              shift: shiftStr,
              location: locStr,
              roster: roster._id
            },
            { courtDutyOfficerIds: designatedCourtOfficerIds }
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

          const assignment = await DutyAssignment.create({
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
          });

          generatedAssignments.push(assignment);
          workloadMap[selIdStr] = (workloadMap[selIdStr] || 0) + 1;
          assignedForThisSlot++;
        }

        // Handle Unfilled or Partially Filled Slots
        if (assignedForThisSlot < reqCount) {
          if (dutyName === "Court Duty" && assignedForThisSlot === 0) {
            conflicts.push(`⚠ Court Duty on ${dateISOStr} requires ${reqCount} officer(s), but neither designated Court Duty officer is available.`);
          } else {
            conflicts.push(`⚠ ${dutyName} on ${dateISOStr} requires ${reqCount} officer(s), but only ${assignedForThisSlot} eligible officer(s) could be assigned due to rule constraints.`);
          }
        }
      }
    }

    roster.conflicts = conflicts;
    await roster.save();

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
