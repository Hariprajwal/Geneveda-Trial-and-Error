import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getPatients, getScans } from "../../services/api";

export default function NurseDashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const rawName = localStorage.getItem("user_name") || "Nurse";
  const userName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  useEffect(() => {
    Promise.all([getPatients(), getScans()])
      .then(([pRes, sRes]) => { setPatients(pRes.data); setScans(sRes.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const highRisk = scans.filter(s => s.risk_category === "HIGH" || (s.risk_score ?? 0) >= 67).length;
  const pending  = scans.filter(s => !s.reviewed).length;
  const recentScans = scans.slice(0, 5);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="material-symbols-outlined text-primary text-5xl animate-spin">refresh</span>
    </div>
  );

  return (
    <div className="pt-8 px-6 md:px-10 pb-12 max-w-6xl mx-auto w-full flex flex-col gap-8 fade-in">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#004D40] to-[#00796B] p-8 md:p-10 rounded-[2.5rem] flex flex-col md:flex-row md:items-end justify-between gap-6 shadow-2xl relative overflow-hidden text-white">
        {/* Decorative elements */}
        <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-50px] right-[-50px] w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <p className="text-white/70 text-sm tracking-[0.2em] font-semibold uppercase mb-2">Health Worker Portal</p>
          <h2 className="font-headline text-white text-4xl font-extrabold mb-3">Welcome, Nurse {userName.split(' ')[0]}</h2>
          <p className="text-white/80 text-lg max-w-xl">
            {highRisk > 0
              ? <span><strong className="text-[#FFCDD2] bg-error/20 px-2 py-0.5 rounded-md">{highRisk} high-risk patient(s)</strong> need escalation to doctor.</span>
              : "Shift overview looks good. Start a new scan below."}
          </p>
        </div>
        <button
          onClick={() => navigate("/nurse/input")}
          className="bg-white text-[#004D40] font-bold px-8 py-4 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.3)] hover:-translate-y-1 transition-all flex items-center gap-2 shrink-0 text-lg relative z-10"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings:"'FILL' 1" }}>biotech</span>
          New Scan
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: "group",   label: "Patients Registered", value: patients.length, color: "text-[#00796B]", bg: "bg-[#E0F2F1]", border: "border-[#B2DFDB]" },
          { icon: "warning", label: "High Risk — Escalate", value: highRisk,        color: "text-[#D32F2F]", bg: "bg-[#FFEBEE]", border: "border-[#FFCDD2]" },
          { icon: "biotech", label: "Scans Done Today",    value: scans.length,    color: "text-[#1976D2]", bg: "bg-[#E3F2FD]", border: "border-[#BBDEFB]" },
        ].map(c => (
          <div key={c.label} className={`bg-white p-7 rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-variant/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all flex flex-col`}>
            <div className={`${c.bg} ${c.border} border p-3.5 rounded-2xl w-fit mb-5 shadow-sm`}>
              <span className={`material-symbols-outlined ${c.color} text-3xl`} style={{ fontVariationSettings:"'FILL' 1" }}>{c.icon}</span>
            </div>
            <p className="text-on-surface-variant text-sm font-semibold tracking-wide uppercase mb-1">{c.label}</p>
            <p className="font-headline text-5xl font-extrabold text-on-surface tracking-tighter">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Scans */}
      <div className="bg-surface-container-lowest rounded-[2rem] p-7">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-headline text-lg font-bold text-on-surface">Recent Scans</h3>
          <Link to="/nurse/scan" className="text-primary text-sm font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity">
            New Scan <span className="material-symbols-outlined text-sm">add</span>
          </Link>
        </div>
        {recentScans.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl">biotech</span>
            <p className="text-base">No scans yet. Start a new scan!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base">
              <thead>
                <tr className="text-on-surface-variant text-sm border-b border-surface-variant">
                  <th className="pb-3 font-semibold">Disease Detected</th>
                  <th className="pb-3 font-semibold">Risk Score</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentScans.map(sc => {
                  const score = sc.risk_score ?? sc.confidence ?? 0;
                  const cat   = sc.risk_category || (score >= 67 ? "HIGH" : score >= 44 ? "MEDIUM" : "LOW");
                  return (
                    <tr key={sc.id} className="border-b border-surface-container-high hover:bg-surface-container-low transition-colors">
                      <td className="py-3.5 font-semibold text-on-surface">{sc.predicted_disease}</td>
                      <td className="py-3.5 text-on-surface-variant">{score.toFixed(1)}%</td>
                      <td className="py-3.5">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          cat === "HIGH"   ? "bg-error-container text-on-error-container" :
                          cat === "MEDIUM" ? "bg-amber-100 text-amber-800" :
                                            "bg-secondary-container/50 text-on-secondary-container"
                        }`}>{cat}</span>
                      </td>
                      <td className="py-3.5 text-on-surface-variant text-sm">{new Date(sc.created_at).toLocaleDateString()}</td>
                      <td className="py-3.5 text-right">
                        {cat === "HIGH"
                          ? <button onClick={() => navigate("/nurse/submit")} className="text-error text-sm font-semibold hover:opacity-80 flex items-center gap-1 ml-auto">
                              Escalate <span className="material-symbols-outlined text-sm">send</span>
                            </button>
                          : <span className="text-secondary text-sm font-semibold">Auto-resolved</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[
          { icon: "biotech",          label: "New Scan",       to: "/nurse/scan",    gradient: "from-teal-500 to-emerald-500" },
          { icon: "person_add",       label: "Add Patient",    to: "/nurse/patients",gradient: "from-blue-500 to-cyan-500" },
          { icon: "assignment",       label: "Triage Queue",   to: "/nurse/triage",  gradient: "from-indigo-500 to-purple-500" },
          { icon: "send",             label: "Submit Case",    to: "/nurse/submit",  gradient: "from-rose-500 to-pink-500" },
        ].map(a => (
          <Link key={a.label} to={a.to}
            className="relative bg-white p-6 rounded-[2rem] flex flex-col items-center justify-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all text-center group border border-surface-variant/50 overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${a.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
            <div className={`bg-gradient-to-br ${a.gradient} p-4 rounded-[1.25rem] shadow-md group-hover:scale-110 transition-transform duration-300`}>
              <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings:"'FILL' 1" }}>{a.icon}</span>
            </div>
            <p className="font-bold text-on-surface text-base group-hover:text-primary transition-colors z-10">{a.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
