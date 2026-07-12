import React from "react";
import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div className="sidebar">
      <h2>Traffic System</h2>

      <Link to="/dashboard">Dashboard</Link>
      <Link to="/accidents">Accidents</Link>
      <Link to="/violations">Violations</Link>
      <Link to="/duties">Duties</Link>
    </div>
  );
}

export default Sidebar;