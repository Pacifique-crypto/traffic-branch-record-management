const nodemailer = require("nodemailer");

/**
 * Sends login credentials email to an approved Traffic Officer.
 * @param {string} toEmail - Registered Gmail address of the officer
 * @param {string} officerName - Full name of the officer
 * @param {string} username - Automatically generated username / police ID
 * @param {string} password - Exact password generated during registration
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const sendApprovalCredentialsEmail = async (toEmail, officerName, username, password) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, "") : "";

  if (!user || !pass) {
    console.log("[SMTP] EMAIL_USER or EMAIL_PASS environment variable is missing.");
    return { success: false, error: "SMTP credentials not configured." };
  }

  if (!toEmail || !toEmail.trim()) {
    console.log("[SMTP] No destination email provided for officer credential dispatch.");
    return { success: false, error: "Officer email address is missing." };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: { user, pass }
    });

    const mailOptions = {
      from: `"Traffic Branch System" <${user}>`,
      to: toEmail.trim(),
      subject: "Traffic Branch System - Your Account Has Been Approved",
      text: `Dear ${officerName},\n\nYour Traffic Branch System account has been approved by the Officer in Charge.\n\nYou can now log in to the Traffic Branch mobile application.\n\nLogin Details:\n\nUsername: ${username}\nPassword: ${password}\n\nPlease keep your login credentials secure.\n\nRegards,\nTraffic Branch\nTraffic Police Operation and Management System`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f8fafc; color: #0f172a; border-radius: 10px; max-width: 560px; margin: 0 auto; border: 1px solid #cbd5e1;">
          <div style="background-color: #0f172a; padding: 18px 24px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 700; letter-spacing: 0.5px;">SRI LANKA POLICE — TRAFFIC BRANCH</h2>
            <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0;">Account Approval Notification</p>
          </div>
          <div style="padding: 24px 20px; background-color: #ffffff; border-radius: 0 0 8px 8px;">
            <p style="font-size: 15px; margin-top: 0; color: #1e293b;">Dear <strong>${officerName}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              Your Traffic Branch System account has been approved by the Officer in Charge.
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              You can now log in to the Traffic Branch mobile application.
            </p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #0f172a; padding: 16px 20px; margin: 20px 0; border-radius: 4px; border: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; font-weight: 700; font-size: 14px; color: #0f172a;">Login Details:</p>
              <p style="margin: 4px 0; font-size: 14px; font-family: monospace; color: #0f172a;"><strong>Username:</strong> ${username}</p>
              <p style="margin: 4px 0; font-size: 14px; font-family: monospace; color: #0f172a;"><strong>Password:</strong> ${password}</p>
            </div>

            <p style="font-size: 13px; color: #64748b; margin-bottom: 24px;">Please keep your login credentials secure.</p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            
            <p style="font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.4;">
              Regards,<br />
              <strong>Traffic Branch</strong><br />
              Traffic Police Operation and Management System
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`[SMTP SUCCESS] Credential email delivered to ${toEmail.trim()} for officer ${username}`);
    return { success: true };
  } catch (err) {
    console.error("[SMTP ERROR] Failed to send credential email:", err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { sendApprovalCredentialsEmail };
