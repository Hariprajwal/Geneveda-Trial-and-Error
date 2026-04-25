import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getPatients } from "../../services/api";
import { useLang } from "../../context/LanguageContext";
import tr from "../../i18n/translations";

const SYMPTOMS = [
  "Itching", "Burning sensation", "Pain", "Bleeding", "Color change",
  "Size increase", "Rough texture", "Discharge", "Swelling", "Ulceration"
];
const DURATIONS = ["< 1 week", "1–2 weeks", "2–4 weeks", "1–3 months", "3–6 months", "> 6 months"];
const FAMILY_HISTORY_OPTIONS = [
  "Melanoma", "Basal Cell Carcinoma", "Skin Cancer (Other)", "None"
];

export default function NurseInput() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const tx = tr[lang].patient; // Reuse patient translations for symptoms/duration
  const [patients, setPatients]       = useState([]);
  const [patientId, setPatientId]     = useState(localStorage.getItem("scan_patient") || "");
  const [selected, setSelected]       = useState([]);
  const [duration, setDuration]       = useState("");
  const [familyHistorySelected, setFamilyHistorySelected] = useState([]);
  const [freeText, setFreeText]       = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    getPatients().then(r => setPatients(r.data)).catch(() => {});
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = true; rec.interimResults = true;
      rec.lang = lang === "kn" ? "kn-IN" : "en-US";
      rec.onresult = e => {
        let t = "";
        for (let i = e.resultIndex; i < e.results.length; i++)
          if (e.results[i].isFinal) t += e.results[i][0].transcript + " ";
        if (t) setFreeText(p => p + t);
      };
      rec.onend = () => setIsRecording(false);
      recognitionRef.current = rec;
    }
  }, [lang]);

  const toggleSymptom = s => setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleFamilyHistory = f => setFamilyHistorySelected(prev => {
    if (f === "None") return ["None"];
    const withoutNone = prev.filter(x => x !== "None");
    return withoutNone.includes(f) ? withoutNone.filter(x => x !== f) : [...withoutNone, f];
  });

  const handleNext = () => {
    if (!patientId) return alert("Please select a patient.");
    const notes = [
      selected.length ? `Symptoms: ${selected.join(", ")}` : "",
      duration        ? `Duration: ${duration}` : "",
      familyHistorySelected.length ? `Family History: ${familyHistorySelected.join(", ")}` : "",
      freeText.trim() ? `Notes: ${freeText.trim()}` : ""
    ].filter(Boolean).join(". ");
    
    localStorage.setItem("scan_patient", patientId);
    localStorage.setItem("scan_notes", notes);
    
    // Save raw symptoms and family history for the AI Engine
    localStorage.setItem("scan_symptoms_raw", JSON.stringify(selected));
    localStorage.setItem("scan_family_history_raw", familyHistorySelected.join(", "));
    
    navigate("/nurse/scan");
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) return alert("Speech not supported in this browser.");
    if (isRecording) { recognitionRef.current.stop(); setIsRecording(false); }
    else             { recognitionRef.current.start(); setIsRecording(true); }
  };

  return (
    <div className="pt-8 px-6 md:px-10 pb-12 max-w-3xl mx-auto w-full flex flex-col gap-7 fade-in">
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-on-surface-variant hover:text-primary text-sm font-semibold mb-4 transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span> Back
        </button>
        <p className="text-on-surface-variant text-sm tracking-widest uppercase mb-1">Step 2 of 3</p>
        <h2 className="font-headline text-3xl font-bold text-on-surface">Clinical Symptoms</h2>
        <p className="text-on-surface-variant text-base mt-1">Select observed symptoms and add any extra notes.</p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2">
        {[1,2,3].map(n => (
          <div key={n} className={`h-1.5 flex-1 rounded-full transition-all ${n <= 2 ? "bg-primary" : "bg-surface-variant"}`} />
        ))}
      </div>

      {/* Patient */}
      <div className="bg-surface-container-lowest rounded-[1.5rem] p-6">
        <label className="block text-sm font-semibold text-on-surface-variant mb-2">Select Patient</label>
        <select value={patientId} onChange={e => setPatientId(e.target.value)}
          className="w-full p-3 rounded-xl border border-surface-variant bg-surface-container-low text-on-surface text-base focus:outline-none focus:border-primary">
          <option value="">-- Choose patient --</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.name} (Age: {p.age})</option>)}
        </select>
      </div>

      {/* Symptoms chips */}
      <div className="bg-surface-container-lowest rounded-[1.5rem] p-6">
        <h3 className="font-headline text-base font-semibold text-on-surface mb-4">Observed Symptoms</h3>
        <div className="flex flex-wrap gap-2.5">
          {SYMPTOMS.map(s => (
            <button key={s} onClick={() => toggleSymptom(s)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                selected.includes(s)
                  ? "bg-primary border-primary text-white shadow-md"
                  : "border-surface-variant text-on-surface-variant hover:border-primary hover:text-primary bg-surface-container-low"
              }`}>{tx.symptoms[s] || s}</button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="bg-surface-container-lowest rounded-[1.5rem] p-6">
        <h3 className="font-headline text-base font-semibold text-on-surface mb-4">Symptom Duration</h3>
        <div className="grid grid-cols-3 gap-3">
          {DURATIONS.map(d => (
            <button key={d} onClick={() => setDuration(d)}
              className={`py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                duration === d
                  ? "bg-primary border-primary text-white"
                  : "border-surface-variant text-on-surface-variant hover:border-primary hover:text-primary bg-surface-container-low"
              }`}>{tx.duration[d] || d}</button>
          ))}
        </div>
      </div>

      {/* Family History */}
      <div className="bg-surface-container-lowest rounded-[1.5rem] p-6">
        <h3 className="font-headline text-base font-semibold text-on-surface mb-4">Family History (Dermatological)</h3>
        <div className="flex flex-wrap gap-2.5">
          {FAMILY_HISTORY_OPTIONS.map(f => (
            <button key={f} onClick={() => toggleFamilyHistory(f)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                familyHistorySelected.includes(f)
                  ? "bg-primary border-primary text-white shadow-md"
                  : "border-surface-variant text-on-surface-variant hover:border-primary hover:text-primary bg-surface-container-low"
              }`}>{tx.familyHistory[f] || f}</button>
          ))}
        </div>
      </div>

      {/* Free text + Voice */}
      <div className="bg-surface-container-lowest rounded-[1.5rem] p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className="font-headline text-base font-semibold text-on-surface">Additional Notes</h3>
            <span className="text-xs text-on-surface-variant italic font-normal">( optional )</span>
            <div className="flex bg-surface-container-low rounded-lg p-1">
                <span className="px-3 py-1 text-[10px] font-bold text-primary">{lang === "kn" ? "ಕನ್ನಡ" : "EN"} Voice Active</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant italic">( optional )</span>
            <button onClick={toggleVoice}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                isRecording ? "bg-error-container text-error animate-pulse" : "bg-surface-container-low text-on-surface-variant hover:text-primary"
              }`}>
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings:"'FILL' 1" }}>
                {isRecording ? "stop_circle" : "mic"}
              </span>
              {isRecording ? "Recording..." : "Voice Input"}
            </button>
          </div>
        </div>
        <textarea rows={4} value={freeText} onChange={e => setFreeText(e.target.value)}
          placeholder="Describe patient history, observations, or special notes..."
          className="w-full p-4 rounded-xl border border-surface-variant bg-surface-container-low text-on-surface text-base focus:outline-none focus:border-primary resize-none" />
      </div>

      <button onClick={handleNext}
        className="w-full bg-primary text-white font-headline font-semibold py-4 rounded-full text-base shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2">
        Scan Image <span className="material-symbols-outlined">camera_alt</span>
      </button>
    </div>
  );
}
