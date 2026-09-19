import React, { useState } from "react";
import OICLayout from "../layouts/OICLayout";
import { FiCheckCircle } from "react-icons/fi";

// Import Sub-components
import LiveAnalytics from "./reports/LiveAnalytics";
import ScheduledReports from "./reports/ScheduledReports";
import CustomReportForm from "./reports/CustomReportForm";
import ReportArchiveTable from "./reports/ReportArchiveTable";
import ReportDocumentModal from "./reports/ReportDocumentModal";

// Import Initial Data
import { initialArchiveRecords, olderArchiveRecords, vehicleList } from "./reports/mockData";

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
  const [violationActions, setViolationActions] = useState(["Judicial Cases (Court)", "Fine-based Offences", "Warnings"]);
  const [selectedVehicles, setSelectedVehicles] = useState(vehicleList.map(v => v.name));

  const [isCustomGenerating, setIsCustomGenerating] = useState(false);

  // ── Archive & Modal State ──
  // Include older records so the archive table pagination can reveal them
  const [archive, setArchive] = useState([...initialArchiveRecords, ...olderArchiveRecords]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState("accidents");
  const [activeModalReport, setActiveModalReport] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  // Helpers
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const handlePrint = () => window.print();
  const handleExportPDF = () => alert("Exporting official PDF report document to downloads...");

  // Preset Handlers
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
        filterData: { 
          category: type, 
          vehicles: vehicleList.map(v => v.name),
          severities: type === "accidents" ? ["Deaths", "Major Injuries", "Minor Injuries", "Property Damage"] : [],
          actions: type === "violations" ? ["Judicial Cases (Court)", "Fine-based Offences", "Warnings"] : []
        }
      };
      setArchive([newRecord, ...archive]);
      showToast(`✅ ${newRecord.title} (${newId}) generated successfully and archived.`);
    }, 2000);
  };

  // Generate Custom Report Handler
  const handleGenerateCustomReport = () => {
    if (selectedVehicles.length === 0) {
      alert("Please select at least one vehicle type for the report.");
      return;
    }
    if ((customCategory === "accidents" || customCategory === "both") && accidentSeverities.length === 0) {
      alert("Please select at least one accident severity.");
      return;
    }
    if ((customCategory === "violations" || customCategory === "both") && violationActions.length === 0) {
      alert("Please select at least one violation action type.");
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
        filterData: { 
          category: customCategory, 
          vehicles: selectedVehicles,
          severities: customCategory === "violations" ? [] : accidentSeverities,
          actions: customCategory === "accidents" ? [] : violationActions
        }
      };
      setArchive([newRecord, ...archive]);
      showToast(`🎉 Custom Report ${newId} compiled successfully!`);
      setActiveModalReport(newRecord);
      setModalTab(customCategory === "violations" ? "violations" : "accidents");
      setIsModalOpen(true);
    }, 2000);
  };

  const openModalForReport = (reportRecord) => {
    if (!reportRecord) return;
    setActiveModalReport(reportRecord);
    if (reportRecord.category === "Violations" || reportRecord.filterData?.category === "violations") {
      setModalTab("violations");
    } else {
      setModalTab("accidents");
    }
    setIsModalOpen(true);
  };

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

  return (
    <OICLayout>
      <div style={{ fontFamily: "Inter, sans-serif", color: "#1e293b" }}>
        
        {/* TOAST NOTICE */}
        {toastMessage && (
          <div style={{
            position: "fixed", top: 20, right: 20, zIndex: 10000,
            backgroundColor: "#0f172a", color: "#ffffff",
            padding: "14px 22px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: 10,
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
                display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: "8px", border: "1px solid",
                borderColor: topTab === "live" ? "#cbd5e1" : "#e2e8f0", backgroundColor: topTab === "live" ? "#ffffff" : "#f1f5f9",
                color: topTab === "live" ? "#0f172a" : "#64748b", fontSize: "13px", fontWeight: 700, cursor: "pointer",
                boxShadow: topTab === "live" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
              }}
            >
              📊 Live Analytics
            </button>
            <button
              onClick={() => setTopTab("scheduled")}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: "8px", border: "1px solid",
                borderColor: topTab === "scheduled" ? "#cbd5e1" : "#e2e8f0", backgroundColor: topTab === "scheduled" ? "#ffffff" : "#f1f5f9",
                color: topTab === "scheduled" ? "#0f172a" : "#64748b", fontSize: "13px", fontWeight: 700, cursor: "pointer",
                boxShadow: topTab === "scheduled" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
              }}
            >
              🗓 Scheduled Reports
              <span style={{ backgroundColor: "#2563eb", color: "#ffffff", fontSize: "10px", fontWeight: 800, padding: "2px 7px", borderRadius: "12px", letterSpacing: "0.5px" }}>
                AUTO
              </span>
            </button>
          </div>
        </div>

        {/* TAB CONTENTS */}
        {topTab === "live" && (
          <LiveAnalytics 
            liveDatePreset={liveDatePreset} handleLivePresetChange={handleLivePresetChange}
            fromDate={fromDate} setFromDate={setFromDate}
            toDate={toDate} setToDate={setToDate}
            analyticsSection={analyticsSection} setAnalyticsSection={setAnalyticsSection}
            handlePrint={handlePrint} handleExportPDF={handleExportPDF}
            openGenerateModal={() => {
              setActiveModalReport({
                id: "RPT-NB-726306",
                title: "Summary Report",
                category: "Both",
                period: `${fromDate} — ${toDate}`,
                generated: "02 September 2026",
                by: officerName,
                filterData: { category: "both" }
              });
              setIsModalOpen(true);
            }}
          />
        )}

        {topTab === "scheduled" && (
          <div>
            <ScheduledReports 
              autoAccidentsEnabled={autoAccidentsEnabled} setAutoAccidentsEnabled={setAutoAccidentsEnabled}
              autoViolationsEnabled={autoViolationsEnabled} setAutoViolationsEnabled={setAutoViolationsEnabled}
              runningReportId={runningReportId} handleRunMonthlyReport={handleRunMonthlyReport}
              archive={archive} openModalForReport={openModalForReport}
            />
            
            <CustomReportForm 
              customCategory={customCategory} setCustomCategory={setCustomCategory}
              customDatePreset={customDatePreset} handleCustomPresetChange={handleCustomPresetChange}
              customFromDate={customFromDate} setCustomFromDate={setCustomFromDate}
              customToDate={customToDate} setCustomToDate={setCustomToDate}
              accidentSeverities={accidentSeverities} setAccidentSeverities={setAccidentSeverities}
              violationActions={violationActions} setViolationActions={setViolationActions}
              selectedVehicles={selectedVehicles} toggleVehicle={toggleVehicle} toggleAllVehicles={toggleAllVehicles}
              handleGenerateCustomReport={handleGenerateCustomReport} isCustomGenerating={isCustomGenerating}
            />

            <ReportArchiveTable 
              archive={archive} 
              openModalForReport={openModalForReport} 
              handleExportPDF={handleExportPDF} 
            />
          </div>
        )}

        <ReportDocumentModal 
          isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen}
          activeModalReport={activeModalReport} 
          modalTab={modalTab} setModalTab={setModalTab}
          handlePrint={handlePrint} handleExportPDF={handleExportPDF}
          officerName={officerName} badgeNo={badgeNo}
          fallbackFromDate={fromDate} fallbackToDate={toDate}
        />

      </div>
    </OICLayout>
  );
}

export default Reports;