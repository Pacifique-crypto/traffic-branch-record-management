import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import PrivateRoute from "./components/PrivateRoute";
import Dashboard from "./pages/Dashboard";
import Accidents from "./pages/Accidents";
import AccidentDetails from "./pages/AccidentDetails";
import Violations from "./pages/Violations";
import ViolationDetails from "./pages/ViolationDetails";
import SFR from "./pages/SFR";
import DLR from "./pages/DLR";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import DutyRoster from "./pages/DutyRoster";
import DutyRosterSchedule from "./pages/DutyRosterSchedule";
import Reports from "./pages/Reports";
import User from "./pages/User";
function App() {
  return (
    <Router>
      <Routes>

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route
  path="/users"
  element={
    <PrivateRoute>
      <User />
    </PrivateRoute>
  }
/>
        <Route path="/accidents" element={<PrivateRoute><Accidents /></PrivateRoute>} />
        <Route path="/accidents/:id" element={<PrivateRoute><AccidentDetails /></PrivateRoute>} />

        <Route path="/tor" element={<PrivateRoute><Violations /></PrivateRoute>} />
        <Route path="/tor/:id" element={<PrivateRoute><ViolationDetails /></PrivateRoute>} />

        <Route path="/sfr" element={<PrivateRoute><SFR /></PrivateRoute>} />
        <Route path="/dlr" element={<PrivateRoute><DLR /></PrivateRoute>} />
        <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />

        {/* ✅ FIXED ROUTES */}
        <Route path="/duty-roster" element={<PrivateRoute><DutyRoster /></PrivateRoute>} />
        <Route path="/duty-schedule" element={<PrivateRoute><DutyRosterSchedule /></PrivateRoute>} />

        {/* Optional: details page */}
        <Route path="/duty-roster/:id" element={<PrivateRoute><DutyRoster /></PrivateRoute>} />

        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </Router>
  );
}

export default App;