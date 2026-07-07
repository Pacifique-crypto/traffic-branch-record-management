import React, { useState } from "react";
import Layout from "../components/Layout";

const reportTypes = [
  "Accident Summary Report",
  "Violation Statistics Report",
  "Duty Roster Report",
  "Spot Fine Report",
  "Driving License Report",
  "Monthly Analytics Report",
  "Officer Performance Report",
];

const dateRanges = [
  "Today",
  "This Week",
  "This Month",
  "Last Month",
  "Last 3 Months",
  "Last 6 Months",
  "This Year",
  "Custom Range",
];

function Reports() {
  const [reportType, setReportType] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [exportFormat, setExportFormat] = useState("PDF");

  const handlePreview = () => {
    if (!reportType || !dateRange) {
      alert("Please select a Report Type and Date Range.");
      return;
    }
    setPreviewing(true);
  };

  const handlePrint = () => {
    if (!previewing) { alert("Please preview the report first."); return; }
    window.print();
  };

  const handleExport = () => {
    if (!previewing) { alert("Please preview the report first."); return; }
    alert(`Exporting as ${exportFormat}...\nReport: ${reportType}\nRange: ${dateRange}`);
  };

  return (
    <Layout>
      <div className="page-box">
        <h2 className="page-heading">Reports</h2>

        <div className="reports-layout">
          {/* Left — config panel */}
          <div className="reports-left">
            <div className="reports-config-box">
              <h3 className="reports-config-title">Reports Generation</h3>
              <p className="reports-config-sub">Report Configuration</p>

              {/* Report Type */}
              <div className="reports-field">
                <label className="reports-label">Report Type:</label>
                <select
                  className="reports-select"
                  value={reportType}
                  onChange={(e) => { setReportType(e.target.value); setPreviewing(false); }}
                >
                  <option value="">Select Report Type</option>
                  {reportTypes.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>

              {/* Date Range */}
              <div className="reports-field">
                <label className="reports-label">Date Range:</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <select
                    className="reports-select"
                    value={dateRange}
                    onChange={(e) => { setDateRange(e.target.value); setPreviewing(false); }}
                  >
                    <option value="">Select Date Range</option>
                    {dateRanges.map((r) => <option key={r}>{r}</option>)}
                  </select>
                  <span className="calendar-icon">📅</span>
                </div>
              </div>

              {/* Custom date range inputs */}
              {dateRange === "Custom Range" && (
                <div className="reports-custom-range">
                  <div className="reports-field">
                    <label className="reports-label">From:</label>
                    <input type="date" className="reports-select" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                  </div>
                  <div className="reports-field">
                    <label className="reports-label">To:</label>
                    <input type="date" className="reports-select" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
                  </div>
                </div>
              )}

              {/* Preview button */}
              <button className="btn-preview" onClick={handlePreview}>
                Preview
              </button>

              {/* Export & Print row */}
              <div className="reports-action-row">
                <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
                  <button className="btn-export" onClick={handleExport}>
                    Export as
                  </button>
                  <select
                    className="export-format-select"
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                  >
                    <option>PDF</option>
                    <option>Excel</option>
                    <option>CSV</option>
                    <option>Word</option>
                  </select>
                </div>
                <button className="btn-print" onClick={handlePrint}>
                  Print
                </button>
              </div>
            </div>
          </div>

          {/* Right — preview panel */}
          <div className="reports-right">
            {!previewing ? (
              <div className="reports-preview-placeholder">
                <div className="preview-icon">📊</div>
                <p className="preview-hint">Select a report type and date range,<br />then click <strong>Preview</strong></p>
              </div>
            ) : (
              <div className="reports-preview-content">
                <div className="preview-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <img
                      src="https://images.seeklogo.com/logo-png/37/1/sri-lanka-police-logo-png_seeklogo-374521.png"
                      alt="SLP"
                      style={{ width: 36, height: 36, objectFit: "contain" }}
                    />
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "13px", color: "#1e293b" }}>Sri Lanka Police</p>
                      <p style={{ fontSize: "11px", color: "#64748b" }}>Traffic Branch – Negombo</p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "11px", color: "#64748b" }}>Generated: {new Date().toLocaleDateString()}</p>
                    <p style={{ fontSize: "11px", color: "#64748b" }}>Range: {dateRange}</p>
                  </div>
                </div>

                <h3 className="preview-report-title">{reportType}</h3>
                <div className="preview-divider" />

                {/* Mock table data */}
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>ID</th>
                      <th>Date</th>
                      <th>Location</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: "001", ref: "ACD-1024", date: "2026-04-03", loc: "Colombo Road", type: "Collision",    status: "Closed" },
                      { id: "002", ref: "VID-1021", date: "2026-04-04", loc: "Main Street",  type: "Speeding",     status: "Pending" },
                      { id: "003", ref: "SFR-1001", date: "2026-04-05", loc: "Kandy Road",   type: "Signal Jump",  status: "Paid" },
                      { id: "004", ref: "ACD-1025", date: "2026-04-06", loc: "Galle Road",   type: "Hit & Run",    status: "Open" },
                      { id: "005", ref: "VID-1022", date: "2026-04-07", loc: "Chilaw Road",  type: "No Seat Belt", status: "Paid" },
                    ].map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.ref}</td>
                        <td>{row.date}</td>
                        <td>{row.loc}</td>
                        <td>{row.type}</td>
                        <td>
                          <span className={`remarks-badge ${row.status === "Closed" || row.status === "Paid" ? "badge-green" : row.status === "Pending" ? "badge-yellow" : "badge-orange"}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="preview-footer">
                  <p>Total Records: 5 &nbsp;|&nbsp; Prepared by: PS Perera &nbsp;|&nbsp; Traffic Branch – Negombo</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Reports;