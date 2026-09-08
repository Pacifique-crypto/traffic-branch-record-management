import React from "react";
import OICLayout from "../layouts/OICLayout";
import { FiClock, FiInfo } from "react-icons/fi";

function LeaveManagement() {
  return (
    <OICLayout>
      <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          backgroundColor: "#ffffff",
          padding: "20px 24px",
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          border: "1px solid #e2e8f0"
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            backgroundColor: "#eff6ff",
            color: "#2563eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <FiClock size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Leave Management</h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
              Traffic Officer leave applications, approvals, and rest schedules.
            </p>
          </div>
        </div>

        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: 12,
          padding: 40,
          textAlign: "center",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        }}>
          <FiInfo size={44} color="#2563eb" style={{ marginBottom: 12 }} />
          <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#1e293b", fontWeight: 700 }}>Leave Management Section Ready</h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
            The Leave Management navigation link has been successfully integrated into the OIC navigation bar.
          </p>
        </div>
      </div>
    </OICLayout>
  );
}

export default LeaveManagement;
