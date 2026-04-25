import { useState, useEffect } from "react";
import { getPatients, getScans } from "../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, scans: 0, highRisk: 0 });
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, scansRes] = await Promise.all([
          getPatients(),
          getScans()
        ]);
        
        const highRisk = scansRes.data.filter(s => s.risk_category === "HIGH").length;
        
        setStats({
          users: patientsRes.data.length,
          scans: scansRes.data.length,
          highRisk: highRisk
        });
        setScans(scansRes.data.slice(0, 10)); // Top 10 recent
      } catch (err) {
        console.error("Admin fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>System Administration</h1>
        <p style={styles.subtitle}>Monitor system health, users, and diagnostic logs.</p>
      </header>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>TOTAL PATIENTS</p>
          <p style={styles.statValue}>{stats.users}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>TOTAL SCANS</p>
          <p style={styles.statValue}>{stats.scans}</p>
        </div>
        <div style={styles.statCard}>
          <p style={{...styles.statLabel, color: "#ef4444"}}>CRITICAL CASES</p>
          <p style={{...styles.statValue, color: "#ef4444"}}>{stats.highRisk}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>SYSTEM STATUS</p>
          <p style={{...styles.statValue, color: "#10b981"}}>ACTIVE</p>
        </div>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.tableCard}>
          <h2 style={styles.sectionTitle}>Recent Diagnostic Logs</h2>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Patient</th>
                <th style={styles.th}>Diagnosis</th>
                <th style={styles.th}>Risk</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {scans.map(s => (
                <tr key={s.id} style={styles.tr}>
                  <td style={styles.td}>GV-{String(s.patient).padStart(4, '0')}</td>
                  <td style={styles.td}>{s.predicted_disease}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.pill,
                      background: s.risk_category === "HIGH" ? "#fee2e2" : "#f1f5f9",
                      color: s.risk_category === "HIGH" ? "#ef4444" : "#475569"
                    }}>{s.risk_category}</span>
                  </td>
                  <td style={styles.td}>{s.is_reviewed ? "Reviewed" : "Pending"}</td>
                  <td style={styles.td}>{new Date(s.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={styles.sideCard}>
          <h2 style={styles.sectionTitle}>System Logs</h2>
          <div style={styles.logList}>
            <div style={styles.logItem}>
              <span style={styles.logDot} />
              <div>
                <p style={styles.logText}>Backup completed successfully</p>
                <p style={styles.logTime}>2 hours ago</p>
              </div>
            </div>
            <div style={styles.logItem}>
              <span style={{...styles.logDot, background: "#3b82f6"}} />
              <div>
                <p style={styles.logText}>Blockchain hash synchronized</p>
                <p style={styles.logTime}>5 hours ago</p>
              </div>
            </div>
            <div style={styles.logItem}>
              <span style={{...styles.logDot, background: "#f59e0b"}} />
              <div>
                <p style={styles.logText}>New Health Worker registered</p>
                <p style={styles.logTime}>Yesterday</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "40px", background: "var(--bg-secondary)", minHeight: "100vh" },
  header: { marginBottom: "40px" },
  title: { fontSize: "32px", fontWeight: "800", color: "var(--text-main)", marginBottom: "8px" },
  subtitle: { fontSize: "16px", color: "var(--text-muted)" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px", marginBottom: "40px" },
  statCard: { background: "#fff", padding: "24px", borderRadius: "24px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-color)" },
  statLabel: { fontSize: "12px", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px" },
  statValue: { fontSize: "28px", fontWeight: "800", color: "var(--text-main)", margin: 0 },
  mainGrid: { display: "grid", gridTemplateColumns: "1fr 340px", gap: "32px" },
  tableCard: { background: "#fff", padding: "32px", borderRadius: "32px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-color)" },
  sectionTitle: { fontSize: "20px", fontWeight: "800", color: "var(--text-main)", marginBottom: "24px" },
  table: { width: "100%", borderCollapse: "collapse" },
  thRow: { borderBottom: "2px solid var(--border-color)" },
  th: { textAlign: "left", padding: "12px", fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" },
  tr: { borderBottom: "1px solid var(--border-color)" },
  td: { padding: "16px 12px", fontSize: "14px", color: "var(--text-main)" },
  pill: { padding: "4px 12px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" },
  sideCard: { background: "#fff", padding: "32px", borderRadius: "32px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-color)" },
  logList: { display: "flex", flexDirection: "column", gap: "24px" },
  logItem: { display: "flex", gap: "16px" },
  logDot: { width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", marginTop: "5px", flexShrink: 0 },
  logText: { fontSize: "14px", fontWeight: "600", color: "var(--text-main)", margin: 0 },
  logTime: { fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0 0" }
};
