import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createScan, getPatients, createPatient } from "../services/api";

export default function NewScan() {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [patientId, setPatientId] = useState("");
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [symptoms, setSymptoms] = useState([]);
  const [familyHistory, setFamilyHistory] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  // Quick-add patient form
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPt, setNewPt] = useState({ name:"", age:"", gender:"Male", phone:"", email:"" });
  const [addingPt, setAddingPt] = useState(false);

  // Camera state
  const [cameraMode, setCameraMode] = useState(null);      // null | "dermoscope"
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setNotes((prev) => prev + (prev ? " " : "") + finalTranscript);
        }
      };

      recognitionRef.current.onend = () => {
         setIsRecording(false);
      };
    }
    
    getPatients().then((res) => setPatients(res.data)).catch(() => {});
    
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Attach stream to video element AFTER it renders into the DOM
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => {
        console.warn("Video autoplay failed:", err);
      });
    }
  }, [cameraActive]);

  const startCamera = async (deviceId) => {
    stopCamera();
    setError("");
    try {
      const constraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      setError("Camera access denied or device not found. Check browser permissions.");
    }
  };

  const DERM_KEYWORDS = ["usb", "external", "capture", "derm", "horus", "derml", "video device", "hdmi", "obs", "cam link"];

  const isLikelyDermoscope = (label = "") =>
    DERM_KEYWORDS.some((kw) => label.toLowerCase().includes(kw));

  const handleCameraSelect = async (mode) => {
    setCameraMode(mode);
    setPreview(null);
    setImage(null);
    setError("");

    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach((t) => t.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter((d) => d.kind === "videoinput");

      if (mode === "dermoscope") {
        const dermCam = cams.find((c) => isLikelyDermoscope(c.label));

        if (dermCam) {
          startCamera(dermCam.deviceId);
        } else if (cams.length > 1) {
          const lastCam = cams[cams.length - 1];
          startCamera(lastCam.deviceId);
        } else {
          setError("Only one camera detected. Please connect your USB dermoscope and try again.");
          setCameraMode(null);
        }
      }
    } catch (err) {
      setError("Camera permission denied. Please allow camera access in your browser settings.");
      setCameraMode(null);
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    // Guard: video must be playing and have valid dimensions
    if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
      setError("Camera not ready yet. Please wait a moment and try again.");
      return;
    }
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) {
        setError("Failed to capture frame. Try again or upload a file.");
        return;
      }
      const objectUrl = URL.createObjectURL(blob);
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      setImage(file);
      setPreview(objectUrl);
      stopCamera();
      setCameraMode(null);
    }, "image/jpeg", 0.92);
  };

  const handleImageChange = (e) => {
    stopCamera();
    setCameraMode(null);
    const file = e.target.files[0];
    setImage(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    if (!image || !patientId) {
      setError("Please select a patient and upload or capture an image.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", image);
      formData.append("patient", patientId);
      if (symptoms.length > 0) formData.append("symptoms", JSON.stringify(symptoms));
      if (familyHistory) formData.append("family_history", familyHistory);
      const res = await createScan(formData);
      localStorage.setItem("lastResult", JSON.stringify(res.data));
      navigate("/insights");
    } catch (err) {
      const errData = err.response?.data;
      if (typeof errData === "object") {
        const messages = Object.entries(errData)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
          .join(" | ");
        setError(messages);
      } else {
        setError("Upload failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>New Diagnostic Scan</h1>
        <p style={styles.subtitle}>
          Initialize high-resolution AI analysis. Ensure the capture area is well-lit for maximum dermatological precision.
        </p>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.grid}>
        
        {/* Right: Form (Patient & Clinical Data) */}
        <div style={styles.rightColumn}>
          <div style={styles.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px", borderBottom:"1px solid var(--c-outline-variant)", paddingBottom:"12px" }}>
              <h3 style={{ ...styles.cardTitle, borderBottom:"none", paddingBottom:0, margin:0 }}>Step 1: Patient Selection</h3>
              <button onClick={() => setShowAddPatient(v => !v)} style={{ background: showAddPatient ? "#ef4444" : "var(--c-primary)", color:"#fff", border:"none", padding:"6px 14px", borderRadius:"8px", fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>
                {showAddPatient ? "✕ Cancel" : "+ New Patient"}
              </button>
            </div>

            {/* Quick-add patient inline form */}
            {showAddPatient && (
              <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:"12px", padding:"16px", marginBottom:"16px" }}>
                <p style={{ fontWeight:"700", fontSize:"13px", color:"#15803d", margin:"0 0 12px" }}>➕ Add New Patient Record</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                  {[
                    { key:"name",   label:"Full Name",    type:"text",   required:true },
                    { key:"age",    label:"Age",          type:"number", required:true },
                    { key:"phone",  label:"Phone",        type:"text",   required:false },
                    { key:"email",  label:"Email",        type:"email",  required:false },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize:"11px", fontWeight:"600", color:"var(--text-muted)", display:"block", marginBottom:"4px" }}>
                        {f.label}{f.required && <span style={{ color:"#ef4444" }}> *</span>}
                      </label>
                      <input type={f.type} value={newPt[f.key]} onChange={e => setNewPt(p => ({ ...p, [f.key]: e.target.value }))}
                        style={{ width:"100%", padding:"8px 10px", borderRadius:"8px", border:"1px solid var(--border-color)", background:"#fff", color:"var(--text-main)", fontSize:"13px", outline:"none", boxSizing:"border-box" }} />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize:"11px", fontWeight:"600", color:"var(--text-muted)", display:"block", marginBottom:"4px" }}>Gender</label>
                    <select value={newPt.gender} onChange={e => setNewPt(p => ({ ...p, gender: e.target.value }))}
                      style={{ width:"100%", padding:"8px 10px", borderRadius:"8px", border:"1px solid var(--border-color)", background:"#fff", color:"var(--text-main)", fontSize:"13px", outline:"none" }}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>
                <button disabled={addingPt || !newPt.name || !newPt.age}
                  onClick={async () => {
                    setAddingPt(true);
                    try {
                      const res = await createPatient({ name: newPt.name, age: parseInt(newPt.age), gender: newPt.gender, phone: newPt.phone||"", email: newPt.email||"" });
                      const saved = res.data;
                      setPatients(prev => [...prev, saved]);
                      setPatientId(String(saved.id));
                      setPatientSearch(saved.name);
                      setShowAddPatient(false);
                      setNewPt({ name:"", age:"", gender:"Male", phone:"", email:"" });
                    } catch { setError("Failed to create patient. Please check the details."); }
                    finally { setAddingPt(false); }
                  }}
                  style={{ marginTop:"12px", background:"#16a34a", color:"#fff", border:"none", padding:"9px 20px", borderRadius:"8px", fontWeight:"700", fontSize:"13px", cursor:"pointer", opacity: (addingPt || !newPt.name || !newPt.age) ? 0.6 : 1 }}>
                  {addingPt ? "Saving..." : "💾 Save & Select Patient"}
                </button>
              </div>
            )}

            {/* Search input */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Search & Select Patient</label>
              <input
                type="text"
                value={patientSearch}
                onChange={e => { setPatientSearch(e.target.value); setPatientId(""); }}
                placeholder="Type name to search..."
                style={{ ...styles.input, marginBottom:"8px" }}
              />
              {/* Dropdown list */}
              {(() => {
                const filtered = patients.filter(p =>
                  p.name.toLowerCase().includes(patientSearch.toLowerCase())
                );
                if (patients.length === 0) return (
                  <p style={{ fontSize:"13px", color:"var(--text-muted)", textAlign:"center", padding:"12px 0" }}>
                    No patients found. Use "+ New Patient" to add one.
                  </p>
                );
                return (
                  <div style={{ display:"flex", flexDirection:"column", gap:"6px", maxHeight:"220px", overflowY:"auto" }}>
                    {filtered.length === 0 ? (
                      <p style={{ fontSize:"13px", color:"var(--text-muted)", padding:"8px 0" }}>No match — try a different name.</p>
                    ) : filtered.map(p => (
                      <div key={p.id}
                        onClick={() => { setPatientId(String(p.id)); setPatientSearch(p.name); }}
                        style={{
                          display:"flex", alignItems:"center", gap:"12px", padding:"10px 12px",
                          borderRadius:"10px", cursor:"pointer", transition:"all 0.15s",
                          border: `2px solid ${String(patientId) === String(p.id) ? "var(--primary)" : "var(--border-color)"}`,
                          background: String(patientId) === String(p.id) ? "rgba(0,121,107,0.08)" : "var(--bg-secondary)",
                        }}>
                        <div style={{ width:"36px", height:"36px", borderRadius:"50%", background: String(patientId) === String(p.id) ? "var(--primary)" : "#e8eaf6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"15px", fontWeight:"700", color: String(patientId) === String(p.id) ? "#fff" : "var(--primary)", flexShrink:0 }}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:"14px", fontWeight:"700", color:"var(--text-main)", margin:0 }}>{p.name}</p>
                          <p style={{ fontSize:"11px", color:"var(--text-muted)", margin:"2px 0 0" }}>Age {p.age} · {p.gender}{p.blood_group ? ` · ${p.blood_group}` : ""}</p>
                        </div>
                        {String(patientId) === String(p.id) && (
                          <span style={{ fontSize:"18px", color:"var(--primary)" }}>✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          <div style={{ ...styles.card, opacity: patientId ? 1 : 0.5, pointerEvents: patientId ? 'auto' : 'none' }}>
            <h3 style={styles.cardTitle}>Step 2: Clinical Observations</h3>

            <div style={styles.inputGroup}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <label style={styles.label}>Clinical Symptom Checklist</label>
                <span style={styles.optionalInline}>— check all that apply</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { id: "Itching",       label: "Pruritus (Itching)",        desc: "Patient reports itching at or around the lesion" },
                  { id: "Bleeding",      label: "Haemorrhage (Bleeding)",     desc: "Active or recent bleeding from the lesion site" },
                  { id: "Pain",          label: "Pain / Tenderness",          desc: "Localised pain or tenderness on palpation" },
                  { id: "Rapid growth",  label: "Rapid Lesion Growth",        desc: "Noticeable increase in size over days or weeks" },
                  { id: "Change in color",label:"Dyschromia (Colour Change)", desc: "Irregular or changing pigmentation of the lesion" },
                  { id: "Others",        label: "Others / Not Listed",        desc: "Any other symptom not listed above" },
                ].map(sym => (
                  <div key={sym.id} onClick={() => setSymptoms(prev => prev.includes(sym.id) ? prev.filter(s => s !== sym.id) : [...prev, sym.id])}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px",
                      borderRadius: "10px", border: `2px solid ${symptoms.includes(sym.id) ? "var(--primary)" : "var(--border-color)"}`,
                      background: symptoms.includes(sym.id) ? "rgba(0,121,107,0.08)" : "var(--bg-secondary)",
                      cursor: "pointer", transition: "all 0.15s",
                    }}>
                    <div style={{
                      width: "20px", height: "20px", borderRadius: "6px", flexShrink: 0,
                      background: symptoms.includes(sym.id) ? "var(--primary)" : "transparent",
                      border: `2px solid ${symptoms.includes(sym.id) ? "var(--primary)" : "var(--border-color)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {symptoms.includes(sym.id) && <span style={{ color: "#fff", fontSize: "12px", fontWeight: "800", lineHeight: 1 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>{sym.label}</p>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0 0" }}>{sym.desc}</p>
                    </div>
                    <span style={{
                      fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "20px", flexShrink: 0,
                      background: symptoms.includes(sym.id) ? "#dcfce7" : "#f1f5f9",
                      color: symptoms.includes(sym.id) ? "#15803d" : "#64748b",
                    }}>
                      {symptoms.includes(sym.id) ? "✓ Observed" : "Not Observed"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...styles.inputGroup, marginTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <label style={styles.label}>Family History — Dermatological</label>
                <span style={styles.optionalInline}>( optional )</span>
              </div>
              <textarea
                style={styles.textarea}
                placeholder="e.g. Melanoma in first-degree relatives, squamous cell carcinoma..."
                value={familyHistory}
                onChange={(e) => setFamilyHistory(e.target.value)}
              />
            </div>
          </div>

        </div>

        {/* Left: Preview + Camera */}
        <div style={{ ...styles.leftColumn, opacity: patientId ? 1 : 0.4, pointerEvents: patientId ? 'auto' : 'none' }}>
          
          {/* Camera Source Selector */}
          {!cameraActive && !preview && (
            <div style={styles.cameraSourceCard}>
              <h3 style={styles.cardTitle}>Step 3: Upload Image & Analyze</h3>
              <p style={styles.cameraSubtitle}>Capture using USB Dermoscope or upload a high-res image.</p>
              <div style={styles.cameraSourceGrid}>
                <label style={{ ...styles.cameraSourceBtn, position: "relative" }}>
                  <span style={styles.cameraSourceIcon}>📁</span>
                  <span style={styles.cameraSourceLabel}>Upload File</span>
                  <span style={styles.cameraSourceHint}>From your device</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ opacity: 0, position: "absolute", inset: 0, cursor: "pointer" }} />
                </label>
                <button style={styles.cameraSourceBtn} onClick={() => handleCameraSelect("dermoscope")}>
                  <span style={styles.cameraSourceIcon}>🔬</span>
                  <span style={styles.cameraSourceLabel}>Dermoscope</span>
                  <span style={styles.cameraSourceHint}>USB dermatoscope</span>
                </button>
              </div>
            </div>
          )}

          {/* Live Camera Feed */}
          {cameraActive && (
            <div style={styles.previewContainer}>
              <video ref={videoRef} style={styles.video} autoPlay playsInline muted />
              <canvas ref={canvasRef} style={{ display: "none" }} />
              <div style={styles.liveIndicator}>
                <span style={styles.dot}></span>
                DERMOSCOPE LIVE
              </div>
              <div style={styles.cameraControls}>
                <button style={styles.captureBtn} onClick={captureFrame}>⊙ Capture</button>
                <button style={styles.cancelCamBtn} onClick={() => { stopCamera(); setCameraMode(null); }}>✕ Cancel</button>
              </div>
            </div>
          )}

          {/* Captured / Uploaded Preview */}
          {!cameraActive && preview && (
            <div style={styles.previewContainer}>
              <img src={preview} alt="Preview" style={styles.previewImage} />
              <div
                onClick={() => { setPreview(null); setImage(null); }}
                style={{ cursor: "pointer", ...styles.liveIndicator, backgroundColor: "rgba(239,68,68,0.8)" }}
              >
                ✕ Remove
              </div>
            </div>
          )}
          
          <button
            onClick={handleUpload}
            style={{ ...styles.submitBtn, opacity: (loading || !image || !patientId) ? 0.6 : 1, marginTop: "16px" }}
            disabled={loading || !image || !patientId}
          >
            {loading ? "Running Multimodal AI Analysis..." : "Submit to Multimodal AI"}
          </button>
        </div>


      </div>
    </div>
  );
}

const styles = {
  container: { paddingTop: "40px" },
  header: { marginBottom: "32px" },
  title: { fontSize: "28px", fontWeight: "700", color: "var(--text-main)", marginBottom: "8px", letterSpacing: "-0.5px" },
  subtitle: { fontSize: "15px", color: "var(--text-muted)", maxWidth: "600px", lineHeight: "1.5" },
  error: { background: "var(--danger-light)", color: "var(--danger)", padding: "12px 16px", borderRadius: "8px", fontSize: "14px", marginBottom: "24px" },
  grid: { display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "32px", alignItems: "start" },
  leftColumn: { display: "flex", flexDirection: "column", gap: "16px" },

  cameraSourceCard: { background: "var(--card-bg)", borderRadius: "16px", padding: "24px", boxShadow: "var(--shadow-sm)" },
  cardTitle: { fontSize: "16px", fontWeight: "600", color: "var(--text-main)", marginBottom: "16px" },
  optionalBadge: { fontSize: "11px", fontWeight: "600", color: "#6b7280", background: "#f3f4f6", padding: "3px 8px", borderRadius: "8px", letterSpacing: "0.3px" },
  optionalInline: { fontSize: "12px", fontWeight: "500", color: "#9ca3af", fontStyle: "italic" },
  cameraSubtitle: { fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" },
  cameraSourceGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" },
  cameraSourceBtn: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
    padding: "20px 12px", borderRadius: "12px", border: "2px solid var(--border-color)",
    background: "var(--bg-secondary)", cursor: "pointer", transition: "all 0.2s",
  },
  cameraSourceIcon: { fontSize: "32px" },
  cameraSourceLabel: { fontSize: "14px", fontWeight: "700", color: "var(--text-main)" },
  cameraSourceHint: { fontSize: "11px", color: "var(--text-muted)", fontWeight: "500" },

  devicePickerRow: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  devicePickerLabel: { fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", whiteSpace: "nowrap" },
  devicePickerSelect: { flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", color: "var(--text-main)", fontSize: "13px", outline: "none" },

  previewContainer: { width: "100%", aspectRatio: "16/10", backgroundColor: "#1e293b", borderRadius: "16px", position: "relative", overflow: "hidden", boxShadow: "var(--shadow)" },
  video: { width: "100%", height: "100%", objectFit: "cover" },
  previewImage: { width: "100%", height: "100%", objectFit: "cover" },
  liveIndicator: {
    position: "absolute", top: "16px", left: "16px",
    backgroundColor: "rgba(255,255,255,0.85)", padding: "6px 12px",
    borderRadius: "20px", fontSize: "12px", fontWeight: "600", color: "#334155",
    display: "flex", alignItems: "center", gap: "6px",
  },
  dot: { width: "8px", height: "8px", backgroundColor: "var(--danger)", borderRadius: "50%", boxShadow: "0 0 8px var(--danger)" },
  cameraControls: {
    position: "absolute", bottom: "16px", left: "50%", transform: "translateX(-50%)",
    display: "flex", gap: "12px",
  },
  captureBtn: {
    backgroundColor: "var(--primary)", color: "#fff", border: "none",
    borderRadius: "24px", padding: "10px 28px", fontSize: "15px", fontWeight: "700", cursor: "pointer",
    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
  },
  cancelCamBtn: {
    backgroundColor: "rgba(239,68,68,0.85)", color: "#fff", border: "none",
    borderRadius: "24px", padding: "10px 20px", fontSize: "14px", fontWeight: "600", cursor: "pointer",
  },

  uploadActions: { display: "flex", gap: "16px" },
  uploadBtnOutline: {
    flex: 1, backgroundColor: "var(--card-bg)", color: "var(--text-main)", textAlign: "center",
    padding: "14px", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer",
    border: "1px solid var(--border-color)",
  },

  rightColumn: { display: "flex", flexDirection: "column", gap: "24px" },
  card: { background: "var(--card-bg)", borderRadius: "16px", padding: "24px", boxShadow: "var(--shadow-sm)" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "600", color: "var(--text-main)" },
  input: { padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", color: "var(--text-main)", fontSize: "14px", outline: "none" },
  textarea: { width: "100%", minHeight: "80px", padding: "12px", borderRadius: "10px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", color: "var(--text-main)", fontSize: "14px", outline: "none", resize: "vertical" },
  submitBtn: { width: "100%", padding: "16px 0", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", fontSize: "16px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 14px rgba(16,185,129,0.3)" },
  symptomGrid: { display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" },
  symptomPill: { padding: "8px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s", border: "1px solid var(--border-color)" },
};