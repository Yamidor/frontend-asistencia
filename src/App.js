import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import AdminDashboard from "./components/AdminDashboard";
import AttendanceSystem from "./components/AttendanceSystem"; // Tu componente actual de App.js
import NonWorkingDaysManager from "./components/NonWorkingDaysManager";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AttendanceSystem />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/nonworking" element={<NonWorkingDaysManager />} />
      </Routes>
    </Router>
  );
}

export default App;
