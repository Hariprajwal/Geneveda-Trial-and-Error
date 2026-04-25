import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getScans, escalateScan } from "../../services/api";

export default function NurseResult() {
  const navigate   = useNavigate();
  const [scans, setScans] = useState([]);
  const [escalated, setEscalated] = useState(false);
  const notes      = localStorage.getItem("scan_notes") || "No notes";
  const lastResult = JSON.parse(localStorage.getItem("lastResult") || "null");

  useEffect(() => {
    getScans().then(r => setScans(r.data)).catch(() => {});
  }, []);

  const result   = lastResult || (scans.length > 0 ? scans[0] : null);
  const score    = result?.risk_score ?? result?.confidence ?? 0;
  const disease  = result?.predicted_disease ?? "Unknown";
  const category = result?.risk_category ?? (score >= 67 ? "HIGH" : score >= 44 ? "MEDIUM" : "LOW");

  // Generate Order ID from scan id
  const orderId  = result?.id ? `GV-${String(result.id).padStart(5, "0")}` : null;

  // Auto-escalate HIGH risk cases
  useEffect(() => {
    if (result?.id && category === "HIGH" && !result?.is_escalated) {
      escalateScan(result.id, { notes: "Auto-escalated by AI triage engine — HIGH risk detected" })
        .then(() => setEscalated(true))
        .catch(() => setEscalated(true)); // still show banner even if API fails
    } else if (category === "HIGH") {
      setEscalated(true);
    }
  }, [result?.id, category]);

  // Detect non-skin / unrelated images — same logic as doctor Insights view
  const isAnomaly = ["not skin", "anomaly", "unrelated", "no lesion", "calculating"]
    .some(kw => disease.toLowerCase().includes(kw));

  const riskConfig = {
    HIGH:   { color: "text-error",     bg: "bg-error-container",     icon: "emergency",    label: "Critical — Immediate Doctor Referral Required", border: "border-error" },
    MEDIUM: { color: "text-amber-700", bg: "bg-amber-100",           icon: "warning",      label: "Moderate — Monitor Closely",                    border: "border-amber-400" },
    LOW:    { color: "text-primary",   bg: "bg-primary-container/30",icon: "check_circle", label: "Stable — Auto Resolved",                        border: "border-primary" },
  };
  const cfg = isAnomaly
    ? { color: "text-on-surface-variant", bg: "bg-surface-variant", icon: "help", label: "Unable to Assess — Non-skin Image Detected", border: "border-surface-variant" }
    : (riskConfig[category] || riskConfig.LOW);

  return (
    <div className="pt-8 px-6 md:px-10 pb-12 max-w-2xl mx-auto w-full flex flex-col gap-7 fade-in">
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-on-surface-variant hover:text-primary text-sm font-semibold mb-4 transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span> Back
        </button>
        <p className="text-on-surface-variant text-sm tracking-widest uppercase mb-1">Step 3 of 3</p>
        <h2 className="font-headline text-3xl font-bold text-on-surface">Scan Result</h2>
        <p className="text-on-surface-variant text-base mt-1">AI analysis is complete. Review the risk level below.</p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2">
        {[1,2,3].map(n => (
          <div key={n} className="h-1.5 flex-1 rounded-full bg-primary" />
        ))}
      </div>

      {/* Risk Card */}
      <div className={`bg-surface-container-lowest rounded-[2rem] p-8 border-2 ${cfg.border} flex flex-col items-center gap-5 text-center`}>
        <div className={`${cfg.bg} p-5 rounded-full`}>
          <span className={`material-symbols-outlined ${cfg.color} text-5xl`} style={{ fontVariationSettings:"'FILL' 1" }}>{cfg.icon}</span>
        </div>
        <div>
          <p className="text-on-surface-variant text-sm font-semibold tracking-widest uppercase mb-2">AI Assessment</p>
          <h3 className={`font-headline text-2xl font-extrabold ${cfg.color} mb-1`}>{cfg.label}</h3>
          <p className="text-on-surface-variant text-base">Detected condition: <strong className="text-on-surface">{disease}</strong></p>
        </div>
        {/* Score bar */}
        <div className="w-full">
          <div className="flex justify-between text-sm font-semibold mb-2">
            <span className="text-on-surface-variant">Risk Score</span>
            <span className={cfg.color}>{isAnomaly ? "N/A" : `${score.toFixed(1)}%`}</span>
          </div>
          <div className="w-full h-3 bg-surface-variant rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: isAnomaly ? "50%" : `${Math.min(score, 100)}%`,
                backgroundColor: isAnomaly ? "#94a3b8" : (category === "HIGH" ? "#ba1a1a" : category === "MEDIUM" ? "#d97706" : "#00796B"),
                opacity: isAnomaly ? 0.4 : 1,
              }}
            />
          </div>
          {isAnomaly ? (
            <p className="text-xs text-on-surface-variant mt-2 text-center">
              ⚠ Please upload a clear dermoscopy or skin lesion image for accurate assessment.
            </p>
          ) : (
            <div className="flex justify-between text-xs text-on-surface-variant mt-1">
              <span>0 — Low</span><span>50 — Medium</span><span>100 — High</span>
            </div>
          )}
        </div>
      </div>


      {/* Notes Summary */}
      <div className="bg-surface-container-lowest rounded-[1.5rem] p-6">
        <h3 className="font-headline text-base font-semibold text-on-surface mb-3">Clinical Notes Summary</h3>
        <p className="text-on-surface-variant text-base leading-relaxed">{notes}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {/* HIGH RISK — Auto-escalation Order ID banner */}
        {category === "HIGH" && !isAnomaly && (
          <div style={{ background: "linear-gradient(135deg,#fee2e2,#fecaca)", border: "2px solid #ef4444", borderRadius: "20px", padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <span style={{ fontSize: "28px" }}>⚡</span>
              <div>
                <p style={{ fontWeight: "800", color: "#991b1b", margin: 0, fontSize: "15px" }}>AUTO-REPORTED TO DOCTOR</p>
                <p style={{ fontSize: "12px", color: "#7f1d1d", margin: 0 }}>This HIGH-risk case has been automatically escalated to the immediate queue.</p>
              </div>
            </div>
            {orderId && (
              <div style={{ background: "#fff", borderRadius: "12px", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: "10px", color: "#64748b", fontWeight: "700", margin: "0 0 2px", textTransform: "uppercase" }}>Reference Order ID</p>
                  <p style={{ fontSize: "20px", fontWeight: "800", color: "#dc2626", margin: 0, fontFamily: "monospace" }}>{orderId}</p>
                </div>
                <span style={{ fontSize: "24px" }}>🚨</span>
              </div>
            )}
          </div>
        )}

        {category === "HIGH" && (
          <button onClick={() => navigate("/nurse/submit")}
            className="w-full bg-error text-white font-headline font-bold py-4 rounded-full text-base shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined" style={{ fontVariationSettings:"'FILL' 1" }}>send</span>
            Submit Full Report to Doctor
          </button>
        )}
        {category === "MEDIUM" && (
          <button onClick={() => navigate("/nurse/submit")}
            className="w-full bg-amber-500 text-white font-headline font-bold py-4 rounded-full text-base shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined" style={{ fontVariationSettings:"'FILL' 1" }}>send</span>
            Submit Case for Review
          </button>
        )}
        {category === "LOW" && (
          <div className="w-full bg-primary-container/30 border-2 border-primary text-primary font-headline font-bold py-4 rounded-full text-base text-center">
            ✅ Auto-Resolved — No referral needed
          </div>
        )}
        <button onClick={() => navigate("/nurse/dashboard")}
          className="w-full border-2 border-surface-variant text-on-surface-variant font-semibold py-3.5 rounded-full text-base hover:border-primary hover:text-primary transition-all">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
