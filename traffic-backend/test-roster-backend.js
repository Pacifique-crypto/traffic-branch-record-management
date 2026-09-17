/**
 * Automated Verification & Testing Script for Duty Roster Backend Foundation
 * Verifies all 12 requirement test cases (A through L)
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Officer = require("./models/Officer");
const OfficerAvailability = require("./models/OfficerAvailability");
const DutyRoster = require("./models/DutyRoster");
const DutyAssignment = require("./models/DutyAssignment");
const { validateAssignment, toMidnight, formatDateStr } = require("./services/rosterValidator");
const { ROSTER_STATUSES } = require("./config/rosterConfig");

async function runRosterBackendTests() {
  console.log("==================================================");
  console.log(" STARTING DUTY ROSTER BACKEND VERIFICATION TESTS");
  console.log("==================================================");

  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/traffic_db";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for testing. ✅\n");

    // 1. SETUP TEST OFFICERS
    let testOfficer = await Officer.findOne({ policeId: "TEST-PC-100" });
    if (!testOfficer) {
      testOfficer = await Officer.create({
        fullName: "Test Officer Perera",
        policeId: "TEST-PC-100",
        username: "test_pc_100",
        nic: "199510000000",
        gender: "Male",
        contactNo: "+94770000000",
        password: "password123",
        status: "Active"
      });
    }

    let inactiveOfficer = await Officer.findOne({ policeId: "TEST-PC-INACTIVE" });
    if (!inactiveOfficer) {
      inactiveOfficer = await Officer.create({
        fullName: "Inactive Officer Silva",
        policeId: "TEST-PC-INACTIVE",
        username: "test_pc_inactive",
        nic: "199510000001",
        gender: "Male",
        contactNo: "+94770000001",
        password: "password123",
        status: "Pending"
      });
    }

    // Clear old test rosters & assignments for clean run
    const testWeekStart = toMidnight("2026-10-04"); // Sunday Oct 4, 2026
    const testWeekEnd = new Date(testWeekStart);
    testWeekEnd.setDate(testWeekEnd.getDate() + 6); // Saturday Oct 10, 2026

    await DutyRoster.deleteMany({ rosterReference: /^ROSTER-TEST/ });
    await DutyAssignment.deleteMany({ officer: { $in: [testOfficer._id, inactiveOfficer._id] } });
    await OfficerAvailability.deleteMany({ officer: testOfficer._id });

    // 2. SETUP APPROVED LEAVE FOR TEST OFFICER
    // Approved leave: Oct 6, 2026 to Oct 7, 2026
    const approvedLeave = await OfficerAvailability.create({
      officer: testOfficer._id,
      startDate: toMidnight("2026-10-06"),
      endDate: toMidnight("2026-10-07"),
      leaveType: "Medical Leave",
      status: "Approved",
      remarks: "Test approved leave"
    });
    console.log("Test approved leave created for Officer Perera: 2026-10-06 to 2026-10-07 ✅");

    // A. TEST CREATE WEEKLY ROSTER
    const roster = await DutyRoster.create({
      rosterReference: `ROSTER-TEST-${Date.now()}`,
      title: "Test Oct 04-10 Weekly Roster",
      weekStart: testWeekStart,
      weekEnd: testWeekEnd,
      status: ROSTER_STATUSES.DRAFT,
      createdBy: testOfficer._id
    });
    console.log(`[TEST A - PASS] Weekly roster created: ID ${roster._id}, Ref ${roster.rosterReference} ✅`);

    // B. TEST CREATE DUTY ASSIGNMENT
    const assign1Val = await validateAssignment({
      officer: testOfficer._id,
      date: "2026-10-04",
      dutyType: "Point Duty",
      shift: "06:00 - 14:00 (Morning Shift)",
      location: "Poruthota Jn.",
      roster: roster._id
    });
    if (!assign1Val.valid) throw new Error(`Assign 1 failed: ${assign1Val.message}`);

    const assignment1 = await DutyAssignment.create({
      roster: roster._id,
      officer: testOfficer._id,
      date: toMidnight("2026-10-04"),
      dutyType: "Point Duty",
      shift: "06:00 - 14:00 (Morning Shift)",
      startTime: "06:00",
      endTime: "14:00",
      location: "Poruthota Jn."
    });
    console.log(`[TEST B - PASS] Duty assignment created on 2026-10-04: ID ${assignment1._id} ✅`);

    // C. TEST GET ROSTER
    const fetchedRoster = await DutyRoster.findById(roster._id).populate("assignments");
    console.log(`[TEST C - PASS] Fetched roster by ID. Assignments count: ${fetchedRoster.assignments.length} ✅`);

    // D. TEST GET DUTIES FOR DATE/WEEK
    const dateDuties = await DutyAssignment.find({ date: toMidnight("2026-10-04") });
    console.log(`[TEST D - PASS] Fetched duties for date 2026-10-04: count ${dateDuties.length} ✅`);

    // E. TEST EDIT AN EXISTING DUTY
    const editVal = await validateAssignment(
      {
        _id: assignment1._id,
        officer: testOfficer._id,
        date: "2026-10-04",
        dutyType: "Mobile Patrol",
        shift: "06:00 - 14:00 (Morning Shift)",
        location: "Sector 3",
        roster: roster._id
      },
      { excludeAssignmentId: assignment1._id }
    );
    if (!editVal.valid) throw new Error(`Edit validation failed: ${editVal.message}`);

    assignment1.dutyType = "Mobile Patrol";
    assignment1.location = "Sector 3";
    await assignment1.save();
    console.log(`[TEST E - PASS] Duty assignment ${assignment1._id} edited successfully to 'Mobile Patrol' ✅`);

    // F. TEST DELETE A DUTY
    const deleteDuty = await DutyAssignment.create({
      roster: roster._id,
      officer: testOfficer._id,
      date: toMidnight("2026-10-05"),
      dutyType: "Checkpoint",
      shift: "06:00 - 14:00 (Morning Shift)",
      startTime: "06:00",
      endTime: "14:00",
      location: "Kurana"
    });
    await DutyAssignment.findByIdAndDelete(deleteDuty._id);
    console.log(`[TEST F - PASS] Duty assignment ${deleteDuty._id} deleted successfully ✅`);

    // G. TEST APPROVED LEAVE REJECTION
    const leaveCheck = await validateAssignment({
      officer: testOfficer._id,
      date: "2026-10-06", // Fall in approved leave period Oct 06-07
      dutyType: "Point Duty",
      shift: "06:00 - 14:00 (Morning Shift)",
      roster: roster._id
    });
    if (!leaveCheck.valid && leaveCheck.code === "APPROVED_LEAVE_CONFLICT") {
      console.log(`[TEST G - PASS] Approved leave assignment properly REJECTED: "${leaveCheck.message}" ✅`);
    } else {
      throw new Error(`TEST G FAILED: Expected leave conflict rejection, got: ${JSON.stringify(leaveCheck)}`);
    }

    // H. TEST OVERLAPPING DUTY REJECTION
    // Already assigned 06:00 - 14:00 on Oct 04. Attempt to assign 10:00 - 18:00 on Oct 04.
    const overlapCheck = await validateAssignment({
      officer: testOfficer._id,
      date: "2026-10-04",
      dutyType: "Checkpoint",
      shift: "10:00 - 18:00 (Day Shift)",
      roster: roster._id
    });
    if (!overlapCheck.valid && overlapCheck.code === "SHIFT_OVERLAP_CONFLICT") {
      console.log(`[TEST H - PASS] Overlapping shift assignment properly REJECTED: "${overlapCheck.message}" ✅`);
    } else {
      throw new Error(`TEST H FAILED: Expected overlap conflict rejection, got: ${JSON.stringify(overlapCheck)}`);
    }

    // I. TEST MINIMUM REST REJECTION (< 8 Hours Rest)
    // Assignment 1 ends at 14:00 on Oct 04. Attempt to assign night shift starting at 18:00 (only 4 hrs rest) on Oct 04.
    const restCheck = await validateAssignment({
      officer: testOfficer._id,
      date: "2026-10-04",
      dutyType: "Night Patrol",
      shift: "18:00 - 02:00",
      roster: roster._id
    });
    if (!restCheck.valid && restCheck.code === "MIN_REST_CONFLICT") {
      console.log(`[TEST I - PASS] Insufficient rest period (< 8h) properly REJECTED: "${restCheck.message}" ✅`);
    } else {
      throw new Error(`TEST I FAILED: Expected min rest conflict rejection, got: ${JSON.stringify(restCheck)}`);
    }

    // J. TEST MORE THAN 3 CONSECUTIVE SAME-DUTY REJECTION
    // Assign 3 consecutive days of "Point Duty" (Oct 07, Oct 08, Oct 09)
    for (const dStr of ["2026-10-07", "2026-10-08", "2026-10-09"]) {
      await DutyAssignment.create({
        roster: roster._id,
        officer: testOfficer._id,
        date: toMidnight(dStr),
        dutyType: "Point Duty",
        shift: "06:00 - 14:00 (Morning Shift)",
        startTime: "06:00",
        endTime: "14:00"
      });
    }

    // Attempt 4th consecutive day on Oct 10 (which is within roster period Oct 04-10)
    const consecutiveCheck = await validateAssignment({
      officer: testOfficer._id,
      date: "2026-10-10",
      dutyType: "Point Duty",
      shift: "06:00 - 14:00 (Morning Shift)",
      roster: roster._id
    });
    if (!consecutiveCheck.valid && consecutiveCheck.code === "MAX_CONSECUTIVE_DUTY_CONFLICT") {
      console.log(`[TEST J - PASS] >3 consecutive same-duty assignment properly REJECTED: "${consecutiveCheck.message}" ✅`);
    } else {
      throw new Error(`TEST J FAILED: Expected max consecutive duty conflict rejection, got: ${JSON.stringify(consecutiveCheck)}`);
    }

    // K. TEST INVALID / INACTIVE OFFICER REJECTION
    const inactiveCheck = await validateAssignment({
      officer: inactiveOfficer._id,
      date: "2026-10-04",
      dutyType: "Point Duty",
      shift: "06:00 - 14:00 (Morning Shift)"
    });
    if (!inactiveCheck.valid && (inactiveCheck.code === "INACTIVE_OFFICER" || inactiveCheck.code === "INVALID_OFFICER")) {
      console.log(`[TEST K - PASS] Inactive officer assignment properly REJECTED: "${inactiveCheck.message}" ✅`);
    } else {
      throw new Error(`TEST K FAILED: Expected inactive officer rejection, got: ${JSON.stringify(inactiveCheck)}`);
    }

    // L. TEST INVALID ROSTER DATE REJECTION
    // Roster period is Oct 04 to Oct 10. Attempt to assign Oct 25.
    const dateCheck = await validateAssignment({
      officer: testOfficer._id,
      date: "2026-10-25",
      dutyType: "Point Duty",
      shift: "06:00 - 14:00 (Morning Shift)",
      roster: roster._id
    });
    if (!dateCheck.valid && dateCheck.code === "INVALID_ROSTER_DATE") {
      console.log(`[TEST L - PASS] Out-of-bounds roster date assignment properly REJECTED: "${dateCheck.message}" ✅`);
    } else {
      throw new Error(`TEST L FAILED: Expected invalid roster date rejection, got: ${JSON.stringify(dateCheck)}`);
    }

    console.log("\n==================================================");
    console.log(" ALL 12 BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉");
    console.log("==================================================");

  } catch (error) {
    console.error("Test execution failed ❌:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected test MongoDB connection.");
  }
}

runRosterBackendTests();
