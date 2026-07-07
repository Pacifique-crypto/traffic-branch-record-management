import React from "react";
import { Link } from "react-router-dom";

function Sidebar() {
  const admin = JSON.parse(localStorage.getItem("admin"));
  const role = admin?.role;

  return (
    <div className="sidebar">
      <h2>Traffic System</h2>

      <Link to="/dashboard">Dashboard</Link>

      {/* Admin only */}
      {role === "admin" && (
        <>
          <Link to="/users">Officer Management</Link>
          <Link to="/user-registration">Register Officer</Link>
        </>
      )}

      {/* Both Admin & OIC */}
      <Link to="/accidents">Accidents</Link>
      <Link to="/violations">Violations</Link>
      <Link to="/duties">Duties</Link>
      <Link to="/reports">Reports</Link>

      {/* Admin only */}
      {role === "admin" && (
        <Link to="/settings">Settings</Link>
      )}

      <Link
        to="/login"
        onClick={() => {
          localStorage.removeItem("admin");
          localStorage.removeItem("isLoggedIn");
        }}
      >
        Logout
      </Link>
    </div>
  );
}

export default Sidebar;