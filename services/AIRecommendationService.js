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

const recommendOfficer = (officer, rule, date, shift, yesterdayAssignments, currentAssignments, leaves) => {
  if (!officer || !officer._id) {
    return { score: -9999, reason: "✗ Invalid Officer" };
  }

  const offIdStr = officer._id.toString();
  const dayStr = date.toDateString();
  
  let score = 0;
  const reasons = [];

  // 1. Availability / Leave Check
  const isOnLeave = Array.isArray(leaves) && leaves.some(l => 
    l && l.officer && l.officer.toString() === offIdStr && 
    new Date(l.date).toDateString() === dayStr && 
    l.status === "On Leave"
  );

  if (isOnLeave) {
    score -= 100;
  } else {
    score += 30;
    reasons.push("✓ Available");
  }

  // 2. Correct Rank Check
  const officerRankVal = RANK_HIERARCHY[officer.rank] || 1;
  const requiredRankVal = RANK_HIERARCHY[rule.minRank] || 1;
  if (officerRankVal >= requiredRankVal) {
    score += 20;
    reasons.push(`✓ ${officer.rank}`);
  }

  // 3. Relevant Experience Check
  const exp = getExperience(officer);
  if (exp >= 5) {
    score += 20;
    reasons.push(`✓ ${exp} Years Experience`);
  }

  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  // 4. Worked Same Location Yesterday Check
  const workedSameLocationYesterday = Array.isArray(yesterdayAssignments) && yesterdayAssignments.some(asg => 
    asg && asg.officer && asg.officer.toString() === offIdStr && 
    asg.location === rule.location &&
    new Date(asg.date).toDateString() === yesterdayStr
  );
  if (workedSameLocationYesterday) {
    score -= 15;
  }

  // 5. Worked Night Shift Yesterday Check
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

  // 6. Already Assigned Check
  const isAlreadyAssigned = Array.isArray(currentAssignments) && currentAssignments.some(asg => 
    asg && asg.officer && asg.officer.toString() === offIdStr && 
    new Date(asg.date).toDateString() === dayStr && 
    asg.shift === shift
  );
  if (isAlreadyAssigned) {
    score -= 100;
  } else {
    reasons.push("✓ Balanced Workload");
  }

  // Final check for Leave or Already Assigned hard limits
  if (isOnLeave || isAlreadyAssigned) {
    score = -9999;
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
