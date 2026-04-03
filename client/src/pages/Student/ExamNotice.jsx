// client/src/pages/Student/ExamNotice.jsx
import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
  : "http://localhost:8000";
const API = `${API_BASE}/api`;

/** ✅ common fetch with token */
async function apiFetch(path, { method = "GET", body } = {}) {
  const token = (localStorage.getItem("token") || "").trim();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) { localStorage.clear(); window.location.href = '/'; throw new Error('Session expired'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}

const pad2 = (n) => String(n).padStart(2, "0");
const fmtDT = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString();
};
const minsToHM = (m) => {
  const n = Number(m || 0);
  const h = Math.floor(n / 60);
  const mm = n % 60;
  if (h <= 0) return `${mm} min`;
  return `${h}h ${pad2(mm)}m`;
};

/** ✅ read student year/semester from localStorage user */
function getStudentYearSem() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return { year: null, semester: null };
    const u = JSON.parse(raw);

    // try common shapes
    const year =
      u?.year ??
      u?.student_year ??
      u?.academic_year ??
      u?.profile?.year ??
      u?.profile?.student_year ??
      null;

    const semester =
      u?.semester ??
      u?.sem ??
      u?.student_semester ??
      u?.academic_semester ??
      u?.profile?.semester ??
      u?.profile?.student_semester ??
      null;

    const y = year !== null && year !== undefined && String(year).trim() !== "" ? Number(year) : null;
    const s =
      semester !== null && semester !== undefined && String(semester).trim() !== ""
        ? Number(semester)
        : null;

    return {
      year: Number.isFinite(y) ? y : null,
      semester: Number.isFinite(s) ? s : null,
    };
  } catch {
    return { year: null, semester: null };
  }
}

/** ✅ Frontend safety filter (even if backend already filters) */
function filterExamsForNotice(list) {
  const now = Date.now();
  return (list || []).filter((e) => {
    // approved only (if column exists)
    const status = String(e?.approval_status ?? e?.status ?? "APPROVED").toUpperCase();
    const approved = status === "APPROVED" || status === "APPROVE" || status === "APPROVED_EXAM";

    // hide ended (needs end_at)
    const endMs = e?.end_at ? new Date(e.end_at).getTime() : NaN;
    const notEnded = Number.isNaN(endMs) ? true : now <= endMs;

    return approved && notEnded;
  });
}

export default function ExamNotice() {
  const [toast, setToast] = useState(null);
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  // ✅ student info (year/semester)
  const [studentYS, setStudentYS] = useState({ year: null, semester: null });

  // ✅ filters/data
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");

  const [exams, setExams] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);

  // optional: selected exam
  const [selectedExamId, setSelectedExamId] = useState("");
  // notice modal
  const [viewingExam, setViewingExam] = useState(null);

  const selectedSubject = useMemo(
    () => subjects.find((s) => String(s.id) === String(subjectId)),
    [subjects, subjectId]
  );

  const selectedExam = useMemo(
    () => exams.find((e) => String(e.id) === String(selectedExamId)),
    [exams, selectedExamId]
  );

  // ✅ Load all relevant exams (notices) for student's year/sem
  const loadNotices = async () => {
    try {
      setLoadingExams(true);
      setLoadingSubjects(true);

      const ys = getStudentYearSem();
      setStudentYS(ys);

      // 1) Fetch subjects for the dropdown
      const subRes = await apiFetch("/student/subjects");
      setSubjects(subRes.data || []);

      // 2) Fetch ALL exam notices for this student's year/sem
      const examRes = await apiFetch("/student/exams/notices");
      const list = filterExamsForNotice(examRes.data || []);
      setExams(list);

      if (list.length > 0) {
        setSelectedExamId(String(list[0].id));
      }
    } catch (e) {
      showToast("err", e.message);
    } finally {
      setLoadingExams(false);
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  // ✅ When subjectId changes, we can filter the already loaded exams
  const filteredExams = useMemo(() => {
    if (!subjectId) return exams;
    return exams.filter((e) => String(e.subject_id) === String(subjectId) || String(e.subject_code) === String(subjectId));
  }, [exams, subjectId]);

  const refresh = () => loadNotices();

  const now = Date.now();

  const closeNotice = () => setViewingExam(null);
  const openNotice = (e) => {
    setSelectedExamId(String(e.id));
    setViewingExam(e);
  };

  return (
    <div id="student-examnotice-root" style={sx.page}>
      {/* ✅ NOTICE MODAL */}
      {viewingExam && (
        <div id="student-examnotice-modal-overlay" style={sx.modalOverlay}>
          <div id="student-examnotice-modal-card" style={sx.modalCard}>
            <div id="student-examnotice-modal-head" style={sx.modalHead}>
              <div id="student-examnotice-modal-title" style={sx.modalTitle}>
                {viewingExam.title}
              </div>
              <button
                id="student-examnotice-modal-close"
                type="button"
                style={sx.modalX}
                onClick={closeNotice}
              >
                ✕
              </button>
            </div>

            <div id="student-examnotice-modal-body" style={sx.modalBody}>
              <div style={sx.modalSection}>
                <div style={sx.modalLabel}>Module Details</div>
                <div style={sx.modalValue}>
                  <b>{viewingExam.subject_code}</b> - {viewingExam.subject_name}
                </div>
                <div style={sx.modalMeta}>
                  Year {viewingExam.year} • Semester {viewingExam.semester}
                </div>
              </div>

              <div style={sx.modalSection}>
                <div style={sx.modalLabel}>Exam Notice / Description</div>
                <div style={sx.modalDescBox}>
                  {viewingExam.description || "No description provided."}
                </div>
              </div>

              <div style={sx.modalGrid}>
                <div style={sx.modalInfo}>
                  <div style={sx.modalLabel}>Schedule</div>
                  <div style={sx.modalValue}>Starts: {fmtDT(viewingExam.start_at)}</div>
                  <div style={sx.modalValue}>Ends: {fmtDT(viewingExam.end_at)}</div>
                </div>
                <div style={sx.modalInfo}>
                  <div style={sx.modalLabel}>Grading info</div>
                  <div style={sx.modalValue}>Pass: {viewingExam.pass_marks}</div>
                  <div style={sx.modalValue}>Total: {viewingExam.total_marks}</div>
                </div>
                <div style={sx.modalInfo}>
                  <div style={sx.modalLabel}>Duration</div>
                  <div style={sx.modalValue}>{minsToHM(viewingExam.duration_minutes)}</div>
                  <div style={sx.modalValue}>Late: {viewingExam.late_minutes} min</div>
                </div>
              </div>
            </div>

            <div id="student-examnotice-modal-foot" style={sx.modalFoot}>
              <button
                id="student-examnotice-modal-btn-close"
                type="button"
                style={{ ...sx.btn, ...sx.btnGhost }}
                onClick={closeNotice}
              >
                Close Notice
              </button>
              <button
                id="student-examnotice-modal-btn-refresh"
                type="button"
                style={{ ...sx.btn, ...sx.btnBlue }}
                onClick={() => {
                  refresh();
                  closeNotice();
                }}
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ✅ TOAST */}
      {toast && (
        <div
          id="student-examnotice-toast"
          style={{
            ...sx.toast,
            background: toast.type === "ok" ? "#027A48" : "#B42318",
          }}
        >
          <div style={{ fontWeight: 1000 }}>{toast.type === "ok" ? "Success" : "Error"}</div>
          <div style={{ opacity: 0.95, fontWeight: 800 }}>{toast.msg}</div>
          <button
            id="student-examnotice-toast-close"
            style={sx.toastX}
            onClick={() => setToast(null)}
            aria-label="close"
            type="button"
          >
            ✕
          </button>
        </div>
      )}

      {/* ✅ HEADER */}
      <div id="student-examnotice-head" style={sx.headCard}>
        <div>
          <div id="student-examnotice-title" style={sx.hTitle}>
            Exam Notice
          </div>
          <div id="student-examnotice-subtitle" style={sx.hSub}>
            Only your <b>Year {studentYS.year ?? "?"}</b> • <b>Semester {studentYS.semester ?? "?"}</b> subjects.
            Approved exams only. Auto-hide when exam ends.
          </div>
        </div>

        <div id="student-examnotice-head-actions" style={sx.headRight}>
          <div id="student-examnotice-badge-count" style={sx.pill}>
            {exams.length} exams
          </div>
          <button
            id="student-examnotice-refresh-btn"
            type="button"
            style={{ ...sx.btn, ...sx.btnGhost }}
            onClick={refresh}
            disabled={!subjectId || loadingExams}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ✅ FILTER CARD */}
      <div id="student-examnotice-filter-card" style={sx.card}>
        <div id="student-examnotice-filter-row" style={sx.filterRow}>
          <div id="student-examnotice-subject-field" style={sx.field}>
            <label id="student-examnotice-subject-label" style={sx.label}>
              Subject
            </label>
            <select
              id="student-examnotice-subject-select"
              style={sx.select}
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={loadingSubjects}
            >
              <option value="">All My Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
            <div id="student-examnotice-subject-meta" style={sx.meta}>
              {selectedSubject
                ? `Year ${selectedSubject.year} • Semester ${selectedSubject.semester}`
                : "Showing all approved notices"}
            </div>
          </div>

          <div id="student-examnotice-exam-field" style={sx.field}>
            <label id="student-examnotice-exam-label" style={sx.label}>
              Exam
            </label>
            <select
              id="student-examnotice-exam-select"
              style={sx.select}
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              disabled={loadingExams || exams.length === 0}
            >
              {filteredExams.length === 0 ? (
                <option value="">{loadingExams ? "Loading..." : "No approved exams"}</option>
              ) : (
                filteredExams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))
              )}
            </select>
            <div id="student-examnotice-exam-meta" style={sx.meta}>
              {selectedExam ? `Pass: ${selectedExam.pass_marks} • Total: ${selectedExam.total_marks}` : "—"}
            </div>
          </div>

          <div id="student-examnotice-status-field" style={sx.field}>
            <label id="student-examnotice-status-label" style={sx.label}>
              Status
            </label>
            <div id="student-examnotice-status-box" style={sx.statusBox}>
              {loadingExams ? "Loading..." : filteredExams.length ? "Approved" : "No exams"}
            </div>
            <div id="student-examnotice-status-hint" style={sx.meta}>
              Exams disappear after <b>end time</b>.
            </div>
          </div>
        </div>
      </div>

      {/* ✅ SELECTED EXAM DETAIL */}
      <div id="student-examnotice-detail-card" style={sx.card}>
        <div id="student-examnotice-detail-head" style={sx.detailHead}>
          <div>
            <div id="student-examnotice-detail-title" style={sx.detailTitle}>
              {selectedExam ? selectedExam.title : "No exam selected"}
            </div>
            <div id="student-examnotice-detail-sub" style={sx.detailSub}>
              {selectedExam?.description
                ? selectedExam.description
                : "Select a subject & exam to view full details."}
            </div>
          </div>

          {selectedExam && (
            <div id="student-examnotice-detail-pills" style={sx.pillRow}>
              <span id="student-examnotice-pill-pass" style={sx.pill}>
                Pass: {selectedExam.pass_marks}
              </span>
              <span id="student-examnotice-pill-total" style={sx.pill}>
                Total: {selectedExam.total_marks}
              </span>
              <span id="student-examnotice-pill-duration" style={sx.pill}>
                Duration: {minsToHM(selectedExam.duration_minutes)}
              </span>
              <span id="student-examnotice-pill-late" style={sx.pill}>
                Late: {Number(selectedExam.late_minutes || 0)} min
              </span>
            </div>
          )}
        </div>

        {selectedExam && (
          <div id="student-examnotice-detail-grid" style={sx.grid}>
            <div id="student-examnotice-detail-start" style={sx.infoCard}>
              <div style={sx.infoLabel}>Start</div>
              <div style={sx.infoValue}>{fmtDT(selectedExam.start_at)}</div>
            </div>

            <div id="student-examnotice-detail-end" style={sx.infoCard}>
              <div style={sx.infoLabel}>End</div>
              <div style={sx.infoValue}>{fmtDT(selectedExam.end_at)}</div>
            </div>

            <div id="student-examnotice-detail-timeleft" style={sx.infoCard}>
              <div style={sx.infoLabel}>Time</div>
              <div style={sx.infoValue}>
                {(() => {
                  const startMs = new Date(selectedExam.start_at).getTime();
                  const endMs = new Date(selectedExam.end_at).getTime();
                  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return "-";
                  if (now < startMs) return "Not started yet";
                  if (now > endMs) return "Ended (will auto-hide)";
                  const left = endMs - now;
                  const m = Math.ceil(left / 60000);
                  return `${m} min remaining`;
                })()}
              </div>
            </div>

            <div id="student-examnotice-detail-approval" style={sx.infoCard}>
              <div style={sx.infoLabel}>Approval</div>
              <div style={sx.infoValue}>{String(selectedExam.approval_status || "APPROVED")}</div>
            </div>
          </div>
        )}

        {/* ✅ TABLE LIST */}
        <div id="student-examnotice-table-head" style={sx.tableHead}>
          <div id="student-examnotice-table-title" style={sx.tTitle}>
            Approved Exam List
          </div>
          <div id="student-examnotice-table-count" style={sx.pill}>
            {filteredExams.length} notices
          </div>
        </div>

        <div id="student-examnotice-table-wrap" style={sx.tableWrap}>
          <table id="student-examnotice-table" style={sx.table}>
            <thead id="student-examnotice-thead">
              <tr>
                <th style={sx.th}>Module</th>
                <th style={sx.th}>Exam Title</th>
                <th style={sx.th}>Start</th>
                <th style={{ ...sx.th, textAlign: "right" }}>Action</th>
              </tr>
            </thead>

            <tbody id="student-examnotice-tbody">
              {loadingExams ? (
                <tr>
                  <td style={sx.td} colSpan={6}>
                    Loading...
                  </td>
                </tr>
              ) : filteredExams.length === 0 ? (
                <tr>
                  <td style={sx.tdEmpty} colSpan={6}>
                    No approved exams for your Year/Sem.
                  </td>
                </tr>
              ) : (
                filteredExams.map((e) => {
                  const startMs = new Date(e.start_at).getTime();
                  const endMs = new Date(e.end_at).getTime();
                  const isUpcoming = now < startMs;
                  const isLive = now >= startMs && now <= endMs;

                  const badgeStyle = isLive ? sx.badgeLive : isUpcoming ? sx.badgeUpcoming : sx.badgeEnded;
                  const badgeText = isLive ? "LIVE" : isUpcoming ? "UPCOMING" : "ENDED";

                  return (
                    <tr key={e.id}>
                      <td style={sx.td}>
                        <div style={{ fontWeight: 1000, color: "#475467" }}>{e.subject_code}</div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>{e.subject_name}</div>
                      </td>
                      <td style={sx.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ ...sx.badge, ...badgeStyle }}>{badgeText}</span>
                          <button
                            id={`student-examnotice-row-select-${e.id}`}
                            type="button"
                            style={sx.linkBtn}
                            onClick={() => setSelectedExamId(String(e.id))}
                          >
                            {e.title}
                          </button>
                        </div>
                      </td>
                      <td style={sx.td}>{fmtDT(e.start_at)}</td>
                      <td style={{ ...sx.td, textAlign: "right" }}>
                        <button
                          id={`student-examnotice-view-${e.id}`}
                          type="button"
                          style={{ ...sx.btnMini, ...sx.btnMiniBlue }}
                          onClick={() => openNotice(e)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div id="student-examnotice-note" style={sx.note}>
          Note: Showing only subjects that match your <b>Year/Sem</b>. Only <b>APPROVED</b> exams are shown.
          When exam <b>end time</b> passes, it will no longer appear here.
        </div>
      </div>
    </div>
  );
}

/* =========================
   STYLES
========================= */
const sx = {
  page: { padding: 18, maxWidth: 1200, margin: "0 auto" },

  toast: {
    position: "fixed",
    top: 18,
    right: 18,
    zIndex: 99999,
    color: "#fff",
    padding: "12px 14px",
    borderRadius: 16,
    minWidth: 280,
    maxWidth: 440,
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
  hSub: { marginTop: 6, color: "#667085", fontWeight: 800, fontSize: 13 },
  headRight: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },

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
    marginBottom: 14,
  },

  filterRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
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
  meta: { fontSize: 12, color: "#667085", fontWeight: 800 },

  statusBox: {
    border: "1px solid #E4E7EC",
    borderRadius: 12,
    padding: "10px 12px",
    fontWeight: 900,
    color: "#101828",
    background: "#FCFCFD",
  },

  btn: {
    border: "1px solid #E4E7EC",
    background: "#fff",
    padding: "10px 14px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 1000,
  },
  btnGhost: { background: "#fff", color: "#101828" },

  detailHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  detailTitle: { fontSize: 18, fontWeight: 1000, color: "#101828" },
  detailSub: { marginTop: 6, color: "#667085", fontWeight: 800, fontSize: 13, maxWidth: 760 },

  grid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
  },
  infoCard: {
    border: "1px solid #E4E7EC",
    borderRadius: 14,
    padding: 12,
    background: "#FCFCFD",
  },
  infoLabel: { fontSize: 12, color: "#667085", fontWeight: 900 },
  infoValue: { marginTop: 6, fontWeight: 1000, color: "#101828" },

  tableHead: {
    marginTop: 16,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  tTitle: { fontWeight: 1000, fontSize: 16, color: "#101828" },

  tableWrap: {
    marginTop: 10,
    border: "1px solid #E4E7EC",
    borderRadius: 14,
    overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "12px 14px",
    background: "#FCFCFD",
    borderBottom: "1px solid #E4E7EC",
    color: "#475467",
    fontWeight: 900,
    fontSize: 13,
  },
  td: {
    padding: "12px 14px",
    borderBottom: "1px solid #F2F4F7",
    fontWeight: 800,
    color: "#101828",
    verticalAlign: "middle",
  },
  tdEmpty: {
    padding: 18,
    textAlign: "center",
    color: "#667085",
    fontWeight: 900,
  },

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
  badgeLive: { background: "#ECFDF3", borderColor: "#ABEFC6", color: "#027A48" },
  badgeUpcoming: { background: "#EFF8FF", borderColor: "#B2DDFF", color: "#175CD3" },
  badgeEnded: { background: "#F2F4F7", borderColor: "#E4E7EC", color: "#344054" },

  btnMini: {
    border: "1px solid #E4E7EC",
    padding: "8px 10px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 1000,
    background: "#fff",
  },
  btnMiniBlue: { background: "#EFF8FF", borderColor: "#B2DDFF", color: "#175CD3" },

  btnBlue: {
    background: "#1570EF",
    borderColor: "#1570EF",
    color: "#fff",
  },

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(16, 24, 40, 0.6)",
    backdropFilter: "blur(6px)",
    zIndex: 100000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    background: "#fff",
    borderRadius: 24,
    width: "100%",
    maxWidth: 640,
    maxHeight: "90vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 24px 48px -12px rgba(16, 24, 40, 0.18)",
    border: "1px solid #E4E7EC",
    animation: "modalFadeIn 0.3s ease-out",
  },
  modalHead: {
    padding: "24px 24px 12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  modalTitle: { fontSize: 22, fontWeight: 1000, color: "#101828" },
  modalX: {
    border: "none",
    background: "#F2F4F7",
    width: 36,
    height: 36,
    borderRadius: 12,
    cursor: "pointer",
    fontSize: 16,
    fontWeight: 900,
    color: "#667085",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: { padding: 24, overflowY: "auto", flex: 1 },
  modalSection: { marginBottom: 20 },
  modalLabel: {
    fontSize: 13,
    fontWeight: 900,
    color: "#475467",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 6,
  },
  modalValue: { fontSize: 16, fontWeight: 900, color: "#101828" },
  modalMeta: { fontSize: 13, color: "#667085", fontWeight: 800, marginTop: 4 },
  modalDescBox: {
    marginTop: 10,
    padding: 16,
    background: "#F9FAFB",
    borderRadius: 16,
    border: "1px solid #EAECF0",
    color: "#344054",
    lineHeight: 1.6,
    fontWeight: 800,
    fontSize: 14,
    whiteSpace: "pre-wrap",
  },
  modalGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 10 },
  modalInfo: { display: "flex", flexDirection: "column", gap: 4 },
  modalFoot: {
    padding: 24,
    borderTop: "1px solid #EAECF0",
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    background: "#FCFCFD",
  },

  linkBtn: {
    border: "none",
    background: "transparent",
    color: "#101828",
    fontWeight: 1000,
    cursor: "pointer",
    padding: 0,
    textAlign: "left",
  },

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