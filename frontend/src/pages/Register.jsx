import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/api";
import { useLang } from "../context/LanguageContext";
import t, { LANGUAGES } from "../i18n/translations";

const ROLES = [
  { role:"doctor",  label:"Doctor",        icon:"stethoscope",      desc:"Clinical review & AI analysis" },
  { role:"nurse",   label:"Health Worker", icon:"medical_services", desc:"First screening & data collection" },
  { role:"patient", label:"Patient",       icon:"person",           desc:"View results & appointments" },
];

export default function Register() {
  const navigate = useNavigate();
  const { lang, setLang } = useLang();
  const tr = t[lang].auth;
  const [form, setForm]       = useState({ username:"", email:"", password:"", confirmPassword:"", role:"doctor" });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwStrength, setPwStrength] = useState(0);

  const getPwStrength = pw => {
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 10) s++;
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) s++;
    return s;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await registerUser(form);
      const data = res.data.data;
      localStorage.setItem("access_token",  data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("user_name",     data.user_name);
      localStorage.setItem("user_id",       data.user_id);
      localStorage.setItem("user_role",     data.role);
      
      const dest = { doctor:"/dashboard", nurse:"/nurse/dashboard", patient:"/patient/dashboard" };
      navigate(dest[data.role] || "/dashboard");
    } catch (err) {
      console.error(err);
      let errorMsg = "Registration failed. Please try a different username.";
      if (err.response && err.response.data && err.response.data.error) {
        if (typeof err.response.data.error === 'object') {
          errorMsg = Object.values(err.response.data.error).flat().join(" | ");
        } else {
          errorMsg = err.response.data.error;
        }
      }
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const strengthColor = ["#ef4444","#f59e0b","#10b981"][pwStrength - 1] || "var(--c-outline-variant)";
  const strengthLabel = ["","Weak","Fair","Strong"][pwStrength] || "";

  const inputStyle = {
    width:"100%", padding:"13px 16px 13px 48px", borderRadius:14,
    border:"2px solid var(--c-outline-variant)", background:"var(--c-surface-container-low)",
    color:"var(--c-on-surface)", fontSize:15, outline:"none",
    boxSizing:"border-box", fontFamily:"'Lexend', sans-serif",
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"'Lexend', sans-serif" }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
      <div style={{
        flex:1, display:"flex", flexDirection:"column", justifyContent:"center",
        padding:"60px 64px", background:"linear-gradient(145deg, #004D40 0%, #00796B 55%, #26A69A 100%)",
        position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", top:-80, left:-80, width:320, height:320, borderRadius:"50%", background:"rgba(255,255,255,0.06)" }} />
        <div style={{ position:"absolute", bottom:-120, right:-60, width:400, height:400, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />

        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:56 }}>
            <div style={{ width:52, height:52, borderRadius:16, background:"rgba(255,255,255,0.15)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span className="material-symbols-outlined" style={{ color:"#fff", fontSize:28, fontVariationSettings:"'FILL' 1" }}>ecg_heart</span>
            </div>
            <div>
              <h1 style={{ color:"#fff", fontSize:28, fontWeight:800, margin:0 }}>GenVeda</h1>
              <p style={{ color:"rgba(255,255,255,0.65)", fontSize:11, fontWeight:600, letterSpacing:2, margin:0 }}>CLINICAL INTELLIGENCE</p>
            </div>
          </div>

          <h2 style={{ color:"#fff", fontSize:38, fontWeight:800, lineHeight:1.2, marginBottom:20, letterSpacing:"-0.5px" }}>
            Join the future<br />of clinical<br />diagnostics
          </h2>
          <p style={{ color:"rgba(255,255,255,0.75)", fontSize:16, lineHeight:1.7, marginBottom:48, maxWidth:380 }}>
            Choose your role and get instant access to AI-powered dermatology tools designed for your clinical workflow.
          </p>

          {/* Role cards */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {ROLES.map(r => (
              <div key={r.role}
                onClick={() => setForm(f=>({...f, role:r.role}))}
                style={{
                  display:"flex", alignItems:"center", gap:14, padding:"14px 18px",
                  borderRadius:16, cursor:"pointer",
                  background: form.role===r.role ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)",
                  border: `2px solid ${form.role===r.role ? "rgba(255,255,255,0.5)" : "transparent"}`,
                  transition:"all 0.2s",
                }}
              >
                <div style={{ width:40, height:40, borderRadius:12, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span className="material-symbols-outlined" style={{ color:"#fff", fontSize:20, fontVariationSettings:"'FILL' 1" }}>{r.icon}</span>
                </div>
                <div>
                  <p style={{ color:"#fff", fontSize:14, fontWeight:700, margin:0 }}>{r.role === 'doctor' ? tr.roleDoctor : r.role === 'nurse' ? tr.roleNurse : tr.rolePatient}</p>
                  <p style={{ color:"rgba(255,255,255,0.65)", fontSize:12, margin:0 }}>{r.desc}</p>
                </div>
                {form.role===r.role && (
                  <span className="material-symbols-outlined" style={{ color:"#fff", fontSize:20, marginLeft:"auto", fontVariationSettings:"'FILL' 1" }}>check_circle</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
      <div style={{
        width:480, display:"flex", flexDirection:"column", justifyContent:"center",
        padding:"50px 56px", backgroundColor:"var(--c-background)", overflowY:"auto",
      }}>
        <div style={{ marginBottom:36 }}>
          {/* Language selector */}
          <div style={{ display:"flex", gap:6, marginBottom:28, flexWrap:"wrap" }}>
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => l.available && setLang(l.code)} type="button"
                title={l.available ? l.label : "Coming Soon"}
                style={{ padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:700,
                  border:`1.5px solid ${lang===l.code ? "var(--c-primary)" : "var(--c-outline-variant)"}`,
                  background: lang===l.code ? "var(--c-primary-container)" : "transparent",
                  color: lang===l.code ? "var(--c-primary)" : l.available ? "var(--c-on-surface-variant)" : "var(--c-outline)",
                  cursor: l.available ? "pointer" : "not-allowed", transition:"all 0.2s" }}>
                {l.flag} {l.label}{!l.available && <span style={{ fontSize:9, marginLeft:3 }}>Soon</span>}
              </button>
            ))}
          </div>
          <p style={{ color:"var(--c-on-surface-variant)", fontSize:13, fontWeight:600, letterSpacing:2, textTransform:"uppercase", marginBottom:10 }}>{tr.registerSub}</p>
          <h2 style={{ color:"var(--c-on-surface)", fontSize:32, fontWeight:800, margin:0, letterSpacing:"-0.5px", lineHeight:1.2 }}>{tr.registerTitle}</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Username */}
          <div>
            <label style={{ display:"block", fontSize:13, fontWeight:600, color:"var(--c-on-surface-variant)", marginBottom:7 }}>{tr.usernameLabel}</label>
            <div style={{ position:"relative" }}>
              <span className="material-symbols-outlined" style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", color:"var(--c-outline)", fontSize:20 }}>badge</span>
              <input id="register-username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} placeholder="johndoe" style={inputStyle}
                onFocus={e=>e.target.style.borderColor="var(--c-primary)"} onBlur={e=>e.target.style.borderColor="var(--c-outline-variant)"} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display:"block", fontSize:13, fontWeight:600, color:"var(--c-on-surface-variant)", marginBottom:7 }}>{tr.emailLabel}</label>
            <div style={{ position:"relative" }}>
              <span className="material-symbols-outlined" style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", color:"var(--c-outline)", fontSize:20 }}>mail</span>
              <input id="register-email" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@clinic.com" style={inputStyle}
                onFocus={e=>e.target.style.borderColor="var(--c-primary)"} onBlur={e=>e.target.style.borderColor="var(--c-outline-variant)"} />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display:"block", fontSize:13, fontWeight:600, color:"var(--c-on-surface-variant)", marginBottom:7 }}>{tr.passwordLabel}</label>
            <div style={{ position:"relative" }}>
              <span className="material-symbols-outlined" style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", color:"var(--c-outline)", fontSize:20 }}>lock</span>
              <input id="register-password" type={showPw?"text":"password"} value={form.password}
                onChange={e=>{setForm({...form,password:e.target.value});setPwStrength(getPwStrength(e.target.value));}}
                placeholder="Min 6 characters"
                style={{...inputStyle, paddingRight:48}}
                onFocus={e=>e.target.style.borderColor="var(--c-primary)"} onBlur={e=>e.target.style.borderColor="var(--c-outline-variant)"} />
              <button type="button" onClick={()=>setShowPw(p=>!p)}
                style={{ position:"absolute", right:16, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--c-outline)", padding:0 }}>
                <span className="material-symbols-outlined" style={{ fontSize:20 }}>{showPw?"visibility_off":"visibility"}</span>
              </button>
            </div>
            {form.password.length > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:6 }}>
                <div style={{ flex:1, height:4, background:"var(--c-outline-variant)", borderRadius:2, overflow:"hidden" }}>
                  <div style={{ width:`${(pwStrength/3)*100}%`, height:"100%", background:strengthColor, borderRadius:2, transition:"all 0.3s" }} />
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:strengthColor }}>{strengthLabel}</span>
              </div>
            )}
          </div>

          {/* Role selector */}
          <div>
            <label style={{ display:"block", fontSize:13, fontWeight:600, color:"var(--c-on-surface-variant)", marginBottom:7 }}>{tr.roleLabel}</label>
            <div style={{ position:"relative" }}>
              <span className="material-symbols-outlined" style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", color:"var(--c-outline)", fontSize:20 }}>work</span>
              <select id="register-role" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}
                style={{...inputStyle, appearance:"none", paddingLeft:48, cursor:"pointer"}}>
                {ROLES.map(r => <option key={r.role} value={r.role}>{r.role === 'doctor' ? tr.roleDoctor : r.role === 'nurse' ? tr.roleNurse : tr.rolePatient}</option>)}
              </select>
            </div>
          </div>

          {/* Submit */}
          <button id="register-submit" type="submit" disabled={loading}
            style={{
              width:"100%", padding:"16px", borderRadius:14, border:"none",
              background:"linear-gradient(135deg, #00796B, #26A69A)",
              color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer", marginTop:4,
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              opacity:loading?0.75:1, fontFamily:"'Lexend', sans-serif",
              boxShadow:"0 4px 20px rgba(0,121,107,0.35)",
            }}
          >
            {loading
              ? <><span className="material-symbols-outlined" style={{ fontSize:20 }}>refresh</span> {tr.registering}</>
              : <><span className="material-symbols-outlined" style={{ fontSize:20 }}>person_add</span> {tr.registerBtn}</>}
          </button>
        </form>

        <p style={{ color:"var(--c-on-surface-variant)", textAlign:"center", marginTop:24, fontSize:14 }}>
          {tr.haveAccount}{" "}
          <Link to="/login" style={{ color:"var(--c-primary)", fontWeight:700, textDecoration:"none" }}>{tr.loginLink}</Link>
        </p>

        <p style={{ color:"var(--c-outline)", textAlign:"center", marginTop:36, fontSize:12 }}>
          © 2024 GenVeda · AI Clinical Intelligence Platform
        </p>
      </div>
    </div>
  );
}
