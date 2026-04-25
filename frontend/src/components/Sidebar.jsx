import { NavLink } from "react-router-dom";

const NAV_ITEMS = {
  doctor: [
    { to: "/dashboard",  icon: "dashboard",   label: "Dashboard" },
    { to: "/patients",   icon: "group",        label: "Patients" },
    { to: "/immediate",  icon: "emergency",    label: "Immediate 🚨", urgent: true },
    { to: "/scan",       icon: "biotech",      label: "New Scan" },
    { to: "/insights",   icon: "insights",     label: "Insights" },
    { to: "/chat",       icon: "smart_toy",    label: "AI Assistant" },
    { to: "/settings",   icon: "settings",     label: "Settings" },
  ],
  nurse: [
    { to: "/nurse/dashboard", icon: "dashboard",   label: "Dashboard" },
    { to: "/nurse/input",     icon: "biotech",      label: "New Scan" },
    { to: "/nurse/result",    icon: "analytics",    label: "Result" },
    { to: "/nurse/submit",    icon: "send",         label: "Submit Case" },
    { to: "/nurse/patients",  icon: "group",        label: "Patients" },
    { to: "/nurse/chat",      icon: "smart_toy",    label: "AI Assistant" },
    { to: "/settings",        icon: "settings",     label: "Settings" },
  ],
  patient: [
    { to: "/patient/dashboard", icon: "home",      label: "My Dashboard" },
    { to: "/patient/scan",      icon: "biotech",   label: "New Scan" },
    { to: "/patient/chat",      icon: "smart_toy", label: "AI Assistant" },
    { to: "/patient/reports",   icon: "analytics", label: "My Reports" },
    { to: "/settings",          icon: "settings",  label: "Settings" },
  ],
};

export default function Sidebar() {
  const userRole = localStorage.getItem("user_role") || "doctor";
  const items = NAV_ITEMS[userRole] || NAV_ITEMS.doctor;

  return (
    <nav className="hidden md:flex flex-col p-6 gap-8 h-screen w-64 fixed left-0 top-0 overflow-y-auto bg-surface-container-low no-line z-50">
      <div>
        <h1 className="text-2xl font-bold tracking-tighter text-primary font-headline">GenVeda</h1>
        <p className="font-body text-xs text-on-surface-variant mt-1">Clinical Intelligence</p>
      </div>
      <ul className="flex flex-col gap-2 flex-grow">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.to} className={isLast ? "mt-auto" : ""}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-3 px-4 py-3 bg-surface-container-lowest text-primary rounded-full shadow-sm font-headline font-semibold tracking-tight transition-colors"
                    : "flex items-center gap-3 px-4 py-3 text-outline hover:bg-surface-container-lowest/50 rounded-full font-headline font-semibold tracking-tight transition-colors scale-95 hover:scale-100 duration-150"
                }
                style={({ isActive }) => item.urgent && !isActive ? { color: "#dc2626" } : {}}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", color: item.urgent ? "#dc2626" : undefined }}>
                  {item.icon}
                </span>
                {item.label}
                {item.urgent && (
                  <span style={{ marginLeft: "auto", width: "8px", height: "8px", background: "#dc2626", borderRadius: "50%", animation: "pulse 1.5s infinite", flexShrink: 0 }} />
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
