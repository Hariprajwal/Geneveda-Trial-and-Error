import { useNavigate } from "react-router-dom";

const ROLE_CONFIG = {
  doctor: {
    title:    "Doctor Profile",
    subtitle: "Chief Radiologist · GenVeda Clinical Intelligence",
    icon:     "stethoscope",
    accent:   "primary",
    accentBg: "bg-primary-container/30",
    accentText:"text-primary",
    accentBorder:"border-primary/30",
    stats: [
      { icon: "group",          label: "Patients Managed",   value: "1,248" },
      { icon: "biotech",        label: "Scans Analyzed",      value: "3,410" },
      { icon: "check_circle",   label: "Cases Resolved",      value: "97%" },
      { icon: "emergency",      label: "High-Risk Escalated", value: "142" },
    ],
    badges: ["Dermatology", "AI Diagnostics", "Oncology", "Radiology", "Skin Cancer"],
    about: "Specializing in AI-assisted dermatological diagnostics. Reviews escalated high-risk cases and approves treatment protocols. Committed to early detection and precision medicine.",
    actions: [
      { icon: "dashboard",    label: "My Dashboard",  to: "/dashboard" },
      { icon: "biotech",      label: "New Scan",       to: "/scan" },
      { icon: "insights",     label: "Insights",       to: "/insights" },
      { icon: "settings",     label: "Settings",       to: "/settings" },
    ],
  },
  nurse: {
    title:    "Health Worker Profile",
    subtitle: "Clinical Nurse · First Screening Agent",
    icon:     "medical_services",
    accent:   "secondary",
    accentBg: "bg-secondary-container/40",
    accentText:"text-secondary",
    accentBorder:"border-secondary/30",
    stats: [
      { icon: "group",          label: "Patients Screened",   value: "489" },
      { icon: "biotech",        label: "Scans Submitted",     value: "621" },
      { icon: "send",           label: "Escalated to Doctor", value: "78" },
      { icon: "check_circle",   label: "Auto-Resolved",       value: "82%" },
    ],
    badges: ["First Screening", "Triage", "Patient Care", "Data Collection", "Field Health"],
    about: "Acts as the primary data collector and first screening agent. Captures patient symptoms, performs scans, and escalates high-risk cases directly to the doctor dashboard for final review.",
    actions: [
      { icon: "dashboard",    label: "My Dashboard",  to: "/nurse/dashboard" },
      { icon: "biotech",      label: "New Scan",       to: "/nurse/scan" },
      { icon: "assignment",   label: "Symptoms",       to: "/nurse/input" },
      { icon: "send",         label: "Submit Case",    to: "/nurse/submit" },
    ],
  },
  patient: {
    title:    "Patient Profile",
    subtitle: "Registered Patient · GenVeda Health",
    icon:     "person",
    accent:   "tertiary",
    accentBg: "bg-tertiary-container/40",
    accentText:"text-tertiary",
    accentBorder:"border-tertiary/30",
    stats: [
      { icon: "biotech",         label: "Total Scans",      value: "7" },
      { icon: "calendar_month",  label: "Appointments",    value: "3" },
      { icon: "check_circle",    label: "Resolved Cases",  value: "6" },
      { icon: "emergency",       label: "Active Alerts",   value: "1" },
    ],
    badges: ["Dermatology", "Annual Screening", "Skin Health"],
    about: "Actively monitoring skin health with AI-powered diagnostics. Your scan results are reviewed by certified dermatologists. Early detection is the best prevention.",
    actions: [
      { icon: "home",           label: "My Dashboard",    to: "/patient/dashboard" },
      { icon: "calendar_month", label: "Appointments",    to: "/patient/appointments" },
      { icon: "settings",       label: "Settings",        to: "/settings" },
    ],
  },
};

export default function Profile() {
  const navigate  = useNavigate();
  const userName  = localStorage.getItem("user_name")  || "User";
  const userRole  = localStorage.getItem("user_role")  || "doctor";
  const userEmail = localStorage.getItem("user_email") || `${userName.toLowerCase().replace(" ", ".")}@genveda.ai`;

  const cfg = ROLE_CONFIG[userRole] || ROLE_CONFIG.doctor;

  const handleLogout = () => {
    ["access_token","refresh_token","user_name","user_id","user_role","scan_patient","scan_notes","lastResult","escalated_case"].forEach(k => localStorage.removeItem(k));
    navigate("/login");
  };

  return (
    <div className="pt-8 px-6 md:px-12 pb-12 max-w-4xl mx-auto w-full flex flex-col gap-7 fade-in">

      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-on-surface-variant hover:text-primary text-sm font-semibold transition-colors w-fit">
        <span className="material-symbols-outlined text-sm">arrow_back</span> Back
      </button>

      {/* Hero Card */}
      <div className={`rounded-[2rem] p-8 border-2 ${cfg.accentBorder} ${cfg.accentBg} relative overflow-hidden`}>
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: `color-mix(in srgb, var(--c-${cfg.accent}) 15%, transparent)` }} />
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Avatar */}
          <div className={`w-24 h-24 rounded-[1.5rem] ${cfg.accentBg} border-2 ${cfg.accentBorder} flex items-center justify-center shrink-0 shadow-lg`}>
            <span className={`font-headline text-4xl font-extrabold ${cfg.accentText}`}>
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <p className={`text-sm font-semibold tracking-widest uppercase ${cfg.accentText} mb-1`}>{cfg.title}</p>
            <h2 className="font-headline text-3xl font-bold text-on-surface mb-1">{userName}</h2>
            <p className="text-on-surface-variant text-base mb-3">{cfg.subtitle}</p>
            <p className="text-on-surface-variant text-sm flex items-center gap-1.5 justify-center md:justify-start">
              <span className="material-symbols-outlined text-base">mail</span>{userEmail}
            </p>
          </div>
          {/* Role badge */}
          <div className={`shrink-0 px-5 py-2 rounded-full ${cfg.accentBg} border ${cfg.accentBorder}`}>
            <span className={`font-headline font-bold text-sm capitalize ${cfg.accentText} flex items-center gap-2`}>
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings:"'FILL' 1" }}>{cfg.icon}</span>
              {userRole === "doctor" ? "Doctor" : userRole === "nurse" ? "Health Worker" : "Patient"}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cfg.stats.map(s => (
          <div key={s.label} className="bg-surface-container-lowest rounded-[1.5rem] p-5 text-center hover:shadow-md transition-shadow">
            <span className={`material-symbols-outlined ${cfg.accentText} text-2xl mb-2 block`} style={{ fontVariationSettings:"'FILL' 1" }}>{s.icon}</span>
            <p className="font-headline text-2xl font-extrabold text-on-surface tracking-tighter">{s.value}</p>
            <p className="text-on-surface-variant text-xs font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* About */}
        <div className="bg-surface-container-lowest rounded-[1.75rem] p-7">
          <h3 className="font-headline text-lg font-bold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings:"'FILL' 1" }}>info</span>
            About
          </h3>
          <p className="text-on-surface-variant text-base leading-relaxed">{cfg.about}</p>

          <div className="mt-5">
            <p className="text-on-surface-variant text-xs font-semibold tracking-widest uppercase mb-3">Specializations</p>
            <div className="flex flex-wrap gap-2">
              {cfg.badges.map(b => (
                <span key={b} className={`px-3 py-1 rounded-full text-xs font-semibold border ${cfg.accentBorder} ${cfg.accentText} ${cfg.accentBg}`}>{b}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-surface-container-lowest rounded-[1.75rem] p-7">
          <h3 className="font-headline text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings:"'FILL' 1" }}>grid_view</span>
            Quick Access
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {cfg.actions.map(a => (
              <button key={a.label} onClick={() => navigate(a.to)}
                className="flex items-center gap-3 p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container hover:shadow-md transition-all text-left group">
                <div className={`p-2 rounded-xl ${cfg.accentBg} group-hover:scale-110 transition-transform`}>
                  <span className={`material-symbols-outlined ${cfg.accentText} text-xl`} style={{ fontVariationSettings:"'FILL' 1" }}>{a.icon}</span>
                </div>
                <span className="text-on-surface font-semibold text-sm">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Account info */}
      <div className="bg-surface-container-lowest rounded-[1.75rem] p-7">
        <h3 className="font-headline text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings:"'FILL' 1" }}>manage_accounts</span>
          Account
        </h3>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Username",  value: userName, icon: "badge" },
            { label: "Role",      value: userRole, icon: cfg.icon },
            { label: "Status",    value: "Active",  icon: "verified" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 p-4 rounded-2xl bg-surface-container-low">
              <span className="material-symbols-outlined text-on-surface-variant text-xl" style={{ fontVariationSettings:"'FILL' 1" }}>{item.icon}</span>
              <div>
                <p className="text-on-surface-variant text-xs font-medium">{item.label}</p>
                <p className="text-on-surface font-semibold text-sm capitalize">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate("/settings")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary font-semibold text-sm transition-all">
            <span className="material-symbols-outlined text-base">settings</span> Settings
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-error-container text-on-error-container hover:opacity-80 font-semibold text-sm transition-all ml-auto">
            <span className="material-symbols-outlined text-base">logout</span> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
