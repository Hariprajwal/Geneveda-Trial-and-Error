import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createScan, getUserProfile, escalateScan } from "../../services/api";

const SYMPTOMS = [
  { id: "Itching", label: "Pruritus (Itching)", desc: "Itching at or around the affected area" },
  { id: "Bleeding", label: "Haemorrhage (Bleeding)", desc: "Any bleeding from the lesion" },
  { id: "Pain", label: "Pain / Tenderness", desc: "Pain or tenderness when touched" },
  { id: "Rapid growth", label: "Rapid Growth", desc: "Lesion growing quickly in size" },
  { id: "Change in color", label: "Colour Change", desc: "Irregular or darkening pigmentation" },
];

const DURATIONS = ["< 1 week", "1–2 weeks", "2–4 weeks", "1–3 months", "> 3 months"];

export default function PatientScan() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: symptoms, 2: upload, 3: result
  const [symptoms, setSymptoms] = useState([]);
  const [duration, setDuration] = useState("");
  const [familyHistory, setFamilyHistory] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [patientId, setPatientId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Get or auto-create patient record
    getUserProfile().then(res => {
      if (res.data.patient_id) {
        setPatientId(res.data.patient_id);
        localStorage.setItem("patient_record_id", res.data.patient_id);
      }
    }).catch(() => {
      const cached = localStorage.getItem("patient_record_id");
      if (cached) setPatientId(cached);
    });

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = true; rec.interimResults = true;
      rec.onresult = e => {
        let t = "";
        for (let i = e.resultIndex; i < e.results.length; i++)
          if (e.results[i].isFinal) t += e.results[i][0].transcript + " ";
        if (t) setFamilyHistory(p => p + t);
      };
      rec.onend = () => setIsRecording(false);
      recognitionRef.current = rec;
    }
  }, []);

  const toggleSymptom = id => setSymptoms(prev =>
    prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
  );

  const handleImageChange = e => {
    const file = e.target.files[0];
    setImage(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!image) { setError("Please upload an image of the affected area."); return; }
    if (!patientId) { setError("Patient profile not found. Please contact support."); return; }
    setError(""); setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", image);
      formData.append("patient", patientId);
      if (symptoms.length > 0) formData.append("symptoms", JSON.stringify(symptoms));
      if (duration) formData.append("symptom_duration", duration);
      if (familyHistory.trim()) formData.append("family_history", familyHistory.trim());
      const res = await createScan(formData);
      const scanData = res.data;
      localStorage.setItem("lastResult", JSON.stringify(scanData));
      // Auto-escalate if HIGH risk
      if (scanData.risk_category === "HIGH" && scanData.id) {
        escalateScan(scanData.id, { notes: "Auto-escalated by patient AI scan — HIGH risk detected" }).catch(() => {});
      }
      setStep(3);
    } catch (err) {
      setError("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const lastResult = JSON.parse(localStorage.getItem("lastResult") || "null");

  // ── Step 3: Result Screen ──
  if (step === 3 && lastResult) {
    const cat     = lastResult.risk_category || "LOW";
    const score   = lastResult.risk_score || lastResult.confidence || 0;
    const disease = lastResult.predicted_disease || "Unknown";

    // Detect non-skin / unrelated images — consistent with Insights & NurseResult
    const isAnomaly = ["not skin", "anomaly", "unrelated", "no lesion", "calculating"]
      .some(kw => disease.toLowerCase().includes(kw));

    const cfg = isAnomaly
      ? { color: "#94a3b8", bg: "#f1f5f9", icon: "❓", label: "Unable to Assess", action: "" }
      : ({
          HIGH:   { color: "#ef4444", bg: "#fee2e2", icon: "🚨", label: "High Risk Detected",  action: "Consult a Doctor Immediately" },
          MEDIUM: { color: "#d97706", bg: "#fef3c7", icon: "⚠️", label: "Moderate Risk Found", action: "Schedule a Follow-Up" },
          LOW:    { color: "#16a34a", bg: "#dcfce7", icon: "✅", label: "Low Risk — Stable",    action: "Continue Monitoring" },
        }[cat] || { color: "#6b7280", bg: "#f1f5f9", icon: "🔬", label: "Analysis Complete", action: "View Details" });

    const layman = isAnomaly
      ? "The uploaded image does not appear to be a skin lesion. For accurate AI analysis, please upload a clear, close-up photo of the affected skin area."
      : ({
          HIGH:   "Your scan shows signs that require urgent medical attention. A dermatologist should examine this lesion as soon as possible.",
          MEDIUM: "Your scan shows some characteristics that warrant monitoring. Schedule a follow-up visit within the next 2–4 weeks.",
          LOW:    "Your scan looks stable with no immediate concern. Continue practising sun safety and monitor for any changes.",
        }[cat] || "Your scan has been analysed. Please consult a doctor for detailed guidance.");

    return (
      <div style={{ width: "100%", padding: "28px 32px 60px", boxSizing: "border-box" }}>
        <button onClick={() => { setStep(1); setImage(null); setPreview(null); }} style={s.backBtn}>← Back</button>
        <div style={{ ...s.resultCard, borderColor: cfg.color }}>
          <div style={{ textAlign: "center", padding: "32px 24px 24px" }}>
            <div style={{ fontSize: "56px", marginBottom: "12px" }}>{cfg.icon}</div>
            <span style={{ fontSize: "11px", fontWeight: "700", background: cfg.bg, color: cfg.color, padding: "4px 14px", borderRadius: "20px", letterSpacing: "1px" }}>
              {isAnomaly ? "NON-SKIN IMAGE" : `${cat} RISK`}
            </span>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-main)", margin: "16px 0 8px" }}>{cfg.label}</h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>{layman}</p>
          </div>

          {/* Score bar — hidden for anomaly, shown with N/A label */}
          <div style={{ padding: "0 24px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
              <span>AI Confidence Score</span>
              <span style={{ fontWeight: "700", color: cfg.color }}>{isAnomaly ? "N/A" : `${score.toFixed(1)}%`}</span>
            </div>
            <div style={{ height: "10px", background: "#e2e8f0", borderRadius: "5px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: isAnomaly ? "50%" : `${score}%`, background: isAnomaly ? "#cbd5e1" : cfg.color, borderRadius: "5px", transition: "width 0.8s", opacity: isAnomaly ? 0.4 : 1 }} />
            </div>
            {isAnomaly ? (
              <p style={{ fontSize: "11px", color: "#94a3b8", textAlign: "center", marginTop: "6px", fontStyle: "italic" }}>
                ⚠ Upload a clear skin lesion image for accurate scoring
              </p>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
                <span>Low Risk</span><span>Moderate</span><span>High Risk</span>
              </div>
            )}
          </div>


          {/* Action buttons */}
          <div style={{ padding: "0 24px 32px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {cat === "HIGH" && !isAnomaly && (
              <div style={{ background: "linear-gradient(135deg,#fee2e2,#fecaca)", border: "2px solid #ef4444", borderRadius: "16px", padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <span style={{ fontSize: "22px" }}>⚡</span>
                  <div>
                    <p style={{ fontWeight: "800", color: "#991b1b", margin: 0, fontSize: "13px" }}>AUTO-REPORTED TO DOCTOR</p>
                    <p style={{ fontSize: "11px", color: "#7f1d1d", margin: 0 }}>Your case has been automatically sent to the immediate queue.</p>
                  </div>
                </div>
                {lastResult?.id && (
                  <div style={{ background: "#fff", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontSize: "9px", color: "#64748b", fontWeight: "700", margin: "0 0 2px", textTransform: "uppercase" }}>Reference Order ID</p>
                      <p style={{ fontSize: "18px", fontWeight: "800", color: "#dc2626", margin: 0, fontFamily: "monospace" }}>GV-{String(lastResult.id).padStart(5, "0")}</p>
                    </div>
                    <span style={{ fontSize: "20px" }}>🚨</span>
                  </div>
                )}
                <p style={{ fontSize: "11px", color: "#7f1d1d", margin: "8px 0 0" }}>Please quote your Order ID when speaking with your doctor.</p>
              </div>
            )}
            {cat === "HIGH" && (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "12px", padding: "14px 16px", textAlign: "center" }}>
                <p style={{ fontWeight: "700", color: "#dc2626", margin: "0 0 4px" }}>⚡ Immediate Consultation Required</p>
                <p style={{ fontSize: "12px", color: "#7f1d1d", margin: 0 }}>Please visit a dermatologist or skin specialist as soon as possible.</p>
              </div>
            )}
            <button onClick={() => navigate("/patient/reports")} style={{ ...s.resultBtn, background: cfg.color }}>
              📋 View Full Report & History
            </button>
            <button onClick={() => { setStep(1); setImage(null); setPreview(null); setSymptoms([]); setDuration(""); }} style={s.resultBtnOutline}>
              🔬 Start Another Scan
            </button>
          </div>
        </div>

        {/* Health tips */}
        {cat === "LOW" && (
          <div style={s.tipsCard}>
            <p style={{ fontWeight: "700", color: "var(--text-main)", marginBottom: "12px" }}>💡 Skin Health Tips</p>
            {["Apply SPF 30+ sunscreen daily", "Wear protective clothing outdoors", "Avoid tanning beds", "Check your skin monthly for changes"].map(tip => (
              <p key={tip} style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 8px 0" }}>• {tip}</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Step 2: Upload Image ──
  if (step === 2) return (
    <div style={{ width: "100%", padding: "28px 32px 60px", boxSizing: "border-box", maxWidth: "680px" }}>
      <button onClick={() => setStep(1)} style={s.backBtn}>← Back to Symptoms</button>
      <h2 style={s.pageTitle}>Upload Skin Image</h2>
      <p style={s.pageSubtitle}>Please photograph the affected area clearly in good lighting.</p>

      {error && <div style={s.errorBox}>{error}</div>}

      {/* Upload area */}
      {!preview ? (
        <label style={s.uploadZone}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>📷</div>
          <p style={{ fontWeight: "700", color: "var(--text-main)", margin: "0 0 4px 0" }}>Tap to Upload Photo</p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>JPEG, PNG · Clear, well-lit image · No filters</p>
          <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
        </label>
      ) : (
        <div style={s.previewBox}>
          <img src={preview} alt="Scan preview" style={{ width: "100%", borderRadius: "12px", display: "block" }} />
          <button onClick={() => { setImage(null); setPreview(null); }} style={s.removeBtn}>✕ Remove</button>
        </div>
      )}

      <div style={s.guideBox}>
        <p style={{ fontWeight: "700", color: "var(--text-main)", marginBottom: "8px", fontSize: "13px" }}>📌 Photo Guidelines</p>
        {["Use natural or bright indoor light", "Keep camera steady — avoid blur", "Capture the full lesion with a 1cm border", "Avoid jewellery or clothing over the area"].map(g => (
          <p key={g} style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 4px 0" }}>• {g}</p>
        ))}
      </div>

      <button onClick={handleSubmit} disabled={!image || loading} style={{ ...s.submitBtn, opacity: (!image || loading) ? 0.6 : 1 }}>
        {loading ? "🤖 Running AI Analysis..." : "🔬 Analyse with AI"}
      </button>
    </div>
  );

  return (
    <div style={{ width: "100%", padding: "28px 32px 60px", boxSizing: "border-box", maxWidth: "680px" }}>
      <button onClick={() => navigate("/patient/dashboard")} style={s.backBtn}>← Back</button>

      {/* Progress */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {[1, 2].map(n => (
          <div key={n} style={{ flex: 1, height: "4px", borderRadius: "2px", background: n <= step ? "var(--primary)" : "var(--border-color)", transition: "background 0.3s" }} />
        ))}
      </div>

      <h2 style={s.pageTitle}>Describe Your Symptoms</h2>
      <p style={s.pageSubtitle}>Select what you are currently experiencing. This helps the AI give a more accurate result.</p>

      {/* Symptoms checklist */}
      <div style={{ marginBottom: "24px" }}>
        {SYMPTOMS.map(sym => (
          <div key={sym.id} onClick={() => toggleSymptom(sym.id)} style={{
            display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px",
            borderRadius: "12px", border: `2px solid ${symptoms.includes(sym.id) ? "var(--primary)" : "var(--border-color)"}`,
            background: symptoms.includes(sym.id) ? "rgba(0,121,107,0.08)" : "var(--card-bg)",
            cursor: "pointer", transition: "all 0.15s", marginBottom: "8px",
          }}>
            <div style={{
              width: "22px", height: "22px", borderRadius: "6px", flexShrink: 0,
              background: symptoms.includes(sym.id) ? "var(--primary)" : "transparent",
              border: `2px solid ${symptoms.includes(sym.id) ? "var(--primary)" : "var(--border-color)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {symptoms.includes(sym.id) && <span style={{ color: "#fff", fontSize: "13px", fontWeight: "800" }}>✓</span>}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: "700", color: "var(--text-main)", margin: 0, fontSize: "14px" }}>{sym.label}</p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0 0" }}>{sym.desc}</p>
            </div>
            <span style={{
              fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "20px", flexShrink: 0,
              background: symptoms.includes(sym.id) ? "#dcfce7" : "#f1f5f9",
              color: symptoms.includes(sym.id) ? "#15803d" : "#64748b",
            }}>
              {symptoms.includes(sym.id) ? "✓ Yes" : "No"}
            </span>
          </div>
        ))}
      </div>

      {/* Duration */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <p style={{ fontWeight: "700", color: "var(--text-main)", margin: 0 }}>How long have you had this?</p>
          <span style={s.optTag}>Optional</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {DURATIONS.map(d => (
            <button key={d} onClick={() => setDuration(d === duration ? "" : d)} style={{
              padding: "8px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "600", cursor: "pointer",
              border: `2px solid ${duration === d ? "var(--primary)" : "var(--border-color)"}`,
              background: duration === d ? "var(--primary)" : "var(--card-bg)",
              color: duration === d ? "#fff" : "var(--text-main)",
              fontFamily: "'Lexend', sans-serif",
            }}>{d}</button>
          ))}
        </div>
      </div>

      {/* Family History */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <p style={{ fontWeight: "700", color: "var(--text-main)", margin: 0 }}>Family History</p>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={s.optTag}>Optional</span>
            <button onClick={() => {
              if (!recognitionRef.current) return alert("Voice not supported.");
              isRecording ? (recognitionRef.current.stop(), setIsRecording(false)) : (recognitionRef.current.start(), setIsRecording(true));
            }} style={{ ...s.micBtn, background: isRecording ? "#fee2e2" : "#f1f5f9", color: isRecording ? "#dc2626" : "var(--text-muted)" }}>
              {isRecording ? "⏹ Stop" : "🎙 Voice"}
            </button>
          </div>
        </div>
        <textarea
          value={familyHistory}
          onChange={e => setFamilyHistory(e.target.value)}
          placeholder="e.g. Father had skin cancer, no family history of melanoma..."
          style={s.textarea}
          rows={3}
        />
      </div>

      <button onClick={() => setStep(2)} style={s.submitBtn}>
        Next: Upload Image →
      </button>
    </div>
  );
}

const s = {
  backBtn: { background: "none", border: "none", color: "var(--text-muted)", fontWeight: "600", cursor: "pointer", fontSize: "14px", padding: "0 0 20px 0", fontFamily: "'Lexend', sans-serif", display: "block" },
  pageTitle: { fontSize: "28px", fontWeight: "800", color: "var(--text-main)", margin: "0 0 8px 0", letterSpacing: "-0.5px" },
  pageSubtitle: { fontSize: "14px", color: "var(--text-muted)", margin: "0 0 28px 0", lineHeight: 1.6 },
  errorBox: { background: "#fee2e2", color: "#dc2626", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", marginBottom: "20px" },
  optTag: { fontSize: "11px", fontWeight: "600", color: "#6b7280", background: "#f3f4f6", padding: "3px 8px", borderRadius: "8px" },
  micBtn: { fontSize: "11px", fontWeight: "600", padding: "4px 10px", borderRadius: "8px", border: "none", cursor: "pointer", fontFamily: "'Lexend', sans-serif" },
  textarea: { width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-main)", fontSize: "14px", resize: "none", outline: "none", fontFamily: "'Lexend', sans-serif", boxSizing: "border-box" },
  uploadZone: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "2px dashed var(--border-color)", borderRadius: "16px", padding: "48px 24px", cursor: "pointer", marginBottom: "20px", background: "var(--bg-secondary)", textAlign: "center" },
  previewBox: { position: "relative", marginBottom: "20px" },
  removeBtn: { position: "absolute", top: "12px", right: "12px", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontWeight: "600", fontFamily: "'Lexend', sans-serif", fontSize: "12px" },
  guideBox: { background: "var(--bg-secondary)", borderRadius: "12px", padding: "16px", marginBottom: "24px" },
  submitBtn: { width: "100%", padding: "16px", borderRadius: "40px", border: "none", background: "linear-gradient(135deg, #004D40, #00796B)", color: "#fff", fontSize: "16px", fontWeight: "700", cursor: "pointer", fontFamily: "'Lexend', sans-serif" },
  resultCard: { background: "var(--card-bg)", borderRadius: "24px", border: "2px solid", overflow: "hidden", marginBottom: "20px" },
  resultBtn: { width: "100%", padding: "14px", borderRadius: "40px", border: "none", color: "#fff", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "'Lexend', sans-serif" },
  resultBtnOutline: { width: "100%", padding: "14px", borderRadius: "40px", border: "2px solid var(--border-color)", background: "transparent", color: "var(--text-main)", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "'Lexend', sans-serif" },
  tipsCard: { background: "var(--card-bg)", borderRadius: "16px", padding: "20px" },
};
