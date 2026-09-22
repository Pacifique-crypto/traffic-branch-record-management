import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, AreaChart, Area, LineChart, Line, LabelList
} from "recharts";

import {
  // New Accident Analytics Datasets (Picture 2 & Picture 3)
  accidentSeverityByYearData,
  roadUsersInFatalAccidentsByYearData,
  fatalAccidentsByVehicleTypeData,
  accidentsByHourOfDayData,
  accidentsByDayOfWeekData,
  fatalAccidentsByDivisionData,
  // Violation & Strategic Datasets
  violationAreaData, violationTypeData, weeklyYearlyTrendData,
  peakHoursData, longTermStrategicData
} from "./mockData";
import { reportStyles } from "./reportStyles";

function LiveAnalytics({
  liveDatePreset, handleLivePresetChange,
  fromDate, setFromDate,
  toDate, setToDate,
  analyticsSection, setAnalyticsSection
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
            marginBottom: 24
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

          {/* ── PICTURE 2 CHARTS GRID ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            
            {/* Chart 1: ACCIDENT SEVERITY BY YEAR */}
            <div style={{ ...reportStyles.cardSmall, padding: 22 }}>
              <h3 style={reportStyles.subSectionTitle}>ACCIDENT SEVERITY BY YEAR</h3>
              <div style={{ height: 230 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={accidentSeverityByYearData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip />
                    <Bar dataKey="y2024" name="2024" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="y2025" name="2025" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="y2026" name="2026" fill="#1e293b" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 10, fontSize: 11, fontWeight: 700, color: "#64748b" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, backgroundColor: "#94a3b8", borderRadius: 2 }} /> 2024</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, backgroundColor: "#3b82f6", borderRadius: 2 }} /> 2025</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, backgroundColor: "#1e293b", borderRadius: 2 }} /> 2026</span>
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 6, fontSize: 11, color: "#64748b" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#ef4444" }} /> Fatal</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#16a34a" }} /> Serious Injury</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#34d399" }} /> Slight Injury</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#eab308" }} /> No Injury</span>
              </div>
            </div>

            {/* Chart 2: ROAD USERS IN FATAL ACCIDENTS BY YEAR */}
            <div style={{ ...reportStyles.cardSmall, padding: 22 }}>
              <h3 style={reportStyles.subSectionTitle}>ROAD USERS IN FATAL ACCIDENTS BY YEAR</h3>
              <div style={{ height: 230 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roadUsersInFatalAccidentsByYearData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <XAxis dataKey="group" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip />
                    <Bar dataKey="y2024" name="2024" fill="#2563eb" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="y2025" name="2025" fill="#16a34a" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="y2026" name="2026" fill="#db2777" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 10, fontSize: 11, fontWeight: 700, color: "#64748b" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, backgroundColor: "#2563eb", borderRadius: 2 }} /> 2024</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, backgroundColor: "#16a34a", borderRadius: 2 }} /> 2025</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, backgroundColor: "#db2777", borderRadius: 2 }} /> 2026</span>
              </div>
            </div>

            {/* Chart 3: FATAL ACCIDENTS BY VEHICLE TYPE */}
            <div style={{ ...reportStyles.cardSmall, padding: 22 }}>
              <h3 style={reportStyles.subSectionTitle}>FATAL ACCIDENTS BY VEHICLE TYPE</h3>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 240 }}>
                <div style={{ width: 200, height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={fatalAccidentsByVehicleTypeData} dataKey="value" innerRadius={0} outerRadius={85} paddingAngle={1}>
                        {fatalAccidentsByVehicleTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, paddingLeft: 20 }}>
                  {fatalAccidentsByVehicleTypeData.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: item.color }} />
                        <span style={{ color: "#475569", fontWeight: 500 }}>{item.name}</span>
                      </div>
                      <strong style={{ color: "#0f172a", fontFamily: "monospace", fontSize: 13 }}>{item.value.toLocaleString()}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart 4: ACCIDENTS BY HOUR OF DAY */}
            <div style={{ ...reportStyles.cardSmall, padding: 22, position: "relative" }}>
              <h3 style={reportStyles.subSectionTitle}>ACCIDENTS BY HOUR OF DAY</h3>
              <div style={{ height: 210, marginTop: 10 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={accidentsByHourOfDayData} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} domain={[0, 4000]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="accidents" stroke="#1e293b" fill="#f1f5f9" fillOpacity={0.6} strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {/* Peak indicator overlay badge */}
              <div style={{
                position: "absolute",
                top: 75,
                left: "48%",
                backgroundColor: "#ffffff",
                border: "1px solid #cbd5e1",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "11px",
                color: "#1e293b",
                pointerEvents: "none"
              }}>
                <strong style={{ display: "block" }}>1500</strong>
                <span style={{ color: "#64748b" }}>Accidents : 3,140</span>
              </div>

              <p style={{ textAlign: "center", fontSize: 11, color: "#64748b", fontWeight: 600, margin: "8px 0 0 0" }}>
                Peak: 1600–1800 hrs
              </p>
            </div>

          </div>

          {/* ── PICTURE 3 CHARTS GRID ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            
            {/* Chart 5: ACCIDENTS BY DAY OF WEEK */}
            <div style={{ ...reportStyles.cardSmall, padding: 22 }}>
              <h3 style={reportStyles.subSectionTitle}>ACCIDENTS BY DAY OF WEEK</h3>
              <div style={{ height: 230, marginTop: 10 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={accidentsByDayOfWeekData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} domain={[3800, 5200]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#dc2626"
                      strokeWidth={2.5}
                      dot={{ r: 5, fill: "#dc2626", stroke: "#ffffff", strokeWidth: 2 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 6: FATAL ACCIDENTS BY DIVISION / AREA */}
            <div style={{ ...reportStyles.cardSmall, padding: 22 }}>
              <h3 style={reportStyles.subSectionTitle}>FATAL ACCIDENTS BY DIVISION / AREA</h3>
              <div style={{ height: 230, marginTop: 10 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fatalAccidentsByDivisionData} margin={{ top: 20, right: 5, left: -25, bottom: 45 }}>
                    <XAxis
                      dataKey="division"
                      tick={{ fontSize: 9, fill: "#64748b", angle: -45, textAnchor: "end" }}
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} domain={[0, 160]} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1e293b" radius={[2, 2, 0, 0]}>
                      <LabelList dataKey="count" position="top" style={{ fontSize: "8px", fill: "#475569", fontWeight: 700 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
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
