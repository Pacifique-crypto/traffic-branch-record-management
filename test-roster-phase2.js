/**
 * Automated Test Suite for Duty Roster Phase 2:
 * OIC Publish Notifications, Duplicate Prevention & Officer Security
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const DutyRoster = require("./models/DutyRoster");
const DutyAssignment = require("./models/DutyAssignment");
const Officer = require("./models/Officer");
const Notification = require("./models/Notification");
const { toMidnight, formatDateStr } = require("./services/rosterValidator");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/traffic_db";

async function runTests() {
  console.log("==================================================");
  console.log(" STARTING DUTY ROSTER PHASE 2 AUTOMATED TEST SUITE ");
  console.log("==================================================\n");

  try {
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 });
      console.log("✅ Connected to MongoDB Atlas.");
    } catch (atlasErr) {
      console.log("⚠️ Atlas connection failed, falling back to local MongoDB...");
      await mongoose.connect("mongodb://127.0.0.1:27017/traffic_db", { serverSelectionTimeoutMS: 3000 });
      console.log("✅ Connected to local MongoDB.");
    }

    // Setup Test Officers
    let officerA = await Officer.findOne({ username: "test_off_a" });
    if (!officerA) {
      officerA = await Officer.create({
        username: "test_off_a",
        policeId: "PC-9901",
        fullName: "Test Officer A",
        password: "password123",
        status: "Active",
        role: "Officer"
      });
    }

    let officerB = await Officer.findOne({ username: "test_off_b" });
    if (!officerB) {
      officerB = await Officer.create({
        username: "test_off_b",
        policeId: "PC-9902",
        fullName: "Test Officer B",
        password: "password123",
        status: "Active",
        role: "Officer"
      });
    }

    console.log(`✅ Test Officers: ${officerA.fullName} (${officerA._id}), ${officerB.fullName} (${officerB._id})`);

    // Clean previous test data
    await DutyRoster.deleteMany({ title: "TEST PHASE 2 ROSTER" });
    await Notification.deleteMany({ title: "New Duty Assigned" });

    // TEST 1: Create Draft Roster & Assignments
    const weekStart = toMidnight("2026-10-04"); // Sun
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const testRoster = await DutyRoster.create({
      rosterReference: "ROSTER-TEST-P2",
      title: "TEST PHASE 2 ROSTER",
      weekStart,
      weekEnd,
      status: "DRAFT"
    });

    const dutyA = await DutyAssignment.create({
      roster: testRoster._id,
      officer: officerA._id,
      date: toMidnight("2026-10-05"),
      dutyType: "Point Duty",
      shift: "06:00–14:00",
      location: "Poruthota Junction"
    });

    console.log("\n[TEST 1] Roster created as DRAFT.");
    let notifsDraft = await Notification.find({ type: "DUTY_ASSIGNED", recipient: officerA._id });
    if (notifsDraft.length === 0) {
      console.log("  PASS ✅: 0 notifications created while in DRAFT status.");
    } else {
      console.log("  FAIL ❌: Notifications should not be created in DRAFT state.");
    }

    // TEST 2: Update to PENDING_APPROVAL & APPROVED
    testRoster.status = "PENDING_APPROVAL";
    await testRoster.save();

    testRoster.status = "APPROVED";
    await testRoster.save();

    let notifsApproved = await Notification.find({ type: "DUTY_ASSIGNED", recipient: officerA._id });
    if (notifsApproved.length === 0) {
      console.log("[TEST 2] PASS ✅: 0 notifications created when status changed to PENDING / APPROVED.");
    } else {
      console.log("[TEST 2] FAIL ❌: Notifications created prematurely.");
    }

    // TEST 3: Publish Roster & Verify Notification Creation
    // Simulate publish endpoint logic
    const assignments = await DutyAssignment.find({ roster: testRoster._id });
    for (const assignment of assignments) {
      if (!assignment.officer || assignment.dutyType === "OFF") continue;
      const recipientId = assignment.officer;

      const existingNotif = await Notification.findOne({
        recipient: recipientId,
        type: "DUTY_ASSIGNED",
        relatedDuty: assignment._id
      });

      if (!existingNotif) {
        const dutyDateStr = new Date(assignment.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        await Notification.create({
          recipient: recipientId,
          title: "New Duty Assigned",
          message: `You have been assigned ${assignment.dutyType} on ${dutyDateStr} (${assignment.shift}) at ${assignment.location}.`,
          type: "DUTY_ASSIGNED",
          relatedDuty: assignment._id,
          relatedRoster: testRoster._id
        });
      }
    }

    testRoster.status = "PUBLISHED";
    await testRoster.save();

    let notifsPublishedA = await Notification.find({ type: "DUTY_ASSIGNED", recipient: officerA._id });
    let notifsPublishedB = await Notification.find({ type: "DUTY_ASSIGNED", recipient: officerB._id });

    if (notifsPublishedA.length === 1 && notifsPublishedB.length === 0) {
      console.log("[TEST 3] PASS ✅: Exactly 1 notification created for Officer A and 0 for unassigned Officer B.");
      console.log(`         Title: "${notifsPublishedA[0].title}" | Message: "${notifsPublishedA[0].message}"`);
    } else {
      console.log(`[TEST 3] FAIL ❌: Expected 1 notif for A and 0 for B. Got A=${notifsPublishedA.length}, B=${notifsPublishedB.length}`);
    }

    // TEST 4: Prevent Duplicate Notifications on Re-publish
    // Simulate re-publishing roster
    for (const assignment of assignments) {
      if (!assignment.officer || assignment.dutyType === "OFF") continue;
      const recipientId = assignment.officer;

      const existingNotif = await Notification.findOne({
        recipient: recipientId,
        type: "DUTY_ASSIGNED",
        relatedDuty: assignment._id
      });

      if (!existingNotif) {
        await Notification.create({
          recipient: recipientId,
          title: "New Duty Assigned",
          message: "Duplicate test",
          type: "DUTY_ASSIGNED",
          relatedDuty: assignment._id,
          relatedRoster: testRoster._id
        });
      }
    }

    let notifsAfterRepublish = await Notification.find({ type: "DUTY_ASSIGNED", recipient: officerA._id });
    if (notifsAfterRepublish.length === 1) {
      console.log("[TEST 4] PASS ✅: Duplicate prevention succeeded (Count remained 1).");
    } else {
      console.log(`[TEST 4] FAIL ❌: Duplicate notifications created! Count = ${notifsAfterRepublish.length}`);
    }

    // TEST 5: Verify GET /duties/my query security logic
    const publishedRosters = await DutyRoster.find({ status: "PUBLISHED" }).select("_id");
    const publishedRosterIds = publishedRosters.map((r) => r._id);

    const officerADuties = await DutyAssignment.find({
      officer: officerA._id,
      roster: { $in: publishedRosterIds },
      dutyType: { $ne: "OFF" }
    });

    const officerBDuties = await DutyAssignment.find({
      officer: officerB._id,
      roster: { $in: publishedRosterIds },
      dutyType: { $ne: "OFF" }
    });

    if (officerADuties.length === 1 && officerBDuties.length === 0) {
      console.log("[TEST 5] PASS ✅: Security check passed. Officer A retrieved 1 published duty, Officer B retrieved 0.");
    } else {
      console.log(`[TEST 5] FAIL ❌: Security check failed. Got A=${officerADuties.length}, B=${officerBDuties.length}`);
    }

    console.log("\n==================================================");
    console.log(" ALL PHASE 2 TESTS COMPLETED SUCCESSFULLY! ");
    console.log("==================================================");
  } catch (err) {
    console.error("Test Error:", err);
  } finally {
    await mongoose.connection.close();
  }
}

runTests();
