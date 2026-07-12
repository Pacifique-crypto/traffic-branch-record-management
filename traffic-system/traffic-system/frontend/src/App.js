import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login            from "./pages/Login";
import ResetPassword    from "./pages/ResetPassword";
import PrivateRoute     from "./PrivateRoute";

// OIC pages
import OICDashboard     from "./pages/OICDashboard";
import Accidents        from "./pages/Accidents";
import AccidentDetails  from "./pages/AccidentDetails";
import Violations       from "./pages/Violations";
import ViolationDetails from "./pages/ViolationDetails";
import SFR              from "./pages/SFR";
import DLR              from "./pages/DLR";
import DutyRoster       from "./pages/DutyRoster";
import DutyRosterSchedule from "./pages/DutyRosterSchedule";
import Reports          from "./pages/Reports";
import Analytics        from "./pages/Analytics";
import Notifications    from "./pages/Notifications";

// IT Officer pages
import ITDashboard      from "./pages/ITDashboard";

// Shared pages
import UserManagement   from "./pages/UserManagement";
import Settings         from "./pages/Settings";

function DashboardRouter() {
  const role = localStorage.getItem("userRole");
  if (role === "IT Officer") return <Navigate to="/it-dashboard" replace />;
  return <OICDashboard />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/login"          element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/"               element={<Navigate to="/login" replace />} />

        {/* Smart dashboard redirect */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardRouter /></PrivateRoute>} />

        {/* IT Officer routes */}
        <Route path="/it-dashboard" element={<PrivateRoute allowedRoles={["IT Officer"]}><ITDashboard /></PrivateRoute>} />

        {/* OIC routes */}
        <Route path="/accidents"          element={<PrivateRoute allowedRoles={["OIC"]}><Accidents /></PrivateRoute>} />
        <Route path="/accidents/:id"      element={<PrivateRoute allowedRoles={["OIC"]}><AccidentDetails /></PrivateRoute>} />
        <Route path="/tor"                element={<PrivateRoute allowedRoles={["OIC"]}><Violations /></PrivateRoute>} />
        <Route path="/tor/:id"            element={<PrivateRoute allowedRoles={["OIC"]}><ViolationDetails /></PrivateRoute>} />
        <Route path="/sfr"                element={<PrivateRoute allowedRoles={["OIC"]}><SFR /></PrivateRoute>} />
        <Route path="/dlr"                element={<PrivateRoute allowedRoles={["OIC"]}><DLR /></PrivateRoute>} />
        <Route path="/duty-roster"        element={<PrivateRoute allowedRoles={["OIC"]}><DutyRoster /></PrivateRoute>} />
        <Route path="/duty-roster/schedule" element={<PrivateRoute allowedRoles={["OIC"]}><DutyRosterSchedule /></PrivateRoute>} />
        <Route path="/reports"            element={<PrivateRoute><Reports /></PrivateRoute>} />
        <Route path="/analytics"          element={<PrivateRoute><Analytics /></PrivateRoute>} />
        <Route path="/notifications"      element={<PrivateRoute><Notifications /></PrivateRoute>} />

        {/* Shared */}
        <Route path="/user-management"    element={<PrivateRoute><UserManagement /></PrivateRoute>} />
        <Route path="/settings"           element={<PrivateRoute><Settings /></PrivateRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;