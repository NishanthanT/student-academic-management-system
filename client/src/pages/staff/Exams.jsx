// src/pages/staff/StaffExams.jsx
// ✅ Staff Exams — TABLE ONLY (No Cards)
// ✅ Tabs (Draft/Pending/Changes/Approved/Rejected) click => Table view always
// ✅ Create Exam button BLUE
// ✅ From/To default date set (From=today, To=today+30 days)
// ✅ Exam Create/Edit: future date only + validation (start/end must be future, end > start)

import React, { useEffect, useMemo, useState } from "react";

/* =========================
   CONFIG
========================= */
const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
  : "http://localhost:8000";
const API = `${API_BASE}/api`;

/* =========================
   HELPERS
========================= */
const pad2 = (n) => String(n).padStart(2, "0");

// ✅ backend sometimes returns "YYYY-MM-DD HH:mm:ss" (space)
// JS Date prefers "YYYY-MM-DDTHH:mm:ss"
function normalizeDateStr(v) {
  if (!v) return v;
  if (typeof v === "string") return v.replace(" ", "T");
  return v;
}

// ✅ datetime-local gives "YYYY-MM-DDTHH:mm"
// convert to "YYYY-MM-DDTHH:mm:00" (NO timezone, NO UTC convert)
function localInputToLocalDateTimeString(v) {
  if (!v) return "";
  // if already includes seconds, keep as is
  if (typeof v === "string" && v.length === 16) return `${v}:00`;
  return v;
}

function toLocalInputValue(date) {
  const d =
    date instanceof Date
      ? date
      : new Date(normalizeDateStr(date)); // ✅ normalize
  if (Number.isNaN(d.getTime())) return "";
  return (
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` +
    `T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
  );
}

function fmtDateTime(date) {
  const d =
    date instanceof Date
      ? date
      : new Date(normalizeDateStr(date)); // ✅ normalize
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function minutesBetween(aIso, bIso) {
  const a = new Date(normalizeDateStr(aIso)).getTime(); // ✅ normalize
  const b = new Date(normalizeDateStr(bIso)).getTime(); // ✅ normalize
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.max(0, Math.round((b - a) / 60000));
}

function normalizeStatus(exam) {
  const s = (exam?.approval_status || exam?.status || "")
    .toString()
    .toLowerCase();
  if (!s) return "draft";
  if (
    [
      "draft",
      "pending",
      "changes_requested",
      "approved",
      "rejected",
      "cancelled",
    ].includes(s)
  )
    return s;
  return "draft";
}

function badgeClass(status) {
  switch (status) {
    case "draft":
      return "sx-badge sx-badge--draft";
    case "pending":
      return "sx-badge sx-badge--pending";
    case "changes_requested":
      return "sx-badge sx-badge--changes";
    case "approved":
      return "sx-badge sx-badge--approved";
    case "rejected":
      return "sx-badge sx-badge--rejected";
    case "cancelled":
      return "sx-badge sx-badge--cancelled";
    default:
      return "sx-badge";
  }
}

function statusLabel(status) {
  switch (status) {
    case "draft":
      return "DRAFT";
    case "pending":
      return "PENDING";
    case "changes_requested":
      return "CHANGES";
    case "approved":
      return "APPROVED";
    case "rejected":
      return "REJECTED";
    case "cancelled":
      return "CANCELLED";
    default:
      return (status || "").toUpperCase();
  }
}

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

function dateToYMD(d) {
  const x = d instanceof Date ? d : new Date(d);
  return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}`;
}
function addDaysYMD(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return dateToYMD(d);
}
function nowRounded() {
  const d = new Date();
  d.setSeconds(0, 0);
  return d;
}

/* =========================
   SMALL UI
========================= */
function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className={`sx-toast ${toast.type === "success" ? "ok" : "err"}`}>
      <span>{toast.message}</span>
      <button className="sx-icon-btn" onClick={onClose} aria-label="close">
        ✕
      </button>
    </div>
  );
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirm",
  danger,
  loading,
  onClose,
  onConfirm,
}) {
  if (!open) return null;
  return (
    <>
      <div className="sx-backdrop" onClick={loading ? undefined : onClose} />
      <div className="sx-modal" role="dialog" aria-modal="true">
        <div className="sx-modal__head">
          <h3>{title}</h3>
          <button
            className="sx-icon-btn"
            onClick={onClose}
            disabled={loading}
            aria-label="close"
          >
            ✕
          </button>
        </div>
        <div className="sx-modal__body">
          <p className="sx-muted">{message}</p>
        </div>
        <div className="sx-modal__foot">
          <button
            className="sx-btn sx-btn--ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={`sx-btn ${danger ? "sx-btn--danger" : "sx-btn--primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Please wait..." : confirmText}
          </button>
        </div>
      </div>
    </>
  );
}

/* =========================
   EXAM MODAL (Create/Edit)
========================= */
function ExamModal({
  open,
  mode, // "create" | "edit"
  subjects,
  initial,
  status, // normalized status
  allowDescriptionOnly,
  loading,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(() => ({
    title: "",
    subject_id: "",
    start_at: "",
    end_at: "",
    duration_minutes: 60,
    total_marks: 100,
    pass_marks: 40,
    description: "",
  }));

  const [errors, setErrors] = useState({});

  const readOnlyAll =
    status === "pending" || status === "rejected" || status === "cancelled";
  const descOnly = allowDescriptionOnly && status === "approved";

  const minDateTime = useMemo(() => toLocalInputValue(nowRounded()), []);

  useEffect(() => {
    if (!open) return;

    if (initial) {
      const subjId = String(initial.subject_id ?? initial.subject?.id ?? "");
      const start = toLocalInputValue(initial.start_at);
      const end = toLocalInputValue(initial.end_at);
      const duration =
        initial.duration_minutes ??
        (initial.start_at && initial.end_at
          ? minutesBetween(initial.start_at, initial.end_at)
          : 60);

      setForm({
        title: initial.title || "",
        subject_id: subjId,
        start_at: start,
        end_at: end,
        duration_minutes: Number(duration ?? 60),
        total_marks: Number(initial.total_marks ?? 100),
        pass_marks: Number(initial.pass_marks ?? 40),
        description: initial.description || initial.instructions || "",
      });
    } else {
      setForm({
        title: "",
        subject_id: subjects?.[0]?.id ? String(subjects[0].id) : "",
        start_at: "",
        end_at: "",
        duration_minutes: 60,
        total_marks: 100,
        pass_marks: 40,
        description: "",
      });
    }
    setErrors({});
  }, [open, initial, subjects]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    const now = nowRounded().getTime();

    if (!descOnly) {
      if (!form.title.trim()) e.title = "Title required";
      if (!form.subject_id) e.subject_id = "Select subject";
      if (!form.start_at) e.start_at = "Start time required";
      if (!form.end_at) e.end_at = "End time required";

      const s = form.start_at ? new Date(form.start_at).getTime() : null;
      const en = form.end_at ? new Date(form.end_at).getTime() : null;

      // ✅ Future date only
      if (s && s < now) e.start_at = "Start must be a future date/time";
      if (en && en < now) e.end_at = "End must be a future date/time";

      if (s && en && en <= s) e.end_at = "End must be after start";

      if (!form.duration_minutes || Number(form.duration_minutes) <= 0)
        e.duration_minutes = "Duration must be > 0";
      if (Number(form.total_marks) <= 0)
        e.total_marks = "Total marks must be > 0";
      if (Number(form.pass_marks) < 0) e.pass_marks = "Pass marks invalid";
      if (Number(form.pass_marks) > Number(form.total_marks))
        e.pass_marks = "Pass marks cannot exceed total";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const autoCalcDuration = () => {
    if (descOnly) return;
    const s = form.start_at ? new Date(form.start_at).getTime() : null;
    const en = form.end_at ? new Date(form.end_at).getTime() : null;
    if (!s || !en || en <= s) return;
    set("duration_minutes", Math.round((en - s) / 60000));
  };

  const disabled = loading || readOnlyAll;
  const disableNonDesc = disabled || descOnly;

  const endMin = form.start_at
    ? toLocalInputValue(new Date(new Date(form.start_at).getTime() + 60000))
    : minDateTime;

  if (!open) return null;

  return (
    <>
      <div className="sx-backdrop" onClick={loading ? undefined : onClose} />
      <div className="sx-modal sx-modal--xl" role="dialog" aria-modal="true">
        <div className="sx-modal__head">
          <h3>
            {mode === "edit" ? "Edit Exam" : "Create Exam"}{" "}
            {status ? (
              <span className={badgeClass(status)} style={{ marginLeft: 10 }}>
                {statusLabel(status)}
              </span>
            ) : null}
          </h3>
          <button
            className="sx-icon-btn"
            onClick={onClose}
            disabled={loading}
            aria-label="close"
          >
            ✕
          </button>
        </div>

        <div className="sx-modal__body">
          {initial?.admin_note ? (
            <div className="sx-note">
              <b>Admin Note:</b> {initial.admin_note}
            </div>
          ) : null}

          {readOnlyAll ? (
            <div className="sx-note sx-note--warn">
              This exam is <b>{statusLabel(status)}</b>. You can only view.
            </div>
          ) : descOnly ? (
            <div className="sx-note sx-note--ok">
              Approved exam: Only <b>Description</b> editing is allowed.
            </div>
          ) : null}

          <div className="sx-grid sx-grid--2">
            <div>
              <label className="sx-label">Exam Title</label>
              <input
                className={`sx-input ${errors.title ? "sx-input--err" : ""}`}
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g., Midterm Exam"
                disabled={disableNonDesc}
              />
              {errors.title && <div className="sx-err">{errors.title}</div>}
            </div>

            <div>
              <label className="sx-label">Module / Subject</label>
              <select
                className={`sx-input ${errors.subject_id ? "sx-input--err" : ""}`}
                value={form.subject_id}
                onChange={(e) => set("subject_id", e.target.value)}
                disabled={disableNonDesc}
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.code ? `${s.code} — ` : ""}
                    {s.name}{" "}
                    {s.year && s.semester ? `(Y${s.year}S${s.semester})` : ""}
                  </option>
                ))}
              </select>
              {errors.subject_id && (
                <div className="sx-err">{errors.subject_id}</div>
              )}
            </div>

            <div>
              <label className="sx-label">Exam Start</label>
              <input
                type="datetime-local"
                className={`sx-input ${errors.start_at ? "sx-input--err" : ""}`}
                value={form.start_at}
                onChange={(e) => set("start_at", e.target.value)}
                onBlur={autoCalcDuration}
                min={minDateTime}
                disabled={disableNonDesc}
              />
              {errors.start_at && <div className="sx-err">{errors.start_at}</div>}
            </div>

            <div>
              <label className="sx-label">Exam End</label>
              <input
                type="datetime-local"
                className={`sx-input ${errors.end_at ? "sx-input--err" : ""}`}
                value={form.end_at}
                onChange={(e) => set("end_at", e.target.value)}
                onBlur={autoCalcDuration}
                min={endMin}
                disabled={disableNonDesc}
              />
              {errors.end_at && <div className="sx-err">{errors.end_at}</div>}
            </div>

            <div>
              <label className="sx-label">Duration (minutes)</label>
              <input
                type="number"
                className={`sx-input ${
                  errors.duration_minutes ? "sx-input--err" : ""
                }`}
                value={form.duration_minutes}
                onChange={(e) => set("duration_minutes", e.target.value)}
                min={1}
                disabled={disableNonDesc}
              />
              {errors.duration_minutes && (
                <div className="sx-err">{errors.duration_minutes}</div>
              )}
              <button
                className="sx-link"
                type="button"
                onClick={autoCalcDuration}
                disabled={disableNonDesc}
              >
                Auto-calc from start/end
              </button>
            </div>

            <div className="sx-grid sx-grid--2 sx-grid--tight">
              <div>
                <label className="sx-label">Total Marks</label>
                <input
                  type="number"
                  className={`sx-input ${
                    errors.total_marks ? "sx-input--err" : ""
                  }`}
                  value={form.total_marks}
                  onChange={(e) => set("total_marks", e.target.value)}
                  min={1}
                  disabled={disableNonDesc}
                />
                {errors.total_marks && (
                  <div className="sx-err">{errors.total_marks}</div>
                )}
              </div>
              <div>
                <label className="sx-label">Pass Marks</label>
                <input
                  type="number"
                  className={`sx-input ${
                    errors.pass_marks ? "sx-input--err" : ""
                  }`}
                  value={form.pass_marks}
                  onChange={(e) => set("pass_marks", e.target.value)}
                  min={0}
                  disabled={disableNonDesc}
                />
                {errors.pass_marks && (
                  <div className="sx-err">{errors.pass_marks}</div>
                )}
              </div>
            </div>

            <div className="sx-colspan-2">
              <label className="sx-label">Exam Description / Instructions</label>
              <textarea
                className="sx-input"
                rows={5}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Rules, materials allowed, notes..."
                disabled={disabled ? !descOnly : false}
              />
            </div>
          </div>
        </div>

        <div className="sx-modal__foot">
          <button
            className="sx-btn sx-btn--ghost"
            onClick={onClose}
            disabled={loading}
          >
            Close
          </button>

          {!readOnlyAll && (
            <button
              className="sx-btn sx-btn--primary"
              disabled={loading}
              onClick={() => {
                if (!validate()) return;

                if (descOnly && initial?.id) {
                  onSubmit("descOnly", { description: form.description });
                  return;
                }

                // ✅ IMPORTANT FIX: DO NOT convert to UTC ISO string
                // Keep local date-time string so it won't shift after save
                const payload = {
                  title: form.title.trim(),
                  subject_id: Number(form.subject_id),
                  start_at: localInputToLocalDateTimeString(form.start_at), // ✅ FIX
                  end_at: localInputToLocalDateTimeString(form.end_at),     // ✅ FIX
                  duration_minutes: Number(form.duration_minutes),
                  total_marks: Number(form.total_marks),
                  pass_marks: Number(form.pass_marks),
                  description: form.description,
                };

                onSubmit(mode, payload);
              }}
            >
              {loading
                ? "Saving..."
                : descOnly
                ? "Save Description"
                : mode === "edit"
                ? "Save Changes"
                : "Save Draft"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/* =========================
   MAIN PAGE
========================= */
export default function StaffExams() {
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [toast, setToast] = useState(null);

  // UI state
  const [tab, setTab] = useState("draft"); // draft | pending | changes_requested | approved | rejected

  // ✅ From/To default dates
  const defaultFrom = useMemo(() => dateToYMD(new Date()), []);
  const defaultTo = useMemo(() => addDaysYMD(30), []);
  const [subjectId, setSubjectId] = useState("all");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState(defaultFrom); // YYYY-MM-DD
  const [to, setTo] = useState(defaultTo); // YYYY-MM-DD

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create | edit
  const [editing, setEditing] = useState(null);

  // confirm
  const [confirm, setConfirm] = useState({ open: false, type: "", exam: null });

  const showToast = (type, message) => {
    setToast({ type, message });
    window.clearTimeout(window.__sxToast);
    window.__sxToast = window.setTimeout(() => setToast(null), 3200);
  };

  /* =========================
     API PATHS (adjust here)
  ========================= */
  const PATH_SUBJECTS = "/staff/subjects";
  const PATH_EXAMS = "/staff/exams";
  const PATH_CREATE = "/staff/exams";
  const pathUpdate = (id) => `/staff/exams/${id}`;
  const pathDelete = (id) => `/staff/exams/${id}`;
  const pathSubmit = (id) => `/staff/exams/${id}/submit`;
  const pathCancelRequest = (id) => `/staff/exams/${id}/cancel-request`;
  const pathResubmit = (id) => `/staff/exams/${id}/resubmit`;
  const pathUpdateDescription = (id) => `/staff/exams/${id}/description`;

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
      showToast("error", e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enrichedExams = useMemo(() => {
    return (exams || []).map((x) => ({
      ...x,
      _status: normalizeStatus(x),
      _subject_id: String(x.subject_id ?? x.subject?.id ?? ""),
      _subject_name: x.subject?.name || x.subject_name || "",
      _subject_code: x.subject?.code || x.subject_code || "",
      _admin_note: x.admin_note || "",
    }));
  }, [exams]);

  const stats = useMemo(() => {
    const s = {
      draft: 0,
      pending: 0,
      changes_requested: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
    };
    for (const x of enrichedExams) {
      if (s[x._status] !== undefined) s[x._status] += 1;
    }
    return s;
  }, [enrichedExams]);

  // ✅ To date include end of day 23:59:59
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const f = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const t = to ? new Date(`${to}T23:59:59`).getTime() : null;

    return enrichedExams
      .filter((x) => {
        if (tab !== "all" && x._status !== tab) return false;

        if (subjectId !== "all" && x._subject_id !== String(subjectId)) return false;

        if (qq) {
          const hay = `${x.title || ""} ${x._subject_name} ${x._subject_code}`.toLowerCase();
          if (!hay.includes(qq)) return false;
        }

        const st = x.start_at ? new Date(normalizeDateStr(x.start_at)).getTime() : null; // ✅ normalize
        if (f && (!st || st < f)) return false;
        if (t && (!st || st > t)) return false;

        return true;
      })
      .sort(
        (a, b) =>
          new Date(normalizeDateStr(b.start_at || 0)).getTime() -
          new Date(normalizeDateStr(a.start_at || 0)).getTime()
      ); // ✅ normalize
  }, [enrichedExams, tab, subjectId, q, from, to]);

  const openCreate = () => {
    setEditing(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const openEdit = (exam) => {
    setEditing(exam);
    setModalMode("edit");
    setModalOpen(true);
  };

  // ✅ Tab click => always show table data + reset filters to default dates
  const onTab = (t) => {
    setTab(t);
    setQ("");
    setSubjectId("all");
    setFrom(defaultFrom);
    setTo(defaultTo);
  };

  /* =========================
     ACTION RULES (Staff)
  ========================= */
  const canEdit = (st) => st === "draft" || st === "changes_requested";
  const canDelete = (st) => st === "draft";
  const canSubmit = (st) => st === "draft";
  const canCancelRequest = (st) => st === "pending";
  const canResubmit = (st) => st === "changes_requested";
  const canEditDescriptionOnly = (st) => st === "approved";

  /* =========================
     CRUD HANDLERS
  ========================= */
  const handleSave = async (mode, payload) => {
    try {
      setBusy(true);

      if (mode === "create") {
        await apiFetch(PATH_CREATE, { method: "POST", body: payload });
        showToast("success", "Saved as Draft");
      } else if (mode === "edit") {
        if (!editing?.id) throw new Error("Missing exam id");
        await apiFetch(pathUpdate(editing.id), { method: "PUT", body: payload });
        showToast("success", "Updated");
      } else if (mode === "descOnly") {
        if (!editing?.id) throw new Error("Missing exam id");
        await apiFetch(pathUpdateDescription(editing.id), { method: "PATCH", body: payload });
        showToast("success", "Description updated");
      }

      setModalOpen(false);
      await loadAll();
    } catch (e) {
      showToast("error", e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const ask = (type, exam) => setConfirm({ open: true, type, exam });

  const runConfirm = async () => {
    const exam = confirm.exam;
    if (!exam?.id) return;

    try {
      setBusy(true);

      if (confirm.type === "delete") {
        await apiFetch(pathDelete(exam.id), { method: "DELETE" });
        showToast("success", "Deleted");
      } else if (confirm.type === "submit") {
        await apiFetch(pathSubmit(exam.id), { method: "PATCH" });
        showToast("success", "Sent for Admin Approval");
      } else if (confirm.type === "cancel") {
        await apiFetch(pathCancelRequest(exam.id), { method: "PATCH" });
        showToast("success", "Cancelled request (Back to Draft)");
      } else if (confirm.type === "resubmit") {
        await apiFetch(pathResubmit(exam.id), { method: "PATCH" });
        showToast("success", "Resubmitted for Approval");
      }

      setConfirm({ open: false, type: "", exam: null });
      await loadAll();
    } catch (e) {
      showToast("error", e.message || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sx-page">
      <style>{`
        .sx-page{padding:24px;max-width:1200px;margin:0 auto}
        .sx-top{display:flex;gap:16px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
        .sx-title h1{margin:0;font-size:22px}
        .sx-title p{margin:6px 0 0;color:#667085}
        .sx-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
        .sx-btn{border:1px solid #e4e7ec;background:#fff;padding:10px 12px;border-radius:10px;cursor:pointer;font-weight:800}
        .sx-btn:disabled{opacity:.6;cursor:not-allowed}
        /* ✅ BLUE Primary */
        .sx-btn--primary{background:#2563EB;border-color:#2563EB;color:#fff}
        .sx-btn--ghost{background:#fff}
        .sx-btn--danger{background:#ffe4e6;border-color:#fecdd3;color:#9f1239}
        .sx-icon-btn{border:none;background:transparent;cursor:pointer;font-size:16px}
        .sx-row{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:18px}
        .sx-input{width:100%;border:1px solid #e4e7ec;border-radius:10px;padding:10px 12px;outline:none}
        .sx-input--err{border-color:#fda29b}
        .sx-label{display:block;font-size:13px;font-weight:800;margin-bottom:6px}
        .sx-err{color:#b42318;font-size:12px;margin-top:6px}
        .sx-muted{color:#667085;font-size:13px}
        .sx-note{border:1px solid #e4e7ec;background:#fcfcfd;padding:10px 12px;border-radius:12px;margin-bottom:12px}
        .sx-note--warn{background:#fff7ed;border-color:#fed7aa}
        .sx-note--ok{background:#ecfdf3;border-color:#abefc6}
        .sx-tabs{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
        .sx-tab{border:1px solid #e4e7ec;border-radius:999px;padding:8px 12px;background:#fff;cursor:pointer;font-weight:900}
        /* ✅ BLUE active tab */
        .sx-tab.active{background:#2563EB;color:#fff;border-color:#2563EB}
        .sx-pill{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;border-radius:999px;margin-left:8px;font-size:12px;font-weight:900;background:#f2f4f7;color:#344054}
        .sx-tab.active .sx-pill{background:rgba(255,255,255,.2);color:#fff}
        .sx-filters{border:1px solid #e4e7ec;border-radius:14px;padding:14px;background:#fff;margin-top:14px}
        .sx-filters .sx-row > div{min-width:180px;flex:1}
        .sx-tablewrap{margin-top:14px;border:1px solid #e4e7ec;border-radius:14px;overflow:hidden;background:#fff}
        .sx-table-scroll{overflow:auto}
        table{width:100%;border-collapse:collapse;min-width:980px}
        th,td{padding:12px 12px;border-bottom:1px solid #f2f4f7;text-align:left;font-size:14px;vertical-align:top}
        th{background:#fcfcfd;font-size:12px;color:#667085;text-transform:uppercase;letter-spacing:.04em}
        .sx-actions-col{display:flex;gap:8px;flex-wrap:wrap}
        .sx-link{border:none;background:transparent;color:#2563EB;font-weight:900;cursor:pointer;padding:0;margin-top:8px}
        .sx-empty{padding:24px;text-align:center;color:#667085}
        .sx-toast{position:fixed;top:18px;right:18px;z-index:9999;display:flex;gap:12px;align-items:center;max-width:380px;padding:12px 14px;border-radius:14px;color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.12)}
        .sx-toast.ok{background:#027a48}
        .sx-toast.err{background:#b42318}
        .sx-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:9998}
        .sx-modal{position:fixed;z-index:9999;left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,calc(100% - 24px));background:#fff;border-radius:16px;border:1px solid #e4e7ec;overflow:hidden}
        .sx-modal--xl{width:min(880px,calc(100% - 24px))}
        .sx-modal__head{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid #f2f4f7}
        .sx-modal__body{padding:16px}
        .sx-modal__foot{display:flex;justify-content:flex-end;gap:10px;padding:14px 16px;border-top:1px solid #f2f4f7}
        .sx-grid{display:grid;gap:12px}
        .sx-grid--2{grid-template-columns:repeat(2,minmax(0,1fr))}
        .sx-grid--tight{gap:10px}
        .sx-colspan-2{grid-column:1 / -1}
        .sx-badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:900;border:1px solid #e4e7ec}
        .sx-badge--draft{background:#f9fafb;color:#344054}
        .sx-badge--pending{background:#eff8ff;color:#175cd3;border-color:#b2ddff}
        .sx-badge--changes{background:#fff7ed;color:#9a3412;border-color:#fed7aa}
        .sx-badge--approved{background:#ecfdf3;color:#027a48;border-color:#abefc6}
        .sx-badge--rejected{background:#fef3f2;color:#b42318;border-color:#fda29b}
        .sx-badge--cancelled{background:#f2f4f7;color:#344054;border-color:#e4e7ec}
        @media (max-width: 640px){
          .sx-page{padding:14px}
          .sx-grid--2{grid-template-columns:1fr}
          .sx-filters .sx-row > div{min-width:unset}
          table{min-width:920px}
        }
      `}</style>

      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="sx-top">
        <div className="sx-title">
          <h1>My Exams</h1>
          <p>Create exams, send for admin approval, and track status.</p>
        </div>

        <div className="sx-actions">
          <button className="sx-btn sx-btn--ghost" onClick={loadAll} disabled={loading || busy}>
            {loading ? "Loading..." : "Refresh"}
          </button>

          <button
            className="sx-btn sx-btn--primary"
            onClick={openCreate}
            disabled={busy || loading || subjects.length === 0}
          >
            + Create Exam
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="sx-tabs">
        <button className={`sx-tab ${tab === "draft" ? "active" : ""}`} onClick={() => onTab("draft")}>
          Draft <span className="sx-pill">{stats.draft}</span>
        </button>
        <button className={`sx-tab ${tab === "pending" ? "active" : ""}`} onClick={() => onTab("pending")}>
          Pending <span className="sx-pill">{stats.pending}</span>
        </button>
        <button
          className={`sx-tab ${tab === "changes_requested" ? "active" : ""}`}
          onClick={() => onTab("changes_requested")}
        >
          Changes <span className="sx-pill">{stats.changes_requested}</span>
        </button>
        <button className={`sx-tab ${tab === "approved" ? "active" : ""}`} onClick={() => onTab("approved")}>
          Approved <span className="sx-pill">{stats.approved}</span>
        </button>
        <button className={`sx-tab ${tab === "rejected" ? "active" : ""}`} onClick={() => onTab("rejected")}>
          Rejected <span className="sx-pill">{stats.rejected}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="sx-filters">
        <div className="sx-row">
          <div>
            <label className="sx-label">Subject</label>
            <select className="sx-input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="all">All subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.code ? `${s.code} — ` : ""}
                  {s.name} {s.year && s.semester ? `(Y${s.year}S${s.semester})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="sx-label">From</label>
            <input type="date" className="sx-input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>

          <div>
            <label className="sx-label">To</label>
            <input type="date" className="sx-input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          <div style={{ flex: 2, minWidth: 240 }}>
            <label className="sx-label">Search</label>
            <input
              className="sx-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search exam title / subject..."
            />
          </div>

          <div style={{ minWidth: 160, alignSelf: "end" }}>
            <button
              className="sx-btn"
              onClick={() => {
                setSubjectId("all");
                setFrom(defaultFrom);
                setTo(defaultTo);
                setQ("");
              }}
              disabled={busy || loading}
              title="Reset filters"
              style={{ width: "100%" }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* List (TABLE ONLY) */}
      {loading ? (
        <div className="sx-empty">Loading exams...</div>
      ) : filtered.length === 0 ? (
        <div className="sx-empty">
          <div style={{ fontWeight: 900, marginBottom: 6 }}>No exams found</div>
          <div className="sx-muted" style={{ marginBottom: 14 }}>
            Tip: Date filters change panni check pannunga (From/To default today → +30 days).
          </div>
          <button className="sx-btn sx-btn--primary" onClick={openCreate} disabled={subjects.length === 0}>
            + Create Exam
          </button>
        </div>
      ) : (
        <div className="sx-tablewrap">
          <div className="sx-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Module / Subject</th>
                  <th>Schedule</th>
                  <th>Marks</th>
                  <th>Status</th>
                  <th style={{ width: 360 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((x) => {
                  const st = x._status;

                  const editOk = canEdit(st);
                  const delOk = canDelete(st);
                  const submitOk = canSubmit(st);
                  const cancelOk = canCancelRequest(st);
                  const resubmitOk = canResubmit(st);
                  const descOk = canEditDescriptionOnly(st);

                  return (
                    <tr key={x.id}>
                      <td>
                        <div style={{ fontWeight: 900 }}>{x.title || "Untitled"}</div>
                        {x._admin_note ? (
                          <div className="sx-muted" style={{ marginTop: 6 }}>
                            <b>Admin note:</b> {x._admin_note}
                          </div>
                        ) : null}
                      </td>

                      <td>
                        {x._subject_code ? <div style={{ fontWeight: 900 }}>{x._subject_code}</div> : null}
                        <div>{x._subject_name || "-"}</div>
                        {x.year && x.semester ? (
                          <div className="sx-muted" style={{ marginTop: 4 }}>
                            {`Y${x.year}S${x.semester}`}
                          </div>
                        ) : null}
                      </td>

                      <td>
                        <div>
                          <span className="sx-muted">Start:</span> {fmtDateTime(x.start_at)}
                        </div>
                        <div>
                          <span className="sx-muted">End:</span> {fmtDateTime(x.end_at)}
                        </div>
                        <div className="sx-muted" style={{ marginTop: 4 }}>
                          Duration: {x.duration_minutes ? `${x.duration_minutes} mins` : "-"}
                        </div>
                      </td>

                      <td>
                        <div>
                          <b>{x.total_marks ?? "-"}</b> total
                        </div>
                        <div className="sx-muted">Pass: {x.pass_marks ?? "-"}</div>
                      </td>

                      <td>
                        <span className={badgeClass(st)}>{statusLabel(st)}</span>
                      </td>

                      <td>
                        <div className="sx-actions-col">
                          <button
                            className="sx-btn"
                            onClick={() => openEdit(x)}
                            disabled={busy || (!editOk && !descOk)}
                            title={
                              st === "approved"
                                ? "Approved: edit description only"
                                : st === "pending"
                                ? "Pending: cannot edit"
                                : st === "rejected"
                                ? "Rejected: view only"
                                : ""
                            }
                          >
                            {descOk && !editOk ? "Edit Desc" : "Edit"}
                          </button>

                          <button
                            className="sx-btn sx-btn--primary"
                            onClick={() => ask("submit", x)}
                            disabled={busy || !submitOk}
                            title="Send to admin for approval"
                          >
                            Submit
                          </button>

                          <button
                            className="sx-btn"
                            onClick={() => ask("resubmit", x)}
                            disabled={busy || !resubmitOk}
                            title="Resubmit after changes requested"
                          >
                            Resubmit
                          </button>

                          <button
                            className="sx-btn"
                            onClick={() => ask("cancel", x)}
                            disabled={busy || !cancelOk}
                            title="Cancel request back to Draft"
                          >
                            Cancel Req
                          </button>

                          <button
                            className="sx-btn sx-btn--danger"
                            onClick={() => ask("delete", x)}
                            disabled={busy || !delOk}
                            title="Only Draft can be deleted"
                          >
                            Delete
                          </button>
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

      <ExamModal
        open={modalOpen}
        mode={modalMode}
        subjects={subjects}
        initial={editing}
        status={editing?._status}
        allowDescriptionOnly={true}
        loading={busy}
        onClose={() => (busy ? null : setModalOpen(false))}
        onSubmit={(m, payload) => handleSave(m, payload)}
      />

      <ConfirmDialog
        open={confirm.open}
        title={
          confirm.type === "delete"
            ? "Delete Draft Exam"
            : confirm.type === "submit"
            ? "Submit for Admin Approval"
            : confirm.type === "cancel"
            ? "Cancel Request"
            : "Resubmit for Approval"
        }
        message={
          confirm.type === "delete"
            ? `Delete "${confirm.exam?.title || "this exam"}"? This cannot be undone.`
            : confirm.type === "submit"
            ? `Submit "${confirm.exam?.title || "this exam"}" to admin? After submit, you can't edit until admin responds.`
            : confirm.type === "cancel"
            ? `Cancel request and move back to Draft?`
            : `Resubmit "${confirm.exam?.title || "this exam"}" to admin?`
        }
        confirmText={
          confirm.type === "delete"
            ? "Delete"
            : confirm.type === "submit"
            ? "Submit"
            : confirm.type === "cancel"
            ? "Cancel Request"
            : "Resubmit"
        }
        danger={confirm.type === "delete"}
        loading={busy}
        onClose={() => (busy ? null : setConfirm({ open: false, type: "", exam: null }))}
        onConfirm={runConfirm}
      />
    </div>
  );
}