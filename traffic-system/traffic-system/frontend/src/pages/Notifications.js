import React, { useState } from "react";
import OICLayout from "../layouts/OICLayout";
 

const initialNotifications = [
  {
    id: 1,
    title: "System Maintenance",
    desc: "",
    time: "2 days ago",
    read: false,
    type: "system",
  },
  {
    id: 2,
    title: "Shift Update",
    desc: "Duty roster for next week has been published.",
    time: "2 hours ago",
    read: true,
    type: "shift",
  },
  {
    id: 3,
    title: "Emergency Alert",
    desc: "",
    time: "15 min ago",
    read: true,
    type: "emergency",
  },
];

const typeColor = (type) => {
  if (type === "emergency") return "#ef4444";
  if (type === "system")    return "#3b82f6";
  if (type === "shift")     return "#f59e0b";
  return "#64748b";
};

function Notifications() {
  const [notifications, setNotifications] = useState(initialNotifications);

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
    <OICLayout>
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
                <span style={{ fontSize: "20px" }}>{n.icon}</span>
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
    </OICLayout>
  );
}

export default Notifications;