import React, { useState, useEffect } from "react";
import OICLayout from "../layouts/OICLayout";
import { FiAlertTriangle, FiAlertCircle, FiCalendar, FiCheckSquare, FiFileText, FiUserCheck, FiTruck } from "react-icons/fi";
import { getAccidents, getViolations } from "../api";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const pendingVerifications = [
  {
    id: 1,
    icon: <FiAlertTriangle size={18} color="#dc2626" />,
    iconBg: "#fee2e2",
    badge: "Accident Reported (2)",
    badgeColor: "#dc2626",
    badgeBg: "#fee2e2",
    code: "#ACD-2024-0089",
    title: "Major Collision - Negombo Junction Circle",
    sub: "Log submitted by Sgt. Karunaratne",
    time: "12 mins ago",
    status: "High Priority",
    statusColor: "#dc2626",
  },
  {
    id: 2,
    icon: <FiFileText size={18} color="#2563eb" />,
    iconBg: "#dbeafe",
    badge: "Violation Reported (5)",
    badgeColor: "#2563eb",
    badgeBg: "#dbeafe",
    code: "#TOR-5582",
    title: "Overspeeding - Colombo Road (Zone 4)",
    sub: "Detected by Automated Speed Cam #04",
    time: "45 mins ago",
    status: "Standard Review",
    statusColor: "#64748b",
  },
  {
    id: 3,
    icon: <FiUserCheck size={18} color="#4f46e5" />,
    iconBg: "#e0e7ff",
    badge: "Officer Approval Pending",
    badgeColor: "#4f46e5",
    badgeBg: "#e0e7ff",
    code: "#OFF-9902",
    title: "Leave Request: Cst. Kumara (Medical)",
    sub: "Shift: Afternoon | Date: Tomorrow",
    time: "1 hour ago",
    status: "HR Action Required",
    statusColor: "#64748b",
  },
  {
    id: 4,
    icon: <FiTruck size={18} color="#475569" />,
    iconBg: "#f1f5f9",
    badge: "Vehicle Approval Pending",
    badgeColor: "#475569",
    badgeBg: "#e2e8f0",
    code: "#LOG-3321",
    title: "Heavy Vehicle Entry - Coastal Belt (Z-1)",
    sub: "Carrier: Lanka Logistics Ltd. | T-Permit Req.",
    time: "2 hours ago",
    status: "Transit Review",
    statusColor: "#64748b",
  },
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
      <div className="pro-stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
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

        {/* Pending Verifications */}
        <div className="pro-dash-card">
          <div className="pending-verif-header">
            <div className="pending-verif-title-wrap">
              <FiCheckSquare size={18} color="#1e3a5f" />
              <h3 className="pending-verif-title">Pending Verifications</h3>
            </div>
            <a href="#/tasks" onClick={(e) => e.preventDefault()} className="pending-verif-view-all">View All Tasks</a>
          </div>
          <div className="pending-verif-list">
            {pendingVerifications.map((item) => (
              <div className="pending-verif-item" key={item.id}>
                <div className="pending-verif-icon-box" style={{ background: item.iconBg }}>
                  {item.icon}
                </div>
                <div className="pending-verif-body">
                  <div className="pending-verif-meta-row">
                    <span className="pending-verif-badge" style={{ color: item.badgeColor, background: item.badgeBg }}>
                      {item.badge}
                    </span>
                    <span className="pending-verif-code">{item.code}</span>
                  </div>
                  <h4 className="pending-verif-item-title">{item.title}</h4>
                  <p className="pending-verif-item-sub">{item.sub}</p>
                </div>
                <div className="pending-verif-right">
                  <span className="pending-verif-time">{item.time}</span>
                  <span className="pending-verif-status" style={{ color: item.statusColor }}>
                    {item.status}
                  </span>
                </div>
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