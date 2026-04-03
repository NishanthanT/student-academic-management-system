// client/src/pages/staff/AllowStudents.jsx
// ✅ Allow Students (BACKEND CONNECTED)
// ✅ Shows Approved exams (created by this staff) that already have Questions
// ✅ Subject filter + Search + Refresh + Clear
// ✅ Manage Students opens modal (no route change required)
// ✅ All fields/buttons have unique IDs

import React, { useEffect, useMemo, useState } from "react";

/* =========================
   CONFIG
========================= */
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

  if (res.status === 401) { localStorage.clear(); window.location.href = '/'; throw new Error('Session expired'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}

/* =========================
   HELPERS
========================= */
function fmtDateTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeStatus(exam) {
  const s = (exam?.approval_status || exam?.status || "").toString().toLowerCase();
  return s || "draft";
}

function badgeClass(status) {
  switch (status) {
    case "approved":
      return "as-badge as-badge--approved";
    case "pending":
      return "as-badge as-badge--pending";
    case "changes_requested":
      return "as-badge as-badge--changes";
    case "rejected":
      return "as-badge as-badge--rejected";
    default:
      return "as-badge";
  }
}

function statusLabel(status) {
  switch (status) {
    case "approved":
      return "APPROVED";
    case "pending":
      return "PENDING";
    case "changes_requested":
      return "CHANGES";
    case "rejected":
      return "REJECTED";
    case "draft":
      return "DRAFT";
    default:
      return (status || "").toUpperCase();
  }
}

/* =========================
   SMALL UI
========================= */
function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div
      className={`as-toast ${toast.type === "success" ? "ok" : "err"}`}
      id="toast_allow_students"
    >
      <span>{toast.message}</span>
      <button
        className="as-icon-btn"
        id="btn_close_toast_allow_students"
        onClick={onClose}
        aria-label="close"
      >
        ✕
      </button>
    </div>
  );
}

function ManageStudentsModal({
  open,
  exam,
  busy,
  onClose,
  onToast,
  onRefreshTopTable,
}) {
  const examId = exam?.id;

  // API paths
  const PATH_SAVE_QUIZ = (id) => `/staff/exams/${id}/quiz-settings`;
  const PATH_ALLOWED_LIST = (id) => `/staff/exams/${id}/allowed-students`;
  const PATH_ADD_ALLOWED = (id) => `/staff/exams/${id}/allowed-students`;
  const PATH_REVOKE = (id, studentId) => `/staff/exams/${id}/allowed-students/${studentId}/revoke`;
  const PATH_APPROVE_ALL = (id) => `/staff/exams/${id}/allowed-students/approve-all`;
  const PATH_SEARCH_STUDENTS = `/staff/students/search`;

  const [localBusy, setLocalBusy] = useState(false);

  // password
  const [password, setPassword] = useState("");
  const [lateMinutes, setLateMinutes] = useState(15);

  // search
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // allowed list
  const [allowed, setAllowed] = useState([]);

  const effectiveBusy = !!busy || localBusy;

  const loadAllowed = async () => {
    if (!examId) return;
    try {
      setLocalBusy(true);
      const res = await apiFetch(PATH_ALLOWED_LIST(examId));
      const list = Array.isArray(res?.data) ? res.data : [];
      setAllowed(list);
    } catch (e) {
      onToast?.("error", e.message || "Failed to load allowed students");
    } finally {
      setLocalBusy(false);
    }
  };

  useEffect(() => {
    if (open && examId) {
      setPassword("");
      setLateMinutes(15);
      setSearchResults([]);
      setSearchQ("");
      setYear("");
      setSemester("");
      loadAllowed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, examId]);

  if (!open) return null;

  const savePassword = async () => {
    if (!examId) return;
    if (!password || password.trim().length < 4) {
      onToast?.("error", "Password min 4 chars");
      return;
    }
    try {
      setLocalBusy(true);
      const res = await apiFetch(PATH_SAVE_QUIZ(examId), {
        method: "PUT",
        body: { password: password.trim(), late_minutes: lateMinutes },
      });
      onToast?.("success", res?.message || "Password saved");
      // refresh exams table (so SET shows)
      onRefreshTopTable?.();
    } catch (e) {
      onToast?.("error", e.message || "Save failed");
    } finally {
      setLocalBusy(false);
    }
  };

  const searchStudents = async () => {
    try {
      setLocalBusy(true);
      const qp = new URLSearchParams();
      if (searchQ.trim()) qp.set("q", searchQ.trim());
      if (year) qp.set("year", year);
      if (semester) qp.set("semester", semester);

      const res = await apiFetch(`${PATH_SEARCH_STUDENTS}?${qp.toString()}`);
      const list = Array.isArray(res?.data) ? res.data : [];
      setSearchResults(list);
      if (!list.length) onToast?.("error", "No students found");
    } catch (e) {
      onToast?.("error", e.message || "Search failed");
    } finally {
      setLocalBusy(false);
    }
  };

  const addStudent = async (studentId) => {
    if (!examId) return;
    try {
      setLocalBusy(true);
      const res = await apiFetch(PATH_ADD_ALLOWED(examId), {
        method: "POST",
        body: { student_id: studentId },
      });
      onToast?.("success", res?.message || "Student allowed");
      await loadAllowed();
      onRefreshTopTable?.();
    } catch (e) {
      onToast?.("error", e.message || "Add failed");
    } finally {
      setLocalBusy(false);
    }
  };

  const revokeStudent = async (studentId) => {
    if (!examId) return;
    const ok = window.confirm("Revoke this student?");
    if (!ok) return;

    try {
      setLocalBusy(true);
      const res = await apiFetch(PATH_REVOKE(examId, studentId), { method: "PATCH" });
      onToast?.("success", res?.message || "Revoked");
      await loadAllowed();
      onRefreshTopTable?.();
    } catch (e) {
      onToast?.("error", e.message || "Revoke failed");
    } finally {
      setLocalBusy(false);
    }
  };

  const approveAll = async () => {
    if (!examId) return;
    try {
      setLocalBusy(true);
      const res = await apiFetch(PATH_APPROVE_ALL(examId), { method: "PATCH" });
      onToast?.("success", res?.message || "Approved all");
      await loadAllowed();
    } catch (e) {
      onToast?.("error", e.message || "Approve all failed");
    } finally {
      setLocalBusy(false);
    }
  };

  const allowedSorted = (allowed || []).slice().sort((a, b) => Number(b.id) - Number(a.id));

  return (
    <>
      <div className="as-backdrop" id="backdrop_manage_students" onClick={onClose} />
      <div className="as-modal as-modal--xl" role="dialog" aria-modal="true">
        <div className="as-modal__head">
          <div>
            <div style={{ fontWeight: 900, fontSize: 16 }} id="ms_modal_title">
              Manage Students — {exam?.title || "Exam"}
            </div>
            <div className="as-muted" id="ms_modal_subtitle">
              Password set + Add students + Approve + Update/Delete
            </div>
          </div>

          <button
            className="as-icon-btn"
            id="btn_close_manage_students_modal"
            onClick={onClose}
            aria-label="close"
          >
            ✕
          </button>
        </div>

        <div className="as-modal__body">
          {/* Exam Summary */}
          <div className="as-card" id="ms_exam_summary_card">
            <div className="as-grid as-grid--4">
              <div>
                <div className="as-muted">Subject</div>
                <div style={{ fontWeight: 900 }} id="ms_exam_subject">
                  {exam?._subject_code ? `${exam._subject_code} — ` : ""}
                  {exam?._subject_name || "-"}
                </div>
              </div>
              <div>
                <div className="as-muted">Schedule</div>
                <div style={{ fontWeight: 900 }} id="ms_exam_schedule">
                  {fmtDateTime(exam?.start_at)} → {fmtDateTime(exam?.end_at)}
                </div>
              </div>
              <div>
                <div className="as-muted">Duration</div>
                <div style={{ fontWeight: 900 }} id="ms_exam_duration">
                  {exam?.duration_minutes ? `${exam.duration_minutes} mins` : "-"}
                </div>
              </div>
              <div>
                <div className="as-muted">Total Marks</div>
                <div style={{ fontWeight: 900 }} id="ms_exam_total_marks">
                  {exam?.total_marks ?? "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="as-card" style={{ marginTop: 12 }} id="ms_password_card">
            <div className="as-row" style={{ justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 900 }} id="ms_password_title">
                  Quiz Password
                </div>
                <div className="as-muted" id="ms_password_hint">
                  Staff sets password. Student can start only within password expiry window.
                </div>
              </div>
              <span className="as-pill" id="ms_password_status">
                {exam?.password_set ? "SET" : "NOT SET"}
              </span>
            </div>

            <div className="as-row" style={{ marginTop: 10, alignItems: "end" }}>
              <div style={{ flex: 2, minWidth: 260 }}>
                <label className="as-label" htmlFor="ms_input_password">
                  Password
                </label>
                <input
                  id="ms_input_password"
                  className="as-input"
                  placeholder="Enter quiz password..."
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={effectiveBusy}
                />
              </div>

              <div style={{ minWidth: 180 }}>
                <label className="as-label" htmlFor="ms_input_late_minutes">
                  Late minutes
                </label>
                <input
                  id="ms_input_late_minutes"
                  className="as-input"
                  type="number"
                  min={0}
                  value={lateMinutes}
                  onChange={(e) => setLateMinutes(Number(e.target.value || 0))}
                  disabled={effectiveBusy}
                />
              </div>

              <div style={{ minWidth: 170 }}>
                <button
                  className="as-btn as-btn--primary"
                  id="ms_btn_save_password"
                  onClick={savePassword}
                  disabled={effectiveBusy}
                >
                  {effectiveBusy ? "Saving..." : "Save Password"}
                </button>
              </div>
            </div>
          </div>

          {/* Search Students */}
          <div className="as-card" style={{ marginTop: 12 }} id="ms_add_students_card">
            <div style={{ fontWeight: 900 }} id="ms_add_students_title">
              Add Students
            </div>
            <div className="as-muted" id="ms_add_students_hint">
              Filter by Year/Sem + search student ID/email/name. Add to allowed list.
            </div>

            <div className="as-row" style={{ marginTop: 10 }}>
              <div style={{ minWidth: 180 }}>
                <label className="as-label" htmlFor="ms_filter_year">
                  Year
                </label>
                <select
                  id="ms_filter_year"
                  className="as-input"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  disabled={effectiveBusy}
                >
                  <option value="">Any</option>
                  {[1, 2, 3, 4].map((y) => (
                    <option key={y} value={String(y)} id={`ms_opt_year_${y}`}>
                      Year {y}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ minWidth: 180 }}>
                <label className="as-label" htmlFor="ms_filter_sem">
                  Semester
                </label>
                <select
                  id="ms_filter_sem"
                  className="as-input"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  disabled={effectiveBusy}
                >
                  <option value="">Any</option>
                  {[1, 2].map((s) => (
                    <option key={s} value={String(s)} id={`ms_opt_sem_${s}`}>
                      Sem {s}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 2, minWidth: 260 }}>
                <label className="as-label" htmlFor="ms_search_student">
                  Search Student
                </label>
                <input
                  id="ms_search_student"
                  className="as-input"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search by student ID / name / email..."
                  disabled={effectiveBusy}
                />
              </div>

              <div style={{ minWidth: 160, alignSelf: "end" }}>
                <button
                  className="as-btn"
                  id="ms_btn_search_students"
                  onClick={searchStudents}
                  disabled={effectiveBusy}
                >
                  Search
                </button>
              </div>
            </div>

            {/* Search Results */}
            <div className="as-note" style={{ marginTop: 10 }} id="ms_search_results_note">
              {!searchResults.length ? (
                <span className="as-muted">Search results will show here.</span>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {searchResults.map((u) => (
                    <div
                      key={u.id}
                      id={`ms_search_row_${u.id}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "center",
                        border: "1px solid #e4e7ec",
                        borderRadius: 12,
                        padding: 10,
                        background: "#fff",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 900 }} id={`ms_search_name_${u.id}`}>
                          {u.name || "Student"} (ID: {u.id})
                        </div>
                        <div className="as-muted" id={`ms_search_email_${u.id}`}>
                          {u.email || "-"} • Y{u.current_year ?? "-"} S{u.current_semester ?? "-"}
                        </div>
                      </div>

                      <button
                        className="as-btn as-btn--primary"
                        id={`ms_btn_add_student_${u.id}`}
                        onClick={() => addStudent(u.id)}
                        disabled={effectiveBusy}
                      >
                        Allow
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Allowed Students */}
          <div className="as-card" style={{ marginTop: 12 }} id="ms_allowed_students_card">
            <div className="as-row" style={{ justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 900 }} id="ms_allowed_students_title">
                  Allowed Students
                </div>
                <div className="as-muted" id="ms_allowed_students_hint">
                  Revoke / Approve All.
                </div>
              </div>
              <div className="as-row" style={{ gap: 10 }}>
                <button
                  className="as-btn as-btn--primary"
                  id="ms_btn_approve_all"
                  onClick={approveAll}
                  disabled={effectiveBusy}
                >
                  Approve All
                </button>
              </div>
            </div>

            <div className="as-tablewrap" style={{ marginTop: 10 }}>
              <div className="as-scroll">
                <table id="ms_table_allowed_students">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>#</th>
                      <th>Student</th>
                      <th style={{ width: 140 }}>Year/Sem</th>
                      <th style={{ width: 140 }}>Status</th>
                      <th style={{ width: 140 }}>Approved</th>
                      <th style={{ width: 160 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!allowedSorted.length ? (
                      <tr>
                        <td colSpan={6} className="as-empty" id="ms_allowed_students_empty">
                          No allowed students yet.
                        </td>
                      </tr>
                    ) : (
                      allowedSorted.map((r, idx) => (
                        <tr key={r.id} id={`ms_allowed_row_${r.id}`}>
                          <td>{idx + 1}</td>
                          <td>
                            <div style={{ fontWeight: 900 }}>
                              {r.name || "Student"} (ID: {r.student_id})
                            </div>
                            <div className="as-muted">{r.email || "-"}</div>
                          </td>
                          <td>
                            Y{r.current_year ?? "-"} S{r.current_semester ?? "-"}
                          </td>
                          <td>
                            <span className="as-pill">{String(r.status || "").toUpperCase()}</span>
                          </td>
                          <td>
                            <span className="as-pill">
                              {r.approved ? "YES" : "NO"}
                            </span>
                          </td>
                          <td>
                            <button
                              className="as-btn"
                              id={`ms_btn_revoke_${r.student_id}`}
                              onClick={() => revokeStudent(r.student_id)}
                              disabled={effectiveBusy}
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="as-muted" style={{ marginTop: 10 }} id="ms_footer_hint">
              Tip: Approve All வேலை செய்ய password set இருக்கணும்.
            </div>
          </div>
        </div>

        <div className="as-modal__foot">
          <button className="as-btn as-btn--ghost" id="ms_btn_close_footer" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </>
  );
}

/* =========================
   MAIN PAGE
========================= */
export default function AllowStudents() {
  // API paths
  const PATH_SUBJECTS = "/staff/subjects";
  const PATH_ALLOW_EXAMS = "/staff/allow-exams";

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);

  // filters
  const [subjectId, setSubjectId] = useState("all");
  const [q, setQ] = useState("");

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [activeExam, setActiveExam] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    window.clearTimeout(window.__asToast);
    window.__asToast = window.setTimeout(() => setToast(null), 3200);
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      const [sRes, eRes] = await Promise.all([
        apiFetch(PATH_SUBJECTS),
        apiFetch(PATH_ALLOW_EXAMS).catch(() => ({ ok: true, data: [] })),
      ]);

      const sList = Array.isArray(sRes?.data) ? sRes.data : sRes?.data?.data || [];
      const eList = Array.isArray(eRes?.data) ? eRes.data : eRes?.data?.data || [];

      setSubjects(sList);
      setExams(eList);
    } catch (e) {
      showToast("error", e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enrichedExams = useMemo(() => {
    return (exams || []).map((x) => {
      const st = normalizeStatus(x);
      const qc = Number(x.question_count ?? x.questions_count ?? x.q_count ?? 0) || 0;

      return {
        ...x,
        _status: st,
        _question_count: qc,
        _allowed_count: Number(x.allowed_count ?? x.allowed_students ?? 0) || 0,
        _subject_id: String(x.subject_id ?? ""),
        _subject_code: x.subject_code || x._subject_code || "",
        _subject_name: x.subject_name || x._subject_name || "",
        password_set: !!(x.password_set === 1 || x.password_set === true),
      };
    });
  }, [exams]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return enrichedExams
      .filter((x) => {
        if (x._status !== "approved") return false;
        if (Number(x._question_count) <= 0) return false;

        if (subjectId !== "all" && String(x._subject_id) !== String(subjectId)) return false;

        if (qq) {
          const hay = `${x.title || ""} ${x._subject_code} ${x._subject_name}`.toLowerCase();
          if (!hay.includes(qq)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.start_at || 0) - new Date(a.start_at || 0));
  }, [enrichedExams, subjectId, q]);

  const openManage = (exam) => {
    setActiveExam(exam);
    setModalOpen(true);
  };

  return (
    <div className="as-page">
      <style>{`
        .as-page{padding:24px;max-width:1200px;margin:0 auto}
        .as-top{display:flex;gap:16px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
        .as-title h1{margin:0;font-size:22px}
        .as-title p{margin:6px 0 0;color:#667085}
        .as-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
        .as-btn{border:1px solid #e4e7ec;background:#fff;padding:10px 12px;border-radius:10px;cursor:pointer;font-weight:900}
        .as-btn:disabled{opacity:.6;cursor:not-allowed}
        .as-btn--primary{background:#2563EB;border-color:#2563EB;color:#fff}
        .as-btn--ghost{background:#fff}
        .as-icon-btn{border:none;background:transparent;cursor:pointer;font-size:16px}
        .as-row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
        .as-input{width:100%;border:1px solid #e4e7ec;border-radius:10px;padding:10px 12px;outline:none}
        .as-label{display:block;font-size:13px;font-weight:900;margin-bottom:6px}
        .as-muted{color:#667085;font-size:13px}
        .as-filters{border:1px solid #e4e7ec;border-radius:14px;padding:14px;background:#fff;margin-top:14px}
        .as-filters .as-row > div{min-width:180px;flex:1}
        .as-tablewrap{margin-top:14px;border:1px solid #e4e7ec;border-radius:14px;overflow:hidden;background:#fff}
        .as-scroll{overflow:auto}
        table{width:100%;border-collapse:collapse;min-width:980px}
        th,td{padding:12px 12px;border-bottom:1px solid #f2f4f7;text-align:left;font-size:14px;vertical-align:top}
        th{background:#fcfcfd;font-size:12px;color:#667085;text-transform:uppercase;letter-spacing:.04em}
        .as-empty{padding:24px;text-align:center;color:#667085}
        .as-pill{display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:28px;border-radius:999px;background:#f2f4f7;color:#344054;font-weight:900;padding:0 10px}
        .as-note{border:1px solid #e4e7ec;background:#fcfcfd;padding:10px 12px;border-radius:12px}
        .as-badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:900;border:1px solid #e4e7ec}
        .as-badge--approved{background:#ecfdf3;color:#027a48;border-color:#abefc6}
        .as-badge--pending{background:#eff8ff;color:#175cd3;border-color:#b2ddff}
        .as-badge--changes{background:#fff7ed;color:#9a3412;border-color:#fed7aa}
        .as-badge--rejected{background:#fef3f2;color:#b42318;border-color:#fda29b}
        .as-toast{position:fixed;top:18px;right:18px;z-index:9999;display:flex;gap:12px;align-items:center;max-width:380px;padding:12px 14px;border-radius:14px;color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.12)}
        .as-toast.ok{background:#027a48}
        .as-toast.err{background:#b42318}
        .as-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:9998}
        .as-modal{position:fixed;z-index:9999;left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,calc(100% - 24px));background:#fff;border-radius:16px;border:1px solid #e4e7ec;overflow:hidden}
        .as-modal--xl{width:min(980px,calc(100% - 24px))}
        .as-modal__head{display:flex;justify-content:space-between;align-items:flex-start;padding:14px 16px;border-bottom:1px solid #f2f4f7}
        .as-modal__body{padding:16px;max-height:70vh;overflow:auto}
        .as-modal__foot{display:flex;justify-content:flex-end;gap:10px;padding:14px 16px;border-top:1px solid #f2f4f7}
        .as-card{border:1px solid #e4e7ec;border-radius:14px;background:#fff;padding:14px}
        .as-grid{display:grid;gap:12px}
        .as-grid--4{grid-template-columns:repeat(4,minmax(0,1fr))}
        @media (max-width: 860px){
          .as-grid--4{grid-template-columns:1fr 1fr}
        }
        @media (max-width: 640px){
          .as-page{padding:14px}
          table{min-width:920px}
          .as-filters .as-row > div{min-width:unset}
        }
      `}</style>

      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="as-top">
        <div className="as-title">
          <h1 id="page_title_allow_students">Allow Students</h1>
          <p id="page_subtitle_allow_students">
            Only approved exams with questions will appear here. Manage allowed students & quiz password.
          </p>
        </div>

        <div className="as-actions">
          <button
            className="as-btn as-btn--ghost"
            id="btn_refresh_allow_students"
            onClick={loadAll}
            disabled={loading || busy}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="as-filters" id="card_filters_allow_students">
        <div className="as-row">
          <div>
            <label className="as-label" htmlFor="dropdown_subject_filter_allow_students">
              Subject (Assigned)
            </label>
            <select
              className="as-input"
              id="dropdown_subject_filter_allow_students"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={loading || busy}
            >
              <option value="all" id="opt_subject_all_allow_students">
                All subjects
              </option>
              {subjects.map((s) => (
                <option
                  key={s.id}
                  value={String(s.id)}
                  id={`opt_subject_${s.id}_allow_students`}
                >
                  {s.code ? `${s.code} — ` : ""}
                  {s.name} {s.year && s.semester ? `(Y${s.year}S${s.semester})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 2, minWidth: 240 }}>
            <label className="as-label" htmlFor="input_search_exam_allow_students">
              Search exam
            </label>
            <input
              id="input_search_exam_allow_students"
              className="as-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by exam title / subject..."
              disabled={loading || busy}
            />
          </div>

          <div style={{ minWidth: 160, alignSelf: "end" }}>
            <button
              className="as-btn"
              id="btn_clear_filters_allow_students"
              onClick={() => {
                setSubjectId("all");
                setQ("");
              }}
              disabled={loading || busy}
              style={{ width: "100%" }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="as-empty" id="msg_loading_allow_students">
          Loading exams...
        </div>
      ) : filtered.length === 0 ? (
        <div className="as-empty" id="msg_empty_allow_students">
          <div style={{ fontWeight: 900, marginBottom: 6 }}>No eligible exams found</div>
          <div className="as-muted" style={{ marginBottom: 10 }}>
            Only <b>Approved</b> exams with <b>Questions created</b> will show here.
          </div>
          <div className="as-note" id="note_empty_allow_students">
            If you don’t see an exam: check → Admin approved? Questions created? (Questions count must be &gt; 0)
          </div>
        </div>
      ) : (
        <div className="as-tablewrap" id="tablewrap_allow_students">
          <div className="as-scroll">
            <table id="table_allow_students_exams">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Subject</th>
                  <th>Schedule</th>
                  <th>Total Marks</th>
                  <th>Questions</th>
                  <th>Password</th>
                  <th>Allowed</th>
                  <th style={{ width: 220 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((x) => (
                  <tr key={x.id} id={`row_exam_${x.id}_allow_students`}>
                    <td>
                      <div style={{ fontWeight: 900 }} id={`exam_title_${x.id}_allow_students`}>
                        {x.title || "Untitled"}
                      </div>
                      <div
                        className="as-muted"
                        id={`exam_desc_${x.id}_allow_students`}
                        style={{ marginTop: 6 }}
                      >
                        {x.description ? String(x.description).slice(0, 80) : "-"}
                        {x.description && String(x.description).length > 80 ? "..." : ""}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <span className={badgeClass(x._status)} id={`badge_status_${x.id}_allow_students`}>
                          {statusLabel(x._status)}
                        </span>
                      </div>
                    </td>

                    <td>
                      {x._subject_code ? (
                        <div style={{ fontWeight: 900 }} id={`subject_code_${x.id}_allow_students`}>
                          {x._subject_code}
                        </div>
                      ) : null}
                      <div id={`subject_name_${x.id}_allow_students`}>{x._subject_name || "-"}</div>
                    </td>

                    <td>
                      <div id={`start_${x.id}_allow_students`}>
                        <span className="as-muted">Start:</span> {fmtDateTime(x.start_at)}
                      </div>
                      <div id={`end_${x.id}_allow_students`}>
                        <span className="as-muted">End:</span> {fmtDateTime(x.end_at)}
                      </div>
                      <div className="as-muted" id={`duration_${x.id}_allow_students`} style={{ marginTop: 4 }}>
                        Duration: {x.duration_minutes ? `${x.duration_minutes} mins` : "-"}
                      </div>
                    </td>

                    <td id={`total_marks_${x.id}_allow_students`}>
                      <b>{x.total_marks ?? "-"}</b>
                    </td>

                    <td id={`qcount_${x.id}_allow_students`}>
                      <span className="as-pill">{x._question_count}</span>
                    </td>

                    <td id={`pwd_${x.id}_allow_students`}>
                      <span className="as-pill">{x.password_set ? "SET" : "NOT SET"}</span>
                    </td>

                    <td id={`allowed_${x.id}_allow_students`}>
                      <span className="as-pill">{x._allowed_count}</span>
                    </td>

                    <td>
                      <button
                        className="as-btn as-btn--primary"
                        id={`btn_manage_students_${x.id}_allow_students`}
                        onClick={() => openManage(x)}
                      >
                        Manage Students
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <ManageStudentsModal
        open={modalOpen}
        exam={activeExam}
        busy={busy}
        onClose={() => {
          setModalOpen(false);
          setActiveExam(null);
        }}
        onToast={showToast}
        onRefreshTopTable={loadAll}
      />
    </div>
  );
}