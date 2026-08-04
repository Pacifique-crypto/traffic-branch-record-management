import React, { useState, useEffect } from "react";
import OICLayout from "../layouts/OICLayout";
import ITLayout from "../layouts/ITLayout";
import { getOfficers } from "../api";

const initialNotifications = [
  {
    id: 1,
    title: "System Maintenance",
    desc: "Routine server backup completed.",
    time: "2 days ago",
    read: false,
    type: "system",
    icon: "⚙️"
  },
  {
    id: 2,
    title: "Shift Update",
    desc: "Duty roster for next week has been published.",
    time: "2 hours ago",
    read: true,
    type: "shift",
    icon: "📅"
  },
];

const typeColor = (type) => {
  if (type === "emergency" || type === "rejection") return "#ef4444";
  if (type === "system")    return "#3b82f6";
  if (type === "shift")     return "#f59e0b";
  return "#64748b";
};

function Notifications() {
  const userRole = localStorage.getItem("userRole") || "IT Officer";
  const LayoutComponent = userRole === "OIC" ? OICLayout : ITLayout;

  const [notifications, setNotifications] = useState(initialNotifications);

  useEffect(() => {
    const fetchRejectionNotifs = async () => {
      try {
        const offs = await getOfficers();
        if (Array.isArray(offs)) {
          const rejected = offs.filter(o => o.status === "Rejected");
          const rejectedNotifs = rejected.map(r => ({
            id: `rej-${r._id || r.id}`,
            title: `Officer Registration Rejected: ${r.fullName}`,
            desc: `OIC Remarks: "${r.rejectionRemarks || "No reason specified"}" (Username: ${r.username || r.policeId})`,
            time: r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : "Recently",
            read: false,
            type: "rejection",
            icon: "⚠️"
          }));
          setNotifications(prev => [...rejectedNotifs, ...initialNotifications]);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    };
    fetchRejectionNotifs();
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id) => {
    setNotifications(notifications.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const dismiss = (id) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  return (
    <LayoutComponent>
      <div className="page-box">
        <div className="notif-header-row">
          <h2 className="page-heading" style={{ marginBottom: 0 }}>Notifications</h2>
          {unread > 0 && (
            <button className="btn-mark-all" onClick={markAllRead}>
              Mark all as read
            </button>
          )}
        </div>

        {/* Unread badge */}
        {unread > 0 && (
          <div className="notif-unread-banner">
            {unread} unread notification{unread > 1 ? "s" : ""}
          </div>
        )}

        {/* Notification list */}
        <div className="notif-list">
          {notifications.length === 0 && (
            <div className="notif-empty">
              <span style={{ fontSize: "36px" }}>🔔</span>
              <p>No notifications</p>
            </div>
          )}

          {notifications.map((n) => (
            <div
              key={n.id}
              className={`notif-item ${!n.read ? "notif-unread" : ""}`}
              onClick={() => markRead(n.id)}
            >
              {/* Left border accent */}
              <div className="notif-accent" style={{ background: typeColor(n.type) }} />

              {/* Icon */}
              <div className="notif-icon-wrap" style={{ background: `${typeColor(n.type)}18` }}>
                <span style={{ fontSize: "20px" }}>{n.icon || "🔔"}</span>
              </div>

              {/* Content */}
              <div className="notif-body">
                <div className="notif-top-row">
                  <p className="notif-title">{n.title}</p>
                  <span className="notif-time">{n.time}</span>
                </div>
                {n.desc && <p className="notif-desc">{n.desc}</p>}
              </div>

              {/* Unread dot */}
              {!n.read && <span className="notif-dot" />}

              {/* Dismiss */}
              <button
                className="notif-dismiss"
                onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </LayoutComponent>
  );
}

export default Notifications;