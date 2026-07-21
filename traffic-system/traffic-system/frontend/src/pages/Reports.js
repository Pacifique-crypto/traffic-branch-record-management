import React, { useState, useEffect } from "react";
import OICLayout from "../layouts/OICLayout";
import { FiPrinter, FiDownload, FiCheckSquare, FiAlertTriangle, FiFileText, FiX, FiCalendar, FiShield, FiMapPin } from "react-icons/fi";
import { getAccidents, getViolations } from "../api";

// ── Chart Helper Components ──────────────────────────────────────────────────

function LocationBarChart({ data }) {
  const yTicks = [100, 75, 50, 25, 0];
  const max = 100;
  const height = 130;
  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", height: "170px", position: "relative", paddingTop: "15px" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: `${height}px`, fontSize: "10px", color: "#94a3b8", textAlign: "right", paddingRight: "6px" }}>
        {yTicks.map(t => <span key={t}>{t}</span>)}
      </div>
      <div style={{ flex: 1, position: "relative", height: `${height}px`, borderBottom: "1px solid #e2e8f0" }}>
        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => (
          <div key={idx} style={{ position: "absolute", top: `${pct * (height - 1)}px`, left: 0, right: 0, borderTop: "1px dashed #f1f5f9" }} />
        ))}
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", height: "100%", position: "relative", zIndex: 2 }}>
          {data.map((d, i) => {
            const barH = (d.value / max) * height;
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "48px" }}>
                <div style={{ width: "28px", height: `${barH}px`, background: "#0f172a", borderRadius: "4px 4px 0 0" }} />
                <span style={{ fontSize: "10px", color: "#64748b", marginTop: "6px", whiteSpace: "nowrap" }}>{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SeverityDonutChart({ slices }) {
  const total = slices.reduce((s, d) => s + d.value, 0);
  let cumAngle = -90;
  const r = 46; const cx = 60; const cy = 60;
  const paths = slices.map((s) => {
    const angle = (s.value / total) * 360;
    const start = cumAngle;
    cumAngle += angle;
    const toRad = (a) => (a * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(start));
    const y1 = cy + r * Math.sin(toRad(start));
    const x2 = cx + r * Math.cos(toRad(start + angle));
    const y2 = cy + r * Math.sin(toRad(start + angle));
    const large = angle > 180 ? 1 : 0;
    return { d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, color: s.color, label: s.label, pct: s.pct };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
      <svg viewBox="0 0 120 120" width={130} height={130} style={{ flexShrink: 0 }}>
        {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} />)}
        <circle cx={cx} cy={cy} r={28} fill="white" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, marginLeft: "20px" }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: 10, height: 10, borderRadius: "2px", background: s.color, flexShrink: 0 }} />
              <span style={{ color: "#475569" }}>{s.label}</span>
            </div>
            <strong style={{ color: "#0f172a", fontWeight: 700 }}>{s.pct}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthlyTrendLineChart({ data, labels }) {
  const yTicks = [1400, 1100, 900, 700];
  const min = 700; const max = 1400; const range = max - min;
  const height = 130; const W = 360;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (W - 30) + 15;
    const y = height - ((v - min) / range) * (height - 20) - 10;
    return `${x},${y}`;
  });

  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", height: "170px", paddingTop: "15px" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: `${height}px`, fontSize: "10px", color: "#94a3b8", textAlign: "right", paddingRight: "6px" }}>
        {yTicks.map(t => <span key={t}>{t}</span>)}
      </div>
      <div style={{ flex: 1, position: "relative", height: `${height}px` }}>
        {[0, 0.33, 0.66, 1].map((pct, idx) => (
          <div key={idx} style={{ position: "absolute", top: `${pct * (height - 1)}px`, left: 0, right: 0, borderTop: "1px dashed #f1f5f9" }} />
        ))}
        <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} style={{ overflow: "visible", position: "relative", zIndex: 2 }}>
          <polyline points={pts.join(" ")} fill="none" stroke="#0f172a" strokeWidth={2} />
          {data.map((v, i) => {
            const x = (i / (data.length - 1)) * (W - 30) + 15;
            const y = height - ((v - min) / range) * (height - 20) - 10;
            return <circle key={i} cx={x} cy={y} r={3.5} fill="#0f172a" stroke="white" strokeWidth={1.5} />;
          })}
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "10px", color: "#64748b", paddingLeft: "10px", paddingRight: "10px" }}>
          {labels.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      </div>
    </div>
  );
}

function OrangeHBarChart({ data }) {
  const max = 4000;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "11px", color: "#475569", width: "100px", flexShrink: 0, fontWeight: 500 }}>{d.label}</span>
          <div style={{ flex: 1, background: "#f1f5f9", borderRadius: "4px", height: "14px", overflow: "hidden" }}>
            <div style={{ width: `${(d.value / max) * 100}%`, background: "#d97706", height: "100%", borderRadius: "4px" }} />
          </div>
          <span style={{ fontSize: "11px", color: "#0f172a", width: "40px", textAlign: "right", fontWeight: 700 }}>{d.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function OrangePeakHoursChart() {
  const yTicks = [1000, 750, 500, 250, 0];
  const labels = ["6am", "9am", "12pm", "3pm", "6pm", "9pm"];
  const vals = [150, 420, 520, 680, 890, 320];
  const max = 1000; const height = 130; const W = 320;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * (W - 20) + 10;
    const y = height - (v / max) * (height - 20) - 10;
    return `${x},${y}`;
  });

  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", height: "170px", paddingTop: "15px" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: `${height}px`, fontSize: "10px", color: "#94a3b8", textAlign: "right" }}>
        {yTicks.map(t => <span key={t}>{t}</span>)}
      </div>
      <div style={{ flex: 1, position: "relative", height: `${height}px` }}>
        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => (
          <div key={idx} style={{ position: "absolute", top: `${pct * (height - 1)}px`, left: 0, right: 0, borderTop: "1px dashed #f1f5f9" }} />
        ))}
        <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="orgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <polygon points={`10,${height} ${pts.join(" ")} ${W - 10},${height}`} fill="url(#orgGrad)" />
          <polyline points={pts.join(" ")} fill="none" stroke="#d97706" strokeWidth={2.5} />
          {vals.map((v, i) => {
            const x = (i / (vals.length - 1)) * (W - 20) + 10;
            const y = height - (v / max) * (height - 20) - 10;
            return <circle key={i} cx={x} cy={y} r={3.5} fill="#d97706" stroke="white" strokeWidth={1.5} />;
          })}
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "10px", color: "#64748b" }}>
          {labels.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      </div>
    </div>
  );
}

function DualLineStrategicChart({ labels, accidents, violations }) {
  const accMax = 1400; const violMax = 14000;
  const height = 120; const W = 700;

  const accPts = accidents.map((v, i) => {
    const x = (i / (accidents.length - 1)) * (W - 40) + 20;
    const y = height - (v / accMax) * (height - 20) - 10;
    return `${x},${y}`;
  });

  const violPts = violations.map((v, i) => {
    const x = (i / (violations.length - 1)) * (W - 40) + 20;
    const y = height - (v / violMax) * (height - 20) - 10;
    return `${x},${y}`;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", position: "relative", height: `${height}px`, margin: "10px 0 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8" }}>
          <span>1400</span><span>1050</span><span>700</span><span>350</span><span>0</span>
        </div>
        <div style={{ flex: 1, margin: "0 15px", position: "relative" }}>
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => (
            <div key={idx} style={{ position: "absolute", top: `${pct * (height - 1)}px`, left: 0, right: 0, borderTop: "1px dashed #f1f5f9" }} />
          ))}
          <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} style={{ overflow: "visible" }}>
            <polyline points={accPts.join(" ")} fill="none" stroke="#ef4444" strokeWidth={2} />
            {accidents.map((v, i) => {
              const x = (i / (accidents.length - 1)) * (W - 40) + 20;
              const y = height - (v / accMax) * (height - 20) - 10;
              return <circle key={`a-${i}`} cx={x} cy={y} r={3} fill="white" stroke="#ef4444" strokeWidth={2} />;
            })}
            <polyline points={violPts.join(" ")} fill="none" stroke="#3b82f6" strokeWidth={2} />
            {violations.map((v, i) => {
              const x = (i / (violations.length - 1)) * (W - 40) + 20;
              const y = height - (v / violMax) * (height - 20) - 10;
              return <circle key={`v-${i}`} cx={x} cy={y} r={3} fill="white" stroke="#3b82f6" strokeWidth={2} />;
            })}
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "10px", color: "#64748b" }}>
            {labels.map((l, i) => <span key={i}>{l}</span>)}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8", textAlign: "right" }}>
          <span>14000</span><span>10500</span><span>7000</span><span>3500</span><span>0</span>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: "20px", fontSize: "11px", color: "#64748b", marginTop: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", border: "2px solid #ef4444", background: "white", display: "inline-block" }} />
          <span style={{ color: "#ef4444", fontWeight: 600 }}>Accidents</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", border: "2px solid #3b82f6", background: "white", display: "inline-block" }} />
          <span style={{ color: "#3b82f6", fontWeight: 600 }}>Violations</span>
        </div>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

function Reports() {
  const officer = JSON.parse(localStorage.getItem("officer") || "{}");
  const officerName = officer.name || "PS Perera";

  const [reportType, setReportType]     = useState("Summary Report");
  const [catAccidents, setCatAccidents]   = useState(true);
  const [catViolations, setCatViolations] = useState(true);
  const [dateRange, setDateRange]       = useState("This Month");
  const [customFrom, setCustomFrom]     = useState("06/30/2026");
  const [customTo, setCustomTo]         = useState("07/12/2026");
  const [isModalOpen, setIsModalOpen]   = useState(false);

  const [accidentsList, setAccidentsList]   = useState([]);
  const [violationsList, setViolationsList] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accs = await getAccidents();
        const viols = await getViolations();
        setAccidentsList(accs || []);
        setViolationsList(viols || []);
      } catch (err) {
        console.error("Failed to fetch reports data:", err);
      }
    };
    fetchData();
  }, []);

  const totalAccidents = accidentsList.length > 0 ? accidentsList.length : 1245;

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    alert(`Exporting ${reportType} as PDF file...`);
  };

  return (
    <OICLayout>
      <div className="pro-ra-page">

        {/* PAGE TITLE & SUBTITLE */}
        <div className="pro-ra-header">
          <h1 className="pro-ra-title">Reports & Analytics</h1>
          <p className="pro-ra-sub">
            Live accident & violation analytics below — set a report type and date range, then generate a formatted report to export or print
          </p>
        </div>

        {/* TOOLBAR CARD */}
        <div className="pro-ra-toolbar-card">

          {/* FIRST ROW: CONTROLS */}
          <div className="pro-ra-toolbar-row1">
            <div className="pro-ra-ctrl-group">
              <span className="pro-ra-ctrl-label">REPORT TYPE</span>
              <select
                className="pro-ra-select-box"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="Summary Report">Summary Report</option>
                <option value="Detailed Report">Detailed Report</option>
                <option value="Incident Report">Incident Report</option>
              </select>
            </div>

            <div className="pro-ra-ctrl-group">
              <span className="pro-ra-ctrl-label">CATEGORIES</span>
              <div className="pro-ra-checks">
                <label className="pro-ra-check">
                  <input
                    type="checkbox"
                    checked={catAccidents}
                    onChange={(e) => setCatAccidents(e.target.checked)}
                  />
                  Accidents
                </label>
                <label className="pro-ra-check">
                  <input
                    type="checkbox"
                    checked={catViolations}
                    onChange={(e) => setCatViolations(e.target.checked)}
                  />
                  Violations
                </label>
              </div>
            </div>

            <div className="pro-ra-ctrl-group pro-ra-ctrl-right">
              <span className="pro-ra-ctrl-label">DATE RANGE SELECTION</span>
              <div className="pro-ra-pills-row">
                {["Today", "This Week", "This Month", "Custom"].map((r) => (
                  <button
                    key={r}
                    className={`pro-ra-pill-btn ${dateRange === r ? "pill-dark" : ""}`}
                    onClick={() => setDateRange(r)}
                  >
                    {r}
                  </button>
                ))}

                <div className="pro-ra-date-box">
                  <input
                    type="text"
                    className="pro-ra-date-field"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                  />
                  <span className="pro-ra-date-dash">—</span>
                  <input
                    type="text"
                    className="pro-ra-date-field"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECOND ROW: ACTION BUTTONS */}
          <div className="pro-ra-toolbar-row2">
            <button className="pro-ra-btn-outline" onClick={handlePrint}>
              <span style={{ fontSize: 13 }}>🖨️</span> Print
            </button>
            <button className="pro-ra-btn-outline" onClick={handleExport}>
              <span style={{ fontSize: 13 }}>⬇</span> Export
            </button>
            <button className="pro-ra-btn-primary" onClick={() => setIsModalOpen(true)}>
              Generate Report
            </button>
          </div>

          {/* THIRD ROW: SUB-INFO & SECTION JUMP */}
          <div className="pro-ra-toolbar-row3">
            <p className="pro-ra-sub-text">
              Live analytics — showing current data. Generate a report to label and export a snapshot.
            </p>
            <div className="pro-ra-jump-links">
              <a
                href="#accidents"
                className={`pro-ra-jump-link ${catAccidents ? "active-link" : ""}`}
                onClick={(e) => { e.preventDefault(); setCatAccidents(true); }}
              >
                <span style={{ fontSize: 10 }}>ℹ</span> Accidents
              </a>
              <a
                href="#violations"
                className={`pro-ra-jump-link ${catViolations ? "active-link" : ""}`}
                onClick={(e) => { e.preventDefault(); setCatViolations(true); }}
              >
                <span style={{ fontSize: 10 }}>ℹ</span> Violations
              </a>
            </div>
          </div>

        </div>

        {/* SECTION: ACCIDENTS */}
        {catAccidents && (
          <div className="pro-ra-section-wrap" id="accidents">
            <div className="pro-ra-sec-header">
              <span className="pro-ra-red-dot">●</span>
              <h2 className="pro-ra-sec-title">Accidents</h2>
            </div>

            <div className="pro-ra-stat-cards-grid">
              <div className="pro-ra-stat-card">
                <span className="pro-ra-card-label">TOTAL ACCIDENTS</span>
                <p className="pro-ra-card-val">{totalAccidents.toLocaleString()}</p>
                <p className="pro-ra-card-trend text-red">▲ 8.2% vs last period</p>
              </div>

              <div className="pro-ra-stat-card">
                <span className="pro-ra-card-label">HIGH RISK ZONES</span>
                <p className="pro-ra-card-val">4</p>
                <p className="pro-ra-card-sub">Zones above threshold</p>
              </div>

              <div className="pro-ra-stat-card">
                <span className="pro-ra-card-label">PEAK TIME</span>
                <p className="pro-ra-card-val">5–7 PM</p>
                <p className="pro-ra-card-sub">Highest frequency window</p>
              </div>
            </div>

            <div className="pro-ra-warning-banner">
              <span className="warning-icon">⚠️</span>
              <div>
                <strong className="warning-title">Accidents increased by 20% in Negombo this week</strong>
                <p className="warning-desc">Critical threshold exceeded — immediate patrol reinforcement recommended in high-risk zones.</p>
              </div>
            </div>

            <div className="pro-ra-charts-2x2">
              <div className="pro-ra-chart-card">
                <h3 className="pro-ra-card-head">ACCIDENTS BY LOCATION (HIGH ACCIDENT)</h3>
                <LocationBarChart
                  data={[
                    { label: "Negombo Jn", value: 85 },
                    { label: "Colombo Fort", value: 72 },
                    { label: "Koppara Jn", value: 60 },
                    { label: "Kandy Rd", value: 45 },
                    { label: "Airport Rd", value: 30 },
                  ]}
                />
              </div>

              <div className="pro-ra-chart-card">
                <h3 className="pro-ra-card-head">ACCIDENTS BY SEVERITY</h3>
                <SeverityDonutChart
                  slices={[
                    { label: "Property Damage", value: 52, pct: 52, color: "#475569" },
                    { label: "Minor Injury",    value: 28, pct: 28, color: "#f59e0b" },
                    { label: "Major Injury",    value: 14, pct: 14, color: "#f97316" },
                    { label: "Fatal",           value: 6,  pct: 6,  color: "#ef4444" },
                  ]}
                />
              </div>

              <div className="pro-ra-chart-card">
                <h3 className="pro-ra-card-head">MONTHLY TREND</h3>
                <MonthlyTrendLineChart
                  data={[820, 845, 870, 920, 980, 1100, 1245]}
                  labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"]}
                />
              </div>

              <div className="pro-ra-chart-card">
                <h3 className="pro-ra-card-head">TOP DANGER ZONES</h3>
                <div className="pro-ra-dz-list">
                  <div className="pro-ra-dz-item">
                    <span className="pro-ra-dz-icon">⛔</span>
                    <span className="pro-ra-dz-name">Negombo Junction</span>
                    <span className="pro-ra-dz-tag tag-red">87/100</span>
                  </div>

                  <div className="pro-ra-dz-item">
                    <span className="pro-ra-dz-icon">⛔</span>
                    <span className="pro-ra-dz-name">Colombo Fort</span>
                    <span className="pro-ra-dz-tag tag-red">82/100</span>
                  </div>

                  <div className="pro-ra-dz-item">
                    <span className="pro-ra-dz-icon">⛔</span>
                    <span className="pro-ra-dz-name">Koppara Junction</span>
                    <span className="pro-ra-dz-tag tag-orange">68/100</span>
                  </div>
                </div>

                <div className="pro-ra-risk-scale-box">
                  <span className="risk-scale-head">RISK INDEX SCALE</span>
                  <div className="risk-scale-items">
                    <span className="scale-item"><span className="sq-dot sq-red" /> 80–100 Critical</span>
                    <span className="scale-item"><span className="sq-dot sq-orange" /> 60–79 High</span>
                    <span className="scale-item"><span className="sq-dot sq-yellow" /> 40–59 Med</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FULL WIDTH STRATEGIC CHART */}
        <div className="pro-ra-chart-card full-width-card">
          <h3 className="pro-ra-card-head">📈 Long-term Strategic Trends</h3>
          <DualLineStrategicChart
            labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"]}
            accidents={[820, 845, 870, 920, 980, 1100, 1245]}
            violations={[9800, 10100, 10400, 10900, 11400, 12200, 12847]}
          />
        </div>

        {/* GENERATED REPORT MODAL */}
        {isModalOpen && (
          <div className="modal-backdrop-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-doc-container" onClick={(e) => e.stopPropagation()}>

              {/* MODAL TOP FIXED BAR */}
              <div className="modal-top-bar">
                <div className="top-bar-left">
                  <div className="blue-shield-icon">🛡️</div>
                  <div>
                    <h3 className="top-bar-title">Generated Report</h3>
                    <p className="top-bar-sub">Ref: RPT-NB-005309 · 21 July 2026</p>
                  </div>
                </div>

                <div className="top-bar-actions">
                  <button className="btn-top-bar" onClick={handlePrint}>
                    🖨️ Print
                  </button>
                  <button className="btn-top-bar" onClick={handleExport}>
                    ⬇ Export PDF
                  </button>
                  <button className="btn-top-bar btn-close-red" onClick={() => setIsModalOpen(false)}>
                    ✕ Close
                  </button>
                </div>
              </div>

              {/* MODAL PRINTABLE DOCUMENT CONTENT */}
              <div className="modal-doc-body">

                {/* DOCUMENT HEADER */}
                <div className="doc-head-row">
                  <div>
                    <span className="doc-dept-title">SRI LANKA POLICE — TRAFFIC BRANCH</span>
                    <h1 className="doc-main-title">{reportType}</h1>
                    <p className="doc-period-sub">Negombo Division · Period: 06/30/2026 — 07/12/2026</p>
                  </div>

                  <div className="doc-head-right">
                    <div className="doc-official-badge">OFFICIAL DOCUMENT</div>
                    <p className="doc-meta-text">Generated: 21 July 2026</p>
                    <p className="doc-meta-text">Officer: PS Perera · 256 556 656</p>
                    <p className="doc-meta-text">Ref No: RPT-NB-005309</p>
                  </div>
                </div>

                {/* PILLS ROW */}
                <div className="doc-pills-row">
                  <span className="doc-pill-red">● Accidents</span>
                  <span className="doc-pill-blue">● Violations</span>
                  <span className="doc-pill-text">Negombo Division · Live Data Snapshot</span>
                </div>

                <div className="doc-divider" />

                {/* SECTION 1: EXECUTIVE SUMMARY */}
                <div className="doc-sec">
                  <div className="doc-sec-num-head">
                    <span className="doc-sec-num">1</span>
                    <h2 className="doc-sec-title">Executive Summary</h2>
                  </div>

                  <div className="doc-6kpi-grid">
                    <div className="doc-kpi-card">
                      <span className="kpi-title">TOTAL ACCIDENTS</span>
                      <p className="kpi-val">1,245</p>
                      <p className="kpi-sub kpi-red">▲ 8.2% vs last period</p>
                    </div>

                    <div className="doc-kpi-card">
                      <span className="kpi-title">FATAL INCIDENTS</span>
                      <p className="kpi-val">6</p>
                      <p className="kpi-sub kpi-red">▲ 1 vs last period</p>
                    </div>

                    <div className="doc-kpi-card">
                      <span className="kpi-title">HIGH RISK ZONES</span>
                      <p className="kpi-val">4</p>
                      <p className="kpi-sub kpi-gray">Zones above threshold</p>
                    </div>

                    <div className="doc-kpi-card">
                      <span className="kpi-title">TOTAL VIOLATIONS (YTD)</span>
                      <p className="kpi-val">12,847</p>
                      <p className="kpi-sub kpi-red">▲ 2.5% vs last month</p>
                    </div>

                    <div className="doc-kpi-card">
                      <span className="kpi-title">ISSUED THIS WEEK</span>
                      <p className="kpi-val">312</p>
                      <p className="kpi-sub kpi-gray">This month: 1,350</p>
                    </div>

                    <div className="doc-kpi-card">
                      <span className="kpi-title">PEAK HOUR</span>
                      <p className="kpi-val">5–7 PM</p>
                      <p className="kpi-sub kpi-gray">Most common: Speeding</p>
                    </div>
                  </div>

                  {/* WARNING BOX 1 */}
                  <div className="doc-banner-box banner-red">
                    <span className="banner-icon">⚠️</span>
                    <div>
                      <strong className="banner-head">Critical: Accidents increased by 20% in Negombo this week</strong>
                      <p className="banner-text">Critical threshold exceeded — immediate patrol reinforcement recommended in high-risk zones. Negombo Junction recorded 87 incidents this period, the highest in the division.</p>
                    </div>
                  </div>

                  {/* NOTICE BOX 2 */}
                  <div className="doc-banner-box banner-yellow">
                    <span className="banner-icon">📍</span>
                    <div>
                      <strong className="banner-head">Negombo Town Road has the highest violation density</strong>
                      <p className="banner-text">Colombo Fort (Main Rd) and Kurunegala Rd Terminal follow closely — consider targeted enforcement operations during 5–7 PM peak window.</p>
                    </div>
                  </div>
                </div>

                <div className="doc-divider" />

                {/* SECTION 2: ACCIDENT ANALYTICS OVERVIEW */}
                <div className="doc-sec">
                  <div className="doc-sec-num-head">
                    <span className="doc-sec-num">2</span>
                    <h2 className="doc-sec-title">Accident Analytics Overview</h2>
                  </div>

                  <div className="doc-2col-grid">
                    <div>
                      <h4 className="doc-chart-head">ACCIDENTS BY LOCATION</h4>
                      <LocationBarChart
                        data={[
                          { label: "Negombo Jn", value: 85 },
                          { label: "Colombo Fort", value: 72 },
                          { label: "Koppara Jn", value: 60 },
                          { label: "Kandy Rd", value: 45 },
                          { label: "Airport Rd", value: 30 },
                        ]}
                      />
                    </div>

                    <div>
                      <h4 className="doc-chart-head">ACCIDENTS BY SEVERITY</h4>
                      <SeverityDonutChart
                        slices={[
                          { label: "Property Damage", value: 52, pct: 52, color: "#475569" },
                          { label: "Minor Injury",    value: 28, pct: 28, color: "#f59e0b" },
                          { label: "Major Injury",    value: 14, pct: 14, color: "#f97316" },
                          { label: "Fatal",           value: 6,  pct: 6,  color: "#ef4444" },
                        ]}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: "20px" }}>
                    <h4 className="doc-chart-head">MONTHLY INCIDENT TREND</h4>
                    <MonthlyTrendLineChart
                      data={[820, 845, 870, 920, 980, 1100, 1245]}
                      labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"]}
                    />
                  </div>
                </div>

                <div className="doc-divider" />

                {/* SECTION 3: VIOLATION ANALYTICS OVERVIEW */}
                <div className="doc-sec">
                  <div className="doc-sec-num-head">
                    <span className="doc-sec-num">3</span>
                    <h2 className="doc-sec-title">Violation Analytics Overview</h2>
                  </div>

                  <div className="doc-2col-grid">
                    <div>
                      <h4 className="doc-chart-head">VIOLATIONS BY TYPE</h4>
                      <OrangeHBarChart
                        data={[
                          { label: "Speeding",       value: 3850 },
                          { label: "No Helmet",      value: 3200 },
                          { label: "Signal Jump",    value: 2450 },
                          { label: "Illegal Parking",value: 1980 },
                          { label: "No License",     value: 1367 },
                        ]}
                      />
                    </div>

                    <div>
                      <h4 className="doc-chart-head">PEAK HOURS DISTRIBUTION</h4>
                      <OrangePeakHoursChart />
                    </div>
                  </div>
                </div>

                <div className="doc-divider" />

                {/* SECTION 4: TOP DANGER ZONES - RISK INDEX */}
                <div className="doc-sec">
                  <div className="doc-sec-num-head">
                    <span className="doc-sec-num">4</span>
                    <h2 className="doc-sec-title">Top Danger Zones — Risk Index</h2>
                  </div>

                  <table className="doc-table-styled">
                    <thead>
                      <tr>
                        <th>RANK</th>
                        <th>LOCATION</th>
                        <th>RISK SCORE</th>
                        <th>INCIDENTS</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>#1</td>
                        <td><strong>Negombo Junction</strong></td>
                        <td><div className="score-bar-wrap"><div className="bar-fill fill-red" style={{ width: "87%" }} /><span className="score-text text-red">87/100</span></div></td>
                        <td>312</td>
                        <td><span className="tbl-pill pill-red">CRITICAL</span></td>
                      </tr>
                      <tr>
                        <td>#2</td>
                        <td><strong>Colombo Fort</strong></td>
                        <td><div className="score-bar-wrap"><div className="bar-fill fill-red" style={{ width: "82%" }} /><span className="score-text text-red">82/100</span></div></td>
                        <td>278</td>
                        <td><span className="tbl-pill pill-red">CRITICAL</span></td>
                      </tr>
                      <tr>
                        <td>#3</td>
                        <td><strong>Koppara Junction</strong></td>
                        <td><div className="score-bar-wrap"><div className="bar-fill fill-orange" style={{ width: "68%" }} /><span className="score-text text-orange">68/100</span></div></td>
                        <td>194</td>
                        <td><span className="tbl-pill pill-orange">HIGH</span></td>
                      </tr>
                      <tr>
                        <td>#4</td>
                        <td><strong>Kandy Road</strong></td>
                        <td><div className="score-bar-wrap"><div className="bar-fill fill-yellow" style={{ width: "54%" }} /><span className="score-text text-yellow">54/100</span></div></td>
                        <td>143</td>
                        <td><span className="tbl-pill pill-yellow">MEDIUM</span></td>
                      </tr>
                      <tr>
                        <td>#5</td>
                        <td><strong>Airport Road</strong></td>
                        <td><div className="score-bar-wrap"><div className="bar-fill fill-yellow" style={{ width: "41%" }} /><span className="score-text text-yellow">41/100</span></div></td>
                        <td>97</td>
                        <td><span className="tbl-pill pill-yellow">MEDIUM</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="doc-divider" />

                {/* SECTION 5: RECENT INCIDENT LOG */}
                <div className="doc-sec">
                  <div className="doc-sec-num-head">
                    <span className="doc-sec-num">5</span>
                    <h2 className="doc-sec-title">Recent Incident Log</h2>
                  </div>

                  <table className="doc-table-styled">
                    <thead>
                      <tr>
                        <th>INCIDENT ID</th>
                        <th>DATE</th>
                        <th>TIME</th>
                        <th>LOCATION</th>
                        <th>TYPE</th>
                        <th>SEVERITY</th>
                        <th>OFFICER</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>ACC-2026-0847</strong></td>
                        <td>07/11/2026</td>
                        <td>17:32</td>
                        <td><strong>Negombo Junction</strong></td>
                        <td>Collision</td>
                        <td><span className="tbl-pill pill-orange">Major Injury</span></td>
                        <td>PC 4521 Silva</td>
                      </tr>
                      <tr>
                        <td><strong>ACC-2026-0846</strong></td>
                        <td>07/11/2026</td>
                        <td>14:15</td>
                        <td><strong>Colombo Fort</strong></td>
                        <td>Rear-end</td>
                        <td><span className="tbl-pill pill-yellow">Minor Injury</span></td>
                        <td>PC 3812 Perera</td>
                      </tr>
                      <tr>
                        <td><strong>VIO-2026-3291</strong></td>
                        <td>07/11/2026</td>
                        <td>09:42</td>
                        <td><strong>Kurunegala Terminal</strong></td>
                        <td>Speeding</td>
                        <td>—</td>
                        <td>PC 5501 Fernando</td>
                      </tr>
                      <tr>
                        <td><strong>ACC-2026-0845</strong></td>
                        <td>07/10/2026</td>
                        <td>18:55</td>
                        <td><strong>Kandy Rd</strong></td>
                        <td>Hit & Run</td>
                        <td><span className="tbl-pill pill-red">Fatal</span></td>
                        <td>PS 1204 Rathnayake</td>
                      </tr>
                      <tr>
                        <td><strong>VIO-2026-3288</strong></td>
                        <td>07/10/2026</td>
                        <td>07:30</td>
                        <td><strong>Negombo Town</strong></td>
                        <td>No Helmet</td>
                        <td>—</td>
                        <td>PC 4521 Silva</td>
                      </tr>
                      <tr>
                        <td><strong>VIO-2026-3287</strong></td>
                        <td>07/10/2026</td>
                        <td>06:58</td>
                        <td><strong>Negombo Town</strong></td>
                        <td>Signal Jump</td>
                        <td>—</td>
                        <td>PC 3812 Perera</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="doc-divider" />

                {/* SECTION 6: LONG TERM STRATEGIC TREND */}
                <div className="doc-sec">
                  <div className="doc-sec-num-head">
                    <span className="doc-sec-num">6</span>
                    <h2 className="doc-sec-title">Long-term Strategic Trend</h2>
                  </div>

                  <DualLineStrategicChart
                    labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"]}
                    accidents={[820, 845, 870, 920, 980, 1100, 1245]}
                    violations={[9800, 10100, 10400, 10900, 11400, 12200, 12847]}
                  />
                </div>

                <div className="doc-divider" />

                {/* DOCUMENT FOOTER SIGNATURE */}
                <div className="doc-footer-sign-row">
                  <div>
                    <strong className="sign-prep">Prepared by: PS Perera, Traffic Officer</strong>
                    <p className="sign-sub">Sri Lanka Police — Traffic Branch, Negombo Division</p>
                    <p className="sign-sub">Tel: 256 556 656 · Generated: 21 July 2026</p>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div className="sign-line" />
                    <strong className="sign-prep">Authorised Signature</strong>
                    <p className="sign-sub">Officer in Charge, Traffic Branch</p>
                  </div>
                </div>

                {/* OFFICIAL POLICE REPORT WATERMARK BOX */}
                <div className="doc-watermark-box">
                  This document is an official police report. Ref: RPT-NB-005309 · Negombo Division · 21 July 2026 · Dharma Integrity Traffic Branch Management System
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </OICLayout>
  );
}

export default Reports;