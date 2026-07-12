import React from "react";
import { Navigate } from "react-router-dom";

function PrivateRoute({ children, allowedRoles }) {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const userRole   = localStorage.getItem("userRole");

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // redirect to their own dashboard
    if (userRole === "IT Officer") return <Navigate to="/it-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default PrivateRoute;