import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getScans } from "../services/api";

export default function ImmediateCases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getScans()
      .then(r => {
        // Filter: HIGH risk cases only (escalated OR high risk score)
        const high = r.data.filter(s =>
          s.risk_category === "HIGH" ||
          (s.risk_score >= 67 && !["not skin","anomaly","unrelated"].some(kw => (s.predicted_disease||"").toLowerCase().includes(kw)))
        );
        // Sort newest first
        setCases(high.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Generate deterministic Order ID from scan id
  const orderId = (scan) => `GV-${String(scan.id || 0).padStart(5, "0")}`;

  const timeSince = (dt) => {
    const diff = Date.now() - new Date(dt).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div style={{ width:"100%", padding:"28px 32px 60px", boxSizing:"border-box" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:"28px", flexWrap:"wrap", gap:"16px" }}>
        <div>
          <button onClick={() => navigate("/dashboard")} style={{ background:"none", border:"none", color:"var(--text-muted)", fontWeight:"600", cursor:"pointer", fontSize:"13px", padding:"0 0 8px 0", fontFamily:"'Lexend', sans-serif", display:"block" }}>
            ← Back to Dashboard
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <div style={{ width:"48px", height:"48px", background:"#fee2e2", borderRadius:"14px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px" }}>🚨</div>
            <div>
              <h1 style={{ fontSize:"28px", fontWeight:"800", color:"var(--text-main)", margin:"0 0 2px", letterSpacing:"-0.5px" }}>Immediate Cases</h1>
              <p style={{ fontSize:"13px", color:"#ef4444", fontWeight:"600", margin:0 }}>
                {cases.length} HIGH RISK {cases.length === 1 ? "case" : "cases"} — Action Required
              </p>
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:"8px" }}>
          <button onClick={() => navigate("/chat")} style={{ background:"#e8eaf6", color:"#1a237e", border:"none", borderRadius:"40px", padding:"10px 20px", fontWeight:"700", cursor:"pointer", fontSize:"13px", fontFamily:"'Lexend', sans-serif" }}>
            🩺 Clinical AI
          </button>
          <button onClick={() => navigate("/patients")} style={{ background:"#004D40", color:"#fff", border:"none", borderRadius:"40px", padding:"10px 20px", fontWeight:"700", cursor:"pointer", fontSize:"13px", fontFamily:"'Lexend', sans-serif" }}>
            All Patients →
          </button>
        </div>
      </div>

      {/* Alert banner */}
      <div style={{ background:"linear-gradient(135deg,#fee2e2,#fecaca)", border:"1px solid #fca5a5", borderRadius:"16px", padding:"20px 24px", marginBottom:"28px", display:"flex", alignItems:"center", gap:"16px" }}>
        <span style={{ fontSize:"32px" }}>⚡</span>
        <div>
          <p style={{ fontWeight:"700", color:"#991b1b", margin:"0 0 4px", fontSize:"16px" }}>Immediate Attention Required</p>
          <p style={{ fontSize:"13px", color:"#7f1d1d", margin:0 }}>
            These cases were automatically escalated by the AI triage engine due to HIGH risk classification. Each case has a unique Order ID for tracking.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:"60px", color:"var(--text-muted)" }}>Loading immediate cases...</div>
      ) : cases.length === 0 ? (
        <div style={{ textAlign:"center", padding:"80px 0" }}>
          <div style={{ fontSize:"64px", marginBottom:"16px" }}>✅</div>
          <p style={{ fontWeight:"700", fontSize:"20px", color:"var(--text-main)", margin:"0 0 8px" }}>No Immediate Cases</p>
          <p style={{ fontSize:"14px", color:"var(--text-muted)", margin:0 }}>All patients are within safe risk parameters. No HIGH-risk escalations at this time.</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          {cases.map((scan, i) => (
            <div key={scan.id || i} style={{
              background:"var(--card-bg)", borderRadius:"20px", padding:"24px 28px",
              boxShadow:"var(--shadow-sm)", borderLeft:"5px solid #ef4444",
              display:"grid", gridTemplateColumns:"1fr auto", gap:"20px", alignItems:"start"
            }}>
              <div>
                {/* Order ID + status row */}
                <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"14px", flexWrap:"wrap" }}>
                  <span style={{ fontSize:"13px", fontWeight:"800", color:"#dc2626", background:"#fee2e2", padding:"5px 14px", borderRadius:"20px", letterSpacing:"0.5px", fontFamily:"monospace" }}>
                    🚨 {orderId(scan)}
                  </span>
                  <span style={{ fontSize:"11px", fontWeight:"700", color:"#64748b", background:"#f1f5f9", padding:"4px 10px", borderRadius:"20px" }}>
                    {timeSince(scan.created_at)}
                  </span>
                  {scan.is_reviewed ? (
                    <span style={{ fontSize:"11px", fontWeight:"700", color:"#16a34a", background:"#dcfce7", padding:"4px 10px", borderRadius:"20px" }}>✓ Reviewed</span>
                  ) : scan.is_escalated ? (
                    <span style={{ fontSize:"11px", fontWeight:"700", color:"#d97706", background:"#fef3c7", padding:"4px 10px", borderRadius:"20px" }}>⏳ Escalated — Pending Review</span>
                  ) : (
                    <span style={{ fontSize:"11px", fontWeight:"700", color:"#dc2626", background:"#fee2e2", padding:"4px 10px", borderRadius:"20px" }}>🔴 URGENT — Not Yet Reviewed</span>
                  )}
                </div>

                {/* Patient + condition */}
                <h2 style={{ fontSize:"20px", fontWeight:"800", color:"var(--text-main)", margin:"0 0 4px" }}>
                  {scan.predicted_disease || "High Risk Lesion"}
                </h2>
                <p style={{ fontSize:"13px", color:"var(--text-muted)", margin:"0 0 16px" }}>
                  Patient ID: {scan.patient || "Unknown"} · Submitted: {new Date(scan.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                </p>

                {/* Risk metrics */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"12px", marginBottom:"16px" }}>
                  {[
                    { label:"Risk Score", value: scan.risk_score ? `${scan.risk_score.toFixed(1)}%` : "N/A", color:"#ef4444" },
                    { label:"Risk Category", value: scan.risk_category || "HIGH", color:"#ef4444" },
                    { label:"AI Confidence", value: scan.confidence ? `${scan.confidence.toFixed(1)}%` : `${scan.risk_score?.toFixed(1) || 0}%`, color:"#1a237e" },
                  ].map(m => (
                    <div key={m.label} style={{ background:"var(--bg-secondary)", borderRadius:"12px", padding:"12px 14px" }}>
                      <p style={{ fontSize:"10px", color:"var(--text-muted)", fontWeight:"600", margin:"0 0 4px", textTransform:"uppercase" }}>{m.label}</p>
                      <p style={{ fontSize:"18px", fontWeight:"800", color:m.color, margin:0 }}>{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Score bar */}
                <div style={{ marginBottom:"16px" }}>
                  <div style={{ height:"8px", background:"#e2e8f0", borderRadius:"4px", overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${scan.risk_score || 0}%`, background:"linear-gradient(90deg,#f97316,#ef4444)", borderRadius:"4px", transition:"width 0.8s" }} />
                  </div>
                </div>

                {/* Doctor notes (if reviewed) */}
                {scan.doctor_notes && (
                  <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:"10px", padding:"12px 16px" }}>
                    <p style={{ fontSize:"11px", fontWeight:"700", color:"#16a34a", margin:"0 0 4px" }}>🩺 DOCTOR'S REVIEW</p>
                    <p style={{ fontSize:"13px", color:"var(--text-main)", margin:0, lineHeight:1.5 }}>{scan.doctor_notes}</p>
                  </div>
                )}
              </div>

              {/* Right column — image + action */}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"12px", minWidth:"130px" }}>
                {scan.image ? (
                  <img src={`http://127.0.0.1:8000${scan.image}`} alt="Scan" style={{ width:"120px", height:"120px", objectFit:"cover", borderRadius:"12px", border:"3px solid #fca5a5" }} onError={e => e.target.style.display="none"} />
                ) : (
                  <div style={{ width:"120px", height:"120px", background:"#fee2e2", borderRadius:"12px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"40px" }}>🔬</div>
                )}
                {!scan.is_reviewed && (
                  <button
                    onClick={() => { localStorage.setItem("review_scan_id", scan.id); navigate("/insights"); }}
                    style={{ background:"#ef4444", color:"#fff", border:"none", borderRadius:"40px", padding:"10px 16px", fontWeight:"700", cursor:"pointer", fontSize:"12px", fontFamily:"'Lexend', sans-serif", whiteSpace:"nowrap" }}>
                    Review Now →
                  </button>
                )}
                <p style={{ fontSize:"10px", color:"var(--text-muted)", textAlign:"center", margin:0 }}>Order: {orderId(scan)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
