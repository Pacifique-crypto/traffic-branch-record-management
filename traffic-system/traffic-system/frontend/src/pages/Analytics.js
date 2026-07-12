import React, { useState, useEffect, useRef } from "react";
import OICLayout from "../layouts/OICLayout";

// ── tiny recharts-free chart helpers ──────────────────────────────────────────

/** Simple SVG bar chart */
function BarChart({ data, color = "#3b82f6", height = 90 }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <svg viewBox={`0 0 ${data.length * 36} ${height}`} width="100%" style={{ overflow: "visible" }}>
      {data.map((d, i) => {
        const barH = (d.value / max) * (height - 20);
        const x = i * 36 + 4;
        const y = height - barH - 16;
        return (
          <g key={i}>
            <rect x={x} y={y} width={28} height={barH} rx={4} fill={color} opacity={0.85} />
            <text x={x + 14} y={height - 2} textAnchor="middle" fontSize={9} fill="#94a3b8">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Horizontal bar chart */
function HBarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "#64748b", width: "100px", textAlign: "right", flexShrink: 0 }}>{d.label}</span>
          <div style={{ flex: 1, background: "#f1f5f9", borderRadius: "4px", height: "14px", overflow: "hidden" }}>
            <div style={{ width: `${(d.value / max) * 100}%`, background: d.color || "#ef4444", height: "100%", borderRadius: "4px", transition: "width 0.6s ease" }} />
          </div>
          <span style={{ fontSize: "11px", color: "#374151", width: "32px" }}>{d.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Donut chart */
function DonutChart({ slices }) {
  const total = slices.reduce((s, d) => s + d.value, 0);
  let cumAngle = -90;
  const r = 40; const cx = 55; const cy = 55;
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
    return { d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, color: s.color, label: s.label, value: s.value };
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
      <svg viewBox="0 0 110 110" width={110} height={110}>
        {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} />)}
        <circle cx={cx} cy={cy} r={22} fill="white" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
            <span style={{ width: 10, height: 10, borderRadius: "2px", background: s.color, flexShrink: 0 }} />
            <span style={{ color: "#374151" }}>{s.label} <strong>{s.value}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Line chart */
function LineChart({ datasets, labels, height = 100 }) {
  const allVals = datasets.flatMap((d) => d.values);
  const max = Math.max(...allVals, 1);
  const min = Math.min(...allVals, 0);
  const range = max - min || 1;
  const W = 260; const H = height;
  const pts = (vals) => vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * (W - 20) + 10;
    const y = H - ((v - min) / range) * (H - 20) - 10;
    return `${x},${y}`;
  });
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: "visible" }}>
        {datasets.map((ds, di) => (
          <g key={di}>
            <polyline points={pts(ds.values).join(" ")} fill="none" stroke={ds.color} strokeWidth={2} strokeLinejoin="round" />
            <polygon
              points={`10,${H} ${pts(ds.values).join(" ")} ${W - 10},${H}`}
              fill={ds.color} opacity={0.08}
            />
          </g>
        ))}
        {labels.filter((_, i) => i % 2 === 0).map((l, i) => {
          const idx = i * 2;
          const x = (idx / (labels.length - 1)) * (W - 20) + 10;
          return <text key={i} x={x} y={H + 12} textAnchor="middle" fontSize={9} fill="#94a3b8">{l}</text>;
        })}
      </svg>
      <div style={{ display: "flex", gap: "12px", marginTop: "8px", justifyContent: "center" }}>
        {datasets.map((ds, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#64748b" }}>
            <span style={{ width: 20, height: 2, background: ds.color, display: "inline-block" }} />
            {ds.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Stat card */
function StatCard({ title, value, sub, trend, trendUp, icon, color }) {
  return (
    <div className="an-stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p className="an-stat-title">{title}</p>
          <p className="an-stat-value">{value}</p>
          <p className="an-stat-sub">{sub}</p>
        </div>
        <span style={{ fontSize: "20px" }}>{icon}</span>
      </div>
      {trend && (
        <p className={`an-stat-trend ${trendUp ? "trend-up" : "trend-down"}`}>
          {trendUp ? "↑" : "↓"} {trend}
        </p>
      )}
      {color && (
        <div style={{ marginTop: "8px", height: "3px", borderRadius: "2px", background: `linear-gradient(90deg, ${color}, transparent)` }} />
      )}
    </div>
  );
}

// ── TAB CONTENT ───────────────────────────────────────────────────────────────

function AccidentsTab() {
  return (
    <div className="an-grid">
      {/* Accidents by Location */}
      <div className="an-card">
        <p className="an-card-title">Accidents by Location</p>
        <BarChart
          color="#3b82f6"
          data={[
            { label: "Main St", value: 42 },
            { label: "Galle Rd", value: 35 },
            { label: "Colombo", value: 58 },
            { label: "Chilaw", value: 27 },
            { label: "Kandy", value: 19 },
            { label: "Puttalam", value: 33 },
          ]}
        />
      </div>

      {/* Accidents by Severity */}
      <div className="an-card">
        <p className="an-card-title">Accidents by Severity</p>
        <DonutChart slices={[
          { label: "Property Damage", value: 382, color: "#3b82f6" },
          { label: "Minor Injury",    value: 245, color: "#f59e0b" },
          { label: "Severe Injury",   value: 98,  color: "#ef4444" },
        ]} />
      </div>

      {/* Causes of Accidents */}
      <div className="an-card an-card-wide">
        <p className="an-card-title">Causes of Accidents</p>
        <HBarChart data={[
          { label: "Speeding",       value: 120, color: "#ef4444" },
          { label: "Drunk Driving",  value: 85,  color: "#f97316" },
          { label: "Signal Jump",    value: 64,  color: "#f59e0b" },
          { label: "Distraction",    value: 48,  color: "#3b82f6" },
          { label: "Weather",        value: 32,  color: "#8b5cf6" },
        ]} />
      </div>

      {/* Total Accidents */}
      <div className="an-card">
        <p className="an-card-title">Total Accidents</p>
        <p className="an-big-number">1,245 <span className="an-badge-red">+9%</span></p>
        <p style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "10px" }}>vs last month</p>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#374151" }}>
          <div><p style={{ color: "#94a3b8", fontSize: "10px" }}>Accidents</p><strong>892</strong></div>
          <div><p style={{ color: "#94a3b8", fontSize: "10px" }}>Fatalities</p><strong>23</strong></div>
          <div><p style={{ color: "#94a3b8", fontSize: "10px" }}>Avg/Day</p><strong>41</strong></div>
        </div>
      </div>

      {/* Time-Based Accidents */}
      <div className="an-card an-card-wide">
        <p className="an-card-title">Time-Based Accidents</p>
        <LineChart
          labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"]}
          datasets={[{ label: "Accidents", values: [80, 95, 70, 110, 88, 102, 95, 115, 90, 105], color: "#3b82f6" }]}
          height={90}
        />
      </div>
    </div>
  );
}

function ViolationsTab() {
  return (
    <div className="an-grid">
      {/* Big stat */}
      <div className="an-card">
        <p className="an-card-title">Total Violations</p>
        <p className="an-big-number">12,847 <span className="an-badge-green">+12.5%</span></p>
        <p style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "12px" }}>Past 31-JAN-Total</p>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#374151" }}>
          <div><p style={{ color: "#94a3b8", fontSize: "10px" }}>Today</p><strong>47</strong></div>
          <div><p style={{ color: "#94a3b8", fontSize: "10px" }}>This Week</p><strong>312</strong></div>
          <div><p style={{ color: "#94a3b8", fontSize: "10px" }}>This Month</p><strong>1,350</strong></div>
        </div>
        <div style={{ marginTop: "12px", fontSize: "11px", color: "#64748b" }}>
          <p>🕐 Peak Hour: 5:00 PM – 7:00 PM</p>
          <p style={{ marginTop: "4px" }}>⚠️ Most Common: Speeding</p>
        </div>
      </div>

      {/* Violations by Area heatmap */}
      <div className="an-card">
        <p className="an-card-title">Violations by Area</p>
        <div className="an-heatmap">
          {[
            { area: "Negombo Town", pct: 62, color: "#1e3a5f" },
            { area: "Colombo-Negombo Main Road", pct: 55, color: "#2563eb" },
            { area: "Koranwatte-Negombo Road", pct: 40, color: "#3b82f6" },
            { area: "Negombo Bus", pct: 35, color: "#60a5fa" },
            { area: "Kappara Junction", pct: 30, color: "#93c5fd" },
          ].map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <div style={{ flex: 1, background: a.color, borderRadius: "4px", padding: "4px 8px", color: "white", fontSize: "10px", fontWeight: 600 }}>
                {a.area}
              </div>
              <span style={{ fontSize: "10px", color: "#64748b" }}>{a.pct}%</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>
            <span>Low Density</span><span>High Density</span>
          </div>
        </div>
      </div>

      {/* Violations by Type */}
      <div className="an-card an-card-wide">
        <p className="an-card-title">Violations by Type</p>
        <HBarChart data={[
          { label: "Speeding",     value: 320, color: "#ef4444" },
          { label: "No Helmet",    value: 180, color: "#f97316" },
          { label: "Signal Jump",  value: 145, color: "#f59e0b" },
          { label: "Wrong Way",    value: 95,  color: "#3b82f6" },
          { label: "No Seat Belt", value: 88,  color: "#8b5cf6" },
          { label: "Parking",      value: 72,  color: "#06b6d4" },
        ]} />
      </div>
    </div>
  );
}

function TrendsTab() {
  return (
    <div className="an-grid">
      {/* Monthly Trend */}
      <div className="an-card an-card-wide">
        <p className="an-card-title">Monthly Trend — Accidents vs Violations over time</p>
        <LineChart
          labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]}
          datasets={[
            { label: "Violations", values: [320, 380, 290, 410, 360, 400, 390, 430, 370, 420, 395, 410], color: "#ef4444" },
            { label: "Accidents",  values: [80,  95,  70,  110, 88,  102, 95,  115, 90,  105, 98,  112], color: "#3b82f6" },
          ]}
          height={110}
        />
      </div>

      {/* Summary stats */}
      <div className="an-card">
        <p className="an-card-title">Total Incidents</p>
        <p className="an-big-number">1,300</p>
        <p className="an-stat-trend trend-up">↑ +5.4% vs last month</p>
        <div style={{ marginTop: "14px" }}>
          <p className="an-card-title">Accidents</p>
          <p style={{ fontSize: "22px", fontWeight: 700, color: "#1e293b" }}>648 <span style={{ fontSize: "12px", color: "#ef4444" }}>↓ -2.1% vs last month</span></p>
        </div>
        <div style={{ marginTop: "14px" }}>
          <p className="an-card-title">High Risk Areas</p>
          <p style={{ fontSize: "22px", fontWeight: 700, color: "#1e293b" }}>4 <span style={{ fontSize: "12px", color: "#22c55e" }}>↑ +1 from last month</span></p>
        </div>
      </div>

      {/* Yearly Comparison */}
      <div className="an-card">
        <p className="an-card-title">Yearly Comparison</p>
        <BarChart
          color="#1e3a5f"
          data={[
            { label: "2020", value: 980 },
            { label: "2021", value: 1050 },
            { label: "2022", value: 1120 },
            { label: "2023", value: 1180 },
            { label: "2024", value: 1245 },
          ]}
          height={100}
        />
        <p style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px", textAlign: "center" }}>+4.6% Year-on-Year</p>
      </div>

      {/* Peak Hours Trend */}
      <div className="an-card">
        <p className="an-card-title">Peak Hours Trend</p>
        <LineChart
          labels={["6AM", "8AM", "10AM", "12PM", "2PM", "4PM", "6PM", "8PM", "10PM"]}
          datasets={[{ label: "Incidents", values: [20, 85, 40, 55, 48, 90, 130, 75, 35], color: "#f59e0b" }]}
          height={90}
        />
      </div>
    </div>
  );
}

function InsightsTab() {
  const zones = [
    { name: "Negombo Junction",  score: 87, color: "#ef4444" },
    { name: "Colombo Fort",      score: 82, color: "#f97316" },
    { name: "Kappara Junction",  score: 58, color: "#f59e0b" },
  ];

  return (
    <div className="an-grid">
      {/* Total Incidents */}
      <div className="an-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p className="an-card-title">Total Incidents</p>
          <span style={{ fontSize: "18px" }}>⚠️</span>
        </div>
        <p className="an-big-number">1,247</p>
        <p className="an-stat-trend trend-up">↑ +12.5% vs last week</p>
        <div style={{ marginTop: "8px", height: "2px", background: "#fee2e2", borderRadius: "2px" }}>
          <div style={{ width: "72%", height: "100%", background: "#ef4444", borderRadius: "2px" }} />
        </div>
      </div>

      {/* Violations Issued */}
      <div className="an-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p className="an-card-title">Violations Issued</p>
          <span style={{ fontSize: "18px" }}>✅</span>
        </div>
        <p className="an-big-number">3,892</p>
        <p className="an-stat-trend trend-up">↑ +8.2% vs last week</p>
        <div style={{ marginTop: "8px", height: "2px", background: "#dcfce7", borderRadius: "2px" }}>
          <div style={{ width: "88%", height: "100%", background: "#22c55e", borderRadius: "2px" }} />
        </div>
      </div>

      {/* Alert */}
      <div className="an-card an-alert-card">
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <span style={{ fontSize: "20px" }}>ℹ️</span>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#92400e" }}>
              Accidents increased by 20% in Negombo this week
            </p>
            <p style={{ fontSize: "12px", color: "#78350f", marginTop: "4px" }}>
              Critical threshold exceeded. Immediate patrol reinforcement recommended in high-risk zones.
            </p>
          </div>
        </div>
      </div>

      {/* Top Danger Zones */}
      <div className="an-card an-card-wide">
        <p className="an-card-title" style={{ marginBottom: "14px" }}>TOP DANGER ZONES</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {zones.map((z, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "16px" }}>{i === 0 ? "🔴" : i === 1 ? "🟠" : "🟡"}</span>
              <span style={{ flex: 1, fontSize: "13px", fontWeight: 500, color: "#1e293b" }}>{z.name}</span>
              <span style={{ background: z.color, color: "white", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px" }}>
                Score:{z.score}/100
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MAIN ANALYTICS PAGE ───────────────────────────────────────────────────────

const TABS = ["Accidents", "Violations", "Trends", "Insights"];

function Analytics() {
  const [activeTab, setActiveTab] = useState("Accidents");

  return (
    <OICLayout>
      <div className="page-box">
        <h2 className="page-heading">Analytics</h2>

        {/* Tab bar */}
        <div className="an-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              className={`an-tab ${activeTab === t ? "an-tab-active" : ""}`}
              onClick={() => setActiveTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="an-content">
          {activeTab === "Accidents"   && <AccidentsTab />}
          {activeTab === "Violations"  && <ViolationsTab />}
          {activeTab === "Trends"      && <TrendsTab />}
          {activeTab === "Insights"    && <InsightsTab />}
        </div>
      </div>
    </OICLayout>
  );
}

export default Analytics;