// src/pages/admin/ExamManagement.jsx
// Admin Exam Management UI (Table only)
// Tabs: Pending / Changes Requested / Approved / Rejected
// Filters: Subject + Single Date + Search
// Actions: Approve (confirm yes/no), Reject (reason required), Request Changes (note required)

import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
  : "http://localhost:5000";
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

function toYMD(value) {
  // convert date to YYYY-MM-DD (local)
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function statusLabel(s) {
  const x = (s || "").toLowerCase();
  if (x === "changes_requested") return "CHANGES";
  return (x || "-").toUpperCase();
}

function badgeClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "pending") return "ax-badge ax-badge--pending";
  if (s === "changes_requested") return "ax-badge ax-badge--changes";
  if (s === "approved") return "ax-badge ax-badge--approved";
  if (s === "rejected") return "ax-badge ax-badge--rejected";
  return "ax-badge";
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className={`ax-toast ${toast.type === "success" ? "ok" : "err"}`}>
      <span>{toast.message}</span>
      <button className="ax-icon-btn" onClick={onClose} aria-label="close">
        ✕
      </button>
    </div>
  );
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmText,
  danger,
  loading,
  onClose,
  onConfirm,
}) {
  if (!open) return null;
  return (
    <>
      <div className="ax-backdrop" onClick={loading ? undefined : onClose} />
      <div className="ax-modal" role="dialog" aria-modal="true">
        <div className="ax-modal__head">
          <h3>{title}</h3>
          <button
            className="ax-icon-btn"
            onClick={onClose}
            disabled={loading}
            aria-label="close"
          >
            ✕
          </button>
        </div>
        <div className="ax-modal__body">
          <p className="ax-muted">{message}</p>
        </div>
        <div className="ax-modal__foot">
          <button
            className="ax-btn ax-btn--ghost"
            onClick={onClose}
            disabled={loading}
          >
            No
          </button>
          <button
            className={`ax-btn ${danger ? "ax-btn--danger" : "ax-btn--primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Please wait..." : confirmText || "Yes"}
          </button>
        </div>
      </div>
    </>
  );
}

function NoteDialog({
  open,
  title,
  label,
  placeholder,
  value,
  setValue,
  loading,
  onClose,
  onConfirm,
  confirmText,
}) {
  if (!open) return null;
  const trimmed = (value || "").trim();
  const disabled = loading || trimmed.length < 3;

  return (
    <>
      <div className="ax-backdrop" onClick={loading ? undefined : onClose} />
      <div className="ax-modal" role="dialog" aria-modal="true">
        <div className="ax-modal__head">
          <h3>{title}</h3>
          <button
            className="ax-icon-btn"
            onClick={onClose}
            disabled={loading}
            aria-label="close"
          >
            ✕
          </button>
        </div>
        <div className="ax-modal__body">
          <label className="ax-label">{label}</label>
          <textarea
            className="ax-input"
            rows={4}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
          />
          <div className="ax-muted" style={{ marginTop: 8 }}>
            Minimum 3 characters.
          </div>
        </div>
        <div className="ax-modal__foot">
          <button
            className="ax-btn ax-btn--ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button className="ax-btn ax-btn--primary" onClick={onConfirm} disabled={disabled}>
            {loading ? "Sending..." : confirmText || "Send"}
          </button>
        </div>
      </div>
    </>
  );
}

export default function ExamManagement() {
  // =========================
  // API PATHS (adjust here)
  // =========================
  const PATH_LIST = "/admin/exams"; // GET
  const pathApprove = (id) => `/admin/exams/${id}/approve`; // PATCH
  const pathReject = (id) => `/admin/exams/${id}/reject`; // PATCH body:{admin_note}
  const pathChanges = (id) => `/admin/exams/${id}/changes`; // PATCH body:{admin_note}

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [toast, setToast] = useState(null);

  const [tab, setTab] = useState("pending"); // pending | changes_requested | approved | rejected
  const [q, setQ] = useState("");
  const [subjectId, setSubjectId] = useState("all");
  const [date, setDate] = useState(""); // ✅ single date YYYY-MM-DD

  const [subjects, setSubjects] = useState([]); // derived from rows

  // dialogs
  const [confirm, setConfirm] = useState({ open: false, type: "", exam: null });
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteType, setNoteType] = useState(""); // "reject" | "changes"
  const [noteExam, setNoteExam] = useState(null);
  const [noteText, setNoteText] = useState("");

  const showToast = (type, message) => {
    setToast({ type, message });
    window.clearTimeout(window.__axToast);
    window.__axToast = window.setTimeout(() => setToast(null), 3200);
  };

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(PATH_LIST);
      const list = Array.isArray(res?.data) ? res.data : res?.data?.data || [];
      setRows(list);

      // build subject dropdown list
      const map = new Map();
      for (const x of list) {
        const sid = String(x.subject_id ?? "");
        const code = x.subject_code || x.subject?.code || "";
        const name = x.subject_name || x.subject?.name || "";
        if (sid && !map.has(sid)) map.set(sid, { id: sid, code, name });
      }
      setSubjects([{ id: "all", code: "", name: "All subjects" }, ...Array.from(map.values())]);
    } catch (e) {
      showToast("error", e.message || "Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const s = { pending: 0, changes_requested: 0, approved: 0, rejected: 0, draft: 0 };
    for (const x of rows) {
      const st = (x.approval_status || "draft").toLowerCase();
      if (s[st] !== undefined) s[st] += 1;
    }
    return s;
  }, [rows]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return rows
      .map((x) => ({
        ...x,
        _status: (x.approval_status || "draft").toLowerCase(),
        _subject_id: String(x.subject_id ?? ""),
        _subject_code: x.subject_code || x.subject?.code || "",
        _subject_name: x.subject_name || x.subject?.name || "",
        _ymd: x.start_at ? toYMD(x.start_at) : "",
      }))
      .filter((x) => {
        if (x._status !== tab) return false;

        if (subjectId !== "all" && x._subject_id !== String(subjectId)) return false;

        if (date && x._ymd !== date) return false; // ✅ single date filter

        if (qq) {
          const hay = `${x.title || ""} ${x._subject_code} ${x._subject_name}`.toLowerCase();
          if (!hay.includes(qq)) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.start_at || 0).getTime() - new Date(a.start_at || 0).getTime());
  }, [rows, tab, subjectId, q, date]);

  const onTab = (t) => {
    setTab(t);
    setQ("");
    setDate("");
    setSubjectId("all");
  };

  const askApprove = (exam) => setConfirm({ open: true, type: "approve", exam });
  const askReject = (exam) => {
    setNoteType("reject");
    setNoteExam(exam);
    setNoteText("");
    setNoteOpen(true);
  };
  const askChanges = (exam) => {
    setNoteType("changes");
    setNoteExam(exam);
    setNoteText("");
    setNoteOpen(true);
  };

  const runConfirm = async () => {
    const ex = confirm.exam;
    if (!ex?.id) return;
    try {
      setBusy(true);
      await apiFetch(pathApprove(ex.id), { method: "PATCH" });
      showToast("success", "Approved ✅ (Email handled by backend)");
      setConfirm({ open: false, type: "", exam: null });
      await load();
    } catch (e) {
      showToast("error", e.message || "Approve failed");
    } finally {
      setBusy(false);
    }
  };

  const runNote = async () => {
    const ex = noteExam;
    const msg = (noteText || "").trim();
    if (!ex?.id) return;

    try {
      setBusy(true);

      if (noteType === "reject") {
        await apiFetch(pathReject(ex.id), { method: "PATCH", body: { admin_note: msg } });
        showToast("success", "Rejected ✅ (Email handled by backend)");
      } else {
        await apiFetch(pathChanges(ex.id), { method: "PATCH", body: { admin_note: msg } });
        showToast("success", "Changes Requested ✅ (Email handled by backend)");
      }

      setNoteOpen(false);
      setNoteExam(null);
      setNoteText("");
      await load();
    } catch (e) {
      showToast("error", e.message || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const canAction = (st) => st === "pending" || st === "changes_requested";

  return (
    <div className="ax-page">
      <style>{`
        .ax-page{padding:24px;max-width:1300px;margin:0 auto}
        .ax-top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap}
        .ax-title h1{margin:0;font-size:22px}
        .ax-title p{margin:6px 0 0;color:#667085}

        .ax-btn{border:1px solid #e4e7ec;background:#fff;padding:10px 12px;border-radius:10px;cursor:pointer;font-weight:800}
        .ax-btn:disabled{opacity:.6;cursor:not-allowed}
        .ax-btn--primary{background:#2563eb;border-color:#2563eb;color:#fff}
        .ax-btn--ghost{background:#fff}
        .ax-btn--danger{background:#fee2e2;border-color:#fecaca;color:#991b1b}

        .ax-icon-btn{border:none;background:transparent;cursor:pointer;font-size:16px}
        .ax-input{width:100%;border:1px solid #e4e7ec;border-radius:10px;padding:10px 12px;outline:none}
        .ax-label{display:block;font-size:13px;font-weight:900;margin-bottom:6px}
        .ax-muted{color:#667085;font-size:13px}

        .ax-tabs{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
        .ax-tab{border:1px solid #e4e7ec;border-radius:999px;padding:8px 12px;background:#fff;cursor:pointer;font-weight:900}
        .ax-tab.active{background:#2563eb;color:#fff;border-color:#2563eb}
        .ax-pill{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;border-radius:999px;margin-left:8px;font-size:12px;font-weight:900;background:#f2f4f7;color:#344054}
        .ax-tab.active .ax-pill{background:rgba(255,255,255,.2);color:#fff}

        .ax-filters{border:1px solid #e4e7ec;border-radius:14px;padding:14px;background:#fff;margin-top:14px}
        .ax-row{display:flex;gap:12px;flex-wrap:wrap;align-items:end}
        .ax-row > div{min-width:180px;flex:1}

        .ax-tablewrap{margin-top:14px;border:1px solid #e4e7ec;border-radius:14px;overflow:hidden;background:#fff}
        table{width:100%;border-collapse:collapse}
        th,td{padding:12px 12px;border-bottom:1px solid #f2f4f7;text-align:left;font-size:14px;vertical-align:top}
        th{background:#fcfcfd;font-size:12px;color:#667085;text-transform:uppercase;letter-spacing:.04em}
        .ax-actions-col{display:flex;gap:8px;flex-wrap:wrap}

        .ax-badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:900;border:1px solid #e4e7ec}
        .ax-badge--pending{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe}
        .ax-badge--changes{background:#fff7ed;color:#9a3412;border-color:#fed7aa}
        .ax-badge--approved{background:#ecfdf3;color:#027a48;border-color:#abefc6}
        .ax-badge--rejected{background:#fef2f2;color:#b91c1c;border-color:#fecaca}

        .ax-empty{padding:24px;text-align:center;color:#667085}

        .ax-toast{position:fixed;top:18px;right:18px;z-index:9999;display:flex;gap:12px;align-items:center;max-width:380px;padding:12px 14px;border-radius:14px;color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.12)}
        .ax-toast.ok{background:#027a48}
        .ax-toast.err{background:#b42318}

        .ax-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:9998}
        .ax-modal{position:fixed;z-index:9999;left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,calc(100% - 24px));background:#fff;border-radius:16px;border:1px solid #e4e7ec;overflow:hidden}
        .ax-modal__head{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid #f2f4f7}
        .ax-modal__body{padding:16px}
        .ax-modal__foot{display:flex;justify-content:flex-end;gap:10px;padding:14px 16px;border-top:1px solid #f2f4f7}
      `}</style>

      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="ax-top">
        <div className="ax-title">
          <h1>Exam Management</h1>
          <p>Review staff exam submissions and approve / reject / request changes.</p>
        </div>

        <button className="ax-btn ax-btn--ghost" onClick={load} disabled={loading || busy}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Tabs */}
      <div className="ax-tabs">
        <button className={`ax-tab ${tab === "pending" ? "active" : ""}`} onClick={() => onTab("pending")}>
          Pending <span className="ax-pill">{stats.pending}</span>
        </button>
        <button className={`ax-tab ${tab === "changes_requested" ? "active" : ""}`} onClick={() => onTab("changes_requested")}>
          Changes <span className="ax-pill">{stats.changes_requested}</span>
        </button>
        <button className={`ax-tab ${tab === "approved" ? "active" : ""}`} onClick={() => onTab("approved")}>
          Approved <span className="ax-pill">{stats.approved}</span>
        </button>
        <button className={`ax-tab ${tab === "rejected" ? "active" : ""}`} onClick={() => onTab("rejected")}>
          Rejected <span className="ax-pill">{stats.rejected}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="ax-filters">
        <div className="ax-row">
          <div>
            <label className="ax-label">Subject</label>
            <select className="ax-input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              {(subjects.length ? subjects : [{ id: "all", code: "", name: "All subjects" }]).map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.id === "all" ? "All subjects" : `${s.code ? s.code + " — " : ""}${s.name}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="ax-label">Date</label>
            <input type="date" className="ax-input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div style={{ flex: 2, minWidth: 240 }}>
            <label className="ax-label">Search</label>
            <input
              className="ax-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title / subject..."
            />
          </div>

          <div style={{ minWidth: 160 }}>
            <button
              className="ax-btn"
              onClick={() => {
                setSubjectId("all");
                setDate("");
                setQ("");
              }}
              disabled={busy || loading}
              style={{ width: "100%" }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="ax-tablewrap">
        {loading ? (
          <div className="ax-empty">Loading exams...</div>
        ) : filtered.length === 0 ? (
          <div className="ax-empty">No exams found in this tab.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Exam</th>
                <th>Module / Subject</th>
                <th>Schedule</th>
                <th>Marks</th>
                <th>Status</th>
                <th style={{ width: 380 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((x) => {
                const st = (x.approval_status || "draft").toLowerCase();
                const actionOk = canAction(st);

                return (
                  <tr key={x.id}>
                    <td>
                      <div style={{ fontWeight: 900 }}>{x.title || "Untitled"}</div>
                      {x.admin_note ? (
                        <div className="ax-muted" style={{ marginTop: 6 }}>
                          <b>Admin note:</b> {x.admin_note}
                        </div>
                      ) : null}
                    </td>

                    <td>
                      {x._subject_code ? <div style={{ fontWeight: 900 }}>{x._subject_code}</div> : null}
                      <div>{x._subject_name || "-"}</div>
                      {(x.year && x.semester) ? (
                        <div className="ax-muted" style={{ marginTop: 4 }}>{`Y${x.year}S${x.semester}`}</div>
                      ) : null}
                      {x.created_by_staff_id ? (
                        <div className="ax-muted" style={{ marginTop: 4 }}>
                          Staff ID: {x.created_by_staff_id}
                        </div>
                      ) : null}
                    </td>

                    <td>
                      <div><span className="ax-muted">Start:</span> {fmtDateTime(x.start_at)}</div>
                      <div><span className="ax-muted">End:</span> {fmtDateTime(x.end_at)}</div>
                      <div className="ax-muted" style={{ marginTop: 4 }}>
                        Duration: {x.duration_minutes ? `${x.duration_minutes} mins` : "-"}
                      </div>
                    </td>

                    <td>
                      <div><b>{x.total_marks ?? "-"}</b> total</div>
                      <div className="ax-muted">Pass: {x.pass_marks ?? "-"}</div>
                    </td>

                    <td>
                      <span className={badgeClass(st)}>{statusLabel(st)}</span>
                    </td>

                    <td>
                      <div className="ax-actions-col">
                        <button
                          className="ax-btn ax-btn--primary"
                          onClick={() => askApprove(x)}
                          disabled={busy || !actionOk}
                        >
                          Approve
                        </button>

                        <button
                          className="ax-btn"
                          onClick={() => askChanges(x)}
                          disabled={busy || !actionOk}
                        >
                          Request Changes
                        </button>

                        <button
                          className="ax-btn ax-btn--danger"
                          onClick={() => askReject(x)}
                          disabled={busy || !actionOk}
                        >
                          Reject
                        </button>
                      </div>

                      {!actionOk ? (
                        <div className="ax-muted" style={{ marginTop: 8 }}>
                          This exam is {statusLabel(st)}. View only.
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Approve Confirm */}
      <ConfirmDialog
        open={confirm.open && confirm.type === "approve"}
        title="Approve Exam"
        message={`Approve "${confirm.exam?.title || "this exam"}"?`}
        confirmText="Yes, Approve"
        danger={false}
        loading={busy}
        onClose={() => (busy ? null : setConfirm({ open: false, type: "", exam: null }))}
        onConfirm={runConfirm}
      />

      {/* Reject / Changes Note Dialog */}
      <NoteDialog
        open={noteOpen}
        title={noteType === "reject" ? "Reject Exam" : "Request Changes"}
        label={noteType === "reject" ? "Reason for rejection" : "What should staff change?"}
        placeholder={noteType === "reject" ? "Type the rejection reason..." : "Type the required changes..."}
        value={noteText}
        setValue={setNoteText}
        loading={busy}
        onClose={() => (busy ? null : setNoteOpen(false))}
        onConfirm={runNote}
        confirmText={noteType === "reject" ? "Send Rejection" : "Send Changes"}
      />
    </div>
  );
}
