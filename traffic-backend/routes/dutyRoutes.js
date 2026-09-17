const express = require("express");
const router = express.Router();
const DutyAssignment = require("../models/DutyAssignment");
const DutyRoster = require("../models/DutyRoster");
const Officer = require("../models/Officer");
const { verifyToken } = require("../middlewares/authMiddleware");
const { validateAssignment, formatDateStr, toMidnight, parseShiftTimes } = require("../services/rosterValidator");
const { SHIFT_PRESETS } = require("../config/rosterConfig");

// ==========================================
// DEMO DRIVER LICENCE VERIFICATION API (PRESERVED FALLBACK ROUTE)
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

// ==========================================
// DUTY ASSIGNMENT API ENDPOINTS
// ==========================================

/**
 * @route   GET /api/duties/my
 * @desc    Get authenticated officer's own assigned duties from PUBLISHED rosters ONLY
 * @access  Private (Officer authenticated via JWT)
 */
router.get("/my", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized user identity." });
    }

    // Query published rosters ONLY
    const publishedRosters = await DutyRoster.find({ status: "PUBLISHED" }).select("_id");
    const publishedRosterIds = publishedRosters.map((r) => r._id);

    const duties = await DutyAssignment.find({
      officer: userId,
      roster: { $in: publishedRosterIds },
      dutyType: { $ne: "OFF" }
    })
      .populate("officer", "fullName username policeId rank contactNo station")
      .populate("roster", "rosterReference weekStart weekEnd status")
      .sort({ date: 1, startTime: 1 });

    return res.json({
      success: true,
      count: duties.length,
      duties
    });
  } catch (error) {
    console.error("Error fetching my duties:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching officer duties",
      error: error.message
    });
  }
});

/**
 * @route   GET /api/duties
 * @desc    Get duties for specific date or date range (e.g. ?date=YYYY-MM-DD or ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD)
 * @access  Private
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    const { date, startDate, endDate, officerId, rosterId } = req.query;
    const filter = {};

    if (date) {
      const target = toMidnight(date);
      filter.date = {
        $gte: target,
        $lte: new Date(target.getTime() + 86399999)
      };
    } else if (startDate && endDate) {
      filter.date = {
        $gte: toMidnight(startDate),
        $lte: new Date(toMidnight(endDate).getTime() + 86399999)
      };
    }

    if (officerId) {
      filter.officer = officerId;
    }

    if (rosterId) {
      filter.roster = rosterId;
    }

    const duties = await DutyAssignment.find(filter)
      .populate("officer", "fullName username policeId rank contactNo station")
      .populate("roster", "rosterReference weekStart weekEnd status")
      .sort({ date: 1, startTime: 1 });

    return res.json({
      success: true,
      count: duties.length,
      duties
    });
  } catch (error) {
    console.error("Error fetching duties:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching duties",
      error: error.message
    });
  }
});

/**
 * @route   GET /api/duties/:id
 * @desc    Get single duty assignment by ID
 * @access  Private
 */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const duty = await DutyAssignment.findById(req.params.id)
      .populate("officer", "fullName username policeId rank contactNo station")
      .populate("roster", "rosterReference weekStart weekEnd status");

    if (!duty) {
      return res.status(404).json({
        success: false,
        message: "Duty assignment not found."
      });
    }

    return res.json({
      success: true,
      duty
    });
  } catch (error) {
    console.error("Error fetching duty assignment:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching duty assignment",
      error: error.message
    });
  }
});

/**
 * @route   POST /api/duties
 * @desc    Create an individual duty assignment with full backend validation rules
 * @access  Private
 */
router.post("/", verifyToken, async (req, res) => {
  try {
    const { rosterId, officerId, date, dutyType, specialDutyText, shift, location, startTime, endTime, requiredOfficerCount, remarks } = req.body;

    if (!officerId || !date || !dutyType || !shift) {
      return res.status(400).json({
        success: false,
        message: "officerId, date, dutyType, and shift are required fields."
      });
    }

    // Determine or create fallback roster if not supplied
    let targetRosterId = rosterId;
    const targetDate = toMidnight(date);

    if (!targetRosterId) {
      let existingRoster = await DutyRoster.findOne({
        weekStart: { $lte: targetDate },
        weekEnd: { $gte: targetDate }
      });

      if (!existingRoster) {
        // Calculate weekStart (Sunday)
        const weekStart = new Date(targetDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const refStr = formatDateStr(weekStart).replace(/-/g, "");

        existingRoster = await DutyRoster.create({
          rosterReference: `ROSTER-${refStr}`,
          weekStart,
          weekEnd,
          status: "DRAFT",
          createdBy: req.user?.id || req.user?._id || null
        });
      }
      targetRosterId = existingRoster._id;
    }

    // RUN BACKEND VALIDATION RULES
    const validation = await validateAssignment({
      officer: officerId,
      date: targetDate,
      dutyType,
      shift,
      location,
      roster: targetRosterId
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        code: validation.code,
        message: validation.message
      });
    }

    const { startTime: parsedStart, endTime: parsedEnd } = parseShiftTimes(shift, startTime, endTime);

    const newAssignment = await DutyAssignment.create({
      roster: targetRosterId,
      officer: officerId,
      date: targetDate,
      dutyType,
      specialDutyText: specialDutyText || "",
      shift,
      startTime: parsedStart,
      endTime: parsedEnd,
      location: location || "Main Station / Field",
      requiredOfficerCount: requiredOfficerCount || 1,
      remarks: remarks || ""
    });

    const populatedAssignment = await DutyAssignment.findById(newAssignment._id)
      .populate("officer", "fullName username policeId rank")
      .populate("roster", "rosterReference weekStart weekEnd status");

    return res.status(201).json({
      success: true,
      message: `Duty assignment created successfully for ${validation.officer?.fullName || "Officer"}.`,
      duty: populatedAssignment
    });
  } catch (error) {
    console.error("Error creating duty assignment:", error);
    return res.status(500).json({
      success: false,
      message: "Server error creating duty assignment",
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/duties/:id
 * @desc    Update an existing duty assignment (updates existing duty without duplicate)
 * @access  Private
 */
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const duty = await DutyAssignment.findById(req.params.id);
    if (!duty) {
      return res.status(404).json({
        success: false,
        message: "Duty assignment not found."
      });
    }

    const { officerId, date, dutyType, specialDutyText, shift, location, startTime, endTime, status, remarks } = req.body;

    const targetOfficerId = officerId || duty.officer;
    const targetDate = date ? toMidnight(date) : duty.date;
    const targetDutyType = dutyType !== undefined ? dutyType : duty.dutyType;
    const targetShift = shift !== undefined ? shift : duty.shift;
    const targetLocation = location !== undefined ? location : duty.location;

    // RUN BACKEND VALIDATION RULES (excluding current assignment ID from overlap/consecutive checks)
    const validation = await validateAssignment(
      {
        _id: duty._id,
        officer: targetOfficerId,
        date: targetDate,
        dutyType: targetDutyType,
        shift: targetShift,
        location: targetLocation,
        roster: duty.roster
      },
      { excludeAssignmentId: duty._id }
    );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        code: validation.code,
        message: validation.message
      });
    }

    // Update existing assignment fields
    duty.officer = targetOfficerId;
    duty.date = targetDate;
    duty.dutyType = targetDutyType;
    duty.shift = targetShift;
    duty.location = targetLocation;

    if (specialDutyText !== undefined) duty.specialDutyText = specialDutyText;
    if (status !== undefined) duty.status = status;
    if (remarks !== undefined) duty.remarks = remarks;

    const { startTime: parsedStart, endTime: parsedEnd } = parseShiftTimes(targetShift, startTime || duty.startTime, endTime || duty.endTime);
    duty.startTime = parsedStart;
    duty.endTime = parsedEnd;

    await duty.save();

    const updatedDuty = await DutyAssignment.findById(duty._id)
      .populate("officer", "fullName username policeId rank")
      .populate("roster", "rosterReference weekStart weekEnd status");

    return res.json({
      success: true,
      message: "Duty assignment updated successfully.",
      duty: updatedDuty
    });
  } catch (error) {
    console.error("Error updating duty assignment:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating duty assignment",
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/duties/:id
 * @desc    Delete an individual duty assignment
 * @access  Private
 */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const duty = await DutyAssignment.findById(req.params.id);
    if (!duty) {
      return res.status(404).json({
        success: false,
        message: "Duty assignment not found."
      });
    }

    await DutyAssignment.findByIdAndDelete(duty._id);

    return res.json({
      success: true,
      message: "Duty assignment deleted successfully."
    });
  } catch (error) {
    console.error("Error deleting duty assignment:", error);
    return res.status(500).json({
      success: false,
      message: "Server error deleting duty assignment",
      error: error.message
    });
  }
});

module.exports = router;
