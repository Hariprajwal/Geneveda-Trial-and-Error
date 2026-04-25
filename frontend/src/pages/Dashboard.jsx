import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPatients, getScans } from "../services/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const rawName = localStorage.getItem("user_name") || "Doctor";
  const userName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  useEffect(() => {
    Promise.all([getPatients(), getScans()])
      .then(([pRes, sRes]) => { setPatients(pRes.data); setScans(sRes.data); })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const totalPatients = patients.length;
  const totalScans = scans.length;
  const highRisk = scans.filter(s => s.risk_category === "HIGH" || (s.risk_score != null && s.risk_score >= 67)).length;
  const autoResolved = scans.filter(s => s.risk_category === "LOW" || (s.risk_score != null && s.risk_score < 44)).length;
  const escalatedScans = scans.filter(s => s.is_escalated);
  const referredPatients = patients.filter(p => escalatedScans.some(s => s.patient === p.id));

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">refresh</span>
        <p className="text-on-surface-variant font-body text-lg">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="pt-8 px-6 md:px-12 pb-12 max-w-7xl mx-auto w-full flex-grow flex-col gap-8 fade-in">

      {/* Hero */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-surface-container-low p-8 rounded-[2rem]">
        <div>
          <p className="font-body text-sm text-on-surface-variant mb-1 tracking-widest uppercase">Doctor Portal</p>
          <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-2">
            Good morning, Dr. {userName.split(' ')[0]}
          </h2>
          <p className="font-body text-on-surface-variant text-base">
            {highRisk > 0
              ? <span>You have <strong className="text-error">{highRisk} high-risk cases</strong> needing review.</span>
              : "All cases are under control today."}
          </p>
        </div>
        <button
          onClick={() => navigate("/scan")}
          className="bg-primary text-white font-headline font-semibold px-7 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:opacity-90 transition-all flex items-center gap-2 shrink-0 text-base"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings:"'FILL' 1" }}>biotech</span>
          Start New Scan
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { icon: "group",            label: "Total Patients",   value: totalPatients, sub: "Registered",          color: "text-primary",  bg: "bg-primary-container/20" },
          { icon: "warning",          label: "Needs Attention",  value: highRisk,      sub: "High risk cases 🔴",   color: "text-error",    bg: "bg-error-container/30" },
          { icon: "check_circle",     label: "Auto-Resolved",    value: autoResolved,  sub: "Low risk ✅",          color: "text-secondary",bg: "bg-secondary-container/30" },
          { icon: "medical_information",label:"Total Scans",     value: totalScans,    sub: "AI analyzed",          color: "text-tertiary", bg: "bg-tertiary-container/30" },
        ].map((card) => (
          <div key={card.label} className="bg-surface-container-lowest p-6 rounded-[1.75rem] relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`${card.bg} p-2.5 rounded-2xl`}>
                <span className={`material-symbols-outlined ${card.color} text-2xl`} style={{ fontVariationSettings:"'FILL' 1" }}>{card.icon}</span>
              </div>
            </div>
            <p className="font-body text-on-surface-variant text-sm font-medium mb-1">{card.label}</p>
            <p className="font-headline text-4xl font-extrabold text-on-surface tracking-tighter mb-1">{card.value}</p>
            <p className="font-body text-xs text-on-surface-variant">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Referred Patients (Escalated) */}
      {referredPatients.length > 0 && (
        <div className="bg-error-container/10 border-2 border-error/50 rounded-[2rem] p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline text-xl font-bold text-error flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontVariationSettings:"'FILL' 1" }}>emergency</span>
              Referred Patients (Escalated)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-base">
              <thead>
                <tr className="text-on-surface-variant text-sm border-b border-surface-variant">
                  <th className="pb-4 font-semibold">Patient</th>
                  <th className="pb-4 font-semibold">Age</th>
                  <th className="pb-4 font-semibold">Status</th>
                  <th className="pb-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {referredPatients.map(p => {
                  const patScans = escalatedScans.filter(s => s.patient === p.id);
                  const latestScan = patScans[patScans.length - 1];
                  return (
                    <tr key={p.id} className="border-b border-surface-container-high hover:bg-surface-container-low transition-colors group">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-error/10 flex items-center justify-center font-headline font-bold text-error text-sm">
                            {p.name.substring(0,2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-on-surface">{p.name}</p>
                            <p className="text-xs text-on-surface-variant">ID #{p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-on-surface-variant">{p.age}</td>
                      <td className="py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-error text-white">
                          <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>Escalated by Health Worker
                        </span>
                        {latestScan?.notes && <p className="text-xs text-on-surface-variant mt-1 max-w-xs truncate">{latestScan.notes}</p>}
                      </td>
                      <td className="py-4 text-right">
                        <Link to={`/patients/${p.id}/history`} className="inline-flex items-center gap-1 bg-error text-white px-4 py-2 rounded-full transition-colors text-sm font-semibold hover:opacity-90">
                          Review Case <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Patient Table */}
      <div className="bg-surface-container-lowest rounded-[2rem] p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-headline text-xl font-bold text-on-surface">Recent Cases</h3>
          <Link to="/patients" className="font-body text-sm text-primary font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity">
            View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
        <div className="overflow-x-auto">
          {patients.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl">person_search</span>
              <p className="font-body text-base">No patients found yet.</p>
            </div>
          ) : (
            <table className="w-full text-left font-body text-base">
              <thead>
                <tr className="text-on-surface-variant text-sm border-b border-surface-variant">
                  <th className="pb-4 font-semibold">Patient</th>
                  <th className="pb-4 font-semibold">Age</th>
                  <th className="pb-4 font-semibold">Status</th>
                  <th className="pb-4 font-semibold">Phone</th>
                  <th className="pb-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {patients.slice(0, 6).map(p => {
                  const patScans = scans.filter(s => s.patient === p.id);
                  const isHigh = patScans.some(s => s.risk_category === "HIGH" || (s.risk_score && s.risk_score >= 67));
                  const isLow  = patScans.length > 0 && patScans.every(s => (s.risk_score ?? 0) < 44);
                  return (
                    <tr key={p.id} className="border-b border-surface-container-high hover:bg-surface-container-low transition-colors group">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center font-headline font-bold text-primary text-sm">
                            {p.name.substring(0,2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-on-surface">{p.name}</p>
                            <p className="text-xs text-on-surface-variant">ID #{p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-on-surface-variant">{p.age}</td>
                      <td className="py-4">
                        {isHigh
                          ? <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-error-container text-on-error-container"><span className="w-1.5 h-1.5 rounded-full bg-error inline-block"></span>Needs Attention 🔴</span>
                          : isLow
                          ? <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary-container/50 text-on-secondary-container"><span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block"></span>Auto-Resolved ✅</span>
                          : <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-variant text-on-surface-variant"><span className="w-1.5 h-1.5 rounded-full bg-outline inline-block"></span>Pending Review</span>}
                      </td>
                      <td className="py-4 text-on-surface-variant text-sm">{p.phone}</td>
                      <td className="py-4 text-right">
                        <Link to={`/patients/${p.id}/history`} className="inline-flex items-center gap-1 text-primary hover:bg-surface-variant px-3 py-1.5 rounded-full transition-colors text-sm font-semibold">
                          Review <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* AI Insight Panel */}
      <div className="bg-surface-container-lowest rounded-[2rem] p-6 border-2 border-tertiary-fixed/40 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-tertiary-fixed/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-start gap-4 relative z-10">
          <div className="bg-tertiary-container/40 p-3 rounded-2xl text-tertiary shrink-0">
            <span className="material-symbols-outlined text-2xl">auto_awesome</span>
          </div>
          <div>
            <h4 className="font-headline font-bold text-on-surface mb-1 text-lg">AI Clinical Insight</h4>
            <p className="font-body text-base text-on-surface-variant leading-relaxed mb-3">
              {highRisk > 0
                ? `${highRisk} escalated case(s) require your review. AI detected high-risk markers — early action improves patient outcomes by 38%.`
                : "All recent scans indicate low-to-moderate risk. Patients with Marker B are responding well to early protocol adjustments."}
            </p>
            <button onClick={() => navigate("/insights")} className="font-body text-sm text-tertiary font-semibold hover:opacity-80 transition-opacity flex items-center gap-1">
              View Deep Analysis <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}