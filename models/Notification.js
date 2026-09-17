const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Officer",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["LEAVE_APPROVED", "LEAVE_REJECTED", "SYSTEM", "DUTY_ASSIGNED"],
    required: true
  },
  relatedLeave: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "OfficerAvailability",
    required: false
  },
  relatedDuty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DutyAssignment",
    required: false
  },
  relatedRoster: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DutyRoster",
    required: false
  },
  rejectionRemarks: {
    type: String,
    default: ""
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
