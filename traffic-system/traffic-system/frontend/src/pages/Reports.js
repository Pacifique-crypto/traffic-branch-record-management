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
import {
  initialArchiveRecords,
  olderArchiveRecords,
  vehicleList,
  accidentSeverityOptions,
  accidentCauseOptions,
  violationActionOptions,
  violationCauseOptions
} from "./reports/mockData";

function Reports() {
  const officer = JSON.parse(localStorage.getItem("officer") || "{}");
  const officerName = officer.fullName || officer.name || "PS Perera";
  const badgeNo = officer.policeId || "256 556 656";

  // ── Top Level Tabs ──
  const [topTab, setTopTab] = useState("scheduled"); // "live" | "scheduled"

  // ── Live Analytics State ──
  const [liveDatePreset, setLiveDatePreset] = useState("Custom");
  const [fromDate, setFromDate] = useState("07/27/2026");
  const [toDate, setToDate] = useState("08/26/2026");
  const [analyticsSection, setAnalyticsSection] = useState("accidents"); // "accidents" | "violations"

  // ── Scheduled Reports State ──
  const [autoAccidentsEnabled, setAutoAccidentsEnabled] = useState(true);
  const [autoViolationsEnabled, setAutoViolationsEnabled] = useState(true);
  const [runningReportId, setRunningReportId] = useState(null);

  // ── Custom Report Form State ──
  const [customCategory, setCustomCategory] = useState("accidents"); // "accidents" | "violations" | "both"
  const [customDatePreset, setCustomDatePreset] = useState("Last 30 days");
  const [customFromDate, setCustomFromDate] = useState("07/27/2026");
  const [customToDate, setCustomToDate] = useState("08/26/2026");

  const [accidentSeverities, setAccidentSeverities] = useState(["Deaths", "Major Injuries", "Minor Injuries", "Property Damage"]);
  const [accidentCauses, setAccidentCauses] = useState(["Excessive Speed", "Reckless Driving", "Mechanical Failure", "Failure to Keep Left"]);
  const [violationActions, setViolationActions] = useState(["Judicial Cases (Court)", "Warnings"]);
  const [violationCauses, setViolationCauses] = useState(["No Helmet", "No License", "Overloading"]);
  const [selectedVehicles, setSelectedVehicles] = useState(["Motor Car", "Van", "Bus", "Lorry", "Three-Wheeler", "Motorcycle", "Bicycle"]);

  const [isCustomGenerating, setIsCustomGenerating] = useState(false);
  const [reportGeneratedSuccess, setReportGeneratedSuccess] = useState(false);

  // ── Archive & Modal State ──
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
  const handleExportPDF = () => showToast("📥 Downloading official PDF report document...");

  // Preset Handlers
  const handleLivePresetChange = (preset) => {
    setLiveDatePreset(preset);
    if (preset === "Today") {
      setFromDate("08/26/2026"); setToDate("08/26/2026");
    } else if (preset === "This Week") {
      setFromDate("08/20/2026"); setToDate("08/26/2026");
    } else if (preset === "This Month") {
      setFromDate("08/01/2026"); setToDate("08/26/2026");
    } else {
      setFromDate("07/27/2026"); setToDate("08/26/2026");
    }
  };

  const handleCustomPresetChange = (preset) => {
    setCustomDatePreset(preset);
    if (preset === "Last 7 days") {
      setCustomFromDate("08/19/2026"); setCustomToDate("08/26/2026");
    } else if (preset === "Last 2 weeks") {
      setCustomFromDate("08/12/2026"); setCustomToDate("08/26/2026");
    } else if (preset === "Last 30 days") {
      setCustomFromDate("07/27/2026"); setCustomToDate("08/26/2026");
    } else if (preset === "Last 90 days") {
      setCustomFromDate("05/28/2026"); setCustomToDate("08/26/2026");
    }
  };

  // Toggle helpers for Custom Form
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

  const toggleAllAccidentTypes = () => {
    if (accidentSeverities.length === accidentSeverityOptions.length && accidentCauses.length === accidentCauseOptions.length) {
      setAccidentSeverities([]);
      setAccidentCauses([]);
    } else {
      setAccidentSeverities([...accidentSeverityOptions]);
      setAccidentCauses([...accidentCauseOptions]);
    }
  };

  const toggleAllViolationTypes = () => {
    if (violationActions.length === violationActionOptions.length && violationCauses.length === violationCauseOptions.length) {
      setViolationActions([]);
      setViolationCauses([]);
    } else {
      setViolationActions([...violationActionOptions]);
      setViolationCauses([...violationCauseOptions]);
    }
  };

  // Run Now handler for Monthly Reports
  const handleRunMonthlyReport = (type) => {
    setRunningReportId(type);
    setTimeout(() => {
      setRunningReportId(null);
      const newId = `RPT-NB-${Math.floor(800000 + Math.random() * 90000)}`;
      const newRecord = {
        id: newId,
        title: type === "accidents" ? "Monthly Accident Report" : "Monthly Violation Report",
        category: type === "accidents" ? "Accidents" : "Violations",
        categoryColor: type === "accidents" ? "#ef4444" : "#2563eb",
        type: "AUTO",
        period: "Aug 1 — Aug 31, 2026",
        generated: "Aug 26, 2026 22:50",
        by: "System (Manual Trigger)",
        status: "Completed",
        size: "3.1 MB",
        filterData: { 
          category: type, 
          vehicles: vehicleList.map(v => v.name),
          severities: type === "accidents" ? accidentSeverityOptions : [],
          causes: [],
          actions: type === "violations" ? violationActionOptions : []
        }
      };
      setArchive([newRecord, ...archive]);
      showToast(`✅ ${newRecord.title} (${newId}) generated successfully.`);
    }, 1200);
  };

  // Generate Custom Report Handler
  const handleGenerateCustomReport = () => {
    if (selectedVehicles.length === 0) {
      alert("Please select at least one vehicle type for the report.");
      return;
    }
    if ((customCategory === "accidents" || customCategory === "both") && accidentSeverities.length === 0 && accidentCauses.length === 0) {
      alert("Please select at least one accident severity or cause.");
      return;
    }
    if ((customCategory === "violations" || customCategory === "both") && violationActions.length === 0 && violationCauses.length === 0) {
      alert("Please select at least one violation action type or cause.");
      return;
    }

    setIsCustomGenerating(true);
    setReportGeneratedSuccess(false);

    setTimeout(() => {
      setIsCustomGenerating(false);
      setReportGeneratedSuccess(true);
      const newId = `RPT-NB-${Math.floor(5000 + Math.random() * 4000)}`;
      const catTitle = customCategory === "accidents" 
        ? `Custom ${customDatePreset} — Accidents` 
        : customCategory === "violations" 
        ? `Custom ${customDatePreset} — Violations` 
        : `Custom ${customDatePreset} — Summary`;

      const catColor = customCategory === "accidents" ? "#ef4444" : customCategory === "violations" ? "#2563eb" : "#8b5cf6";
      const catLabel = customCategory === "accidents" ? "Accidents" : customCategory === "violations" ? "Violations" : "Both";

      const newRecord = {
        id: newId,
        title: catTitle,
        category: catLabel,
        categoryColor: catColor,
        type: "MANUAL",
        period: `${customFromDate} — ${customToDate}`,
        generated: "Aug 26, 2026 22:48",
        by: officerName,
        status: "Completed",
        size: "2.5 MB",
        filterData: { 
          category: customCategory, 
          vehicles: selectedVehicles,
          severities: customCategory === "violations" ? [] : accidentSeverities,
          causes: customCategory === "violations" ? violationCauses : accidentCauses,
          actions: customCategory === "accidents" ? [] : violationActions
        }
      };

      setArchive([newRecord, ...archive]);
      showToast(`🎉 Report ${newId} generated! Added to archive.`);
      setActiveModalReport(newRecord);
      setModalTab(customCategory === "violations" ? "violations" : "accidents");
      setIsModalOpen(true);
    }, 1200);
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
              accidentCauses={accidentCauses} setAccidentCauses={setAccidentCauses}
              violationActions={violationActions} setViolationActions={setViolationActions}
              violationCauses={violationCauses} setViolationCauses={setViolationCauses}
              selectedVehicles={selectedVehicles} toggleVehicle={toggleVehicle} toggleAllVehicles={toggleAllVehicles}
              toggleAllAccidentTypes={toggleAllAccidentTypes} toggleAllViolationTypes={toggleAllViolationTypes}
              handleGenerateCustomReport={handleGenerateCustomReport} isCustomGenerating={isCustomGenerating}
              reportGeneratedSuccess={reportGeneratedSuccess} officerName={officerName}
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