import React, { useState, useEffect } from "react";
import OICLayout from "../layouts/OICLayout";
import { FiAlertTriangle, FiAlertCircle, FiDollarSign, FiCalendar, FiBell } from "react-icons/fi";
import { getAccidents, getViolations } from "../api";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

// Stats list is moved inside the component to read from state.

const pendingNotifications = [
  { id: 1, type: "Accident",  title: "New accident reported on Colombo Road",    time: "5 mins ago",  color: "#ef4444", bg: "#fee2e2" },
  { id: 2, type: "Violation", title: "Speed violation detected – Chilaw Road",   time: "12 mins ago", color: "#f59e0b", bg: "#fef3c7" },
  { id: 3, type: "Fine",      title: "Unpaid fine overdue – VID-1021",           time: "1 hour ago",  color: "#3b82f6", bg: "#dbeafe" },
  { id: 4, type: "Accident",  title: "Hit & Run reported near Negombo Junction", time: "2 hours ago", color: "#ef4444", bg: "#fee2e2" },
];

const recentActivity = [
  { name: "Recent Accident", sub: "Type: Collision | 2/7/2026",  value: "ACD-1024", tag: "High",    tagColor: "#ef4444", tagBg: "#fee2e2" },
  { name: "Speed Violation", sub: "Type: Speeding | 15/6/2026",  value: "VID-1021", tag: "Pending", tagColor: "#f59e0b", tagBg: "#fef3c7" },
  { name: "Spot Fine",       sub: "Type: Fine | 1/6/2026",       value: "LKR 2,500",tag: "Paid",    tagColor: "#16a34a", tagBg: "#dcfce7" },
];

function OICDashboard() {
  const officer = JSON.parse(localStorage.getItem("officer") || "{}");
  const name    = officer.name || "PS Perera";

  const [accidentsCount, setAccidentsCount] = useState(0);
  const [violationsCount, setViolationsCount] = useState(0);
  const [recentLogs, setRecentLogs]           = useState([]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const accs = await getAccidents();
        const viols = await getViolations();
        setAccidentsCount(accs.length || 0);
        setViolationsCount(viols.length || 0);

        const combined = [];
        (accs || []).slice(0, 2).forEach(a => {
          const dateStr = a.accidentDate || "";
          const datePart = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr.split(" ")[0];
          combined.push({
            name: "Accident Entry",
            sub: `Type: ${a.description ? a.description.replace("Type: ", "") : a.type || "Collision"} | ${datePart}`,
            value: a.id ? a.id.slice(-6).toUpperCase() : "ACD-NEW",
            tag: a.severity || "MINOR",
            tagColor: a.severity === "FATAL" ? "#dc2626" : "#2563eb",
            tagBg: a.severity === "FATAL" ? "#fee2e2" : "#dbeafe"
          });
        });
        (viols || []).slice(0, 2).forEach(v => {
          const dateStr = v.violationDate || "";
          const datePart = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr.split(" ")[0];
          const actionVal = v.actionTaken || v.action || "Issued";
          combined.push({
            name: "Traffic Offence",
            sub: `Type: ${v.violationType || v.offence} | ${datePart}`,
            value: v.id ? v.id.slice(-6).toUpperCase() : "VID-NEW",
            tag: actionVal,
            tagColor: actionVal === "Court Referral" ? "#dc2626" : "#b45309",
            tagBg: actionVal === "Court Referral" ? "#fee2e2" : "#fef9c3"
          });
        });
        setRecentLogs(combined.slice(0, 3));
      } catch (err) {
        console.error("Failed to load OIC dashboard stats:", err);
      }
    };
    loadStats();
  }, []);

  const stats = [
    { icon: <FiAlertTriangle size={24} />, value: accidentsCount, label: "Active\nAccidents",  bg: "#dbeafe", iconBg: "#bfdbfe", iconColor: "#2563eb" },
    { icon: <FiAlertCircle  size={24} />, value: violationsCount, label: "Active\nViolations", bg: "#dcfce7", iconBg: "#bbf7d0", iconColor: "#16a34a" },
    { icon: <FiDollarSign   size={24} />, value: Math.ceil(violationsCount * 0.7), label: "Pending\nFines",     bg: "#fef9c3", iconBg: "#fde68a", iconColor: "#b45309" },
    { icon: <FiCalendar     size={24} />, value: 2, label: "Duties\nToday",      bg: "#f3e8ff", iconBg: "#e9d5ff", iconColor: "#7c3aed" },
  ];

  return (
    <OICLayout>
      {/* Greeting */}
      <div className="pro-greeting-row">
        <div>
          <h1 className="pro-greeting">{getGreeting()}, {name} 👋</h1>
          <p className="pro-greeting-sub">Here's what's happening at Negombo Traffic Branch today.</p>
        </div>
      </div>

      {/* Stat cards */}
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

      {/* Bottom two columns */}
      <div className="pro-dash-bottom">

        {/* Pending Notifications */}
        <div className="pro-dash-card">
          <div className="pro-dash-card-header">
            <FiBell size={18} color="#f59e0b" />
            <h3 className="pro-dash-card-title">Pending Notifications</h3>
            <span className="pending-count-badge">{pendingNotifications.length}</span>
          </div>
          <div className="pending-notif-list">
            {pendingNotifications.map((n) => (
              <div className="pending-notif-item" key={n.id}>
                <div className="pending-notif-dot" style={{ background: n.color }} />
                <div className="pending-notif-body">
                  <span className="pending-notif-type" style={{ color: n.color, background: n.bg }}>{n.type}</span>
                  <p className="pending-notif-title">{n.title}</p>
                </div>
                <span className="pending-notif-time">{n.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="pro-dash-card">
          <div className="pro-dash-card-header">
            <span style={{ fontSize: 18 }}>📋</span>
            <h3 className="pro-dash-card-title">Recent Activity Log</h3>
          </div>
          <div className="pro-donations">
            {recentLogs.map((d, i) => (
              <div className="pro-donation-item" key={i}>
                <div>
                  <p className="pro-donation-name">{d.name}</p>
                  <p className="pro-donation-sub">{d.sub}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="pro-donation-value">{d.value}</p>
                  <span className="pro-donation-tag" style={{ color: d.tagColor, background: d.tagBg }}>{d.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </OICLayout>
  );
}

export default OICDashboard;