import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getScans, getUserProfile } from "../../services/api";
import { useLang } from "../../context/LanguageContext";
import tr from "../../i18n/translations";

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const tx = tr[lang].patient;
  const [scans, setScans] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const rawName = localStorage.getItem("user_name") || "Patient";
  const userName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  useEffect(() => {
    Promise.all([getScans(), getUserProfile()])
      .then(([sRes, pRes]) => {
        setScans(sRes.data);
        setProfile(pRes.data);
        // Store patient_id for scan submission
        if (pRes.data.patient_id) {
          localStorage.setItem("patient_record_id", pRes.data.patient_id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const highRisk = scans.filter(s => s.risk_category === "HIGH").length;
  const lastScan = scans[0];

  const getRiskColor = (cat) => ({ HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#10b981" }[cat] || "#6b7280");

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
        <p style={{ color: "var(--text-muted)" }}>Loading your health dashboard...</p>
      </div>
    </div>
  );

  return (
    <div style={s.container}>
      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroLeft}>
          <p style={s.heroTag}>{lang === "kn" ? "ನನ್ನ ಆರೋಗ್ಯ ಪೋರ್ಟಲ್" : "My Health Portal"}</p>
          <h1 style={s.heroTitle}>{lang === "kn" ? `ನಮಸ್ಕಾರ, ${userName} 👋` : `Good day, ${userName} 👋`}</h1>
          <p style={s.heroSub}>
            {highRisk > 0
              ? <span>{lang === "kn" ? "ನಿಮಗೆ ಗಮನ ಹರಿಸಬೇಕಾದ" : "You have"} <strong style={{ color: "#fca5a5" }}>{highRisk} {lang === "kn" ? "ಫಲಿತಾಂಶ(ಗಳು) ಇವೆ." : "result(s)"}</strong> {lang === "kn" ? "" : "that need attention."}</span>
              : lang === "kn" ? "ನಿಮ್ಮ ಇತ್ತೀಚಿನ ಸ್ಕ್ಯಾನ್‌ಗಳು ಸ್ಥಿರವಾಗಿವೆ. ನಿಗಾ ವಹಿಸಿ." : "Your recent scans look stable. Keep monitoring."}
          </p>
        </div>
        <div style={s.heroActions}>
          <button onClick={() => navigate("/patient/scan")} style={s.btnPrimary}>
            🔬 {lang === "kn" ? "ಹೊಸ ಸ್ಕ್ಯಾನ್ ಪ್ರಾರಂಭಿಸಿ" : "Start New Scan"}
          </button>
          <button onClick={() => navigate("/patient/chat")} style={s.btnOutline}>
            💬 {lang === "kn" ? "AI ಸಹಾಯಕರೊಂದಿಗೆ ಮಾತನಾಡಿ" : "Talk to AI Assistant"}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={s.statsGrid}>
        <div style={s.statCard} onClick={() => navigate("/patient/reports")}>
          <div style={{ ...s.statIcon, background: "#e0f2fe" }}>📊</div>
          <div>
            <p style={s.statLabel}>Total Scans</p>
            <p style={s.statValue}>{scans.length}</p>
          </div>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statIcon, background: "#fef3c7" }}>⚠️</div>
          <div>
            <p style={s.statLabel}>Needs Attention</p>
            <p style={{ ...s.statValue, color: "#d97706" }}>{highRisk}</p>
          </div>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statIcon, background: "#dcfce7" }}>✅</div>
          <div>
            <p style={s.statLabel}>Reviewed by Doctor</p>
            <p style={{ ...s.statValue, color: "#16a34a" }}>{scans.filter(s => s.is_reviewed).length}</p>
          </div>
        </div>
        <div style={s.statCard} onClick={() => navigate("/patient/reports")}>
          <div style={{ ...s.statIcon, background: "#f3e8ff" }}>🩺</div>
          <div>
            <p style={s.statLabel}>Doctor Feedback</p>
            <p style={s.statValue}>{scans.filter(s => s.doctor_notes).length}</p>
          </div>
        </div>
      </div>

      <div style={s.grid}>
        {/* Last Result */}
        <div style={s.card}>
          <h3 style={s.sectionTitle}>Latest Scan Result</h3>
          {lastScan ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: getRiskColor(lastScan.risk_category), flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: "700", color: "var(--text-main)", margin: 0 }}>{lastScan.predicted_disease}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                    {new Date(lastScan.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span style={{ ...s.riskBadge, background: getRiskColor(lastScan.risk_category) + "20", color: getRiskColor(lastScan.risk_category) }}>
                  {lastScan.risk_category}
                </span>
              </div>
              {/* Risk Bar */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                  <span>Risk Score</span>
                  <span style={{ fontWeight: "700" }}>{lastScan.risk_score?.toFixed(1)}%</span>
                </div>
                <div style={{ height: "8px", background: "var(--border-color)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${lastScan.risk_score}%`, background: getRiskColor(lastScan.risk_category), borderRadius: "4px", transition: "width 0.7s" }} />
                </div>
              </div>
              {lastScan.is_reviewed && lastScan.doctor_notes && (
                <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "10px", padding: "12px" }}>
                  <p style={{ fontSize: "11px", fontWeight: "700", color: "#16a34a", marginBottom: "4px" }}>DOCTOR'S NOTE</p>
                  <p style={{ fontSize: "13px", color: "var(--text-main)", margin: 0 }}>{lastScan.doctor_notes}</p>
                </div>
              )}
              <button onClick={() => navigate("/patient/reports")} style={{ ...s.btnLink, marginTop: "12px" }}>
                View All Reports →
              </button>
            </div>
          ) : (
            <div style={s.emptyState}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔬</div>
              <p style={{ fontWeight: "600", margin: "0 0 4px 0" }}>No scans yet</p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 16px 0" }}>Upload your first skin scan to get started.</p>
              <button onClick={() => navigate("/patient/scan")} style={s.btnPrimary}>Start First Scan</button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={s.card}>
            <h3 style={s.sectionTitle}>Quick Actions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { icon: "🔬", label: "Start New Skin Scan", sub: "Upload image & get AI analysis", path: "/patient/scan", color: "#3b82f6" },
                { icon: "💬", label: "Talk to AI Assistant", sub: "Describe your symptoms", path: "/patient/chat", color: "#8b5cf6" },
                { icon: "📋", label: "View My Reports", sub: "Past scans & doctor feedback", path: "/patient/reports", color: "#10b981" },
              ].map(a => (
                <div key={a.path} onClick={() => navigate(a.path)} style={s.actionItem}>
                  <div style={{ ...s.actionIcon, background: a.color + "15" }}>{a.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: "700", color: "var(--text-main)", margin: 0, fontSize: "14px" }}>{a.label}</p>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0 0" }}>{a.sub}</p>
                  </div>
                  <span style={{ color: "var(--text-muted)", fontSize: "18px" }}>›</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...s.card, background: "linear-gradient(135deg, #004D40, #00796B)", color: "#fff" }}>
            <p style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "1px", opacity: 0.8, marginBottom: "8px" }}>SKIN HEALTH TIP</p>
            <p style={{ fontSize: "14px", fontWeight: "600", margin: "0 0 6px 0" }}>Use the ABCDE rule</p>
            <p style={{ fontSize: "12px", opacity: 0.85, margin: 0, lineHeight: 1.6 }}>
              Watch for Asymmetry, irregular Border, multiple Colors, Diameter {">"} 6mm, or Evolution of any mole. When in doubt, scan it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  container: { paddingTop: "32px", maxWidth: "1200px", margin: "0 auto", paddingBottom: "60px" },
  hero: { background: "linear-gradient(135deg, #004D40, #00796B)", borderRadius: "24px", padding: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "24px", marginBottom: "32px", flexWrap: "wrap" },
  heroLeft: {},
  heroTag: { fontSize: "12px", fontWeight: "700", color: "rgba(255,255,255,0.7)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "8px" },
  heroTitle: { fontSize: "32px", fontWeight: "800", color: "#fff", margin: "0 0 8px 0", letterSpacing: "-0.5px" },
  heroSub: { fontSize: "15px", color: "rgba(255,255,255,0.8)", margin: 0 },
  heroActions: { display: "flex", gap: "12px", flexWrap: "wrap" },
  btnPrimary: { background: "#fff", color: "#004D40", border: "none", borderRadius: "40px", padding: "12px 24px", fontWeight: "700", cursor: "pointer", fontSize: "14px", fontFamily: "'Lexend', sans-serif" },
  btnOutline: { background: "rgba(255,255,255,0.15)", color: "#fff", border: "2px solid rgba(255,255,255,0.4)", borderRadius: "40px", padding: "12px 24px", fontWeight: "700", cursor: "pointer", fontSize: "14px", fontFamily: "'Lexend', sans-serif" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" },
  statCard: { background: "var(--card-bg)", borderRadius: "16px", padding: "20px", boxShadow: "var(--shadow-sm)", display: "flex", gap: "16px", alignItems: "center", cursor: "pointer" },
  statIcon: { width: "44px", height: "44px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 },
  statLabel: { fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", margin: "0 0 4px 0" },
  statValue: { fontSize: "26px", fontWeight: "800", color: "var(--text-main)", margin: 0, letterSpacing: "-0.5px" },
  grid: { display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" },
  card: { background: "var(--card-bg)", borderRadius: "20px", padding: "28px", boxShadow: "var(--shadow-sm)" },
  sectionTitle: { fontSize: "18px", fontWeight: "700", color: "var(--text-main)", marginBottom: "20px" },
  riskBadge: { fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px", marginLeft: "auto" },
  emptyState: { textAlign: "center", padding: "32px 0", color: "var(--text-main)" },
  btnLink: { background: "none", border: "none", color: "var(--primary)", fontWeight: "700", cursor: "pointer", fontSize: "13px", padding: 0, fontFamily: "'Lexend', sans-serif", display: "block" },
  actionItem: { display: "flex", alignItems: "center", gap: "14px", padding: "14px", borderRadius: "12px", cursor: "pointer", background: "var(--bg-secondary)", transition: "all 0.15s" },
  actionIcon: { width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 },
};
