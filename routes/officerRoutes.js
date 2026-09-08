const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");
const Officer = require("../models/Officer");
const PasswordResetRequest = require("../models/PasswordResetRequest");
const bcrypt = require("bcryptjs");
const { sendApprovalCredentialsEmail, sendPasswordResetEmail } = require("../services/emailService");

// REGISTER OFFICER
router.post("/register", verifyToken, authorizeRoles("oic", "admin"), async (req, res) => {
  try {
    console.log("Register payload received on backend:", req.body);
    const { fullName, dob, policeId, gender, contactNo, username, nic, password, email, rank, role, address, status } = req.body;

    if (!dob || !address || !address.trim()) {
      return res.status(400).json({ message: "Date of Birth and Residential Address are required." });
    }

    const targetUsername = (username && username.trim()) ? username.trim() : (policeId || "").trim();
    const targetPoliceId = (policeId && policeId.trim()) ? policeId.trim() : targetUsername;

    const existing = await Officer.findOne({ $or: [{ policeId: targetPoliceId }, { username: targetUsername }, { nic }] });
    if (existing) {
      return res.status(400).json({ message: "Officer already registered with this NIC, Username or Police ID" });
    }

    // 🔐 hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newOfficer = new Officer({
      fullName,
      dob: dob ? dob : undefined,
      policeId: targetPoliceId,
      gender,
      contactNo,
      username: targetUsername,
      nic,
      password: hashedPassword,
      generatedPassword: password, // Store exact generated password for OIC approval email
      email,
      rank,
      role,
      address,
      status: status || "Pending"
    });

    await newOfficer.save();
    res.status(201).json({ message: "Officer registered successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const jwt = require("jsonwebtoken");

// LOGIN OFFICER
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    let officer = await Officer.findOne({
      $or: [
        { username: username.trim() },
        { policeId: username.trim() },
        { nic: username.trim() }
      ]
    });

    if (!officer) {
      // Fallback check Admin collection for OIC / IT Admin
      const Admin = require("../models/Admin");
      const admin = await Admin.findOne({ username: username.trim() });
      if (admin) {
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
          return res.status(400).json({ message: "Invalid password" });
        }
        const token = jwt.sign(
          { id: admin._id, _id: admin._id, role: admin.role, username: admin.username },
          process.env.JWT_SECRET,
          { expiresIn: "24h" }
        );
        return res.json({
          message: "Login successful",
          token,
          user: {
            id: admin._id,
            fullName: admin.fullName,
            username: admin.username,
            role: admin.role
          },
          officer: {
            _id: admin._id,
            fullName: admin.fullName,
            username: admin.username,
            role: admin.role,
            email: admin.email || ""
          }
        });
      }

      return res.status(400).json({ message: "User not found" });
    }

    if (officer.status === "Pending") {
      return res.status(400).json({ message: "Your account is pending OIC approval." });
    }

    if (officer.status === "Deactive") {
      return res.status(400).json({ message: "Your account has been deactivated." });
    }

    // 🔐 compare password
    const isMatch = await bcrypt.compare(password, officer.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: officer._id, _id: officer._id, role: officer.role || "officer", username: officer.username, policeId: officer.policeId },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const officerProfile = officer.toObject();
    delete officerProfile.password;

    res.json({
      message: "Login successful",
      token,
      mustChangePassword: !!officer.mustChangePassword,
      user: {
        id: officer._id,
        fullName: officer.fullName,
        username: officer.username,
        policeId: officer.policeId,
        role: officer.role || "officer",
        mustChangePassword: !!officer.mustChangePassword,
      },
      officer: officerProfile
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET LOGGED-IN OFFICER PROFILE
router.get("/me", verifyToken, async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const Admin = require("../models/Admin");

    let userDoc = null;
    const uId = req.user?.id || req.user?._id;
    if (uId && mongoose.Types.ObjectId.isValid(uId)) {
      userDoc = await Officer.findById(uId).select("-password");
    }

    if (!userDoc && req.user?.username) {
      userDoc = await Officer.findOne({ username: req.user.username }).select("-password");
    }

    if (!userDoc && req.user?.policeId) {
      userDoc = await Officer.findOne({ policeId: req.user.policeId }).select("-password");
    }

    // Fallback check Admin model if not found in Officer model
    if (!userDoc && uId && mongoose.Types.ObjectId.isValid(uId)) {
      userDoc = await Admin.findById(uId).select("-password");
    }
    if (!userDoc && req.user?.username) {
      userDoc = await Admin.findOne({ username: req.user.username }).select("-password");
    }

    if (!userDoc) {
      return res.status(404).json({ message: "Logged-in officer profile not found." });
    }

    res.json(userDoc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE LOGGED-IN OFFICER PROFILE
router.put("/me", verifyToken, async (req, res) => {
  try {
    console.log("[PROFILE UPDATE]");
    console.log("User ID:", req.user?.id || req.user?._id);
    console.log("Username:", req.user?.username);
    console.log("Police ID:", req.user?.policeId);
    console.log("Role:", req.user?.role);

    const mongoose = require("mongoose");
    const Admin = require("../models/Admin");
    const updateData = { ...req.body };

    // Strip protected fields that cannot be self-modified
    delete updateData.role;
    delete updateData.status;
    delete updateData.policeId;
    delete updateData.nic;

    if (updateData.name && !updateData.fullName) {
      updateData.fullName = updateData.name;
    }

    const userRole = (req.user?.role || "").toLowerCase().trim();
    const isITOfficer = ["admin", "it officer", "itofficer", "it_officer", "it", "it officer/admin", "it officer admin", "oic", "oic traffic branch"].some(r => userRole.includes(r));

    // Strip work details for normal traffic officers
    if (!isITOfficer) {
      delete updateData.rank;
      delete updateData.station;
      delete updateData.assignedArea;
      delete updateData.joinedDate;
    }

    // 1. Identify Officer by JWT req.user with strict priority
    let targetOfficer = null;
    const uId = req.user?.id || req.user?._id;
    if (uId && mongoose.Types.ObjectId.isValid(uId)) {
      targetOfficer = await Officer.findById(uId);
    }
    if (!targetOfficer && req.user?.username) {
      targetOfficer = await Officer.findOne({ username: req.user.username });
    }
    if (!targetOfficer && req.user?.policeId) {
      targetOfficer = await Officer.findOne({ policeId: req.user.policeId });
    }

    // 2. If Officer found, update Officer & sync Admin
    if (targetOfficer) {
      if (updateData.newPassword || updateData.password) {
        const targetPw = updateData.newPassword || updateData.password;
        if (updateData.currentPassword) {
          const match = await bcrypt.compare(updateData.currentPassword, targetOfficer.password);
          if (!match) {
            return res.status(400).json({ message: "Current password does not match" });
          }
        }
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(targetPw, salt);
      } else {
        delete updateData.password;
      }
      delete updateData.newPassword;
      delete updateData.currentPassword;

      const updatedOfficer = await Officer.findByIdAndUpdate(
        targetOfficer._id,
        { $set: updateData },
        { new: true }
      ).select("-password");

      // Sync Admin model if matching account exists
      if (targetOfficer.username) {
        const adminDoc = await Admin.findOne({ username: targetOfficer.username });
        if (adminDoc) {
          if (updateData.fullName) adminDoc.fullName = updateData.fullName;
          if (updateData.email !== undefined) adminDoc.email = updateData.email;
          if (updateData.password) adminDoc.password = updateData.password;
          await adminDoc.save();
        }
      }

      return res.json(updatedOfficer);
    }

    // 3. Fallback: Search Admin model by JWT req.user
    let admin = null;
    if (uId && mongoose.Types.ObjectId.isValid(uId)) {
      admin = await Admin.findById(uId);
    }
    if (!admin && req.user?.username) {
      admin = await Admin.findOne({ username: req.user.username });
    }

    if (admin) {
      if (updateData.fullName) admin.fullName = updateData.fullName;
      if (updateData.email !== undefined) admin.email = updateData.email;
      if (updateData.contactNo !== undefined) admin.contactNo = updateData.contactNo;
      if (updateData.address !== undefined) admin.address = updateData.address;
      if (updateData.profileImage !== undefined) admin.profileImage = updateData.profileImage;

      if (updateData.newPassword || updateData.password) {
        const targetPw = updateData.newPassword || updateData.password;
        if (updateData.currentPassword) {
          const match = await bcrypt.compare(updateData.currentPassword, admin.password);
          if (!match) {
            return res.status(400).json({ message: "Current password does not match" });
          }
        }
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(targetPw, salt);
      }
      await admin.save();
      const resAdmin = admin.toObject();
      delete resAdmin.password;
      return res.json(resAdmin);
    }

    return res.status(404).json({ message: "Logged-in officer profile not found." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET ALL OFFICERS
router.get("/", verifyToken, authorizeRoles("oic", "admin"), async (req, res) => {
  try {
    const officers = await Officer.find().select("-password -generatedPassword");
    res.json(officers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE OFFICER BY ID OR USERNAME OR POLICE ID
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const userRole = (req.user.role || "").toLowerCase().trim();
    const adminRoles = ["admin", "it officer", "itofficer", "it_officer", "it", "it officer/admin", "it officer admin", "oic", "oic traffic branch"];
    const isManager = adminRoles.some(r => userRole.includes(r));

    const mongoose = require("mongoose");
    const paramId = req.params.id;

    let officerToUpdate = null;
    if (paramId === "me" || String(paramId) === String(req.user.id) || String(paramId) === String(req.user._id)) {
      if (req.user.id && mongoose.Types.ObjectId.isValid(req.user.id)) {
        officerToUpdate = await Officer.findById(req.user.id);
      } else if (req.user._id && mongoose.Types.ObjectId.isValid(req.user._id)) {
        officerToUpdate = await Officer.findById(req.user._id);
      }
    }

    if (!officerToUpdate) {
      if (mongoose.Types.ObjectId.isValid(paramId)) {
        officerToUpdate = await Officer.findById(paramId);
      }
    }

    if (!officerToUpdate) {
      officerToUpdate = await Officer.findOne({
        $or: [
          { policeId: paramId },
          { username: paramId },
          { nic: paramId },
          ...(req.user.username ? [{ username: req.user.username }] : []),
          ...(req.user.policeId ? [{ policeId: req.user.policeId }] : [])
        ]
      });
    }

    if (!officerToUpdate) {
      return res.status(404).json({ message: "Officer profile not found" });
    }

    const reqUserId = req.user?.id || req.user?._id;
    const reqUsername = (req.user?.username || "").toLowerCase().trim();
    const reqPoliceId = (req.user?.policeId || "").toLowerCase().trim();

    const isSelf = paramId === "me" ||
                   (reqUserId && String(officerToUpdate._id) === String(reqUserId)) ||
                   (reqUsername && String(officerToUpdate.username || "").toLowerCase().trim() === reqUsername) ||
                   (reqPoliceId && String(officerToUpdate.policeId || "").toLowerCase().trim() === reqPoliceId) ||
                   (reqUsername && String(officerToUpdate.policeId || "").toLowerCase().trim() === reqUsername) ||
                   (reqPoliceId && String(officerToUpdate.username || "").toLowerCase().trim() === reqPoliceId);

    if (!isSelf && !isManager) {
      return res.status(403).json({ message: "You are not authorized to update this profile." });
    }

    const updateData = { ...req.body };
    delete updateData.password;
    delete updateData.role;

    // Non-IT/non-manager officers cannot modify work information fields
    if (!isManager) {
      delete updateData.rank;
      delete updateData.station;
      delete updateData.assignedArea;
      delete updateData.joinedDate;
      delete updateData.status;
    }

    if (req.body.password && isManager) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(req.body.password, salt);
      // Update generatedPassword if password is changed by manager
      updateData.generatedPassword = req.body.password;
    }

    // Detect OIC approval transition: Pending -> Active (or non-Active -> Active)
    const isApprovalTransition = (officerToUpdate.status === "Pending" || officerToUpdate.status !== "Active") && updateData.status === "Active";
    const passwordForEmail = officerToUpdate.generatedPassword || req.body.generatedPassword || req.body.password;

    const updatedOfficer = await Officer.findByIdAndUpdate(
      officerToUpdate._id,
      updateData,
      { new: true }
    ).select("-password -generatedPassword");

    if (isApprovalTransition) {
      // Clear generatedPassword from DB after reading it so unhashed password is not stored indefinitely
      await Officer.findByIdAndUpdate(officerToUpdate._id, { generatedPassword: "" });

      let emailMessage = "Officer approved successfully.";
      let emailSent = false;

      const recipientEmail = (updateData.email || officerToUpdate.email || "").trim();
      const officerFullName = updateData.fullName || officerToUpdate.fullName;
      const officerUsername = updateData.username || officerToUpdate.username || officerToUpdate.policeId;

      if (recipientEmail && passwordForEmail) {
        const mailRes = await sendApprovalCredentialsEmail(
          recipientEmail,
          officerFullName,
          officerUsername,
          passwordForEmail
        );

        if (mailRes.success) {
          emailSent = true;
          emailMessage = "Officer approved successfully. Login credentials have been sent to the registered email address.";
          console.log(`[OIC APPROVAL] Credential email sent successfully to ${recipientEmail}`);
        } else {
          console.error(`[OIC APPROVAL] Officer approved successfully, but credential email failed to send. Reason: ${mailRes.error || "SMTP failure"}`);
          emailMessage = "Officer approved successfully, but the credential email could not be sent.";
        }
      } else if (!recipientEmail) {
        console.warn(`[OIC APPROVAL] Officer ${officerUsername} approved, but no registered email address was found.`);
        emailMessage = "Officer approved successfully, but no registered email address was found.";
      }

      const responsePayload = updatedOfficer.toObject();
      responsePayload.message = emailMessage;
      responsePayload.emailSent = emailSent;
      return res.json(responsePayload);
    }

    res.json(updatedOfficer);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── OIC PASSWORD RESET WORKFLOW ENDPOINTS ──────────────────────

function generateSecureTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789#@!";
  let result = "Tp#";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 1. IT OFFICER: Create Password Reset Request
router.post("/password-reset-request", verifyToken, async (req, res) => {
  try {
    const userRole = (req.user.role || "").toLowerCase().trim();
    const isITOfficer = ["admin", "it officer", "itofficer", "it_officer", "it", "it officer/admin", "it officer admin", "oic"].some(r => userRole.includes(r));
    if (!isITOfficer) {
      return res.status(403).json({ message: "Only IT Officers are authorized to request password resets." });
    }

    const { officerId, targetOfficerId } = req.body;
    const targetId = officerId || targetOfficerId;

    if (!targetId) {
      return res.status(400).json({ message: "Target Officer ID is required." });
    }

    const officer = await Officer.findById(targetId);
    if (!officer) {
      return res.status(404).json({ message: "Target Traffic Officer not found." });
    }

    if (!officer.email || !officer.email.trim()) {
      return res.status(400).json({ message: "Officer does not have a registered email address. Password reset request cannot be created." });
    }

    // Check for existing pending request
    const existingPending = await PasswordResetRequest.findOne({
      targetOfficerId: officer._id,
      status: "PENDING"
    });

    if (existingPending) {
      return res.status(400).json({ message: "A password reset request is already pending OIC approval for this Traffic Officer." });
    }

    const requesterName = req.user.fullName || req.user.username || "IT Officer";
    const newRequest = new PasswordResetRequest({
      targetOfficerId: officer._id,
      targetOfficerName: officer.fullName,
      targetOfficerPoliceId: officer.policeId || officer.username || "",
      targetOfficerEmail: officer.email.trim(),
      requestedBy: requesterName,
      requestedByRole: "IT Officer",
      status: "PENDING",
      requestedAt: new Date()
    });

    await newRequest.save();

    console.log(`[PASSWORD RESET REQUEST] Created for ${officer.fullName} by ${requesterName}`);
    return res.status(201).json({
      message: "Password reset request sent to OIC for approval.",
      request: newRequest
    });

  } catch (error) {
    console.error("Error creating password reset request:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. GET ALL PASSWORD RESET REQUESTS (OIC & IT Officer view)
router.get("/password-reset-requests", verifyToken, async (req, res) => {
  try {
    const requests = await PasswordResetRequest.find().sort({ requestedAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. OIC: Approve Password Reset Request
router.post("/approve-password-reset/:requestId", verifyToken, async (req, res) => {
  try {
    const userRole = (req.user.role || "").toLowerCase().trim();
    const isOIC = ["oic", "oic traffic branch", "admin"].some(r => userRole.includes(r));
    if (!isOIC) {
      return res.status(403).json({ message: "Only an authorized OIC can approve password reset requests." });
    }

    const { requestId } = req.params;
    const requestDoc = await PasswordResetRequest.findById(requestId);

    if (!requestDoc) {
      return res.status(404).json({ message: "Password reset request not found." });
    }

    if (requestDoc.status !== "PENDING" && requestDoc.status !== "EMAIL_FAILED") {
      return res.status(400).json({ message: `Password reset request is already ${requestDoc.status}.` });
    }

    const officer = await Officer.findById(requestDoc.targetOfficerId);
    if (!officer) {
      return res.status(404).json({ message: "Target Traffic Officer not found in database." });
    }

    const recipientEmail = (officer.email || requestDoc.targetOfficerEmail || "").trim();
    if (!recipientEmail) {
      return res.status(400).json({ message: "No registered email found for this officer." });
    }

    // Generate secure temporary password
    const tempPassword = generateSecureTempPassword();

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // Save hashed password to officer record
    officer.password = hashedPassword;
    officer.mustChangePassword = true;
    await officer.save();

    const approverName = req.user.fullName || req.user.username || "OIC";

    // Send temporary password via Nodemailer to registered email ONLY
    const emailResult = await sendPasswordResetEmail(recipientEmail, officer.fullName, tempPassword);

    if (emailResult.success) {
      requestDoc.status = "APPROVED";
      requestDoc.approvedBy = approverName;
      requestDoc.approvedAt = new Date();
      requestDoc.emailErrorMessage = "";
      await requestDoc.save();

      console.log(`[OIC APPROVED RESET] Password reset approved for ${officer.fullName}. Temp password emailed.`);
      return res.json({
        success: true,
        message: `Password reset approved for ${officer.fullName}. Temporary password sent to the registered email.`,
        request: requestDoc
      });
    } else {
      requestDoc.status = "EMAIL_FAILED";
      requestDoc.approvedBy = approverName;
      requestDoc.approvedAt = new Date();
      requestDoc.emailErrorMessage = emailResult.error || "SMTP email dispatch failed.";
      await requestDoc.save();

      console.error(`[OIC APPROVAL EMAIL FAILED] Password reset for ${officer.fullName} failed to send email. Error: ${emailResult.error}`);
      return res.status(500).json({
        success: false,
        status: "EMAIL_FAILED",
        message: `Password updated, but email delivery failed: ${emailResult.error || "SMTP error"}. You can retry email delivery.`,
        request: requestDoc
      });
    }

  } catch (error) {
    console.error("Error approving password reset:", error);
    res.status(500).json({ error: error.message });
  }
});

// 4. OIC: Reject Password Reset Request
router.post("/reject-password-reset/:requestId", verifyToken, async (req, res) => {
  try {
    const userRole = (req.user.role || "").toLowerCase().trim();
    const isOIC = ["oic", "oic traffic branch", "admin"].some(r => userRole.includes(r));
    if (!isOIC) {
      return res.status(403).json({ message: "Only an authorized OIC can reject password reset requests." });
    }

    const { requestId } = req.params;
    const { remarks, rejectionRemarks } = req.body;
    const finalRemarks = remarks || rejectionRemarks || "Rejected by OIC";

    const requestDoc = await PasswordResetRequest.findById(requestId);
    if (!requestDoc) {
      return res.status(404).json({ message: "Password reset request not found." });
    }

    if (requestDoc.status !== "PENDING") {
      return res.status(400).json({ message: `Password reset request is already ${requestDoc.status}.` });
    }

    const rejectorName = req.user.fullName || req.user.username || "OIC";
    requestDoc.status = "REJECTED";
    requestDoc.rejectedBy = rejectorName;
    requestDoc.rejectedAt = new Date();
    requestDoc.rejectionRemarks = finalRemarks;

    await requestDoc.save();

    console.log(`[OIC REJECTED RESET] Request for ${requestDoc.targetOfficerName} rejected by ${rejectorName}`);
    return res.json({
      success: true,
      message: `Password reset request for ${requestDoc.targetOfficerName} was rejected by the OIC.`,
      request: requestDoc
    });

  } catch (error) {
    console.error("Error rejecting password reset:", error);
    res.status(500).json({ error: error.message });
  }
});

// 5. OIC: Retry Sending Email for EMAIL_FAILED Reset Request
router.post("/retry-reset-email/:requestId", verifyToken, async (req, res) => {
  try {
    const userRole = (req.user.role || "").toLowerCase().trim();
    const isOIC = ["oic", "oic traffic branch", "admin"].some(r => userRole.includes(r));
    if (!isOIC) {
      return res.status(403).json({ message: "Only OIC is authorized to retry email dispatch." });
    }

    const { requestId } = req.params;
    const requestDoc = await PasswordResetRequest.findById(requestId);
    if (!requestDoc) {
      return res.status(404).json({ message: "Password reset request not found." });
    }

    const officer = await Officer.findById(requestDoc.targetOfficerId);
    if (!officer) {
      return res.status(404).json({ message: "Target Traffic Officer not found." });
    }

    const tempPassword = generateSecureTempPassword();
    const salt = await bcrypt.genSalt(10);
    officer.password = await bcrypt.hash(tempPassword, salt);
    officer.mustChangePassword = true;
    await officer.save();

    const recipientEmail = (officer.email || requestDoc.targetOfficerEmail || "").trim();
    const emailResult = await sendPasswordResetEmail(recipientEmail, officer.fullName, tempPassword);

    if (emailResult.success) {
      requestDoc.status = "APPROVED";
      requestDoc.emailErrorMessage = "";
      await requestDoc.save();
      return res.json({
        success: true,
        message: `Temporary password re-sent successfully to ${recipientEmail}.`,
        request: requestDoc
      });
    } else {
      requestDoc.emailErrorMessage = emailResult.error || "SMTP retry failed.";
      await requestDoc.save();
      return res.status(500).json({
        success: false,
        message: `Retry failed: ${emailResult.error || "SMTP error"}`
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. TRAFFIC OFFICER: Change Password (First Login / Forced Password Change)
router.post("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long." });
    }

    const officerId = req.user?.id || req.user?._id;
    const officer = await Officer.findById(officerId);
    if (!officer) {
      return res.status(404).json({ message: "Officer account not found." });
    }

    if (currentPassword) {
      const match = await bcrypt.compare(currentPassword, officer.password);
      if (!match) {
        return res.status(400).json({ message: "Current temporary password is incorrect." });
      }
    }

    const salt = await bcrypt.genSalt(10);
    officer.password = await bcrypt.hash(newPassword, salt);
    officer.mustChangePassword = false;
    await officer.save();

    return res.json({ message: "Password updated successfully. You may now continue using the system." });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;