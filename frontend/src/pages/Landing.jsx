import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import t from "../i18n/translations";
import { LANGUAGES } from "../i18n/translations";

const FEATURES = [
  { icon: "⚡", en: "Real-Time AI Diagnosis", kn: "ತಕ್ಷಣ AI ರೋಗ ನಿರ್ಣಯ", enD: "MobileNetV2 classifies skin lesions with risk score in under a second.", knD: "ಒಂದು ಸೆಕೆಂಡ್‌ನಲ್ಲಿ AI ಚರ್ಮ ರೋಗ ಪತ್ತೆ ಮಾಡುತ್ತದೆ." },
  { icon: "🔬", en: "Dermoscope Integration", kn: "ಡರ್ಮಸ್ಕೋಪ್ ಸಂಪರ್ಕ", enD: "Connect USB dermoscopes and capture scans directly.", knD: "USB ಡರ್ಮಸ್ಕೋಪ್ ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸಿ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ." },
  { icon: "🌐", en: "Multilingual Support", kn: "ಬಹುಭಾಷಾ ಬೆಂಬಲ", enD: "English & Kannada with voice input — built for rural India.", knD: "ಕನ್ನಡ ಮತ್ತು ಇಂಗ್ಲಿಷ್ — ಗ್ರಾಮೀಣ ಭಾರತಕ್ಕಾಗಿ ತಯಾರು." },
  { icon: "🚨", en: "Smart Escalation", kn: "ತ್ವರಿತ ಎಚ್ಚರಿಕೆ", enD: "High-risk cases auto-escalate to doctors with Order ID tracking.", knD: "ಅಪಾಯಕಾರಿ ಪ್ರಕರಣಗಳು ವೈದ್ಯರಿಗೆ ತಕ್ಷಣ ಕಳಿಸಲಾಗುತ್ತದೆ." },
  { icon: "🔒", en: "Blockchain EHR", kn: "ಬ್ಲಾಕ್‌ಚೈನ್ EHR", enD: "Patient records cryptographically secured with SHA-256 hashing.", knD: "ರೋಗಿ ದಾಖಲೆಗಳು SHA-256 ಮೂಲಕ ಸುರಕ್ಷಿತ." },
  { icon: "🎤", en: "Voice Prescriptions", kn: "ಧ್ವನಿ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್", enD: "Dictate prescriptions and clinical notes in English or Kannada.", knD: "ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಧ್ವನಿಯಲ್ಲಿ ಬರೆಯಿರಿ." },
];

const STATS = [
  { value: "10K+", enL: "Scans Processed", knL: "ಸ್ಕ್ಯಾನ್‌ಗಳು" },
  { value: "98.2%", enL: "AI Accuracy", knL: "AI ನಿಖರತೆ" },
  { value: "3", enL: "User Roles", knL: "ಬಳಕೆದಾರ ಪಾತ್ರಗಳು" },
  { value: "2", enL: "Languages", knL: "ಭಾಷೆಗಳು" },
];

export default function Landing() {
  const navigate = useNavigate();
  const { lang, setLang } = useLang();
  const { theme, toggleTheme } = useTheme();
  const [wordIdx, setWordIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const tr = t[lang].landing;

  // Typewriter cycle
  useEffect(() => {
    const iv = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setWordIdx(i => (i + 1) % tr.heroWords.length);
        setFade(true);
      }, 300);
    }, 2200);
    return () => clearInterval(iv);
  }, [lang]);

  return (
    <div style={{ 
      "--c-background": "transparent",
      "--c-on-background": "#ffffff",
      "--c-surface": "rgba(255,255,255,0.03)",
      "--c-on-surface": "#ffffff",
      "--c-surface-variant": "rgba(255,255,255,0.1)",
      "--c-on-surface-variant": "rgba(255,255,255,0.7)",
      "--c-surface-container-lowest": "rgba(255,255,255,0.02)",
      "--c-surface-container-low": "rgba(255,255,255,0.05)",
      "--c-surface-container": "rgba(255,255,255,0.08)",
      "--c-surface-container-high": "rgba(255,255,255,0.12)",
      "--c-outline-variant": "rgba(255,255,255,0.15)",
      "--c-primary": "#81e6d9",
      "--c-on-primary": "#004D40",
      "--c-secondary": "#4fd1c5",
      "--c-on-secondary": "#004D40",
      "--c-primary-container": "rgba(129, 230, 217, 0.2)",
      "--c-secondary-container": "rgba(79, 209, 197, 0.2)",
      "--c-tertiary-container": "rgba(255, 255, 255, 0.1)",
      minHeight: "100vh", 
      background: "linear-gradient(145deg, #004D40 0%, #00796B 55%, #26A69A 100%)", 
      fontFamily: "'Inter', sans-serif", 
      overflowX: "hidden" 
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float { 0%,100% { transform:translateY(0px) rotate(0deg); } 50% { transform:translateY(-18px) rotate(2deg); } }
        @keyframes pulse-ring { 0% { transform:scale(1); opacity:0.4; } 100% { transform:scale(1.6); opacity:0; } }
        @keyframes slideRight { from { opacity:0; transform:translateX(-40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 20px var(--c-primary-container); } 50% { box-shadow: 0 0 50px var(--c-primary); } }
        @keyframes orb { 0%,100% { transform:translate(0,0) scale(1); } 33% { transform:translate(60px,-40px) scale(1.1); } 66% { transform:translate(-30px,30px) scale(0.9); } }
        .nav-btn { transition: all 0.2s; }
        .nav-btn:hover { transform: translateY(-1px); }
        .feature-card { transition: all 0.3s; cursor:default; }
        .feature-card:hover { transform: translateY(-8px); background: var(--c-surface-container) !important; border-color: var(--c-primary) !important; }
        .hero-cta { transition: all 0.25s; }
        .hero-cta:hover { transform: translateY(-3px); box-shadow: 0 16px 40px var(--c-primary-container) !important; }
        .lang-dot { transition: all 0.2s; }
        .lang-dot:hover { transform: scale(1.15); }
        .stat-item { animation: fadeUp 0.6s ease both; }
      `}</style>

      {/* ── Animated background orbs & circles ── */}
      <div style={{ position:"fixed", inset:0, overflow:"hidden", zIndex:0, pointerEvents:"none" }}>
        {/* decorative circles from Login page */}
        <div style={{ position:"absolute", top:-80, left:-80, width:320, height:320, borderRadius:"50%", background:"rgba(255,255,255,0.06)" }} />
        <div style={{ position:"absolute", bottom:-120, right:-60, width:400, height:400, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <div style={{ position:"absolute", top:"40%", right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.08)" }} />

        {[
          { w:500, h:500, top:"10%", left:"60%", c:"var(--c-primary-container)", d:"0s" },
          { w:400, h:400, top:"60%", left:"10%", c:"var(--c-secondary-container)", d:"2s" },
          { w:350, h:350, top:"30%", left:"30%", c:"var(--c-tertiary-container)", d:"4s" },
        ].map((orb, i) => (
          <div key={i} style={{ position:"absolute", width:orb.w, height:orb.h, top:orb.top, left:orb.left, borderRadius:"50%", background:orb.c, filter:"blur(80px)", animation:`orb 12s ${orb.d} ease-in-out infinite` }} />
        ))}
      </div>

      {/* ── Navbar ── */}
      <nav style={{ position:"sticky", top:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 60px", background:"var(--c-surface)", backdropFilter:"blur(20px)", borderBottom:"1px solid var(--c-outline-variant)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:"rgba(255,255,255,0.15)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span className="material-symbols-outlined" style={{ color:"#fff", fontSize:22, fontVariationSettings:"'FILL' 1" }}>ecg_heart</span>
          </div>
          <div>
            <div style={{ color:"#fff", fontWeight:800, fontSize:18, letterSpacing:"-0.5px" }}>GenVeda</div>
            <div style={{ color:"rgba(255,255,255,0.7)", fontSize:9, fontWeight:600, letterSpacing:2 }}>CLINICAL INTELLIGENCE</div>
          </div>
        </div>

        {/* Language and Theme dots */}
        <div style={{ display:"flex", gap:16, alignItems:"center" }}>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {LANGUAGES.map(l => (
              <button key={l.code} className="lang-dot" onClick={() => l.available && setLang(l.code)} title={l.available ? l.label : "Coming Soon"}
                style={{ padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:700, border:`1.5px solid ${lang===l.code ? "var(--c-primary)" : "var(--c-outline-variant)"}`, background: lang===l.code ? "var(--c-primary-container)" : "transparent", color: lang===l.code ? "var(--c-primary)" : l.available ? "var(--c-on-surface-variant)" : "var(--c-outline)", cursor: l.available ? "pointer" : "not-allowed", position:"relative" }}>
                {l.flag} {l.label}{!l.available && <span style={{ fontSize:9, marginLeft:3, opacity:0.6 }}>Soon</span>}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", gap:12 }}>
          <button className="nav-btn" onClick={() => navigate("/login")} style={{ background:"transparent", color:"var(--c-on-surface)", border:"1px solid var(--c-outline-variant)", padding:"9px 20px", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer" }}>{tr.navLogin}</button>
          <button className="nav-btn" onClick={() => navigate("/register")} style={{ background:"linear-gradient(135deg, var(--c-primary), var(--c-secondary))", color:"var(--c-on-primary)", border:"none", padding:"9px 24px", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer" }}>{tr.navRegister}</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position:"relative", zIndex:1, display:"grid", gridTemplateColumns:"1fr 1fr", gap:60, alignItems:"center", padding:"100px 60px 80px", maxWidth:1300, margin:"0 auto" }}>
        {/* Left */}
        <div style={{ animation:"slideRight 0.8s ease both" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"var(--c-surface-container)", border:"1px solid var(--c-primary)", borderRadius:20, padding:"6px 16px", marginBottom:28 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"var(--c-primary)", position:"relative" }}>
              <div style={{ position:"absolute", inset:-3, borderRadius:"50%", background:"var(--c-primary-container)", animation:"pulse-ring 1.5s ease-out infinite" }} />
            </div>
            <span style={{ color:"var(--c-primary)", fontSize:12, fontWeight:700, letterSpacing:0.5 }}>{tr.pill}</span>
          </div>

          <h1 style={{ color:"var(--c-on-background)", fontSize:58, fontWeight:900, lineHeight:1.08, letterSpacing:"-2px", margin:"0 0 8px" }}>
            {tr.heroLine1}
          </h1>
          <h1 style={{ fontSize:58, fontWeight:900, lineHeight:1.08, letterSpacing:"-2px", margin:"0 0 28px", background:"linear-gradient(135deg, var(--c-primary), var(--c-secondary))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", transition:"opacity 0.3s", opacity: fade ? 1 : 0 }}>
            {tr.heroWords[wordIdx]}
          </h1>
          <p style={{ color:"var(--c-on-surface-variant)", fontSize:17, lineHeight:1.7, margin:"0 0 40px", maxWidth:520 }}>{tr.heroSub}</p>

          <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
            <button className="hero-cta" onClick={() => navigate("/register")} style={{ background:"linear-gradient(135deg, var(--c-primary), var(--c-secondary))", color:"var(--c-on-primary)", border:"none", padding:"15px 32px", borderRadius:12, fontSize:15, fontWeight:700, cursor:"pointer", boxShadow:"0 8px 24px var(--c-primary-container)" }}>
              🚀 {tr.ctaPrimary}
            </button>
            <button className="hero-cta" onClick={() => navigate("/login")} style={{ background:"var(--c-surface-container-low)", color:"var(--c-on-surface)", border:"1px solid var(--c-outline-variant)", padding:"15px 28px", borderRadius:12, fontSize:15, fontWeight:600, cursor:"pointer" }}>
              {tr.ctaSecondary}
            </button>
          </div>
        </div>

        {/* Right — Animated scan card */}
        <div style={{ display:"flex", justifyContent:"center", animation:"float 5s ease-in-out infinite" }}>
          <div style={{ width:360, background:"var(--c-surface)", border:"1px solid var(--c-outline-variant)", borderRadius:24, padding:28, backdropFilter:"blur(20px)", boxShadow:"0 30px 80px rgba(0,0,0,0.15)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--c-primary)", boxShadow:"0 0 12px var(--c-primary)" }} />
                <span style={{ color:"var(--c-on-surface)", fontSize:12, fontWeight:700, letterSpacing:1 }}>AI ANALYSIS LIVE</span>
              </div>
              <span style={{ color:"var(--c-on-surface-variant)", fontSize:11 }}>GenVeda v2.0</span>
            </div>
            {[
              { label:"Melanocytic Nevus", pct:72, color:"#2dd4bf", risk:"LOW" },
              { label:"Benign Keratosis",  pct:14, color:"#a78bfa", risk:"LOW" },
              { label:"Melanoma",          pct:8,  color:"#f87171", risk:"HIGH" },
              { label:"BCC",               pct:4,  color:"#fb923c", risk:"MED" },
              { label:"Dermatofibroma",    pct:2,  color:"#60a5fa", risk:"LOW" },
            ].map((item,i) => (
              <div key={item.label} style={{ marginBottom:12, animation:`fadeUp 0.5s ${i*0.1}s both` }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ color:"var(--c-on-surface-variant)", fontSize:12 }}>{item.label}</span>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <span style={{ fontSize:10, fontWeight:700, color:item.color, background:`${item.color}20`, padding:"2px 7px", borderRadius:8 }}>{item.risk}</span>
                    <span style={{ color:item.color, fontSize:12, fontWeight:700 }}>{item.pct}%</span>
                  </div>
                </div>
                <div style={{ height:5, background:"var(--c-surface-variant)", borderRadius:3 }}>
                  <div style={{ width:`${item.pct}%`, height:"100%", background:`linear-gradient(90deg,${item.color},${item.color}80)`, borderRadius:3, transition:"width 1s ease" }} />
                </div>
              </div>
            ))}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:20 }}>
              {[{ l:"Risk Score", v:"24/100", c:"#2dd4bf" }, { l:"Category", v:"LOW RISK", c:"#2dd4bf" }, { l:"Confidence", v:"72%", c:"#a78bfa" }, { l:"Analysis", v:"< 1s", c:"#60a5fa" }].map(s => (
                <div key={s.l} style={{ background:"var(--c-surface-container)", borderRadius:12, padding:"12px 14px" }}>
                  <div style={{ color:"var(--c-on-surface-variant)", fontSize:10, fontWeight:600 }}>{s.l}</div>
                  <div style={{ color:s.c, fontWeight:800, fontSize:15, marginTop:3 }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div style={{ position:"relative", zIndex:1, background:"var(--c-surface-container)", borderTop:"1px solid var(--c-outline-variant)", borderBottom:"1px solid var(--c-outline-variant)", padding:"32px 60px" }}>
        <div style={{ display:"flex", justifyContent:"space-around", maxWidth:1000, margin:"0 auto" }}>
          {STATS.map((s,i) => (
            <div key={i} className="stat-item" style={{ textAlign:"center", animationDelay:`${i*0.15}s` }}>
              <div style={{ fontSize:36, fontWeight:900, background:"linear-gradient(135deg, var(--c-primary), var(--c-secondary))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{s.value}</div>
              <div style={{ color:"var(--c-on-surface-variant)", fontSize:13, fontWeight:600, marginTop:4 }}>{lang==="kn" ? s.knL : s.enL}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section style={{ position:"relative", zIndex:1, padding:"80px 60px", maxWidth:1300, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:56 }}>
          <h2 style={{ color:"var(--c-on-background)", fontSize:38, fontWeight:800, letterSpacing:"-1px", margin:"0 0 12px" }}>{tr.featuresTitle}</h2>
          <div style={{ width:60, height:3, background:"linear-gradient(90deg, var(--c-primary), var(--c-secondary))", borderRadius:3, margin:"0 auto" }} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24 }}>
          {FEATURES.map((f,i) => (
            <div key={i} className="feature-card" style={{ background:"var(--c-surface-container-low)", border:"1px solid var(--c-outline-variant)", borderRadius:20, padding:"28px 24px", animation:`fadeUp 0.6s ${i*0.1}s both` }}>
              <div style={{ fontSize:32, marginBottom:16 }}>{f.icon}</div>
              <h3 style={{ color:"var(--c-on-surface)", fontSize:16, fontWeight:700, margin:"0 0 10px" }}>{lang==="kn" ? f.kn : f.en}</h3>
              <p style={{ color:"var(--c-on-surface-variant)", fontSize:13, lineHeight:1.65, margin:0 }}>{lang==="kn" ? f.knD : f.enD}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Built for Bharat ── */}
      <section style={{ position:"relative", zIndex:1, margin:"0 60px 80px", background:"linear-gradient(135deg,var(--c-surface-container-low),var(--c-surface-container-high))", border:"1px solid var(--c-outline-variant)", borderRadius:28, padding:"60px 64px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, alignItems:"center" }}>
        <div>
          <div style={{ color:"var(--c-primary)", fontSize:12, fontWeight:700, letterSpacing:2, marginBottom:12 }}>🇮🇳 MADE FOR INDIA</div>
          <h2 style={{ color:"var(--c-on-background)", fontSize:36, fontWeight:800, margin:"0 0 16px", letterSpacing:"-0.5px" }}>{tr.builtForTitle}</h2>
          <p style={{ color:"var(--c-on-surface-variant)", fontSize:15, lineHeight:1.7, margin:"0 0 28px" }}>{tr.builtForSub}</p>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            {["🌐 English", "🗣 ಕನ್ನಡ", "🎤 Voice Input", "📱 Mobile Ready"].map(tag => (
              <span key={tag} style={{ background:"var(--c-surface)", border:"1px solid var(--c-outline-variant)", borderRadius:20, padding:"6px 14px", color:"var(--c-on-surface)", fontSize:12, fontWeight:600 }}>{tag}</span>
            ))}
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {[
            { icon:"🏥", en:"Rural Clinics", kn:"ಗ್ರಾಮೀಣ ಕ್ಲಿನಿಕ್" },
            { icon:"👨‍⚕️", en:"Multi-Role System", kn:"ಬಹು-ಪಾತ್ರ ವ್ಯವಸ್ಥೆ" },
            { icon:"📊", en:"Offline-Ready EHR", kn:"ಆಫ್‌ಲೈನ್ EHR" },
            { icon:"🔐", en:"Data Privacy", kn:"ಡೇಟಾ ಗೌಪ್ಯತೆ" },
          ].map((c,i) => (
            <div key={i} style={{ background:"var(--c-surface-container)", borderRadius:16, padding:"20px", border:"1px solid var(--c-outline-variant)" }}>
              <div style={{ fontSize:24, marginBottom:8 }}>{c.icon}</div>
              <div style={{ color:"var(--c-on-surface)", fontWeight:700, fontSize:14 }}>{lang==="kn" ? c.kn : c.en}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ position:"relative", zIndex:1, borderTop:"1px solid var(--c-outline-variant)", padding:"28px 60px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ color:"var(--c-on-surface-variant)", fontSize:13 }}>{tr.footerText}</div>
        <div style={{ display:"flex", gap:16 }}>
          {["Privacy", "Terms", "Contact"].map(l => <a key={l} href="#" style={{ color:"var(--c-on-surface-variant)", fontSize:13, textDecoration:"none" }}>{l}</a>)}
        </div>
      </footer>
    </div>
  );
}
