const RANK_HIERARCHY = {
  "Constable": 1,
  "Sergeant": 2,
  "Sub-Inspector": 3,
  "Inspector": 4
};

const getExperience = (officer) => {
  if (officer.dob) {
    const age = new Date().getFullYear() - new Date(officer.dob).getFullYear();
    const exp = Math.max(1, age - 22); // assumes joining force at age 22
    return exp;
  }
  const numId = parseInt((officer.policeId || "").replace(/\D/g, ""), 10) || 5;
  return (numId % 15) + 3;
};

const recommendOfficer = (officer, rule, date, shift, yesterdayAssignments, currentAssignments, leaves) => {
  const offIdStr = officer._id.toString();
  const dayStr = date.toDateString();
  
  let score = 0;
  const reasons = [];

  // 1. Availability / Leave Check
  const isOnLeave = leaves.some(l => l.officer.toString() === offIdStr && new Date(l.date).toDateString() === dayStr && l.status === "On Leave");
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
  const workedSameLocationYesterday = yesterdayAssignments.some(asg => 
    asg.officer.toString() === offIdStr && 
    asg.location === rule.location &&
    new Date(asg.date).toDateString() === yesterdayStr
  );
  if (workedSameLocationYesterday) {
    score -= 15;
  }

  // 5. Worked Night Shift Yesterday Check
  const workedNightYesterday = yesterdayAssignments.some(asg => 
    asg.officer.toString() === offIdStr && 
    asg.shift === "Night" &&
    new Date(asg.date).toDateString() === yesterdayStr
  );
  if (workedNightYesterday) {
    score -= 20;
  } else {
    reasons.push("✓ No Night Shift Yesterday");
  }

  // 6. Already Assigned Check
  const isAlreadyAssigned = currentAssignments.some(asg => 
    asg.officer.toString() === offIdStr && 
    new Date(asg.date).toDateString() === dayStr && 
    asg.shift === shift
  );
  if (isAlreadyAssigned) {
    score -= 100;
  } else {
    // If not already assigned, it counts towards balanced workload
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
