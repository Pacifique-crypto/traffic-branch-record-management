/**
 * Clean Obsolete Test Data Script
 * Safely removes DRAFT test rosters and orphan assignments in development,
 * while strictly keeping all APPROVED and PUBLISHED rosters and assignments intact.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const DutyRoster = require("../models/DutyRoster");
const DutyAssignment = require("../models/DutyAssignment");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/traffic_db";

async function cleanupTestData() {
  console.log("======================================================================");
  console.log(" OBSOLETE TEST DATA CLEANUP ");
  console.log("======================================================================\n");

  try {
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 });
      console.log("✅ Connected to MongoDB Atlas.");
    } catch (err) {
      await mongoose.connect("mongodb://127.0.0.1:27017/traffic_db", { serverSelectionTimeoutMS: 3000 });
      console.log("✅ Connected to local MongoDB.");
    }

    // Count APPROVED and PUBLISHED rosters (MUST BE PRESERVED)
    const approvedCount = await DutyRoster.countDocuments({ status: "APPROVED" });
    const publishedCount = await DutyRoster.countDocuments({ status: "PUBLISHED" });

    console.log(`📌 APPROVED rosters in database: ${approvedCount} (SAFE - PRESERVED)`);
    console.log(`📌 PUBLISHED rosters in database: ${publishedCount} (SAFE - PRESERVED)`);

    // Find DRAFT rosters to clean up
    const draftRosters = await DutyRoster.find({ status: { $in: ["DRAFT", "PENDING_APPROVAL", "CHANGES_REQUESTED"] } });
    console.log(`⚠️  Found ${draftRosters.length} draft/pending test rosters to clean up.`);

    const draftRosterIds = draftRosters.map(r => r._id);

    // Delete assignments belonging to draft rosters
    const deletedDraftAssignments = await DutyAssignment.deleteMany({ roster: { $in: draftRosterIds } });
    console.log(`🗑️  Deleted ${deletedDraftAssignments.deletedCount} draft assignments.`);

    // Delete draft rosters
    const deletedDraftRosters = await DutyRoster.deleteMany({ _id: { $in: draftRosterIds } });
    console.log(`🗑️  Deleted ${deletedDraftRosters.deletedCount} draft rosters.`);

    // Clean orphan assignments (where roster is null or doesn't exist in DutyRoster)
    const allRosters = await DutyRoster.find({}).select("_id");
    const validRosterIds = allRosters.map(r => r._id);

    const orphanAssignments = await DutyAssignment.deleteMany({
      $or: [
        { roster: { $exists: false } },
        { roster: null },
        { roster: { $nin: validRosterIds } }
      ]
    });
    console.log(`🗑️  Deleted ${orphanAssignments.deletedCount} orphan assignments.`);

    // Final verification
    const remainingRosters = await DutyRoster.countDocuments({});
    const remainingAssignments = await DutyAssignment.countDocuments({});
    console.log(`\n✅ CLEANUP COMPLETE! Remaining active rosters: ${remainingRosters}, remaining assignments: ${remainingAssignments}`);

  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("======================================================================\n");
  }
}

cleanupTestData();
