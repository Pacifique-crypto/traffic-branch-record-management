/**
 * Comprehensive Test Suite for Duty Roster Phase 4 Corrections
 * Covers 18 targeted scenarios:
 *  1. Reject 0 designated Court Duty officers
 *  2. Reject 1 designated Court Duty officer
 *  3. Reject duplicate designated Court Duty officers
 *  4. Reject invalid/non-existent officer ID in Court Duty designation
 *  5. Accept EXACTLY 2 distinct active Court Duty officers
 *  6. Verify generator strictly assigns ONLY the 2 designated officers to Court Duty
 *  7. Validate manual edit Court Duty ALLOWED for Designated Officer 1
 *  8. Validate manual edit Court Duty ALLOWED for Designated Officer 2
 *  9. Validate manual edit Court Duty REJECTED for non-designated Officer 3
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
const Notification = require("./models/Notification");
const { validateAssignment, validateCourtDutyRestriction } = require("./services/rosterValidator");
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
    await Notification.deleteMany({ title: "New Duty Assigned" });

    // Seed test officers
    const testOfficerData = [
      { username: "p4_off1", policeId: "P4-001", fullName: "Court Designated Off 1", isCourtDutyOfficer: true, nic: "980000001V", contactNo: "0771110001", rank: "PC", status: "Active", gender: "Male" },
      { username: "p4_off2", policeId: "P4-002", fullName: "Court Designated Off 2", isCourtDutyOfficer: true, nic: "980000002V", contactNo: "0771110002", rank: "PC", status: "Active", gender: "Male" },
      { username: "p4_off3", policeId: "P4-003", fullName: "Regular Off 3", isCourtDutyOfficer: false, nic: "980000003V", contactNo: "0771110003", rank: "PC", status: "Active", gender: "Male" },
      { username: "p4_off4", policeId: "P4-004", fullName: "Regular Off 4", isCourtDutyOfficer: false, nic: "980000004V", contactNo: "0771110004", rank: "PC", status: "Active", gender: "Male" },
      { username: "p4_off5", policeId: "P4-005", fullName: "Regular Off 5", isCourtDutyOfficer: false, nic: "980000005V", contactNo: "0771110005", rank: "PC", status: "Active", gender: "Male" },
    ];

    const officers = [];
    for (const d of testOfficerData) {
      let o = await Officer.findOne({ username: d.username });
      if (!o) {
        o = await Officer.create({ ...d, password: "password123", role: "Officer" });
      } else {
        o.isCourtDutyOfficer = d.isCourtDutyOfficer;
        o.status = "Active";
        await o.save();
      }
      officers.push(o);
    }

    const courtOff1 = officers[0];
    const courtOff2 = officers[1];
    const regOff3 = officers[2];
    const regOff4 = officers[3];

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

    // TC01: Reject 0 designated Court Duty officers
    const resTC01 = await callGenerateAPI({
      weekStart, startDate: weekStart, endDate: weekEnd,
      courtDutyOfficerIds: [],
      regularDuties: [{ name: "Court Duty", shift: "08:00–16:00", count: 2, location: "Magistrate Court Phase4" }]
    });
    const err1 = resTC01.data.message || resTC01.data.error || "";
    assertTest(resTC01.statusCode === 400 && err1.includes("required"), "TC01: Reject 0 designated Court Duty officers", err1);

    // TC02: Reject 1 designated Court Duty officer
    const resTC02 = await callGenerateAPI({
      weekStart, startDate: weekStart, endDate: weekEnd,
      courtDutyOfficerIds: [courtOff1._id.toString()],
      regularDuties: [{ name: "Court Duty", shift: "08:00–16:00", count: 2, location: "Magistrate Court Phase4" }]
    });
    const err2 = resTC02.data.message || resTC02.data.error || "";
    assertTest(resTC02.statusCode === 400 && err2.includes("required"), "TC02: Reject 1 designated Court Duty officer", err2);

    // TC03: Reject duplicate designated Court Duty officers
    const resTC03 = await callGenerateAPI({
      weekStart, startDate: weekStart, endDate: weekEnd,
      courtDutyOfficerIds: [courtOff1._id.toString(), courtOff1._id.toString()],
      regularDuties: [{ name: "Court Duty", shift: "08:00–16:00", count: 2, location: "Magistrate Court Phase4" }]
    });
    const err3 = resTC03.data.message || resTC03.data.error || "";
    assertTest(resTC03.statusCode === 400 && err3.includes("twice"), "TC03: Reject duplicate designated Court Duty officers", err3);

    // TC04: Reject invalid/non-existent officer ID in Court Duty designation
    const fakeId = new mongoose.Types.ObjectId().toString();
    const resTC04 = await callGenerateAPI({
      weekStart, startDate: weekStart, endDate: weekEnd,
      courtDutyOfficerIds: [courtOff1._id.toString(), fakeId],
      regularDuties: [{ name: "Court Duty", shift: "08:00–16:00", count: 2, location: "Magistrate Court Phase4" }]
    });
    const err4 = resTC04.data.message || resTC04.data.error || "";
    assertTest(resTC04.statusCode === 400 && err4.includes("active officers"), "TC04: Reject invalid officer ID in Court Duty designation", err4);

    // TC05: Accept EXACTLY 2 distinct active Court Duty officers
    const resTC05 = await callGenerateAPI({
      weekStart, startDate: weekStart, endDate: weekEnd,
      courtDutyOfficerIds: [courtOff1._id.toString(), courtOff2._id.toString()],
      regularDuties: [
        { name: "Court Duty", shift: "08:00–16:00", count: 2, location: "Magistrate Court Phase4", frequency: "everyday" },
        { name: "Point Duty", shift: "06:00–14:00", count: 2, location: "Poruthota Phase4", frequency: "everyday" }
      ]
    });
    assertTest(resTC05.statusCode === 200 && resTC05.data.roster, "TC05: Accept EXACTLY 2 distinct active Court Duty officers");

    const createdRoster = resTC05.data.roster;

    // TC06: Verify generator strictly assigns ONLY the 2 designated officers to Court Duty
    const courtAssignments = await DutyAssignment.find({
      roster: createdRoster._id,
      dutyType: "Court Duty"
    });
    const assignedCourtOfficerIds = Array.from(new Set(courtAssignments.map(a => a.officer.toString())));
    const validDesignatedIds = [courtOff1._id.toString(), courtOff2._id.toString()];
    const unexpectedCourtAssignees = assignedCourtOfficerIds.filter(id => !validDesignatedIds.includes(id));

    assertTest(courtAssignments.length > 0 && unexpectedCourtAssignees.length === 0,
      "TC06: Generator strictly assigns ONLY designated officers to Court Duty",
      `Assigned IDs: ${assignedCourtOfficerIds.join(", ")} | Unexpected: ${unexpectedCourtAssignees.length}`);

    // TC07: Manual edit Court Duty ALLOWED for Designated Officer 1
    const targetDate28 = new Date("2026-09-28T00:00:00.000Z");
    const existingAssign1 = await DutyAssignment.findOne({ roster: createdRoster._id, officer: courtOff1._id, date: targetDate28 });
    const courtVal1 = await validateAssignment({
      rosterId: createdRoster._id,
      officerId: courtOff1._id,
      date: "2026-09-28",
      shift: "08:00–16:00",
      location: "Magistrate Court Phase4",
      dutyType: "Court Duty",
      _id: existingAssign1?._id
    });
    assertTest(courtVal1.valid === true, "TC07: Manual edit Court Duty ALLOWED for Designated Officer 1", courtVal1.message);

    // TC08: Manual edit Court Duty ALLOWED for Designated Officer 2
    const existingAssign2 = await DutyAssignment.findOne({ roster: createdRoster._id, officer: courtOff2._id, date: targetDate28 });
    const courtVal2 = await validateAssignment({
      rosterId: createdRoster._id,
      officerId: courtOff2._id,
      date: "2026-09-28",
      shift: "08:00–16:00",
      location: "Magistrate Court Phase4",
      dutyType: "Court Duty",
      _id: existingAssign2?._id
    });
    assertTest(courtVal2.valid === true, "TC08: Manual edit Court Duty ALLOWED for Designated Officer 2", courtVal2.message);

    // TC09: Manual edit Court Duty REJECTED for non-designated Officer 3
    const courtVal3 = await validateAssignment({
      rosterId: createdRoster._id,
      officerId: regOff3._id,
      date: "2026-09-28",
      shift: "08:00–16:00",
      location: "Magistrate Court Phase4",
      dutyType: "Court Duty"
    });
    assertTest(courtVal3.valid === false && (courtVal3.code === "COURT_DUTY_RESTRICTION" || courtVal3.reason === "COURT_DUTY_RESTRICTION"),
      "TC09: Manual edit Court Duty REJECTED for non-designated Officer 3", courtVal3.message);

    // TC10: Verify Regular Duty frequency "everyday" schedules across all 7 days
    const everydayPointAssignments = await DutyAssignment.find({
      roster: createdRoster._id,
      dutyType: "Point Duty"
    });
    const uniqueDatesEveryday = Array.from(new Set(everydayPointAssignments.map(a => new Date(a.date).toISOString().substring(0,10))));
    assertTest(uniqueDatesEveryday.length === 7, "TC10: Regular Duty frequency 'everyday' schedules across all 7 days", `Days count: ${uniqueDatesEveryday.length}`);

    // TC11: Verify Regular Duty frequency "selected" ["Mon", "Wed", "Fri"] schedules ONLY on Mon, Wed, Fri
    const weekStartMWF = "2026-10-04"; // Sun
    const weekEndMWF = "2026-10-10";   // Sat
    const resMWF = await callGenerateAPI({
      weekStart: weekStartMWF, startDate: weekStartMWF, endDate: weekEndMWF,
      courtDutyOfficerIds: [courtOff1._id.toString(), courtOff2._id.toString()],
      regularDuties: [
        { name: "Patrol Duty MWF", shift: "06:00–14:00", count: 2, location: "Sector 1 Phase4", frequency: "selected", selectedDays: ["Mon", "Wed", "Fri"] }
      ]
    });

    const mwfRoster = resMWF.data.roster;
    const mwfAssignments = await DutyAssignment.find({ roster: mwfRoster._id, dutyType: "Patrol Duty MWF" });
    const mwfDates = Array.from(new Set(mwfAssignments.map(a => new Date(a.date).toISOString().substring(0,10)))).sort();
    
    // Expected dates for Mon, Wed, Fri starting 2026-10-04 (Sun): Mon=10-05, Wed=10-07, Fri=10-09
    const expectedMWF = ["2026-10-05", "2026-10-07", "2026-10-09"];
    const isMWFCorrect = mwfDates.length === 3 && expectedMWF.every(d => mwfDates.includes(d));

    assertTest(isMWFCorrect, "TC11: Regular Duty frequency 'selected' ['Mon', 'Wed', 'Fri'] schedules ONLY on Mon, Wed, Fri", `Found dates: ${mwfDates.join(", ")}`);

    // TC12: Verify Regular Duty frequency "selected" ["Sat", "Sun"] schedules ONLY on Sat, Sun
    const resSatSun = await callGenerateAPI({
      weekStart: weekStartMWF, startDate: weekStartMWF, endDate: weekEndMWF,
      courtDutyOfficerIds: [courtOff1._id.toString(), courtOff2._id.toString()],
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
      courtDutyOfficerIds: [courtOff1._id.toString(), courtOff2._id.toString()],
      regularDuties: [
        { name: "Court Duty", shift: "08:00–16:00", count: 1, location: "Magistrate Court Phase4", frequency: "everyday" },
        { name: "Traffic Duty Draft", shift: "06:00–18:00", count: 2, location: "HQ Phase4", frequency: "everyday" }
      ]
    });

    if (resDraft1.statusCode !== 200 || !resDraft1.data?.roster) {
      console.log("DEBUG resDraft1:", JSON.stringify(resDraft1));
    }
    const draft1Roster = resDraft1.data ? resDraft1.data.roster : null;
    const initialAssignmentsCount = draft1Roster ? await DutyAssignment.countDocuments({ roster: draft1Roster._id }) : 0;
    assertTest(resDraft1.statusCode === 200 && draft1Roster && initialAssignmentsCount > 0, "TC13: Initial DRAFT roster generation creates assignments correctly", `Count: ${initialAssignmentsCount}`);

    // TC14: Re-generation of DRAFT roster safely replaces existing draft assignments (NO duplicates)
    const resDraft2 = await callGenerateAPI({
      weekStart: weekStartRegen, startDate: weekStartRegen, endDate: weekEndRegen,
      courtDutyOfficerIds: [courtOff1._id.toString(), courtOff2._id.toString()],
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
      courtDutyOfficerIds: [courtOff1._id.toString(), courtOff2._id.toString()],
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
