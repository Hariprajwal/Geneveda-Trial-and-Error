import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import NewScan from "./pages/NewScan";
import Insights from "./pages/Insights";
import PatientHistory from "./pages/PatientHistory";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import EHRProfileForm from "./pages/EHRProfileForm";
import AdminDashboard from "./pages/AdminDashboard";
import DoctorChat from "./pages/DoctorChat";
import ImmediateCases from "./pages/ImmediateCases";
import Layout from "./components/Layout";

// Nurse pages
import NurseDashboard from "./pages/nurse/NurseDashboard";
import NursePatients from "./pages/nurse/NursePatients";
import NurseScan from "./pages/nurse/NurseScan";
import NurseTriage from "./pages/nurse/NurseTriage";
import NurseInput from "./pages/nurse/NurseInput";
import NurseResult from "./pages/nurse/NurseResult";
import NurseChat from "./pages/nurse/NurseChat";
import NurseSubmit from "./pages/nurse/NurseSubmit";

// Patient pages
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientAppointments from "./pages/patient/PatientAppointments";
import PatientScan from "./pages/patient/PatientScan";
import PatientChat from "./pages/patient/PatientChat";
import PatientReports from "./pages/patient/PatientReports";

// Auth guard — redirects to login if no token
function PrivateRoute({ children }) {
  const token = localStorage.getItem("access_token");
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

// Role guard — redirects unauthorized roles to their own dashboard
function RoleRoute({ children, allowedRoles }) {
  const role = localStorage.getItem("user_role") || "doctor";
  if (!allowedRoles.includes(role)) {
    // Redirect to the user's own dashboard
    const dashboards = { doctor: "/dashboard", nurse: "/nurse/dashboard", patient: "/patient/dashboard" };
    return <Navigate to={dashboards[role] || "/dashboard"} replace />;
  }
  return children;
}

function App() {
  useEffect(() => {
    // Force logout if stuck in a stale "fake_token" session from the old demo logic
    if (localStorage.getItem("access_token") === "fake_token") {
      localStorage.clear();
      window.location.href = "/login";
    }
  }, []);

  return (
    <ThemeProvider>
    <LanguageProvider>
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Doctor routes (existing — untouched) */}
        <Route path="/dashboard" element={<PrivateRoute><RoleRoute allowedRoles={["doctor"]}><Dashboard /></RoleRoute></PrivateRoute>} />
        <Route path="/patients" element={<PrivateRoute><RoleRoute allowedRoles={["doctor"]}><Patients /></RoleRoute></PrivateRoute>} />
        <Route path="/patients/:patientId/history" element={<PrivateRoute><RoleRoute allowedRoles={["doctor"]}><PatientHistory /></RoleRoute></PrivateRoute>} />
        <Route path="/scan" element={<PrivateRoute><RoleRoute allowedRoles={["doctor"]}><NewScan /></RoleRoute></PrivateRoute>} />
        <Route path="/insights" element={<PrivateRoute><RoleRoute allowedRoles={["doctor"]}><Insights /></RoleRoute></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><RoleRoute allowedRoles={["doctor"]}><AdminDashboard /></RoleRoute></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute><RoleRoute allowedRoles={["doctor"]}><DoctorChat /></RoleRoute></PrivateRoute>} />
        <Route path="/immediate" element={<PrivateRoute><RoleRoute allowedRoles={["doctor"]}><ImmediateCases /></RoleRoute></PrivateRoute>} />

        {/* Nurse routes */}
        <Route path="/nurse/dashboard" element={<PrivateRoute><RoleRoute allowedRoles={["nurse"]}><NurseDashboard /></RoleRoute></PrivateRoute>} />
        <Route path="/nurse/patients" element={<PrivateRoute><RoleRoute allowedRoles={["nurse"]}><NursePatients /></RoleRoute></PrivateRoute>} />
        <Route path="/nurse/scan" element={<PrivateRoute><RoleRoute allowedRoles={["nurse"]}><NurseScan /></RoleRoute></PrivateRoute>} />
        <Route path="/nurse/triage" element={<PrivateRoute><RoleRoute allowedRoles={["nurse"]}><NurseTriage /></RoleRoute></PrivateRoute>} />
        <Route path="/nurse/input" element={<PrivateRoute><RoleRoute allowedRoles={["nurse"]}><NurseInput /></RoleRoute></PrivateRoute>} />
        <Route path="/nurse/result" element={<PrivateRoute><RoleRoute allowedRoles={["nurse"]}><NurseResult /></RoleRoute></PrivateRoute>} />
        <Route path="/nurse/submit" element={<PrivateRoute><RoleRoute allowedRoles={["nurse"]}><NurseSubmit /></RoleRoute></PrivateRoute>} />
        <Route path="/nurse/chat" element={<PrivateRoute><RoleRoute allowedRoles={["nurse"]}><NurseChat /></RoleRoute></PrivateRoute>} />

        {/* Patient routes */}
        <Route path="/patient/dashboard"    element={<PrivateRoute><RoleRoute allowedRoles={["patient"]}><PatientDashboard    /></RoleRoute></PrivateRoute>} />
        <Route path="/patient/appointments" element={<PrivateRoute><RoleRoute allowedRoles={["patient"]}><PatientAppointments /></RoleRoute></PrivateRoute>} />
        <Route path="/patient/scan"         element={<PrivateRoute><RoleRoute allowedRoles={["patient"]}><PatientScan         /></RoleRoute></PrivateRoute>} />
        <Route path="/patient/chat"         element={<PrivateRoute><RoleRoute allowedRoles={["patient"]}><PatientChat         /></RoleRoute></PrivateRoute>} />
        <Route path="/patient/reports"      element={<PrivateRoute><RoleRoute allowedRoles={["patient"]}><PatientReports      /></RoleRoute></PrivateRoute>} />

        {/* Shared routes (all roles) */}
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/profile"  element={<PrivateRoute><Profile  /></PrivateRoute>} />
        <Route path="/ehr-setup" element={<PrivateRoute><EHRProfileForm /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
    </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
