import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getScans, createScan } from "../../services/api";

export default function PatientReports() {
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const fileRef = useRef();

  const fetchScans = () => {
    setLoading(true);
    getScans().then(r => setScans(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchScans(); }, []);

  const filtered = filter === "ALL" ? scans : scans.filter(s => s.risk_category === filter);

  const getRiskColor = (cat) => ({ HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#10b981" }[cat] || "#6b7280");
  const getRiskBg   = (cat) => ({ HIGH: "#fee2e2", MEDIUM: "#fef3c7", LOW: "#dcfce7" }[cat] || "#f1f5f9");
  const getRiskIcon = (cat) => ({ HIGH: "🚨", MEDIUM: "⚠️", LOW: "✅" }[cat] || "🔬");

  const layman = {
    HIGH:   "Urgent attention needed — please consult a doctor.",
    MEDIUM: "Moderate concern — schedule a follow-up visit.",
    LOW:    "Stable — continue monitoring and sun protection.",
  };

  const getStatus = (scan) => {
    if (scan.is_reviewed)  return { label: "Reviewed by Doctor", color: "#16a34a", bg: "#dcfce7" };
    if (scan.is_escalated) return { label: "Referred to Doctor", color: "#d97706", bg: "#fef3c7" };
    return { label: "Pending Review", color: "#64748b", bg: "#f1f5f9" };
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
    setUploadMsg("");
    setUploadError("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
    setUploadMsg("");
    setUploadError("");
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) { setUploadError("Please select an image first."); return; }
    setUploading(true);
    setUploadError("");
    setUploadMsg("");
    try {
      const patientId = localStorage.getItem("patient_id");
      const fd = new FormData();
      fd.append("image", uploadFile);
      fd.append("notes", "Patient self-upload from Reports page");
      if (patientId) fd.append("patient", patientId);
      await createScan(fd);
      setUploadMsg("✅ Scan submitted! AI analysis is running...");
      setUploadFile(null);
      setUploadPreview(null);
      setTimeout(() => { setShowUpload(false); setUploadMsg(""); fetchScans(); }, 2500);
    } catch (err) {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* ── Page header ── */}
      <div style={s.pageHeader}>
        <div>
          <button onClick={() => navigate("/patient/dashboard")} style={s.backBtn}>← Back to Dashboard</button>
          <h1 style={s.title}>My Health Reports</h1>
          <p style={s.subtitle}>Your complete scan history, AI results, and doctor feedback.</p>
        </div>
        <button onClick={() => setShowUpload(!showUpload)} style={s.uploadToggleBtn}>
          {showUpload ? "✕ Close Upload" : "📤 Upload New Scan"}
        </button>
      </div>

      {/* ── Upload panel ── */}
      {showUpload && (
        <div style={s.uploadPanel}>
          <h3 style={s.uploadTitle}>📸 Upload a New Skin Image</h3>
          <p style={s.uploadSubtitle}>Upload a clear, close-up photo of the affected skin area for AI analysis.</p>

          {/* Drop zone */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !uploadPreview && fileRef.current?.click()}
            style={{
              ...s.dropZone,
              borderColor: uploadPreview ? "#004D40" : "#d1d5db",
              background: uploadPreview ? "transparent" : "#f8fafc",
              cursor: uploadPreview ? "default" : "pointer",
            }}
          >
            {uploadPreview ? (
              <div style={{ position: "relative" }}>
                <img src={uploadPreview} alt="Preview" style={{ maxHeight: "260px", maxWidth: "100%", borderRadius: "12px", display: "block", margin: "0 auto" }} />
                <button onClick={(e) => { e.stopPropagation(); setUploadFile(null); setUploadPreview(null); }} style={s.removeBtn}>✕ Remove</button>
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🖼️</div>
                <p style={{ fontWeight: "700", color: "var(--text-main)", margin: "0 0 6px" }}>Drag & Drop or Click to Upload</p>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>JPEG, PNG · Max 10MB · No filters or edits</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
          </div>

          {/* Guidelines */}
          <div style={s.guideGrid}>
            {["Use bright, natural light", "Capture the full lesion", "Avoid blur — hold steady", "No jewellery over the area"].map(g => (
              <div key={g} style={s.guideItem}>✔ {g}</div>
            ))}
          </div>

          {uploadError && <div style={s.errorBox}>{uploadError}</div>}
          {uploadMsg   && <div style={s.successBox}>{uploadMsg}</div>}

          <button onClick={handleUploadSubmit} disabled={!uploadFile || uploading} style={{ ...s.submitBtn, opacity: (!uploadFile || uploading) ? 0.6 : 1 }}>
            {uploading ? "🤖 Running AI Analysis..." : "🔬 Submit for AI Analysis"}
          </button>
        </div>
      )}

      {/* ── Stats bar ── */}
      <div style={s.statsBar}>
        {[
          { label: "Total Scans",    value: scans.length,                                                     color: "#004D40" },
          { label: "High Risk",      value: scans.filter(s => s.risk_category === "HIGH").length,             color: "#ef4444" },
          { label: "Moderate Risk",  value: scans.filter(s => s.risk_category === "MEDIUM").length,           color: "#f59e0b" },
          { label: "Low Risk",       value: scans.filter(s => s.risk_category === "LOW").length,              color: "#10b981" },
          { label: "Doctor Reviewed",value: scans.filter(s => s.is_reviewed).length,                          color: "#8b5cf6" },
        ].map(stat => (
          <div key={stat.label} style={s.statCard}>
            <p style={{ fontSize: "28px", fontWeight: "800", color: stat.color, margin: "0 0 4px" }}>{stat.value}</p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", margin: 0 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filter tabs ── */}
      <div style={s.filterRow}>
        {["ALL", "HIGH", "MEDIUM", "LOW"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            ...s.filterBtn,
            background: filter === f ? "#004D40" : "var(--card-bg)",
            color: filter === f ? "#fff" : "var(--text-muted)",
            borderColor: filter === f ? "#004D40" : "var(--border-color)",
          }}>
            {f === "ALL" ? `All Scans (${scans.length})` : `${getRiskIcon(f)} ${f} (${scans.filter(s => s.risk_category === f).length})`}
          </button>
        ))}
      </div>

      {/* ── Reports grid ── */}
      {loading ? (
        <div style={s.empty}>Loading your reports...</div>
      ) : filtered.length === 0 ? (
        <div style={s.emptyState}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>📋</div>
          <p style={{ fontWeight: "700", fontSize: "18px", margin: "0 0 8px" }}>No reports yet</p>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "0 0 24px" }}>Upload your first scan above or complete a scan to see results here.</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => setShowUpload(true)} style={s.actionBtn}>📤 Upload Scan</button>
            <button onClick={() => navigate("/patient/scan")} style={{ ...s.actionBtn, background: "transparent", color: "#004D40", border: "2px solid #004D40" }}>🔬 Start Guided Scan</button>
          </div>
        </div>
      ) : (
        <div style={s.reportsGrid}>
          {filtered.map((scan, i) => {
            const status   = getStatus(scan);
            const isAnomaly = ["not skin", "anomaly", "unrelated"].some(kw => (scan.predicted_disease || "").toLowerCase().includes(kw));
            return (
              <div key={scan.id || i} style={{ ...s.reportCard, borderTop: `4px solid ${getRiskColor(scan.risk_category)}` }}>
                {/* Card header */}
                <div style={s.cardHeader}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "24px" }}>{getRiskIcon(scan.risk_category)}</span>
                    <div>
                      <p style={{ fontWeight: "700", color: "var(--text-main)", margin: 0, fontSize: "14px", lineHeight: 1.3 }}>
                        {scan.predicted_disease || "Analysis Complete"}
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                        {new Date(scan.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                    <span style={{ ...s.badge, background: getRiskBg(scan.risk_category), color: getRiskColor(scan.risk_category) }}>
                      {isAnomaly ? "N/A" : `${scan.risk_category} RISK`}
                    </span>
                    <span style={{ ...s.badge, background: status.bg, color: status.color }}>{status.label}</span>
                  </div>
                </div>

                {/* Scan image */}
                {scan.image && (
                  <img
                    src={`http://127.0.0.1:8000${scan.image}`}
                    alt="Scan"
                    style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "10px", margin: "12px 0 8px" }}
                    onError={e => e.target.style.display = "none"}
                  />
                )}

                {/* Risk bar */}
                <div style={{ margin: "10px 0 8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)", marginBottom: "3px" }}>
                    <span>Risk Score</span>
                    <span style={{ fontWeight: "700" }}>{isAnomaly ? "N/A" : `${scan.risk_score?.toFixed(1) || 0}%`}</span>
                  </div>
                  <div style={{ height: "5px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: isAnomaly ? "50%" : `${scan.risk_score || 0}%`, background: isAnomaly ? "#cbd5e1" : getRiskColor(scan.risk_category), borderRadius: "3px", opacity: isAnomaly ? 0.4 : 1 }} />
                  </div>
                </div>

                {/* Plain-language explanation */}
                <div style={{ ...s.explanationBox, borderColor: getRiskColor(scan.risk_category) + "40", background: getRiskBg(scan.risk_category) + "50" }}>
                  <p style={{ fontSize: "12px", color: "var(--text-main)", margin: 0, lineHeight: 1.5 }}>
                    {isAnomaly ? "⚠ Non-skin image — please re-upload a clear skin lesion photo." : (layman[scan.risk_category] || "Please consult your doctor.")}
                  </p>
                </div>

                {/* Doctor note */}
                {scan.doctor_notes && (
                  <div style={s.doctorNote}>
                    <p style={{ fontSize: "10px", fontWeight: "700", color: "#16a34a", margin: "0 0 4px" }}>🩺 DOCTOR'S NOTE</p>
                    <p style={{ fontSize: "12px", color: "var(--text-main)", margin: 0, lineHeight: 1.5 }}>{scan.doctor_notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const s = {
  page:           { width: "100%", padding: "28px 32px 60px", boxSizing: "border-box" },
  pageHeader:     { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "28px", flexWrap: "wrap", gap: "16px" },
  backBtn:        { background: "none", border: "none", color: "var(--text-muted)", fontWeight: "600", cursor: "pointer", fontSize: "13px", padding: "0 0 8px 0", fontFamily: "'Lexend', sans-serif", display: "block" },
  title:          { fontSize: "30px", fontWeight: "800", color: "var(--text-main)", margin: "0 0 4px", letterSpacing: "-0.5px" },
  subtitle:       { fontSize: "14px", color: "var(--text-muted)", margin: 0 },
  uploadToggleBtn:{ background: "#004D40", color: "#fff", border: "none", borderRadius: "40px", padding: "12px 24px", fontWeight: "700", cursor: "pointer", fontSize: "14px", fontFamily: "'Lexend', sans-serif" },

  uploadPanel:    { background: "var(--card-bg)", borderRadius: "20px", padding: "28px", boxShadow: "var(--shadow-sm)", marginBottom: "28px", border: "2px dashed #004D40" },
  uploadTitle:    { fontSize: "18px", fontWeight: "700", color: "var(--text-main)", margin: "0 0 6px" },
  uploadSubtitle: { fontSize: "13px", color: "var(--text-muted)", margin: "0 0 20px" },
  dropZone:       { border: "2px dashed", borderRadius: "16px", padding: "32px 24px", marginBottom: "16px", transition: "all 0.2s" },
  removeBtn:      { position: "absolute", top: "10px", right: "10px", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontWeight: "600", fontSize: "12px", fontFamily: "'Lexend', sans-serif" },
  guideGrid:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" },
  guideItem:      { fontSize: "12px", color: "var(--text-muted)", padding: "8px 12px", background: "var(--bg-secondary)", borderRadius: "8px" },
  errorBox:       { background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", marginBottom: "12px" },
  successBox:     { background: "#dcfce7", color: "#15803d", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", marginBottom: "12px", fontWeight: "600" },
  submitBtn:      { width: "100%", padding: "15px", borderRadius: "40px", border: "none", background: "linear-gradient(135deg,#004D40,#00796B)", color: "#fff", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "'Lexend', sans-serif" },

  statsBar:       { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "24px" },
  statCard:       { background: "var(--card-bg)", borderRadius: "14px", padding: "18px 16px", textAlign: "center", boxShadow: "var(--shadow-sm)" },

  filterRow:      { display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" },
  filterBtn:      { padding: "8px 18px", borderRadius: "20px", border: "2px solid", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: "'Lexend', sans-serif" },

  empty:          { color: "var(--text-muted)", textAlign: "center", padding: "60px 0" },
  emptyState:     { textAlign: "center", padding: "80px 0", color: "var(--text-main)" },
  actionBtn:      { background: "#004D40", color: "#fff", border: "none", borderRadius: "40px", padding: "12px 28px", fontWeight: "700", cursor: "pointer", fontSize: "14px", fontFamily: "'Lexend', sans-serif" },

  reportsGrid:    { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" },
  reportCard:     { background: "var(--card-bg)", borderRadius: "16px", padding: "20px", boxShadow: "var(--shadow-sm)", position: "relative" },
  cardHeader:     { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" },
  badge:          { fontSize: "10px", fontWeight: "700", padding: "3px 9px", borderRadius: "20px", letterSpacing: "0.3px" },
  explanationBox: { border: "1px solid", borderRadius: "8px", padding: "10px 12px", marginTop: "8px" },
  doctorNote:     { background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "10px 12px", marginTop: "10px" },
};
