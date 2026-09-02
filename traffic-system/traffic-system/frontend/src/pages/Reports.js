import React, { useState, useEffect } from "react";
import OICLayout from "../layouts/OICLayout";
import {
  FiPrinter, FiDownload, FiCheckSquare, FiAlertTriangle, FiFileText, FiX,
  FiCalendar, FiShield, FiMapPin, FiPlay, FiEye, FiClock, FiCheck, FiFilter,
  FiRotateCw, FiGrid, FiLayers, FiAlertCircle, FiCheckCircle, FiChevronRight, FiList
} from "react-icons/fi";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, AreaChart, Area, LineChart, Line, Legend
} from "recharts";
import { getAccidents, getViolations } from "../api";

// ── Initial Mock Data ────────────────────────────────────────────────────────

const accidentLocationData = [
  { label: "Negombo Jn", value: 85 },
  { label: "Colombo Fort", value: 72 },
  { label: "Koppara Jn", value: 60 },
  { label: "Kandy Rd", value: 45 },
  { label: "Airport Rd", value: 30 },
];

const accidentSeverityData = [
  { name: "Property Damage", value: 52, color: "#64748b", pct: "52%" },
  { name: "Minor Injury", value: 28, color: "#f59e0b", pct: "28%" },
  { name: "Major Injury", value: 14, color: "#f97316", pct: "14%" },
  { name: "Fatal", value: 6, color: "#ef4444", pct: "6%" },
];

const monthlyTrendData = [
  { month: "Jan", val: 820 },
  { month: "Feb", val: 845 },
  { month: "Mar", val: 870 },
  { month: "Apr", val: 920 },
  { month: "May", val: 980 },
  { month: "Jun", val: 1100 },
  { month: "Jul", val: 1245 },
];

const violationAreaData = [
  { label: "Negombo Town", value: 3280 },
  { label: "Colombo Fort", value: 2740 },
  { label: "Kurunegala Terminal", value: 1980 },
  { label: "Kandy Rd", value: 1420 },
];

const violationTypeData = [
  { label: "Speeding", value: 3850, pct: 100 },
  { label: "No Helmet", value: 3200, pct: 83 },
  { label: "Signal Jump", value: 2450, pct: 63 },
  { label: "Illegal Parking", value: 1980, pct: 51 },
  { label: "No License", value: 1367, pct: 35 },
];

const weeklyYearlyTrendData = [
  { year: "2021", val: 7200 },
  { year: "2022", val: 8400 },
  { year: "2023", val: 9100 },
  { year: "2024", val: 10800 },
  { year: "2025", val: 11900 },
  { year: "2026", val: 12847 },
];

const peakHoursData = [
  { time: "6am", val: 150 },
  { time: "9am", val: 420 },
  { time: "12pm", val: 520 },
  { time: "3pm", val: 680 },
  { time: "6pm", val: 890 },
  { time: "9pm", val: 320 },
];

const longTermStrategicData = [
  { month: "Jan", accidents: 820, violations: 9800 },
  { month: "Feb", accidents: 845, violations: 10100 },
  { month: "Mar", accidents: 870, violations: 10400 },
  { month: "Apr", accidents: 920, violations: 10900 },
  { month: "May", accidents: 980, violations: 11400 },
  { month: "Jun", accidents: 1100, violations: 12200 },
  { month: "Jul", accidents: 1245, violations: 12847 },
];

const initialArchiveRecords = [
  {
    id: "RPT-2026-0891",
    title: "Monthly Accident Matrix Report",
    category: "Accidents",
    categoryColor: "#ef4444",
    type: "AUTO",
    period: "08/01/2026 — 08/31/2026",
    generated: "01 Sep 2026, 00:00 AM",
    by: "System (Auto)",
    status: "Completed",
    size: "284 KB",
    filterData: { category: "accidents", vehicles: ["Motor Car", "Van", "Bus", "Lorry", "Three-Wheeler", "Motorcycle", "Bicycle"] }
  },
  {
    id: "RPT-2026-0890",
    title: "Monthly Violation Density Report",
    category: "Violations",
    categoryColor: "#3b82f6",
    type: "AUTO",
    period: "08/01/2026 — 08/31/2026",
    generated: "01 Sep 2026, 00:00 AM",
    by: "System (Auto)",
    status: "Completed",
    size: "312 KB",
    filterData: { category: "violations", vehicles: ["Motor Car", "Van", "Bus", "Lorry", "Three-Wheeler", "Motorcycle", "Bicycle"] }
  },
  {
    id: "RPT-NB-726306",
    title: "Executive Summary Division Report",
    category: "Both",
    categoryColor: "#8b5cf6",
    type: "MANUAL",
    period: "06/30/2026 — 07/12/2026",
    generated: "02 Sep 2026, 09:14 AM",
    by: "PS Perera",
    status: "Completed",
    size: "410 KB",
    filterData: { category: "both", vehicles: ["Motor Car", "Van", "Bus", "Lorry", "Three-Wheeler", "Motorcycle", "Bicycle"] }
  },
  {
    id: "RPT-2026-0842",
    title: "Custom High Speed Corridor Audit",
    category: "Violations",
    categoryColor: "#3b82f6",
    type: "MANUAL",
    period: "07/01/2026 — 07/15/2026",
    generated: "16 Jul 2026, 14:30 PM",
    by: "PS Perera",
    status: "Completed",
    size: "195 KB",
    filterData: { category: "violations", vehicles: ["Motor Car", "Motorcycle", "Three-Wheeler"] }
  },
  {
    id: "RPT-2026-0799",
    title: "Night Duty Incident Summary",
    category: "Accidents",
    categoryColor: "#ef4444",
    type: "MANUAL",
    period: "06/01/2026 — 06/30/2026",
    generated: "01 Jul 2026, 08:22 AM",
    by: "PS Perera",
    status: "Failed",
    size: "0 KB",
    filterData: { category: "accidents", vehicles: ["Motor Car", "Van", "Lorry"] }
  }
];

const vehicleList = [
  { name: "Motor Car", emoji: "🚗" },
  { name: "Van", emoji: "🚐" },
  { name: "Bus", emoji: "🚌" },
  { name: "Lorry", emoji: "🚛" },
  { name: "Three-Wheeler", emoji: "🛺" },
  { name: "Motorcycle", emoji: "🏍" },
  { name: "Bicycle", emoji: "🚲" },
];

function Reports() {
  const officer = JSON.parse(localStorage.getItem("officer") || "{}");
  const officerName = officer.fullName || officer.name || "PS Perera";
  const badgeNo = officer.policeId || "256 556 656";

  // ── Top Level Tabs ──
  const [topTab, setTopTab] = useState("live"); // "live" | "scheduled"

  // ── Live Analytics State ──
  const [liveDatePreset, setLiveDatePreset] = useState("Custom");
  const [fromDate, setFromDate] = useState("06/30/2026");
  const [toDate, setToDate] = useState("07/12/2026");
  const [analyticsSection, setAnalyticsSection] = useState("violations"); // "accidents" | "violations"

  // ── Scheduled Reports State ──
  const [autoAccidentsEnabled, setAutoAccidentsEnabled] = useState(true);
  const [autoViolationsEnabled, setAutoViolationsEnabled] = useState(true);
  const [runningReportId, setRunningReportId] = useState(null);

  // ── Custom Report Form State ──
  const [customCategory, setCustomCategory] = useState("both"); // "accidents" | "violations" | "both"
  const [customDatePreset, setCustomDatePreset] = useState("Last 2 weeks");
  const [customFromDate, setCustomFromDate] = useState("06/30/2026");
  const [customToDate, setCustomToDate] = useState("07/12/2026");

  const [accidentSeverities, setAccidentSeverities] = useState(["Deaths", "Major Injuries", "Minor Injuries", "Property Damage"]);
  const [accidentCauses, setAccidentCauses] = useState(["Excessive Speed", "Illegal Overtaking", "Reckless Driving", "Failure to Keep Left"]);
  
  const [violationActions, setViolationActions] = useState(["Judicial Cases (Court)", "Fine-based Offences", "Warnings"]);
  const [violationCauses, setViolationCauses] = useState(["Speeding", "No Helmet", "Signal Jump", "Illegal Parking", "No License"]);

  const [selectedVehicles, setSelectedVehicles] = useState(["Motor Car", "Van", "Bus", "Lorry", "Three-Wheeler", "Motorcycle", "Bicycle"]);

  const [isCustomGenerating, setIsCustomGenerating] = useState(false);

  // ── Archive & Modal State ──
  const [archive, setArchive] = useState(initialArchiveRecords);
  const [archiveFilter, setArchiveFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState("accidents");
  const [activeModalReport, setActiveModalReport] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  // Handle Preset Date selection
  const handleLivePresetChange = (preset) => {
    setLiveDatePreset(preset);
    if (preset === "Today") {
      setFromDate("07/12/2026"); setToDate("07/12/2026");
    } else if (preset === "This Week") {
      setFromDate("07/06/2026"); setToDate("07/12/2026");
    } else if (preset === "This Month") {
      setFromDate("07/01/2026"); setToDate("07/12/2026");
    } else {
      setFromDate("06/30/2026"); setToDate("07/12/2026");
    }
  };

  const handleCustomPresetChange = (preset) => {
    setCustomDatePreset(preset);
    if (preset === "Last 7 days") {
      setCustomFromDate("07/05/2026"); setCustomToDate("07/12/2026");
    } else if (preset === "Last 2 weeks") {
      setCustomFromDate("06/30/2026"); setCustomToDate("07/12/2026");
    } else if (preset === "Last 30 days") {
      setCustomFromDate("06/12/2026"); setCustomToDate("07/12/2026");
    } else if (preset === "Last 90 days") {
      setCustomFromDate("04/12/2026"); setCustomToDate("07/12/2026");
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Run Now handler for Monthly Reports
  const handleRunMonthlyReport = (type) => {
    setRunningReportId(type);
    setTimeout(() => {
      setRunningReportId(null);
      const newId = `RPT-2026-0${Math.floor(892 + Math.random() * 100)}`;
      const newRecord = {
        id: newId,
        title: type === "accidents" ? "Monthly Accident Report" : "Monthly Violation Report",
        category: type === "accidents" ? "Accidents" : "Violations",
        categoryColor: type === "accidents" ? "#ef4444" : "#3b82f6",
        type: "AUTO",
        period: "09/01/2026 — 09/30/2026",
        generated: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) + ", 10:00 AM",
        by: "System (Manual Trigger)",
        status: "Completed",
        size: "320 KB",
        filterData: { category: type, vehicles: ["Motor Car", "Van", "Bus", "Lorry", "Three-Wheeler", "Motorcycle", "Bicycle"] }
      };
      setArchive([newRecord, ...archive]);
      showToast(`✅ ${newRecord.title} (${newId}) generated successfully and archived.`);
    }, 2000);
  };

  // Generate Custom Report Handler
  const handleGenerateCustomReport = () => {
    if (selectedVehicles.length === 0) {
      alert("Please select at least one vehicle type for the matrix report.");
      return;
    }
    setIsCustomGenerating(true);
    setTimeout(() => {
      setIsCustomGenerating(false);
      const newId = `RPT-NB-${Math.floor(700000 + Math.random() * 90000)}`;
      const catTitle = customCategory === "accidents" ? "Custom Accident Matrix" : customCategory === "violations" ? "Custom Violation Matrix" : "Custom Summary Report";
      const catColor = customCategory === "accidents" ? "#ef4444" : customCategory === "violations" ? "#3b82f6" : "#8b5cf6";
      const catLabel = customCategory === "accidents" ? "Accidents" : customCategory === "violations" ? "Violations" : "Both";

      const newRecord = {
        id: newId,
        title: catTitle,
        category: catLabel,
        categoryColor: catColor,
        type: "MANUAL",
        period: `${customFromDate} — ${customToDate}`,
        generated: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) + ", " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        by: officerName,
        status: "Completed",
        size: "265 KB",
        filterData: { category: customCategory, vehicles: selectedVehicles }
      };
      setArchive([newRecord, ...archive]);
      showToast(`🎉 Custom Report ${newId} compiled successfully!`);
      setActiveModalReport(newRecord);
      setModalTab(customCategory === "violations" ? "violations" : "accidents");
      setIsModalOpen(true);
    }, 2000);
  };

  // Open Modal Helper
  const openModalForReport = (reportRecord) => {
    setActiveModalReport(reportRecord);
    if (reportRecord && reportRecord.category === "Violations") {
      setModalTab("violations");
    } else {
      setModalTab("accidents");
    }
    setIsModalOpen(true);
  };

  // Toggle Vehicle selection
  const toggleVehicle = (vName) => {
    if (selectedVehicles.includes(vName)) {
      setSelectedVehicles(selectedVehicles.filter(v => v !== vName));
    } else {
      setSelectedVehicles([...selectedVehicles, vName]);
    }
  };

  const toggleAllVehicles = () => {
    if (selectedVehicles.length === vehicleList.length) {
      setSelectedVehicles([]);
    } else {
      setSelectedVehicles(vehicleList.map(v => v.name));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    alert("Exporting official PDF report document to downloads...");
  };

  // Filtered Archive Records
  const filteredArchive = archive.filter(item => {
    if (archiveFilter === "Auto") return item.type === "AUTO";
    if (archiveFilter === "Manual") return item.type === "MANUAL";
    return true;
  });

  return (
    <OICLayout>
      <div style={{ fontFamily: "Inter, sans-serif", color: "#1e293b" }}>

        {/* TOAST NOTICE */}
        {toastMessage && (
          <div style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 10000,
            backgroundColor: "#0f172a",
            color: "#ffffff",
            padding: "14px 22px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 600,
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            border: "1px solid #3b82f6"
          }}>
            <FiCheckCircle size={18} color="#10b981" />
            {toastMessage}
          </div>
        )}

        {/* PAGE HEADER & TOP SWITCHER */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>
            Reports & Analytics
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
            Live accident & violation analytics below — set a report type and date range, then generate a formatted report to export or print
          </p>

          {/* TOP PILL SWITCHER TABS */}
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button
              onClick={() => setTopTab("live")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 18px",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: topTab === "live" ? "#cbd5e1" : "#e2e8f0",
                backgroundColor: topTab === "live" ? "#ffffff" : "#f1f5f9",
                color: topTab === "live" ? "#0f172a" : "#64748b",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: topTab === "live" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
              }}
            >
              📊 Live Analytics
            </button>
            <button
              onClick={() => setTopTab("scheduled")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 18px",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: topTab === "scheduled" ? "#cbd5e1" : "#e2e8f0",
                backgroundColor: topTab === "scheduled" ? "#ffffff" : "#f1f5f9",
                color: topTab === "scheduled" ? "#0f172a" : "#64748b",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: topTab === "scheduled" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
              }}
            >
              🗓 Scheduled Reports
              <span style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontSize: "10px",
                fontWeight: 800,
                padding: "2px 7px",
                borderRadius: "12px",
                letterSpacing: "0.5px"
              }}>
                AUTO
              </span>
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 1: LIVE ANALYTICS
           ════════════════════════════════════════════════════════════════════ */}
        {topTab === "live" && (
          <div>
            {/* CONTROLS CARD */}
            <div style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "20px 24px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              marginBottom: 24,
              border: "1px solid #e2e8f0"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px", margin: "0 0 8px 0" }}>
                    DATE RANGE SELECTION
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
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
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "9px 16px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      backgroundColor: "#ffffff",
                      color: "#334155",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    <FiPrinter size={15} /> Print
                  </button>
                  <button
                    onClick={handleExportPDF}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "9px 16px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      backgroundColor: "#ffffff",
                      color: "#334155",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    <FiDownload size={15} /> Export
                  </button>
                  <button
                    onClick={() => {
                      setActiveModalReport({
                        id: "RPT-NB-726306",
                        title: "Summary Report",
                        category: "Both",
                        period: `${fromDate} — ${toDate}`,
                        generated: "02 September 2026",
                        by: officerName
                      });
                      setIsModalOpen(true);
                    }}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#1E2A3B",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(15,23,42,0.2)"
                    }}
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
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>Accident Analytics</h2>
                </div>

                {/* KPI CARDS */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
                  <div style={{ backgroundColor: "#ffffff", padding: "20px 22px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", margin: 0 }}>TOTAL ACCIDENTS</p>
                    <p style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", margin: "6px 0 2px 0" }}>1,245</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", margin: 0 }}>▲ 8.2% vs last period</p>
                  </div>
                  <div style={{ backgroundColor: "#ffffff", padding: "20px 22px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", margin: 0 }}>HIGH RISK ZONES</p>
                    <p style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", margin: "6px 0 2px 0" }}>4</p>
                    <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Zones above threshold</p>
                  </div>
                  <div style={{ backgroundColor: "#ffffff", padding: "20px 22px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", margin: 0 }}>PEAK TIME</p>
                    <p style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", margin: "6px 0 2px 0" }}>5–7 PM</p>
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
                  <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <h3 style={{ fontSize: 12, fontWeight: 800, color: "#475569", letterSpacing: "0.5px", margin: "0 0 16px 0" }}>
                      ACCIDENTS BY LOCATION
                    </h3>
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
                  <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <h3 style={{ fontSize: 12, fontWeight: 800, color: "#475569", letterSpacing: "0.5px", margin: "0 0 16px 0" }}>
                      ACCIDENTS BY SEVERITY
                    </h3>
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
                  <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <h3 style={{ fontSize: 12, fontWeight: 800, color: "#475569", letterSpacing: "0.5px", margin: "0 0 16px 0" }}>
                      MONTHLY TREND
                    </h3>
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
                  <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <h3 style={{ fontSize: 12, fontWeight: 800, color: "#475569", letterSpacing: "0.5px", margin: "0 0 16px 0" }}>
                      TOP DANGER ZONES
                    </h3>
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
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>Violations</h2>
                </div>

                {/* KPI CARDS */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
                  <div style={{ backgroundColor: "#ffffff", padding: "20px 22px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", margin: 0 }}>TOTAL VIOLATIONS (YTD)</p>
                    <p style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", margin: "6px 0 2px 0" }}>12,847</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", margin: 0 }}>▲ 2.5% vs last month</p>
                  </div>
                  <div style={{ backgroundColor: "#ffffff", padding: "20px 22px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", margin: 0 }}>ISSUED THIS WEEK</p>
                    <p style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", margin: "6px 0 2px 0" }}>312</p>
                    <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>This month: 1,350</p>
                  </div>
                  <div style={{ backgroundColor: "#ffffff", padding: "20px 22px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", margin: 0 }}>PEAK HOUR</p>
                    <p style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", margin: "6px 0 2px 0" }}>5:00–7:00 PM</p>
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
                  <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <h3 style={{ fontSize: 12, fontWeight: 800, color: "#475569", letterSpacing: "0.5px", margin: "0 0 16px 0" }}>
                      VIOLATIONS BY AREA
                    </h3>
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
                  <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <h3 style={{ fontSize: 12, fontWeight: 800, color: "#475569", letterSpacing: "0.5px", margin: "0 0 16px 0" }}>
                      VIOLATIONS BY TYPE
                    </h3>
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
                  <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <h3 style={{ fontSize: 12, fontWeight: 800, color: "#475569", letterSpacing: "0.5px", margin: "0 0 16px 0" }}>
                      WEEKLY / YEARLY TREND
                    </h3>
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
                  <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <h3 style={{ fontSize: 12, fontWeight: 800, color: "#475569", letterSpacing: "0.5px", margin: "0 0 16px 0" }}>
                      PEAK HOURS TREND
                    </h3>
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
            <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
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
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2: SCHEDULED REPORTS
           ════════════════════════════════════════════════════════════════════ */}
        {topTab === "scheduled" && (
          <div>
            {/* SECTION 1: COMPULSORY MONTHLY REPORTS */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
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
                  <FiRotateCw size={13} /> Next auto-run: Sep 1, 2026
                </span>
              </div>

              {/* TWO CARDS SIDE BY SIDE */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Monthly Accident Report Card */}
                <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ backgroundColor: "#fee2e2", color: "#dc2626", fontSize: "11px", fontWeight: 800, padding: "3px 10px", borderRadius: "12px" }}>
                      ● ACCIDENTS
                    </span>
                    {/* SVG Countdown ring */}
                    <div style={{ width: 44, height: 44, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="44" height="44" viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#2563eb" strokeWidth="3" strokeDasharray="80, 100" />
                      </svg>
                      <span style={{ position: "absolute", fontSize: "11px", fontWeight: 800, color: "#1e293b" }}>6d</span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "10px 0 2px 0" }}>Monthly Accident Report</h3>
                  <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Monthly · Vehicles × Accident Types</p>

                  <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 16, paddingTop: 14, display: "flex", gap: 20, fontSize: 12 }}>
                    <div><span style={{ color: "#94a3b8", display: "block", fontSize: 10, fontWeight: 700 }}>LAST RUN</span><strong style={{ color: "#334155" }}>Aug 1, 2026</strong></div>
                    <div><span style={{ color: "#94a3b8", display: "block", fontSize: 10, fontWeight: 700 }}>NEXT RUN</span><strong style={{ color: "#334155" }}>Sep 1, 2026</strong></div>
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
                        onClick={() => openModalForReport(archive[0])}
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
                <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ backgroundColor: "#dbeafe", color: "#2563eb", fontSize: "11px", fontWeight: 800, padding: "3px 10px", borderRadius: "12px" }}>
                      ● VIOLATIONS
                    </span>
                    {/* SVG Countdown ring */}
                    <div style={{ width: 44, height: 44, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="44" height="44" viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#2563eb" strokeWidth="3" strokeDasharray="80, 100" />
                      </svg>
                      <span style={{ position: "absolute", fontSize: "11px", fontWeight: 800, color: "#1e293b" }}>6d</span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "10px 0 2px 0" }}>Monthly Violation Report</h3>
                  <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Monthly · Vehicles × Violation Types</p>

                  <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 16, paddingTop: 14, display: "flex", gap: 20, fontSize: 12 }}>
                    <div><span style={{ color: "#94a3b8", display: "block", fontSize: 10, fontWeight: 700 }}>LAST RUN</span><strong style={{ color: "#334155" }}>Aug 1, 2026</strong></div>
                    <div><span style={{ color: "#94a3b8", display: "block", fontSize: 10, fontWeight: 700 }}>NEXT RUN</span><strong style={{ color: "#334155" }}>Sep 1, 2026</strong></div>
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
                        onClick={() => openModalForReport(archive[1] || archive[0])}
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

            {/* SECTION 2: REQUEST A CUSTOM REPORT */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: 26, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", marginBottom: 28 }}>
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
                    padding: "12px 28px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#1E2A3B",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(15,23,42,0.25)",
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

            {/* SECTION 3: REPORT ARCHIVE */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 2px 0" }}>Report Archive</h3>
                  <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>View, download, or inspect generated snapshot documents</p>
                </div>

                {/* Filter Tabs */}
                <div style={{ display: "flex", gap: 6, backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "8px" }}>
                  {["All", "Auto", "Manual"].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setArchiveFilter(tab)}
                      style={{
                        padding: "4px 14px",
                        borderRadius: "6px",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        backgroundColor: archiveFilter === tab ? "#ffffff" : "transparent",
                        color: archiveFilter === tab ? "#0f172a" : "#64748b",
                        boxShadow: archiveFilter === tab ? "0 1px 2px rgba(0,0,0,0.08)" : "none"
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* ARCHIVE TABLE */}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px", fontSize: "11px", color: "#64748b", fontWeight: 700 }}>REPORT ID</th>
                    <th style={{ padding: "10px 12px", fontSize: "11px", color: "#64748b", fontWeight: 700 }}>TITLE</th>
                    <th style={{ padding: "10px 12px", fontSize: "11px", color: "#64748b", fontWeight: 700 }}>CATEGORY</th>
                    <th style={{ padding: "10px 12px", fontSize: "11px", color: "#64748b", fontWeight: 700 }}>TYPE</th>
                    <th style={{ padding: "10px 12px", fontSize: "11px", color: "#64748b", fontWeight: 700 }}>PERIOD</th>
                    <th style={{ padding: "10px 12px", fontSize: "11px", color: "#64748b", fontWeight: 700 }}>GENERATED</th>
                    <th style={{ padding: "10px 12px", fontSize: "11px", color: "#64748b", fontWeight: 700 }}>BY</th>
                    <th style={{ padding: "10px 12px", fontSize: "11px", color: "#64748b", fontWeight: 700 }}>STATUS</th>
                    <th style={{ padding: "10px 12px", fontSize: "11px", color: "#64748b", fontWeight: 700, textAlign: "right" }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArchive.map(item => (
                    <tr
                      key={item.id}
                      style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <td style={{ padding: "12px", fontFamily: "monospace", fontWeight: 700, color: "#1e293b" }}>{item.id}</td>
                      <td style={{ padding: "12px", fontWeight: 700, color: "#0f172a" }}>{item.title}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: item.categoryColor }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: item.categoryColor }} />
                          {item.category}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          fontSize: "10px",
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: "10px",
                          backgroundColor: item.type === "AUTO" ? "#f3e8ff" : "#dcfce7",
                          color: item.type === "AUTO" ? "#7e22ce" : "#15803d"
                        }}>
                          {item.type}
                        </span>
                      </td>
                      <td style={{ padding: "12px", color: "#475569", fontSize: 12 }}>{item.period}</td>
                      <td style={{ padding: "12px", color: "#475569", fontSize: 12 }}>{item.generated}</td>
                      <td style={{ padding: "12px", color: "#475569", fontSize: 12 }}>{item.by}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "12px",
                          backgroundColor: item.status === "Completed" ? "#dcfce7" : item.status === "Processing" ? "#dbeafe" : "#fee2e2",
                          color: item.status === "Completed" ? "#16a34a" : item.status === "Processing" ? "#2563eb" : "#ef4444"
                        }}>
                          ● {item.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                          <button
                            onClick={() => openModalForReport(item)}
                            style={{
                              padding: "5px 12px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              backgroundColor: "#ffffff",
                              color: "#1e293b",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            View
                          </button>
                          <button
                            onClick={handleExportPDF}
                            style={{
                              padding: "5px 10px",
                              borderRadius: "6px",
                              border: "none",
                              backgroundColor: "#f1f5f9",
                              color: "#475569",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            PDF ({item.size})
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
                <button style={{ background: "none", border: "1px solid #cbd5e1", padding: "8px 20px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, color: "#475569", cursor: "pointer" }}>
                  Load older records
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            GENERATE REPORT MODAL (DOCUMENT OVERLAY)
           ════════════════════════════════════════════════════════════════════ */}
        {isModalOpen && (
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
                    {activeModalReport?.title || "Summary Report"}
                  </h3>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0 0" }}>
                    Ref: {activeModalReport?.id || "RPT-NB-726306"} · {activeModalReport?.generated || "02 September 2026"} · Negombo Division
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, borderBottom: "2px solid #0f172a", paddingBottom: 20 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", letterSpacing: "1px" }}>
                    SRI LANKA POLICE — TRAFFIC BRANCH, NEGOMBO DIVISION
                  </span>
                  <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", margin: "4px 0" }}>
                    {activeModalReport?.title || "Summary Report"}
                  </h1>
                  <p style={{ fontSize: 13, color: "#475569", margin: 0, fontWeight: 600 }}>
                    Period: {activeModalReport?.period || `${fromDate} — ${toDate}`}
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
                    marginBottom: 8
                  }}>
                    OFFICIAL DOCUMENT
                  </div>
                  <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0" }}>Generated: {activeModalReport?.generated || "02 September 2026"}</p>
                  <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0" }}>Officer: {officerName} · {badgeNo}</p>
                  <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0", fontFamily: "monospace", fontWeight: 700 }}>Ref: {activeModalReport?.id || "RPT-NB-726306"}</p>
                </div>
              </div>

              {/* MODAL TABS / INDICATORS */}
              <div style={{ display: "flex", gap: 16, borderBottom: "1px solid #e2e8f0", paddingBottom: 12, marginBottom: 20 }}>
                <button
                  onClick={() => setModalTab("accidents")}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "14px",
                    fontWeight: 800,
                    color: modalTab === "accidents" ? "#ef4444" : "#94a3b8",
                    cursor: "pointer",
                    borderBottom: modalTab === "accidents" ? "3px solid #ef4444" : "none",
                    paddingBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#ef4444" }} /> Accidents
                </button>
                <button
                  onClick={() => setModalTab("violations")}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "14px",
                    fontWeight: 800,
                    color: modalTab === "violations" ? "#2563eb" : "#94a3b8",
                    cursor: "pointer",
                    borderBottom: modalTab === "violations" ? "3px solid #2563eb" : "none",
                    paddingBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#2563eb" }} /> Violations
                </button>
              </div>

              {/* VEHICLE FILTER BANNER */}
              <div style={{ backgroundColor: "#f8fafc", padding: "10px 16px", borderRadius: "8px", fontSize: 12, color: "#475569", marginBottom: 20, border: "1px solid #f1f5f9" }}>
                <strong>VEHICLES:</strong> {(activeModalReport?.filterData?.vehicles || selectedVehicles).join(" · ")}
              </div>

              {/* MATRIX TABLE: ACCIDENTS */}
              {modalTab === "accidents" && (
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 800, color: "#475569", letterSpacing: "0.5px", margin: "0 0 12px 0" }}>
                    ACCIDENT SUMMARY — BY TYPE & VEHICLE
                  </h4>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", textTransform: "uppercase" }}>
                        <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, color: "#64748b" }}>OFFENCE / ACCIDENT TYPE</th>
                        <th style={{ padding: "12px", textAlign: "center", fontSize: 11, color: "#64748b" }}>MOTOR CAR</th>
                        <th style={{ padding: "12px", textAlign: "center", fontSize: 11, color: "#64748b" }}>VAN</th>
                        <th style={{ padding: "12px", textAlign: "center", fontSize: 11, color: "#64748b" }}>BUS</th>
                        <th style={{ padding: "12px", textAlign: "center", fontSize: 11, color: "#64748b" }}>LORRY</th>
                        <th style={{ padding: "12px", textAlign: "center", fontSize: 11, color: "#64748b" }}>THREE-WHEELER</th>
                        <th style={{ padding: "12px", textAlign: "center", fontSize: 11, color: "#64748b" }}>MOTORCYCLE</th>
                        <th style={{ padding: "12px", textAlign: "center", fontSize: 11, color: "#64748b" }}>BICYCLE</th>
                        <th style={{ padding: "12px", textAlign: "center", fontSize: 11, color: "#ffffff", backgroundColor: "#1E2A3B" }}>TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { type: "Deaths", color: "#ef4444", car: 4, van: 1, bus: 0, lorry: 1, tw: 2, mc: 3, bike: 0, total: 11 },
                        { type: "Major Injuries", color: "#f97316", car: 9, van: 4, bus: 1, lorry: 2, tw: 5, mc: 8, bike: 1, total: 30 },
                        { type: "Minor Injuries", color: "#f59e0b", car: 17, van: 6, bus: 2, lorry: 3, tw: 8, mc: 14, bike: 2, total: 52 },
                        { type: "Property Damage", color: "#64748b", car: 31, van: 8, bus: 3, lorry: 6, tw: 12, mc: 18, bike: 3, total: 81 },
                      ].map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 14px", fontWeight: 700, color: "#1e293b", borderLeft: `3.5px solid ${row.color}` }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: row.color, display: "inline-block", marginRight: 8 }} />
                            {row.type}
                          </td>
                          <td style={{ padding: "12px", textAlign: "center" }}>{row.car || "—"}</td>
                          <td style={{ padding: "12px", textAlign: "center" }}>{row.van || "—"}</td>
                          <td style={{ padding: "12px", textAlign: "center" }}>{row.bus || "—"}</td>
                          <td style={{ padding: "12px", textAlign: "center" }}>{row.lorry || "—"}</td>
                          <td style={{ padding: "12px", textAlign: "center" }}>{row.tw || "—"}</td>
                          <td style={{ padding: "12px", textAlign: "center" }}>{row.mc || "—"}</td>
                          <td style={{ padding: "12px", textAlign: "center" }}>{row.bike || "—"}</td>
                          <td style={{ padding: "12px", textAlign: "center", fontWeight: 800, backgroundColor: "#f8fafc" }}>{row.total}</td>
                        </tr>
                      ))}
                      {/* GRAND TOTAL ROW */}
                      <tr style={{ backgroundColor: "#1E2A3B", color: "#ffffff", fontWeight: 800 }}>
                        <td style={{ padding: "14px", letterSpacing: "0.5px" }}>GRAND TOTAL</td>
                        <td style={{ padding: "14px", textAlign: "center" }}>61</td>
                        <td style={{ padding: "14px", textAlign: "center" }}>19</td>
                        <td style={{ padding: "14px", textAlign: "center" }}>6</td>
                        <td style={{ padding: "14px", textAlign: "center" }}>12</td>
                        <td style={{ padding: "14px", textAlign: "center" }}>27</td>
                        <td style={{ padding: "14px", textAlign: "center" }}>43</td>
                        <td style={{ padding: "14px", textAlign: "center" }}>6</td>
                        <td style={{ padding: "14px", textAlign: "center", fontSize: 15 }}>174</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* MATRIX TABLE: VIOLATIONS */}
              {modalTab === "violations" && (
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 800, color: "#475569", letterSpacing: "0.5px", margin: "0 0 12px 0" }}>
                    VIOLATION SUMMARY — BY TYPE & VEHICLE
                  </h4>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", textTransform: "uppercase" }}>
                        <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, color: "#64748b" }}>ACTION / OFFENCE TYPE</th>
                        <th style={{ padding: "12px", textAlign: "center", fontSize: 11, color: "#64748b" }}>MOTOR CAR</th>
                        <th style={{ padding: "12px", textAlign: "center", fontSize: 11, color: "#64748b" }}>VAN</th>
                        <th style={{ padding: "12px", textAlign: "center", fontSize: 11, color: "#64748b" }}>BUS</th>
                        <th style={{ padding: "12px", textAlign: "center", fontSize: 11, color: "#64748b" }}>LORRY</th>
                        <th style={{ padding: "12px", textAlign: "center", fontSize: 11, color: "#64748b" }}>THREE-WHEELER</th>
                        <th style={{ padding: "12px", textAlign: "center", fontSize: 11, color: "#64748b" }}>MOTORCYCLE</th>
                        <th style={{ padding: "12px", textAlign: "center", fontSize: 11, color: "#64748b" }}>BICYCLE</th>
                        <th style={{ padding: "12px", textAlign: "center", fontSize: 11, color: "#ffffff", backgroundColor: "#1E2A3B" }}>TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { type: "Judicial Cases (Court)", color: "#8b5cf6", car: 142, van: 58, bus: 24, lorry: 38, tw: 112, mc: 195, bike: 12, total: 581 },
                        { type: "Fine-based Offences", color: "#f59e0b", car: 310, van: 145, bus: 62, lorry: 88, tw: 245, mc: 410, bike: 35, total: 1295 },
                        { type: "Warnings Issued", color: "#06b6d4", car: 85, van: 32, bus: 12, lorry: 18, tw: 64, mc: 98, bike: 15, total: 324 },
                      ].map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 14px", fontWeight: 700, color: "#1e293b", borderLeft: `3.5px solid ${row.color}` }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: row.color, display: "inline-block", marginRight: 8 }} />
                            {row.type}
                          </td>
                          <td style={{ padding: "12px", textAlign: "center" }}>{row.car}</td>
                          <td style={{ padding: "12px", textAlign: "center" }}>{row.van}</td>
                          <td style={{ padding: "12px", textAlign: "center" }}>{row.bus}</td>
                          <td style={{ padding: "12px", textAlign: "center" }}>{row.lorry}</td>
                          <td style={{ padding: "12px", textAlign: "center" }}>{row.tw}</td>
                          <td style={{ padding: "12px", textAlign: "center" }}>{row.mc}</td>
                          <td style={{ padding: "12px", textAlign: "center" }}>{row.bike}</td>
                          <td style={{ padding: "12px", textAlign: "center", fontWeight: 800, backgroundColor: "#f8fafc" }}>{row.total}</td>
                        </tr>
                      ))}
                      {/* GRAND TOTAL ROW */}
                      <tr style={{ backgroundColor: "#1E2A3B", color: "#ffffff", fontWeight: 800 }}>
                        <td style={{ padding: "14px", letterSpacing: "0.5px" }}>GRAND TOTAL</td>
                        <td style={{ padding: "14px", textAlign: "center" }}>537</td>
                        <td style={{ padding: "14px", textAlign: "center" }}>235</td>
                        <td style={{ padding: "14px", textAlign: "center" }}>98</td>
                        <td style={{ padding: "14px", textAlign: "center" }}>144</td>
                        <td style={{ padding: "14px", textAlign: "center" }}>421</td>
                        <td style={{ padding: "14px", textAlign: "center" }}>703</td>
                        <td style={{ padding: "14px", textAlign: "center" }}>62</td>
                        <td style={{ padding: "14px", textAlign: "center", fontSize: 15 }}>2,200</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* DOCUMENT FOOTER SIGNATURES */}
              <div style={{ marginTop: 50, paddingTop: 20, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <div>
                  <p style={{ margin: "0 0 35px 0", color: "#64748b" }}>Prepared by: <strong>{officerName}</strong>, Traffic Officer</p>
                  <div style={{ width: 220, borderBottom: "1.5px solid #0f172a" }} />
                  <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 0 0" }}>Officer Signature & Date</p>
                </div>

                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: "0 0 35px 0", color: "#64748b" }}>Officer in Charge (OIC) Approval & Seal</p>
                  <div style={{ width: 220, borderBottom: "1.5px solid #0f172a", marginLeft: "auto" }} />
                  <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 0 0" }}>Authorized Signature</p>
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