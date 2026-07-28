import React, { useState, useEffect } from "react";
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Grid, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel,
  FormControl, Chip, CircularProgress, IconButton, Avatar, Card, CardContent,
  Menu
} from "@mui/material";
import {
  Visibility as VisibilityIcon, DirectionsCar as CarIcon,
  TwoWheeler as BikeIcon, LocalShipping as RecoveryIcon,
  CheckCircle as ActiveIcon, Build as MaintenanceIcon,
  Error as ErrorIcon, Add as AddIcon, Search as SearchIcon,
  Check as CheckIcon, InfoOutlined as InfoIcon,
  Close as CloseIcon, SwapHoriz as SwapIcon,
  MoreVert as MoreVertIcon, Delete as DeleteIcon
} from "@mui/icons-material";
import { getVehicles, registerVehicle, updateVehicle, deleteVehicle, getOfficers } from "../api";

// Helper to determine icon based on type
const getVehicleIcon = (type) => {
  const t = (type || "").toLowerCase();
  if (t.includes("bike") || t.includes("motorcycle")) return <BikeIcon sx={{ color: "text.secondary", mr: 1 }} />;
  if (t.includes("truck") || t.includes("recovery")) return <RecoveryIcon sx={{ color: "text.secondary", mr: 1 }} />;
  return <CarIcon sx={{ color: "text.secondary", mr: 1 }} />;
};

function VehicleManagement() {
  const userRole = localStorage.getItem("userRole") || "IT Officer";
  let LayoutComponent;
  if (userRole === "OIC") {
    LayoutComponent = require("../layouts/OICLayout").default;
  } else {
    LayoutComponent = require("../layouts/ITLayout").default;
  }

  // States
  const [vehicles, setVehicles] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  // Dialog States
  const [openRegister, setOpenRegister] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [assignmentDate, setAssignmentDate] = useState("2026-01-01");
  
  // Registration Form State (20 Fields)
  const [registerForm, setRegisterForm] = useState({
    registrationNo: "",
    deptNo: "",
    chassisNo: "",
    engineNo: "",
    vehicleType: "Patrol Car",
    makeModel: "",
    year: new Date().getFullYear(),
    color: "",
    fuelType: "Diesel (Super)",
    engineCapacity: "",
    cylinders: 4,
    tyreSize: "",
    fuelTankCapacity: "",
    oilCapacity: "",
    status: "AVAILABLE",
    registrationDate: new Date().toISOString().split("T")[0],
    revenueLicenseExpiry: "",
    insuranceExpiry: "",
    emissionTestExpiry: "",
    remarks: "",
    assignedOfficer: "Unassigned",
    branch: "Negombo Traffic Div."
  });

  // Menu Anchor States
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuVehicle, setMenuVehicle] = useState(null);

  const handleMenuOpen = (event, vehicle) => {
    setMenuAnchor(event.currentTarget);
    setMenuVehicle(vehicle);
  };
  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuVehicle(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vehicle record?")) return;
    try {
      setLoading(true);
      await deleteVehicle(id);
      fetchData();
    } catch (err) {
      alert("Error deleting vehicle");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vData, oData] = await Promise.all([
        getVehicles().catch(() => []),
        getOfficers().catch(() => [])
      ]);
      setVehicles(vData);
      setOfficers(oData.filter(o => o.status === "Active" || o.status === "Approved"));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Stats
  const totalFleet = vehicles.length;
  const activeUnits = vehicles.filter(v => v.status === "AVAILABLE").length;
  const maintenanceCount = vehicles.filter(v => v.status === "MAINTENANCE").length;
  const unassignedCount = vehicles.filter(v => v.assignedOfficer === "Unassigned" || !v.assignedOfficer).length;

  // Filters
  const filtered = vehicles.filter(v => {
    const matchesSearch =
      (v.registrationNo || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.deptNo || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.assignedOfficer || "").toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "All" || v.vehicleType === typeFilter;
    const matchesStatus = statusFilter === "All" || v.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleOpenAssign = (vehicle) => {
    setSelectedVehicle(vehicle);
    setSelectedOfficerId("");
    setAssignmentDate("2026-01-01");
    setOpenAssign(true);
  };

  const handleSaveAssignment = async () => {
    if (!selectedOfficerId) return;
    const officerName = selectedOfficerId === "Unassigned" ? "Unassigned" : selectedOfficerId;
    try {
      setLoading(true);
      await updateVehicle(selectedVehicle._id, { assignedOfficer: officerName });
      setOpenAssign(false);
      fetchData();
    } catch (err) {
      alert("Error saving assignment");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRegister = async () => {
    if (!registerForm.registrationNo || !registerForm.deptNo) {
      alert("Registration Number and Department Number are required fields.");
      return;
    }
    try {
      setLoading(true);
      await registerVehicle(registerForm);
      setOpenRegister(false);
      // Reset
      setRegisterForm({
        registrationNo: "",
        deptNo: "",
        chassisNo: "",
        engineNo: "",
        vehicleType: "Patrol Car",
        makeModel: "",
        year: new Date().getFullYear(),
        color: "",
        fuelType: "Diesel (Super)",
        engineCapacity: "",
        cylinders: 4,
        tyreSize: "",
        fuelTankCapacity: "",
        oilCapacity: "",
        status: "AVAILABLE",
        registrationDate: new Date().toISOString().split("T")[0],
        revenueLicenseExpiry: "",
        insuranceExpiry: "",
        emissionTestExpiry: "",
        remarks: "",
        assignedOfficer: "Unassigned",
        branch: "Negombo Traffic Div."
      });
      fetchData();
    } catch (err) {
      alert("Error registering vehicle");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = (vehicle) => {
    setSelectedVehicle(vehicle);
    setOpenDetails(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
  };

  return (
    <LayoutComponent>
      <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
        {/* Title & Register Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary">
              Vehicle Management
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Manage, assign, and monitor Sri Lanka Police operational fleet.
            </Typography>
          </Box>
          {userRole === "IT Officer" && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenRegister(true)}
              sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" }, textTransform: "none", borderRadius: 2 }}
            >
              Register New Vehicle
            </Button>
          )}
        </Box>

        {/* Stats Grid Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Chip label="+4 this month" size="small" color="success" sx={{ fontSize: 10, mb: 1 }} />
                  <Typography color="text.secondary" variant="body2" fontWeight="bold">Total Fleet</Typography>
                  <Typography variant="h4" fontWeight="bold">{totalFleet}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: "#f1f5f9", color: "#475569" }}><CarIcon /></Avatar>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Box height={24} />
                  <Typography color="text.secondary" variant="body2" fontWeight="bold">Active Units</Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">{activeUnits}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: "#e8f5e9", color: "#2e7d32" }}><ActiveIcon /></Avatar>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Box height={24} />
                  <Typography color="text.secondary" variant="body2" fontWeight="bold">Maintenance</Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">{maintenanceCount}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: "#fff8e1", color: "#f57c00" }}><MaintenanceIcon /></Avatar>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Box height={24} />
                  <Typography color="text.secondary" variant="body2" fontWeight="bold">Unassigned</Typography>
                  <Typography variant="h4" fontWeight="bold" color="error.main">{unassignedCount}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: "#ffebee", color: "#c62828" }}><ErrorIcon /></Avatar>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filter Toolbar */}
        <Paper sx={{ p: 2, mb: 3, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", borderRadius: 3 }}>
          <TextField
            placeholder="Search by Reg No or Officer..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ color: "text.secondary", mr: 1 }} /> }}
            sx={{ flex: 1, minWidth: 200 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <MenuItem value="All">Vehicle Type</MenuItem>
              <MenuItem value="Patrol Car">Patrol Car</MenuItem>
              <MenuItem value="Motorcycle">Motorcycle</MenuItem>
              <MenuItem value="Recovery Truck">Recovery Truck</MenuItem>
              <MenuItem value="Van">Van</MenuItem>
              <MenuItem value="SUV">SUV</MenuItem>
              <MenuItem value="Jeep">Jeep</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="All">Status</MenuItem>
              <MenuItem value="AVAILABLE">AVAILABLE</MenuItem>
              <MenuItem value="MAINTENANCE">MAINTENANCE</MenuItem>
              <MenuItem value="OUT OF SERVICE">OUT OF SERVICE</MenuItem>
            </Select>
          </FormControl>
        </Paper>

        {/* Table List registry */}
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <Table>
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell fontWeight="bold">REG NO</TableCell>
                <TableCell fontWeight="bold">VEHICLE TYPE</TableCell>
                <TableCell fontWeight="bold">ASSIGNED OFFICER</TableCell>
                <TableCell fontWeight="bold">BRANCH</TableCell>
                <TableCell fontWeight="bold">STATUS</TableCell>
                <TableCell align="right" fontWeight="bold">ACTION</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}><CircularProgress size={30} /></TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>No vehicles found.</TableCell>
                </TableRow>
              ) : (
                paginated.map((v) => {
                  const isAssigned = v.assignedOfficer && v.assignedOfficer !== "Unassigned";

                  return (
                    <TableRow key={v._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">{v.registrationNo}</Typography>
                        <Typography variant="caption" color="text.secondary">VIN: {v.chassisNo || "N/A"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {getVehicleIcon(v.vehicleType)}
                          <Typography variant="body2">{v.vehicleType}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {isAssigned ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 26, height: 26, fontSize: 11, bgcolor: "#1e3a8a" }}>
                              {v.assignedOfficer.split(" ").slice(-1)[0]?.charAt(0) || "O"}
                            </Avatar>
                            <Typography variant="body2">{v.assignedOfficer}</Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" fontStyle="italic">Not Assigned</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{v.branch || "Negombo Traffic Div."}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={v.status === "AVAILABLE" ? "Active" : v.status === "MAINTENANCE" ? "Maintenance" : "Out of Service"}
                          size="small"
                          color={v.status === "AVAILABLE" ? "success" : v.status === "MAINTENANCE" ? "warning" : "error"}
                          variant="light"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" justifyContent="flex-end" alignItems="center" gap={1}>
                          {userRole === "IT Officer" && (
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleOpenAssign(v)}
                              sx={{
                                textTransform: "none",
                                bgcolor: isAssigned ? "#475569" : "#0f172a",
                                color: "#ffffff",
                                "&:hover": { bgcolor: isAssigned ? "#334155" : "#1e293b" },
                                borderRadius: 1.5,
                                fontSize: 11,
                                py: 0.5
                              }}
                            >
                              {isAssigned ? "Change Officer" : "Assign Officer"}
                            </Button>
                          )}
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, v)}>
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* View Details Dialog */}
        <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="md" fullWidth>
          {selectedVehicle && (() => {
            const isAssigned = selectedVehicle.assignedOfficer && selectedVehicle.assignedOfficer !== "Unassigned";

            return (
              <>
                <DialogTitle sx={{ borderBottom: "1px solid #f1f5f9", display: "flex", gap: 2, alignItems: "center" }}>
                  <Avatar sx={{ bgcolor: "#0f172a" }}><CarIcon /></Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">Vehicle Details: {selectedVehicle.registrationNo}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(selectedVehicle.makeModel || "N/A").toUpperCase()} • Operational Status: <span style={{ color: "#16a34a", fontWeight: "bold" }}>{selectedVehicle.status}</span>
                    </Typography>
                  </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                  <Grid container spacing={3} mt={0.5}>
                    {/* Left Column Identification */}
                    <Grid item xs={12} md={8} display="flex" flexDirection="column" gap={3}>
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle2" fontWeight="bold" color="primary" mb={2}>Core Identification</Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Registration Number</Typography>
                              <Typography variant="body2" fontWeight="bold">{selectedVehicle.registrationNo}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Department Number</Typography>
                              <Typography variant="body2" fontWeight="bold">{selectedVehicle.deptNo || "N/A"}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Vehicle Type</Typography>
                              <Typography variant="body2">{selectedVehicle.vehicleType}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Color</Typography>
                              <Typography variant="body2">{selectedVehicle.color || "N/A"}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Make / Model</Typography>
                              <Typography variant="body2">{selectedVehicle.makeModel || "N/A"}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Manufacturing Year</Typography>
                              <Typography variant="body2">{selectedVehicle.year || "N/A"}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Engine Number</Typography>
                              <Typography variant="body2">{selectedVehicle.engineNo || "N/A"}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Chassis Number</Typography>
                              <Typography variant="body2">{selectedVehicle.chassisNo || "N/A"}</Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>

                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent>
                          <Grid container spacing={2}>
                            <Grid item xs={3}>
                              <Typography variant="caption" color="text.secondary">Fuel Type</Typography>
                              <Typography variant="body2" fontWeight="bold">{selectedVehicle.fuelType || "N/A"}</Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="caption" color="text.secondary">Engine Capacity</Typography>
                              <Typography variant="body2" fontWeight="bold">{selectedVehicle.engineCapacity || "N/A"}</Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="caption" color="text.secondary">No of Cylinders</Typography>
                              <Typography variant="body2" fontWeight="bold">{selectedVehicle.cylinders || "N/A"}</Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="caption" color="text.secondary">Tyre Size</Typography>
                              <Typography variant="body2" fontWeight="bold">{selectedVehicle.tyreSize || "N/A"}</Typography>
                            </Grid>
                            <Grid item xs={4} sx={{ mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">Fuel Tank Capacity</Typography>
                              <Typography variant="body2">{selectedVehicle.fuelTankCapacity || "N/A"}</Typography>
                            </Grid>
                            <Grid item xs={4} sx={{ mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">Oil Capacity</Typography>
                              <Typography variant="body2">{selectedVehicle.oilCapacity || "N/A"}</Typography>
                            </Grid>
                            <Grid item xs={4} sx={{ mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">Registration Date</Typography>
                              <Typography variant="body2">{formatDate(selectedVehicle.registrationDate)}</Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Right Column Assignment */}
                    <Grid item xs={12} md={4}>
                      <Card sx={{ bgcolor: "#0f172a", color: "#ffffff", borderRadius: 2, height: "100%" }}>
                        <CardContent display="flex" flexDirection="column" alignItems="center" sx={{ textAlign: "center", py: 4 }}>
                          <Typography variant="caption" display="block" mb={2} sx={{ opacity: 0.7 }}>CURRENT ASSIGNED OFFICER</Typography>
                          {isAssigned ? (
                            <>
                              <Avatar sx={{ width: 64, height: 64, mx: "auto", mb: 2, bgcolor: "#ffffff", color: "#0f172a", fontWeight: "bold" }}>
                                {selectedVehicle.assignedOfficer.split(" ").slice(-1)[0]?.charAt(0)}
                              </Avatar>
                              <Typography variant="body1" fontWeight="bold">{selectedVehicle.assignedOfficer}</Typography>
                              <Typography variant="caption" display="block" sx={{ opacity: 0.7, mb: 3 }}>Traffic Police Division (Negombo)</Typography>
                              <Button variant="contained" size="small" sx={{ bgcolor: "#ffffff", color: "#0f172a", "&:hover": { bgcolor: "#f1f5f9" }, textTransform: "none" }}>
                                Contact Officer
                              </Button>
                            </>
                          ) : (
                            <>
                              <Avatar sx={{ width: 64, height: 64, mx: "auto", mb: 2, bgcolor: "#334155" }} />
                              <Typography variant="body1" fontStyle="italic" sx={{ opacity: 0.6 }}>No Officer Assigned</Typography>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Verification Items Row */}
                  <Grid container spacing={2} mt={2}>
                    <Grid item xs={12} sm={4}>
                      <Card variant="outlined" sx={{ p: 2, borderBottom: "3px solid #16a34a" }}>
                        <Typography variant="caption" color="text.secondary">REVENUE LICENSE EXPIRY</Typography>
                        <Typography variant="body2" fontWeight="bold">{formatDate(selectedVehicle.revenueLicenseExpiry)}</Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Card variant="outlined" sx={{ p: 2, borderBottom: "3px solid #16a34a" }}>
                        <Typography variant="caption" color="text.secondary">INSURANCE EXPIRY</Typography>
                        <Typography variant="body2" fontWeight="bold">{formatDate(selectedVehicle.insuranceExpiry)}</Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Card variant="outlined" sx={{ p: 2, borderBottom: "3px solid #dc2626" }}>
                        <Typography variant="caption" color="text.secondary">EMISSION TEST EXPIRY</Typography>
                        <Typography variant="body2" fontWeight="bold">{formatDate(selectedVehicle.emissionTestExpiry)}</Typography>
                      </Card>
                    </Grid>
                    {selectedVehicle.remarks && (
                      <Grid item xs={12}>
                        <Card variant="outlined" sx={{ p: 2, bgcolor: "#fafafa" }}>
                          <Typography variant="caption" color="text.secondary">REMARKS / NOTES</Typography>
                          <Typography variant="body2">{selectedVehicle.remarks}</Typography>
                        </Card>
                      </Grid>
                    )}
                  </Grid>
                </DialogContent>
                <DialogActions sx={{ borderTop: "1px solid #f1f5f9", px: 3, py: 2 }}>
                  <Button variant="outlined" onClick={() => setOpenDetails(false)}>Close Details</Button>
                </DialogActions>
              </>
            );
          })()}
        </Dialog>

        {/* Change / Assign Officer Dialog */}
        <Dialog open={openAssign} onClose={() => setOpenAssign(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, position: "relative" } }}>
          {selectedVehicle && (() => {
            const isAssigned = selectedVehicle.assignedOfficer && selectedVehicle.assignedOfficer !== "Unassigned";
            return (
              <>
                <IconButton 
                  onClick={() => setOpenAssign(false)}
                  sx={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}
                >
                  <CloseIcon />
                </IconButton>

                <Box display="flex" p={2.5} sx={{ borderBottom: "1px solid #f1f5f9", pr: 8 }}>
                  <Avatar sx={{ bgcolor: "#0f172a", width: 40, height: 40, mr: 1.5 }}>
                    <CarIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" color="text.primary" sx={{ lineHeight: 1.2 }}>
                      {isAssigned ? "Change Assigned Officer" : "Assign Officer"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {isAssigned ? "Vehicle Reassignment Process" : `Context: Vehicle: ${selectedVehicle.registrationNo}`}
                    </Typography>
                  </Box>
                </Box>

                <DialogContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
                  {isAssigned && (
                    <Box sx={{ p: 2, bgcolor: "#eff6ff", borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ bgcolor: "#1e293b", width: 36, height: 36 }}>
                          <CarIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block">VEHICLE ID</Typography>
                          <Typography variant="body2" fontWeight="bold">{selectedVehicle.registrationNo}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block">CURRENT STATE</Typography>
                        <Typography variant="body2" color="primary" fontWeight="bold">Current Officer: {selectedVehicle.assignedOfficer}</Typography>
                      </Box>
                    </Box>
                  )}

                  <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, borderLeft: "4px solid #475569", display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                    <InfoIcon color="action" sx={{ fontSize: 18, mt: 0.2 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12, lineHeight: 1.5 }}>
                      The transfer date will be recorded as the return date for the current officer and the assignment date for the new officer.
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" mb={1}>
                      {isAssigned ? "NEW OFFICER" : "SELECT OFFICER"}
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={selectedOfficerId}
                        onChange={(e) => setSelectedOfficerId(e.target.value)}
                        displayEmpty
                        renderValue={(selected) => {
                          if (!selected) {
                            return <span style={{ color: "#94a3b8" }}>{isAssigned ? "Select New Officer" : "Search for available officers..."}</span>;
                          }
                          return selected;
                        }}
                      >
                        <MenuItem value="Unassigned"><em>Unassigned / Release</em></MenuItem>
                        {officers.map((o) => (
                          <MenuItem key={o._id} value={o.fullName}>
                            {o.fullName} ({o.rank} | {o.policeId})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" mb={1}>
                      {isAssigned ? "TRANSFER DATE" : "ASSIGNMENT DATE"}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <TextField
                        type="date"
                        size="small"
                        value={assignmentDate}
                        onChange={(e) => setAssignmentDate(e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      {!isAssigned && <Chip label="DEFAULT: TODAY" size="small" sx={{ fontSize: 10, bgcolor: "#e2e8f0", fontWeight: "bold" }} />}
                    </Box>
                  </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 0, justifyContent: "flex-end", gap: 2 }}>
                  <Button onClick={() => setOpenAssign(false)} sx={{ textTransform: "none", color: "text.secondary", fontWeight: "bold" }}>Cancel</Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveAssignment}
                    disabled={!selectedOfficerId}
                    startIcon={isAssigned ? <SwapIcon /> : <CheckIcon />}
                    sx={{
                      bgcolor: "#0f172a",
                      "&:hover": { bgcolor: "#1e293b" },
                      textTransform: "none",
                      borderRadius: 2,
                      px: 3,
                      fontWeight: "bold"
                    }}
                  >
                    {isAssigned ? "Save Transfer" : "Assign"}
                  </Button>
                </DialogActions>
              </>
            );
          })()}
        </Dialog>

        {/* Register New Vehicle Dialog (20 Fields Form Grid) */}
        <Dialog open={openRegister} onClose={() => setOpenRegister(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ borderBottom: "1px solid #e2e8f0" }}>Register New Vehicle</DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Registration Number (e.g. WP KA-1234)"
                  required
                  value={registerForm.registrationNo}
                  onChange={(e) => setRegisterForm({ ...registerForm, registrationNo: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Department Number (e.g. SLP-TRAF-2026)"
                  required
                  value={registerForm.deptNo}
                  onChange={(e) => setRegisterForm({ ...registerForm, deptNo: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Chassis Number"
                  value={registerForm.chassisNo}
                  onChange={(e) => setRegisterForm({ ...registerForm, chassisNo: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Engine Number"
                  value={registerForm.engineNo}
                  onChange={(e) => setRegisterForm({ ...registerForm, engineNo: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Vehicle Type</InputLabel>
                  <Select
                    value={registerForm.vehicleType}
                    onChange={(e) => setRegisterForm({ ...registerForm, vehicleType: e.target.value })}
                    label="Vehicle Type"
                  >
                    <MenuItem value="Patrol Car">Patrol Car</MenuItem>
                    <MenuItem value="Motorcycle">Motorcycle</MenuItem>
                    <MenuItem value="Recovery Truck">Recovery Truck</MenuItem>
                    <MenuItem value="Van">Van</MenuItem>
                    <MenuItem value="SUV">SUV</MenuItem>
                    <MenuItem value="Jeep">Jeep</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Model / Make"
                  value={registerForm.makeModel}
                  onChange={(e) => setRegisterForm({ ...registerForm, makeModel: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Manufacturing Year"
                  type="number"
                  value={registerForm.year}
                  onChange={(e) => setRegisterForm({ ...registerForm, year: Number(e.target.value) })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Color"
                  value={registerForm.color}
                  onChange={(e) => setRegisterForm({ ...registerForm, color: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Fuel Type</InputLabel>
                  <Select
                    value={registerForm.fuelType}
                    onChange={(e) => setRegisterForm({ ...registerForm, fuelType: e.target.value })}
                    label="Fuel Type"
                  >
                    <MenuItem value="Diesel (Super)">Diesel (Super)</MenuItem>
                    <MenuItem value="Petrol (Octane 95)">Petrol (Octane 95)</MenuItem>
                    <MenuItem value="Octane 92">Octane 92</MenuItem>
                    <MenuItem value="Hybrid / Electric">Hybrid / Electric</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Engine Capacity (e.g. 2500 cc)"
                  value={registerForm.engineCapacity}
                  onChange={(e) => setRegisterForm({ ...registerForm, engineCapacity: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Number of Cylinders"
                  type="number"
                  value={registerForm.cylinders}
                  onChange={(e) => setRegisterForm({ ...registerForm, cylinders: Number(e.target.value) })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Tyre Size"
                  value={registerForm.tyreSize}
                  onChange={(e) => setRegisterForm({ ...registerForm, tyreSize: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fuel Tank Capacity"
                  value={registerForm.fuelTankCapacity}
                  onChange={(e) => setRegisterForm({ ...registerForm, fuelTankCapacity: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Engine Crankcase Oil Capacity"
                  value={registerForm.oilCapacity}
                  onChange={(e) => setRegisterForm({ ...registerForm, oilCapacity: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Vehicle Status</InputLabel>
                  <Select
                    value={registerForm.status}
                    onChange={(e) => setRegisterForm({ ...registerForm, status: e.target.value })}
                    label="Vehicle Status"
                  >
                    <MenuItem value="AVAILABLE">AVAILABLE</MenuItem>
                    <MenuItem value="MAINTENANCE">MAINTENANCE</MenuItem>
                    <MenuItem value="OUT OF SERVICE">OUT OF SERVICE</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Registration Date (Auto)"
                  type="date"
                  disabled
                  value={registerForm.registrationDate}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Revenue License Expiry"
                  type="date"
                  value={registerForm.revenueLicenseExpiry}
                  onChange={(e) => setRegisterForm({ ...registerForm, revenueLicenseExpiry: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Insurance Expiry"
                  type="date"
                  value={registerForm.insuranceExpiry}
                  onChange={(e) => setRegisterForm({ ...registerForm, insuranceExpiry: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Emission Test Expiry"
                  type="date"
                  value={registerForm.emissionTestExpiry}
                  onChange={(e) => setRegisterForm({ ...registerForm, emissionTestExpiry: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Assigned Officer</InputLabel>
                  <Select
                    value={registerForm.assignedOfficer}
                    onChange={(e) => setRegisterForm({ ...registerForm, assignedOfficer: e.target.value })}
                    label="Assigned Officer"
                  >
                    <MenuItem value="Unassigned">Unassigned</MenuItem>
                    {officers.map(o => (
                      <MenuItem key={o._id} value={o.fullName}>{o.fullName} ({o.rank})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Assigned Branch</InputLabel>
                  <Select
                    value={registerForm.branch}
                    onChange={(e) => setRegisterForm({ ...registerForm, branch: e.target.value })}
                    label="Assigned Branch"
                  >
                    <MenuItem value="Negombo Traffic Div.">Negombo Traffic Div.</MenuItem>
                    <MenuItem value="Negombo Central Div.">Negombo Central Div.</MenuItem>
                    <MenuItem value="Kochchikade Post">Kochchikade Post</MenuItem>
                    <MenuItem value="Katunayake Highway Div.">Katunayake Highway Div.</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Remarks"
                  value={registerForm.remarks}
                  onChange={(e) => setRegisterForm({ ...registerForm, remarks: e.target.value })}
                  fullWidth
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ borderTop: "1px solid #e2e8f0", px: 3, py: 2 }}>
            <Button variant="outlined" onClick={() => setOpenRegister(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveRegister} disabled={!registerForm.registrationNo || !registerForm.deptNo}>Register Vehicle</Button>
          </DialogActions>
        </Dialog>

        {/* Actions Dropdown Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => {
            handleOpenDetails(menuVehicle);
            handleMenuClose();
          }}>
            <VisibilityIcon fontSize="small" sx={{ mr: 1, color: "primary.main" }} />
            View Details
          </MenuItem>
          {userRole === "IT Officer" && (
            <MenuItem onClick={() => {
              if (menuVehicle) {
                handleDelete(menuVehicle._id);
              }
              handleMenuClose();
            }} sx={{ color: "error.main" }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete Record
            </MenuItem>
          )}
        </Menu>
      </Container>
    </LayoutComponent>
  );
}

export default VehicleManagement;
