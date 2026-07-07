import React, { useState } from "react";
import { registerOfficer } from "../api";
function UserRegistration({ onClose }) {
  const [form, setForm] = useState({
    fullName: "",
    dob: "",
    policeId: "",
    gender: "",
    contactNo: "",
    username: "",
    nic: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const handleSubmit = async () => {
  try {
    const result = await registerOfficer(form);

    if (result.message) {
      alert(result.message);

      setForm({
        fullName: "",
        dob: "",
        policeId: "",
        gender: "",
        contactNo: "",
        username: "",
        nic: "",
        password: "",
      });

      if (onClose) onClose();
    } else {
      alert(result.error || "Registration failed");
    }

  } catch (error) {
    alert("Server error");
    console.error(error);
  }
};

  return (
    <div className="register-container">
      <h2 className="register-title">User Registration</h2>

      <div className="register-grid">
        {/* Column 1 */}
        <div className="register-col">
          <div className="field-group">
            <label className="field-label">Full Name</label>
            <input
              className="field-input"
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Police ID</label>
            <input
              className="field-input"
              type="text"
              name="policeId"
              value={form.policeId}
              onChange={handleChange}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Contact No</label>
            <input
              className="field-input"
              type="text"
              name="contactNo"
              value={form.contactNo}
              onChange={handleChange}
            />
          </div>

          <div className="field-group">
            <label className="field-label">NIC</label>
            <input
              className="field-input"
              type="text"
              name="nic"
              value={form.nic}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Column 2 */}
        <div className="register-col">
          <div className="field-group">
            <label className="field-label">DOB</label>
            <input
              className="field-input"
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Gender</label>
            <select
              className="field-input"
              name="gender"
              value={form.gender}
              onChange={handleChange}
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="field-group">
            <label className="field-label">Username</label>
            <input
              className="field-input"
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Password</label>
            <input
              className="field-input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="register-footer">
        {onClose && (
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
        )}
        <button className="btn-register" onClick={handleSubmit}>
          Register
        </button>
      </div>
    </div>
  );
}

export default UserRegistration;