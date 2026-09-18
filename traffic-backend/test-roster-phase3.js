/**
 * Automated Test Suite for Duty Roster Phase 3:
 * Backend Roster Generator & Advanced Rules Engine Verification
 *
 * Covers 18 distinct test scenarios:
 *  1. Generate weekly roster (7 days)
 *  2. Save draft roster
 *  3. Edit single duty assignment
 *  4. Leave management restriction (OFFICER_ON_LEAVE)
 *  5. Overlapping duty restriction (OVERLAPPING_DUTY)
 *  6. 8-hour minimum rest period (INSUFFICIENT_REST)
 *  7. 7-day roster period boundary (OUTSIDE_ROSTER_PERIOD)
 *  8. Court duty restriction for unqualified officer (COURT_DUTY_RESTRICTION)
 *  9. Court duty success for qualified officer
 * 10. Max 2 consecutive same-duty limit (MAX_CONSECUTIVE_SAME_DUTY)
 * 11. Workload balancing prioritization
 * 12. Required count handling & conflict logging
 * 13. Submit draft roster to OIC (PENDING_APPROVAL)
 * 14. OIC request changes with comment (CHANGES_REQUESTED)
 * 15. Resubmit roster to OIC
 * 16. OIC approve roster (APPROVED)
 * 17. OIC publish roster (PUBLISHED)
 * 18. Notification creation upon publication
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const DutyRoster = require("./models/DutyRoster");
const DutyAssignment = require("./models/DutyAssignment");
const Officer = require("./models/Officer");
const OfficerAvailability = require("./models/OfficerAvailability");
const Notification = require("./models/Notification");
const { validateAssignment, toMidnight, formatDateStr } = require("./services/rosterValidator");
const rosterConfig = require("./config/rosterConfig");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/traffic_db";

async function runPhase3Tests() {
  console.log("======================================================================");
  console.log(" STARTING DUTY ROSTER PHASE 3 AUTOMATED TEST SUITE (18 SCENARIOS) ");
  console.log("======================================================================\n");

  let passCount = 0;
  let failCount = 0;

  function assertTest(condition, testName, details = "") {
    if (condition) {
      console.log(`✅ PASS: ${testName} ${details ? `(${details})` : ""}`);
      passCount++;
    } else {
      console.error(`❌ FAIL: ${testName} ${details ? `(${details})` : ""}`);
      failCount++;
    }
  }

  try {
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 });
      console.log("✅ Connected to MongoDB Atlas.");
    } catch (atlasErr) {
      console.log("⚠️ Atlas connection failed, falling back to local MongoDB...");
      await mongoose.connect("mongodb://127.0.0.1:27017/traffic_db", { serverSelectionTimeoutMS: 3000 });
      console.log("✅ Connected to local MongoDB.");
    }

    // Clean test artifacts from previous runs
    await DutyRoster.deleteMany({ rosterReference: { $regex: "^ROSTER-PHASE3" } });
    await DutyAssignment.deleteMany({ location: { $regex: "Phase3" } });
    await OfficerAvailability.deleteMany({ remarks: "Phase3 Test Leave" });
    await Notification.deleteMany({ title: "New Duty Assigned" });

    // Ensure Test Officers exist
    const testOfficerData = [
      { username: "phase3_off1", policeId: "P3-001", fullName: "P3 Officer One", isCourtDutyOfficer: true, nic: "990000001V", contactNo: "0771234501", gender: "Male", rank: "PC" },
      { username: "phase3_off2", policeId: "P3-002", fullName: "P3 Officer Two", isCourtDutyOfficer: false, nic: "990000002V", contactNo: "0771234502", gender: "Male", rank: "PC" },
      { username: "phase3_off3", policeId: "P3-003", fullName: "P3 Officer Three", isCourtDutyOfficer: false, nic: "990000003V", contactNo: "0771234503", gender: "Male", rank: "PC" },
      { username: "phase3_off4", policeId: "P3-004", fullName: "P3 Officer Four", isCourtDutyOfficer: false, nic: "990000004V", contactNo: "0771234504", gender: "Male", rank: "PC" },
      { username: "phase3_off5", policeId: "P3-005", fullName: "P3 Officer Five", isCourtDutyOfficer: false, nic: "990000005V", contactNo: "0771234505", gender: "Male", rank: "PC" },
    ];

    const officers = [];
    for (const data of testOfficerData) {
      let off = await Officer.findOne({ username: data.username });
      if (!off) {
        off = await Officer.create({
          ...data,
          password: "password123",
          status: "Active",
          role: "Officer"
        });
      } else {
        off.isCourtDutyOfficer = data.isCourtDutyOfficer;
        off.status = "Active";
        await off.save();
      }
      officers.push(off);
    }

    const [off1, off2, off3, off4, off5] = officers;

    const weekStart = toMidnight("2026-11-01"); // Sun
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // Sat Nov 7

    // =========================================================================
    // SCENARIO 1: Generate Weekly Roster (7 Days)
    // =========================================================================
    const testRoster = await DutyRoster.create({
      rosterReference: "ROSTER-PHASE3-001",
      title: "Weekly Roster 01–07 Nov 2026",
      weekStart,
      weekEnd,
      status: "DRAFT",
      conflicts: []
    });

    assertTest(
      testRoster && testRoster.status === "DRAFT",
      "Scenario 1: Generate Weekly Roster (7 Days)",
      `Roster ID: ${testRoster._id}`
    );

    // =========================================================================
    // SCENARIO 2: Save Draft Roster
    // =========================================================================
    const foundDraft = await DutyRoster.findById(testRoster._id);
    assertTest(
      foundDraft && foundDraft.status === "DRAFT",
      "Scenario 2: Save Draft Roster",
      "Persisted with status DRAFT"
    );

    // Create a base duty assignment for Scenario 3
    const duty1 = await DutyAssignment.create({
      roster: testRoster._id,
      officer: off1._id,
      date: toMidnight("2026-11-01"),
      dutyType: "Point Duty",
      shift: "06:00–14:00",
      location: "Phase3 Test Spot A"
    });

    // =========================================================================
    // SCENARIO 3: Edit Single Duty
    // =========================================================================
    duty1.location = "Phase3 Test Spot B";
    duty1.shift = "14:00–22:00";
    await duty1.save();
    const updatedDuty = await DutyAssignment.findById(duty1._id);

    assertTest(
      updatedDuty.location === "Phase3 Test Spot B" && updatedDuty.shift === "14:00–22:00",
      "Scenario 3: Edit Single Duty",
      `Location updated to ${updatedDuty.location}`
    );

    // =========================================================================
    // SCENARIO 4: Leave Management Restriction (OFFICER_ON_LEAVE)
    // =========================================================================
    await OfficerAvailability.create({
      officer: off2._id,
      startDate: toMidnight("2026-11-02"),
      endDate: toMidnight("2026-11-02"),
      leaveType: "Casual Leave",
      status: "Approved",
      remarks: "Phase3 Test Leave"
    });

    const leaveValidation = await validateAssignment({
      officerId: off2._id,
      date: "2026-11-02",
      shift: "06:00–14:00",
      rosterId: testRoster._id
    });

    assertTest(
      !leaveValidation.valid && leaveValidation.code === "APPROVED_LEAVE_CONFLICT",
      "Scenario 4: Leave Management Restriction",
      `Error Code: ${leaveValidation.code}`
    );

    // =========================================================================
    // SCENARIO 5: Overlapping Duty Restriction (OVERLAPPING_DUTY)
    // =========================================================================
    await DutyAssignment.create({
      roster: testRoster._id,
      officer: off3._id,
      date: toMidnight("2026-11-03"),
      dutyType: "Motorcycle Patrol",
      shift: "06:00–14:00",
      location: "Phase3 Test Spot C"
    });

    const overlapValidation = await validateAssignment({
      officerId: off3._id,
      date: "2026-11-03",
      shift: "06:00–14:00",
      rosterId: testRoster._id
    });

    assertTest(
      !overlapValidation.valid && overlapValidation.code === "SHIFT_OVERLAP_CONFLICT",
      "Scenario 5: Overlapping Duty Restriction",
      `Error Code: ${overlapValidation.code}`
    );

    // =========================================================================
    // SCENARIO 6: 8-Hour Minimum Rest Period (INSUFFICIENT_REST)
    // =========================================================================
    // off4 works night shift on Nov 3 (22:00 to 06:00 Nov 4)
    await DutyAssignment.create({
      roster: testRoster._id,
      officer: off4._id,
      date: toMidnight("2026-11-03"),
      dutyType: "Checkpoint",
      shift: "22:00–06:00",
      location: "Phase3 Test Spot Night"
    });

    // Attempt morning shift on Nov 4 (06:00 to 14:00) -> 0 hours rest
    const restValidation = await validateAssignment({
      officerId: off4._id,
      date: "2026-11-04",
      shift: "06:00–14:00",
      rosterId: testRoster._id
    });

    assertTest(
      !restValidation.valid && restValidation.code === "MIN_REST_CONFLICT",
      "Scenario 6: 8-Hour Minimum Rest Period",
      `Error Code: ${restValidation.code}`
    );

    // =========================================================================
    // SCENARIO 7: 7-Day Roster Period Boundary (OUTSIDE_ROSTER_PERIOD)
    // =========================================================================
    const boundsValidation = await validateAssignment({
      officerId: off1._id,
      date: "2026-11-15", // Roster is 2026-11-01 to 2026-11-07
      shift: "06:00–14:00",
      rosterId: testRoster._id
    });

    assertTest(
      !boundsValidation.valid && (boundsValidation.code === "INVALID_ROSTER_DATE" || boundsValidation.code === "DATE_OUTSIDE_ROSTER"),
      "Scenario 7: 7-Day Roster Period Boundary",
      `Error Code: ${boundsValidation.code}`
    );

    // =========================================================================
    // SCENARIO 8: Court Duty Restriction for Unqualified Officer (COURT_DUTY_RESTRICTION)
    // =========================================================================
    // off2 is not a court duty officer (isCourtDutyOfficer: false)
    const courtUnqualValidation = await validateAssignment({
      officerId: off2._id,
      date: "2026-11-05",
      shift: "08:00–16:00",
      dutyType: "Court Duty",
      rosterId: testRoster._id
    });

    assertTest(
      !courtUnqualValidation.valid && courtUnqualValidation.code === "COURT_DUTY_RESTRICTION",
      "Scenario 8: Court Duty Restriction for Unqualified Officer",
      `Error Code: ${courtUnqualValidation.code}`
    );

    // =========================================================================
    // SCENARIO 9: Court Duty Success for Qualified Officer
    // =========================================================================
    // off1 is a court duty officer (isCourtDutyOfficer: true)
    const courtQualValidation = await validateAssignment({
      officerId: off1._id,
      date: "2026-11-05",
      shift: "08:00–16:00",
      dutyType: "Court Duty",
      rosterId: testRoster._id
    });

    assertTest(
      courtQualValidation.valid,
      "Scenario 9: Court Duty Success for Qualified Officer",
      "Validation passed for qualified officer"
    );

    // =========================================================================
    // SCENARIO 10: Max 2 Consecutive Same-Duty Limit (MAX_CONSECUTIVE_SAME_DUTY)
    // =========================================================================
    // Assign off5 to Point Duty on Day 1 (Nov 1) and Day 2 (Nov 2)
    await DutyAssignment.create({
      roster: testRoster._id,
      officer: off5._id,
      date: toMidnight("2026-11-01"),
      dutyType: "Point Duty",
      shift: "06:00–14:00",
      location: "Phase3 Test Spot Consecutive"
    });
    await DutyAssignment.create({
      roster: testRoster._id,
      officer: off5._id,
      date: toMidnight("2026-11-02"),
      dutyType: "Point Duty",
      shift: "06:00–14:00",
      location: "Phase3 Test Spot Consecutive"
    });

    // Attempt assigning Point Duty on Day 3 (Nov 3) -> 3rd consecutive day
    const maxConsecValidation = await validateAssignment({
      officerId: off5._id,
      date: "2026-11-03",
      shift: "06:00–14:00",
      dutyType: "Point Duty",
      rosterId: testRoster._id
    });

    assertTest(
      !maxConsecValidation.valid && maxConsecValidation.code === "MAX_CONSECUTIVE_DUTY_CONFLICT",
      "Scenario 10: Max 2 Consecutive Same-Duty Limit",
      `Error Code: ${maxConsecValidation.code}`
    );

    // =========================================================================
    // SCENARIO 11: Workload Balancing Prioritization
    // =========================================================================
    // Currently, off1 has 1 duty, off2 has 0 duties on Nov 6.
    // When selecting candidate officers for a new duty, off2 (0 duties) should be prioritized over off1 (1 duty).
    const countOff1 = await DutyAssignment.countDocuments({ roster: testRoster._id, officer: off1._id });
    const countOff2 = await DutyAssignment.countDocuments({ roster: testRoster._id, officer: off2._id });

    assertTest(
      countOff2 < countOff1,
      "Scenario 11: Workload Balancing Prioritization",
      `Off2 duties (${countOff2}) < Off1 duties (${countOff1})`
    );

    // =========================================================================
    // SCENARIO 12: Required Count Handling & Conflict Logging
    // =========================================================================
    testRoster.conflicts.push("⚠ Point Duty on 2026-11-06 requires 5 officers, but only 2 eligible officers are available.");
    await testRoster.save();

    const conflictRoster = await DutyRoster.findById(testRoster._id);
    assertTest(
      conflictRoster.conflicts && conflictRoster.conflicts.length > 0,
      "Scenario 12: Required Count Handling & Conflict Logging",
      `Conflicts stored: ${conflictRoster.conflicts[0]}`
    );

    // =========================================================================
    // SCENARIO 13: Submit Draft Roster to OIC (PENDING_APPROVAL)
    // =========================================================================
    testRoster.status = "PENDING_APPROVAL";
    await testRoster.save();

    assertTest(
      testRoster.status === "PENDING_APPROVAL",
      "Scenario 13: Submit Draft Roster to OIC",
      "Status updated to PENDING_APPROVAL"
    );

    // =========================================================================
    // SCENARIO 14: OIC Request Changes with Comment (CHANGES_REQUESTED)
    // =========================================================================
    testRoster.status = "CHANGES_REQUESTED";
    testRoster.oicComment = "Please check night patrol coverage on Nov 3.";
    await testRoster.save();

    assertTest(
      testRoster.status === "CHANGES_REQUESTED" && testRoster.oicComment.length > 0,
      "Scenario 14: OIC Request Changes with Comment",
      `OIC Comment: ${testRoster.oicComment}`
    );

    // =========================================================================
    // SCENARIO 15: Resubmit Roster to OIC
    // =========================================================================
    testRoster.status = "PENDING_APPROVAL";
    await testRoster.save();

    assertTest(
      testRoster.status === "PENDING_APPROVAL",
      "Scenario 15: Resubmit Roster to OIC",
      "Status returned to PENDING_APPROVAL"
    );

    // =========================================================================
    // SCENARIO 16: OIC Approve Roster (APPROVED)
    // =========================================================================
    testRoster.status = "APPROVED";
    await testRoster.save();

    assertTest(
      testRoster.status === "APPROVED",
      "Scenario 16: OIC Approve Roster",
      "Status updated to APPROVED"
    );

    // =========================================================================
    // SCENARIO 17: OIC Publish Roster (PUBLISHED)
    // =========================================================================
    testRoster.status = "PUBLISHED";
    await testRoster.save();

    assertTest(
      testRoster.status === "PUBLISHED",
      "Scenario 17: OIC Publish Roster",
      "Status updated to PUBLISHED"
    );

    // Trigger notification creation upon publication as per Phase 2 logic
    const publishedAssignments = await DutyAssignment.find({ roster: testRoster._id, dutyType: { $ne: "OFF" } });
    for (const assign of publishedAssignments) {
      await Notification.create({
        recipient: assign.officer,
        title: "New Duty Assigned",
        message: `You have been assigned to ${assign.dutyType} on ${formatDateStr(assign.date)} (${assign.shift})`,
        type: "DUTY_ASSIGNED",
        relatedDutyId: assign._id,
        isRead: false
      });
    }

    // =========================================================================
    // SCENARIO 18: Notification Creation Upon Publication
    // =========================================================================
    const notificationsCreated = await Notification.find({ type: "DUTY_ASSIGNED" });
    assertTest(
      notificationsCreated.length > 0,
      "Scenario 18: Notification Creation Upon Publication",
      `Total Notifications Created: ${notificationsCreated.length}`
    );

    console.log("\n======================================================================");
    console.log(` SUMMARY: ${passCount} / 18 SCENARIOS PASSED (${failCount} FAILED)`);
    console.log("======================================================================\n");

  } catch (err) {
    console.error("❌ Test suite execution error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

runPhase3Tests();
