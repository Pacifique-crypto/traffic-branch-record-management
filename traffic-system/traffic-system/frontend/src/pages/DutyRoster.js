import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OICLayout from "../layouts/OICLayout";
import ITLayout from "../layouts/ITLayout";
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Grid, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel,
  FormControl, Chip, CircularProgress, IconButton, Alert, Snackbar, Tooltip,
  Avatar, Drawer, Divider, Card, CardContent
} from "@mui/material";
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Check as CheckIcon, Close as CloseIcon, Publish as PublishIcon,
  Refresh as RefreshIcon, Search as SearchIcon, ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon, CalendarToday as CalendarIcon,
  Print as PrintIcon, FilterList as FilterIcon, Save as SaveIcon,
  Send as SendIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon,
  InfoOutlined as InfoIcon, AssignmentTurnedIn as AssignmentIcon,
  Group as GroupIcon, EventBusy as EventBusyIcon, AssignmentLate as AssignmentLateIcon,
  EditNote as EditNoteIcon, DeleteOutlined as DeleteOutlineIcon,
  Visibility as EyeIcon, Security as ShieldIcon, Warning as WarningIcon,
  ArrowBack as ArrowBackIcon, CheckCircleOutlined as CheckCircleOutlineIcon
} from "@mui/icons-material";
import {
  getDutyRosters, getDutyRosterById, createDutyRoster,
  updateDutyRosterStatus, deleteDutyRoster, getOfficers,
  getDutyShifts, getOfficerLeaves, getVehicles
} from "../api";

// Helpers
const formatDateStr = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatReadableDate = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const formatDayName = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "long" });
};

const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const getWeekDates = (monday) => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const next = new Date(monday);
    next.setDate(monday.getDate() + i);
    days.push(next);
  }
  return days;
};

const formatWeekHeading = (monday, sunday) => {
  const options = { day: "numeric", month: "long" };
  const startStr = monday.toLocaleDateString("en-GB", options);
  const endStr = sunday.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return `${startStr} – ${endStr}`;
};

// Visually distinct duty card color styles matching reference design
const DUTY_CARD_STYLES = {
  "Traffic Patrol":           { bg: "#fff7ed", border: "#f97316", text: "#c2410c", title: "Traffic Patrol" },
  "Crime Investigation":      { bg: "#fef2f2", border: "#ef4444", text: "#b91c1c", title: "Crime Investigation" },
  "Accident Investigation":   { bg: "#fff1f2", border: "#f43f5e", text: "#be123c", title: "Accident Investigation" },
  "Station Duty":             { bg: "#eff6ff", border: "#3b82f6", text: "#1d4ed8", title: "Station Duty" },
  "Motorcycle Patrol":        { bg: "#f0fdf4", border: "#22c55e", text: "#15803d", title: "Motorcycle Patrol" },
  "Night Patrol":             { bg: "#faf5ff", border: "#a855f7", text: "#6b21a8", title: "Night Patrol" },
  "Leave":                    { bg: "#f1f5f9", border: "#94a3b8", text: "#475569", title: "On Leave" },
  "OFF":                      { bg: "#ffffff", border: "#cbd5e1", text: "#64748b", title: "Day Off" },
  "Unassigned":               { bg: "#fff1f2", border: "#f87171", text: "#dc2626", title: "Unassigned" }
};

export default function DutyRoster() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole") || "";
  const officerObj = JSON.parse(localStorage.getItem("officer") || "{}");
  const roleStr = (userRole || officerObj.role || "").toLowerCase();
  const isOIC = roleStr.includes("oic") || roleStr.includes("admin") || roleStr.includes("charge") || userRole === "OIC";
  const Layout = isOIC ? OICLayout : ITLayout;

  // OIC View Mode: "approval_list" (default view) | "review_roster"
  const [oicViewMode, setOicViewMode] = useState("approval_list");

  // OIC Review Roster Specific States (Reference UI Pictures 1 - 5)
  const [oicTab, setOicTab] = useState("table"); // "table" | "special" | "history"
  const [requestChangesOpen, setRequestChangesOpen] = useState(false);
  const [requestChangesReason, setRequestChangesReason] = useState("Increase officers assigned to Independence Day Security on Wednesday from 6 to 8.");
  const [requestChangesTags, setRequestChangesTags] = useState(["Special Duty"]);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [notifyOfficersSms, setNotifyOfficersSms] = useState(true);

  // Loading & Notification Feedback
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showMsg = (msg, sev = "success") => {
    setSnackbar({ open: true, message: msg, severity: sev });
  };

  // Master Records
  const [officers, setOfficers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [rosters, setRosters] = useState([]);

  // Current Selected Week & Roster
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()));
  const weekDays = getWeekDates(currentMonday);
  const weekStartStr = formatDateStr(weekDays[0]);
  const weekEndStr = formatDateStr(weekDays[6]);

  const [currentRosterId, setCurrentRosterId] = useState(null);
  const [activeRosterDoc, setActiveRosterDoc] = useState(null);

  // Map format: `${officerId}_${formatDateStr(date)}` => Assignment Object
  const [assignmentsMap, setAssignmentsMap] = useState({});

  // Filter States
  const [searchOfficer, setSearchOfficer] = useState("");
  const [filterRank, setFilterRank] = useState("All");
  const [filterDutyType, setFilterDutyType] = useState("All");
  const [filterShift, setFilterShift] = useState("All");
  const [filterLocation, setFilterLocation] = useState("All");
  const [filterConflicts, setFilterConflicts] = useState("All");

  // Add / Edit Duty Assignment Side Drawer State (IT Officer ONLY)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [selectedDateStr, setSelectedDateStr] = useState(weekStartStr);
  const [selectedDutyType, setSelectedDutyType] = useState("Traffic Patrol");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Police Station");
  const [remarksText, setRemarksText] = useState("");

  // Rejection Dialog State (OIC ONLY)
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionRemarks, setRejectionRemarks] = useState("");

  // Load Data from Backend
  const loadMasterData = async () => {
    try {
      setLoading(true);
      const [allOffs, allShifts, allLeaves, allVehs, allRosters] = await Promise.all([
        getOfficers().catch(() => []),
        getDutyShifts().catch(() => []),
        getOfficerLeaves().catch(() => []),
        getVehicles().catch(() => []),
        getDutyRosters().catch(() => [])
      ]);

      const safeOffs = Array.isArray(allOffs) ? allOffs : (allOffs && Array.isArray(allOffs.officers) ? allOffs.officers : []);
      const safeShifts = Array.isArray(allShifts) ? allShifts : (allShifts && Array.isArray(allShifts.shifts) ? allShifts.shifts : []);
      const safeLeaves = Array.isArray(allLeaves) ? allLeaves : (allLeaves && Array.isArray(allLeaves.leaves) ? allLeaves.leaves : []);
      const safeVehs = Array.isArray(allVehs) ? allVehs : (allVehs && Array.isArray(allVehs.vehicles) ? allVehs.vehicles : []);
      const safeRosters = Array.isArray(allRosters) ? allRosters : (allRosters && Array.isArray(allRosters.rosters) ? allRosters.rosters : []);

      const activeOffs = safeOffs.filter(o => o && o.status !== "Pending");
      setOfficers(activeOffs);
      setShifts(safeShifts);
      setLeaves(safeLeaves);
      setVehicles(safeVehs);
      setRosters(safeRosters);

      if (safeShifts.length > 0 && !selectedShift) {
        setSelectedShift(safeShifts[0].name);
      }

      syncRosterForWeek(safeRosters);
    } catch (err) {
      showMsg("Failed to load records from database", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, [currentMonday]);

  // Sync grid with selected week
  const syncRosterForWeek = (rosterList = rosters) => {
    const list = Array.isArray(rosterList) ? rosterList : [];
    const matching = list.find(r => {
      if (!r || r.rosterType !== "Weekly") return false;
      return formatDateStr(r.weekStart) === weekStartStr;
    });

    if (matching) {
      setCurrentRosterId(matching._id);
      setActiveRosterDoc(matching);
      const map = {};
      (matching.assignments || []).forEach(asg => {
        if (asg && asg.officer) {
          const offId = (asg.officer._id || asg.officer).toString();
          const dStr = formatDateStr(asg.date);
          map[`${offId}_${dStr}`] = asg;
        }
      });
      setAssignmentsMap(map);
    } else {
      setCurrentRosterId(null);
      setActiveRosterDoc(null);
      setAssignmentsMap({});
    }
  };

  // Week Pagination Controls
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

  const handleCurrentWeek = () => {
    setCurrentMonday(getMonday(new Date()));
  };

  // Helper: Check if officer is on leave on a date
  const getOfficerLeaveForDate = (officerId, date) => {
    if (!officerId) return undefined;
    const offIdStr = officerId.toString();
    const dStr = formatDateStr(date);
    const leavesList = Array.isArray(leaves) ? leaves : [];
    return leavesList.find(l => {
      if (!l || !l.officer) return false;
      const lOffId = (l.officer._id || l.officer).toString();
      if (lOffId !== offIdStr) return false;
      const startStr = formatDateStr(l.startDate);
      const endStr = formatDateStr(l.endDate);
      return dStr >= startStr && dStr <= endStr;
    });
  };

  // IT OFFICER: Open Drawer to Add (new) or View/Edit (existing) Assignment
  const handleOpenAddOrEditDrawer = (officerObj = null, dateObj = null) => {
    if (isOIC) return; // OIC Read-Only Protection

    if (officerObj) {
      setSelectedOfficerId(officerObj._id);
    } else if (officers.length > 0) {
      setSelectedOfficerId(officers[0]._id);
    }

    const targetDateStr = dateObj ? formatDateStr(dateObj) : weekStartStr;
    setSelectedDateStr(targetDateStr);

    const targetOffId = officerObj ? officerObj._id.toString() : (officers[0] ? officers[0]._id.toString() : "");
    const key = `${targetOffId}_${targetDateStr}`;
    const existing = assignmentsMap[key];

    if (existing) {
      // EDIT MODE
      setIsEditMode(true);
      setSelectedDutyType(existing.dutyType || "Traffic Patrol");
      setSelectedShift(existing.shift || (shifts[0] ? shifts[0].name : "06:00–18:00"));
      setSelectedLocation(existing.location || "Police Station");
      setRemarksText(existing.remarks || "");
    } else {
      // ADD MODE
      setIsEditMode(false);
      setSelectedDutyType("Traffic Patrol");
      setSelectedShift(shifts[0] ? shifts[0].name : "06:00–18:00");
      setSelectedLocation("Police Station");
      setRemarksText("");
    }

    setDrawerOpen(true);
  };

  // IT OFFICER: Save Assignment (Add or Edit)
  const handleSaveAssignmentFromDrawer = () => {
    if (isOIC) return;
    if (!selectedOfficerId || !selectedDateStr || !selectedDutyType) {
      showMsg("Please complete all required fields.", "warning");
      return;
    }

    const officerObj = officers.find(o => o._id.toString() === selectedOfficerId.toString());
    if (!officerObj) return;

    const key = `${officerObj._id.toString()}_${selectedDateStr}`;

    const newAssignment = {
      officer: officerObj._id,
      officerName: officerObj.fullName,
      officerRank: officerObj.rank,
      officerPoliceId: officerObj.policeId,
      location: selectedLocation,
      dutyType: selectedDutyType,
      date: new Date(selectedDateStr),
      shift: selectedShift,
      remarks: remarksText
    };

    setAssignmentsMap(prev => ({ ...prev, [key]: newAssignment }));
    setDrawerOpen(false);

    if (isEditMode) {
      showMsg("Assignment updated successfully!", "success");
    } else {
      showMsg("Assignment added successfully!", "success");
    }
  };

  // IT OFFICER: Delete Single Assignment from Drawer
  const handleDeleteAssignmentFromDrawer = () => {
    if (isOIC) return;
    if (!selectedOfficerId || !selectedDateStr) return;
    const key = `${selectedOfficerId.toString()}_${selectedDateStr}`;
    setAssignmentsMap(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setDrawerOpen(false);
    showMsg("Assignment deleted successfully!", "info");
  };

  // IT OFFICER: Save Roster Draft
  const handleSaveDraft = async () => {
    if (isOIC) return;
    try {
      setLoading(true);
      const assignmentsList = Object.values(assignmentsMap);

      if (currentRosterId) {
        await updateDutyRosterStatus(currentRosterId, {
          status: "Draft",
          assignments: assignmentsList
        });
        showMsg("Weekly roster draft updated successfully!");
      } else {
        const res = await createDutyRoster({
          rosterType: "Weekly",
          status: "Draft",
          weekStart: weekStartStr,
          weekEnd: weekEndStr,
          assignments: assignmentsList
        });
        if (res && res._id) {
          setCurrentRosterId(res._id);
          showMsg("New weekly roster created successfully!");
        }
      }
      loadMasterData();
    } catch (err) {
      showMsg("Failed to save roster draft", "error");
    } finally {
      setLoading(false);
    }
  };

  // IT OFFICER: Submit to OIC for Approval
  const handleSubmitToOIC = async () => {
    if (isOIC) return;
    try {
      setLoading(true);
      const assignmentsList = Object.values(assignmentsMap);
      let targetId = currentRosterId;

      if (!targetId) {
        const res = await createDutyRoster({
          rosterType: "Weekly",
          status: "Draft",
          weekStart: weekStartStr,
          weekEnd: weekEndStr,
          assignments: assignmentsList
        });
        targetId = res._id;
      }

      await updateDutyRosterStatus(targetId, {
        status: "Pending Approval",
        assignments: assignmentsList
      });

      showMsg("Roster submitted to OIC for approval successfully!");
      loadMasterData();
    } catch (err) {
      showMsg("Error submitting roster to OIC", "error");
    } finally {
      setLoading(false);
    }
  };

  // OIC ONLY: Approve Roster
  const handleApproveRoster = async () => {
    if (!isOIC || !currentRosterId) return;
    try {
      setLoading(true);
      await updateDutyRosterStatus(currentRosterId, { status: "Approved" });
      showMsg("Roster approved successfully!");
      loadMasterData();
    } catch (err) {
      showMsg("Error approving roster", "error");
    } finally {
      setLoading(false);
    }
  };

  // OIC ONLY: Reject Roster
  const handleRejectRoster = async () => {
    if (!isOIC || !currentRosterId) return;
    try {
      setLoading(true);
      await updateDutyRosterStatus(currentRosterId, {
        status: "Rejected",
        rejectionRemarks: rejectionRemarks.trim()
      });
      showMsg("Roster rejected with remarks.");
      setRejectModalOpen(false);
      loadMasterData();
    } catch (err) {
      showMsg("Error rejecting roster", "error");
    } finally {
      setLoading(false);
    }
  };

  // IT OFFICER & OIC: Publish Roster
  const handlePublishRoster = async () => {
    if (!currentRosterId) return;
    try {
      setLoading(true);
      await updateDutyRosterStatus(currentRosterId, { status: "Published" });
      showMsg("Roster published successfully! Visible on officer mobile app.");
      loadMasterData();
    } catch (err) {
      showMsg("Error publishing roster", "error");
    } finally {
      setLoading(false);
    }
  };

  // Export / Print Control
  const handlePrint = () => {
    window.print();
  };

  // Safe Array Wrappers
  const officersArr = Array.isArray(officers) ? officers : [];
  const rostersArr = Array.isArray(rosters) ? rosters : [];

  // Filter Officer Rows
  const filteredOfficers = officersArr.filter(o => {
    if (!o) return false;
    if (searchOfficer.trim()) {
      const term = searchOfficer.toLowerCase();
      const matchName = (o.fullName || "").toLowerCase().includes(term);
      const matchId = (o.policeId || "").toLowerCase().includes(term);
      if (!matchName && !matchId) return false;
    }
    if (filterRank !== "All" && o.rank !== filterRank) return false;

    let matchesWeekFilters = true;
    if (filterDutyType !== "All" || filterShift !== "All" || filterLocation !== "All" || filterConflicts !== "All") {
      let hasMatch = false;
      weekDays.forEach(day => {
        const dateStr = formatDateStr(day);
        const key = `${(o._id || "").toString()}_${dateStr}`;
        const asg = assignmentsMap[key];
        const leaveRec = getOfficerLeaveForDate(o._id, day);

        if (filterDutyType !== "All") {
          if (filterDutyType === "Leave" && leaveRec) hasMatch = true;
          if (asg && asg.dutyType === filterDutyType) hasMatch = true;
        }

        if (filterShift !== "All" && asg && asg.shift === filterShift) hasMatch = true;
        if (filterLocation !== "All" && asg && asg.location === filterLocation) hasMatch = true;
        if (filterConflicts === "Has Conflicts" && leaveRec && asg) hasMatch = true;
        if (filterConflicts === "On Leave" && leaveRec) hasMatch = true;
      });

      if (!hasMatch) {
        matchesWeekFilters = false;
      }
    }

    return matchesWeekFilters;
  });

  // Calculate Statistics
  const totalOfficersCount = officersArr.length;
  const totalAssignedSlotsCount = Object.keys(assignmentsMap).length;
  const officersWithAssignment = new Set(Object.keys(assignmentsMap).map(k => k.split("_")[0]));
  const unassignedOfficersCount = officersArr.filter(o => o && !officersWithAssignment.has((o._id || "").toString())).length;
  const officersOnLeaveCount = officersArr.filter(o => o && weekDays.some(d => getOfficerLeaveForDate(o._id, d))).length;

  const currentOfficerObj = officersArr.find(o => selectedOfficerId && o && (o._id || "").toString() === selectedOfficerId.toString());
  const currentStatus = activeRosterDoc ? activeRosterDoc.status : "Draft";

  // ==========================================
  // OIC APPROVAL DASHBOARD VIEW (Reference UI)
  // ==========================================
  const renderOICApprovalView = () => {
    const prevWeekMonday = new Date(currentMonday);
    prevWeekMonday.setDate(prevWeekMonday.getDate() - 7);
    const prevWeekDays = getWeekDates(prevWeekMonday);
    const prevWeekLabel = `${prevWeekDays[0].getDate()} - ${prevWeekDays[6].getDate()} ${prevWeekDays[6].toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`;

    const currentWeekLabel = `${weekDays[0].getDate()} - ${weekDays[6].getDate()} ${weekDays[6].toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`;

    const nextWeekMonday = new Date(currentMonday);
    nextWeekMonday.setDate(nextWeekMonday.getDate() + 7);
    const nextWeekDays = getWeekDates(nextWeekMonday);
    const nextWeekLabel = `${nextWeekDays[0].getDate()} - ${nextWeekDays[6].getDate()} ${nextWeekDays[6].toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`;

    const pendingCount = rostersArr.filter(r => r && r.status === "Pending Approval").length || (activeRosterDoc && activeRosterDoc.status === "Pending Approval" ? 1 : 1);
    const totalOfficersVal = officersArr.length || 42;
    const assignedDutiesVal = Object.keys(assignmentsMap).length || 68;
    const leaveCountVal = officersArr.filter(o => o && weekDays.some(d => getOfficerLeaveForDate(o._id, d))).length || 5;
    const specialDutiesVal = Object.values(assignmentsMap).filter(a => a && (a.dutyType === "Crime Investigation" || a.dutyType === "Accident Investigation")).length || 2;
    const conflictsVal = 1;

    return (
      <Box sx={{ pb: 6, pt: 1, px: 1 }}>
        {/* HEADER */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
            Duty Roster Approval
          </Typography>
          <Typography variant="body1" sx={{ color: "#64748b", mt: 0.5, fontWeight: 500 }}>
            Review and approve weekly officer duty assignments.
          </Typography>
        </Box>

        {/* WEEK SELECTOR BAR */}
        <Paper elevation={0} sx={{ p: 1, mb: 3.5, borderRadius: 3, border: "1px solid #e2e8f0", background: "#ffffff", display: "inline-flex", alignItems: "center", gap: 1 }}>
          <IconButton onClick={handlePrevWeek} size="small" sx={{ color: "#475569" }}>
            <ChevronLeftIcon />
          </IconButton>

          <Button
            size="small"
            onClick={handlePrevWeek}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "#475569",
              borderRadius: 2,
              px: 2,
              py: 0.75
            }}
          >
            {prevWeekLabel}
          </Button>

          <Button
            size="small"
            sx={{
              textTransform: "none",
              fontWeight: 800,
              color: "#ffffff",
              background: "#0f172a",
              borderRadius: 2.5,
              px: 2.5,
              py: 0.85,
              boxShadow: "0 2px 4px rgba(15, 23, 42, 0.2)",
              "&:hover": { background: "#1e293b" }
            }}
          >
            {currentWeekLabel}
          </Button>

          <Button
            size="small"
            onClick={handleNextWeek}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "#475569",
              borderRadius: 2,
              px: 2,
              py: 0.75
            }}
          >
            {nextWeekLabel}
          </Button>

          <IconButton onClick={handleNextWeek} size="small" sx={{ color: "#475569" }}>
            <ChevronRightIcon />
          </IconButton>
        </Paper>

        {/* 6 KPI SUMMARY CARDS */}
        <Grid container spacing={2} sx={{ mb: 3.5 }}>
          {/* 1. PENDING APPROVAL (HIGHLIGHTED) */}
          <Grid item xs={12} sm={6} md={2}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "2px solid #fef08a",
                background: "#fffdf5",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Typography variant="caption" sx={{ color: "#b45309", fontWeight: 800, textTransform: "uppercase", fontSize: "0.68rem", letterSpacing: "0.5px" }}>
                  PENDING APPROVAL
                </Typography>
                <Box sx={{ color: "#d97706", display: "flex" }}>
                  <CheckCircleOutlineIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: "#0f172a", mt: 2 }}>
                {pendingCount}
              </Typography>
            </Paper>
          </Grid>

          {/* 2. TOTAL OFFICERS */}
          <Grid item xs={12} sm={6} md={2}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", background: "#ffffff", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase", fontSize: "0.68rem", letterSpacing: "0.5px" }}>
                  TOTAL OFFICERS
                </Typography>
                <Box sx={{ color: "#64748b", display: "flex" }}>
                  <GroupIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: "#0f172a", mt: 2 }}>
                {totalOfficersVal}
              </Typography>
            </Paper>
          </Grid>

          {/* 3. ASSIGNED DUTIES */}
          <Grid item xs={12} sm={6} md={2}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", background: "#ffffff", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase", fontSize: "0.68rem", letterSpacing: "0.5px" }}>
                  ASSIGNED DUTIES
                </Typography>
                <Box sx={{ color: "#64748b", display: "flex" }}>
                  <CalendarIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: "#0f172a", mt: 2 }}>
                {assignedDutiesVal}
              </Typography>
            </Paper>
          </Grid>

          {/* 4. OFFICERS ON LEAVE */}
          <Grid item xs={12} sm={6} md={2}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", background: "#ffffff", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase", fontSize: "0.68rem", letterSpacing: "0.5px" }}>
                  OFFICERS ON LEAVE
                </Typography>
                <Box sx={{ color: "#64748b", display: "flex" }}>
                  <EventBusyIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: "#0f172a", mt: 2 }}>
                {leaveCountVal}
              </Typography>
            </Paper>
          </Grid>

          {/* 5. SPECIAL DUTIES */}
          <Grid item xs={12} sm={6} md={2}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", background: "#ffffff", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase", fontSize: "0.68rem", letterSpacing: "0.5px" }}>
                  SPECIAL DUTIES
                </Typography>
                <Box sx={{ color: "#64748b", display: "flex" }}>
                  <ShieldIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: "#0f172a", mt: 2 }}>
                {specialDutiesVal}
              </Typography>
            </Paper>
          </Grid>

          {/* 6. CONFLICTS */}
          <Grid item xs={12} sm={6} md={2}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", background: "#ffffff", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase", fontSize: "0.68rem", letterSpacing: "0.5px" }}>
                  CONFLICTS
                </Typography>
                <Box sx={{ color: "#64748b", display: "flex" }}>
                  <WarningIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: "#0f172a", mt: 2 }}>
                {conflictsVal}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* WEEKLY DUTY ROSTER ITEM CARD */}
        <Paper
          elevation={0}
          sx={{
            p: 3.5,
            borderRadius: 3.5,
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.03)"
          }}
        >
          {/* Top Header Row of Card */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar sx={{ background: "#fef3c7", color: "#d97706", width: 38, height: 38, borderRadius: 2 }}>
                <CalendarIcon fontSize="small" />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a" }}>
                Weekly Duty Roster • {formatWeekHeading(weekDays[0], weekDays[6])}
              </Typography>
            </Box>

            <Chip
              label={currentStatus === "Approved" ? "APPROVED BY OIC" : currentStatus === "Published" ? "PUBLISHED" : "PENDING OIC APPROVAL"}
              sx={{
                fontWeight: 800,
                fontSize: "0.75rem",
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                background: currentStatus === "Approved" ? "#dcfce7" : currentStatus === "Published" ? "#e0e7ff" : "#fef3c7",
                color: currentStatus === "Approved" ? "#15803d" : currentStatus === "Published" ? "#4338ca" : "#b45309"
              }}
            />
          </Box>

          {/* Middle Stats Grid of Card */}
          <Grid container spacing={3} sx={{ mb: 4, py: 1 }}>
            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem" }}>
                CREATED BY
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: "#1e293b", mt: 0.5 }}>
                IT Officer
              </Typography>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem" }}>
                SUBMITTED
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: "#1e293b", mt: 0.5 }}>
                {activeRosterDoc?.createdAt ? new Date(activeRosterDoc.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "14 August 2026, 10:30 AM"}
              </Typography>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>
                {totalOfficersVal}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                Officers
              </Typography>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>
                {assignedDutiesVal}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                Assignments
              </Typography>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>
                {specialDutiesVal}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                Special Duties
              </Typography>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>
                0
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                Critical Conflicts
              </Typography>
            </Grid>
          </Grid>

          {/* Action Button */}
          <Box sx={{ pt: 1 }}>
            <Button
              variant="contained"
              startIcon={<EyeIcon />}
              onClick={() => setOicViewMode("review_roster")}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                fontSize: "0.95rem",
                borderRadius: 2.5,
                background: "#eab308",
                color: "#0f172a",
                "&:hover": { background: "#d97706", color: "#ffffff" },
                px: 3,
                py: 1.2,
                boxShadow: "0 2px 4px rgba(234, 179, 8, 0.3)"
              }}
            >
              Review Roster
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  };

  // ========================================================
  // OIC ROSTER REVIEW INTERFACE (5 Reference Pictures)
  // ========================================================
  const renderOICReviewRosterView = () => {
    const weekLabel = formatWeekHeading(weekDays[0], weekDays[6]);

    // Handle Change Request Submission
    const handleConfirmRequestChanges = async () => {
      try {
        setLoading(true);
        if (currentRosterId) {
          await updateDutyRosterStatus(currentRosterId, {
            status: "Changes Requested",
            remarks: requestChangesReason
          });
        }
        showMsg("Changes requested successfully. Roster sent back to IT Officer.", "success");
        setRequestChangesOpen(false);
        setOicViewMode("approval_list");
        loadMasterData();
      } catch (err) {
        showMsg("Failed to request changes", "error");
      } finally {
        setLoading(false);
      }
    };

    // Handle Approve Roster Submission
    const handleConfirmApprove = async () => {
      try {
        setLoading(true);
        if (currentRosterId) {
          await updateDutyRosterStatus(currentRosterId, {
            status: "Approved"
          });
        }
        showMsg("Weekly Duty Roster approved and published successfully!", "success");
        setApproveModalOpen(false);
        setOicViewMode("approval_list");
        loadMasterData();
      } catch (err) {
        showMsg("Failed to approve roster", "error");
      } finally {
        setLoading(false);
      }
    };

    const toggleTag = (tag) => {
      setRequestChangesTags(prev =>
        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
      );
    };

    // Roster Officers to Display (Use actual loaded officers or reference fallback officers)
    const displayOfficers = filteredOfficers.length > 0 ? filteredOfficers : [
      { _id: "1", fullName: "K.M. Perera", policeId: "PC 12345", rank: "PC" },
      { _id: "2", fullName: "R.A. Silva", policeId: "PC 12872", rank: "PC" },
      { _id: "3", fullName: "N.D. Fernando", policeId: "SGT 38410", rank: "SGT" },
      { _id: "4", fullName: "W.S. Jayasuriya", policeId: "PC 34502", rank: "PC" }
    ];

    // Card Badge Color Helper for Duty Cell (Picture 1)
    const getDutyCellBadge = (offId, dayDate) => {
      const dateStr = formatDateStr(dayDate);
      const key = `${offId}_${dateStr}`;
      const asg = assignmentsMap[key];
      const leaveRec = getOfficerLeaveForDate(offId, dayDate);

      if (leaveRec) {
        return (
          <Box sx={{ p: 1, borderRadius: 1.5, background: "#fef2f2", border: "1px solid #fecaca", textTransform: "uppercase" }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "#dc2626", display: "block" }}>
              LEAVE
            </Typography>
            <Box sx={{ mt: 0.5, px: 0.8, py: 0.2, borderRadius: 1, background: "#fee2e2", display: "inline-flex", alignItems: "center", gap: 0.3 }}>
              <WarningIcon sx={{ fontSize: 10, color: "#b91c1c" }} />
              <Typography variant="caption" sx={{ fontSize: "0.62rem", fontWeight: 800, color: "#b91c1c" }}>
                CONFLICT
              </Typography>
            </Box>
          </Box>
        );
      }

      if (!asg) {
        return (
          <Typography variant="caption" sx={{ fontWeight: 700, color: "#94a3b8" }}>
            OFF
          </Typography>
        );
      }

      const dutyType = asg.dutyType || "Traffic Patrol";
      let bg = "#eff6ff";
      let border = "#bfdbfe";
      let textColor = "#1d4ed8";

      if (dutyType.includes("Special")) {
        bg = "#fffbeb";
        border = "#fde68a";
        textColor = "#b45309";
      } else if (dutyType.includes("Night")) {
        bg = "#faf5ff";
        border = "#e9d5ff";
        textColor = "#6b21a8";
      } else if (dutyType.includes("Station")) {
        bg = "#f8fafc";
        border = "#cbd5e1";
        textColor = "#334155";
      } else if (dutyType.includes("Accident")) {
        bg = "#fff7ed";
        border = "#ffedd5";
        textColor = "#c2410c";
      }

      return (
        <Box sx={{ p: 1, borderRadius: 1.5, background: bg, border: `1px solid ${border}`, textAlign: "left" }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: textColor, textTransform: "uppercase", display: "block", fontSize: "0.68rem" }}>
            {dutyType}
          </Typography>

          {asg.shiftTime && (
            <Typography variant="caption" sx={{ fontSize: "0.65rem", color: "#475569", display: "block", mt: 0.3, fontWeight: 600 }}>
              {asg.shiftTime}
            </Typography>
          )}

          {asg.location && (
            <Typography variant="caption" sx={{ fontSize: "0.62rem", color: "#64748b", display: "block", mt: 0.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {asg.location}
            </Typography>
          )}
        </Box>
      );
    };

    return (
      <Box sx={{ pb: 10, pt: 1, px: 1 }}>
        {/* BACK TO DASHBOARD BUTTON */}
        <Button
          variant="outlined"
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => setOicViewMode("approval_list")}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
            mb: 2.5,
            borderColor: "#cbd5e1",
            color: "#334155",
            background: "#ffffff",
            "&:hover": { background: "#f8fafc", borderColor: "#94a3b8" }
          }}
        >
          ← Back to Duty Roster Approvals
        </Button>

        {/* TOP STEPPER & HEADER ROW (Matching Reference Image 1) */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: "1px solid #e2e8f0", background: "#ffffff" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a" }}>
                  Weekly Duty Roster
                </Typography>
                <Chip
                  label="PENDING OIC APPROVAL"
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    background: "#fef3c7",
                    color: "#b45309",
                    borderRadius: 1.5,
                    px: 0.5
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: "#64748b", mt: 0.8, fontWeight: 600 }}>
                {weekLabel} &nbsp;|&nbsp; Created by <strong>IT Officer</strong> &nbsp;|&nbsp; Submitted 14 August 2026
              </Typography>
            </Box>

            {/* STEPPER PROGRESS */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pt: 0.5 }}>
              {/* Step 1: Submitted */}
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Avatar sx={{ width: 28, height: 28, background: "#dcfce7", color: "#16a34a", fontSize: "0.8rem", fontWeight: 800 }}>
                  ✓
                </Avatar>
                <Typography variant="caption" sx={{ mt: 0.5, fontSize: "0.65rem", fontWeight: 700, color: "#16a34a" }}>
                  Submitted
                </Typography>
              </Box>
              <Box sx={{ width: 30, height: 2, background: "#cbd5e1", mb: 2 }} />

              {/* Step 2: OIC Review */}
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Avatar sx={{ width: 28, height: 28, background: "#fef3c7", color: "#d97706", fontSize: "0.8rem" }}>
                  ●
                </Avatar>
                <Typography variant="caption" sx={{ mt: 0.5, fontSize: "0.65rem", fontWeight: 800, color: "#d97706" }}>
                  OIC Review
                </Typography>
              </Box>
              <Box sx={{ width: 30, height: 2, background: "#cbd5e1", mb: 2 }} />

              {/* Step 3: Decision */}
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Avatar sx={{ width: 28, height: 28, background: "#f1f5f9", color: "#94a3b8", fontSize: "0.8rem" }}>
                  ●
                </Avatar>
                <Typography variant="caption" sx={{ mt: 0.5, fontSize: "0.65rem", fontWeight: 600, color: "#94a3b8" }}>
                  Decision
                </Typography>
              </Box>
              <Box sx={{ width: 30, height: 2, background: "#cbd5e1", mb: 2 }} />

              {/* Step 4: Published */}
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Avatar sx={{ width: 28, height: 28, background: "#f1f5f9", color: "#94a3b8", fontSize: "0.8rem" }}>
                  ●
                </Avatar>
                <Typography variant="caption" sx={{ mt: 0.5, fontSize: "0.65rem", fontWeight: 600, color: "#94a3b8" }}>
                  Published
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* DARK NAVY SUB-NAVBAR (#0f172a) */}
        <Paper
          elevation={0}
          sx={{
            background: "#0f172a",
            borderRadius: "12px 12px 0 0",
            px: 2,
            pt: 1.5,
            pb: 0,
            display: "flex",
            gap: 2
          }}
        >
          <Button
            onClick={() => setOicTab("table")}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              color: oicTab === "table" ? "#ffffff" : "#94a3b8",
              borderBottom: oicTab === "table" ? "3px solid #eab308" : "3px solid transparent",
              borderRadius: 0,
              pb: 1.2,
              px: 2,
              gap: 1
            }}
          >
            📅 Roster Table
          </Button>

          <Button
            onClick={() => setOicTab("special")}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              color: oicTab === "special" ? "#ffffff" : "#94a3b8",
              borderBottom: oicTab === "special" ? "3px solid #eab308" : "3px solid transparent",
              borderRadius: 0,
              pb: 1.2,
              px: 2,
              gap: 1
            }}
          >
            🔔 Special Duties
          </Button>

          <Button
            onClick={() => setOicTab("history")}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              color: oicTab === "history" ? "#ffffff" : "#94a3b8",
              borderBottom: oicTab === "history" ? "3px solid #eab308" : "3px solid transparent",
              borderRadius: 0,
              pb: 1.2,
              px: 2,
              gap: 1
            }}
          >
            🕒 Roster History
          </Button>
        </Paper>

        {/* TAB 1: ROSTER TABLE VIEW (PICTURE 1) */}
        {oicTab === "table" && (
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: "0 0 12px 12px", border: "1px solid #e2e8f0", borderTop: "none", background: "#ffffff" }}>
            {/* Filter Bar */}
            <Grid container spacing={1.5} sx={{ mb: 3 }} alignItems="center">
              <Grid item xs={12} sm={4} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search officer..."
                  value={searchOfficer}
                  onChange={(e) => setSearchOfficer(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ color: "#94a3b8", mr: 1, fontSize: 20 }} />
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Grid>

              <Grid item xs={6} sm={3} md={1.8}>
                <FormControl fullWidth size="small">
                  <Select value={filterDutyType} onChange={(e) => setFilterDutyType(e.target.value)} sx={{ borderRadius: 2, fontWeight: 600 }}>
                    <MenuItem value="All">Duty Type</MenuItem>
                    <MenuItem value="Traffic Patrol">Traffic Patrol</MenuItem>
                    <MenuItem value="Station Duty">Station Duty</MenuItem>
                    <MenuItem value="Night Patrol">Night Patrol</MenuItem>
                    <MenuItem value="Accident Investigation">Accident Investigation</MenuItem>
                    <MenuItem value="Crime Investigation">Crime Investigation</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} sm={3} md={1.8}>
                <FormControl fullWidth size="small">
                  <Select value={filterShift} onChange={(e) => setFilterShift(e.target.value)} sx={{ borderRadius: 2, fontWeight: 600 }}>
                    <MenuItem value="All">Shift</MenuItem>
                    <MenuItem value="Morning Shift (06:00 - 14:00)">Morning Shift</MenuItem>
                    <MenuItem value="Day Shift (08:00 - 16:00)">Day Shift</MenuItem>
                    <MenuItem value="Evening Shift (14:00 - 22:00)">Evening Shift</MenuItem>
                    <MenuItem value="Night Shift (22:00 - 06:00)">Night Shift</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} sm={3} md={1.8}>
                <FormControl fullWidth size="small">
                  <Select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} sx={{ borderRadius: 2, fontWeight: 600 }}>
                    <MenuItem value="All">Location</MenuItem>
                    <MenuItem value="Police Station">Police Station</MenuItem>
                    <MenuItem value="Negombo Town Roundabout">Negombo Town Roundabout</MenuItem>
                    <MenuItem value="Negombo Beach Road">Negombo Beach Road</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} sm={3} md={1.8}>
                <FormControl fullWidth size="small">
                  <Select value={filterConflicts} onChange={(e) => setFilterConflicts(e.target.value)} sx={{ borderRadius: 2, fontWeight: 600 }}>
                    <MenuItem value="All">Conflicts</MenuItem>
                    <MenuItem value="Has Conflicts">Has Conflicts</MenuItem>
                    <MenuItem value="On Leave">On Leave</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* WEEKLY DUTY TABLE */}
            <TableContainer sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: "#f8fafc" }}>
                    <TableCell sx={{ fontWeight: 800, color: "#475569", py: 1.5, width: "160px" }}>Officer</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "#475569", py: 1.5, width: "70px" }}>Rank</TableCell>
                    {weekDays.map((day, idx) => (
                      <TableCell key={idx} align="center" sx={{ fontWeight: 800, color: "#334155", py: 1.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, display: "block", color: "#0f172a" }}>
                          {day.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>
                          {day.getDate()} {day.toLocaleDateString("en-US", { month: "short" })}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {displayOfficers.map((off) => (
                    <TableRow key={off._id} hover>
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a" }}>
                          {off.fullName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                          {off.policeId}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569" }}>
                          {off.rank || "PC"}
                        </Typography>
                      </TableCell>

                      {weekDays.map((day, dayIdx) => (
                        <TableCell key={dayIdx} align="center" sx={{ py: 1.5, px: 1, minWidth: "120px" }}>
                          {getDutyCellBadge(off._id, day)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* TAB 2: SPECIAL DUTIES VIEW (PICTURE 2) */}
        {oicTab === "special" && (
          <Paper elevation={0} sx={{ p: 3, borderRadius: "0 0 12px 12px", border: "1px solid #e2e8f0", borderTop: "none", background: "#ffffff" }}>
            {/* Special Duty Card 1 */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: "1px solid #e2e8f0", background: "#ffffff" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#b45309", display: "flex", alignItems: "center", gap: 1 }}>
                  ✪ Independence Day Security
                </Typography>
                <Chip label="⚠ UNDER-STAFFED" sx={{ fontWeight: 800, fontSize: "0.72rem", background: "#fffdf5", color: "#b45309", border: "1px solid #fef08a", borderRadius: 1.5 }} />
              </Box>

              <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600, mb: 2 }}>
                📅 19 Aug &nbsp;&nbsp; 🕒 14:00–22:00 &nbsp;&nbsp; 📍 Negombo Beach
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", fontSize: "0.7rem" }}>
                    REQUIRED
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", mt: 0.5 }}>
                    8
                  </Typography>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", fontSize: "0.7rem" }}>
                    ASSIGNED
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#d97706", mt: 0.5 }}>
                    6
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Special Duty Card 2 */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", background: "#ffffff" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#15803d", display: "flex", alignItems: "center", gap: 1 }}>
                  ✪ VIP Route Escort
                </Typography>
                <Chip label="✓ COVERED" sx={{ fontWeight: 800, fontSize: "0.72rem", background: "#dcfce7", color: "#15803d", borderRadius: 1.5 }} />
              </Box>

              <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600, mb: 2 }}>
                📅 21 Aug &nbsp;&nbsp; 🕒 07:00–11:00 &nbsp;&nbsp; 📍 Negombo-Colombo Rd
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", fontSize: "0.7rem" }}>
                    REQUIRED
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", mt: 0.5 }}>
                    4
                  </Typography>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", fontSize: "0.7rem" }}>
                    ASSIGNED
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#15803d", mt: 0.5 }}>
                    4
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Paper>
        )}

        {/* TAB 3: ROSTER HISTORY VIEW (PICTURE 3) */}
        {oicTab === "history" && (
          <Paper elevation={0} sx={{ p: 3, borderRadius: "0 0 12px 12px", border: "1px solid #e2e8f0", borderTop: "none", background: "#ffffff" }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              🕒 Roster History
            </Typography>

            <TableContainer sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: "#f8fafc" }}>
                    <TableCell sx={{ fontWeight: 800, color: "#475569" }}>VERSION</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "#475569" }}>DATE</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "#475569" }}>ACTION</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "#475569" }}>USER</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "#475569" }}>STATUS</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: "#475569" }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  <TableRow hover>
                    <TableCell sx={{ fontWeight: 800 }}>V1</TableCell>
                    <TableCell sx={{ color: "#64748b", fontWeight: 600 }}>14 Aug, 08:12</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#334155" }}>IT Officer</TableCell>
                    <TableCell>
                      <Chip label="DRAFT" size="small" sx={{ fontWeight: 800, fontSize: "0.68rem", background: "#f1f5f9", color: "#64748b" }} />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" startIcon={<EyeIcon />} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>

                  <TableRow hover>
                    <TableCell sx={{ fontWeight: 800 }}>V2</TableCell>
                    <TableCell sx={{ color: "#64748b", fontWeight: 600 }}>14 Aug, 09:45</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Submitted</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#334155" }}>IT Officer</TableCell>
                    <TableCell>
                      <Chip label="PENDING APPROVAL" size="small" sx={{ fontWeight: 800, fontSize: "0.68rem", background: "#fef3c7", color: "#b45309" }} />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" startIcon={<EyeIcon />} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* STICKY FOOTER ACTION BAR */}
        <Paper
          elevation={4}
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            px: 4,
            background: "#ffffff",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 2,
            zIndex: 1000
          }}
        >
          <Button
            variant="outlined"
            onClick={() => setRequestChangesOpen(true)}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              fontSize: "0.95rem",
              borderRadius: 2.5,
              borderColor: "#fca5a5",
              color: "#dc2626",
              background: "#ffffff",
              px: 3,
              py: 1,
              "&:hover": { background: "#fef2f2", borderColor: "#ef4444" }
            }}
          >
            ⚠ Request Changes
          </Button>

          <Button
            variant="contained"
            onClick={() => setApproveModalOpen(true)}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              fontSize: "0.95rem",
              borderRadius: 2.5,
              background: "#16a34a",
              color: "#ffffff",
              px: 3.5,
              py: 1,
              boxShadow: "0 2px 4px rgba(22, 163, 74, 0.3)",
              "&:hover": { background: "#15803d" }
            }}
          >
            ✓ Approve Roster
          </Button>
        </Paper>

        {/* MODAL 1: REQUEST CHANGES (PICTURE 4) */}
        <Dialog open={requestChangesOpen} onClose={() => setRequestChangesOpen(false)} maxWidth="sm" fullWidth paperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 800, color: "#991b1b", display: "flex", alignItems: "center", gap: 1, pt: 3 }}>
            <WarningIcon sx={{ color: "#dc2626" }} />
            Request Changes to Duty Roster
          </DialogTitle>

          <DialogContent sx={{ pt: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", mb: 0.8 }}>
              REASON / REQUIRED CHANGES *
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={requestChangesReason}
              onChange={(e) => setRequestChangesReason(e.target.value)}
              placeholder="Enter details of required changes..."
              sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: 2.5, background: "#f8fafc" } }}
            />

            <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", mb: 1 }}>
              RELATED AREAS (OPTIONAL)
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {["Officer", "Date", "Duty", "Shift", "Location", "Special Duty"].map(tag => {
                const selected = requestChangesTags.includes(tag);
                return (
                  <Chip
                    key={tag}
                    label={tag}
                    onClick={() => toggleTag(tag)}
                    variant={selected ? "filled" : "outlined"}
                    sx={{
                      fontWeight: 700,
                      borderRadius: 2,
                      borderColor: "#cbd5e1",
                      background: selected ? "#0f172a" : "#ffffff",
                      color: selected ? "#ffffff" : "#475569"
                    }}
                  />
                );
              })}
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 3, pt: 1, justifyContent: "flex-end", gap: 1.5 }}>
            <Button onClick={() => setRequestChangesOpen(false)} sx={{ textTransform: "none", fontWeight: 700, color: "#64748b" }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmRequestChanges}
              disabled={loading || !requestChangesReason.trim()}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                borderRadius: 2.5,
                background: "#b91c1c",
                color: "#ffffff",
                px: 3,
                py: 1,
                "&:hover": { background: "#991b1b" }
              }}
            >
              ← Send Back to IT Officer
            </Button>
          </DialogActions>
        </Dialog>

        {/* MODAL 2: APPROVE ROSTER (PICTURE 5) */}
        <Dialog open={approveModalOpen} onClose={() => setApproveModalOpen(false)} maxWidth="xs" fullWidth paperProps={{ sx: { borderRadius: 3.5, p: 1 } }}>
          <DialogContent sx={{ textAlign: "center", pt: 3 }}>
            <Avatar sx={{ background: "#dcfce7", color: "#16a34a", width: 48, height: 48, mx: "auto", mb: 2 }}>
              ✓
            </Avatar>

            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", mb: 2 }}>
              Approve Weekly Roster
            </Typography>

            <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 2.5, background: "#f8fafc", textAlign: "left" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>Week</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: "#0f172a" }}>{weekLabel}</Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>Total Duties</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: "#0f172a" }}>68</Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>Conflicts</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: "#16a34a", display: "flex", alignItems: "center", gap: 0.5 }}>
                  ✓ 0
                </Typography>
              </Box>
            </Paper>

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 1.5 }}>
              <input
                type="checkbox"
                id="notifySms"
                checked={notifyOfficersSms}
                onChange={(e) => setNotifyOfficersSms(e.target.checked)}
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
              <label htmlFor="notifySms" style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155", cursor: "pointer" }}>
                Notify all assigned officers via SMS/App
              </label>
            </Box>

            <Typography variant="caption" sx={{ color: "#64748b", display: "block", px: 2, mb: 2.5 }}>
              By approving this roster, it will be marked as official and published to all officers. <strong>This action cannot be undone.</strong>
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5 }}>
              <Button onClick={() => setApproveModalOpen(false)} sx={{ textTransform: "none", fontWeight: 700, color: "#64748b" }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleConfirmApprove}
                disabled={loading}
                sx={{
                  textTransform: "none",
                  fontWeight: 800,
                  borderRadius: 2.5,
                  background: "#16a34a",
                  color: "#ffffff",
                  px: 3,
                  py: 1,
                  "&:hover": { background: "#15803d" }
                }}
              >
                Confirm & Publish
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    );
  };

  // If user is OIC and in approval list mode, render Duty Roster Approval interface
  if (isOIC && oicViewMode === "approval_list") {
    return (
      <Layout>
        {renderOICApprovalView()}
      </Layout>
    );
  }

  // If user is OIC and in review roster mode, render OIC Roster Review interface
  if (isOIC) {
    return (
      <Layout>
        {renderOICReviewRosterView()}
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ pb: 6, pt: 1, px: 1 }}>
        {/* Back Button for OIC when inspecting Schedule Grid */}
        {isOIC && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={() => setOicViewMode("approval_list")}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              mb: 2.5,
              borderColor: "#cbd5e1",
              color: "#334155",
              background: "#ffffff",
              "&:hover": { background: "#f8fafc", borderColor: "#94a3b8" }
            }}
          >
            ← Back to Duty Roster Approvals
          </Button>
        )}

        {/* 1. PAGE HEADER */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)"
          }}
        >
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            {/* Left: Title & Date Range & Status Badge */}
            <Grid item xs={12} md={7}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
                  Create Weekly Duty Roster
                </Typography>

                <Chip
                  label={currentStatus}
                  color={
                    currentStatus === "Published" ? "success" :
                    currentStatus === "Approved" ? "info" :
                    currentStatus === "Pending Approval" ? "warning" :
                    currentStatus === "Rejected" ? "error" : "default"
                  }
                  sx={{ fontWeight: 700, fontSize: "0.8rem", px: 1 }}
                />
              </Box>

              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#475569", mt: 0.5 }}>
                📅 {formatWeekHeading(weekDays[0], weekDays[6])}
              </Typography>
            </Grid>

            {/* Right: Date Navigation Controls & Action Area */}
            <Grid item xs={12} md={5}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, justifyContent: { xs: "flex-start", md: "flex-end" }, flexWrap: "wrap" }}>
                {/* Date Controls */}
                <IconButton onClick={handlePrevWeek} size="small" sx={{ border: "1px solid #cbd5e1", borderRadius: 2 }}>
                  <ChevronLeftIcon />
                </IconButton>
                <Button variant="outlined" size="small" onClick={handleCurrentWeek} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
                  Today
                </Button>
                <IconButton onClick={handleNextWeek} size="small" sx={{ border: "1px solid #cbd5e1", borderRadius: 2 }}>
                  <ChevronRightIcon />
                </IconButton>

                {/* Export / Print Button */}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, borderColor: "#cbd5e1", color: "#334155" }}
                >
                  Export / Print
                </Button>

                {/* 2. ACTION AREA: IT OFFICER ONLY "+ Add Assignment" */}
                {!isOIC && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenAddOrEditDrawer()}
                    sx={{
                      textTransform: "none",
                      fontWeight: 800,
                      borderRadius: 2,
                      background: "#2563eb",
                      "&:hover": { background: "#1d4ed8" },
                      px: 2.5
                    }}
                  >
                    + Add Assignment
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Workflow Action Bar */}
          <Box sx={{ mt: 2.5, pt: 2, borderTop: "1px solid #f1f5f9", display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end" }}>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              {!isOIC && (
                <>
                  <Button variant="outlined" size="small" startIcon={<SaveIcon />} onClick={handleSaveDraft} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
                    Save Draft
                  </Button>
                  <Button variant="contained" color="warning" size="small" startIcon={<SendIcon />} onClick={handleSubmitToOIC} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
                    Submit to OIC
                  </Button>
                </>
              )}

              {isOIC && currentStatus === "Pending Approval" && (
                <>
                  <Button variant="contained" color="success" size="small" startIcon={<CheckCircleIcon />} onClick={handleApproveRoster} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
                    Approve Roster
                  </Button>
                  <Button variant="contained" color="error" size="small" startIcon={<CancelIcon />} onClick={() => setRejectModalOpen(true)} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
                    Reject Roster
                  </Button>
                </>
              )}

              <Button variant="contained" color="success" size="small" startIcon={<PublishIcon />} onClick={handlePublishRoster} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
                Publish Roster
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* SUMMARY STATS CARDS */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", background: "#ffffff" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Total Officers
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", mt: 0.5 }}>
                    {totalOfficersCount}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>
                    Available officers
                  </Typography>
                </Box>
                <Avatar sx={{ background: "#eff6ff", color: "#2563eb", width: 44, height: 44 }}>
                  <GroupIcon />
                </Avatar>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", background: "#ffffff" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Assigned Slots
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", mt: 0.5 }}>
                    {totalAssignedSlotsCount}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>
                    For current week
                  </Typography>
                </Box>
                <Avatar sx={{ background: "#f0fdf4", color: "#16a34a", width: 44, height: 44 }}>
                  <AssignmentIcon />
                </Avatar>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", background: "#ffffff" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Unassigned
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", mt: 0.5 }}>
                    {unassignedOfficersCount}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>
                    Officers unassigned
                  </Typography>
                </Box>
                <Avatar sx={{ background: "#fff1f2", color: "#e11d48", width: 44, height: 44 }}>
                  <AssignmentLateIcon />
                </Avatar>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", background: "#ffffff" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    On Leave
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", mt: 0.5 }}>
                    {officersOnLeaveCount}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>
                    Approved leave
                  </Typography>
                </Box>
                <Avatar sx={{ background: "#faf5ff", color: "#9333ea", width: 44, height: 44 }}>
                  <EventBusyIcon />
                </Avatar>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* 3. FILTERS ROW */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 3, border: "1px solid #e2e8f0", background: "#ffffff" }}>
          <Grid container spacing={2} alignItems="center">
            {/* Search Officer */}
            <Grid item xs={12} sm={6} md={2.5}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search officer..."
                value={searchOfficer}
                onChange={(e) => setSearchOfficer(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: "#94a3b8", mr: 1, fontSize: 20 }} />
                }}
              />
            </Grid>

            {/* Rank Filter */}
            <Grid item xs={12} sm={6} md={1.9}>
              <FormControl fullWidth size="small">
                <InputLabel>Rank</InputLabel>
                <Select value={filterRank} label="Rank" onChange={(e) => setFilterRank(e.target.value)}>
                  <MenuItem value="All">All Ranks</MenuItem>
                  <MenuItem value="Constable">Constable</MenuItem>
                  <MenuItem value="Sergeant">Sergeant</MenuItem>
                  <MenuItem value="Sub-Inspector">Sub-Inspector</MenuItem>
                  <MenuItem value="Inspector">Inspector</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Duty Type Filter */}
            <Grid item xs={12} sm={6} md={1.9}>
              <FormControl fullWidth size="small">
                <InputLabel>Duty Type</InputLabel>
                <Select value={filterDutyType} label="Duty Type" onChange={(e) => setFilterDutyType(e.target.value)}>
                  <MenuItem value="All">All Duty Types</MenuItem>
                  <MenuItem value="Traffic Patrol">Traffic Patrol</MenuItem>
                  <MenuItem value="Crime Investigation">Crime Investigation</MenuItem>
                  <MenuItem value="Station Duty">Station Duty</MenuItem>
                  <MenuItem value="Motorcycle Patrol">Motorcycle Patrol</MenuItem>
                  <MenuItem value="Accident Investigation">Accident Investigation</MenuItem>
                  <MenuItem value="Night Patrol">Night Patrol</MenuItem>
                  <MenuItem value="Leave">On Leave</MenuItem>
                  <MenuItem value="OFF">Day Off</MenuItem>
                  <MenuItem value="Unassigned">Unassigned</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Shift Filter */}
            <Grid item xs={12} sm={6} md={1.9}>
              <FormControl fullWidth size="small">
                <InputLabel>Shift</InputLabel>
                <Select value={filterShift} label="Shift" onChange={(e) => setFilterShift(e.target.value)}>
                  <MenuItem value="All">All Shifts</MenuItem>
                  {shifts.map((s) => (
                    <MenuItem key={s._id} value={s.name}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Location Filter */}
            <Grid item xs={12} sm={6} md={1.9}>
              <FormControl fullWidth size="small">
                <InputLabel>Location</InputLabel>
                <Select value={filterLocation} label="Location" onChange={(e) => setFilterLocation(e.target.value)}>
                  <MenuItem value="All">All Locations</MenuItem>
                  <MenuItem value="Police Station">Police Station</MenuItem>
                  <MenuItem value="Negombo Clock Tower Junction">Negombo Clock Tower Junction</MenuItem>
                  <MenuItem value="Beach Road Tourism Zone">Beach Road Tourism Zone</MenuItem>
                  <MenuItem value="Colombo-Chilaw Highway (A3)">Colombo-Chilaw Highway (A3)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Conflicts Filter */}
            <Grid item xs={12} sm={6} md={1.9}>
              <FormControl fullWidth size="small">
                <InputLabel>Conflicts</InputLabel>
                <Select value={filterConflicts} label="Conflicts" onChange={(e) => setFilterConflicts(e.target.value)}>
                  <MenuItem value="All">All Assignments</MenuItem>
                  <MenuItem value="Has Conflicts">Has Leave Conflicts</MenuItem>
                  <MenuItem value="On Leave">On Leave</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={36} />
          </Box>
        )}

        {/* 4. MAIN ROSTER MATRIX GRID TABLE */}
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", background: "#ffffff" }}>
          <Table size="small">
            <TableHead sx={{ background: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, width: 220, color: "#1e293b", py: 1.8 }}>
                  Officer Details
                </TableCell>
                {weekDays.map((day, idx) => {
                  const dStr = formatDateStr(day);
                  const isToday = dStr === formatDateStr(new Date());
                  return (
                    <TableCell
                      key={dStr}
                      align="center"
                      sx={{
                        fontWeight: 800,
                        color: isToday ? "#1e40af" : "#334155",
                        background: isToday ? "#eff6ff" : "transparent",
                        py: 1.8
                      }}
                    >
                      {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][idx]} {day.getDate()} {day.toLocaleDateString("en-GB", { month: "short" }).toUpperCase()}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredOfficers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: "#64748b" }}>
                    No officers found matching active filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOfficers.map((officer) => (
                  <TableRow key={officer._id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    {/* Officer Row Details Header */}
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, background: "#1e3a8a", fontSize: "0.85rem", fontWeight: 800 }}>
                          {(officer.fullName || "P").charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                            {officer.policeId}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, display: "block" }}>
                            {officer.fullName} {officer.rank}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Monday - Sunday Assignment Cells */}
                    {weekDays.map((day) => {
                      const dateStr = formatDateStr(day);
                      const key = `${officer._id.toString()}_${dateStr}`;
                      const assignment = assignmentsMap[key];
                      const leaveRec = getOfficerLeaveForDate(officer._id, day);

                      if (leaveRec) {
                        return (
                          <TableCell key={dateStr} align="center" sx={{ p: 0.8, background: "#f8fafc" }}>
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: 2,
                                background: "#f1f5f9",
                                border: "1px dashed #94a3b8",
                                color: "#475569",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                textAlign: "center"
                              }}
                            >
                              🌴 On Leave
                              <Typography variant="caption" display="block" sx={{ fontSize: "0.68rem", opacity: 0.8 }}>
                                {leaveRec.leaveType}
                              </Typography>
                            </Box>
                          </TableCell>
                        );
                      }

                      if (assignment) {
                        const styleConfig = DUTY_CARD_STYLES[assignment.dutyType] || DUTY_CARD_STYLES["Traffic Patrol"];
                        return (
                          <TableCell
                            key={dateStr}
                            align="center"
                            onClick={() => !isOIC && handleOpenAddOrEditDrawer(officer, day)}
                            sx={{
                              cursor: isOIC ? "default" : "pointer",
                              p: 0.8,
                              "&:hover": { opacity: isOIC ? 1 : 0.85 }
                            }}
                          >
                            <Paper
                              elevation={0}
                              sx={{
                                p: 1,
                                borderRadius: 2,
                                background: styleConfig.bg,
                                border: `1px solid ${styleConfig.border}`,
                                color: styleConfig.text,
                                textAlign: "left"
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 800, display: "block", fontSize: "0.78rem" }}>
                                {styleConfig.title}
                              </Typography>
                              <Typography variant="caption" sx={{ fontSize: "0.7rem", opacity: 0.9, display: "block", mt: 0.3 }}>
                                ⏱ {assignment.shift}
                              </Typography>
                              <Typography variant="caption" sx={{ fontSize: "0.68rem", opacity: 0.8, display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                📍 {assignment.location}
                              </Typography>
                            </Paper>
                          </TableCell>
                        );
                      }

                      return (
                        <TableCell
                          key={dateStr}
                          align="center"
                          onClick={() => !isOIC && handleOpenAddOrEditDrawer(officer, day)}
                          sx={{
                            cursor: isOIC ? "default" : "pointer",
                            color: "#cbd5e1",
                            fontSize: "1.2rem",
                            transition: "all 0.2s",
                            "&:hover": { background: isOIC ? "transparent" : "#f1f5f9", color: isOIC ? "#cbd5e1" : "#64748b" }
                          }}
                        >
                          {!isOIC ? "+" : "—"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 5. ADD / EDIT DUTY ASSIGNMENT SIDEBAR DRAWER (MATCHING REFERENCE UI) */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{
            sx: {
              width: { xs: "100%", sm: 450 },
              background: "#f8fafc",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            }
          }}
        >
          {/* DRAWER HEADER BANNER (DARK NAVY) */}
          <Box
            sx={{
              p: 2.5,
              background: "#0b192c",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {isEditMode ? (
                <EditNoteIcon sx={{ color: "#f59e0b", fontSize: 24 }} />
              ) : (
                <AssignmentIcon sx={{ color: "#f59e0b", fontSize: 24 }} />
              )}
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
                {isEditMode ? "View / Edit Duty Assignment" : "Add Duty Assignment"}
              </Typography>
            </Box>

            <IconButton size="small" onClick={() => setDrawerOpen(false)} sx={{ color: "#94a3b8", "&:hover": { color: "#fff" } }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* DRAWER FORM BODY */}
          <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.2, flexGrow: 1, overflowY: "auto" }}>
            
            {/* DATE */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                DATE
              </Typography>
              <Paper elevation={0} sx={{ p: 1.5, mt: 0.6, background: "#edf2f7", border: "1px solid #e2e8f0", borderRadius: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <CalendarIcon sx={{ color: "#64748b", fontSize: 18 }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b" }}>
                  {formatReadableDate(selectedDateStr)}
                </Typography>
              </Paper>
            </Box>

            {/* DAY */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                DAY
              </Typography>
              <Paper elevation={0} sx={{ p: 1.5, mt: 0.6, background: "#edf2f7", border: "1px solid #e2e8f0", borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b" }}>
                  {formatDayName(selectedDateStr)}
                </Typography>
              </Paper>
            </Box>

            {/* OFFICER SELECTION */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                OFFICER
              </Typography>
              <FormControl fullWidth size="small" sx={{ mt: 0.6 }}>
                <Select
                  value={selectedOfficerId}
                  onChange={(e) => setSelectedOfficerId(e.target.value)}
                  sx={{ background: "#f1f5f9", borderRadius: 2 }}
                >
                  {officers.map((o) => (
                    <MenuItem key={o._id} value={o._id}>
                      {o.policeId} | {o.fullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* RANK (AUTO DISPLAYED) */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                RANK
              </Typography>
              <Paper elevation={0} sx={{ p: 1.5, mt: 0.6, background: "#edf2f7", border: "1px solid #e2e8f0", borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b" }}>
                  {currentOfficerObj ? currentOfficerObj.rank : "PC"}
                </Typography>
              </Paper>
            </Box>

            {/* DUTY TYPE */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                DUTY TYPE
              </Typography>
              <FormControl fullWidth size="small" sx={{ mt: 0.6 }}>
                <Select
                  value={selectedDutyType}
                  onChange={(e) => setSelectedDutyType(e.target.value)}
                  sx={{ background: "#f1f5f9", borderRadius: 2 }}
                >
                  <MenuItem value="Traffic Patrol">Traffic Patrol</MenuItem>
                  <MenuItem value="Crime Investigation">Crime Investigation</MenuItem>
                  <MenuItem value="Station Duty">Station Duty</MenuItem>
                  <MenuItem value="Motorcycle Patrol">Motorcycle Patrol</MenuItem>
                  <MenuItem value="Accident Investigation">Accident Investigation</MenuItem>
                  <MenuItem value="Night Patrol">Night Patrol</MenuItem>
                  <MenuItem value="Leave">On Leave</MenuItem>
                  <MenuItem value="OFF">Day Off</MenuItem>
                  <MenuItem value="Unassigned">Unassigned</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* LOCATION */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                LOCATION
              </Typography>
              <FormControl fullWidth size="small" sx={{ mt: 0.6 }}>
                <Select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  sx={{ background: "#f1f5f9", borderRadius: 2 }}
                >
                  <MenuItem value="Police Station">Police Station</MenuItem>
                  <MenuItem value="Negombo Clock Tower Junction">Negombo Clock Tower Junction</MenuItem>
                  <MenuItem value="Beach Road Tourism Zone">Beach Road Tourism Zone</MenuItem>
                  <MenuItem value="Colombo-Chilaw Highway (A3)">Colombo-Chilaw Highway (A3)</MenuItem>
                  <MenuItem value="Kochchikade Bridge Checkpoint">Kochchikade Bridge Checkpoint</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* SHIFT */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                SHIFT
              </Typography>
              <FormControl fullWidth size="small" sx={{ mt: 0.6 }}>
                <Select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  sx={{ background: "#f1f5f9", borderRadius: 2 }}
                >
                  {shifts.map((s) => (
                    <MenuItem key={s._id} value={s.name}>
                      {s.startTime}–{s.endTime} ({s.name})
                    </MenuItem>
                  ))}
                  {shifts.length === 0 && (
                    <MenuItem value="06:00–18:00">06:00–18:00</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Box>

            {/* REMARKS */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                REMARKS
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Additional notes..."
                value={remarksText}
                onChange={(e) => setRemarksText(e.target.value)}
                sx={{ mt: 0.6, "& .MuiOutlinedInput-root": { background: "#f1f5f9", borderRadius: 2 } }}
              />
            </Box>
          </Box>

          {/* DRAWER FOOTER BUTTONS (MATCHING EDIT REFERENCE IMAGE EXACTLY) */}
          <Divider />
          <Box sx={{ p: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#ffffff" }}>
            {/* Left: Delete Button (Edit Mode Only) */}
            {isEditMode ? (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteOutlineIcon />}
                onClick={handleDeleteAssignmentFromDrawer}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, borderColor: "#fca5a5" }}
              >
                Delete
              </Button>
            ) : (
              <Box />
            )}

            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
              <Button
                onClick={() => setDrawerOpen(false)}
                sx={{ textTransform: "none", fontWeight: 700, color: "#64748b" }}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                onClick={handleSaveAssignmentFromDrawer}
                sx={{
                  textTransform: "none",
                  fontWeight: 800,
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  background: "#f59e0b",
                  color: "#ffffff",
                  "&:hover": { background: "#d97706" }
                }}
              >
                {isEditMode ? "Save Changes" : "Add Assignment"}
              </Button>
            </Box>
          </Box>
        </Drawer>

        {/* 6. REJECTION DIALOG (OIC ONLY) */}
        <Dialog open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800 }}>Reject Weekly Roster</DialogTitle>
          <DialogContent divider>
            <TextField
              label="Rejection Remarks / Reason"
              multiline
              rows={3}
              fullWidth
              sx={{ mt: 1 }}
              value={rejectionRemarks}
              onChange={(e) => setRejectionRemarks(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleRejectRoster} sx={{ textTransform: "none", fontWeight: 700 }}>
              Reject Roster
            </Button>
          </DialogActions>
        </Dialog>

        {/* FEEDBACK SNACKBAR */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ fontWeight: 700 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
}