const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const { verifyToken } = require("../middlewares/authMiddleware");

// ==================================================
// 1. GET NOTIFICATIONS FOR LOGGED-IN OFFICER
// ==================================================
router.get("/me", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Unauthorized user ID." });
    }

    const notifications = await Notification.find({ recipient: userId })
      .populate("relatedLeave")
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================================================
// 2. MARK SPECIFIC NOTIFICATION AS READ
// ==================================================
router.put("/:id/read", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Notification ID." });
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    // Security check: Only the recipient can mark their notification as read
    if (String(notification.recipient) !== String(userId)) {
      return res.status(403).json({ message: "You are not authorized to mark this notification as read." });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: "Notification marked as read.", notification });
  } catch (error) {
    console.error("Error updating notification status:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================================================
// 3. MARK ALL NOTIFICATIONS AS READ FOR LOGGED-IN OFFICER
// ==================================================
router.put("/read-all", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Unauthorized user ID." });
    }

    await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });

    res.json({ message: "All notifications marked as read." });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
