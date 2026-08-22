import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OICLayout from "../layouts/OICLayout";
import ITLayout from "../layouts/ITLayout";
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Grid, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel,
  FormControl, Chip, CircularProgress, IconButton, Alert, Snackbar, Menu,
  Drawer, Tooltip
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon, ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon, Add as AddIcon, CheckCircle as CheckCircleIcon,
  History as HistoryIcon, Save as SaveIcon, Send as SendIcon, Edit as EditIcon,
  AutoAwesome as AIIcon
} from "@mui/icons-material";
import {
  getOfficers, getDutyShifts, getDutyRules, getOfficerLeaves, getVehicles,
  getDutyRosters, createDutyRoster, updateDutyRosterStatus, validateDutyRoster
} from "../api";

// Helper: Format date string YYYY-MM-DD
const formatDateStr = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: Get Monday of the given date's week
const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// Helper: Get 7 days of week starting from Monday
const getWeekDates = (monday) => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const next = new Date(monday);
    next.setDate(monday.getDate() + i);
    days.push(next);
  }
  return days;
};

const DUTY_COLORS = {
  "Traffic Patrol": { bg: "#fff7ed", border: "#f97316", text: "#c2410c" },
  "Crime Investigation": { bg: "#fef2f2", border: "#ef4444", text: "#b91c1c" },
  "Accident Investigation": { bg: "#fff1f2", border: "#f43f5e", text: "#be123c" },
  "Station Duty": { bg: "#eff6ff", border: "#3b82f6", text: "#1d4ed8" },
  "Motorcycle Patrol": { bg: "#f0fdf4", border: "#22c55e", text: "#15803d" },
  "Night Patrol": { bg: "#faf5ff", border: "#a855f7", text: "#6b21a8" },
  "Leave": { bg: "#f1f5f9", border: "#94a3b8", text: "#475569" },
  "Unassigned": { bg: "#fff1f2", border: "#f87171", text: "#dc2626" },
  "Off": { bg: "#ffffff", border: "#e2e8f0", text: "#94a3b8" }
};

export default function ManualDutyRoster() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole") || "IT Officer";
  const isOIC = userRole === "OIC";
  const Layout = isOIC ? OICLayout : ITLayout;

  // Week navigation state
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()));
  const weekDays = getWeekDates(currentMonday);
  const weekStartStr = formatDateStr(weekDays[0]);
  const weekEndStr = formatDateStr(weekDays[6]);

  // Loaded database records
  const [loading, setLoading] = useState(true);
  const [officers, setOfficers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [rules, setRules] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [rosters, setRosters] = useState([]);
  const [currentRosterId, setCurrentRosterId] = useState(null);

  // Roster Status & Assignments Map
  // Key format: `${officerId}_${formatDateStr(date)}` => Assignment Object
  const [rosterStatus, setRosterStatus] = useState("Draft");
  const [assignmentsMap, setAssignmentsMap] = useState({});

  // Menu state for "+ Create New Duty Roster"
  const [createMenuAnchor, setCreateMenuAnchor] = useState(null);

  // Filters State
  const [searchOfficer, setSearchOfficer] = useState("");
  const [filterDutyType, setFilterDutyType] = useState("All");
  const [filterShift, setFilterShift] = useState("All");
  const [filterLocation, setFilterLocation] = useState("All");
  const [filterLeave, setFilterLeave] = useState("All");
  const [filterConflicts, setFilterConflicts] = useState("All");

  // Cell Editing Modal State
  const [editCell, setEditCell] = useState(null); // { officer, date, dateStr, existing }
  const [cellDutyType, setCellDutyType] = useState("Traffic Patrol");
  const [cellShift, setCellShift] = useState("");
  const [cellLocation, setCellLocation] = useState("Police Station");
  const [cellVehicle, setCellVehicle] = useState("");

  // Validation Drawer & Errors State
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationResult, setValidationResult] = useState({ isValid: true, errors: [], warnings: [] });

  // History Drawer State
  const [historyOpen, setHistoryOpen] = useState(false);

  // UI Feedback Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showMsg = (msg, sev = "success") => {
    setSnackbar({ open: true, message: msg, severity: sev });
  };

  // Active selected status tab
  const [selectedStatusTab, setSelectedStatusTab] = useState("Draft");
  const [activeRosterDoc, setActiveRosterDoc] = useState(null);

  // Helper to load roster for a specific status & week
  const loadRosterForStatus = (targetStatus, allRostersList = rosters) => {
    const matching = (allRostersList || []).find(r => {
      if (r.rosterType !== "Weekly") return false;
      const rStart = formatDateStr(r.weekStart);
      const isWeekMatch = rStart === weekStartStr;
      const isStatusMatch = (r.status || "").toLowerCase().trim() === targetStatus.toLowerCase().trim();
      return isWeekMatch && isStatusMatch;
    });

    const anyRoster = (allRostersList || []).find(r => {
      if (r.rosterType !== "Weekly") return false;
      return formatDateStr(r.weekStart) === weekStartStr;
    });

    const activeRoster = matching || (targetStatus === "Draft" ? anyRoster : null);

    if (activeRoster) {
      setCurrentRosterId(activeRoster._id);
      setRosterStatus(activeRoster.status || targetStatus);
      setActiveRosterDoc(activeRoster);

      const map = {};
      (activeRoster.assignments || []).forEach(asg => {
        if (asg && asg.officer) {
          const offId = (asg.officer._id || asg.officer).toString();
          const dStr = formatDateStr(asg.date);
          map[`${offId}_${dStr}`] = asg;
        }
      });
      setAssignmentsMap(map);
    } else {
      setCurrentRosterId(null);
      setRosterStatus(targetStatus);
      setActiveRosterDoc(null);
      setAssignmentsMap({});
    }
  };

  const handleSelectStatusTab = (statusName) => {
    setSelectedStatusTab(statusName);
    loadRosterForStatus(statusName, rosters);
    const matching = (rosters || []).find(r => {
      if (r.rosterType !== "Weekly") return false;
      return formatDateStr(r.weekStart) === weekStartStr && (r.status || "").toLowerCase().trim() === statusName.toLowerCase().trim();
    });
    if (matching) {
      showMsg(`Viewing ${statusName} Roster (#${matching._id.slice(-6).toUpperCase()}) containing ${matching.assignments?.length || 0} assignments.`);
    } else {
      showMsg(`No ${statusName} roster found for this week. Showing empty grid.`, "info");
    }
  };

  const getStatusCount = (statusName) => {
    const matching = (rosters || []).find(r => {
      if (r.rosterType !== "Weekly") return false;
      return formatDateStr(r.weekStart) === weekStartStr && (r.status || "").toLowerCase().trim() === statusName.toLowerCase().trim();
    });
    return matching ? (matching.assignments?.length || 0) : 0;
  };

  // Load initial data from backend
  const loadData = async () => {
    try {
      setLoading(true);
      const [allOfficers, allShifts, allRules, allLeaves, allVehicles, allRosters] = await Promise.all([
        getOfficers().catch(() => []),
        getDutyShifts().catch(() => []),
        getDutyRules().catch(() => []),
        getOfficerLeaves().catch(() => []),
        getVehicles().catch(() => []),
        getDutyRosters().catch(() => [])
      ]);

      const activeOffs = (allOfficers || []).filter(o => o.status !== "Pending");
      setOfficers(activeOffs);
      setShifts(allShifts || []);
      setRules(allRules || []);
      setLeaves(allLeaves || []);
      setVehicles(allVehicles || []);
      setRosters(allRosters || []);

      if (allShifts && allShifts.length > 0) {
        setCellShift(allShifts[0].name);
      }

      loadRosterForStatus(selectedStatusTab, allRosters || []);

    } catch (err) {
      showMsg("Failed to load records from backend database", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentMonday]);

  // Week Pagination
  const handlePrevWeek = () => {
    const prev = new Date(currentMonday);
    prev.setDate(prev.getDate() - 7);
    setCurrentMonday(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentMonday);
    next.setDate(next.getDate() + 7);
    setCurrentMonday(next);
  };

  // Helper: Check if officer is on leave on a given date
  const isOfficerOnLeave = (officerId, date) => {
    const offIdStr = officerId.toString();
    const dStr = formatDateStr(date);
    return leaves.find(l => {
      if (!l || !l.officer) return false;
      const lOffId = (l.officer._id || l.officer).toString();
      if (lOffId !== offIdStr) return false;
      const startStr = formatDateStr(l.startDate);
      const endStr = formatDateStr(l.endDate);
      return dStr >= startStr && dStr <= endStr;
    });
  };

  // Summary Cards Data Calculations
  const totalOfficersCount = officers.length;

  let assignedDutiesCount = 0;
  let specialDutiesCount = 0;
  let unassignedCount = 0;

  weekDays.forEach(d => {
    const dStr = formatDateStr(d);
    officers.forEach(off => {
      const key = `${off._id}_${dStr}`;
      const asg = assignmentsMap[key];
      const leave = isOfficerOnLeave(off._id, d);
      if (asg && asg.dutyType && asg.dutyType !== "Off" && asg.dutyType !== "Leave") {
        assignedDutiesCount++;
        const matchingRule = rules.find(r => r.dutyType === asg.dutyType && r.location === asg.location);
        if (matchingRule && matchingRule.priority === "High") {
          specialDutiesCount++;
        }
      } else if (!leave && (!asg || asg.dutyType === "Unassigned")) {
        unassignedCount++;
      }
    });
  });

  const officersOnLeaveCount = officers.filter(off => {
    return weekDays.some(d => isOfficerOnLeave(off._id, d));
  }).length;

  // Filter Officers for Grid
  const filteredOfficers = officers.filter(off => {
    if (searchOfficer.trim()) {
      const query = searchOfficer.toLowerCase().trim();
      const matchName = (off.fullName || "").toLowerCase().includes(query);
      const matchId = (off.policeId || "").toLowerCase().includes(query);
      if (!matchName && !matchId) return false;
    }
    return true;
  });

  // Open Cell Editor
  const handleOpenCellEditor = (officer, date) => {
    if (rosterStatus === "Approved" || rosterStatus === "Published") {
      showMsg(`Cannot edit a ${rosterStatus} roster.`, "warning");
      return;
    }
    const dStr = formatDateStr(date);
    const key = `${officer._id}_${dStr}`;
    const existing = assignmentsMap[key];
    const leave = isOfficerOnLeave(officer._id, date);

    if (leave) {
      showMsg(`${officer.fullName} is on approved leave (${leave.leaveType}) on this date.`, "warning");
    }

    setEditCell({ officer, date, dateStr: dStr, existing, leave });
    if (existing) {
      setCellDutyType(existing.dutyType || "Traffic Patrol");
      setCellShift(existing.shift || (shifts[0] ? shifts[0].name : "Full Day Duty"));
      setCellLocation(existing.location || "Police Station");
      setCellVehicle(existing.vehicle || "");
    } else {
      setCellDutyType("Traffic Patrol");
      setCellShift(shifts[0] ? shifts[0].name : "Full Day Duty");
      setCellLocation("Police Station");
      setCellVehicle("");
    }
  };

  // Save Assignment to local state map
  const handleSaveCellAssignment = (dutyTypeOverride = null) => {
    if (!editCell) return;
    const { officer, dateStr, date } = editCell;
    const targetDutyType = dutyTypeOverride || cellDutyType;

    const key = `${officer._id}_${dateStr}`;
    const updatedMap = { ...assignmentsMap };

    if (targetDutyType === "Off" || targetDutyType === "Clear") {
      delete updatedMap[key];
    } else {
      updatedMap[key] = {
        officer: officer._id,
        officerName: officer.fullName,
        officerRank: officer.rank,
        officerPoliceId: officer.policeId,
        location: cellLocation,
        dutyType: targetDutyType,
        date: date,
        shift: cellShift,
        vehicle: cellVehicle,
        aiRecommendationReason: "Manually assigned by IT Officer."
      };
    }

    setAssignmentsMap(updatedMap);
    setEditCell(null);
  };

  // Convert assignments map to list for backend payload
  const getAssignmentsList = () => {
    return Object.values(assignmentsMap).map(asg => ({
      officer: asg.officer,
      officerName: asg.officerName,
      officerRank: asg.officerRank,
      officerPoliceId: asg.officerPoliceId,
      location: asg.location,
      dutyType: asg.dutyType,
      date: asg.date,
      shift: asg.shift,
      aiRecommendationReason: asg.aiRecommendationReason || "Manually assigned by IT Officer."
    }));
  };

  // Run Backend Validation
  const handleRunValidation = async () => {
    const list = getAssignmentsList();
    try {
      const result = await validateDutyRoster({
        assignments: list,
        weekStart: weekStartStr,
        weekEnd: weekEndStr
      });
      setValidationResult(result || { isValid: true, errors: [], warnings: [] });
      setValidationOpen(true);
    } catch (err) {
      showMsg("Validation service error", "error");
    }
  };

  // Save Draft Roster
  const handleSaveDraft = async () => {
    const list = getAssignmentsList();
    try {
      setLoading(true);
      const payload = {
        rosterType: "Weekly",
        status: "Draft",
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        createdBy: localStorage.getItem("userName") || "IT Officer",
        assignments: list
      };

      if (currentRosterId) {
        await updateDutyRosterStatus(currentRosterId, payload);
      } else {
        const res = await createDutyRoster(payload);
        if (res && res._id) setCurrentRosterId(res._id);
      }

      setRosterStatus("Draft");
      showMsg("Weekly duty roster draft saved successfully to database!");
      loadData();
    } catch (err) {
      showMsg("Failed to save draft roster", "error");
    } finally {
      setLoading(false);
    }
  };

  // Submit Roster to OIC
  const handleSubmitToOIC = async () => {
    const list = getAssignmentsList();
    if (list.length === 0) {
      showMsg("Cannot submit empty roster. Please assign duties first.", "warning");
      return;
    }

    try {
      setLoading(true);
      // Run validation before submission
      const valResult = await validateDutyRoster({
        assignments: list,
        weekStart: weekStartStr,
        weekEnd: weekEndStr
      });

      if (valResult && !valResult.isValid && valResult.errors.length > 0) {
        setValidationResult(valResult);
        setValidationOpen(true);
        showMsg("Cannot submit roster due to critical validation errors.", "error");
        setLoading(false);
        return;
      }

      const payload = {
        rosterType: "Weekly",
        status: "Pending Approval",
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        createdBy: localStorage.getItem("userName") || "IT Officer",
        assignments: list
      };

      if (currentRosterId) {
        await updateDutyRosterStatus(currentRosterId, payload);
      } else {
        const res = await createDutyRoster(payload);
        if (res && res._id) setCurrentRosterId(res._id);
      }

      setRosterStatus("Pending Approval");
      showMsg("Weekly duty roster submitted to OIC successfully!");
      loadData();
    } catch (err) {
      showMsg("Failed to submit roster to OIC", "error");
    } finally {
      setLoading(false);
    }
  };

  // Format Display Month & Year Range for Header
  const startMonthStr = weekDays[0].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const endMonthStr = weekDays[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <Layout>
      <Box sx={{ p: 3, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
        
        {/* TOP HEADER BAR */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Button
              variant="text"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/duty-roster")}
              sx={{ color: "#475569", fontWeight: 600, textTransform: "none" }}
            >
              Back to Dashboard
            </Button>
            <Typography variant="h5" fontWeight="800" sx={{ color: "#0f172a", letterSpacing: "-0.5px" }}>
              Weekly Duty Roster
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            {/* Create New Duty Roster Button with Options */}
            {!isOIC && (
              <>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#f59e0b",
                    color: "#ffffff",
                    fontWeight: "bold",
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                    "&:hover": { backgroundColor: "#d97706" }
                  }}
                  startIcon={<AddIcon />}
                  onClick={(e) => setCreateMenuAnchor(e.currentTarget)}
                >
                  Create New Duty Roster
                </Button>
                <Menu
                  anchorEl={createMenuAnchor}
                  open={Boolean(createMenuAnchor)}
                  onClose={() => setCreateMenuAnchor(null)}
                >
                  <MenuItem onClick={() => { setCreateMenuAnchor(null); navigate("/duty-roster"); }}>
                    <AIIcon sx={{ mr: 1.5, color: "#3b82f6" }} /> Generate with AI
                  </MenuItem>
                  <MenuItem onClick={() => setCreateMenuAnchor(null)} selected>
                    <EditIcon sx={{ mr: 1.5, color: "#f59e0b" }} /> Create Manually
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Box>

        {/* CONTROLS & STEPPER BAR */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            
            {/* Week Date Picker Navigation */}
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton onClick={handlePrevWeek} size="small" sx={{ border: "1px solid #cbd5e1" }}>
                <ChevronLeftIcon />
              </IconButton>
              <Paper variant="outlined" sx={{ px: 2, py: 0.75, display: "flex", alignItems: "center", gap: 1, borderRadius: 2 }}>
                <Typography variant="body2" fontWeight="700" color="#334155">
                  📅 {startMonthStr} – {endMonthStr}
                </Typography>
              </Paper>
              <IconButton onClick={handleNextWeek} size="small" sx={{ border: "1px solid #cbd5e1" }}>
                <ChevronRightIcon />
              </IconButton>
            </Box>

            {/* Workflow Status Stepper - CLICKABLE BUTTONS */}
            <Box display="flex" alignItems="center" gap={1.5}>
              {["Draft", "Pending Approval", "Approved", "Published"].map((st, idx) => {
                const isActive = (selectedStatusTab || rosterStatus || "").toLowerCase() === st.toLowerCase();
                const count = getStatusCount(st);
                return (
                  <React.Fragment key={st}>
                    <Tooltip title={`Click to view ${st} Roster assignments for this week`} arrow>
                      <Chip
                        label={
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <span>● {st.toUpperCase()}</span>
                            {count > 0 && (
                              <Chip
                                label={count}
                                size="small"
                                sx={{
                                  height: 16,
                                  minWidth: 16,
                                  fontSize: 9,
                                  fontWeight: 800,
                                  backgroundColor: isActive ? "#2563eb" : "#94a3b8",
                                  color: "#ffffff",
                                  px: 0.5
                                }}
                              />
                            )}
                          </Box>
                        }
                        onClick={() => handleSelectStatusTab(st)}
                        clickable
                        size="small"
                        sx={{
                          fontWeight: "800",
                          fontSize: 11,
                          py: 1.8,
                          px: 1,
                          cursor: "pointer",
                          backgroundColor: isActive ? "#eff6ff" : "#ffffff",
                          color: isActive ? "#1d4ed8" : "#475569",
                          border: isActive ? "2px solid #2563eb" : "1px solid #cbd5e1",
                          boxShadow: isActive ? "0 2px 8px rgba(37, 99, 235, 0.25)" : "none",
                          "&:hover": {
                            backgroundColor: "#e0e7ff",
                            borderColor: "#2563eb",
                            transform: "translateY(-1px)"
                          },
                          transition: "all 0.15s ease-in-out"
                        }}
                      />
                    </Tooltip>
                    {idx < 3 && <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700 }}>→</Typography>}
                  </React.Fragment>
                );
              })}
            </Box>

            {/* Action Buttons: Validation & History */}
            <Box display="flex" alignItems="center" gap={1.5}>
              <Button
                variant="outlined"
                startIcon={<CheckCircleIcon />}
                onClick={handleRunValidation}
                sx={{ textTransform: "none", fontWeight: 700, borderColor: "#cbd5e1", color: "#334155" }}
              >
                Validation
              </Button>
              <Button
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={() => setHistoryOpen(true)}
                sx={{ textTransform: "none", fontWeight: 700, borderColor: "#cbd5e1", color: "#334155" }}
              >
                History
              </Button>
            </Box>

          </Box>
        </Paper>

        {/* SUMMARY CARDS (DYNAMIC) */}
        <Grid container spacing={2} mb={3}>
          
          <Grid item xs={12} sm={6} md={2}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e2e8f0", backgroundColor: "#0f172a", color: "#ffffff" }}>
              <Typography variant="caption" sx={{ textTransform: "uppercase", fontWeight: 700, color: "#94a3b8" }}>
                TOTAL OFFICERS 👥
              </Typography>
              <Typography variant="h4" fontWeight="800" sx={{ my: 0.5 }}>
                {totalOfficersCount}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                Available officers
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e2e8f0", backgroundColor: "#0f2942", color: "#ffffff" }}>
              <Typography variant="caption" sx={{ textTransform: "uppercase", fontWeight: 700, color: "#38bdf8" }}>
                ASSIGNED DUTIES 🗓️
              </Typography>
              <Typography variant="h4" fontWeight="800" sx={{ my: 0.5, color: "#38bdf8" }}>
                {assignedDutiesCount}
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                This week
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e2e8f0", backgroundColor: "#1e1b4b", color: "#ffffff" }}>
              <Typography variant="caption" sx={{ textTransform: "uppercase", fontWeight: 700, color: "#818cf8" }}>
                UNASSIGNED ⚠️
              </Typography>
              <Typography variant="h4" fontWeight="800" sx={{ my: 0.5, color: "#818cf8" }}>
                {unassignedCount}
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                Require attention
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e2e8f0", backgroundColor: "#1e293b", color: "#ffffff" }}>
              <Typography variant="caption" sx={{ textTransform: "uppercase", fontWeight: 700, color: "#94a3b8" }}>
                OFFICERS ON LEAVE ℹ️
              </Typography>
              <Typography variant="h4" fontWeight="800" sx={{ my: 0.5 }}>
                {officersOnLeaveCount}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                Approved leave
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e2e8f0", backgroundColor: "#0f172a", color: "#ffffff" }}>
              <Typography variant="caption" sx={{ textTransform: "uppercase", fontWeight: 700, color: "#94a3b8" }}>
                SPECIAL DUTIES 🛡️
              </Typography>
              <Typography variant="h4" fontWeight="800" sx={{ my: 0.5 }}>
                {specialDutiesCount}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                This week
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e2e8f0", backgroundColor: "#0f172a", color: "#ffffff" }}>
              <Typography variant="caption" sx={{ textTransform: "uppercase", fontWeight: 700, color: "#94a3b8" }}>
                ROSTER STATUS ✔️
              </Typography>
              <Typography variant="h6" fontWeight="800" sx={{ my: 1, color: "#38bdf8" }}>
                {rosterStatus}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                {rosterStatus === "Draft" ? "Not yet submitted" : "In review workflow"}
              </Typography>
            </Paper>
          </Grid>

        </Grid>

        {/* FILTERS BAR */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
          <Grid container spacing={2} alignItems="center">
            
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                placeholder="🔍 Search officer..."
                value={searchOfficer}
                onChange={(e) => setSearchOfficer(e.target.value)}
                size="small"
                fullWidth
              />
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <FormControl size="small" fullWidth>
                <Select value={filterDutyType} onChange={(e) => setFilterDutyType(e.target.value)} displayEmpty>
                  <MenuItem value="All">Duty Type ▾</MenuItem>
                  <MenuItem value="Traffic Patrol">Traffic Patrol</MenuItem>
                  <MenuItem value="Crime Investigation">Crime Investigation</MenuItem>
                  <MenuItem value="Accident Investigation">Accident Investigation</MenuItem>
                  <MenuItem value="Station Duty">Station Duty</MenuItem>
                  <MenuItem value="Motorcycle Patrol">Motorcycle Patrol</MenuItem>
                  <MenuItem value="Night Patrol">Night Patrol</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <FormControl size="small" fullWidth>
                <Select value={filterShift} onChange={(e) => setFilterShift(e.target.value)} displayEmpty>
                  <MenuItem value="All">Shift ▾</MenuItem>
                  {shifts.map(s => (
                    <MenuItem key={s._id} value={s.name}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <FormControl size="small" fullWidth>
                <Select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} displayEmpty>
                  <MenuItem value="All">Location ▾</MenuItem>
                  {rules.map(r => (
                    <MenuItem key={r._id} value={r.location}>{r.location}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={4} md={1.5}>
              <FormControl size="small" fullWidth>
                <Select value={filterLeave} onChange={(e) => setFilterLeave(e.target.value)} displayEmpty>
                  <MenuItem value="All">Leave ▾</MenuItem>
                  <MenuItem value="On Leave">On Leave</MenuItem>
                  <MenuItem value="Available">Available</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={4} md={1.5}>
              <FormControl size="small" fullWidth>
                <Select value={filterConflicts} onChange={(e) => setFilterConflicts(e.target.value)} displayEmpty>
                  <MenuItem value="All">Conflicts ▾</MenuItem>
                  <MenuItem value="With Conflicts">With Conflicts</MenuItem>
                  <MenuItem value="Clean">Clean</MenuItem>
                </Select>
              </FormControl>
            </Grid>

          </Grid>
        </Paper>

        {/* WEEKLY ROSTER GRID */}
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", mb: 3 }}>
          <Table size="small" sx={{ minWidth: 1000 }}>
            
            {/* Header Row: Officers & 7 Days of Selected Week */}
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: "#475569", width: 160, py: 1.5 }}>
                  OFFICER
                </TableCell>
                {weekDays.map((d, idx) => {
                  const dayName = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
                  const dayNum = d.getDate();
                  const monthName = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
                  return (
                    <TableCell key={idx} align="center" sx={{ fontWeight: 800, color: "#475569", py: 1.5 }}>
                      {dayName} {dayNum} {monthName}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : filteredOfficers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: "#64748b" }}>
                    No active officers found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOfficers.map((off) => (
                  <TableRow key={off._id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    
                    {/* Officer Column */}
                    <TableCell sx={{ verticalAlign: "middle", py: 1.5 }}>
                      <Typography variant="body2" fontWeight="800" sx={{ color: "#0f172a" }}>
                        {off.policeId || "PC 0000"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
                        {off.fullName || "Officer"}
                      </Typography>
                    </TableCell>

                    {/* 7 Days Columns */}
                    {weekDays.map((d, dayIdx) => {
                      const dStr = formatDateStr(d);
                      const key = `${off._id}_${dStr}`;
                      const asg = assignmentsMap[key];
                      const leave = isOfficerOnLeave(off._id, d);

                      let dutyTypeKey = "Off";
                      if (leave) {
                        dutyTypeKey = "Leave";
                      } else if (asg && asg.dutyType) {
                        dutyTypeKey = asg.dutyType;
                      } else if (!asg && dayIdx < 5) {
                        dutyTypeKey = "Unassigned";
                      }

                      const colors = DUTY_COLORS[dutyTypeKey] || DUTY_COLORS["Station Duty"];

                      return (
                        <TableCell
                          key={dayIdx}
                          align="center"
                          onClick={() => handleOpenCellEditor(off, d)}
                          sx={{
                            cursor: "pointer",
                            verticalAlign: "middle",
                            p: 0.75,
                            "&:hover": { opacity: 0.85 }
                          }}
                        >
                          {dutyTypeKey === "Off" ? (
                            <Typography variant="caption" sx={{ color: "#cbd5e1", fontWeight: 700 }}>
                              OFF
                            </Typography>
                          ) : (
                            <Paper
                              elevation={0}
                              sx={{
                                p: 1,
                                textAlign: "left",
                                borderRadius: 2,
                                backgroundColor: colors.bg,
                                borderLeft: `4px solid ${colors.border}`,
                                border: `1px solid ${colors.border}33`,
                                minHeight: 64,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between"
                              }}
                            >
                              <Typography variant="caption" fontWeight="800" sx={{ color: colors.text, fontSize: 10, lineHeight: 1.2, textTransform: "uppercase" }}>
                                {dutyTypeKey === "Unassigned" ? "⚠️ UNASSIGNED" : dutyTypeKey.toUpperCase()}
                              </Typography>

                              {leave ? (
                                <Typography variant="caption" sx={{ color: "#64748b", fontSize: 9 }}>
                                  Approved Leave ({leave.leaveType})
                                </Typography>
                              ) : asg ? (
                                <>
                                  <Typography variant="caption" sx={{ color: "#475569", fontSize: 9, display: "block" }}>
                                    ⏰ {asg.shift || "Full Day"}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: "#64748b", fontSize: 9, fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    📍 {asg.location || "Station"}
                                  </Typography>
                                </>
                              ) : (
                                <Typography variant="caption" sx={{ color: "#dc2626", fontSize: 9 }}>
                                  Tap to assign
                                </Typography>
                              )}
                            </Paper>
                          )}
                        </TableCell>
                      );
                    })}

                  </TableRow>
                ))
              )}
            </TableBody>

          </Table>
        </TableContainer>

        {/* BOTTOM ACTION BAR */}
        <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2}>
          <Button
            variant="outlined"
            size="large"
            startIcon={<SaveIcon />}
            onClick={handleSaveDraft}
            disabled={loading}
            sx={{ fontWeight: 700, px: 3, textTransform: "none", borderColor: "#cbd5e1", color: "#334155" }}
          >
            Save Draft
          </Button>

          {!isOIC && (
            <Button
              variant="contained"
              size="large"
              startIcon={<SendIcon />}
              onClick={handleSubmitToOIC}
              disabled={loading}
              sx={{
                fontWeight: "800",
                px: 4,
                py: 1.2,
                textTransform: "none",
                backgroundColor: "#f59e0b",
                color: "#ffffff",
                borderRadius: 2,
                boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                "&:hover": { backgroundColor: "#d97706" }
              }}
            >
              Submit to OIC
            </Button>
          )}
        </Box>

        {/* CELL EDITING MODAL */}
        <Dialog open={Boolean(editCell)} onClose={() => setEditCell(null)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800 }}>
            {editCell?.officer?.fullName} ({editCell?.dateStr})
          </DialogTitle>
          <DialogContent sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            
            {editCell?.leave && (
              <Alert severity="warning" sx={{ fontSize: 12 }}>
                Officer is on approved leave ({editCell.leave.leaveType}).
              </Alert>
            )}

            <FormControl fullWidth size="small">
              <InputLabel>Duty Type</InputLabel>
              <Select value={cellDutyType} onChange={(e) => setCellDutyType(e.target.value)} label="Duty Type">
                <MenuItem value="Traffic Patrol">Traffic Patrol</MenuItem>
                <MenuItem value="Crime Investigation">Crime Investigation</MenuItem>
                <MenuItem value="Accident Investigation">Accident Investigation</MenuItem>
                <MenuItem value="Station Duty">Station Duty</MenuItem>
                <MenuItem value="Motorcycle Patrol">Motorcycle Patrol</MenuItem>
                <MenuItem value="Night Patrol">Night Patrol</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Shift</InputLabel>
              <Select value={cellShift} onChange={(e) => setCellShift(e.target.value)} label="Shift">
                {shifts.map(s => (
                  <MenuItem key={s._id} value={s.name}>
                    {s.name} ({s.startTime} - {s.endTime})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Location</InputLabel>
              <Select value={cellLocation} onChange={(e) => setCellLocation(e.target.value)} label="Location">
                <MenuItem value="Police Station">Police Station</MenuItem>
                <MenuItem value="Negombo Town">Negombo Town</MenuItem>
                <MenuItem value="Beach Area">Beach Area</MenuItem>
                <MenuItem value="Highway">Colombo-Chilaw Highway (A3)</MenuItem>
                <MenuItem value="Main Road">Main Road Checkpoint</MenuItem>
              </Select>
            </FormControl>

            {vehicles.length > 0 && (
              <FormControl fullWidth size="small">
                <InputLabel>Assign Vehicle (Optional)</InputLabel>
                <Select value={cellVehicle} onChange={(e) => setCellVehicle(e.target.value)} label="Assign Vehicle (Optional)">
                  <MenuItem value="">None</MenuItem>
                  {vehicles.map(v => (
                    <MenuItem key={v._id} value={v.registrationNo}>
                      {v.registrationNo} ({v.vehicleType})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
            <Button color="error" size="small" onClick={() => handleSaveCellAssignment("Off")}>
              Mark OFF
            </Button>
            <Box gap={1} display="flex">
              <Button onClick={() => setEditCell(null)} size="small">Cancel</Button>
              <Button variant="contained" size="small" onClick={() => handleSaveCellAssignment(null)}>
                Save Assignment
              </Button>
            </Box>
          </DialogActions>
        </Dialog>

        {/* VALIDATION DRAWER / MODAL */}
        <Dialog open={validationOpen} onClose={() => setValidationOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleIcon color={validationResult.isValid ? "success" : "error"} />
            Roster Validation Results
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            {validationResult.isValid && validationResult.errors.length === 0 ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                ✓ Weekly roster passed all validation rules! No leave conflicts, rank violations, or double bookings detected.
              </Alert>
            ) : (
              <Alert severity="error" sx={{ mb: 2 }}>
                Found {validationResult.errors.length} critical validation conflict(s) that require attention before submission.
              </Alert>
            )}

            {validationResult.errors.map((err, idx) => (
              <Paper key={idx} elevation={0} sx={{ p: 1.5, mb: 1, backgroundColor: "#fef2f2", borderLeft: "4px solid #ef4444", borderRadius: 2 }}>
                <Typography variant="body2" fontWeight="700" color="#b91c1c">
                  ⚠️ {err.message}
                </Typography>
              </Paper>
            ))}

          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button variant="contained" onClick={() => setValidationOpen(false)}>
              Close & Edit Roster
            </Button>
          </DialogActions>
        </Dialog>

        {/* HISTORY DRAWER */}
        <Drawer anchor="right" open={historyOpen} onClose={() => setHistoryOpen(false)}>
          <Box sx={{ width: 340, p: 3 }}>
            <Typography variant="h6" fontWeight="800" mb={2}>
              📜 Roster History
            </Typography>
            {rosters.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No historical rosters found.</Typography>
            ) : (
              rosters.map((r, idx) => (
                <Paper key={idx} variant="outlined" sx={{ p: 1.5, mb: 1.5, borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight="700">
                    Roster #{r._id.slice(-6).toUpperCase()} ({r.rosterType})
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Status: <strong>{r.status}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Created by: {r.createdBy}
                  </Typography>
                </Paper>
              ))
            )}
          </Box>
        </Drawer>

        {/* SNACKBAR FEEDBACK */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>

      </Box>
    </Layout>
  );
}
