import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}

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

function normApproved(x) {
  const s = (x?.approval_status || x?.status || "").toString().toLowerCase();
  return s === "approved";
}

export default function ApprovedExamNotice() {
  const navigate = useNavigate();

  // --- Adjust these paths to your backend
  const PATH_SUBJECTS = "/staff/subjects"; // assigned subjects only
  const PATH_EXAMS = "/staff/exams"; // should return all staff exams (we filter approved)
  // BEST: backend should include questions_count per exam (recommended)
  // OPTIONAL fallback: per exam, call GET questions and count.

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjectId, setSubjectId] = useState("all");
  const [q, setQ] = useState("");

  const [toast, setToast] = useState(null);
  const showToast = (type, message) => {
    setToast({ type, message });
    window.clearTimeout(window.__aToast);
    window.__aToast = window.setTimeout(() => setToast(null), 3000);
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      const [sRes, eRes] = await Promise.all([
        apiFetch(PATH_SUBJECTS),
        apiFetch(PATH_EXAMS),
      ]);

      const sList = Array.isArray(sRes?.data) ? sRes.data : sRes?.data?.data || [];
      const eList = Array.isArray(eRes?.data) ? eRes.data : eRes?.data?.data || [];

      setSubjects(sList);
      setExams(eList);
    } catch (e) {
      showToast("error", e.message || "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approvedExams = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return (exams || [])
      .filter((x) => normApproved(x))
      .map((x) => ({
        ...x,
        _subject_id: String(x.subject_id ?? x.subject?.id ?? ""),
        _subject_name: x.subject?.name || x.subject_name || "",
        _subject_code: x.subject?.code || x.subject_code || "",
        // ✅ recommend backend to send these
        _questions_count: Number(x.questions_count ?? x.q_count ?? 0),
        _has_questions:
          (x.has_questions ?? x.questions_count ?? 0) ? true : false,
      }))
      .filter((x) => {
        if (subjectId !== "all" && x._subject_id !== String(subjectId)) return false;
        if (qq) {
          const hay = `${x.title || ""} ${x._subject_name} ${x._subject_code}`.toLowerCase();
          if (!hay.includes(qq)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.start_at || 0).getTime() - new Date(a.start_at || 0).getTime());
  }, [exams, subjectId, q]);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <style>{`
        .ax-top{display:flex;gap:12px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap}
        .ax-title h1{margin:0;font-size:20px;font-weight:900;letter-spacing:-0.02em}
        .ax-muted{color:#667085;font-size:12px;font-weight:500}
        .ax-card{border:1px solid #e4e7ec;border-radius:14px;background:#fff;padding:14px;margin-top:14px}
        .ax-btn{border:1px solid #e4e7ec;background:#fff;padding:8px 14px;border-radius:10px;cursor:pointer;font-weight:900;font-size:12px}
        .ax-btn:disabled{opacity:.6;cursor:not-allowed}
        .ax-btn-primary{background:#2563EB;border-color:#2563EB;color:#fff}
        .ax-input{width:100%;border:1px solid #e4e7ec;border-radius:10px;padding:8px 10px;outline:none;font-size:13px}
        .ax-tablewrap{margin-top:14px;border:1px solid #e4e7ec;border-radius:14px;overflow:hidden;background:#fff}
        .ax-scroll{overflow:auto}
        table{width:100%;border-collapse:collapse;min-width:980px}
        th,td{padding:10px;border-bottom:1px solid #f2f4f7;text-align:left;font-size:13px;vertical-align:top}
        th{background:#fcfcfd;font-size:9px;color:#667085;text-transform:uppercase;letter-spacing:.12em;font-weight:900}
        .ax-actions{display:flex;gap:8px;flex-wrap:wrap}
        .ax-badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:900;border:1px solid #abefc6;background:#ecfdf3;color:#027a48}
        .ax-toast{position:fixed;top:18px;right:18px;z-index:9999;display:flex;gap:12px;align-items:center;max-width:420px;padding:12px 14px;border-radius:14px;color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.12)}
        .ax-toast.ok{background:#027a48}
        .ax-toast.ok{background:#027a48}
        .ax-toast.err{background:#b42318}

        /* Dark Mode Overrides */
        .dark .ax-card { background: #111827; border-color: #374151; }
        .dark .ax-title h1 { color: #fff; }
        .dark .ax-muted { color: #9ca3af; }
        .dark .ax-btn { background: #1f2937; border-color: #374151; color: #d1d5db; }
        .dark .ax-btn-primary { background: #2563EB; border-color: #2563EB; color: #fff; }
        .dark .ax-input { background: #111827; border-color: #374151; color: #f3f4f6; }
        .dark .ax-tablewrap { background: #111827; border-color: #374151; }
        .dark th { background: #1f2937; border-bottom-color: #374151; color: #9ca3af; }
        .dark td { border-bottom-color: #374151; color: #d1d5db; }
        .dark .ax-badge { background: #064e3b; color: #a7f3d0; border-color: #065f46; }
      `}</style>

      {toast ? (
        <div className={`ax-toast ${toast.type === "success" ? "ok" : "err"}`} id="toast_exam_notice">
          <span>{toast.message}</span>
          <button className="ax-btn" id="btn_close_notice_toast" onClick={() => setToast(null)}>✕</button>
        </div>
      ) : null}

      <div className="ax-top">
        <div className="ax-title">
          <h1 id="title_exam_notice">Approved Exam Notice</h1>
          <div className="ax-muted" id="subtitle_exam_notice">
            Filter by subject and manage questions for approved exams.
          </div>
        </div>

        <div className="ax-actions">
          <button className="ax-btn" id="btn_refresh_notice" onClick={loadAll} disabled={loading || busy}>
            {loading ? "Loading..." : "Refresh"}
          </button>

          <button className="ax-btn" id="btn_back_staff_exams" onClick={() => navigate("/staff/exams")} disabled={busy}>
            ← Back
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="ax-card">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
          <div style={{ minWidth: 260 }}>
            <div className="ax-muted">Subject (Assigned)</div>
            <select
              id="filter_subject_dropdown"
              className="ax-input"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={loading || busy}
            >
              <option value="all" id="opt_subject_all">All subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={String(s.id)} id={`opt_subject_${s.id}`}>
                  {s.code ? `${s.code} — ` : ""}{s.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <div className="ax-muted">Search exam</div>
            <input
              id="filter_exam_search"
              className="ax-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by exam title / subject..."
              disabled={loading || busy}
            />
          </div>

          <div style={{ minWidth: 140 }}>
            <button
              id="btn_clear_notice_filters"
              className="ax-btn"
              onClick={() => { setSubjectId("all"); setQ(""); }}
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
        <div className="ax-card" id="loading_notice">Loading approved exams...</div>
      ) : approvedExams.length === 0 ? (
        <div className="ax-card" id="empty_notice">
          <div style={{ fontWeight: 900, marginBottom: 6 }}>No approved exams found</div>
          <div className="ax-muted">Try changing subject filter or search.</div>
        </div>
      ) : (
        <div className="ax-tablewrap">
          <div className="ax-scroll">
            <table id="table_approved_exams">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Subject</th>
                  <th>Schedule</th>
                  <th>Total Marks</th>
                  <th>Questions</th>
                  <th>Status</th>
                  <th style={{ width: 260 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvedExams.map((x) => {
                  const hasQ = x._has_questions || x._questions_count > 0;

                  return (
                    <tr key={x.id} id={`row_exam_${x.id}`}>
                      <td>
                        <div style={{ fontWeight: 900 }} id={`exam_title_${x.id}`}>{x.title || "-"}</div>
                        {x.description ? (
                          <div className="ax-muted" style={{ marginTop: 6 }} id={`exam_desc_${x.id}`}>
                            {x.description}
                          </div>
                        ) : null}
                      </td>

                      <td>
                        {x._subject_code ? (
                          <div style={{ fontWeight: 900 }} id={`subject_code_${x.id}`}>{x._subject_code}</div>
                        ) : null}
                        <div id={`subject_name_${x.id}`}>{x._subject_name || "-"}</div>
                      </td>

                      <td>
                        <div id={`start_${x.id}`}><span className="ax-muted">Start:</span> {fmtDateTime(x.start_at)}</div>
                        <div id={`end_${x.id}`}><span className="ax-muted">End:</span> {fmtDateTime(x.end_at)}</div>
                        <div className="ax-muted" id={`duration_${x.id}`} style={{ marginTop: 4 }}>
                          Duration: {x.duration_minutes ? `${x.duration_minutes} mins` : "-"}
                        </div>
                      </td>

                      <td id={`total_marks_${x.id}`}>
                        <b>{x.total_marks ?? "-"}</b>
                      </td>

                      <td id={`qcount_${x.id}`}>
                        {hasQ ? `${x._questions_count} created` : "Not created"}
                      </td>

                      <td>
                        <span className="ax-badge" id={`badge_approved_${x.id}`}>APPROVED</span>
                      </td>

                      <td>
                        <div className="ax-actions">
                          {!hasQ ? (
                            <button
                              id={`btn_create_questions_${x.id}`}
                              className="ax-btn ax-btn-primary"
                              onClick={() => navigate(`/staff/questions/${x.id}`)}
                              disabled={busy}
                            >
                              Create Questions
                            </button>
                          ) : (
                            <button
                              id={`btn_view_questions_${x.id}`}
                              className="ax-btn ax-btn-primary"
                              onClick={() => navigate(`/staff/questions/${x.id}`)}
                              disabled={busy}
                            >
                              View Questions
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}