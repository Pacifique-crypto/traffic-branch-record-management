const mongoose = require("mongoose");

const passwordResetRequestSchema = new mongoose.Schema(
  {
    targetOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Officer",
      required: true,
    },
    targetOfficerName: {
      type: String,
      required: true,
    },
    targetOfficerPoliceId: {
      type: String,
      default: "",
    },
    targetOfficerEmail: {
      type: String,
      default: "",
    },
    requestedBy: {
      type: String,
      required: true,
    },
    requestedByRole: {
      type: String,
      default: "IT Officer",
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "EMAIL_FAILED"],
      default: "PENDING",
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    approvedBy: {
      type: String,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedBy: {
      type: String,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionRemarks: {
      type: String,
      default: "",
    },
    emailErrorMessage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PasswordResetRequest", passwordResetRequestSchema);
