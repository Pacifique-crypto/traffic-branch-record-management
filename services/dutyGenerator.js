const Officer = require("../models/Officer");
const OfficerAvailability = require("../models/OfficerAvailability");
const DutyRule = require("../models/DutyRule");
const Shift = require("../models/Shift");
const Vehicle = require("../models/Vehicle");

/**
 * Format a Date object as a local YYYY-MM-DD string.
 */
const formatDateLocal = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Parse a shift string (e.g., "06:00-18:00", "18:00-06:00") into start/end DateTimes and duration.
 * 
 * @param {string} dateStr Local YYYY-MM-DD date string
 * @param {string} shiftStr Shift time range string
 * @returns {Object} Parsed shift timing details
 */
function parseShiftTimes(dateStr, shiftStr = "06:00-18:00") {
  const parts = String(shiftStr).split("-").map(p => p.trim());
  let startTimeStr = parts[0] || "06:00";
  let endTimeStr = parts[1] || "18:00";

  if (!startTimeStr.includes(":")) startTimeStr += ":00";
  if (!endTimeStr.includes(":")) endTimeStr += ":00";

  const [startHH, startMM] = startTimeStr.split(":").map(Number);
  const [endHH, endMM] = endTimeStr.split(":").map(Number);

  const startMs = new Date(`${dateStr}T${String(startHH).padStart(2, "0")}:${String(startMM).padStart(2, "0")}:00`).getTime();

  let endMs;
  // If end time is less than or equal to start time, the shift crosses midnight (ends next day)
  if (endHH < startHH || (endHH === startHH && endMM <= startMM)) {
    const nextDate = new Date(startMs);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextDateStr = formatDateLocal(nextDate);
    endMs = new Date(`${nextDateStr}T${String(endHH).padStart(2, "0")}:${String(endMM).padStart(2, "0")}:00`).getTime();
  } else {
    endMs = new Date(`${dateStr}T${String(endHH).padStart(2, "0")}:${String(endMM).padStart(2, "0")}:00`).getTime();
  }

  const durationHours = Math.max(0.5, (endMs - startMs) / (1000 * 60 * 60));
  const isNightDuty = startHH >= 18 || endHH <= 6 || (endMs - startMs > 8 * 3600 * 1000 && startHH >= 14);

  return {
    shiftStr,
    startTimeStr,
    endTimeStr,
    startMs,
    endMs,
    startDateTime: new Date(startMs),
    endDateTime: new Date(endMs),
    durationHours,
    isOvernight: endMs > startMs + (12 * 60 * 60 * 1000) || endHH < startHH,
    isNightDuty
  };
}

/**
 * Check if two shift time windows overlap: (StartA < EndB) and (EndA > StartB)
 */
function doShiftsOverlap(shiftA, shiftB) {
  return shiftA.startMs < shiftB.endMs && shiftA.endMs > shiftB.startMs;
}

/**
 * Check if two shifts are adjacent/touching (e.g. EndA === StartB or EndB === StartA)
 */
function areShiftsAdjacent(shiftA, shiftB) {
  return shiftA.endMs === shiftB.startMs || shiftB.endMs === shiftA.startMs;
}

/**
 * Calculate consecutive working days up to current target date for an officer's shift list.
 */
function getConsecutiveWorkingDays(assignedShifts, targetDateStr) {
  if (!assignedShifts || assignedShifts.length === 0) return 0;

  const uniqueDates = Array.from(new Set(assignedShifts.map(s => s.dateStr))).sort();
  const targetTime = new Date(targetDateStr).getTime();

  let count = 0;
  let checkTime = targetTime - (24 * 60 * 60 * 1000);

  while (true) {
    const checkDateStr = formatDateLocal(new Date(checkTime));
    if (uniqueDates.includes(checkDateStr)) {
      count++;
      checkTime -= (24 * 60 * 60 * 1000);
    } else {
      break; // Non-working day breaks the consecutive chain
    }
  }

  return count;
}

/**
 * Auto-generates a duty roster for a given date range based on rules, requirements, and officer eligibility.
 * 
 * @param {Object} params
 * @param {string|Date} params.weekStart
 * @param {string|Date} params.weekEnd
 * @param {Array} params.dutyRequirements
 * @param {Array} params.specialDuties
 * @param {Object} params.enabledRules
 * @returns {Promise<Object>} Generated roster result containing assignments, conflicts, warnings, unassignedDuties, and statistics.
 */
async function generateDutyRoster({ weekStart, weekEnd, dutyRequirements = [], specialDuties = [], enabledRules = {} }) {
  const start = new Date(weekStart);
  const end = new Date(weekEnd);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    throw new Error("Invalid weekStart or weekEnd date parameters.");
  }

  // 1. Fetch active officers (exclude status "Pending")
  const activeOfficers = await Officer.find({ status: { $ne: "Pending" } }).lean();

  // 2. Fetch leave records overlapping the week date range
  const startOfDay = new Date(start);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(end);
  endOfDay.setHours(23, 59, 59, 999);

  const leaves = await OfficerAvailability.find({
    startDate: { $lte: endOfDay },
    endDate: { $gte: startOfDay }
  }).lean();

  // 3. Fetch Vehicles & Shifts & DutyRules
  const availableVehicles = await Vehicle.find({
    status: { $in: ["AVAILABLE", "Available", "APPROVED", "Approved", "Active"] }
  }).lean();

  const dbRules = await DutyRule.find({}).populate("shift").lean();

  // Parse Configured Rule Limits
  const maxConsecutiveLimit = Number(enabledRules.maxConsecutiveAssignments || enabledRules.maxConsecutiveDays || 5);
  const minRestHours = Number(enabledRules.minRestHours || 8);
  const avoidMorningAfterNight = enabledRules.avoidMorningAfterNight !== false;
  const maxNightDutiesLimit = Number(enabledRules.maxNightDuties || 3);

  // Output data structures
  const assignments = [];
  const conflicts = [];
  const warnings = [];
  const unassignedDuties = [];

  // Workload tracking per officer
  const officerWorkload = {}; // officerId -> { dutyCount, totalHours, nightCount, shifts: [] }
  activeOfficers.forEach(o => {
    officerWorkload[o._id.toString()] = {
      dutyCount: 0,
      totalHours: 0,
      nightCount: 0,
      shifts: []
    };
  });

  // Track vehicle assignments to prevent overlapping vehicle usage
  const vehicleUsages = []; // { vehicleId, startMs, endMs, dateStr, shiftStr }

  // Generate list of dates from start to end
  const datesList = [];
  let curr = new Date(startOfDay);
  while (curr <= endOfDay) {
    datesList.push(new Date(curr));
    curr.setDate(curr.getDate() + 1);
  }

  let totalDutiesRequiredCount = 0;

  // Rank weight dictionary for hard minRank enforcement & scoring preference
  const rankWeights = {
    "Inspector": 40,
    "Sub-Inspector": 30,
    "SI": 30,
    "Sergeant": 20,
    "Constable": 10,
    "PC": 10,
    "WPC": 10
  };

  // Helper: Check if an officer has an APPROVED leave on a specific date
  const isOfficerOnApprovedLeaveOnDate = (officerId, targetDate) => {
    const targetStart = new Date(targetDate);
    targetStart.setHours(0, 0, 0, 0);
    const targetEnd = new Date(targetDate);
    targetEnd.setHours(23, 59, 59, 999);

    return leaves.some(l => {
      const offId = l.officer?._id || l.officer;
      if (!offId || offId.toString() !== officerId.toString()) return false;

      // Only APPROVED leave blocks duty assignment; Pending and Rejected leaves do NOT block
      if ((l.status || "").toLowerCase() !== "approved") return false;

      const lStart = new Date(l.startDate);
      const lEnd = new Date(l.endDate);

      return lStart <= targetEnd && lEnd >= targetStart;
    });
  };

  // Process day by day
  for (const dateObj of datesList) {
    const dateStr = formatDateLocal(dateObj);

    const dayRequirements = [];

    // Add normal duty requirements for this day, resolving defaults against database DutyRules where applicable
    for (const req of dutyRequirements) {
      const reqType = req.type || req.dutyType || "Traffic Patrol";
      const reqLoc = req.location || "Police Station";

      const dbMatch = dbRules.find(r => 
        (r.dutyType || "").toLowerCase() === reqType.toLowerCase() &&
        (!req.location || (r.location || "").toLowerCase() === reqLoc.toLowerCase())
      );

      const minRank = req.minRank || req.rank || (dbMatch ? dbMatch.minRank : null);
      const requiresVehicle = req.requiresVehicle !== undefined ? Boolean(req.requiresVehicle) : (dbMatch ? Boolean(dbMatch.requiresVehicle) : false);
      const vehicleType = req.vehicleType || (dbMatch ? dbMatch.vehicleType : "");

      dayRequirements.push({
        type: reqType,
        shift: req.shift || (dbMatch && dbMatch.shift ? dbMatch.shift.name : "06:00-18:00"),
        location: reqLoc,
        required: Number(req.required || 1),
        minRank: minRank && minRank !== "PC" && minRank !== "WPC" && minRank !== "Constable" ? minRank : (req.minRank ? req.minRank : null),
        priority: req.priority || (dbMatch ? dbMatch.priority : "Normal"),
        requiresVehicle,
        vehicleType,
        isSpecial: false
      });
    }

    // Add special duties ONLY if their date matches this specific day
    for (const sp of specialDuties) {
      let spDateStr = null;
      if (sp.date) {
        const d = new Date(sp.date);
        if (!isNaN(d.getTime())) {
          spDateStr = formatDateLocal(d);
        }
      }

      if (spDateStr === dateStr) {
        dayRequirements.push({
          type: sp.name || sp.dutyType || "Special Duty",
          shift: sp.shift || "06:00-18:00",
          location: sp.location || "Police Station",
          required: Number(sp.required || 1),
          minRank: sp.minRank || sp.rank || null,
          priority: sp.priority || "High Priority",
          requiresVehicle: Boolean(sp.requiresVehicle),
          vehicleType: sp.vehicleType || "",
          isSpecial: true,
          specialName: sp.name
        });
      }
    }

    // Process each requirement slot
    for (const req of dayRequirements) {
      for (let slot = 0; slot < req.required; slot++) {
        totalDutiesRequiredCount++;

        const parsedReqShift = parseShiftTimes(dateStr, req.shift);

        // Filter tracking counters for actionable conflict explanations
        let onLeaveCount = 0;
        let rankMismatchCount = 0;
        let overlapConflictCount = 0;
        let restViolationCount = 0;
        let consecutiveViolationCount = 0;
        let morningAfterNightCount = 0;
        let nightLimitCount = 0;

        let minRestFailureDetail = "";

        const eligibleCandidates = activeOfficers.filter(officer => {
          const offIdStr = officer._id.toString();
          const w = officerWorkload[offIdStr];

          // 1. Approved leave check
          if (isOfficerOnApprovedLeaveOnDate(officer._id, dateObj)) {
            onLeaveCount++;
            return false;
          }

          // 2. Hard minimum rank check ONLY if minRank is explicitly required
          if (req.minRank) {
            const reqRankWeight = rankWeights[req.minRank] || 0;
            const offRankWeight = rankWeights[officer.rank] || 0;
            if (offRankWeight < reqRankWeight) {
              rankMismatchCount++;
              return false;
            }
          }

          // 3. Prevent overlapping shifts for same officer
          const hasOverlap = w.shifts.some(existingShift => doShiftsOverlap(parsedReqShift, existingShift));
          if (hasOverlap) {
            overlapConflictCount++;
            return false;
          }

          // 4. Minimum rest period enforcement
          let restViolated = false;
          for (const existingShift of w.shifts) {
            // If existing shift ended before current shift starts
            if (existingShift.endMs <= parsedReqShift.startMs) {
              const restHours = (parsedReqShift.startMs - existingShift.endMs) / (1000 * 60 * 60);
              if (restHours < minRestHours) {
                restViolated = true;
                minRestFailureDetail = `${restHours.toFixed(1)} hours rest since previous duty; minimum is ${minRestHours} hours`;
                break;
              }
            }
            // If existing shift starts after current shift ends
            if (existingShift.startMs >= parsedReqShift.endMs) {
              const restHours = (existingShift.startMs - parsedReqShift.endMs) / (1000 * 60 * 60);
              if (restHours < minRestHours) {
                restViolated = true;
                minRestFailureDetail = `${restHours.toFixed(1)} hours rest before next assigned duty; minimum is ${minRestHours} hours`;
                break;
              }
            }
          }
          if (restViolated) {
            restViolationCount++;
            return false;
          }

          // 5. Morning-after-night protection
          if (avoidMorningAfterNight) {
            const hadNightShiftBefore = w.shifts.some(existingShift => {
              if (!existingShift.isNightDuty) return false;
              // Check if existing night shift ended on dateStr between 04:00 and 09:00, and current shift is morning shift (starts <= 09:00)
              const existingEnd = new Date(existingShift.endMs);
              const endHour = existingEnd.getHours();
              const reqStartHour = new Date(parsedReqShift.startMs).getHours();

              const endsOnSameDate = formatDateLocal(existingEnd) === dateStr;
              return endsOnSameDate && endHour >= 4 && endHour <= 9 && reqStartHour <= 9;
            });
            if (hadNightShiftBefore) {
              morningAfterNightCount++;
              return false;
            }
          }

          // 6. Maximum consecutive assignments limit
          const currentConsecutive = getConsecutiveWorkingDays(w.shifts, dateStr);
          if (currentConsecutive >= maxConsecutiveLimit) {
            consecutiveViolationCount++;
            return false;
          }

          // 7. Night duty limit check
          if (parsedReqShift.isNightDuty && w.nightCount >= maxNightDutiesLimit) {
            nightLimitCount++;
            return false;
          }

          return true;
        });

        // Prefer candidate officers with 0 duties assigned on this date
        let candidatePool = eligibleCandidates.filter(officer => {
          const offShifts = officerWorkload[officer._id.toString()].shifts;
          return !offShifts.some(s => s.dateStr === dateStr);
        });

        // Fallback: If no officer has 0 duties today, use eligible candidates without overlapping shift
        if (candidatePool.length === 0) {
          candidatePool = eligibleCandidates;
        }

        // Handle case when no officer candidate is eligible
        if (candidatePool.length === 0) {
          let specificReason = "No eligible officer available after applying scheduling constraints.";

          if (onLeaveCount > 0 && onLeaveCount === activeOfficers.length) {
            specificReason = "No eligible officer available because all candidates are on approved leave.";
          } else if (rankMismatchCount > 0 && (rankMismatchCount + onLeaveCount === activeOfficers.length)) {
            specificReason = `No officer meets required minimum rank (${req.minRank}).`;
          } else if (restViolationCount > 0) {
            specificReason = `Officer has insufficient rest (${minRestFailureDetail || 'below minimum threshold'}).`;
          } else if (morningAfterNightCount > 0) {
            specificReason = "Officer has insufficient rest after previous night duty.";
          } else if (consecutiveViolationCount > 0) {
            specificReason = `Officer has reached maximum consecutive assignments (${maxConsecutiveLimit} days).`;
          } else if (nightLimitCount > 0) {
            specificReason = `Officer has reached maximum night duty limit (${maxNightDutiesLimit}).`;
          } else if (overlapConflictCount > 0) {
            specificReason = "All eligible officers have conflicting overlapping shift assignments.";
          }

          unassignedDuties.push({
            date: dateStr,
            dutyType: req.type,
            shift: req.shift,
            location: req.location,
            reason: specificReason
          });
          conflicts.push({
            date: dateStr,
            dutyType: req.type,
            severity: "Critical",
            message: `Unassigned duty on ${dateStr} for ${req.type} (${req.shift} at ${req.location}) - ${specificReason}`
          });
          continue;
        }

        // Vehicle matching handling
        let assignedVehicle = null;

        if (req.requiresVehicle) {
          const matchingVeh = availableVehicles.find(v => {
            const typeMatch = !req.vehicleType || (v.vehicleType || "").toLowerCase() === req.vehicleType.toLowerCase();
            const isAssignedOverlapping = vehicleUsages.some(u => 
              u.vehicleId.toString() === v._id.toString() && doShiftsOverlap(parsedReqShift, u.parsedShift)
            );
            return typeMatch && !isAssignedOverlapping;
          });

          if (matchingVeh) {
            assignedVehicle = {
              _id: matchingVeh._id,
              registrationNo: matchingVeh.registrationNo,
              vehicleType: matchingVeh.vehicleType
            };
            vehicleUsages.push({
              vehicleId: matchingVeh._id,
              dateStr,
              shiftStr: req.shift,
              parsedShift: parsedReqShift
            });
          } else {
            const vehicleReason = req.vehicleType 
              ? `No available ${req.vehicleType} vehicle.`
              : "No available vehicle for duty.";

            unassignedDuties.push({
              date: dateStr,
              dutyType: req.type,
              shift: req.shift,
              location: req.location,
              reason: vehicleReason
            });
            conflicts.push({
              date: dateStr,
              dutyType: req.type,
              severity: "Critical",
              message: `Unassigned duty on ${dateStr} for ${req.type} (${req.shift} at ${req.location}) - ${vehicleReason}`
            });
            warnings.push({
              date: dateStr,
              dutyType: req.type,
              message: `Duty on ${dateStr} requires vehicle (${req.vehicleType || 'Any'}), but no available vehicle was found.`
            });
            continue; // Cannot fulfill vehicle requirement
          }
        }

        // Advanced candidate scoring with workload fairness, seniority, and rank preference
        const scoredCandidates = candidatePool.map(officer => {
          const w = officerWorkload[officer._id.toString()];

          // Workload Fairness Penalty: Ensure high workload disparity strongly favors lower workload officer
          const workloadPenalty = (w.dutyCount * 20) + (w.totalHours * 3) + (w.nightCount * 15);
          const workloadScore = 150 - workloadPenalty;

          // Seniority / Experience from joinedDate
          const joinedYear = officer.joinedDate ? new Date(officer.joinedDate).getFullYear() : 2026;
          const yearsOfService = Math.max(0, 2026 - joinedYear);
          const experienceScore = Math.min(yearsOfService * 2, 20);

          // Rank preference score
          const offRankWeight = rankWeights[officer.rank] || 10;

          const totalScore = workloadScore + experienceScore + offRankWeight;

          return { officer, totalScore, yearsOfService, workload: w };
        });

        // Sort candidates descending by totalScore
        scoredCandidates.sort((a, b) => b.totalScore - a.totalScore);
        const selected = scoredCandidates[0];
        const selectedOfficer = selected.officer;
        const offIdStr = selectedOfficer._id.toString();

        // Update workload tracking for selected officer
        officerWorkload[offIdStr].dutyCount += 1;
        officerWorkload[offIdStr].totalHours += parsedReqShift.durationHours;
        if (parsedReqShift.isNightDuty) {
          officerWorkload[offIdStr].nightCount += 1;
        }

        // Calculate minimum rest achieved since last duty for recommendation explanation
        let minRestAchieved = 24;
        for (const existingShift of officerWorkload[offIdStr].shifts) {
          if (existingShift.endMs <= parsedReqShift.startMs) {
            const restH = (parsedReqShift.startMs - existingShift.endMs) / (1000 * 60 * 60);
            if (restH < minRestAchieved) minRestAchieved = restH;
          }
        }

        officerWorkload[offIdStr].shifts.push({
          dateStr,
          shiftStr: req.shift,
          startMs: parsedReqShift.startMs,
          endMs: parsedReqShift.endMs,
          durationHours: parsedReqShift.durationHours,
          isNightDuty: parsedReqShift.isNightDuty,
          dutyType: req.type
        });

        // Generate Warning if workload is high (>= 4 duties or >= 48 hours)
        if (officerWorkload[offIdStr].dutyCount >= 4 || officerWorkload[offIdStr].totalHours >= 48) {
          warnings.push({
            date: dateStr,
            dutyType: req.type,
            message: `Officer ${selectedOfficer.fullName} assigned high workload (${officerWorkload[offIdStr].dutyCount} duties / ${officerWorkload[offIdStr].totalHours.toFixed(1)} hrs this week).`
          });
        }

        // Build transparent AI Recommendation Reason
        const reasonCount = candidatePool.length;
        const reasonParts = [];
        reasonParts.push(`Selected from ${reasonCount} eligible officer(s)`);
        reasonParts.push(`lower workload (${officerWorkload[offIdStr].dutyCount - 1} duties / ${(officerWorkload[offIdStr].totalHours - parsedReqShift.durationHours).toFixed(1)} hrs)`);
        reasonParts.push(`Rank: ${selectedOfficer.rank || 'Constable'}`);
        if (selected.yearsOfService > 0) {
          reasonParts.push(`${selected.yearsOfService} yrs experience`);
        } else {
          reasonParts.push("New recruit");
        }
        if (officerWorkload[offIdStr].shifts.length > 1 && minRestAchieved < 24) {
          reasonParts.push(`${minRestAchieved.toFixed(1)} hrs rest since previous duty`);
        }
        if (assignedVehicle) {
          reasonParts.push(`Vehicle: ${assignedVehicle.registrationNo}`);
        }

        const aiRecommendationReason = reasonParts.join(", ") + ".";

        const assignmentObj = {
          officer: selectedOfficer._id,
          officerName: selectedOfficer.fullName,
          officerRank: selectedOfficer.rank || "Constable",
          officerPoliceId: selectedOfficer.policeId,
          location: req.location,
          dutyType: req.type,
          date: dateObj,
          dateStr: dateStr,
          shift: req.shift,
          remarks: req.isSpecial ? `Special Duty: ${req.specialName}` : `Auto-generated (${req.priority} Priority)`,
          aiRecommendationReason,
          vehicle: assignedVehicle
        };

        assignments.push(assignmentObj);
      }
    }
  }

  // Calculate statistics
  const unavailableOfficersCount = activeOfficers.filter(o =>
    leaves.some(l => 
      (l.officer?._id || l.officer)?.toString() === o._id.toString() &&
      (l.status || "").toLowerCase() === "approved"
    )
  ).length;

  const assignedOfficerIds = new Set(assignments.map(a => a.officer.toString()));

  const statistics = {
    totalDutiesRequired: totalDutiesRequiredCount,
    totalAssignmentsGenerated: assignments.length,
    unassignedDutiesCount: unassignedDuties.length,
    officersConsidered: activeOfficers.length,
    officersAssigned: assignedOfficerIds.size,
    officersUnavailable: unavailableOfficersCount,
    conflictsCount: conflicts.length,
    warningsCount: warnings.length
  };

  return {
    assignments,
    conflicts,
    warnings,
    unassignedDuties,
    statistics
  };
}

module.exports = {
  generateDutyRoster,
  parseShiftTimes,
  doShiftsOverlap,
  areShiftsAdjacent,
  getConsecutiveWorkingDays
};
