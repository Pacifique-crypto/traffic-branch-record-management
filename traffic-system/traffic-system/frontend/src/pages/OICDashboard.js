import React, { useState, useEffect } from "react";
import OICLayout from "../layouts/OICLayout";
import { FiAlertTriangle, FiAlertCircle, FiCalendar, FiCheckSquare, FiFileText, FiUserCheck, FiTruck } from "react-icons/fi";
import { getAccidents, getViolations, getOfficers, getVehicles } from "../api";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const timeAgo = (dateStr) => {
  if (!dateStr) return "Just now";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Just now";
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

function OICDashboard() {
  const officer = JSON.parse(localStorage.getItem("officer") || "{}");
  const name    = officer.name || "PS Perera";

  const [accidentsCount, setAccidentsCount] = useState(0);
  const [violationsCount, setViolationsCount] = useState(0);
  const [recentLogs, setRecentLogs]           = useState([]);
  const [loading, setLoading]                 = useState(true);

  // Live counts for pending approvals
  const [pendingAccCount, setPendingAccCount]   = useState(0);
  const [pendingViolCount, setPendingViolCount] = useState(0);
  const [pendingOffCount, setPendingOffCount]   = useState(0);
  const [pendingVehCount, setPendingVehCount]   = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        // Fetch in parallel
        const [accs, viols, officers, vehicles] = await Promise.all([
          getAccidents().catch(() => []),
          getViolations().catch(() => []),
          getOfficers().catch(() => []),
          getVehicles().catch(() => [])
        ]);

        setAccidentsCount(accs.length || 0);
        setViolationsCount(viols.length || 0);

        // Calculate pending verification counts
        const pendingAcc = (accs || []).filter(a => a.status && a.status.toLowerCase() === "pending").length;
        const pendingViol = (viols || []).filter(v => v.status && v.status.toLowerCase() === "pending").length;
        const pendingOff = (officers || []).filter(o => o.status && o.status.toLowerCase() === "pending").length;
        const pendingVeh = (vehicles || []).filter(vh => vh.status && vh.status.toLowerCase() === "pending").length;

        setPendingAccCount(pendingAcc);
        setPendingViolCount(pendingViol);
        setPendingOffCount(pendingOff);
        setPendingVehCount(pendingVeh);

        // Compile Individual Recent Activities for the Activity Log
        const activities = [];

        // 1. Accidents
        (accs || []).forEach(a => {
          const date = new Date(a.createdAt || a.accidentDate || 0);
          activities.push({
            id: `acc-${a.id || a._id}`,
            icon: <FiAlertTriangle size={18} color="#dc2626" />,
            iconBg: "#fee2e2",
            badge: "Accident Reported",
            badgeColor: "#dc2626",
            badgeBg: "#fee2e2",
            code: a.referenceNumber || `#ACD-${(a.id || a._id || "").slice(-4).toUpperCase()}`,
            title: a.location || "Collision",
            sub: `Log submitted by ${a.submittingOfficer || a.assistantOfficer || "Traffic Officer"}`,
            time: timeAgo(a.createdAt || a.accidentDate),
            date: date,
            status: a.severity || "MINOR",
            statusColor: a.severity === "FATAL" ? "#dc2626" : "#2563eb",
          });
        });

        // 2. Violations
        (viols || []).forEach(v => {
          const date = new Date(v.createdAt || v.violationDate || 0);
          activities.push({
            id: `viol-${v.id || v._id}`,
            icon: <FiFileText size={18} color="#2563eb" />,
            iconBg: "#dbeafe",
            badge: "Violation Reported",
            badgeColor: "#2563eb",
            badgeBg: "#dbeafe",
            code: v.id ? `#TOR-${v.id.slice(-4).toUpperCase()}` : "#TOR-NEW",
            title: v.violationType || v.offence || "Traffic Offence",
            sub: `Submitted by ${v.submittingOfficer || "Traffic Officer"}`,
            time: timeAgo(v.createdAt || v.violationDate),
            date: date,
            status: "Standard Review",
            statusColor: "#64748b",
          });
        });

        // 3. Officers
        (officers || []).forEach(o => {
          const date = new Date(o.createdAt || 0);
          activities.push({
            id: `off-${o.id || o._id}`,
            icon: <FiUserCheck size={18} color="#4f46e5" />,
            iconBg: "#e0e7ff",
            badge: "Officer Approval Pending",
            badgeColor: "#4f46e5",
            badgeBg: "#e0e7ff",
            code: `#OFF-${o.policeId || "NEW"}`,
            title: `Register Request: ${o.fullName}`,
            sub: `NIC: ${o.nic} | Rank: ${o.rank || "Constable"}`,
            time: timeAgo(o.createdAt),
            date: date,
            status: "HR Action Required",
            statusColor: "#64748b",
          });
        });

        // Sort all individual activities by date desc
        activities.sort((a, b) => b.date - a.date);
        setRecentLogs(activities.slice(0, 5)); // Show latest 5 activities!

      } catch (err) {
        console.error("Failed to load OIC dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  // Summarized Pending verifications layout
  const pendingVerifications = [
    {
      id: 1,
      icon: <FiAlertTriangle size={18} color="#dc2626" />,
      iconBg: "#fee2e2",
      badge: "Accidents Pending",
      badgeColor: "#dc2626",
      badgeBg: "#fee2e2",
      title: "Accidents Awaiting OIC Review",
      sub: "Verify and sign off on recent collisions",
      count: pendingAccCount,
      circleBg: "#dc2626",
      status: "High Priority",
      statusColor: "#dc2626",
    },
    {
      id: 2,
      icon: <FiFileText size={18} color="#2563eb" />,
      iconBg: "#dbeafe",
      badge: "Violations Pending",
      badgeColor: "#2563eb",
      badgeBg: "#dbeafe",
      title: "Traffic Fines Awaiting Verification",
      sub: "Review submitted offences and authorize fines",
      count: pendingViolCount,
      circleBg: "#2563eb",
      status: "Standard Review",
      statusColor: "#64748b",
    },
    {
      id: 3,
      icon: <FiUserCheck size={18} color="#4f46e5" />,
      iconBg: "#e0e7ff",
      badge: "Officers Pending",
      badgeColor: "#4f46e5",
      badgeBg: "#e0e7ff",
      title: "Officer Registration Requests",
      sub: "Approve new traffic officers to access system",
      count: pendingOffCount,
      circleBg: "#4f46e5",
      status: "HR Action Required",
      statusColor: "#64748b",
    },
    {
      id: 4,
      icon: <FiTruck size={18} color="#475569" />,
      iconBg: "#f1f5f9",
      badge: "Vehicles Pending",
      badgeColor: "#475569",
      badgeBg: "#e2e8f0",
      title: "Police Vehicle Registrations",
      sub: "Verify department vehicle status and assignments",
      count: pendingVehCount,
      circleBg: "#475569",
      status: "Transit Review",
      statusColor: "#64748b",
    }
  ];

  const totalPendingCount = pendingAccCount + pendingViolCount + pendingOffCount + pendingVehCount;

  const stats = [
    { icon: <FiAlertTriangle size={24} />, value: accidentsCount, label: "Active\nAccidents",  bg: "#dbeafe", iconBg: "#bfdbfe", iconColor: "#2563eb" },
    { icon: <FiAlertCircle  size={24} />, value: violationsCount, label: "Active\nViolations", bg: "#dcfce7", iconBg: "#bbf7d0", iconColor: "#16a34a" },
    { icon: <FiCalendar     size={24} />, value: totalPendingCount, label: "Pending\nApprovals", bg: "#f3e8ff", iconBg: "#e9d5ff", iconColor: "#7c3aed" },
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

        {/* Summarized Pending Verifications on the Left */}
        <div className="pro-dash-card">
          <div className="pending-verif-header">
            <div className="pending-verif-title-wrap">
              <FiCheckSquare size={18} color="#1e3a5f" />
              <h3 className="pending-verif-title">Pending Verifications</h3>
            </div>
            <a href="#/tasks" onClick={(e) => e.preventDefault()} className="pending-verif-view-all">View Summary</a>
          </div>
          <div className="pending-verif-list">
            {loading ? (
              <p style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>Loading verifications...</p>
            ) : (
              pendingVerifications.map((item) => (
                <div className="pending-verif-item" key={item.id}>
                  <div className="pending-verif-icon-box" style={{ background: item.iconBg }}>
                    {item.icon}
                  </div>
                  <div className="pending-verif-body">
                    <div className="pending-verif-meta-row">
                      <span className="pending-verif-badge" style={{ color: item.badgeColor, background: item.badgeBg }}>
                        {item.badge}
                      </span>
                    </div>
                    <h4 className="pending-verif-item-title">{item.title}</h4>
                    <p className="pending-verif-item-sub">{item.sub}</p>
                  </div>
                  <div className="pending-verif-right" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: item.circleBg,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: "bold",
                      marginBottom: 4
                    }}>
                      {item.count}
                    </div>
                    <span className="pending-verif-status" style={{ color: item.statusColor, fontSize: 10, margin: 0 }}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detailed Live Recent Activity Log on the Right */}
        <div className="pro-dash-card">
          <div className="pending-verif-header">
            <div className="pending-verif-title-wrap">
              <span style={{ fontSize: 16 }}>📋</span>
              <h3 className="pending-verif-title">Recent Activity Log</h3>
            </div>
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Live Feed</span>
          </div>
          <div className="pending-verif-list">
            {loading ? (
              <p style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>Loading activity...</p>
            ) : recentLogs.length === 0 ? (
              <p style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>No recent activity logged.</p>
            ) : (
              recentLogs.map((item) => (
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
              ))
            )}
          </div>
        </div>

      </div>
    </OICLayout>
  );
}

export default OICDashboard;