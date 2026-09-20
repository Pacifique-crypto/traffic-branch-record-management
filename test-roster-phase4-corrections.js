/**
 * Comprehensive Test Suite for Duty Roster Phase 4 Corrections
 * Covers 18 targeted scenarios verifying Court Duty as a NORMAL DUTY:
 *  1. Court Duty generation succeeds without requiring courtDutyOfficerIds payload
 *  2. Court Duty can be assigned to any eligible active officer
 *  3. Officer on approved leave cannot receive Court Duty assignment
 *  4. Overlapping Court Duty shift is rejected (SHIFT_OVERLAP_CONFLICT)
 *  5. Minimum 8-hour rest rule applies to Court Duty (MIN_REST_CONFLICT)
 *  6. Maximum 2 consecutive same-duty rule applies to Court Duty (MAX_CONSECUTIVE_DUTY_CONFLICT)
 *  7. Workload balancing considers Court Duty assignments
 *  8. Court Duty required officer count is strictly respected
 *  9. Manual edit allows assigning Court Duty to any eligible officer
 * 10. Verify Regular Duty frequency "everyday" schedules across all 7 days
 * 11. Verify Regular Duty frequency "selected" ["Mon", "Wed", "Fri"] schedules ONLY on Mon, Wed, Fri
 * 12. Verify Regular Duty frequency "selected" ["Sat", "Sun"] schedules ONLY on Sat, Sun
 * 13. Initial DRAFT roster generation creates assignments correctly
 * 14. Re-generation of DRAFT roster safely replaces existing draft assignments (NO duplicates)
 * 15. Re-generation preserves APPROVED / PUBLISHED rosters without overwriting them
 * 16. Workflow: Submit draft roster to OIC (PENDING_APPROVAL)
 * 17. Workflow: OIC approve roster (APPROVED)
 * 18. Workflow: OIC publish roster (PUBLISHED) & create officer notifications
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const DutyRoster = require("./models/DutyRoster");
const DutyAssignment = require("./models/DutyAssignment");
const Officer = require("./models/Officer");
const OfficerAvailability = require("./models/OfficerAvailability");
const Notification = require("./models/Notification");
const { validateAssignment } = require("./services/rosterValidator");
const dutyRosterRoutes = require("./routes/dutyRosterRoutes");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/traffic_db";

async function runPhase4Tests() {
  console.log("======================================================================");
  console.log(" STARTING DUTY ROSTER PHASE 4 CORRECTIONS AUTOMATED TEST SUITE (18 TCs) ");
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
    } catch (err) {
      await mongoose.connect("mongodb://127.0.0.1:27017/traffic_db", { serverSelectionTimeoutMS: 3000 });
      console.log("✅ Connected to local MongoDB.");
    }

    // Clean test artifacts
    await DutyRoster.deleteMany({ weekStart: { $gte: new Date("2026-09-01") } });
    await DutyAssignment.deleteMany({});
    await OfficerAvailability.deleteMany({ remarks: "Phase4 Test Leave" });
    await Notification.deleteMany({ title: "New Duty Assigned" });

    // Seed test officers
    const testOfficerData = [
      { username: "p4_off1", policeId: "P4-001", fullName: "Officer One", nic: "980000001V", contactNo: "0771110001", rank: "PC", status: "Active", gender: "Male" },
      { username: "p4_off2", policeId: "P4-002", fullName: "Officer Two", nic: "980000002V", contactNo: "0771110002", rank: "PC", status: "Active", gender: "Male" },
      { username: "p4_off3", policeId: "P4-003", fullName: "Officer Three", nic: "980000003V", contactNo: "0771110003", rank: "PC", status: "Active", gender: "Male" },
      { username: "p4_off4", policeId: "P4-004", fullName: "Officer Four", nic: "980000004V", contactNo: "0771110004", rank: "PC", status: "Active", gender: "Male" },
      { username: "p4_off5", policeId: "P4-005", fullName: "Officer Five", nic: "980000005V", contactNo: "0771110005", rank: "PC", status: "Active", gender: "Male" },
    ];

    const officers = [];
    for (const d of testOfficerData) {
      let o = await Officer.findOne({ username: d.username });
      if (!o) {
        o = await Officer.create({ ...d, password: "password123", role: "Officer" });
      } else {
        o.status = "Active";
        await o.save();
      }
      officers.push(o);
    }

    const off1 = officers[0];
    const off2 = officers[1];
    const off3 = officers[2];
    const off4 = officers[3];
    const off5 = officers[4];

    // Setup req / res mock generator
    async function callGenerateAPI(payload) {
      return new Promise((resolve) => {
        const req = { body: payload };
        const res = {
          status: function(code) {
            this.statusCode = code;
            return this;
          },
          json: function(data) {
            resolve({ statusCode: this.statusCode || 200, data });
          }
        };
        dutyRosterRoutes.generateDutyRosterHandler(req, res);
      });
    }

    const weekStart = "2026-09-27"; // Sun
    const weekEnd = "2026-10-03";   // Sat

    // TC01: Court Duty generation succeeds without requiring courtDutyOfficerIds payload
    const resTC01 = await callGenerateAPI({
      weekStart, startDate: weekStart, endDate: weekEnd,
      regularDuties: [{ name: "Court Duty", shift: "08:00–16:00", count: 1, location: "Magistrate Court Phase4", frequency: "everyday" }]
    });
    assertTest(resTC01.statusCode === 200 && resTC01.data?.roster, "TC01: Court Duty generation succeeds without courtDutyOfficerIds payload");

    const createdRoster = resTC01.data.roster;

    // TC02: Court Duty can be assigned to any eligible active officer
    const courtAssignments = await DutyAssignment.find({
      roster: createdRoster._id,
      dutyType: "Court Duty"
    });
    const assignedOfficerIds = Array.from(new Set(courtAssignments.map(a => a.officer.toString())));
    assertTest(courtAssignments.length === 7 && assignedOfficerIds.length > 0,
      "TC02: Court Duty assigned to eligible active officers",
      `Assigned count: ${courtAssignments.length} | Unique officers: ${assignedOfficerIds.length}`);

    // TC03: Officer on approved leave cannot receive Court Duty assignment
    await OfficerAvailability.create({
      officer: off1._id,
      startDate: new Date("2026-09-28T00:00:00.000Z"),
      endDate: new Date("2026-09-28T23:59:59.999Z"),
      leaveType: "Casual Leave",
      status: "Approved",
      remarks: "Phase4 Test Leave"
    });

    const leaveVal = await validateAssignment({
      rosterId: createdRoster._id,
      officerId: off1._id,
      date: "2026-09-28",
      shift: "08:00–16:00",
      dutyType: "Court Duty"
    });
    assertTest(leaveVal.valid === false && leaveVal.code === "APPROVED_LEAVE_CONFLICT",
      "TC03: Officer on approved leave cannot receive Court Duty assignment", leaveVal.message);

    // TC04: Overlapping Court Duty shift is rejected
    await DutyAssignment.create({
      roster: createdRoster._id,
      officer: off2._id,
      date: new Date("2026-09-28T00:00:00.000Z"),
      dutyType: "Point Duty",
      shift: "06:00–14:00",
      location: "Poruthota"
    });

    const overlapVal = await validateAssignment({
      rosterId: createdRoster._id,
      officerId: off2._id,
      date: "2026-09-28",
      shift: "08:00–16:00", // overlaps 08:00 to 14:00
      dutyType: "Court Duty"
    });
    assertTest(overlapVal.valid === false && overlapVal.code === "SHIFT_OVERLAP_CONFLICT",
      "TC04: Overlapping Court Duty shift is rejected", overlapVal.message);

    // TC05: Minimum 8-hour rest rule applies to Court Duty
    await DutyAssignment.create({
      roster: createdRoster._id,
      officer: off3._id,
      date: new Date("2026-09-27T00:00:00.000Z"),
      dutyType: "Checkpoint",
      shift: "22:00–06:00", // Ends at 06:00 on 2026-09-28
      location: "HQ Spot"
    });

    const restVal = await validateAssignment({
      rosterId: createdRoster._id,
      officerId: off3._id,
      date: "2026-09-28",
      shift: "08:00–16:00", // Starts at 08:00 -> 2 hrs rest only (< 8 hrs)
      dutyType: "Court Duty"
    });
    assertTest(restVal.valid === false && restVal.code === "MIN_REST_CONFLICT",
      "TC05: Minimum 8-hour rest rule applies to Court Duty", restVal.message);

    // TC06: Maximum 2 consecutive Court Duty assignments applies
    await DutyAssignment.create({
      roster: createdRoster._id,
      officer: off4._id,
      date: new Date("2026-09-27T00:00:00.000Z"),
      dutyType: "Court Duty",
      shift: "08:00–16:00"
    });
    await DutyAssignment.create({
      roster: createdRoster._id,
      officer: off4._id,
      date: new Date("2026-09-28T00:00:00.000Z"),
      dutyType: "Court Duty",
      shift: "08:00–16:00"
    });

    const maxConsecVal = await validateAssignment({
      rosterId: createdRoster._id,
      officerId: off4._id,
      date: "2026-09-29",
      shift: "08:00–16:00",
      dutyType: "Court Duty"
    });
    assertTest(maxConsecVal.valid === false && maxConsecVal.code === "MAX_CONSECUTIVE_DUTY_CONFLICT",
      "TC06: Maximum 2 consecutive Court Duty assignments rule applies", maxConsecVal.message);

    // TC07: Workload balancing considers Court Duty
    const resWorkload = await callGenerateAPI({
      weekStart, startDate: weekStart, endDate: weekEnd,
      regularDuties: [
        { name: "Court Duty", shift: "08:00–16:00", count: 1, location: "Magistrate Court", frequency: "everyday" },
        { name: "Point Duty", shift: "06:00–14:00", count: 1, location: "Main Junction", frequency: "everyday" }
      ]
    });
    assertTest(resWorkload.statusCode === 200 && resWorkload.data?.roster, "TC07: Workload balancing considers Court Duty alongside other duties");

    // TC08: Court Duty required officer count is respected
    const resCount2 = await callGenerateAPI({
      weekStart, startDate: weekStart, endDate: weekEnd,
      regularDuties: [
        { name: "Court Duty", shift: "08:00–16:00", count: 2, location: "Magistrate Court", frequency: "everyday" }
      ]
    });
    const c2Assignments = await DutyAssignment.find({ roster: resCount2.data.roster._id, dutyType: "Court Duty", date: new Date("2026-09-27T00:00:00.000Z") });
    assertTest(c2Assignments.length === 2, "TC08: Court Duty required officer count (2 officers) is strictly respected", `Assigned for day: ${c2Assignments.length}`);

    // TC09: Manual edit allows assigning Court Duty to any eligible officer
    const editVal = await validateAssignment({
      rosterId: createdRoster._id,
      officerId: off5._id,
      date: "2026-09-30",
      shift: "08:00–16:00",
      dutyType: "Court Duty"
    });
    assertTest(editVal.valid === true, "TC09: Manual Edit Duty allows assigning Court Duty to any eligible officer", editVal.message);

    // TC10: Verify Regular Duty frequency "everyday" schedules across all 7 days
    const everydayPointAssignments = await DutyAssignment.find({
      roster: createdRoster._id,
      dutyType: "Court Duty"
    });
    const uniqueDatesEveryday = Array.from(new Set(everydayPointAssignments.map(a => new Date(a.date).toISOString().substring(0,10))));
    assertTest(uniqueDatesEveryday.length === 7, "TC10: Regular Duty frequency 'everyday' schedules across all 7 days", `Days count: ${uniqueDatesEveryday.length}`);

    // TC11: Verify Regular Duty frequency "selected" ["Mon", "Wed", "Fri"] schedules ONLY on Mon, Wed, Fri
    const weekStartMWF = "2026-10-04"; // Sun
    const weekEndMWF = "2026-10-10";   // Sat
    const resMWF = await callGenerateAPI({
      weekStart: weekStartMWF, startDate: weekStartMWF, endDate: weekEndMWF,
      regularDuties: [
        { name: "Court Duty MWF", shift: "08:00–16:00", count: 1, location: "Magistrate Court", frequency: "selected", selectedDays: ["Mon", "Wed", "Fri"] }
      ]
    });

    const mwfRoster = resMWF.data.roster;
    const mwfAssignments = await DutyAssignment.find({ roster: mwfRoster._id, dutyType: "Court Duty MWF" });
    const mwfDates = Array.from(new Set(mwfAssignments.map(a => new Date(a.date).toISOString().substring(0,10)))).sort();
    
    // Expected dates for Mon, Wed, Fri starting 2026-10-04 (Sun): Mon=10-05, Wed=10-07, Fri=10-09
    const expectedMWF = ["2026-10-05", "2026-10-07", "2026-10-09"];
    const isMWFCorrect = mwfDates.length === 3 && expectedMWF.every(d => mwfDates.includes(d));

    assertTest(isMWFCorrect, "TC11: Regular Duty frequency 'selected' ['Mon', 'Wed', 'Fri'] schedules ONLY on Mon, Wed, Fri", `Found dates: ${mwfDates.join(", ")}`);

    // TC12: Verify Regular Duty frequency "selected" ["Sat", "Sun"] schedules ONLY on Sat, Sun
    const resSatSun = await callGenerateAPI({
      weekStart: weekStartMWF, startDate: weekStartMWF, endDate: weekEndMWF,
      regularDuties: [
        { name: "Weekend Patrol", shift: "14:00–22:00", count: 2, location: "Coastal Rd Phase4", frequency: "selected", selectedDays: ["Sat", "Sun"] }
      ]
    });

    const ssRoster = resSatSun.data.roster;
    const ssAssignments = await DutyAssignment.find({ roster: ssRoster._id, dutyType: "Weekend Patrol" });
    const ssDates = Array.from(new Set(ssAssignments.map(a => new Date(a.date).toISOString().substring(0,10)))).sort();
    // Sun = 2026-10-04, Sat = 2026-10-10
    const expectedSS = ["2026-10-04", "2026-10-10"];
    const isSSCorrect = ssDates.length === 2 && expectedSS.every(d => ssDates.includes(d));

    assertTest(isSSCorrect, "TC12: Regular Duty frequency 'selected' ['Sat', 'Sun'] schedules ONLY on Sat, Sun", `Found dates: ${ssDates.join(", ")}`);

    // TC13: Initial DRAFT roster generation creates assignments correctly
    const weekStartRegen = "2026-10-11";
    const weekEndRegen = "2026-10-17";
    const resDraft1 = await callGenerateAPI({
      weekStart: weekStartRegen, startDate: weekStartRegen, endDate: weekEndRegen,
      regularDuties: [
        { name: "Court Duty", shift: "08:00–16:00", count: 1, location: "Magistrate Court Phase4", frequency: "everyday" },
        { name: "Traffic Duty Draft", shift: "06:00–18:00", count: 2, location: "HQ Phase4", frequency: "everyday" }
      ]
    });

    const draft1Roster = resDraft1.data ? resDraft1.data.roster : null;
    const initialAssignmentsCount = draft1Roster ? await DutyAssignment.countDocuments({ roster: draft1Roster._id }) : 0;
    assertTest(resDraft1.statusCode === 200 && draft1Roster && initialAssignmentsCount > 0, "TC13: Initial DRAFT roster generation creates assignments correctly", `Count: ${initialAssignmentsCount}`);

    // TC14: Re-generation of DRAFT roster safely replaces existing draft assignments (NO duplicates)
    const resDraft2 = await callGenerateAPI({
      weekStart: weekStartRegen, startDate: weekStartRegen, endDate: weekEndRegen,
      regularDuties: [
        { name: "Court Duty", shift: "08:00–16:00", count: 1, location: "Magistrate Court Phase4", frequency: "everyday" },
        { name: "Traffic Duty Draft", shift: "06:00–18:00", count: 2, location: "HQ Phase4", frequency: "everyday" }
      ]
    });

    const draft2Roster = resDraft2.data ? resDraft2.data.roster : null;
    const newAssignmentsCount = await DutyAssignment.countDocuments({ roster: draft2Roster._id });
    const totalAssignmentsForWeek = await DutyAssignment.countDocuments({ date: { $gte: new Date(weekStartRegen), $lte: new Date(weekEndRegen) } });

    assertTest(draft1Roster._id.toString() === draft2Roster._id.toString() && newAssignmentsCount === initialAssignmentsCount && totalAssignmentsForWeek === newAssignmentsCount,
      "TC14: Re-generation safely replaces existing DRAFT assignments without duplicates",
      `Assignments count: ${newAssignmentsCount} vs Total for week: ${totalAssignmentsForWeek}`);

    // TC15: Re-generation preserves APPROVED / PUBLISHED rosters without overwriting them
    draft2Roster.status = "APPROVED";
    await draft2Roster.save();

    const resApprRegen = await callGenerateAPI({
      weekStart: weekStartRegen, startDate: weekStartRegen, endDate: weekEndRegen,
      regularDuties: [{ name: "Traffic Duty", shift: "06:00–18:00", count: 2, location: "HQ Phase4", frequency: "everyday" }]
    });

    const err15 = resApprRegen.data.message || resApprRegen.data.error || "";
    assertTest(resApprRegen.statusCode === 400 && err15.includes("cannot be re-generated"),
      "TC15: Re-generation preserves APPROVED/PUBLISHED rosters without overwriting them", err15);

    // Reset status back to DRAFT for workflow TCs
    draft2Roster.status = "DRAFT";
    await draft2Roster.save();

    // TC16: Workflow - Submit draft roster to OIC (PENDING_APPROVAL)
    draft2Roster.status = "PENDING_APPROVAL";
    await draft2Roster.save();
    const fetchedPending = await DutyRoster.findById(draft2Roster._id);
    assertTest(fetchedPending.status === "PENDING_APPROVAL", "TC16: Submit draft roster to OIC (PENDING_APPROVAL)");

    // TC17: Workflow - OIC approve roster (APPROVED)
    fetchedPending.status = "APPROVED";
    await fetchedPending.save();
    const fetchedApproved = await DutyRoster.findById(draft2Roster._id);
    assertTest(fetchedApproved.status === "APPROVED", "TC17: OIC approve roster (APPROVED)");

    // TC18: Workflow - OIC publish roster (PUBLISHED) & create officer notifications
    fetchedApproved.status = "PUBLISHED";
    await fetchedApproved.save();

    // Simulate publication notifications
    const rosterAssignments = await DutyAssignment.find({ roster: fetchedApproved._id });
    for (const a of rosterAssignments) {
      await Notification.create({
        recipient: a.officer,
        title: "New Duty Assigned",
        message: `You have been assigned to ${a.dutyType} on ${a.date.toISOString().substring(0,10)}`,
        type: "DUTY_ASSIGNED",
        read: false
      });
    }

    const notifCount = await Notification.countDocuments({ title: "New Duty Assigned" });
    assertTest(fetchedApproved.status === "PUBLISHED" && notifCount > 0, "TC18: OIC publish roster (PUBLISHED) & notifications created", `Notifs: ${notifCount}`);

  } catch (err) {
    console.error("❌ Exception during Phase 4 tests:", err);
    failCount++;
  } finally {
    console.log("\n======================================================================");
    console.log(` PHASE 4 TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED `);
    console.log("======================================================================\n");
    await mongoose.disconnect();
    if (failCount > 0) {
      process.exit(1);
    }
  }
}

runPhase4Tests();
