import React from "react";
import { FiCalendar, FiClock } from "react-icons/fi";

export default function DutyRoster() {
  return (
    <div style={{
      maxWidth: "800px",
      margin: "40px auto",
      padding: "48px 24px",
      backgroundColor: "#ffffff",
      borderRadius: "16px",
      boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.08)",
      border: "1px solid #e2e8f0",
      textAlign: "center"
    }}>
      <div style={{
        width: "72px",
        height: "72px",
        borderRadius: "50%",
        backgroundColor: "#eff6ff",
        color: "#2563eb",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "20px"
      }}>
        <FiCalendar size={36} />
      </div>

      <h2 style={{
        fontSize: "24px",
        fontWeight: "800",
        color: "#0f172a",
        marginBottom: "10px",
        letterSpacing: "-0.5px"
      }}>
        Duty Roster Management
      </h2>

      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        backgroundColor: "#f1f5f9",
        color: "#475569",
        padding: "6px 14px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: "600",
        marginBottom: "16px"
      }}>
        <FiClock size={14} />
        <span>Module under development</span>
      </div>

      <p style={{
        fontSize: "14px",
        color: "#64748b",
        maxWidth: "480px",
        margin: "0 auto",
        lineHeight: "1.6"
      }}>
        The Duty Roster module is currently being reconstructed. Full scheduling and roster management features will be available in an upcoming release.
      </p>
    </div>
  );
}