import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../services/api";
import { useLang } from "../context/LanguageContext";
import t, { LANGUAGES } from "../i18n/translations";

export default function Settings() {
  const navigate = useNavigate();
  const { lang, setLang } = useLang();
  const tr = t[lang].settings;
  const userName = localStorage.getItem("user_name") || "User";
  const userId   = localStorage.getItem("user_id")   || "Unknown";
  const userRole = localStorage.getItem("user_role") || "doctor";

  const roleLabels = {
    doctor:  lang==="kn" ? "ಮುಖ್ಯ ರೇಡಿಯಾಲಜಿಸ್ಟ್" : "Chief Radiologist",
    nurse:   lang==="kn" ? "ಕ್ಲಿನಿಕಲ್ ದಾದಿ" : "Clinical Nurse",
    patient: lang==="kn" ? "ರೋಗಿ" : "Patient",
  };
  const namePrefix = { doctor:"Dr.", nurse: lang==="kn" ? "ದಾದಿ" : "Nurse", patient:"" };

  const [form,    setForm]    = useState({ old_password:"", new_password:"", confirm_password:"" });
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_role");
    navigate("/");
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (form.new_password !== form.confirm_password) {
      setError(lang==="kn" ? "ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಹೊಂದಾಣಿಕೆಯಾಗುತ್ತಿಲ್ಲ." : "New passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await changePassword({ old_password: form.old_password, new_password: form.new_password });
      if (res.data.error) setError(res.data.error);
      else { setSuccess(lang==="kn" ? "ಪಾಸ್‌ವರ್ಡ್ ಯಶಸ್ವಿಯಾಗಿ ಅಪ್‌ಡೇಟ್ ಆಯಿತು." : "Password updated successfully."); setForm({ old_password:"", new_password:"", confirm_password:"" }); }
    } catch (err) { setError(err.response?.data?.error || (lang==="kn" ? "ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಲು ವಿಫಲವಾಯಿತು." : "Failed to update password.")); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.container}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .lang-btn { transition: all 0.2s; }
        .lang-btn:hover { transform: scale(1.05); }
      `}</style>
      <header style={s.header}>
        <h1 style={s.title}>{tr.title}</h1>
        <p style={s.subtitle}>{tr.sub}</p>
      </header>

      <div style={s.grid}>
        {/* Profile Card */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>{tr.profileCard}</h3>
          <div style={s.profileSection}>
            <div style={s.avatarLarge}>{userName.charAt(0).toUpperCase()}</div>
            <div style={s.profileInfo}>
              <p style={s.nameLabel}>{namePrefix[userRole]} {userName}</p>
              <p style={s.roleLabel}>{roleLabels[userRole]}</p>
              <span style={s.badge}>ID: GV-{userId.toString().padStart(4,"0")}</span>
            </div>
          </div>
          <div style={s.divider} />
          <button onClick={handleLogout} style={s.logoutBtn}>{tr.logoutBtn}</button>
        </div>

        {/* Language Card */}
        <div style={{ ...s.card, animation:"fadeUp 0.5s 0.1s both" }}>
          <h3 style={s.cardTitle}>🌐 {tr.langCard}</h3>
          <p style={{ fontSize:13, color:"var(--text-muted)", marginBottom:20 }}>{tr.langHint}</p>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {LANGUAGES.map(l => (
              <button key={l.code} className="lang-btn"
                onClick={() => l.available && setLang(l.code)}
                title={l.available ? l.label : "Coming Soon"}
                style={{
                  padding:"10px 18px", borderRadius:12, fontWeight:700, fontSize:13,
                  border:`2px solid ${lang===l.code ? "var(--primary)" : "var(--border-color)"}`,
                  background: lang===l.code ? "var(--primary-light)" : "var(--bg-secondary)",
                  color: lang===l.code ? "var(--primary)" : l.available ? "var(--text-main)" : "var(--text-muted)",
                  cursor: l.available ? "pointer" : "not-allowed", position:"relative"
                }}>
                {l.flag} {l.label}
                {!l.available && <span style={{ fontSize:9, marginLeft:4, opacity:0.7, fontWeight:600 }}>Coming Soon</span>}
                {lang===l.code && <span style={{ marginLeft:6, fontSize:12 }}>✓</span>}
              </button>
            ))}
          </div>
          <div style={{ marginTop:16, padding:"12px 14px", background:"var(--bg-secondary)", borderRadius:10, fontSize:13 }}>
            {lang==="kn"
              ? <span>✅ <strong>ಕನ್ನಡ</strong> ಸಕ್ರಿಯ — ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಮತ್ತು ಎಲ್ಲಾ ಪರದೆಗಳು ಕನ್ನಡದಲ್ಲಿ ಇರುತ್ತವೆ.</span>
              : <span>✅ <strong>English</strong> active — all screens and voice input in English.</span>}
          </div>
        </div>

        {/* Security Card */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>{tr.securityCard}</h3>
          {error   && <div style={s.error}>{error}</div>}
          {success && <div style={s.success}>{success}</div>}
          <form onSubmit={handlePasswordChange} style={s.form}>
            {[
              { key:"old_password",     label: tr.currentPw },
              { key:"new_password",     label: tr.newPw     },
              { key:"confirm_password", label: tr.confirmPw },
            ].map(f => (
              <div key={f.key} style={s.inputGroup}>
                <label style={s.label}>{f.label}</label>
                <input type="password" style={s.input} value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })} required />
              </div>
            ))}
            <button type="submit" style={s.submitBtn} disabled={loading}>
              {loading ? "…" : tr.updatePwBtn}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const s = {
  container: { paddingTop:"20px" },
  header: { marginBottom:"32px" },
  title: { fontSize:"28px", fontWeight:"700", color:"var(--text-main)", marginBottom:"8px", letterSpacing:"-0.5px" },
  subtitle: { fontSize:"15px", color:"var(--text-muted)" },
  grid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"24px", alignItems:"start" },
  card: { background:"var(--card-bg)", borderRadius:"16px", padding:"24px", boxShadow:"var(--shadow-sm)" },
  cardTitle: { fontSize:"18px", fontWeight:"600", color:"var(--text-main)", marginBottom:"20px" },
  profileSection: { display:"flex", alignItems:"center", gap:"20px" },
  avatarLarge: { width:"80px", height:"80px", borderRadius:"50%", backgroundColor:"var(--primary-light)", color:"var(--primary)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"32px", fontWeight:"700", flexShrink:0 },
  profileInfo: { display:"flex", flexDirection:"column", alignItems:"flex-start" },
  nameLabel: { fontSize:"20px", fontWeight:"600", color:"var(--text-main)", margin:"0 0 4px 0" },
  roleLabel: { fontSize:"14px", color:"var(--text-muted)", margin:"0 0 8px 0" },
  badge: { backgroundColor:"var(--border-color)", color:"var(--text-muted)", fontSize:"12px", padding:"4px 10px", borderRadius:"12px", fontWeight:"600" },
  divider: { height:"1px", backgroundColor:"var(--border-color)", margin:"24px 0" },
  logoutBtn: { width:"100%", padding:"12px 0", borderRadius:"10px", backgroundColor:"var(--danger-light)", color:"var(--danger)", border:"none", fontSize:"14px", fontWeight:"600", cursor:"pointer" },
  error: { background:"var(--danger-light)", color:"var(--danger)", padding:"12px", borderRadius:"8px", fontSize:"13px", marginBottom:"16px" },
  success: { background:"var(--success-light)", color:"var(--success)", padding:"12px", borderRadius:"8px", fontSize:"13px", marginBottom:"16px" },
  form: { display:"flex", flexDirection:"column", gap:"16px" },
  inputGroup: { display:"flex", flexDirection:"column", gap:"6px" },
  label: { fontSize:"13px", fontWeight:"600", color:"var(--text-main)" },
  input: { padding:"12px 16px", borderRadius:"10px", border:"1px solid var(--border-color)", backgroundColor:"var(--bg-secondary)", color:"var(--text-main)", fontSize:"14px", outline:"none" },
  submitBtn: { padding:"14px 0", borderRadius:"10px", border:"none", background:"var(--primary)", color:"#fff", fontSize:"15px", fontWeight:"600", cursor:"pointer", marginTop:"8px" },
};
