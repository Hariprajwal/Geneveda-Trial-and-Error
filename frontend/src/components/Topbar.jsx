import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Topbar() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const userName = localStorage.getItem("user_name") || "User";
  const userRole = localStorage.getItem("user_role") || "doctor";

  // Apply theme to <html> on mount + change
  useEffect(() => {
    const html = document.documentElement;
    if (theme === "dark") {
      html.setAttribute("data-theme", "dark");
    } else {
      html.removeAttribute("data-theme");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const roleColors = {
    doctor:  "bg-primary text-on-primary",
    nurse:   "bg-secondary text-on-secondary",
    patient: "bg-tertiary text-on-tertiary",
  };
  const avatarColor = roleColors[userRole] || roleColors.doctor;

  return (
    <header className="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] h-16 z-40 flex items-center justify-between px-6 md:px-8"
      style={{ backgroundColor: "var(--c-surface)", borderBottom: "1px solid var(--c-outline-variant)" }}>

      {/* Mobile brand */}
      <div className="md:hidden">
        <h1 className="text-xl font-bold text-primary font-headline tracking-tighter">GenVeda</h1>
      </div>
      <div className="hidden md:block" />

      <div className="flex items-center gap-4">
        {/* Dark / Light toggle */}
        <button
          onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
          className="flex items-center gap-2 px-3 py-2 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all text-sm font-semibold"
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            {theme === "light" ? "dark_mode" : "light_mode"}
          </span>
          <span className="hidden md:inline">{theme === "light" ? "Dark" : "Light"}</span>
        </button>

        {/* Profile button */}
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          title="View Profile"
        >
          <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center font-headline font-bold text-sm shadow-sm`}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:flex flex-col items-start leading-tight">
            <span className="text-on-surface font-semibold text-sm">{userName.charAt(0).toUpperCase() + userName.slice(1)}</span>
            <span className="text-on-surface-variant text-xs capitalize">{userRole}</span>
          </div>
        </button>
      </div>
    </header>
  );
}
