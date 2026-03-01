// client/src/pages/Student/StudentResults.jsx
import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
  : "http://localhost:8000";
const API = `${API_BASE}/api`;

async function apiFetch(path, { method = "GET", body } = {}) {
  const token = (localStorage.getItem("token") || "").trim();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}

export default function StudentResults() {
  // ===== toast =====
  const [toast, setToast] = useState(null);
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3200);
  };

  // ===== filters =====
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");

  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState("");

  // ===== result =====
  const [loading, setLoading] = useState(false);
  const [examMeta, setExamMeta] = useState(null);
  const [result, setResult] = useState(null); // { total_marks, status, ... } or null

  const selectedExam = useMemo(
    () => exams.find((e) => String(e.id) === String(examId)),
    [exams, examId]
  );

  // =========================
  // Load my allowed subjects
  // =========================
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await apiFetch("/student/subjects");
        const list = res.data || [];
        setSubjects(list);
        setSubjectId(list.length ? String(list[0].id) : "");
      } catch (e) {
        showToast("err", e.message);
        setSubjects([]);
        setSubjectId("");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // =========================
  // Load exams by subject
  // =========================
  useEffect(() => {
    if (!subjectId) {
      setExams([]);
      setExamId("");
      setExamMeta(null);
      setResult(null);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/student/subjects/${subjectId}/exams`);
        const list = res.data || [];
        setExams(list);
        setExamId(list.length ? String(list[0].id) : "");
      } catch (e) {
        showToast("err", e.message);
        setExams([]);
        setExamId("");
      } finally {
        setLoading(false);
      }
    })();
  }, [subjectId]);

  // =========================
  // Load result when exam changes
  // =========================
  useEffect(() => {
    if (!examId) {
      setExamMeta(null);
      setResult(null);
      return;
    }

    (async () => {
      try {
        setLoading(true);

        // ✅ Student result endpoint
        // expected response: { ok:true, data:{ exam:{...}, result:{ total_marks, status, ... } } }
        const res = await apiFetch(`/student/exams/${examId}/result`);
        const payload = res.data || {};
        setExamMeta(payload.exam || null);
        setResult(payload.result || null);
      } catch (e) {
        // if backend returns 404 or "not submitted" etc.
        showToast("err", e.message);
        setExamMeta(null);
        setResult(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [examId]);

  // UI pills
  const title = examMeta?.title || selectedExam?.title || "-";
  const passMarks = examMeta?.pass_marks ?? selectedExam?.pass_marks ?? "-";
  const startAt = (examMeta?.start_at || selectedExam?.start_at)
    ? new Date(examMeta?.start_at || selectedExam?.start_at).toLocaleString()
    : "-";

  const status = String(result?.status || "").toUpperCase();
  const badgeStyle =
    status === "PASS"
      ? sx.badgePass
      : status === "FAIL"
      ? sx.badgeFail
      : status === "ABSENT"
      ? sx.badgeAbsent
      : sx.badgePending;

  return (
    <div id="student-results-page" style={sx.page}>
      {/* TOAST */}
      {toast && (
        <div
          id="student-results-toast"
          style={{
            ...sx.toast,
            background: toast.type === "ok" ? "#027A48" : "#B42318",
          }}
        >
          <div id="student-results-toast-title" style={{ fontWeight: 900 }}>
            {toast.type === "ok" ? "Success" : "Error"}
          </div>
          <div id="student-results-toast-msg" style={{ opacity: 0.95 }}>
            {toast.msg}
          </div>
          <button
            id="student-results-toast-close"
            style={sx.toastX}
            onClick={() => setToast(null)}
            aria-label="close"
          >
            ✕
          </button>
        </div>
      )}

      {/* HEADER */}
      <div id="student-results-headcard" style={sx.headCard}>
        <div id="student-results-head-left">
          <div id="student-results-title" style={sx.hTitle}>
            My Results
          </div>
          <div id="student-results-subtitle" style={sx.hSub}>
            Subject → Exam select pannitu, unga marks + PASS/FAIL status paakalaam.
          </div>
        </div>

        <div id="student-results-pillrow" style={sx.pillRow}>
          <span id="student-results-pill-exam" style={sx.pill}>
            Exam: {title}
          </span>
          <span id="student-results-pill-pass" style={sx.pill}>
            Pass: {passMarks}
          </span>
          <span id="student-results-pill-start" style={sx.pill}>
            Start: {startAt}
          </span>
        </div>
      </div>

      {/* FILTER CARD */}
      <div id="student-results-card" style={sx.card}>
        <div id="student-results-filterrow" style={sx.filterRow}>
          <div id="student-results-field-subject" style={sx.field}>
            <label id="student-results-label-subject" style={sx.label}>
              Subject
            </label>
            <select
              id="student-results-select-subject"
              style={sx.select}
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              {subjects.length === 0 ? (
                <option value="">No subjects</option>
              ) : (
                subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div id="student-results-field-exam" style={sx.field}>
            <label id="student-results-label-exam" style={sx.label}>
              Exam
            </label>
            <select
              id="student-results-select-exam"
              style={sx.select}
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              disabled={!subjectId}
            >
              {exams.length === 0 ? (
                <option value="">No exams</option>
              ) : (
                exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* RESULT CARD */}
        <div id="student-results-resultbox" style={sx.resultBox}>
          {loading ? (
            <div id="student-results-loading" style={sx.centerText}>
              Loading...
            </div>
          ) : !examId ? (
            <div id="student-results-noexam" style={sx.centerText}>
              Select an exam to view result.
            </div>
          ) : !result ? (
            <div id="student-results-nodata" style={sx.centerText}>
              No result found yet (maybe not submitted / not graded).
            </div>
          ) : (
            <div id="student-results-grid" style={sx.grid}>
              <div id="student-results-item-marks" style={sx.item}>
                <div id="student-results-item-marks-label" style={sx.itemLabel}>
                  Total Marks
                </div>
                <div id="student-results-item-marks-val" style={sx.itemValue}>
                  {result.total_marks ?? 0}
                </div>
              </div>

              <div id="student-results-item-status" style={sx.item}>
                <div id="student-results-item-status-label" style={sx.itemLabel}>
                  Status
                </div>
                <div id="student-results-item-status-val" style={sx.itemValue}>
                  <span id="student-results-status-badge" style={{ ...sx.badge, ...badgeStyle }}>
                    {String(result.status || "PENDING").toUpperCase()}
                  </span>
                </div>
              </div>

              <div id="student-results-item-note" style={sx.itemWide}>
                <div id="student-results-item-note-label" style={sx.itemLabel}>
                  Note
                </div>
                <div id="student-results-item-note-val" style={sx.noteText}>
                  If marks shows 0 or pending, staff side auto-grade / manual grade pannitu update aagum.
                </div>
              </div>
            </div>
          )}
        </div>

        <div id="student-results-footnote" style={sx.note}>
          You can filter by Subject and Exam. This page shows only <b>your</b> result.
        </div>
      </div>
    </div>
  );
}

/* =========================
   STYLES
========================= */
const sx = {
  page: { padding: 18, maxWidth: 1100, margin: "0 auto" },

  toast: {
    position: "fixed",
    top: 18,
    right: 18,
    zIndex: 99999,
    color: "#fff",
    padding: "12px 14px",
    borderRadius: 16,
    minWidth: 280,
    maxWidth: 420,
    boxShadow: "0 20px 60px rgba(0,0,0,.22)",
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },
  toastX: {
    marginLeft: "auto",
    border: "none",
    background: "rgba(255,255,255,.15)",
    color: "#fff",
    borderRadius: 10,
    width: 34,
    height: 34,
    cursor: "pointer",
    fontWeight: 1000,
  },

  headCard: {
    background: "#fff",
    border: "1px solid #E4E7EC",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,.04)",
    marginBottom: 14,
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "flex-start",
  },
  hTitle: { fontSize: 20, fontWeight: 1000, color: "#101828" },
  hSub: { marginTop: 6, color: "#667085", fontWeight: 700, fontSize: 13 },

  pillRow: { display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    height: 28,
    padding: "0 10px",
    borderRadius: 999,
    border: "1px solid #E4E7EC",
    background: "#FCFCFD",
    color: "#344054",
    fontWeight: 900,
    fontSize: 12,
    whiteSpace: "nowrap",
  },

  card: {
    background: "#fff",
    border: "1px solid #E4E7EC",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,.04)",
  },

  filterRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    alignItems: "end",
  },
  field: { display: "grid", gap: 8 },

  label: { fontSize: 13, fontWeight: 900, color: "#344054" },
  select: {
    width: "100%",
    border: "1px solid #E4E7EC",
    borderRadius: 12,
    padding: "10px 12px",
    outline: "none",
    fontWeight: 800,
    color: "#101828",
    background: "#fff",
  },

  resultBox: {
    marginTop: 14,
    border: "1px solid #E4E7EC",
    borderRadius: 14,
    background: "#FCFCFD",
    padding: 14,
  },
  centerText: {
    textAlign: "center",
    color: "#667085",
    fontWeight: 900,
    padding: 22,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  item: {
    background: "#fff",
    border: "1px solid #E4E7EC",
    borderRadius: 14,
    padding: 14,
  },
  itemWide: {
    gridColumn: "1 / -1",
    background: "#fff",
    border: "1px solid #E4E7EC",
    borderRadius: 14,
    padding: 14,
  },
  itemLabel: { fontSize: 12, color: "#667085", fontWeight: 900 },
  itemValue: { marginTop: 8, fontSize: 18, fontWeight: 1000, color: "#101828" },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid",
    fontWeight: 1000,
    fontSize: 12,
    whiteSpace: "nowrap",
  },
  badgePass: { background: "#ECFDF3", borderColor: "#ABEFC6", color: "#027A48" },
  badgeFail: { background: "#FEF3F2", borderColor: "#FECDCA", color: "#B42318" },
  badgeAbsent: { background: "#F2F4F7", borderColor: "#E4E7EC", color: "#344054" },
  badgePending: { background: "#EFF8FF", borderColor: "#B2DDFF", color: "#175CD3" },

  noteText: { marginTop: 8, color: "#475467", fontWeight: 800, lineHeight: 1.5 },

  note: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    background: "#FCFCFD",
    border: "1px dashed #E4E7EC",
    color: "#667085",
    fontWeight: 800,
    fontSize: 13,
  },
};