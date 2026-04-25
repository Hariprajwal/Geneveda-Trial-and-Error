import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPatient } from "../services/api";

const SYMPTOMS_LIST = [
  "Itching or pain in the lesion",
  "Bleeding or oozing",
  "Rapid change in size or color",
  "Irregular borders appearing",
  "Family history of skin cancer",
  "History of severe sunburns",
  "New mole after age 30"
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function EHRProfileForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    phone: "",
    email: "",
    blood_group: "A+",
    family_history: ""
  });
  
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);

  const handleSymptomToggle = (symptom) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...form,
        age: parseInt(form.age, 10),
        symptoms: selectedSymptoms
      };
      
      await createPatient(payload);
      // Navigate based on role - assuming generic dashboard or new scan for now
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Failed to create EHR profile. Please check the details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <header style={s.header}>
        <h1 style={s.title}>Create EHR Profile</h1>
        <p style={s.subtitle}>Initialize a secure, blockchain-backed Electronic Health Record.</p>
      </header>

      {error && <div style={s.error}>{error}</div>}

      <form onSubmit={handleSubmit} style={s.formGrid}>
        
        {/* Left Column: Basic Details */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>Basic Details</h3>
          
          <div style={s.inputGroup}>
            <label style={s.label}>Full Name</label>
            <input required style={s.input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Patient Name" />
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ ...s.inputGroup, flex: 1 }}>
              <label style={s.label}>Age</label>
              <input required type="number" style={s.input} value={form.age} onChange={e => setForm({...form, age: e.target.value})} placeholder="e.g. 45" />
            </div>
            <div style={{ ...s.inputGroup, flex: 1 }}>
              <label style={s.label}>Gender</label>
              <select style={s.input} value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ ...s.inputGroup, flex: 1 }}>
              <label style={s.label}>Blood Group</label>
              <select style={s.input} value={form.blood_group} onChange={e => setForm({...form, blood_group: e.target.value})}>
                {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div style={{ ...s.inputGroup, flex: 1 }}>
              <label style={s.label}>Phone Number</label>
              <input required style={s.input} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+1 234 567 8900" />
            </div>
          </div>
        </div>

        {/* Right Column: EHR Specifics */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>Clinical Baseline</h3>

          <div style={s.inputGroup}>
            <label style={s.label}>Symptom Checklist (Select all that apply)</label>
            <div style={s.symptomGrid}>
              {SYMPTOMS_LIST.map(sym => (
                <label key={sym} style={{ ...s.symptomPill, background: selectedSymptoms.includes(sym) ? "var(--primary)" : "var(--c-surface-container-low)", color: selectedSymptoms.includes(sym) ? "#fff" : "var(--c-on-surface)", border: `1px solid ${selectedSymptoms.includes(sym) ? "var(--primary)" : "var(--c-outline-variant)"}` }}>
                  <input 
                    type="checkbox" 
                    checked={selectedSymptoms.includes(sym)}
                    onChange={() => handleSymptomToggle(sym)}
                    style={{ display: "none" }}
                  />
                  {sym}
                </label>
              ))}
            </div>
          </div>

          <div style={s.inputGroup}>
            <label style={s.label}>Family Medical History (Dermatological)</label>
            <textarea 
              style={s.textarea} 
              value={form.family_history} 
              onChange={e => setForm({...form, family_history: e.target.value})}
              placeholder="E.g., Mother diagnosed with melanoma at age 50."
            />
          </div>

          <button type="submit" disabled={loading} style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Securing EHR Record..." : "Create Blockchain-Secured EHR"}
          </button>
        </div>

      </form>
    </div>
  );
}

const s = {
  container: { padding: "40px 60px", maxWidth: "1200px", margin: "0 auto", fontFamily: "'Lexend', sans-serif" },
  header: { marginBottom: "32px" },
  title: { fontSize: "28px", fontWeight: "800", color: "var(--c-on-background)", marginBottom: "8px" },
  subtitle: { fontSize: "15px", color: "var(--c-on-surface-variant)" },
  error: { background: "var(--c-error-container)", color: "var(--c-on-error-container)", padding: "12px", borderRadius: "8px", marginBottom: "20px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" },
  card: { background: "var(--c-surface)", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "20px" },
  cardTitle: { fontSize: "18px", fontWeight: "700", color: "var(--c-on-surface)", borderBottom: "1px solid var(--c-outline-variant)", paddingBottom: "12px", margin: 0 },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "13px", fontWeight: "600", color: "var(--c-on-surface-variant)" },
  input: { padding: "12px", borderRadius: "8px", border: "2px solid var(--c-outline-variant)", background: "var(--c-surface-container-low)", color: "var(--c-on-surface)", fontSize: "14px", outline: "none", fontFamily: "'Lexend', sans-serif" },
  textarea: { padding: "12px", borderRadius: "8px", border: "2px solid var(--c-outline-variant)", background: "var(--c-surface-container-low)", color: "var(--c-on-surface)", fontSize: "14px", outline: "none", minHeight: "100px", resize: "vertical", fontFamily: "'Lexend', sans-serif" },
  symptomGrid: { display: "flex", flexWrap: "wrap", gap: "8px" },
  symptomPill: { padding: "8px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" },
  submitBtn: { marginTop: "auto", padding: "16px", background: "linear-gradient(135deg, #00796B, #26A69A)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "700", cursor: "pointer", transition: "opacity 0.2s", fontFamily: "'Lexend', sans-serif", boxShadow: "0 4px 20px rgba(0,121,107,0.35)" }
};
