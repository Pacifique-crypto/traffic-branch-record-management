/**
 * Roster Validation & Business Logic Service
 * Reusable validation rules for Duty Rosters & Duty Assignments
 */

const Officer = require("../models/Officer");
const OfficerAvailability = require("../models/OfficerAvailability");
const DutyAssignment = require("../models/DutyAssignment");
const DutyRoster = require("../models/DutyRoster");
const {
  MIN_REST_HOURS,
  MAX_CONSECUTIVE_SAME_DUTY,
  SHIFT_PRESETS
} = require("../config/rosterConfig");

// Normalize Date to Midnight (00:00:00.000)
const toMidnight = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

// Format Date YYYY-MM-DD
const formatDateStr = (d) => {
  const date = new Date(d);
  return date.toISOString().split("T")[0];
};

// Extract Start & End times from Shift String or Preset
const parseShiftTimes = (shiftStr, customStart, customEnd) => {
  if (customStart && customEnd) {
    return { startTime: customStart, endTime: customEnd };
  }

  const preset = SHIFT_PRESETS[shiftStr];
  if (preset) {
    return { startTime: preset.startTime, endTime: preset.endTime };
  }

  // Parse time format like "06:00 - 14:00" or "06:00–14:00"
  if (shiftStr && shiftStr.includes("-")) {
    const parts = shiftStr.split("-").map((s) => s.trim());
    const start = parts[0].slice(0, 5);
    const end = parts[1].slice(0, 5);
    return { startTime: start, endTime: end };
  } else if (shiftStr && shiftStr.includes("–")) {
    const parts = shiftStr.split("–").map((s) => s.trim());
    const start = parts[0].slice(0, 5);
    const end = parts[1].slice(0, 5);
    return { startTime: start, endTime: end };
  }

  return { startTime: "06:00", endTime: "14:00" };
};

// Convert HH:MM time on a specific Date to absolute Timestamp (in ms)
const getShiftTimestamp = (baseDate, timeStr, isEndOvernight = false) => {
  const d = new Date(baseDate);
  const [h, m] = (timeStr || "00:00").split(":").map(Number);
  d.setHours(h || 0, m || 0, 0, 0);
  if (isEndOvernight) {
    d.setDate(d.getDate() + 1);
  }
  return d.getTime();
};

/**
 * 1. Validate Officer Active & Eligible
 */
const validateActiveOfficer = async (officerId) => {
  if (!officerId) {
    return { valid: false, code: "MISSING_OFFICER", message: "Officer ID is required for duty assignment." };
  }

  const officer = await Officer.findById(officerId);
  if (!officer) {
    return { valid: false, code: "INVALID_OFFICER", message: `Officer ID '${officerId}' not found in system.` };
  }

  if ((officer.status || "").toLowerCase() !== "active") {
    return {
      valid: false,
      code: "INACTIVE_OFFICER",
      message: `Officer ${officer.fullName} (${officer.policeId || officer.username}) is not active (status: ${officer.status}).`
    };
  }

  return { valid: true, officer };
};

/**
 * 2. Validate Approved Leave Conflict
 * Rule: If officer has approved leave covering duty date, reject assignment.
 */
const validateLeaveConflict = async (officerId, dutyDate, officerName = "Officer") => {
  const targetDate = toMidnight(dutyDate);

  // Search for approved leaves where startDate <= targetDate <= endDate
  const approvedLeaves = await OfficerAvailability.find({
    officer: officerId,
    status: "Approved",
    startDate: { $lte: new Date(targetDate.getTime() + 86399999) },
    endDate: { $gte: targetDate }
  });

  if (approvedLeaves.length > 0) {
    const leave = approvedLeaves[0];
    const startStr = formatDateStr(leave.startDate);
    const endStr = formatDateStr(leave.endDate);
    return {
      valid: false,
      code: "APPROVED_LEAVE_CONFLICT",
      message: `Officer ${officerName} is on approved leave (${leave.leaveType}) from ${startStr} to ${endStr} and cannot be assigned to duty on ${formatDateStr(dutyDate)}.`
    };
  }

  return { valid: true };
};

/**
 * 3. Validate Roster Date Range
 */
const validateRosterDate = async (rosterId, dutyDate) => {
  if (!dutyDate || isNaN(new Date(dutyDate).getTime())) {
    return { valid: false, code: "INVALID_DATE", message: "Invalid duty date provided." };
  }

  if (rosterId) {
    const roster = await DutyRoster.findById(rosterId);
    if (roster) {
      const target = toMidnight(dutyDate).getTime();
      const start = toMidnight(roster.weekStart).getTime();
      const end = toMidnight(roster.weekEnd).getTime();

      if (target < start || target > end) {
        return {
          valid: false,
          code: "INVALID_ROSTER_DATE",
          message: `Duty date ${formatDateStr(dutyDate)} must fall within roster period (${formatDateStr(roster.weekStart)} to ${formatDateStr(roster.weekEnd)}).`
        };
      }
    }
  }

  return { valid: true };
};

/**
 * 4. Validate Shift Overlap Conflict
 */
const validateShiftOverlap = async (officerId, dutyDate, shiftStr, excludeAssignmentId = null, officerName = "Officer") => {
  const targetDate = toMidnight(dutyDate);
  const { startTime, endTime } = parseShiftTimes(shiftStr);

  const query = {
    officer: officerId,
    date: {
      $gte: targetDate,
      $lte: new Date(targetDate.getTime() + 86399999)
    }
  };

  if (excludeAssignmentId) {
    query._id = { $ne: excludeAssignmentId };
  }

  const existingAssignments = await DutyAssignment.find(query);

  const targetStart = getShiftTimestamp(targetDate, startTime);
  const isTargetNight = Number(startTime.slice(0, 2)) > Number(endTime.slice(0, 2));
  const targetEnd = getShiftTimestamp(targetDate, endTime, isTargetNight);

  for (const existing of existingAssignments) {
    if (existing.dutyType === "OFF") continue;

    const existTimes = parseShiftTimes(existing.shift, existing.startTime, existing.endTime);
    const existStart = getShiftTimestamp(existing.date, existTimes.startTime);
    const isExistNight = Number(existTimes.startTime.slice(0, 2)) > Number(existTimes.endTime.slice(0, 2));
    const existEnd = getShiftTimestamp(existing.date, existTimes.endTime, isExistNight);

    // Overlap condition: targetStart < existEnd && targetEnd > existStart
    if (targetStart < existEnd && targetEnd > existStart) {
      return {
        valid: false,
        code: "SHIFT_OVERLAP_CONFLICT",
        message: `Officer ${officerName} already has an overlapping duty (${existing.dutyType}) during shift ${existing.shift} on ${formatDateStr(dutyDate)}.`
      };
    }
  }

  return { valid: true };
};

/**
 * 5. Validate Minimum Rest Period (>= 8 Hours Rest)
 */
const validateMinimumRest = async (officerId, dutyDate, shiftStr, excludeAssignmentId = null, officerName = "Officer") => {
  const targetDate = toMidnight(dutyDate);
  const prevDate = new Date(targetDate);
  prevDate.setDate(prevDate.getDate() - 1);
  const nextDate = new Date(targetDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const query = {
    officer: officerId,
    date: {
      $gte: prevDate,
      $lte: new Date(nextDate.getTime() + 86399999)
    }
  };

  if (excludeAssignmentId) {
    query._id = { $ne: excludeAssignmentId };
  }

  const nearbyAssignments = await DutyAssignment.find(query);
  const { startTime, endTime } = parseShiftTimes(shiftStr);
  const isTargetNight = Number(startTime.slice(0, 2)) > Number(endTime.slice(0, 2));
  const targetStartMs = getShiftTimestamp(targetDate, startTime);
  const targetEndMs = getShiftTimestamp(targetDate, endTime, isTargetNight);

  for (const existing of nearbyAssignments) {
    if (existing.dutyType === "OFF") continue;

    const existTimes = parseShiftTimes(existing.shift, existing.startTime, existing.endTime);
    const isExistNight = Number(existTimes.startTime.slice(0, 2)) > Number(existTimes.endTime.slice(0, 2));
    const existStartMs = getShiftTimestamp(existing.date, existTimes.startTime);
    const existEndMs = getShiftTimestamp(existing.date, existTimes.endTime, isExistNight);

    // If existing duty ended before target duty started
    if (existEndMs <= targetStartMs) {
      const restHours = (targetStartMs - existEndMs) / (1000 * 60 * 60);
      if (restHours < MIN_REST_HOURS) {
        return {
          valid: false,
          code: "MIN_REST_CONFLICT",
          message: `Insufficient rest period for Officer ${officerName}. Requires at least ${MIN_REST_HOURS} hours of rest between consecutive duties (found ${restHours.toFixed(1)} hours after previous duty on ${formatDateStr(existing.date)}).`
        };
      }
    }

    // If target duty ends before existing duty starts
    if (targetEndMs <= existStartMs) {
      const restHours = (existStartMs - targetEndMs) / (1000 * 60 * 60);
      if (restHours < MIN_REST_HOURS) {
        return {
          valid: false,
          code: "MIN_REST_CONFLICT",
          message: `Insufficient rest period for Officer ${officerName}. Requires at least ${MIN_REST_HOURS} hours of rest before next assigned duty on ${formatDateStr(existing.date)} (found ${restHours.toFixed(1)} hours rest).`
        };
      }
    }
  }

  return { valid: true };
};

/**
 * 6. Validate Maximum Consecutive Same Duty (<= 3 Consecutive Assignments)
 */
const validateMaxConsecutiveDuty = async (officerId, dutyDate, dutyType, excludeAssignmentId = null, officerName = "Officer") => {
  if (dutyType === "OFF") return { valid: true };

  const targetDate = toMidnight(dutyDate);

  // Fetch officer assignments within +/- 5 days to check consecutive streak
  const windowStart = new Date(targetDate);
  windowStart.setDate(windowStart.getDate() - 5);
  const windowEnd = new Date(targetDate);
  windowEnd.setDate(windowEnd.getDate() + 5);

  const query = {
    officer: officerId,
    date: { $gte: windowStart, $lte: windowEnd }
  };

  if (excludeAssignmentId) {
    query._id = { $ne: excludeAssignmentId };
  }

  const assignments = await DutyAssignment.find(query).sort({ date: 1 });

  // Map assignments by YYYY-MM-DD
  const dutyByDate = {};
  assignments.forEach((a) => {
    dutyByDate[formatDateStr(a.date)] = a.dutyType;
  });

  // Inject candidate duty on target date
  dutyByDate[formatDateStr(targetDate)] = dutyType;

  // Count max consecutive streak containing targetDate
  let consecutiveCount = 0;
  let curr = new Date(targetDate);

  // Count backwards
  while (dutyByDate[formatDateStr(curr)] === dutyType) {
    consecutiveCount++;
    curr.setDate(curr.getDate() - 1);
  }

  // Count forwards
  curr = new Date(targetDate);
  curr.setDate(curr.getDate() + 1);
  while (dutyByDate[formatDateStr(curr)] === dutyType) {
    consecutiveCount++;
    curr.setDate(curr.getDate() + 1);
  }

  if (consecutiveCount > MAX_CONSECUTIVE_SAME_DUTY) {
    return {
      valid: false,
      code: "MAX_CONSECUTIVE_DUTY_CONFLICT",
      message: `Officer ${officerName} cannot be assigned to '${dutyType}' for more than ${MAX_CONSECUTIVE_SAME_DUTY} consecutive days (attempted ${consecutiveCount} consecutive days).`
    };
  }

  return { valid: true };
};

/**
 * Comprehensive Single Function Validation Service
 */
const validateAssignment = async (data, options = {}) => {
  const { officer, date, dutyType, shift, roster, _id } = data;
  const excludeAssignmentId = _id || options.excludeAssignmentId || null;

  // 1. Officer Validation
  const officerCheck = await validateActiveOfficer(officer);
  if (!officerCheck.valid) return officerCheck;
  const officerObj = officerCheck.officer;
  const officerName = officerObj.fullName || officerObj.username || "Officer";

  // 2. Roster Date Validation
  const dateCheck = await validateRosterDate(roster, date);
  if (!dateCheck.valid) return dateCheck;

  // 3. Approved Leave Conflict
  const leaveCheck = await validateLeaveConflict(officer, date, officerName);
  if (!leaveCheck.valid) return leaveCheck;

  // If duty is OFF, skip rest/shift/consecutive validations
  if (dutyType === "OFF") {
    return { valid: true, officer: officerObj };
  }

  // 4. Shift Overlap Conflict
  const overlapCheck = await validateShiftOverlap(officer, date, shift, excludeAssignmentId, officerName);
  if (!overlapCheck.valid) return overlapCheck;

  // 5. Minimum Rest Conflict
  const restCheck = await validateMinimumRest(officer, date, shift, excludeAssignmentId, officerName);
  if (!restCheck.valid) return restCheck;

  // 6. Max Consecutive Duty Conflict
  const consecutiveCheck = await validateMaxConsecutiveDuty(officer, date, dutyType, excludeAssignmentId, officerName);
  if (!consecutiveCheck.valid) return consecutiveCheck;

  return { valid: true, officer: officerObj };
};

module.exports = {
  validateActiveOfficer,
  validateLeaveConflict,
  validateRosterDate,
  validateShiftOverlap,
  validateMinimumRest,
  validateMaxConsecutiveDuty,
  validateAssignment,
  parseShiftTimes,
  formatDateStr,
  toMidnight
};
