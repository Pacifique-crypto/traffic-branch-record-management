import React from "react";
import ITLayout from "../layouts/ITLayout";
import { FiUsers, FiFileText, FiBarChart2, FiActivity } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const stats = [
  { icon: <FiUsers size={24} />,    value: 5,  label: "Total\nUsers",   bg: "#dbeafe", iconBg: "#bfdbfe", iconColor: "#2563eb" },
  { icon: <FiFileText size={24} />, value: 12, label: "Total\nReports", bg: "#dcfce7", iconBg: "#bbf7d0", iconColor: "#16a34a" },
  { icon: <FiBarChart2 size={24}/>, value: 3,  label: "Analytics\nRuns",bg: "#fef9c3", iconBg: "#fde68a", iconColor: "#b45309" },
  { icon: <FiActivity size={24} />, value: 1,  label: "System\nAlerts", bg: "#f3e8ff", iconBg: "#e9d5ff", iconColor: "#7c3aed" },
];

const recentUsers = [
  { name: "PS Perera",     role: "OIC",            date: "2026-07-01", status: "Active" },
  { name: "KP Jayasinghe", role: "Traffic Officer", date: "2026-06-20", status: "Active" },
  { name: "AR Fernando",   role: "Traffic Officer", date: "2026-06-15", status: "Active" },
];

function ITDashboard() {
  const navigate = useNavigate();
  const officer  = JSON.parse(localStorage.getItem("officer") || "{}");
  const name     = officer.name || "IT Admin";

  return (
    <ITLayout>
      <div className="pro-greeting-row">
        <div>
          <h1 className="pro-greeting">{getGreeting()}, {name} 👋</h1>
          <p className="pro-greeting-sub">IT Officer Workspace — Traffic Branch Management System</p>
        </div>
        <button className="pro-btn-primary" onClick={() => navigate("/user-management")}>
          + Add New User
        </button>
      </div>

      {/* Stats */}
      <div className="pro-stat-grid">
        {stats.map((s, i) => (
          <div className="pro-stat-card" key={i} style={{ background: s.bg }}>
            <div className="pro-stat-icon-wrap" style={{ background: s.iconBg, color: s.iconColor }}>
              {s.icon}
            </div>
            <div>
              <p className="pro-stat-value">{s.value}</p>
              <p className="pro-stat-label" style={{ whiteSpace: "pre-line" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent users table */}
      <div className="pro-dash-card" style={{ marginTop: 20 }}>
        <div className="pro-dash-card-header">
          <FiUsers size={18} color="#2563eb" />
          <h3 className="pro-dash-card-title">Recent Users</h3>
          <button className="pro-btn-primary" style={{ marginLeft: "auto", fontSize: 12, padding: "6px 14px" }} onClick={() => navigate("/user-management")}>
            View All
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Date Added</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((u, i) => (
              <tr key={i} className="table-row">
                <td>{u.name}</td>
                <td>{u.role}</td>
                <td>{u.date}</td>
                <td><span className="remarks-badge badge-green">{u.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ITLayout>
  );
}

export default ITDashboard;