import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sendChatMessage } from "../services/api";
import { cleanResponse } from "../utils/cleanResponse";
import { useLang } from "../context/LanguageContext";
import tr from "../i18n/translations";

export default function DoctorChat() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const tx = tr[lang].doctor;

  const DOCTOR_SYSTEM_PROMPT = lang === "kn" 
    ? `You are GenVeda Clinical AI, a medical decision-support assistant for licensed physicians.
Reply strictly in Kannada. Use professional yet simple Kannada that is easy for doctors in local clinics to understand.
Help with: differential diagnosis, evidence-based treatment protocols (AAD/NICE/WHO guidelines), drug interactions, dermoscopy interpretation, histopathology concepts, and clinical documentation.
Use precise medical terminology where necessary, but keep the prose in Kannada. Always note when multidisciplinary team discussion is warranted. Remind the physician that clinical judgement supersedes AI recommendations.
CRITICAL FORMATTING RULES:
- Write in plain prose only. No markdown whatsoever.
- No asterisks (*), no hash symbols (#), no pipe characters (|), no triple dashes (---), no backticks.
- For numbered steps or lists use: 1. Item  2. Item  or plain dashes: - Item
- Write as if presenting a clinical case summary verbally.`
    : `You are GenVeda Clinical AI, a medical decision-support assistant for licensed physicians.
Help with: differential diagnosis, evidence-based treatment protocols (AAD/NICE/WHO guidelines), drug interactions, dermoscopy interpretation, histopathology concepts, and clinical documentation.
Use precise medical terminology. Always note when multidisciplinary team discussion is warranted. Remind the physician that clinical judgement supersedes AI recommendations.

CRITICAL FORMATTING RULES:
- Write in plain prose only. No markdown whatsoever.
- No asterisks (*), no hash symbols (#), no pipe characters (|), no triple dashes (---), no backticks.
- For numbered steps or lists use: 1. Item  2. Item  or plain dashes: - Item
- Write as if presenting a clinical case summary verbally.`;

  const INIT_MSG = { from: "ai", contextUsed: false, text: tx.chatGreeting };

  const [msgs, setMsgs] = useState([INIT_MSG]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [err, setErr] = useState("");
  const bottomRef = useRef(null);
  const recRef = useRef(null);

  useEffect(() => {
    setMsgs([{ from: "ai", contextUsed: false, text: tr[lang].doctor.chatGreeting }]);
  }, [lang]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const r = new SR();
      r.lang = tx.voiceLang || "en-US";
      r.onresult = e => { setInput(p => p ? `${p} ${e.results[0][0].transcript}` : e.results[0][0].transcript); setRecording(false); };
      r.onend = () => setRecording(false);
      recRef.current = r;
    }
  }, [tx.voiceLang]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  const toggleVoice = () => {
    if (!recRef.current) return alert("Voice not supported in this browser.");
    recording ? (recRef.current.stop(), setRecording(false)) : (recRef.current.start(), setRecording(true));
  };

  const send = async (text) => {
    const t = text.trim();
    if (!t || typing) return;
    setMsgs(p => [...p, { from: "user", text: t }]);
    setInput(""); setTyping(true); setErr("");
    try {
      const history = [
        { role: "system", content: DOCTOR_SYSTEM_PROMPT },
        ...msgs.slice(-4).map(m => ({ role: m.from === "user" ? "user" : "assistant", content: m.text })),
      ];
      const res = await sendChatMessage(`[Doctor] ${t}`, history);
      setMsgs(p => [...p, { from: "ai", text: cleanResponse(res.data.reply), contextUsed: res.data.context_used }]);
    } catch {
      setMsgs(p => [...p, { from: "ai", text: "Unable to reach clinical AI. Please retry.", isError: true }]);
      setErr("Connection issue — please retry.");
    } finally { setTyping(false); }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 64px)", width:"100%", padding:"0 32px", boxSizing:"border-box" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"16px 0 10px", borderBottom:"1px solid var(--border-color)", flexShrink:0 }}>
        <button onClick={() => navigate("/dashboard")} style={{ background:"none", border:"none", color:"var(--text-muted)", fontSize:"20px", cursor:"pointer" }}>←</button>
        <div style={{ position:"relative", flexShrink:0 }}>
          <div style={{ width:"42px", height:"42px", background:"#e8eaf6", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px" }}>🩺</div>
          <div style={{ width:"8px", height:"8px", background:"#22c55e", borderRadius:"50%", position:"absolute", bottom:"2px", right:"2px", border:"2px solid white" }} />
        </div>
        <div>
          <p style={{ fontWeight:"700", color:"var(--text-main)", margin:0, fontSize:"15px" }}>GenVeda Clinical AI</p>
          <p style={{ fontSize:"11px", color:"#22c55e", margin:0, fontWeight:"600" }}>● Medical Decision Support — RAG Enabled</p>
        </div>
        <div style={{ marginLeft:"auto", background:"#e8eaf6", color:"#1a237e", fontSize:"11px", fontWeight:"700", padding:"5px 12px", borderRadius:"20px" }}>🩺 Doctor Mode</div>
      </div>

      <div style={{ fontSize:"11px", color:"#64748b", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:"8px", padding:"6px 12px", marginTop:"8px", textAlign:"center", flexShrink:0 }}>
        📚 Searches DuckDuckGo · PubMed · Wikipedia for clinical evidence
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"20px 0 8px", display:"flex", flexDirection:"column" }}>
        {msgs.map((msg, i) => (
          <div key={i} style={{ display:"flex", justifyContent:msg.from==="user"?"flex-end":"flex-start", marginBottom:"14px", alignItems:"flex-end", gap:"8px" }}>
            {msg.from==="ai" && <div style={{ width:"30px", height:"30px", background:"#e8eaf6", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", flexShrink:0 }}>🩺</div>}
            <div style={{ maxWidth:"78%", display:"flex", flexDirection:"column", gap:"4px", alignItems:msg.from==="user"?"flex-end":"flex-start" }}>
              <div style={{ padding:"12px 16px", borderRadius:msg.from==="user"?"20px 20px 4px 20px":"20px 20px 20px 4px", background:msg.from==="user"?"#1a237e":msg.isError?"#fef2f2":"var(--card-bg)", color:msg.from==="user"?"#fff":msg.isError?"#dc2626":"var(--text-main)", fontSize:"14px", lineHeight:1.7, whiteSpace:"pre-wrap", boxShadow:"0 1px 4px rgba(0,0,0,0.08)" }}>
                {msg.text}
              </div>
              {msg.from==="ai" && msg.contextUsed && (
                <span style={{ fontSize:"10px", color:"#3730a3", background:"#eef2ff", border:"1px solid #c7d2fe", padding:"2px 8px", borderRadius:"10px", fontWeight:"600" }}>📚 Evidence-based — clinical sources searched</span>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div style={{ display:"flex", alignItems:"flex-end", gap:"8px", marginBottom:"14px" }}>
            <div style={{ width:"30px", height:"30px", background:"#e8eaf6", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px" }}>🩺</div>
            <div style={{ background:"var(--card-bg)", borderRadius:"20px", padding:"12px 16px", display:"flex", alignItems:"center", gap:"4px", boxShadow:"0 1px 4px rgba(0,0,0,0.08)" }}>
              {[0,0.15,0.3].map((d,i) => <span key={i} style={{ width:"7px", height:"7px", background:"#94a3b8", borderRadius:"50%", display:"inline-block", animation:"bounce 1s infinite", animationDelay:`${d}s` }} />)}
              <span style={{ fontSize:"11px", color:"#94a3b8", marginLeft:"6px" }}>Searching clinical literature...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {msgs.length <= 2 && !typing && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", padding:"8px 0 4px", flexShrink:0 }}>
          {tx.chatChips.map(r => <button key={r} onClick={() => send(r)} style={{ background:"var(--card-bg)", border:"1px solid var(--border-color)", borderRadius:"20px", padding:"7px 14px", fontSize:"12px", fontWeight:"600", cursor:"pointer", color:"var(--text-main)", fontFamily:"'Lexend', sans-serif" }}>{r}</button>)}
        </div>
      )}

      <div style={{ borderTop:"1px solid var(--border-color)", paddingTop:"10px", flexShrink:0, paddingBottom:"6px" }}>
        {err && <p style={{ fontSize:"12px", color:"#dc2626", margin:"0 0 6px" }}>{err}</p>}
        <div style={{ display:"flex", gap:"10px", alignItems:"flex-end" }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"2px" }}>
            <button onClick={toggleVoice} style={{ width:"40px", height:"40px", borderRadius:"50%", border:"none", cursor:"pointer", fontSize:"17px", display:"flex", alignItems:"center", justifyContent:"center", background:recording?"#fee2e2":"#f1f5f9", color:recording?"#dc2626":"#64748b" }}>
              {recording ? "⏹" : "🎙"}
            </button>
            <span style={{ fontSize:"9px", color:"#94a3b8", fontStyle:"italic" }}>( optional )</span>
          </div>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} placeholder={tx.chatPlaceholder} disabled={typing}
            style={{ flex:1, padding:"11px 16px", borderRadius:"24px", border:"2px solid var(--border-color)", background:"var(--bg-secondary)", color:"var(--text-main)", fontSize:"14px", outline:"none", fontFamily:"'Lexend', sans-serif" }} />
          <button onClick={() => send(input)} disabled={!input.trim() || typing} style={{ width:"44px", height:"44px", borderRadius:"50%", background:"#1a237e", color:"#fff", border:"none", cursor:"pointer", fontSize:"18px", display:"flex", alignItems:"center", justifyContent:"center", opacity:(!input.trim() || typing)?0.5:1 }}>➤</button>
        </div>
        <p style={{ fontSize:"10px", color:"#94a3b8", textAlign:"center", margin:"6px 0 0", fontStyle:"italic" }}>GenVeda Clinical AI is a decision-support tool. Clinical judgement always takes precedence.</p>
      </div>
    </div>
  );
}
