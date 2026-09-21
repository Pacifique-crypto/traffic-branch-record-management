import React, { useState } from "react";
import { FiEye, FiDownload } from "react-icons/fi";
import { reportStyles } from "./reportStyles";

function ReportArchiveTable({ archive, openModalForReport, handleExportPDF }) {
  const [archiveTypeFilter, setArchiveTypeFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(10);

  const filteredArchive = archive.filter(item => {
    if (archiveTypeFilter === "Auto") return item.type === "AUTO";
    if (archiveTypeFilter === "Manual") return item.type === "MANUAL";
    return true;
  });

  const displayedArchive = filteredArchive.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 5);
  };

  return (
    <div style={{ ...reportStyles.card, padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 2px 0" }}>Report Archive</h3>
          <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>All auto and custom reports. Click View to open the matrix table.</p>
        </div>

        {/* Type Filter Tabs: All | Auto | Manual */}
        <div style={{ display: "flex", gap: 4, backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "8px" }}>
          {["All", "Auto", "Manual"].map(tab => (
            <button
              key={tab}
              onClick={() => { setArchiveTypeFilter(tab); setVisibleCount(10); }}
              style={{
                padding: "5px 16px",
                borderRadius: "6px",
                border: "none",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                backgroundColor: archiveTypeFilter === tab ? "#1E2A3B" : "transparent",
                color: archiveTypeFilter === tab ? "#ffffff" : "#64748b",
                transition: "all 0.15s ease"
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ARCHIVE TABLE */}
      {filteredArchive.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b", backgroundColor: "#f8fafc", borderRadius: 8 }}>
          <span style={{ fontSize: 24, display: "block", marginBottom: 10 }}>📁</span>
          <p style={{ fontWeight: 600, margin: 0 }}>No reports found matching your filter.</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: 850 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#64748b", fontSize: "11px" }}>
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>REPORT ID</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>TITLE</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>CATEGORY</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>TYPE</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>PERIOD</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>GENERATED</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>BY</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700, textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {displayedArchive.map(item => {
                  const isAuto = item.type === "AUTO";
                  return (
                    <tr
                      key={item.id}
                      style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                      onClick={() => openModalForReport(item)}
                    >
                      <td style={{ padding: "12px", fontFamily: "monospace", fontWeight: 700, color: "#1e293b" }}>{item.id}</td>
                      <td style={{ padding: "12px", fontWeight: 700, color: "#0f172a" }}>{item.title}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: item.categoryColor || (item.category === "Accidents" ? "#ef4444" : item.category === "Violations" ? "#2563eb" : "#8b5cf6") }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: item.categoryColor || (item.category === "Accidents" ? "#ef4444" : item.category === "Violations" ? "#2563eb" : "#8b5cf6") }} />
                          {item.category}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          fontSize: "10px",
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          border: "1px solid",
                          borderColor: isAuto ? "#a855f7" : "#22c55e",
                          color: isAuto ? "#9333ea" : "#16a34a",
                          backgroundColor: isAuto ? "#faf5ff" : "#f0fdf4"
                        }}>
                          {item.type}
                        </span>
                      </td>
                      <td style={{ padding: "12px", color: "#475569", fontSize: 11 }}>{item.period}</td>
                      <td style={{ padding: "12px", color: "#475569", fontSize: 11 }}>{item.generated}</td>
                      <td style={{ padding: "12px", color: "#475569", fontSize: 11 }}>{item.by}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: item.status === "Completed" ? "#16a34a" : "#ef4444",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5
                        }}>
                          ● {item.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }} onClick={e => e.stopPropagation()}>
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
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4
                            }}
                          >
                            <FiEye size={12} /> View
                          </button>
                          <span style={{ fontSize: "11px", color: "#94a3b8", display: "inline-flex", alignItems: "center", gap: 3 }}>
                            <FiDownload size={12} /> {item.size}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, borderTop: "1px solid #f1f5f9", paddingTop: 14 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              Showing {displayedArchive.length} of {filteredArchive.length} reports · Retained for 12 months
            </span>
            {filteredArchive.length > visibleCount && (
              <button
                onClick={handleLoadMore}
                style={{ background: "none", border: "1px solid #cbd5e1", padding: "6px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, color: "#475569", cursor: "pointer" }}
              >
                Load older records
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ReportArchiveTable;
