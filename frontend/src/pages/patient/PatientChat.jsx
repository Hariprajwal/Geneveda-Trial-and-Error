import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sendChatMessage } from "../../services/api";
import { cleanResponse } from "../../utils/cleanResponse";
import { useLang } from "../../context/LanguageContext";
import tr from "../../i18n/translations";

const INITIAL_MESSAGE = {
  from: "ai",
  text: "Hello! I'm GenVeda AI 👋 I'm here to help you understand skin health and dermatology. I use real medical sources to give you accurate answers.\n\nWhat's on your mind today?",
  contextUsed: false,
};

const QUICK_REPLIES = [
  "I have a mole that changed colour",
  "My skin is itching badly",
  "I noticed a new growth on my skin",
  "What is the ABCDE rule?",
  "When should I see a doctor?",
  "View my scan results",
];

export default function PatientChat() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const tx = tr[lang].patient;

  const INITIAL_MESSAGE = {
    from: "ai",
    text: tx.chatGreeting,
    contextUsed: false,
  };

  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  // Reset greeting when language changes
  useEffect(() => {
    setMessages([{ from:"ai", text: tr[lang].patient.chatGreeting, contextUsed:false }]);
  }, [lang]);

  // Build history array for context — last 6 messages only
  const buildHistory = (msgs) =>
    msgs
      .filter((m) => m.from !== "system")
      .slice(-6)
      .map((m) => ({
        role: m.from === "user" ? "user" : "assistant",
        content: m.text,
      }));

  useEffect(() => {
    // Setup voice recognition
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = tx.chatVoiceLang || "en-US";
      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };
      rec.onend = () => setIsRecording(false);
      rec.onerror = () => setIsRecording(false);
      recognitionRef.current = rec;
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser.");
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

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    // Handle navigation shortcuts locally (no API call needed)
    if (trimmed.toLowerCase().includes("scan result") || trimmed.toLowerCase().includes("view my scan")) {
      setMessages((prev) => [
        ...prev,
        { from: "user", text: trimmed },
        { from: "ai", text: "Sure! Let me take you to your Reports section where you can see all your scan results and doctor feedback. 📋", contextUsed: false, action: "reports" },
      ]);
      setInput("");
      setTimeout(() => navigate("/patient/reports"), 1800);
      return;
    }

    const userMsg = { from: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setError("");

    try {
      const history = buildHistory(messages);
      const res = await sendChatMessage(trimmed, history);
      const { reply, context_used } = res.data;

      setMessages((prev) => [
        ...prev,
        { from: "ai", text: cleanResponse(reply), contextUsed: context_used },
      ]);
    } catch (err) {
      const fallback = "I'm having trouble connecting right now. Please try again in a moment.";
      setMessages((prev) => [
        ...prev,
        { from: "ai", text: fallback, contextUsed: false, isError: true },
      ]);
      setError("Connection issue — please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <div style={s.header}>
        <button onClick={() => navigate("/patient/dashboard")} style={s.backBtn}>←</button>
        <div style={s.avatarWrap}>
          <div style={s.avatarEmoji}>🤖</div>
          <div style={{ width: "8px", height: "8px", background: "#22c55e", borderRadius: "50%", position: "absolute", bottom: "2px", right: "2px", border: "2px solid white" }} />
        </div>
        <div>
          <p style={{ fontWeight: "700", color: "var(--text-main)", margin: 0, fontSize: "15px" }}>GenVeda AI</p>
          <p style={{ fontSize: "11px", color: "#22c55e", margin: 0, fontWeight: "600" }}>● Powered by RAG + LLM</p>
        </div>
        <div style={s.headerBadge}>Skin Health Assistant</div>
      </div>

      {/* ── Source indicator ── */}
      <div style={s.sourceBanner}>
        🔍 Searches DuckDuckGo · PubMed · Wikipedia for real medical context
      </div>

      {/* ── Messages ── */}
      <div style={s.messages}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start", marginBottom: "14px", alignItems: "flex-end", gap: "8px" }}>
            {msg.from === "ai" && (
              <div style={s.aiAvatar}>🤖</div>
            )}
            <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: "4px", alignItems: msg.from === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                padding: "12px 16px",
                borderRadius: msg.from === "user" ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                background: msg.from === "user" ? "#004D40" : msg.isError ? "#fef2f2" : "var(--card-bg)",
                color: msg.from === "user" ? "#fff" : msg.isError ? "#dc2626" : "var(--text-main)",
                fontSize: "14px", lineHeight: 1.65, boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                whiteSpace: "pre-wrap",
                border: msg.isError ? "1px solid #fca5a5" : "none",
              }}>
                {msg.text}
                {/* Inline action buttons */}
                {msg.action === "reports" && (
                  <button onClick={() => navigate("/patient/reports")} style={s.inlineBtn}>
                    📋 Open Reports
                  </button>
                )}
                {msg.from === "ai" && !msg.isError && msg.text.includes("scan") && !msg.action && (
                  <button onClick={() => navigate("/patient/scan")} style={{ ...s.inlineBtn, background: "#004D40" }}>
                    🔬 Start New Scan
                  </button>
                )}
              </div>
              {/* RAG context indicator */}
              {msg.from === "ai" && msg.contextUsed && (
                <span style={s.sourcePill}>📚 Based on medical sources</span>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "14px" }}>
            <div style={s.aiAvatar}>🤖</div>
            <div style={s.typingBubble}>
              {[0, 0.15, 0.3].map((delay, i) => (
                <span key={i} style={{ ...s.typingDot, animationDelay: `${delay}s` }} />
              ))}
              <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "4px" }}>Searching medical sources...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Quick replies (show for first 2 AI msgs only) ── */}
      {messages.length <= 2 && !isTyping && (
        <div style={s.quickReplies}>
          {QUICK_REPLIES.map((r) => (
            <button key={r} onClick={() => sendMessage(r)} style={s.quickBtn}>{r}</button>
          ))}
        </div>
      )}

      {/* ── Input row ── */}
      <div style={s.inputArea}>
        {error && <p style={s.errorText}>{error}</p>}
        <div style={s.inputRow}>
          {/* Voice button — ( optional ) */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
            <button
              onClick={toggleVoice}
              title="Voice input ( optional )"
              style={{
                ...s.voiceBtn,
                background: isRecording ? "#fee2e2" : "#f1f5f9",
                color: isRecording ? "#dc2626" : "#64748b",
                animation: isRecording ? "pulse 1s infinite" : "none",
              }}
            >
              {isRecording ? "⏹" : "🎙"}
            </button>
            <span style={{ fontSize: "9px", color: "#94a3b8", fontStyle: "italic" }}>( optional )</span>
          </div>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
            }}
            placeholder="Ask about skin symptoms, conditions, or treatments..."
            style={s.input}
            disabled={isTyping}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            style={{ ...s.sendBtn, opacity: (!input.trim() || isTyping) ? 0.5 : 1 }}
          >
            ➤
          </button>
        </div>
        <p style={s.disclaimer}>
          GenVeda AI uses real-time medical search. Always consult a dermatologist for diagnosis.
        </p>
      </div>
    </div>
  );
}

const s = {
  page: { display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", width: "100%", padding: "0 32px", boxSizing: "border-box" },
  header: { display: "flex", alignItems: "center", gap: "12px", padding: "16px 0 10px", borderBottom: "1px solid var(--border-color)", flexShrink: 0 },
  backBtn: { background: "none", border: "none", color: "var(--text-muted)", fontSize: "20px", cursor: "pointer", padding: "0 4px 0 0", lineHeight: 1 },
  avatarWrap: { position: "relative", flexShrink: 0 },
  avatarEmoji: { width: "42px", height: "42px", background: "#e0f2f1", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" },
  headerBadge: { marginLeft: "auto", background: "#e0f2f1", color: "#004D40", fontSize: "10px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px", letterSpacing: "0.5px" },
  sourceBanner: { fontSize: "11px", color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "6px 12px", marginTop: "8px", textAlign: "center", flexShrink: 0 },
  messages: { flex: 1, overflowY: "auto", padding: "20px 4px 8px", display: "flex", flexDirection: "column" },
  aiAvatar: { width: "30px", height: "30px", background: "#e0f2f1", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 },
  typingBubble: { background: "var(--card-bg)", borderRadius: "20px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "4px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  typingDot: { width: "7px", height: "7px", background: "#94a3b8", borderRadius: "50%", display: "inline-block", animation: "bounce 1s infinite" },
  sourcePill: { fontSize: "10px", color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "2px 8px", borderRadius: "10px", fontWeight: "600" },
  inlineBtn: { display: "block", marginTop: "10px", background: "#10b981", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: "'Lexend', sans-serif", width: "100%" },
  quickReplies: { display: "flex", flexWrap: "wrap", gap: "8px", padding: "8px 0 4px", flexShrink: 0 },
  quickBtn: { background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "20px", padding: "7px 14px", fontSize: "12px", fontWeight: "600", cursor: "pointer", color: "var(--text-main)", fontFamily: "'Lexend', sans-serif", transition: "all 0.15s" },
  inputArea: { borderTop: "1px solid var(--border-color)", paddingTop: "10px", flexShrink: 0, paddingBottom: "6px" },
  errorText: { fontSize: "12px", color: "#dc2626", margin: "0 0 6px 0" },
  inputRow: { display: "flex", gap: "10px", alignItems: "flex-end" },
  voiceBtn: { width: "40px", height: "40px", borderRadius: "50%", border: "none", cursor: "pointer", fontSize: "17px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" },
  input: { flex: 1, padding: "11px 16px", borderRadius: "24px", border: "2px solid var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-main)", fontSize: "14px", outline: "none", fontFamily: "'Lexend', sans-serif", lineHeight: 1.5 },
  sendBtn: { width: "44px", height: "44px", borderRadius: "50%", background: "#004D40", color: "#fff", border: "none", cursor: "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "opacity 0.2s" },
  disclaimer: { fontSize: "10px", color: "#94a3b8", textAlign: "center", margin: "6px 0 0", fontStyle: "italic" },
};
