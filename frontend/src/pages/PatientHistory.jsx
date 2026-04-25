import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getScans, getPatients, reviewScan, createPrescription, getPrescriptions } from "../services/api";

export default function PatientHistory() {
  const { patientId } = useParams();
  const [scans, setScans] = useState([]);
  const [patientData, setPatientData] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Review Form state
  const [reviewForm, setReviewForm] = useState({ doctor_notes: "", doctor_validated_disease: "" });
  const [prescriptionText, setPrescriptionText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const fetchData = async () => {
     try {
        const [scansRes, patientsRes, prescriptionsRes] = await Promise.all([
           getScans({ patient: patientId }),
           getPatients(),
           getPrescriptions({ patient: patientId })
        ]);
        setScans(scansRes.data);
        setPrescriptions(prescriptionsRes.data);
        
        const currentPatient = patientsRes.data.find(p => p.id === parseInt(patientId));
        if (currentPatient) setPatientData(currentPatient);
     } catch (err) {
        setError("Failed to load patient data.");
     } finally {
        setLoading(false);
     }
  }

  const handleReview = async (scanId) => {
     setSubmitting(true);
     try {
        await reviewScan(scanId, reviewForm);
        setSuccess("Scan reviewed and clinical notes saved.");
        fetchData();
     } catch (err) {
        setError("Failed to save review.");
     } finally {
        setSubmitting(false);
     }
  };

  const handleAddPrescription = async () => {
     if (!prescriptionText.trim()) return;
     setSubmitting(true);
     try {
        await createPrescription({ patient: patientId, text: prescriptionText });
        setSuccess("Prescription added successfully.");
        setPrescriptionText("");
        fetchData();
     } catch (err) {
        setError("Failed to add prescription.");
     } finally {
        setSubmitting(false);
     }
  };

  if (loading) return <div style={styles.container}><p style={styles.empty}>Loading history...</p></div>;

  const latestScan = scans[0];

  return (
    <div style={styles.container}>
      {/* Top Patient Header */}
      <header style={styles.header}>
         <div>
            <div style={styles.idBadge}>
               PATIENT ID: GV-{patientId.padStart(4, '0')} <span style={styles.priorityPill}>HIGH PRIORITY</span>
            </div>
            <h1 style={styles.title}>{patientData ? patientData.name : "Unknown Patient"}</h1>
            <p style={styles.subtitle}>
               🗓 Last Assessment: {scans.length > 0 ? new Date(scans[0].created_at).toLocaleDateString() : "None"} 
               &nbsp;•&nbsp; {patientData ? patientData.age : "--"} years 
               &nbsp;•&nbsp; {patientData ? patientData.gender : "--"}
            </p>
         </div>
         <div style={styles.velocityCard}>
            <div style={styles.velocityIcon}>↗</div>
            <div>
               <p style={styles.velocityLabel}>RISK VELOCITY</p>
               <p style={styles.velocityValue}>+12.4% <span style={styles.velocitySub}>vs Prev</span></p>
            </div>
         </div>
      </header>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <div style={styles.grid}>
         {/* Left Column: Timeline */}
         <div style={styles.leftColumn}>
            <div style={styles.timelineHeader}>
               <h3 style={styles.sectionTitle}>Scan History</h3>
               <span style={styles.countBadge}>{scans.length} Entries</span>
            </div>
            
            {scans.length === 0 ? (
               <p style={styles.empty}>No scans found for this patient.</p>
            ) : (
               <div style={styles.timeline}>
                  {scans.map((scan, index) => (
                     <div key={scan.id} style={styles.timelineItem}>
                        <div style={styles.timelineConnector}>
                           <div style={index === 0 ? styles.timelineDotActive : styles.timelineDot}>
                              {index === 0 && <div style={styles.innerDot}></div>}
                           </div>
                           {index !== scans.length - 1 && <div style={styles.timelineLine}></div>}
                        </div>
                        
                        <div style={styles.scanCard}>
                           <div style={styles.scanCardImage}>
                              {scan.image ? (
                                 <img src={scan.image} alt="Scan" style={styles.img} />
                              ) : (
                                 <div style={styles.imgPlaceholder}>No Image</div>
                              )}
                           </div>
                           <div style={styles.scanCardContent}>
                              <div style={styles.scanCardHeader}>
                                 <p style={styles.scanDate}>
                                    {new Date(scan.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
                                 </p>
                                 <div style={styles.scanScoreBox}>
                                    <span style={styles.scoreLabel}>RISK SCORE</span>
                                    <span style={{
                                       ...styles.scoreValue,
                                       color: (scan.risk_score || 0) >= 67 ? "#EF5350"
                                            : (scan.risk_score || 0) >= 44 ? "#FFA726"
                                            : "#66BB6A"
                                    }}>
                                       {(scan.risk_score ?? scan.confidence ?? 0).toFixed(1)}%
                                    </span>
                                 </div>
                              </div>
                              <h4 style={styles.scanTitle}>{scan.predicted_disease}</h4>
                              {scan.is_reviewed && (
                                <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'12px'}}>
                                    <span className="material-symbols-outlined" style={{ color:'#10b981', fontSize:'18px'}}>check_circle</span>
                                    <span style={{ fontSize:'12px', fontWeight:'700', color:'#10b981' }}>REVIEWED: {scan.doctor_validated_disease}</span>
                                </div>
                              )}
                              <p style={styles.scanDesc}>
                                 {scan.doctor_notes || "AI assessment. Waiting for clinical review."}
                              </p>
                              
                              <div style={styles.scanActions}>
                                 <Link to="/insights" style={styles.viewBtn}>View Analysis</Link>
                                 <div style={styles.hashTag}>HASH: {scan.scan_hash?.substring(0,12)}...</div>
                              </div>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>

         {/* Right Column: Actions & Details */}
         <div style={styles.rightColumn}>
            {/* Review Section */}
            {latestScan && !latestScan.is_reviewed && (
                <div style={styles.actionCard}>
                    <h3 style={styles.cardTitle}>Clinical Review</h3>
                    <p style={styles.ehrText}>Add your findings to finalize this case.</p>
                    <div style={{ marginTop:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
                        <select 
                            style={styles.input} 
                            value={reviewForm.doctor_validated_disease}
                            onChange={e => setReviewForm({...reviewForm, doctor_validated_disease: e.target.value})}
                        >
                            <option value="">Confirm Diagnosis</option>
                            <option value={latestScan.predicted_disease}>Validate: {latestScan.predicted_disease}</option>
                            <option value="Melanoma">Override: Melanoma</option>
                            <option value="Basal Cell Carcinoma">Override: BCC</option>
                            <option value="Benign Nevus">Override: Benign</option>
                        </select>
                        <textarea 
                            style={styles.textarea} 
                            placeholder="Add clinical notes..." 
                            value={reviewForm.doctor_notes}
                            onChange={e => setReviewForm({...reviewForm, doctor_notes: e.target.value})}
                        />
                        <button 
                            style={styles.submitBtn} 
                            onClick={() => handleReview(latestScan.id)}
                            disabled={submitting}
                        >
                            {submitting ? "Saving..." : "Finalize Review"}
                        </button>
                    </div>
                </div>
            )}

            {/* Prescription Section */}
            <div style={styles.ehrCard}>
               <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
                   <h3 style={styles.cardTitle}>Prescriptions</h3>
                   <span style={styles.countBadge}>{prescriptions.length}</span>
               </div>
               <div style={{ display:'flex', flexDirection:'column', gap:'12px', maxHeight:'200px', overflowY:'auto', marginBottom:'16px' }}>
                    {prescriptions.map(p => (
                        <div key={p.id} style={styles.prescriptionItem}>
                            <p style={{ margin:0, fontSize:'13px', fontWeight:'500'}}>{p.text}</p>
                            <p style={{ margin:0, fontSize:'10px', color:'var(--text-muted)'}}>{new Date(p.created_at).toLocaleDateString()}</p>
                        </div>
                    ))}
                    {prescriptions.length === 0 && <p style={styles.empty}>No prescriptions issued.</p>}
               </div>
               <textarea 
                    style={styles.textareaSmall} 
                    placeholder="Type prescription..." 
                    value={prescriptionText}
                    onChange={e => setPrescriptionText(e.target.value)}
                />
               <button 
                    style={styles.secondaryBtn} 
                    onClick={handleAddPrescription}
                    disabled={submitting}
                >
                    Add Prescription
               </button>
            </div>

            <div style={styles.ehrCard}>
               <h3 style={styles.cardTitle}>EHR Profile</h3>
               <div style={styles.ehrSection}>
                  <p style={styles.ehrLabel}>Symptoms</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                     {(patientData?.symptoms && patientData.symptoms.length > 0) ? (
                        patientData.symptoms.map((sym, i) => (
                           <span key={i} style={styles.symptomTag}>{sym}</span>
                        ))
                     ) : (
                        <span style={styles.empty}>No symptoms reported.</span>
                     )}
                  </div>
               </div>
               <div style={styles.ehrSection}>
                  <p style={styles.ehrLabel}>Family History</p>
                  <p style={styles.ehrText}>{patientData?.family_history || "None reported."}</p>
               </div>
            </div>

            <div style={styles.blockchainCard}>
               <div style={styles.blockchainHeader}>
                  <span className="material-symbols-outlined" style={styles.shieldIcon}>verified_user</span>
                  <h3 style={styles.cardTitle}>Blockchain Integrity</h3>
               </div>
               <p style={styles.blockchainText}>Cryptographically secured EHR.</p>
               <div style={styles.hashBox}>
                  {patientData?.ehr_hash || "Generating..."}
               </div>
               <p style={styles.hashLabel}>PATIENT IMMUTABLE HASH</p>
            </div>
         </div>
      </div>
    </div>
  );
}

const styles = {
  container: { paddingTop: "40px", maxWidth: "1200px", margin: "0 auto", paddingBottom: "60px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" },
  idBadge: { display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", fontWeight: "600", color: "var(--primary)", letterSpacing: "1px", marginBottom: "8px" },
  priorityPill: { backgroundColor: "#fecaca", color: "#dc2626", padding: "4px 10px", borderRadius: "12px", fontSize: "10px", fontWeight: "700" },
  title: { fontSize: "32px", fontWeight: "800", color: "var(--text-main)", marginBottom: "8px", letterSpacing: "-0.5px" },
  subtitle: { fontSize: "14px", color: "var(--text-muted)", fontWeight: "500" },
  velocityCard: { display: "flex", alignItems: "center", gap: "12px", backgroundColor: "var(--card-bg)", padding: "16px 24px", borderRadius: "32px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-color)" },
  velocityIcon: { width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "var(--danger-light)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "bold" },
  velocityLabel: { fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.5px" },
  velocityValue: { fontSize: "18px", fontWeight: "700", color: "var(--text-main)", margin: 0 },
  velocitySub: { fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" },
  error: { background: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: "12px", marginBottom: "24px", fontSize: "14px" },
  success: { background: "#dcfce7", color: "#15803d", padding: "12px 16px", borderRadius: "12px", marginBottom: "24px", fontSize: "14px" },
  empty: { color: "var(--text-muted)", fontSize: "14px", textAlign: "center", padding: "40px 0" },
  grid: { display: "grid", gridTemplateColumns: "1fr 360px", gap: "32px" },
  leftColumn: { display: "flex", flexDirection: "column" },
  rightColumn: { display: "flex", flexDirection: "column", gap: "24px" },
  timelineHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" },
  sectionTitle: { fontSize: "20px", fontWeight: "700", color: "var(--text-main)", margin: 0 },
  countBadge: { background: "var(--primary-light)", color: "var(--primary)", fontSize: "12px", fontWeight: "700", padding: "4px 10px", borderRadius: "12px" },
  timeline: { display: "flex", flexDirection: "column" },
  timelineItem: { display: "flex", gap: "24px", position: "relative" },
  timelineConnector: { display: "flex", flexDirection: "column", alignItems: "center", width: "24px" },
  timelineDot: { width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "var(--border-color)", marginTop: "40px" },
  timelineDotActive: { width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "var(--card-bg)", border: "2px solid var(--primary)", marginTop: "36px", display: "flex", alignItems: "center", justifyContent: "center" },
  innerDot: { width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--primary)" },
  timelineLine: { width: "2px", flex: 1, backgroundColor: "var(--border-color)", margin: "8px 0" },
  scanCard: { flex: 1, display: "flex", gap: "24px", background: "var(--card-bg)", borderRadius: "24px", padding: "24px", border: "1px solid var(--border-color)", marginBottom: "24px", transition: "all 0.2s" },
  scanCardImage: { width: "200px", height: "140px", borderRadius: "16px", overflow: "hidden", background: "#f1f5f9" },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  imgPlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "12px" },
  scanCardContent: { flex: 1, display: "flex", flexDirection: "column" },
  scanCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" },
  scanDate: { fontSize: "11px", fontWeight: "800", color: "var(--primary)", letterSpacing: "1px", margin: 0 },
  scanScoreBox: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
  scoreLabel: { fontSize: "9px", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.5px" },
  scoreValue: { fontSize: "20px", fontWeight: "800", margin: "-2px 0 0 0" },
  scanTitle: { fontSize: "18px", fontWeight: "700", color: "var(--text-main)", marginBottom: "12px" },
  scanDesc: { fontSize: "14px", color: "var(--text-muted)", lineHeight: "1.6", marginBottom: "16px" },
  scanActions: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" },
  viewBtn: { background: "var(--surface-variant)", color: "var(--text-main)", padding: "8px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: "700", textDecoration: "none" },
  hashTag: { fontSize: "10px", color: "var(--text-muted)", fontFamily: "monospace" },
  actionCard: { background: "var(--primary-light)", borderRadius: "24px", padding: "24px", border: "1px solid var(--primary)", boxShadow: "var(--shadow-sm)" },
  ehrCard: { background: "var(--card-bg)", borderRadius: "24px", padding: "24px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" },
  cardTitle: { fontSize: "16px", fontWeight: "800", color: "var(--text-main)", margin: 0 },
  input: { width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid var(--primary)", background: "#fff", fontSize: "14px", outline: "none" },
  textarea: { width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid var(--primary)", background: "#fff", fontSize: "14px", minHeight: "100px", resize: "none", outline: "none" },
  textareaSmall: { width: "100%", padding: "10px", borderRadius: "12px", border: "1px solid var(--border-color)", background: "var(--bg-secondary)", fontSize: "13px", minHeight: "60px", resize: "none", outline: "none", marginBottom: "12px" },
  submitBtn: { width: "100%", padding: "14px", borderRadius: "12px", background: "var(--primary)", color: "#fff", border: "none", fontWeight: "700", cursor: "pointer", transition: "opacity 0.2s" },
  secondaryBtn: { width: "100%", padding: "10px", borderRadius: "12px", background: "transparent", border: "2px solid var(--primary)", color: "var(--primary)", fontWeight: "700", cursor: "pointer", fontSize: "13px" },
  prescriptionItem: { padding: "10px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" },
  ehrSection: { marginTop: "20px" },
  ehrLabel: { fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" },
  ehrText: { fontSize: "14px", color: "var(--text-main)", margin: 0, lineHeight: 1.5 },
  symptomTag: { background: "var(--primary-light)", color: "var(--primary)", padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" },
  blockchainCard: { background: "linear-gradient(145deg, #0f172a, #1e293b)", borderRadius: "24px", padding: "24px", color: "#fff" },
  blockchainHeader: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" },
  shieldIcon: { color: "#10b981", fontSize: "24px" },
  blockchainText: { fontSize: "12px", color: "#94a3b8", marginBottom: "16px", lineHeight: 1.5 },
  hashBox: { background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: "12px", fontFamily: "monospace", fontSize: "10px", color: "#10b981", wordBreak: "break-all" },
  hashLabel: { fontSize: "9px", fontWeight: "800", color: "#64748b", marginTop: "12px", textAlign: "center", letterSpacing: "2px" }
};