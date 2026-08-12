const RANK_HIERARCHY = {
  "Constable": 1,
  "Sergeant": 2,
  "Sub-Inspector": 3,
  "Inspector": 4
};

const getExperience = (officer) => {
  if (officer && officer.dob) {
    const age = new Date().getFullYear() - new Date(officer.dob).getFullYear();
    const exp = Math.max(1, age - 22); // assumes joining force at age 22
    return exp;
  }
  const numId = parseInt((officer && officer.policeId || "").replace(/\D/g, ""), 10) || 5;
  return (numId % 15) + 3;
};

const getSriLankaDayBoundaries = (dateInput) => {
  const d = new Date(dateInput);
  const slDateStr = d.toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
  const [year, month, day] = slDateStr.split("-").map(Number);

  const startOfSLDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - (5.5 * 60 * 60 * 1000));
  const endOfSLDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - (5.5 * 60 * 60 * 1000));

  return { startOfSLDay, endOfSLDay };
};

const recommendOfficer = (
  officer,
  rule,
  date,
  shift,
  yesterdayAssignments = [],
  currentAssignments = [],
  leaves = [],
  consecutiveAssignmentsCount = 0,
  assignedVehicle = null
) => {
  if (!officer || !officer._id) {
    return { score: -9999, reason: "✗ Invalid Officer" };
  }

  const offIdStr = officer._id.toString();
  const dayStr = date.toDateString();
  
  let score = 0;
  const reasons = [];

  // 1. Availability / Leave Check (Hard Constraint using Sri Lanka Time Boundaries)
  const { startOfSLDay, endOfSLDay } = getSriLankaDayBoundaries(date);

  const activeLeave = Array.isArray(leaves) && leaves.find(l => {
    if (!l || !l.officer) return false;
    const leaveOffId = (l.officer._id || l.officer).toString();
    if (leaveOffId !== offIdStr) return false;

    const leaveStart = new Date(l.startDate);
    const leaveEnd = new Date(l.endDate);

    return leaveStart <= endOfSLDay && leaveEnd >= startOfSLDay;
  });

  if (activeLeave) {
    const typeStr = activeLeave.leaveType ? ` (${activeLeave.leaveType})` : "";
    return { score: -9999, reason: `✗ On Approved Leave${typeStr}` };
  } else {
    score += 30;
    reasons.push("✓ Available");
  }

  // 2. Correct Rank Check
  const officerRankVal = RANK_HIERARCHY[officer.rank] || 1;
  const requiredRankVal = RANK_HIERARCHY[rule.minRank] || 1;
  if (officerRankVal < requiredRankVal) {
    return { score: -9999, reason: `✗ Below Min Rank (${rule.minRank})` };
  } else {
    score += 20;
    reasons.push(`✓ ${officer.rank}`);
  }

  // 3. Maximum Consecutive Assignments Check (Hard limit)
  const maxAllowedConsecutive = rule.maxConsecutiveAssignments || 3;
  if (consecutiveAssignmentsCount >= maxAllowedConsecutive) {
    return {
      score: -9999,
      reason: `✗ Max Consecutive Duty Limit Reached (${consecutiveAssignmentsCount}/${maxAllowedConsecutive})`
    };
  } else if (consecutiveAssignmentsCount > 0) {
    score -= (consecutiveAssignmentsCount * 10);
    reasons.push(`✓ Consecutive Shifts: ${consecutiveAssignmentsCount}/${maxAllowedConsecutive}`);
  }

  // 4. Relevant Experience Check
  const exp = getExperience(officer);
  if (exp >= 5) {
    score += 20;
    reasons.push(`✓ ${exp} Years Experience`);
  }

  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  // 5. Worked Same Location Yesterday Check
  const workedSameLocationYesterday = Array.isArray(yesterdayAssignments) && yesterdayAssignments.some(asg => 
    asg && asg.officer && asg.officer.toString() === offIdStr && 
    asg.location === rule.location &&
    new Date(asg.date).toDateString() === yesterdayStr
  );
  if (workedSameLocationYesterday) {
    score -= 15;
  }

  // 6. Worked Night Shift Yesterday Check
  const workedNightYesterday = Array.isArray(yesterdayAssignments) && yesterdayAssignments.some(asg => 
    asg && asg.officer && asg.officer.toString() === offIdStr && 
    asg.shift && asg.shift.toLowerCase().includes("night") &&
    new Date(asg.date).toDateString() === yesterdayStr
  );
  if (workedNightYesterday) {
    score -= 20;
  } else {
    reasons.push("✓ No Night Shift Yesterday");
  }

  // 7. Already Assigned Check
  const isAlreadyAssigned = Array.isArray(currentAssignments) && currentAssignments.some(asg => 
    asg && asg.officer && asg.officer.toString() === offIdStr && 
    new Date(asg.date).toDateString() === dayStr && 
    asg.shift === shift
  );
  if (isAlreadyAssigned) {
    return { score: -9999, reason: "✗ Already Assigned on Shift" };
  } else {
    reasons.push("✓ Balanced Workload");
  }

  // 8. Vehicle Requirement Check Note
  if (rule.requiresVehicle) {
    if (assignedVehicle) {
      reasons.push(`✓ Vehicle Allocated: ${assignedVehicle.vehicleType} (${assignedVehicle.registrationNo})`);
    } else {
      reasons.push(`⚠️ Vehicle required (${rule.vehicleType || "Fleet"}) - unassigned`);
    }
  }

  return {
    score,
    reason: reasons.join("\n")
  };
};

module.exports = {
  recommendOfficer,
  getExperience
};
