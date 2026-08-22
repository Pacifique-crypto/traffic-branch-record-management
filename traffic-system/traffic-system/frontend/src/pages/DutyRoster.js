import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OICLayout from "../layouts/OICLayout";
import ITLayout from "../layouts/ITLayout";
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Grid, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel,
  FormControl, Radio, RadioGroup, FormControlLabel, Chip, CircularProgress,
  IconButton, Alert, Snackbar, Tabs, Tab, Checkbox, ListItemText, FormLabel, Menu
} from "@mui/material";
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Check as CheckIcon, Close as CloseIcon, Publish as PublishIcon,
  Undo as UndoIcon, PlayArrow as PlayArrowIcon
} from "@mui/icons-material";
import {
  getDutyRules, createDutyRule, updateDutyRule, deleteDutyRule,
  getDutyRosters, getDutyRosterById, generateAIDutyRoster,
  createDutyRoster, updateDutyRosterStatus, getOfficers, getDutyShifts
} from "../api";

function DutyRoster() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole") || "IT Officer";
  const isOIC = userRole === "OIC";

  // Navigation Layout wrapper
  const Layout = isOIC ? OICLayout : ITLayout;

  // Tabs navigation
  const [tabIndex, setTabIndex] = useState(0);

  // States
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [rosters, setRosters] = useState([]);
  const [rules, setRules] = useState([]);
  const [officers, setOfficers] = useState([]);

  // Rules Dialog State
  const [ruleDialog, setRuleDialog] = useState({ open: false, isEdit: false, id: null });
  const [ruleForm, setRuleForm] = useState({
    location: "",
    dutyType: "",
    requiredOfficers: 1,
    minRank: "Constable",
    priority: "Medium",
    shift: "Morning (06:00 - 14:00)",
    requiresVehicle: false,
    vehicleType: "",
    maxConsecutiveAssignments: 3
  });

  // Roster Creation State
  const [rosterType, setRosterType] = useState("Daily");
  const [rosterDate, setRosterDate] = useState(new Date().toISOString().split("T")[0]);
  const [rosterShift, setRosterShift] = useState("Full Day Duty");
  const [shifts, setShifts] = useState([]);
  const [weekStart, setWeekStart] = useState(new Date().toISOString().split("T")[0]);
  const [weekEnd, setWeekEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return d.toISOString().split("T")[0];
  });
  const [enableAI, setEnableAI] = useState(true);
  const [generatedAssignments, setGeneratedAssignments] = useState(null);

  // Roster Edit Assignment state
  const [editAsgIndex, setEditAsgIndex] = useState(null);
  const [editAsgDialog, setEditAsgDialog] = useState(false);

  // View Roster details dialog state
  const [viewRoster, setViewRoster] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const showMsg = (msg, sev = "success") => {
    setSnackbar({ open: true, message: msg, severity: sev });
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [allRules, allRosters, allOfficers, allShifts] = await Promise.all([
        getDutyRules().catch(() => []),
        getDutyRosters().catch(() => []),
        getOfficers().catch(() => []),
        getDutyShifts().catch(() => [])
      ]);
      setRules(allRules);
      setRosters(allRosters);
      setOfficers(allOfficers.filter(o => o.status !== "Pending"));
      setShifts(allShifts);
    } catch (err) {
      showMsg("Failed to load records from database", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Filter rosters based on tab
  const getFilteredRosters = () => {
    if (isOIC) {
      const oicTabs = ["Pending Approval", "Approved", "Rejected", "Published"];
      const activeStatus = oicTabs[tabIndex] || "Pending Approval";
      return rosters.filter(r => r.status === activeStatus);
    } else {
      const itTabs = ["Create", "Draft", "Pending Approval", "Published", "History"];
      const activeTab = itTabs[tabIndex] || "Create";
      if (activeTab === "Create") return [];
      if (activeTab === "History") return rosters;
      return rosters.filter(r => r.status === activeTab);
    }
  };

  // ==========================================
  // RULES ACTIONS
  // ==========================================
  const renderRuleShiftLabel = (ruleShift) => {
    if (!ruleShift) return "Unassigned Shift";
    if (typeof ruleShift === "object" && ruleShift.name) {
      return `${ruleShift.name} (${ruleShift.startTime} - ${ruleShift.endTime})`;
    }
    const found = shifts.find(s => s._id === ruleShift || s.name === ruleShift);
    if (found) {
      return `${found.name} (${found.startTime} - ${found.endTime})`;
    }
    return String(ruleShift);
  };

  const handleOpenRuleDialog = (rule = null) => {
    if (rule) {
      let initialShiftId = "";
      if (rule.shift) {
        if (typeof rule.shift === "object" && rule.shift._id) {
          initialShiftId = rule.shift._id;
        } else {
          const matched = shifts.find(s => s._id === rule.shift || s.name === rule.shift);
          initialShiftId = matched ? matched._id : rule.shift;
        }
      }
      if (!initialShiftId && shifts.length > 0) {
        initialShiftId = shifts[0]._id;
      }

      setRuleForm({
        location: rule.location,
        dutyType: rule.dutyType,
        requiredOfficers: rule.requiredOfficers,
        minRank: rule.minRank,
        priority: rule.priority,
        shift: initialShiftId,
        requiresVehicle: Boolean(rule.requiresVehicle),
        vehicleType: rule.vehicleType || "",
        maxConsecutiveAssignments: rule.maxConsecutiveAssignments || 3
      });
      setRuleDialog({ open: true, isEdit: true, id: rule._id });
    } else {
      setRuleForm({
        location: "",
        dutyType: "",
        requiredOfficers: 1,
        minRank: "Constable",
        priority: "Medium",
        shift: shifts.length > 0 ? shifts[0]._id : "",
        requiresVehicle: false,
        vehicleType: "",
        maxConsecutiveAssignments: 3
      });
      setRuleDialog({ open: true, isEdit: false, id: null });
    }
  };

  const handleSaveRule = async () => {
    if (!ruleForm.location || !ruleForm.dutyType || !ruleForm.shift) {
      showMsg("Please fill in required fields: Location, Duty Type, and Shift.", "warning");
      return;
    }
    if (ruleForm.requiresVehicle && !ruleForm.vehicleType) {
      showMsg("Please select a Vehicle Type when Requires Vehicle is set to Yes.", "warning");
      return;
    }
    if (ruleForm.maxConsecutiveAssignments < 1 || ruleForm.maxConsecutiveAssignments > 7) {
      showMsg("Maximum Consecutive Assignments must be between 1 and 7.", "warning");
      return;
    }
    try {
      if (ruleDialog.isEdit) {
        await updateDutyRule(ruleDialog.id, ruleForm);
        showMsg("Duty rule updated successfully");
      } else {
        await createDutyRule(ruleForm);
        showMsg("Duty rule added successfully");
      }
      setRuleDialog({ open: false, isEdit: false, id: null });
      loadInitialData();
    } catch (err) {
      showMsg("Error saving rule", "error");
    }
  };

  const handleDeleteRule = async (id) => {
    if (window.confirm("Are you sure you want to delete this rule?")) {
      try {
        await deleteDutyRule(id);
        showMsg("Duty rule deleted successfully");
        loadInitialData();
      } catch (err) {
        showMsg("Error deleting rule", "error");
      }
    }
  };

  // ==========================================
  // AI GENERATOR ACTIONS
  // ==========================================
  const handleGenerateRoster = async () => {
    try {
      setLoading(true);
      const payload = {
        rosterType,
        enableAI,
        date: rosterType === "Daily" ? rosterDate : undefined,
        shift: rosterType === "Daily" ? rosterShift : undefined,
        weekStart: rosterType === "Weekly" ? weekStart : undefined,
        weekEnd: rosterType === "Weekly" ? weekEnd : undefined,
      };

      const res = await generateAIDutyRoster(payload);
      if (res && res.assignments && Array.isArray(res.assignments)) {
        setGeneratedAssignments(res);
        showMsg("Rule-based AI recommendation roster generated successfully!");
      } else {
        const errMsg = res?.message || res?.error || "Failed to generate roster assignments.";
        showMsg(errMsg, "error");
      }
    } catch (err) {
      showMsg("Failed to connect to generator engine", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditAssignment = (index) => {
    setEditAsgIndex(index);
    setEditAsgDialog(true);
  };

  const handleSwapOfficer = (officerId) => {
    const selectedOff = officers.find(o => o._id === officerId);
    if (!selectedOff || !generatedAssignments) return;

    const updatedAsg = [...generatedAssignments.assignments];
    updatedAsg[editAsgIndex] = {
      ...updatedAsg[editAsgIndex],
      officer: selectedOff._id,
      officerName: selectedOff.fullName,
      officerRank: selectedOff.rank,
      officerPoliceId: selectedOff.policeId,
      aiRecommendationReason: "Manually overridden by IT Officer."
    };

    setGeneratedAssignments({ ...generatedAssignments, assignments: updatedAsg });
    setEditAsgDialog(false);
    setEditAsgIndex(null);
  };

  const handleSaveRoster = async (status) => {
    if (!generatedAssignments || generatedAssignments.assignments.length === 0) {
      showMsg("No assignments to save. Please generate first.", "warning");
      return;
    }
    try {
      setLoading(true);
      const payload = {
        ...generatedAssignments,
        status: status // "Draft" or "Pending Approval"
      };
      await createDutyRoster(payload);
      showMsg(status === "Draft" ? "Roster draft saved successfully!" : "Roster submitted to OIC successfully!");
      setGeneratedAssignments(null);
      loadInitialData();
      if (status === "Draft") setTabIndex(1); // switch to drafts tab
      else setTabIndex(2); // switch to pending tab
    } catch (err) {
      showMsg("Failed to save roster", "error");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // OIC APPROVAL ACTIONS
  // ==========================================
  const handleOpenRosterDetails = async (rosterId) => {
    try {
      const r = await getDutyRosterById(rosterId);
      setViewRoster(r);
      setRejectionReason("");
      setViewDialogOpen(true);
    } catch (err) {
      showMsg("Failed to load roster details", "error");
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!viewRoster) return;
    if (newStatus === "Rejected" && !rejectionReason.trim()) {
      showMsg("Please specify a rejection reason", "warning");
      return;
    }
    try {
      setLoading(true);
      const notes = newStatus === "Rejected" ? `Rejection Reason: ${rejectionReason}` : "";
      const payload = {
        status: newStatus,
        assignments: viewRoster.assignments.map(a => ({
          ...a,
          aiRecommendationReason: notes ? `${a.aiRecommendationReason || ""}. ${notes}` : a.aiRecommendationReason
        }))
      };
      await updateDutyRosterStatus(viewRoster._id, payload);
      showMsg(`Roster status updated to ${newStatus}!`);
      setViewDialogOpen(false);
      setViewRoster(null);
      loadInitialData();
    } catch (err) {
      showMsg("Failed to update roster status", "error");
    } finally {
      setLoading(false);
    }
  };

  const [createMenuAnchor, setCreateMenuAnchor] = useState(null);

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
        {/* Title Section */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary">
              Duty Roster Management
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Configure rules, generate AI recommendations, and publish personnel assignments.
            </Typography>
          </Box>

          {!isOIC && (
            <Box>
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
                + Create New Duty Roster
              </Button>
              <Menu
                anchorEl={createMenuAnchor}
                open={Boolean(createMenuAnchor)}
                onClose={() => setCreateMenuAnchor(null)}
              >
                <MenuItem onClick={() => { setCreateMenuAnchor(null); setTabIndex(0); }}>
                  Generate with AI
                </MenuItem>
                <MenuItem onClick={() => { setCreateMenuAnchor(null); navigate("/duty-roster/manual"); }}>
                  Create Manually
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Box>

        {/* Navigation Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          {isOIC ? (
            <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} color="secondary">
              <Tab label="Pending Review" />
              <Tab label="Approved" />
              <Tab label="Rejected" />
              <Tab label="Published" />
            </Tabs>
          ) : (
            <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)}>
              <Tab label="Create New" />
              <Tab label="Drafts" />
              <Tab label="Pending Approval" />
              <Tab label="Published" />
              <Tab label="Roster History" />
              <Tab label="Duty Rules" />
            </Tabs>
          )}
        </Box>

        {/* Tab 0 Content (IT Officer: Create New) */}
        {!isOIC && tabIndex === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Generate Schedule
                </Typography>

                <FormControl component="fieldset">
                  <RadioGroup row value={rosterType} onChange={(e) => setRosterType(e.target.value)}>
                    <FormControlLabel value="Daily" control={<Radio />} label="Daily Duty" />
                    <FormControlLabel value="Weekly" control={<Radio />} label="Weekly Duty" />
                  </RadioGroup>
                </FormControl>

                {rosterType === "Daily" ? (
                  <>
                    <TextField
                      label="Date"
                      type="date"
                      value={rosterDate}
                      onChange={(e) => setRosterDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                    <FormControl fullWidth>
                      <InputLabel>Shift</InputLabel>
                      <Select value={rosterShift} onChange={(e) => setRosterShift(e.target.value)} label="Shift">
                        {shifts.map((s) => (
                          <MenuItem key={s._id} value={s.name}>
                            {s.name} ({s.startTime} - {s.endTime})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {rosterShift && (
                      <Box sx={{ mt: 1, p: 2, background: "#f8fafc", borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Start Time:</strong> {shifts.find(s => s.name === rosterShift)?.startTime || "06:00"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>End Time:</strong> {shifts.find(s => s.name === rosterShift)?.endTime || "18:00"}
                        </Typography>
                      </Box>
                    )}
                  </>
                ) : (
                  <>
                    <TextField
                      label="Week Start Date"
                      type="date"
                      value={weekStart}
                      onChange={(e) => setWeekStart(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                    <TextField
                      label="Week End Date"
                      type="date"
                      value={weekEnd}
                      onChange={(e) => setWeekEnd(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                  </>
                )}

                <FormControlLabel
                  control={<Checkbox checked={enableAI} onChange={(e) => setEnableAI(e.target.checked)} />}
                  label="Enable AI Recommendation Engine"
                />

                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleGenerateRoster}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                >
                  Generate Roster
                </Button>
              </Paper>
            </Grid>

            {/* Generated Roster Display */}
            <Grid item xs={12} md={8}>
              {generatedAssignments && Array.isArray(generatedAssignments.assignments) ? (
                <Paper sx={{ p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight="bold">
                      Generated Assignments ({generatedAssignments.assignments.length})
                    </Typography>
                    <Box gap={1} display="flex">
                      <Button variant="outlined" onClick={() => handleSaveRoster("Draft")}>
                        Save Draft
                      </Button>
                      <Button variant="contained" color="success" onClick={() => handleSaveRoster("Pending Approval")}>
                        Submit to OIC
                      </Button>
                    </Box>
                  </Box>

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date/Shift</TableCell>
                          <TableCell>Location</TableCell>
                          <TableCell>Duty Type</TableCell>
                          <TableCell>Assigned Officer</TableCell>
                          <TableCell>AI Match Justification</TableCell>
                          <TableCell align="right">Modify</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {generatedAssignments.assignments.map((asg, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              {new Date(asg.date).toDateString()} <br />
                              <Chip size="small" label={asg.shift} color="secondary" variant="outlined" />
                            </TableCell>
                            <TableCell>{asg.location}</TableCell>
                            <TableCell>{asg.dutyType}</TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">{asg.officerName}</Typography>
                              <Typography variant="caption" color="text.secondary">{asg.officerRank} | {asg.officerPoliceId}</Typography>
                            </TableCell>
                            <TableCell sx={{ fontSize: 11, maxWidth: 200, whiteSpace: "pre-line" }}>{asg.aiRecommendationReason}</TableCell>
                            <TableCell align="right">
                              <IconButton size="small" color="primary" onClick={() => handleEditAssignment(idx)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              ) : (
                <Paper sx={{ p: 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 300 }}>
                  <Typography variant="h6" color="text.secondary" align="center">
                    Select roster type, dates, and click "Generate Roster" to run AI recommendations engine.
                  </Typography>
                </Paper>
              )}
            </Grid>
          </Grid>
        )}

        {/* Lists of Rosters Tab (OIC & IT Officer list filters) */}
        {((!isOIC && tabIndex > 0 && tabIndex < 5) || (isOIC)) && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Rosters Listing
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ROSTER ID</TableCell>
                    <TableCell>TYPE</TableCell>
                    <TableCell>SCHEDULE DURATION / SHIFT</TableCell>
                    <TableCell>CREATED BY</TableCell>
                    <TableCell>STATUS</TableCell>
                    <TableCell align="right">ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress size={30} />
                      </TableCell>
                    </TableRow>
                  ) : getFilteredRosters().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ color: "text.secondary" }}>
                        No rosters found matching this filter tab.
                      </TableCell>
                    </TableRow>
                  ) : (
                    getFilteredRosters().map((r) => (
                      <TableRow key={r._id}>
                        <TableCell fontWeight="bold">#{r._id.slice(-6).toUpperCase()}</TableCell>
                        <TableCell>
                          <Chip label={r.rosterType} size="small" color="primary" />
                        </TableCell>
                        <TableCell>
                          {r.rosterType === "Daily" ? (
                            <>
                              {new Date(r.date).toDateString()} <br />
                              <Chip size="small" label={r.shift} variant="outlined" />
                            </>
                          ) : (
                            `${new Date(r.weekStart).toDateString()} - ${new Date(r.weekEnd).toDateString()}`
                          )}
                        </TableCell>
                        <TableCell>{r.createdBy}</TableCell>
                        <TableCell>
                          <Chip
                            label={r.status}
                            color={
                              r.status === "Published" ? "success" :
                              r.status === "Approved" ? "info" :
                              r.status === "Pending Approval" ? "warning" : "default"
                            }
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button variant="outlined" size="small" onClick={() => handleOpenRosterDetails(r._id)}>
                            {isOIC && r.status === "Pending Approval" ? "Review & Action" : "View Details"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Tab 5 (IT Officer: Duty Rules page) */}
        {!isOIC && tabIndex === 5 && (
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Location Duty Rules
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenRuleDialog(null)}>
                Add New Rule
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>DUTY LOCATION</TableCell>
                    <TableCell>DUTY TYPE</TableCell>
                    <TableCell>SHIFT</TableCell>
                    <TableCell>OFFICERS REQ</TableCell>
                    <TableCell>VEHICLE REQ</TableCell>
                    <TableCell>MIN RANK</TableCell>
                    <TableCell>MAX CONSECUTIVE</TableCell>
                    <TableCell>PRIORITY</TableCell>
                    <TableCell align="right">ACTION</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ color: "text.secondary" }}>
                        No duty rules created yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rules.map((rule) => (
                      <TableRow key={rule._id}>
                        <TableCell fontWeight="bold">{rule.location}</TableCell>
                        <TableCell>{rule.dutyType}</TableCell>
                        <TableCell>
                          <Chip label={renderRuleShiftLabel(rule.shift)} size="small" variant="outlined" color="primary" />
                        </TableCell>
                        <TableCell>{rule.requiredOfficers}</TableCell>
                        <TableCell>
                          {rule.requiresVehicle ? (
                            <Chip label={`Yes (${rule.vehicleType || "Vehicle"})`} size="small" color="info" />
                          ) : (
                            <Chip label="No" size="small" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip label={rule.minRank || "Constable"} size="small" color="secondary" />
                        </TableCell>
                        <TableCell>{rule.maxConsecutiveAssignments || 3} shifts</TableCell>
                        <TableCell>
                          <Chip
                            label={rule.priority}
                            size="small"
                            color={rule.priority === "High" ? "error" : rule.priority === "Medium" ? "warning" : "default"}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="primary" onClick={() => handleOpenRuleDialog(rule)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteRule(rule._id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Add/Edit Rule Dialog */}
        <Dialog open={ruleDialog.open} onClose={() => setRuleDialog({ open: false, isEdit: false, id: null })} maxWidth="md" fullWidth>
          <DialogTitle>{ruleDialog.isEdit ? "Edit Location Duty Rule" : "Add Location Duty Rule"}</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              {/* Basic Information Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight="bold" color="primary" sx={{ borderBottom: 1, borderColor: "divider", pb: 0.5, mb: 1 }}>
                  Basic Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Location"
                  value={ruleForm.location}
                  onChange={(e) => setRuleForm({ ...ruleForm, location: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Duty Type"
                  value={ruleForm.dutyType}
                  onChange={(e) => setRuleForm({ ...ruleForm, dutyType: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Shift</InputLabel>
                  <Select
                    value={ruleForm.shift}
                    onChange={(e) => setRuleForm({ ...ruleForm, shift: e.target.value })}
                    label="Shift"
                  >
                    {shifts.length === 0 ? (
                      <MenuItem value="" disabled>No active shifts found in database</MenuItem>
                    ) : (
                      shifts.map((s) => (
                        <MenuItem key={s._id} value={s._id}>
                          {s.name} ({s.startTime} - {s.endTime})
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Required Officers Count"
                  type="number"
                  value={ruleForm.requiredOfficers}
                  onChange={(e) => setRuleForm({ ...ruleForm, requiredOfficers: Number(e.target.value) })}
                  fullWidth
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Minimum Rank Constraint</InputLabel>
                  <Select
                    value={ruleForm.minRank}
                    onChange={(e) => setRuleForm({ ...ruleForm, minRank: e.target.value })}
                    label="Minimum Rank Constraint"
                  >
                    <MenuItem value="Constable">Constable</MenuItem>
                    <MenuItem value="Sergeant">Sergeant</MenuItem>
                    <MenuItem value="Sub-Inspector">Sub-Inspector</MenuItem>
                    <MenuItem value="Inspector">Inspector</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={ruleForm.priority}
                    onChange={(e) => setRuleForm({ ...ruleForm, priority: e.target.value })}
                    label="Priority"
                  >
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Vehicle Requirements Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight="bold" color="primary" sx={{ borderBottom: 1, borderColor: "divider", pb: 0.5, mb: 1, mt: 1 }}>
                  Vehicle Requirements
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Requires Vehicle</FormLabel>
                  <RadioGroup
                    row
                    value={ruleForm.requiresVehicle ? "Yes" : "No"}
                    onChange={(e) => setRuleForm({ ...ruleForm, requiresVehicle: e.target.value === "Yes" })}
                  >
                    <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                    <FormControlLabel value="No" control={<Radio />} label="No" />
                  </RadioGroup>
                </FormControl>
              </Grid>
              {ruleForm.requiresVehicle && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Vehicle Type</InputLabel>
                    <Select
                      value={ruleForm.vehicleType}
                      onChange={(e) => setRuleForm({ ...ruleForm, vehicleType: e.target.value })}
                      label="Vehicle Type"
                    >
                      <MenuItem value="Motorcycle">Motorcycle</MenuItem>
                      <MenuItem value="Patrol Car">Patrol Car</MenuItem>
                      <MenuItem value="Recovery Truck">Recovery Truck</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* Workload Rules Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight="bold" color="primary" sx={{ borderBottom: 1, borderColor: "divider", pb: 0.5, mb: 1, mt: 1 }}>
                  Workload Rules
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Maximum Consecutive Assignments"
                  type="number"
                  value={ruleForm.maxConsecutiveAssignments}
                  onChange={(e) => setRuleForm({ ...ruleForm, maxConsecutiveAssignments: Number(e.target.value) })}
                  fullWidth
                  helperText="Limits consecutive published duty assignments before AI skips officer (1 to 7 shifts)"
                  inputProps={{ min: 1, max: 7 }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setRuleDialog({ open: false, isEdit: false, id: null })}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveRule}>Save Rule</Button>
          </DialogActions>
        </Dialog>

        {/* Swap Officer Selector Dialog */}
        <Dialog open={editAsgDialog} onClose={() => setEditAsgDialog(false)}>
          <DialogTitle>Swap Officer Assignment</DialogTitle>
          <DialogContent>
            <Typography variant="body2" mb={2}>
              Select an officer to manually override the assignment:
            </Typography>
            <FormControl fullWidth sx={{ minWidth: 300 }}>
              <InputLabel>Officer</InputLabel>
              <Select
                onChange={(e) => handleSwapOfficer(e.target.value)}
                label="Officer"
                defaultValue=""
              >
                {officers.map(o => (
                  <MenuItem key={o._id} value={o._id}>
                    {o.fullName} ({o.rank} | ID: {o.policeId})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditAsgDialog(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>

        {/* View Roster Details Dialog */}
        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Roster Details #{viewRoster?._id.slice(-6).toUpperCase()}
            <Chip
              label={viewRoster?.status}
              size="small"
              sx={{ ml: 2 }}
              color={
                viewRoster?.status === "Published" ? "success" :
                viewRoster?.status === "Approved" ? "info" :
                viewRoster?.status === "Pending Approval" ? "warning" : "default"
              }
            />
          </DialogTitle>
          <DialogContent>
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Date/Shift</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Duty Type</TableCell>
                    <TableCell>Officer</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {viewRoster?.assignments.map((asg, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        {new Date(asg.date).toDateString()} <br />
                        <Chip size="small" label={asg.shift} variant="outlined" />
                      </TableCell>
                      <TableCell>{asg.location}</TableCell>
                      <TableCell>{asg.dutyType}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">{asg.officerName || (asg.officer && asg.officer.fullName)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {asg.officerRank || (asg.officer && asg.officer.rank)} | {asg.officerPoliceId || (asg.officer && asg.officer.policeId)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: 11, whiteSpace: "pre-line" }}>{asg.aiRecommendationReason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {isOIC && viewRoster?.status === "Pending Approval" && (
              <Box mt={3} p={2} sx={{ background: "#f8fafc", borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                  OIC Action Panel
                </Typography>
                <TextField
                  label="Rejection Reason (Required only if rejecting)"
                  multiline
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <Box display="flex" gap={2}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckIcon />}
                    onClick={() => handleUpdateStatus("Approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<CloseIcon />}
                    onClick={() => handleUpdateStatus("Rejected")}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<UndoIcon />}
                    onClick={() => handleUpdateStatus("Draft")}
                  >
                    Return for modification
                  </Button>
                </Box>
              </Box>
            )}

            {isOIC && viewRoster?.status === "Approved" && (
              <Box mt={3} display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<PublishIcon />}
                  onClick={() => handleUpdateStatus("Published")}
                >
                  Publish Roster
                </Button>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Msg Toast */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  );
}

export default DutyRoster;