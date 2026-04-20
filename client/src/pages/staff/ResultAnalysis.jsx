// client/src/pages/staff/ResultAnalysis.jsx
import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
  : "http://localhost:8000/api";

export default function ResultAnalysis() {
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [examId, setExamId] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "API Error");
    return json;
  };

  const fetchSubjects = async () => {
    try {
      const res = await apiFetch("/staff/subjects");
      setSubjects(res.data || []);
    } catch (e) {
      showToast("err", e.message);
    }
  };

  const onSubjectChange = async (sid) => {
    setSubjectId(sid);
    setExamId("");
    setExams([]);
    setAnalysis(null);
    if (!sid) return;
    try {
      const res = await apiFetch(`/staff/subjects/${sid}/exams`);
      setExams(res.data || []);
    } catch (e) {
      showToast("err", e.message);
    }
  };

  const onExamChange = async (eid) => {
    setExamId(eid);
    if (!eid) {
      setAnalysis(null);
      return;
    }
    await fetchAnalysis(eid);
  };

  const fetchAnalysis = async (eid) => {
    try {
      setLoading(true);
      const res = await apiFetch(`/staff/exams/${eid}/analysis`);
      setAnalysis(res.data);
    } catch (e) {
      showToast("err", e.message);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!analysis) return;
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(21, 112, 239);
    doc.text("UniExam - Results Analysis Report", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Exam: ${analysis.examTitle}`, 14, 35);
    doc.text(`Total Marks: ${analysis.totalMarks} | Pass Marks: ${analysis.passMarks}`, 14, 42);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 49);

    const stats = [
      ["Metric", "Value"],
      ["Total Students Allowed", analysis.totalStudents],
      ["Students Attended", analysis.attendedCount],
      ["Students Absent", analysis.absentCount],
      ["Highest Mark Obtained", analysis.highestMark],
      ["Pass Percentage", `${analysis.passPercentage}%`],
    ];

    autoTable(doc, {
      startY: 55,
      head: [stats[0]],
      body: stats.slice(1),
      theme: "grid",
      headStyles: { fillStyle: "F9FAFB", textColor: "#475467" },
    });

    const dist = [
      ["Range (%)", "Student Count"],
      ["0 - 40%", analysis.distribution["0-40"]],
      ["40 - 60%", analysis.distribution["40-60"]],
      ["60 - 80%", analysis.distribution["60-80"]],
      ["80 - 100%", analysis.distribution["80-100"]],
    ];

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [dist[0]],
      body: dist.slice(1),
      theme: "striped",
    });

    doc.save(`Analysis_${analysis.examTitle.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <div style={sx.page} className="nx-analysis-page">
      <style>{`
        .dark .nx-analysis-page { color: #f3f4f6; }
        .dark #nx-analysis-card, .dark .nx-stat-card { 
          background: #111827 !important; border-color: #374151 !important; 
        }
        .dark .nx-title { color: #fff !important; }
        .dark .nx-subtitle, .dark .nx-label, .dark .nx-bar-label { color: #9ca3af !important; }
        .dark .nx-select { 
          background: #1f2937 !important; border-color: #374151 !important; color: #f3f4f6 !important; 
        }
        .dark .nx-stat-value, .dark .nx-bar-value { color: #fff !important; }
        .dark .nx-bar-bg { background: #1f2937 !important; }
        .dark .nx-analysis-empty { color: #4b5563 !important; }
      `}</style>
      {toast && (
        <div style={{ ...sx.toast, background: toast.type === "ok" ? "#027A48" : "#B42318" }}>
          {toast.msg}
        </div>
      )}

      <div style={sx.header}>
        <div>
          <h1 style={sx.title} className="nx-title font-black uppercase">Result Analysis</h1>
          <p style={sx.subtitle} className="nx-subtitle font-bold tracking-tight">Review exam performance, attendance, and score distribution.</p>
        </div>
        {analysis && (
          <button style={sx.btnPrimary} onClick={handleDownloadReport}>
            Download Analysis Report
          </button>
        )}
      </div>

      {/* Filters */}
      <div id="nx-analysis-card" style={sx.card}>
        <div style={sx.filterGrid}>
          <div style={sx.inputGroup}>
            <label style={sx.label} className="nx-label">Select Subject</label>
            <select
              style={sx.select}
              className="nx-select"
              value={subjectId}
              onChange={(e) => onSubjectChange(e.target.value)}
            >
              <option value="">-- Choose Subject --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div style={sx.inputGroup}>
            <label style={sx.label} className="nx-label">Select Exam</label>
            <select
              style={sx.select}
              className="nx-select"
              value={examId}
              onChange={(e) => onExamChange(e.target.value)}
              disabled={!subjectId}
            >
              <option value="">-- Choose Exam --</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({new Date(ex.start_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40 }}>Analyzing data...</div>}

      {analysis && !loading && (
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Stats Row */}
          <div style={sx.statsRow}>
            <StatCard label="Total Students" value={analysis.totalStudents} color="#1570EF" icon="👥" />
            <StatCard label="Attended" value={analysis.attendedCount} color="#027A48" icon="✅" />
            <StatCard label="Absent" value={analysis.absentCount} color="#B42318" icon="❌" />
            <StatCard label="Highest Mark" value={analysis.highestMark} color="#F79009" icon="🏆" />
            <StatCard label="Pass Percentage" value={`${analysis.passPercentage}%`} color="#7F56D9" icon="📈" />
          </div>

          {/* Chart Section */}
          <div id="nx-analysis-card" style={sx.card}>
            <h3 style={{ ...sx.label, fontSize: 14, marginBottom: 20, color: "#101828" }} className="nx-title">Performance Distribution (Score Ranges)</h3>
            <div style={sx.chartArea}>
              <Bar 
                label="0-40%" 
                count={analysis.distribution["0-40"]} 
                total={analysis.attendedCount} 
                color="#F04438" 
              />
              <Bar 
                label="40-60%" 
                count={analysis.distribution["40-60"]} 
                total={analysis.attendedCount} 
                color="#F79009" 
              />
              <Bar 
                label="60-80%" 
                count={analysis.distribution["60-80"]} 
                total={analysis.attendedCount} 
                color="#2E90FA" 
              />
              <Bar 
                label="80-100%" 
                count={analysis.distribution["80-100"]} 
                total={analysis.attendedCount} 
                color="#12B76A" 
              />
            </div>
          </div>
        </div>
      )}

      {!analysis && !loading && subjectId && examId && (
          <div style={{ padding: 60, textAlign: "center", color: "#667085" }}>
              No results data available for analysis.
          </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{ ...sx.card, flex: 1, minWidth: 220, padding: 24 }} className="nx-stat-card">
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ ...sx.iconBox, background: `${color}15`, color, borderRadius: 16 }}>{icon}</div>
        <div>
          <div style={{ ...sx.label, fontSize: 10, opacity: 0.8 }} className="nx-label">{label}</div>
          <div style={{ fontSize: 24, fontWeight: 1000, letterSpacing: "-0.02em" }} className="nx-stat-value">{value}</div>
        </div>
      </div>
    </div>
  );
}

function Bar({ label, count, total, color }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={sx.barWrapper}>
      <div style={sx.barLabel} className="nx-bar-label font-black uppercase text-[10px] tracking-widest">{label}</div>
      <div style={sx.barBg} className="nx-bar-bg border dark:border-gray-800">
        <div 
          style={{ 
            ...sx.barFill, 
            width: `${percentage}%`, 
            background: color,
            boxShadow: `0 0 15px ${color}40`
          }} 
        />
      </div>
      <div style={sx.barValue} className="nx-bar-value font-black text-xs">{count} students</div>
    </div>
  );
}

const sx = {
  page: { paddingBottom: 60 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 900, color: "#101828", letterSpacing: "-0.02em" },
  subtitle: { color: "#667085", fontSize: 13, marginTop: 4, fontWeight: 500 },
  card: { background: "#fff", borderRadius: 24, padding: 24, border: "1px solid #EAECF0", boxShadow: "0 4px 6px -1px #0000000a" },
  filterGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  inputGroup: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 11, fontWeight: 800, color: "#667085", textTransform: "uppercase", letterSpacing: "0.05em" },
  select: { padding: "10px 14px", borderRadius: 12, border: "1px solid #D0D5DD", fontSize: 13, outline: "none", fontWeight: 600 },
  btnPrimary: { background: "#1570EF", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", fontSize: 12 },
  statsRow: { display: "flex", flexWrap: "wrap", gap: 20 },
  iconBox: { width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 },
  chartArea: { display: "flex", flexDirection: "column", gap: 16, marginTop: 10 },
  barWrapper: { display: "grid", gridTemplateColumns: "70px 1fr 100px", alignItems: "center", gap: 16 },
  barLabel: { fontSize: 13, fontWeight: 600, color: "#475467" },
  barBg: { background: "#F2F4F7", height: 16, borderRadius: 8, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 8, transition: "width 0.8s ease-out" },
  barValue: { fontSize: 13, fontWeight: 600, color: "#101828", textAlign: "right" },
  toast: { position: "fixed", top: 20, right: 20, padding: "12px 24px", borderRadius: 12, color: "#fff", fontWeight: 700, zIndex: 1000, boxShadow: "0 10px 15px -3px #0000001a" },
};
