import React from "react";
import { FiCheckCircle } from "react-icons/fi";
import {
  vehicleList,
  accidentSeverityOptions,
  accidentCauseOptions,
  violationActionOptions,
  violationCauseOptions
} from "./mockData";
import { reportStyles } from "./reportStyles";

function CustomReportForm({
  customCategory, setCustomCategory,
  customDatePreset, handleCustomPresetChange,
  customFromDate, setCustomFromDate,
  customToDate, setCustomToDate,
  accidentSeverities, setAccidentSeverities,
  accidentCauses, setAccidentCauses,
  violationActions, setViolationActions,
  violationCauses, setViolationCauses,
  selectedVehicles, toggleVehicle, toggleAllVehicles,
  toggleAllAccidentTypes, toggleAllViolationTypes,
  handleGenerateCustomReport, isCustomGenerating, reportGeneratedSuccess,
  officerName
}) {

  return (
    <div style={{ ...reportStyles.card, padding: 26, marginBottom: 28 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
        Request a Custom Report
      </h2>
      <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px 0" }}>
        Choose category, date range, accident/violation types, and vehicle types. Report shows the same vehicle × type matrix.
      </p>

      {/* 3-COLUMN PARAMETER SELECTION */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Category Selection */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 8, letterSpacing: "0.5px" }}>CATEGORY</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { id: "accidents", label: "Accidents", color: "#ef4444", bg: "#fef2f2" },
              { id: "violations", label: "Violations", color: "#2563eb", bg: "#eff6ff" },
              { id: "both", label: "Both", color: "#8b5cf6", bg: "#f5f3ff" }
            ].map(cat => (
              <div
                key={cat.id}
                onClick={() => setCustomCategory(cat.id)}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1.5px solid",
                  borderColor: customCategory === cat.id ? cat.color : "#e2e8f0",
                  backgroundColor: customCategory === cat.id ? cat.bg : "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10
                }}
              >
                <input
                  type="radio"
                  name="customCategory"
                  checked={customCategory === cat.id}
                  onChange={() => setCustomCategory(cat.id)}
                  style={{ accentColor: cat.color }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: customCategory === cat.id ? cat.color : "#334155" }}>
                  {cat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Date Preset Selection */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 8, letterSpacing: "0.5px" }}>DATE PRESET</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["Last 7 days", "Last 2 weeks", "Last 30 days", "Last 90 days", "Custom range"].map(preset => (
              <button
                key={preset}
                onClick={() => handleCustomPresetChange(preset)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "6px",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  backgroundColor: customDatePreset === preset ? "#1E2A3B" : "#f1f5f9",
                  color: customDatePreset === preset ? "#ffffff" : "#475569",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                {preset}
                {preset === "Last 2 weeks" && (
                  <span style={{ backgroundColor: "#ef4444", color: "#ffffff", fontSize: "9px", fontWeight: 800, padding: "1px 5px", borderRadius: "10px" }}>POPULAR</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range Inputs */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 8, letterSpacing: "0.5px" }}>DATE RANGE</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div>
              <span style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 2 }}>From</span>
              <input
                type="text"
                value={customFromDate}
                onChange={e => setCustomFromDate(e.target.value)}
                placeholder="MM/DD/YYYY"
                style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", width: "100%", outline: "none", fontWeight: 600 }}
              />
            </div>
            <div>
              <span style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 2 }}>To</span>
              <input
                type="text"
                value={customToDate}
                onChange={e => setCustomToDate(e.target.value)}
                placeholder="MM/DD/YYYY"
                style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", width: "100%", outline: "none", fontWeight: 600 }}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 20, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: customCategory === "both" ? "1fr 1fr 1fr" : "1fr 1fr", gap: 24 }}>

          {/* ACCIDENT TYPES & CAUSES FILTER */}
          {(customCategory === "accidents" || customCategory === "both") && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#ef4444", margin: 0, letterSpacing: "0.5px" }}>
                  ● ACCIDENT TYPES
                </label>
                <button
                  onClick={toggleAllAccidentTypes}
                  style={{ background: "none", border: "none", color: "#ef4444", fontSize: "11px", fontWeight: 700, cursor: "pointer", padding: 0 }}
                >
                  {accidentSeverities.length === accidentSeverityOptions.length && accidentCauses.length === accidentCauseOptions.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              {/* Severity Sub-header & List */}
              <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: "0 0 6px 0" }}>SEVERITY</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                {accidentSeverityOptions.map(sev => (
                  <label key={sev} style={{ fontSize: 12, color: "#334155", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={accidentSeverities.includes(sev)}
                      onChange={e => {
                        if (e.target.checked) setAccidentSeverities([...accidentSeverities, sev]);
                        else setAccidentSeverities(accidentSeverities.filter(s => s !== sev));
                      }}
                      style={{ accentColor: "#ef4444", width: 15, height: 15 }}
                    />
                    {sev}
                  </label>
                ))}
              </div>

              {/* Cause Sub-header & List */}
              <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: "0 0 6px 0" }}>CAUSE OF ACCIDENT</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {accidentCauseOptions.map(cause => (
                  <label key={cause} style={{ fontSize: 12, color: "#334155", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={accidentCauses.includes(cause)}
                      onChange={e => {
                        if (e.target.checked) setAccidentCauses([...accidentCauses, cause]);
                        else setAccidentCauses(accidentCauses.filter(c => c !== cause));
                      }}
                      style={{ accentColor: "#ef4444", width: 15, height: 15 }}
                    />
                    {cause}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* VIOLATION TYPES & CAUSES FILTER */}
          {(customCategory === "violations" || customCategory === "both") && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#2563eb", margin: 0, letterSpacing: "0.5px" }}>
                  ● VIOLATION TYPES
                </label>
                <button
                  onClick={toggleAllViolationTypes}
                  style={{ background: "none", border: "none", color: "#2563eb", fontSize: "11px", fontWeight: 700, cursor: "pointer", padding: 0 }}
                >
                  {violationActions.length === violationActionOptions.length && violationCauses.length === violationCauseOptions.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              {/* Action Sub-header & List */}
              <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: "0 0 6px 0" }}>ACTION TYPE</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                {violationActionOptions.map(act => (
                  <label key={act} style={{ fontSize: 12, color: "#334155", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={violationActions.includes(act)}
                      onChange={e => {
                        if (e.target.checked) setViolationActions([...violationActions, act]);
                        else setViolationActions(violationActions.filter(a => a !== act));
                      }}
                      style={{ accentColor: "#2563eb", width: 15, height: 15 }}
                    />
                    {act}
                  </label>
                ))}
              </div>

              {/* Cause Sub-header & List */}
              <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: "0 0 6px 0" }}>VIOLATION CAUSE</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {violationCauseOptions.map(cause => (
                  <label key={cause} style={{ fontSize: 12, color: "#334155", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={violationCauses.includes(cause)}
                      onChange={e => {
                        if (e.target.checked) setViolationCauses([...violationCauses, cause]);
                        else setViolationCauses(violationCauses.filter(c => c !== cause));
                      }}
                      style={{ accentColor: "#2563eb", width: 15, height: 15 }}
                    />
                    {cause}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* VEHICLE TYPES FILTER */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "0.5px" }}>
                VEHICLE TYPES
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700 }}>
                  {selectedVehicles.length}/{vehicleList.length} selected
                </span>
                <button
                  onClick={toggleAllVehicles}
                  style={{ background: "none", border: "none", color: "#2563eb", fontSize: "11px", fontWeight: 700, cursor: "pointer", padding: 0 }}
                >
                  {selectedVehicles.length === vehicleList.length ? "Deselect All" : "Select All"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {vehicleList.map(v => {
                const isChecked = selectedVehicles.includes(v.name);
                return (
                  <div
                    key={v.name}
                    onClick={() => toggleVehicle(v.name)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid",
                      borderColor: isChecked ? "#3b82f6" : "#cbd5e1",
                      backgroundColor: isChecked ? "#eff6ff" : "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: "12px",
                      color: isChecked ? "#1d4ed8" : "#475569",
                      fontWeight: isChecked ? 700 : 500
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by parent div onClick
                      style={{ accentColor: "#2563eb" }}
                    />
                    <span style={{ fontSize: 14 }}>{v.emoji}</span>
                    <span style={{ flex: 1 }}>{v.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY STRIP & GENERATE BUTTON */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, flexWrap: "wrap", gap: 16 }}>
        {/* Left summary pill */}
        <div style={{ fontSize: 12, color: "#475569" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: customCategory === "accidents" ? "#ef4444" : customCategory === "violations" ? "#2563eb" : "#8b5cf6" }} />
            <strong>
              {customCategory === "accidents" ? "Accidents" : customCategory === "violations" ? "Violations" : "Both"} - {customDatePreset} - {selectedVehicles.length} vehicle types
            </strong>
          </div>
          <p style={{ margin: "2px 0 0 16px", color: "#94a3b8", fontSize: 11 }}>
            {customFromDate} — {customToDate} · {officerName}
          </p>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerateCustomReport}
          disabled={isCustomGenerating}
          style={{
            padding: "12px 28px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: reportGeneratedSuccess ? "#16a34a" : "#1E2A3B",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            transition: "all 0.2s ease"
          }}
        >
          {isCustomGenerating ? (
            <>⏳ Generating...</>
          ) : reportGeneratedSuccess ? (
            <>✓ Report Ready</>
          ) : (
            <>I Generate Report</>
          )}
        </button>
      </div>

      {/* SUCCESS NOTIFICATION BANNER */}
      {reportGeneratedSuccess && (
        <div style={{
          backgroundColor: "#ecfdf5",
          border: "1px solid #a7f3d0",
          borderRadius: "8px",
          padding: "12px 18px",
          marginTop: 16,
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "#047857",
          fontSize: "12px",
          fontWeight: 600
        }}>
          <FiCheckCircle size={16} color="#059669" />
          <span>Report generated. Find it in the archive below — click <strong>View</strong> to open the matrix table.</span>
        </div>
      )}
    </div>
  );
}

export default CustomReportForm;
