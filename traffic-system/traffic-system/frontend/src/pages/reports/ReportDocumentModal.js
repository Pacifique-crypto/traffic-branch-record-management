import React from "react";
import { FiPrinter, FiDownload, FiX, FiShield } from "react-icons/fi";
import { mockAccidentMatrix, mockViolationMatrix } from "./mockData";

function ReportDocumentModal({
  isModalOpen, setIsModalOpen,
  activeModalReport, modalTab, setModalTab,
  handlePrint, handleExportPDF,
  officerName, badgeNo,
  fallbackFromDate, fallbackToDate
}) {
  if (!isModalOpen) return null;

  const report = activeModalReport || {};
  const filterData = report.filterData || {};
  
  // Selected vehicles (or default to all if not specified)
  const selectedVehicles = filterData.vehicles && filterData.vehicles.length > 0 
    ? filterData.vehicles 
    : ["Motor Car", "Van", "Bus", "Lorry", "Three-Wheeler", "Motorcycle", "Bicycle"];

  // Severities, causes, actions
  const selectedSeverities = filterData.severities || ["Deaths", "Major Injuries", "Minor Injuries", "Property Damage"];
  const selectedCauses = filterData.causes || [];
  const selectedActions = filterData.actions || ["Judicial Cases (Court)", "Fine-based Offences", "Warnings"];

  // Filter matrix rows based on filterData
  const accidentRows = mockAccidentMatrix.filter(row => {
    if (!filterData.severities || filterData.severities.length === 0) return true;
    return filterData.severities.includes(row.type);
  });

  const violationRows = mockViolationMatrix.filter(row => {
    if (!filterData.actions || filterData.actions.length === 0) return true; 
    return filterData.actions.includes(row.type);
  });

  // Calculate Column Totals for Accidents
  const accColTotals = {};
  selectedVehicles.forEach(v => accColTotals[v] = 0);
  let accGrandTotal = 0;
  accidentRows.forEach(row => {
    selectedVehicles.forEach(v => {
      const val = row[v] || 0;
      accColTotals[v] += val;
      accGrandTotal += val;
    });
  });

  // Calculate Column Totals for Violations
  const vioColTotals = {};
  selectedVehicles.forEach(v => vioColTotals[v] = 0);
  let vioGrandTotal = 0;
  violationRows.forEach(row => {
    selectedVehicles.forEach(v => {
      const val = row[v] || 0;
      vioColTotals[v] += val;
      vioGrandTotal += val;
    });
  });

  // Build Filter Summary Text
  const buildCategoriesSummary = () => {
    const isAccident = modalTab === "accidents";
    if (isAccident) {
      const types = [...selectedSeverities, ...selectedCauses];
      return `ACC. TYPES: ${types.length > 0 ? types.join(", ") : "All Accident Types"}`;
    } else {
      const types = [...selectedActions, ...selectedCauses];
      return `VIOL. TYPES: ${types.length > 0 ? types.join(", ") : "All Violation Types"}`;
    }
  };

  return (
    <div
      onClick={() => setIsModalOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto"
      }}
    >
      {/* MODAL TOP FIXED TOOLBAR */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: "#1E2A3B",
          color: "#ffffff",
          padding: "14px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 10000,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: "8px", backgroundColor: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontWeight: 800 }}>
            <FiShield size={18} style={{ margin: "auto" }} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
              {report.title || "Custom Summary Report"}
            </h3>
            <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0 0" }}>
              Generated: {report.generated || "Aug 26, 2026 22:45"} · By: {report.by || officerName} · Ref: {report.id || "RPT-NB-6512"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handlePrint}
            style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #475569", backgroundColor: "transparent", color: "#ffffff", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <FiPrinter size={14} /> Print
          </button>
          <button
            onClick={handleExportPDF}
            style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #475569", backgroundColor: "transparent", color: "#ffffff", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <FiDownload size={14} /> Export PDF
          </button>
          <button
            onClick={() => setIsModalOpen(false)}
            style={{ padding: "8px 16px", borderRadius: "6px", border: "none", backgroundColor: "#ef4444", color: "#ffffff", fontSize: "12px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <FiX size={16} /> Close
          </button>
        </div>
      </div>

      {/* MODAL PRINTABLE DOCUMENT CARD */}
      <div
        onClick={e => e.stopPropagation()}
        id="printable-report-document"
        style={{
          maxWidth: 960,
          width: "92%",
          margin: "30px auto 50px auto",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "40px 44px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
          color: "#0f172a"
        }}
      >
        {/* DOCUMENT HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, borderBottom: "2px solid #0f172a", paddingBottom: 16 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", letterSpacing: "0.8px" }}>
              SRI LANKA POLICE — TRAFFIC BRANCH, NEGOMBO DIVISION
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: "4px 0" }}>
              {report.title || "Custom Summary Report"}
            </h1>
            <p style={{ fontSize: 13, color: "#475569", margin: 0, fontWeight: 600 }}>
              Period: {report.period || `${fallbackFromDate} — ${fallbackToDate}`}
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "6px",
              border: "1.5px solid #10b981",
              backgroundColor: "#ecfdf5",
              color: "#047857",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.5px",
              marginBottom: 6
            }}>
              OFFICIAL DOCUMENT
            </div>
            <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0" }}>Generated: {report.generated || "Aug 26, 2026 22:45"}</p>
            <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0" }}>Officer: {report.by || officerName} · {badgeNo}</p>
            <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0", fontFamily: "monospace", fontWeight: 700 }}>Ref: {report.id || "RPT-NB-6512"}</p>
          </div>
        </div>

        {/* MODAL TABS FOR MULTI-CATEGORY REPORTS */}
        {(!report.category || report.category === "Both" || report.category === "both") && (
          <div style={{ display: "flex", gap: 16, borderBottom: "1px solid #e2e8f0", paddingBottom: 10, marginBottom: 16 }}>
            <button
              onClick={() => setModalTab("accidents")}
              style={{
                background: "none",
                border: "none",
                fontSize: "13px",
                fontWeight: 800,
                color: modalTab === "accidents" ? "#ef4444" : "#94a3b8",
                cursor: "pointer",
                borderBottom: modalTab === "accidents" ? "3px solid #ef4444" : "none",
                paddingBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#ef4444" }} /> Accidents Matrix
            </button>
            <button
              onClick={() => setModalTab("violations")}
              style={{
                background: "none",
                border: "none",
                fontSize: "13px",
                fontWeight: 800,
                color: modalTab === "violations" ? "#2563eb" : "#94a3b8",
                cursor: "pointer",
                borderBottom: modalTab === "violations" ? "3px solid #2563eb" : "none",
                paddingBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#2563eb" }} /> Violations Matrix
            </button>
          </div>
        )}

        {/* CATEGORIES & VEHICLES SUMMARY BLOCK */}
        <div style={{ backgroundColor: "#f8fafc", padding: "12px 16px", borderRadius: "8px", fontSize: 12, color: "#475569", marginBottom: 20, border: "1px solid #e2e8f0" }}>
          <p style={{ margin: "0 0 4px 0" }}>
            <strong>CATEGORIES:</strong> {buildCategoriesSummary()}
          </p>
          <p style={{ margin: 0 }}>
            <strong>VEHICLES:</strong> {selectedVehicles.join(", ")}
          </p>
        </div>

        {/* MATRIX TABLE: ACCIDENTS */}
        {modalTab === "accidents" && (
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 800, color: "#475569", letterSpacing: "0.5px", margin: "0 0 12px 0" }}>
              ACCIDENT SUMMARY — BY TYPE & VEHICLE
            </h4>
            {accidentRows.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", backgroundColor: "#f8fafc", borderRadius: 8, color: "#64748b" }}>
                No accident severities selected for this report.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#ffffff", borderBottom: "2px solid #e2e8f0", textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, color: "#475569" }}>OFFENCE / ACCIDENT TYPE</th>
                    {selectedVehicles.map(v => (
                      <th key={v} style={{ padding: "12px", textAlign: "center", fontSize: 11, color: "#475569" }}>{v.toUpperCase()}</th>
                    ))}
                    <th style={{ padding: "12px", textAlign: "center", fontSize: 11, color: "#ffffff", backgroundColor: "#1E2A3B" }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {accidentRows.map((row, idx) => {
                    const rowTotal = selectedVehicles.reduce((sum, v) => sum + (row[v] || 0), 0);
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 14px", fontWeight: 700, color: "#1e293b" }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: row.color, display: "inline-block", marginRight: 8 }} />
                          {row.type}
                        </td>
                        {selectedVehicles.map(v => (
                          <td key={v} style={{ padding: "12px", textAlign: "center", color: row[v] ? "#0f172a" : "#94a3b8" }}>
                            {row[v] ? row[v] : "—"}
                          </td>
                        ))}
                        <td style={{ padding: "12px", textAlign: "center", fontWeight: 800, backgroundColor: "#f8fafc" }}>{rowTotal}</td>
                      </tr>
                    );
                  })}
                  {/* GRAND TOTAL ROW */}
                  <tr style={{ backgroundColor: "#1E2A3B", color: "#ffffff", fontWeight: 800 }}>
                    <td style={{ padding: "14px", letterSpacing: "0.5px" }}>GRAND TOTAL</td>
                    {selectedVehicles.map(v => (
                      <td key={v} style={{ padding: "14px", textAlign: "center" }}>{accColTotals[v]}</td>
                    ))}
                    <td style={{ padding: "14px", textAlign: "center", fontSize: 14 }}>{accGrandTotal}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* MATRIX TABLE: VIOLATIONS */}
        {modalTab === "violations" && (
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 800, color: "#475569", letterSpacing: "0.5px", margin: "0 0 12px 0" }}>
              VIOLATION SUMMARY — BY TYPE & VEHICLE
            </h4>
            {violationRows.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", backgroundColor: "#f8fafc", borderRadius: 8, color: "#64748b" }}>
                No violation action types selected for this report.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#ffffff", borderBottom: "2px solid #e2e8f0", textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, color: "#475569" }}>OFFENCE / ACCIDENT TYPE</th>
                    {selectedVehicles.map(v => (
                      <th key={v} style={{ padding: "12px", textAlign: "center", fontSize: 11, color: "#475569" }}>{v.toUpperCase()}</th>
                    ))}
                    <th style={{ padding: "12px", textAlign: "center", fontSize: 11, color: "#ffffff", backgroundColor: "#1E2A3B" }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {violationRows.map((row, idx) => {
                    const rowTotal = selectedVehicles.reduce((sum, v) => sum + (row[v] || 0), 0);
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 14px", fontWeight: 700, color: "#1e293b" }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: row.color, display: "inline-block", marginRight: 8 }} />
                          {row.type}
                        </td>
                        {selectedVehicles.map(v => (
                          <td key={v} style={{ padding: "12px", textAlign: "center", color: row[v] ? "#0f172a" : "#94a3b8" }}>
                            {row[v] ? row[v] : "—"}
                          </td>
                        ))}
                        <td style={{ padding: "12px", textAlign: "center", fontWeight: 800, backgroundColor: "#f8fafc" }}>{rowTotal}</td>
                      </tr>
                    );
                  })}
                  {/* GRAND TOTAL ROW */}
                  <tr style={{ backgroundColor: "#1E2A3B", color: "#ffffff", fontWeight: 800 }}>
                    <td style={{ padding: "14px", letterSpacing: "0.5px" }}>GRAND TOTAL</td>
                    {selectedVehicles.map(v => (
                      <td key={v} style={{ padding: "14px", textAlign: "center" }}>{vioColTotals[v]}</td>
                    ))}
                    <td style={{ padding: "14px", textAlign: "center", fontSize: 14 }}>{vioGrandTotal}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* DOCUMENT FOOTER SIGNATURES */}
        <div style={{ marginTop: 45, paddingTop: 20, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          <div>
            <p style={{ margin: "0 0 30px 0", color: "#475569" }}>Prepared by: <strong>{report.by || officerName}</strong>, Traffic Officer</p>
            <div style={{ width: 220, borderBottom: "1.5px solid #0f172a" }} />
            <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 0 0" }}>Sri Lanka Police — Traffic Branch, Negombo Division</p>
          </div>

          <div style={{ textAlign: "right" }}>
            <p style={{ margin: "0 0 30px 0", color: "#475569" }}>Authorised Signature</p>
            <div style={{ width: 220, borderBottom: "1.5px solid #0f172a", marginLeft: "auto" }} />
            <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 0 0" }}>Officer in Charge, Traffic Branch</p>
          </div>
        </div>

        {/* FOOTER WATERMARK LINE */}
        <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 25, paddingTop: 10, textAlign: "center", fontSize: "10px", color: "#94a3b8" }}>
          Ref: {report.id || "RPT-NB-6512"} - Negombo Division - 26 August 2026 - Dharma Integrity Traffic Branch Management System
        </div>

      </div>
    </div>
  );
}

export default ReportDocumentModal;
