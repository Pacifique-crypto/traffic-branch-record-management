import React, { useState } from "react";
import { reportStyles } from "./reportStyles";

function ReportArchiveTable({ archive, openModalForReport, handleExportPDF }) {
  const [archiveTypeFilter, setArchiveTypeFilter] = useState("All");
  const [archiveCategoryFilter, setArchiveCategoryFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(5);

  const filteredArchive = archive.filter(item => {
    // Type Filter
    if (archiveTypeFilter !== "All" && item.type !== (archiveTypeFilter === "Auto" ? "AUTO" : "MANUAL")) return false;
    // Category Filter (Accidents, Violations, Both)
    if (archiveCategoryFilter !== "All" && item.category !== archiveCategoryFilter) return false;
    return true;
  });

  const displayedArchive = filteredArchive.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 5);
  };

  return (
    <div style={{ ...reportStyles.card, padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 2px 0" }}>Report Archive</h3>
          <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>View, download, or inspect generated snapshot documents</p>
        </div>

        {/* Filter Controls */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {/* Category Filter */}
          <div style={{ display: "flex", gap: 6, backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "8px" }}>
            {["All", "Accidents", "Violations", "Both"].map(tab => (
              <button
                key={tab}
                onClick={() => { setArchiveCategoryFilter(tab); setVisibleCount(5); }}
                style={{
                  padding: "4px 14px",
                  borderRadius: "6px",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  backgroundColor: archiveCategoryFilter === tab ? "#ffffff" : "transparent",
                  color: archiveCategoryFilter === tab ? "#0f172a" : "#64748b",
                  boxShadow: archiveCategoryFilter === tab ? "0 1px 2px rgba(0,0,0,0.08)" : "none"
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div style={{ display: "flex", gap: 6, backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "8px" }}>
            {["All", "Auto", "Manual"].map(tab => (
              <button
                key={tab}
                onClick={() => { setArchiveTypeFilter(tab); setVisibleCount(5); }}
                style={{
                  padding: "4px 14px",
                  borderRadius: "6px",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  backgroundColor: archiveTypeFilter === tab ? "#ffffff" : "transparent",
                  color: archiveTypeFilter === tab ? "#0f172a" : "#64748b",
                  boxShadow: archiveTypeFilter === tab ? "0 1px 2px rgba(0,0,0,0.08)" : "none"
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ARCHIVE TABLE */}
      {filteredArchive.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b", backgroundColor: "#f8fafc", borderRadius: 8 }}>
          <span style={{ fontSize: 24, display: "block", marginBottom: 10 }}>📁</span>
          <p style={{ fontWeight: 600, margin: 0 }}>No reports found matching your filters.</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 800 }}>
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
                {displayedArchive.map(item => (
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
                          onClick={(e) => { e.stopPropagation(); openModalForReport(item); }}
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
                          onClick={(e) => { e.stopPropagation(); handleExportPDF(); }}
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
          </div>

          {filteredArchive.length > visibleCount && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
              <button 
                onClick={handleLoadMore}
                style={{ background: "none", border: "1px solid #cbd5e1", padding: "8px 20px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, color: "#475569", cursor: "pointer" }}
              >
                Load older records
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ReportArchiveTable;
