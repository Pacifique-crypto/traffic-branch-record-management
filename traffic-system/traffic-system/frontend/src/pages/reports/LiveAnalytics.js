import React from "react";
import { FiPrinter, FiDownload } from "react-icons/fi";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, AreaChart, Area, LineChart, Line
} from "recharts";

import {
  accidentLocationData, accidentSeverityData, monthlyTrendData,
  violationAreaData, violationTypeData, weeklyYearlyTrendData,
  peakHoursData, longTermStrategicData
} from "./mockData";
import { reportStyles } from "./reportStyles";

function LiveAnalytics({
  liveDatePreset, handleLivePresetChange,
  fromDate, setFromDate,
  toDate, setToDate,
  analyticsSection, setAnalyticsSection,
  handlePrint, handleExportPDF,
  openGenerateModal
}) {
  return (
    <div>
      {/* CONTROLS CARD */}
      <div style={{ ...reportStyles.card, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <p style={reportStyles.kpiLabel}>
              DATE RANGE SELECTION
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {["Today", "This Week", "This Month", "Custom"].map(preset => (
                <button
                  key={preset}
                  onClick={() => handleLivePresetChange(preset)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: "6px",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    backgroundColor: liveDatePreset === preset ? "#1E2A3B" : "#f1f5f9",
                    color: liveDatePreset === preset ? "#ffffff" : "#475569",
                    transition: "all 0.15s ease"
                  }}
                >
                  {preset}
                </button>
              ))}

              <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 6 }}>
                <input
                  type="text"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "13px",
                    width: 105,
                    textAlign: "center",
                    color: "#1e293b",
                    fontWeight: 600,
                    outline: "none"
                  }}
                />
                <span style={{ color: "#94a3b8" }}>—</span>
                <input
                  type="text"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "13px",
                    width: 105,
                    textAlign: "center",
                    color: "#1e293b",
                    fontWeight: 600,
                    outline: "none"
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={handlePrint}
              style={reportStyles.btnSecondary}
            >
              <FiPrinter size={15} /> Print
            </button>
            <button
              onClick={handleExportPDF}
              style={reportStyles.btnSecondary}
            >
              <FiDownload size={15} /> Export
            </button>
            <button
              onClick={openGenerateModal}
              style={reportStyles.btnPrimary}
            >
              Generate Report
            </button>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 18, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
          <p style={{ fontSize: 12, color: "#64748b", fontStyle: "italic", margin: 0 }}>
            Live analytics — showing current data.
          </p>

          {/* ACCIDENT / VIOLATION SECTION TOGGLE BUTTONS */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setAnalyticsSection("accidents")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 18px",
                borderRadius: "8px",
                border: "1.5px solid",
                borderColor: analyticsSection === "accidents" ? "#ef4444" : "#e2e8f0",
                backgroundColor: analyticsSection === "accidents" ? "#fef2f2" : "#ffffff",
                color: analyticsSection === "accidents" ? "#dc2626" : "#64748b",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#ef4444", display: "inline-block" }} />
              Accident Analytics
            </button>

            <button
              onClick={() => setAnalyticsSection("violations")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 18px",
                borderRadius: "8px",
                border: "1.5px solid",
                borderColor: analyticsSection === "violations" ? "#2563eb" : "#e2e8f0",
                backgroundColor: analyticsSection === "violations" ? "#eff6ff" : "#ffffff",
                color: analyticsSection === "violations" ? "#2563eb" : "#64748b",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#2563eb", display: "inline-block" }} />
              Violation Analytics
            </button>
          </div>
        </div>
      </div>

      {/* ── ACCIDENT ANALYTICS SECTION ── */}
      {analyticsSection === "accidents" && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#ef4444" }} />
            <h2 style={reportStyles.sectionTitle}>Accident Analytics</h2>
          </div>

          {/* KPI CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
            <div style={reportStyles.cardSmall}>
              <p style={reportStyles.kpiLabel}>TOTAL ACCIDENTS</p>
              <p style={reportStyles.kpiValue}>1,245</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", margin: 0 }}>▲ 8.2% vs last period</p>
            </div>
            <div style={reportStyles.cardSmall}>
              <p style={reportStyles.kpiLabel}>HIGH RISK ZONES</p>
              <p style={reportStyles.kpiValue}>4</p>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Zones above threshold</p>
            </div>
            <div style={reportStyles.cardSmall}>
              <p style={reportStyles.kpiLabel}>PEAK TIME</p>
              <p style={reportStyles.kpiValue}>5–7 PM</p>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Highest frequency window</p>
            </div>
          </div>

          {/* RED ALERT BANNER */}
          <div style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: "12px",
            padding: "16px 20px",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 20
          }}>
            <span style={{ fontSize: 18 }}>📍</span>
            <div>
              <strong style={{ color: "#991b1b", fontSize: 14, display: "block" }}>
                Accidents increased by 20% in Negombo this week
              </strong>
              <p style={{ color: "#7f1d1d", fontSize: 12, margin: "2px 0 0 0" }}>
                Critical threshold exceeded — immediate patrol reinforcement recommended in high-risk zones.
              </p>
            </div>
          </div>

          {/* 2-COLUMN GRID 1 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            {/* Accidents by Location */}
            <div style={{ ...reportStyles.cardSmall, padding: 22 }}>
              <h3 style={reportStyles.subSectionTitle}>ACCIDENTS BY LOCATION</h3>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={accidentLocationData}>
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1E2A3B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Accidents by Severity */}
            <div style={{ ...reportStyles.cardSmall, padding: 22 }}>
              <h3 style={reportStyles.subSectionTitle}>ACCIDENTS BY SEVERITY</h3>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", height: 220 }}>
                <div style={{ width: 180, height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={accidentSeverityData} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={3}>
                        {accidentSeverityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {accidentSeverityData.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "2px", backgroundColor: item.color }} />
                      <span style={{ color: "#475569", width: 120 }}>{item.name}</span>
                      <strong style={{ color: "#0f172a" }}>{item.pct}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2-COLUMN GRID 2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Monthly Trend */}
            <div style={{ ...reportStyles.cardSmall, padding: 22 }}>
              <h3 style={reportStyles.subSectionTitle}>MONTHLY TREND</h3>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrendData}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="val" stroke="#1E2A3B" fill="#1E2A3B" fillOpacity={0.15} strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Danger Zones */}
            <div style={{ ...reportStyles.cardSmall, padding: 22 }}>
              <h3 style={reportStyles.subSectionTitle}>TOP DANGER ZONES</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { location: "Negombo Junction", score: "87/100", pct: 87, color: "#dc2626", badgeBg: "#fee2e2" },
                  { location: "Colombo Fort", score: "82/100", pct: 82, color: "#dc2626", badgeBg: "#fee2e2" },
                  { location: "Koppara Junction", score: "68/100", pct: 68, color: "#d97706", badgeBg: "#fef3c7" },
                  { location: "Kandy Road", score: "54/100", pct: 54, color: "#ca8a04", badgeBg: "#fef9c3" },
                  { location: "Airport Road", score: "41/100", pct: 41, color: "#ca8a04", badgeBg: "#fef9c3" },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 12, color: "#64748b", width: 120, fontWeight: 600 }}>{item.location}</span>
                    <div style={{ flex: 1, height: 10, backgroundColor: "#f1f5f9", borderRadius: 5, overflow: "hidden" }}>
                      <div style={{ width: `${item.pct}%`, height: "100%", backgroundColor: item.color, borderRadius: 5 }} />
                    </div>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "12px",
                      backgroundColor: item.badgeBg,
                      color: item.color
                    }}>
                      {item.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VIOLATION ANALYTICS SECTION ── */}
      {analyticsSection === "violations" && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#2563eb" }} />
            <h2 style={reportStyles.sectionTitle}>Violations</h2>
          </div>

          {/* KPI CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
            <div style={reportStyles.cardSmall}>
              <p style={reportStyles.kpiLabel}>TOTAL VIOLATIONS (YTD)</p>
              <p style={reportStyles.kpiValue}>12,847</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", margin: 0 }}>▲ 2.5% vs last month</p>
            </div>
            <div style={reportStyles.cardSmall}>
              <p style={reportStyles.kpiLabel}>ISSUED THIS WEEK</p>
              <p style={reportStyles.kpiValue}>312</p>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>This month: 1,350</p>
            </div>
            <div style={reportStyles.cardSmall}>
              <p style={reportStyles.kpiLabel}>PEAK HOUR</p>
              <p style={reportStyles.kpiValue}>5:00–7:00 PM</p>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Most common: Speeding</p>
            </div>
          </div>

          {/* AMBER ALERT BANNER */}
          <div style={{
            backgroundColor: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "12px",
            padding: "16px 20px",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 20
          }}>
            <span style={{ fontSize: 18 }}>📍</span>
            <div>
              <strong style={{ color: "#92400e", fontSize: 14, display: "block" }}>
                Negombo Town Road has the highest violation density
              </strong>
              <p style={{ color: "#b45309", fontSize: 12, margin: "2px 0 0 0" }}>
                Colombo Fort (Main Rd) and Kurunegala Rd Terminal follow closely — consider targeted enforcement.
              </p>
            </div>
          </div>

          {/* 2-COLUMN GRID 1 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            {/* Violations by Area */}
            <div style={{ ...reportStyles.cardSmall, padding: 22 }}>
              <h3 style={reportStyles.subSectionTitle}>VIOLATIONS BY AREA</h3>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={violationAreaData}>
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1E2A3B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Violations by Type */}
            <div style={{ ...reportStyles.cardSmall, padding: 22 }}>
              <h3 style={reportStyles.subSectionTitle}>VIOLATIONS BY TYPE</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 6 }}>
                {violationTypeData.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 12, color: "#475569", width: 110, fontWeight: 600 }}>{item.label}</span>
                    <div style={{ flex: 1, height: 12, backgroundColor: "#f1f5f9", borderRadius: 6, overflow: "hidden" }}>
                      <div style={{ width: `${item.pct}%`, height: "100%", backgroundColor: "#d97706", borderRadius: 6 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", width: 45, textAlign: "right" }}>
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2-COLUMN GRID 2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Weekly / Yearly Trend */}
            <div style={{ ...reportStyles.cardSmall, padding: 22 }}>
              <h3 style={reportStyles.subSectionTitle}>WEEKLY / YEARLY TREND</h3>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyYearlyTrendData}>
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip />
                    <Bar dataKey="val" fill="#1E2A3B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Peak Hours Trend */}
            <div style={{ ...reportStyles.cardSmall, padding: 22 }}>
              <h3 style={reportStyles.subSectionTitle}>PEAK HOURS TREND</h3>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={peakHoursData}>
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="val" stroke="#d97706" fill="#d97706" fillOpacity={0.2} strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LONG TERM STRATEGIC TRENDS (ALWAYS VISIBLE) ── */}
      <div style={{ ...reportStyles.cardSmall, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 16 }}>📈</span>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>Long-term Strategic Trends</h3>
        </div>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={longTermStrategicData}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="accidents" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: "#ffffff", stroke: "#ef4444", strokeWidth: 2 }} name="Accidents" />
              <Line yAxisId="right" type="monotone" dataKey="violations" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: "#ffffff", stroke: "#3b82f6", strokeWidth: 2 }} name="Violations" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 12, fontSize: 12, fontWeight: 600 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#ef4444" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", border: "2px solid #ef4444", backgroundColor: "#ffffff" }} /> Accidents
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#3b82f6" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", border: "2px solid #3b82f6", backgroundColor: "#ffffff" }} /> Violations
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveAnalytics;
