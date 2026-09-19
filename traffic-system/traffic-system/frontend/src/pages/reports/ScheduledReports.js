import React from "react";
import { FiRotateCw } from "react-icons/fi";
import { reportStyles } from "./reportStyles";

function ScheduledReports({
  autoAccidentsEnabled, setAutoAccidentsEnabled,
  autoViolationsEnabled, setAutoViolationsEnabled,
  runningReportId, handleRunMonthlyReport,
  archive, openModalForReport
}) {

  // Dynamic countdown calculation
  const today = new Date();
  const nextRun = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const diffTime = nextRun - today;
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const percentage = ((daysInCurrentMonth - daysRemaining) / daysInCurrentMonth) * 100;
  // Circumference for r=15.9155 is 100.
  const dashArray = `${percentage}, 100`;

  const nextRunFormatted = nextRun.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });
  
  // Find last run date by taking current month's 1st day
  const lastRun = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastRunFormatted = lastRun.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });

  // Get last auto reports from archive if any
  const lastAccidentReport = archive.find(r => r.type === "AUTO" && r.category === "Accidents") || archive[0];
  const lastViolationReport = archive.find(r => r.type === "AUTO" && r.category === "Violations") || archive[0];

  return (
    <div>
      {/* SECTION 1: COMPULSORY MONTHLY REPORTS */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h2 style={reportStyles.sectionTitle}>
              Compulsory Monthly Reports
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
              Auto-generated on the 1st of every month. Shows Vehicle × Accident/Violation type matrix.
            </p>
          </div>
          <span style={{
            padding: "6px 14px",
            borderRadius: "20px",
            border: "1px solid #10b981",
            backgroundColor: "#ecfdf5",
            color: "#059669",
            fontSize: "12px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 6
          }}>
            <FiRotateCw size={13} /> Next auto-run: {nextRunFormatted}
          </span>
        </div>

        {/* TWO CARDS SIDE BY SIDE */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Monthly Accident Report Card */}
          <div style={{ ...reportStyles.card, position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ backgroundColor: "#fee2e2", color: "#dc2626", fontSize: "11px", fontWeight: 800, padding: "3px 10px", borderRadius: "12px" }}>
                ● ACCIDENTS
              </span>
              {/* SVG Countdown ring */}
              <div style={{ width: 44, height: 44, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="44" height="44" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#2563eb" strokeWidth="3" strokeDasharray={dashArray} />
                </svg>
                <span style={{ position: "absolute", fontSize: "11px", fontWeight: 800, color: "#1e293b" }}>{daysRemaining}d</span>
              </div>
            </div>

            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "10px 0 2px 0" }}>Monthly Accident Report</h3>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Monthly · Vehicles × Accident Types</p>

            <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 16, paddingTop: 14, display: "flex", gap: 20, fontSize: 12 }}>
              <div><span style={{ color: "#94a3b8", display: "block", fontSize: 10, fontWeight: 700 }}>LAST RUN</span><strong style={{ color: "#334155" }}>{lastRunFormatted}</strong></div>
              <div><span style={{ color: "#94a3b8", display: "block", fontSize: 10, fontWeight: 700 }}>NEXT RUN</span><strong style={{ color: "#334155" }}>{nextRunFormatted}</strong></div>
              <div><span style={{ color: "#94a3b8", display: "block", fontSize: 10, fontWeight: 700 }}>STATUS</span><span style={{ color: "#16a34a", fontWeight: 700 }}>● Completed</span></div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#475569" }}>
                <input
                  type="checkbox"
                  checked={autoAccidentsEnabled}
                  onChange={e => setAutoAccidentsEnabled(e.target.checked)}
                  style={{ accentColor: "#2563eb", width: 16, height: 16 }}
                />
                Auto-enabled
              </label>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleRunMonthlyReport("accidents")}
                  disabled={runningReportId === "accidents"}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    color: "#1e293b",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {runningReportId === "accidents" ? "⏳ Running..." : "▶ Run Now"}
                </button>
                <button
                  onClick={() => openModalForReport(lastAccidentReport)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#1E2A3B",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  View Last
                </button>
              </div>
            </div>
          </div>

          {/* Monthly Violation Report Card */}
          <div style={{ ...reportStyles.card, position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ backgroundColor: "#dbeafe", color: "#2563eb", fontSize: "11px", fontWeight: 800, padding: "3px 10px", borderRadius: "12px" }}>
                ● VIOLATIONS
              </span>
              {/* SVG Countdown ring */}
              <div style={{ width: 44, height: 44, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="44" height="44" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#2563eb" strokeWidth="3" strokeDasharray={dashArray} />
                </svg>
                <span style={{ position: "absolute", fontSize: "11px", fontWeight: 800, color: "#1e293b" }}>{daysRemaining}d</span>
              </div>
            </div>

            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "10px 0 2px 0" }}>Monthly Violation Report</h3>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Monthly · Vehicles × Violation Types</p>

            <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 16, paddingTop: 14, display: "flex", gap: 20, fontSize: 12 }}>
              <div><span style={{ color: "#94a3b8", display: "block", fontSize: 10, fontWeight: 700 }}>LAST RUN</span><strong style={{ color: "#334155" }}>{lastRunFormatted}</strong></div>
              <div><span style={{ color: "#94a3b8", display: "block", fontSize: 10, fontWeight: 700 }}>NEXT RUN</span><strong style={{ color: "#334155" }}>{nextRunFormatted}</strong></div>
              <div><span style={{ color: "#94a3b8", display: "block", fontSize: 10, fontWeight: 700 }}>STATUS</span><span style={{ color: "#16a34a", fontWeight: 700 }}>● Completed</span></div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#475569" }}>
                <input
                  type="checkbox"
                  checked={autoViolationsEnabled}
                  onChange={e => setAutoViolationsEnabled(e.target.checked)}
                  style={{ accentColor: "#2563eb", width: 16, height: 16 }}
                />
                Auto-enabled
              </label>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleRunMonthlyReport("violations")}
                  disabled={runningReportId === "violations"}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    color: "#1e293b",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {runningReportId === "violations" ? "⏳ Running..." : "▶ Run Now"}
                </button>
                <button
                  onClick={() => openModalForReport(lastViolationReport)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#1E2A3B",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  View Last
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScheduledReports;
