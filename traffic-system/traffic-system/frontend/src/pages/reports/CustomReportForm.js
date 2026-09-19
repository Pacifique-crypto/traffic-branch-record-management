import React from "react";
import { FiCheck } from "react-icons/fi";
import { vehicleList } from "./mockData";
import { reportStyles } from "./reportStyles";

function CustomReportForm({
  customCategory, setCustomCategory,
  customDatePreset, handleCustomPresetChange,
  customFromDate, setCustomFromDate,
  customToDate, setCustomToDate,
  accidentSeverities, setAccidentSeverities,
  violationActions, setViolationActions,
  selectedVehicles, toggleVehicle, toggleAllVehicles,
  handleGenerateCustomReport, isCustomGenerating
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
              { id: "both", label: "Both (Summary)", color: "#8b5cf6", bg: "#f5f3ff" }
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
            {["Last 7 days", "Last 2 weeks", "Last 30 days", "Last 90 days", "Custom"].map(preset => (
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
            <input
              type="text"
              value={customFromDate}
              onChange={e => setCustomFromDate(e.target.value)}
              placeholder="From (MM/DD/YYYY)"
              style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", outline: "none", fontWeight: 600 }}
            />
            <input
              type="text"
              value={customToDate}
              onChange={e => setCustomToDate(e.target.value)}
              placeholder="To (MM/DD/YYYY)"
              style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", outline: "none", fontWeight: 600 }}
            />
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 20, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: customCategory === "both" ? "1fr 1fr 1fr" : "1fr 1fr", gap: 24 }}>

          {/* ACCIDENT TYPES FILTER */}
          {(customCategory === "accidents" || customCategory === "both") && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#ef4444", display: "block", marginBottom: 10, letterSpacing: "0.5px" }}>
                ● ACCIDENT TYPES & CAUSES
              </label>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: "0 0 6px 0" }}>SEVERITY</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                {["Deaths", "Major Injuries", "Minor Injuries", "Property Damage"].map(sev => (
                  <label key={sev} style={{ fontSize: 12, color: "#334155", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={accidentSeverities.includes(sev)}
                      onChange={e => {
                        if (e.target.checked) setAccidentSeverities([...accidentSeverities, sev]);
                        else setAccidentSeverities(accidentSeverities.filter(s => s !== sev));
                      }}
                      style={{ accentColor: "#ef4444" }}
                    />
                    {sev}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* VIOLATION TYPES FILTER */}
          {(customCategory === "violations" || customCategory === "both") && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#2563eb", display: "block", marginBottom: 10, letterSpacing: "0.5px" }}>
                ● VIOLATION TYPES & ACTIONS
              </label>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: "0 0 6px 0" }}>ACTION TYPE</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                {["Judicial Cases (Court)", "Fine-based Offences", "Warnings"].map(act => (
                  <label key={act} style={{ fontSize: 12, color: "#334155", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={violationActions.includes(act)}
                      onChange={e => {
                        if (e.target.checked) setViolationActions([...violationActions, act]);
                        else setViolationActions(violationActions.filter(a => a !== act));
                      }}
                      style={{ accentColor: "#2563eb" }}
                    />
                    {act}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* VEHICLE TYPES FILTER */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "0.5px" }}>
                VEHICLE TYPES ({selectedVehicles.length}/{vehicleList.length})
              </label>
              <button
                onClick={toggleAllVehicles}
                style={{ background: "none", border: "none", color: "#2563eb", fontSize: "11px", fontWeight: 700, cursor: "pointer", padding: 0 }}
              >
                {selectedVehicles.length === vehicleList.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {vehicleList.map(v => {
                const isChecked = selectedVehicles.includes(v.name);
                return (
                  <div
                    key={v.name}
                    onClick={() => toggleVehicle(v.name)}
                    style={{
                      padding: "7px 10px",
                      borderRadius: "6px",
                      border: "1px solid",
                      borderColor: isChecked ? "#3b82f6" : "#e2e8f0",
                      backgroundColor: isChecked ? "#eff6ff" : "#f8fafc",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: "12px",
                      color: isChecked ? "#1d4ed8" : "#475569",
                      fontWeight: isChecked ? 700 : 500
                    }}
                  >
                    <span>{v.emoji}</span>
                    <span style={{ flex: 1 }}>{v.name}</span>
                    {isChecked && <FiCheck size={14} color="#1d4ed8" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* GENERATE CUSTOM REPORT BUTTON */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleGenerateCustomReport}
          disabled={isCustomGenerating}
          style={{
            ...reportStyles.btnPrimary,
            padding: "12px 28px",
            fontSize: "14px",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 10
          }}
        >
          {isCustomGenerating ? (
            <>⏳ Compiling Matrix Report...</>
          ) : (
            <>📊 Generate Custom Report</>
          )}
        </button>
      </div>
    </div>
  );
}

export default CustomReportForm;
