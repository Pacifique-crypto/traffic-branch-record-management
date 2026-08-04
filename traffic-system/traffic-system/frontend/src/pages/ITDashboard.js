import React, { useState, useEffect } from "react";
import ITLayout from "../layouts/ITLayout";
import { FiUsers, FiFileText, FiBarChart2, FiActivity, FiAlertTriangle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { getAccidents, getViolations, getOfficers } from "../api";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

function ITDashboard() {
  const navigate = useNavigate();
  const officer  = JSON.parse(localStorage.getItem("officer") || "{}");
  const name     = officer.name || "IT Admin";

  const [reportsCount, setReportsCount]     = useState(0);
  const [usersCount, setUsersCount]         = useState(0);
  const [recentUsers, setRecentUsers]       = useState([]);
  const [rejectedOfficers, setRejectedOfficers] = useState([]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const accs = await getAccidents();
        const viols = await getViolations();
        const offs = await getOfficers();
        setReportsCount((accs.length || 0) + (viols.length || 0));
        setUsersCount(offs.length || 0);

        if (Array.isArray(offs)) {
          const rejected = offs.filter(o => o.status === "Rejected");
          setRejectedOfficers(rejected);

          setRecentUsers(offs.slice(0, 5).map(o => ({
            name: o.fullName || o.name || "Unknown",
            role: o.role || "Traffic Officer",
            date: o.createdAt ? o.createdAt.split("T")[0] : "2026-07-01",
            status: o.status || "Active"
          })));
        }
      } catch (err) {
        console.error("Failed to load IT dashboard stats:", err);
      }
    };
    loadStats();
  }, []);

  const stats = [
    { icon: <FiUsers size={24} />,    value: usersCount,  label: "Total\nUsers",   bg: "#dbeafe", iconBg: "#bfdbfe", iconColor: "#2563eb" },
    { icon: <FiFileText size={24} />, value: reportsCount, label: "Total\nReports", bg: "#dcfce7", iconBg: "#bbf7d0", iconColor: "#16a34a" },
    { icon: <FiBarChart2 size={24}/>, value: 3,  label: "Analytics\nRuns",bg: "#fef9c3", iconBg: "#fde68a", iconColor: "#b45309" },
    { icon: <FiActivity size={24} />, value: rejectedOfficers.length > 0 ? rejectedOfficers.length : 1, label: "System\nAlerts", bg: "#f3e8ff", iconBg: "#e9d5ff", iconColor: "#7c3aed" },
  ];

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

      {/* Rejection Notifications Banner for IT Officer */}
      {rejectedOfficers.length > 0 && (
        <div style={{
          background: "#fff1f2",
          border: "1px solid #fecdd3",
          borderRadius: "12px",
          padding: "18px 22px",
          marginBottom: "24px",
          boxShadow: "0 4px 12px rgba(225, 29, 72, 0.06)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "#ffe4e6", padding: "10px", borderRadius: "10px", color: "#e11d48", display: "flex" }}>
                <FiAlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#9f1239" }}>
                  Officer Registration Rejection Notifications ({rejectedOfficers.length})
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#be123c" }}>
                  The OIC has rejected the following officer registration request(s).
                </p>
              </div>
            </div>
            <button
              className="pro-btn-primary"
              style={{ fontSize: "13px", padding: "8px 16px", backgroundColor: "#e11d48", border: "none" }}
              onClick={() => navigate("/user-management")}
            >
              Manage Officers
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {rejectedOfficers.map(ro => (
              <div key={ro._id || ro.id} style={{
                background: "#ffffff",
                border: "1px solid #fca5a5",
                borderRadius: "8px",
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: "700", fontSize: "14px", color: "#1e293b" }}>
                    {ro.fullName} <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>({ro.username || ro.policeId} • {ro.rank || "Constable"} • {ro.role || "Officer"})</span>
                  </p>
                  <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "#dc2626" }}>
                    <strong>OIC Rejection Reason:</strong> {ro.rejectionRemarks || "No remarks provided"}
                  </p>
                </div>
                <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "500", whiteSpace: "nowrap" }}>
                  {ro.updatedAt ? new Date(ro.updatedAt).toLocaleDateString() : "Recently"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
                <td>
                  <span className={`remarks-badge ${u.status === "Active" ? "badge-green" : u.status === "Rejected" ? "badge-red" : "badge-orange"}`} style={{
                    backgroundColor: u.status === "Rejected" ? "#fee2e2" : undefined,
                    color: u.status === "Rejected" ? "#dc2626" : undefined
                  }}>
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ITLayout>
  );
}

export default ITDashboard;