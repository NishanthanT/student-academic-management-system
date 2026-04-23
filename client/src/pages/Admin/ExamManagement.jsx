import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
  : `http://${window.location.hostname}:8000`;
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
      <button className="ax-icon-btn ax-icon-btn--toast" onClick={onClose} aria-label="close" id="exammanagement-button-1">
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
          <div>
            <p className="ax-modal__eyebrow">Confirmation</p>
            <h3>{title}</h3>
          </div>
          <button className="ax-icon-btn" onClick={onClose} disabled={loading} aria-label="close" id="exammanagement-button-2">
            ✕
          </button>
        </div>

        <div className="ax-modal__body">
          <p className="ax-muted">{message}</p>
        </div>

        <div className="ax-modal__foot">
          <button className="ax-btn ax-btn--ghost" onClick={onClose} disabled={loading} id="exammanagement-button-3">
            No
          </button>
          <button
            className={`ax-btn ${danger ? "ax-btn--danger" : "ax-btn--primary"}`}
            onClick={onConfirm}
            disabled={loading}
           id="exammanagement-button-4">
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
          <div>
            <p className="ax-modal__eyebrow">Action</p>
            <h3>{title}</h3>
          </div>
          <button className="ax-icon-btn" onClick={onClose} disabled={loading} aria-label="close" id="exammanagement-button-5">
            ✕
          </button>
        </div>

        <div className="ax-modal__body">
          <label className="ax-label">{label}</label>
          <textarea
            className="ax-input ax-textarea"
            rows={4}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
           id="exammanagement-textarea-1"/>
          <div className="ax-muted ax-note-hint">Minimum 3 characters.</div>
        </div>

        <div className="ax-modal__foot">
          <button className="ax-btn ax-btn--ghost" onClick={onClose} disabled={loading} id="exammanagement-button-6">
            Cancel
          </button>
          <button className="ax-btn ax-btn--primary" onClick={onConfirm} disabled={disabled} id="exammanagement-button-7">
            {loading ? "Sending..." : confirmText || "Send"}
          </button>
        </div>
      </div>
    </>
  );
}

function TabButton({ active, label, count, onClick, variant }) {
  return (
    <button className={`ax-tab ax-tab--${variant} ${active ? "active" : ""}`} onClick={onClick} id={`exammanagement-tab-${variant}`}>
      <span className="ax-tab__label">{label}</span>
      <span className="ax-pill">{count}</span>
    </button>
  );
}

export default function ExamManagement() {
  const PATH_LIST = "/admin/exams";
  const pathApprove = (id) => `/admin/exams/${id}/approve`;
  const pathReject = (id) => `/admin/exams/${id}/reject`;
  const pathChanges = (id) => `/admin/exams/${id}/changes`;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [toast, setToast] = useState(null);

  const [tab, setTab] = useState("pending");
  const [q, setQ] = useState("");
  const [subjectId, setSubjectId] = useState("all");
  const [date, setDate] = useState("");

  const [subjects, setSubjects] = useState([]);

  const [confirm, setConfirm] = useState({ open: false, type: "", exam: null });
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteType, setNoteType] = useState("");
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
        if (date && x._ymd !== date) return false;

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
      showToast("success", "Approved successfully");
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
        showToast("success", "Rejected successfully");
      } else {
        await apiFetch(pathChanges(ex.id), { method: "PATCH", body: { admin_note: msg } });
        showToast("success", "Changes requested successfully");
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
    <div className="ax-shell">
      <style>{`
        :root{
          --ax-bg:#eef4ff;
          --ax-bg-2:#f8fbff;
          --ax-bg-3:#e4ecff;
          --ax-card:rgba(255,255,255,.72);
          --ax-card-2:rgba(255,255,255,.90);
          --ax-card-3:rgba(255,255,255,.80);
          --ax-line:rgba(148,163,184,.22);
          --ax-line-strong:rgba(96,165,250,.45);
          --ax-text:#0f172a;
          --ax-text-soft:#334155;
          --ax-sub:#64748b;
          --ax-shadow:0 20px 45px rgba(15,23,42,.10);
          --ax-blue:#2563eb;
          --ax-blue-2:#3b82f6;
        }

        html.dark .ax-shell,
        .dark .ax-shell{
          --ax-bg:#020817;
          --ax-bg-2:#071226;
          --ax-bg-3:#0b1730;
          --ax-card:rgba(15,23,42,.72);
          --ax-card-2:rgba(15,23,42,.90);
          --ax-card-3:rgba(30,41,59,.80);
          --ax-line:rgba(148,163,184,.18);
          --ax-line-strong:rgba(96,165,250,.38);
          --ax-text:#e5eefc;
          --ax-text-soft:#cbd5e1;
          --ax-sub:#94a3b8;
          --ax-shadow:0 20px 45px rgba(2,6,23,.35);
          --ax-blue:#60a5fa;
          --ax-blue-2:#2563eb;
        }

        .ax-shell{
          min-height:100vh;
          background:
            radial-gradient(circle at top left, rgba(59,130,246,.16), transparent 30%),
            radial-gradient(circle at top right, rgba(139,92,246,.12), transparent 28%),
            radial-gradient(circle at bottom center, rgba(6,182,212,.10), transparent 22%),
            linear-gradient(135deg, var(--ax-bg), var(--ax-bg-2) 45%, var(--ax-bg-3));
          background-size:100% 100%,100% 100%,100% 100%,200% 200%;
          animation: axBgMove 16s ease-in-out infinite;
          padding:24px;
        }

        .ax-page{
          max-width:1300px;
          margin:0 auto;
          color:var(--ax-text);
        }

        .ax-top-card,
        .ax-filters,
        .ax-tablewrap,
        .ax-modal{
          position:relative;
          overflow:hidden;
          border:1px solid var(--ax-line);
          background:var(--ax-card);
          backdrop-filter:blur(18px);
          -webkit-backdrop-filter:blur(18px);
          box-shadow:var(--ax-shadow);
        }

        .ax-top-card::before,
        .ax-filters::before,
        .ax-tablewrap::before,
        .ax-modal::before{
          content:"";
          position:absolute;
          inset:0;
          pointer-events:none;
          background:linear-gradient(120deg, transparent 15%, rgba(255,255,255,.10) 42%, transparent 70%);
          transform:translateX(-120%);
          animation:axShine 8s linear infinite;
        }

        html.dark .ax-top-card::before,
        html.dark .ax-filters::before,
        html.dark .ax-tablewrap::before,
        html.dark .ax-modal::before,
        .dark .ax-top-card::before,
        .dark .ax-filters::before,
        .dark .ax-tablewrap::before,
        .dark .ax-modal::before{
          background:linear-gradient(120deg, transparent 15%, rgba(255,255,255,.06) 42%, transparent 70%);
        }

        .ax-top-card{
          border-radius:24px;
          padding:20px 24px;
          margin-bottom:18px;
        }

        .ax-top{
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:18px;
          flex-wrap:wrap;
        }

        .ax-title h1{
          margin:0;
          font-size:24px;
          line-height:1.2;
          font-weight:900;
          letter-spacing:-0.02em;
          color:var(--ax-text);
        }

        .ax-title p{
          margin:6px 0 0;
          color:var(--ax-sub);
          font-size:13px;
          font-weight:600;
        }

        .ax-eyebrow{
          margin:0 0 6px;
          font-size:10px;
          font-weight:900;
          letter-spacing:.22em;
          text-transform:uppercase;
          color:var(--ax-blue);
        }

        .ax-btn{
          border:1px solid var(--ax-line);
          background:var(--ax-card-3);
          color:var(--ax-text);
          padding:10px 14px;
          border-radius:14px;
          cursor:pointer;
          font-weight:900;
          font-size:13px;
          transition:all .28s ease;
          position:relative;
          overflow:hidden;
          box-shadow:0 10px 24px rgba(15,23,42,.08);
        }

        html.dark .ax-btn,
        .dark .ax-btn{
          box-shadow:0 10px 24px rgba(2,6,23,.18);
        }

        .ax-btn::after{
          content:"";
          position:absolute;
          inset:0;
          background:linear-gradient(120deg, transparent 20%, rgba(255,255,255,.20) 48%, transparent 75%);
          transform:translateX(-140%);
          transition:transform .65s ease;
        }

        html.dark .ax-btn::after,
        .dark .ax-btn::after{
          background:linear-gradient(120deg, transparent 20%, rgba(255,255,255,.12) 48%, transparent 75%);
        }

        .ax-btn:hover::after{
          transform:translateX(140%);
        }

        .ax-btn:hover{
          transform:translateY(-2px);
          border-color:var(--ax-line-strong);
          box-shadow:0 16px 28px rgba(37,99,235,.14);
        }

        .ax-btn:active{
          transform:scale(.98);
        }

        .ax-btn:disabled{
          opacity:.58;
          cursor:not-allowed;
          transform:none;
          box-shadow:none;
        }

        .ax-btn--primary{
          background:linear-gradient(135deg, #2563eb, #3b82f6 52%, #4f46e5);
          border-color:transparent;
          color:#fff;
          box-shadow:0 18px 34px rgba(37,99,235,.24);
        }

        .ax-btn--danger{
          background:linear-gradient(135deg, #fb7185, #f43f5e 55%, #ef4444);
          border-color:transparent;
          color:#fff;
          box-shadow:0 18px 34px rgba(244,63,94,.20);
        }

        .ax-btn--ghost{
          background:var(--ax-card-3);
          color:var(--ax-text);
        }

        .ax-icon-btn{
          width:42px;
          height:42px;
          border-radius:14px;
          border:1px solid var(--ax-line);
          background:var(--ax-card-3);
          cursor:pointer;
          font-size:16px;
          font-weight:900;
          color:var(--ax-text);
          transition:all .28s ease;
        }

        .ax-icon-btn:hover{
          transform:rotate(90deg) scale(1.04);
          border-color:var(--ax-line-strong);
          box-shadow:0 12px 24px rgba(37,99,235,.14);
        }

        .ax-icon-btn--toast{
          width:32px;
          height:32px;
          background:rgba(255,255,255,.12);
          color:#fff;
          border-color:rgba(255,255,255,.16);
        }

        .ax-input{
          width:100%;
          border:1px solid var(--ax-line);
          border-radius:14px;
          padding:10px 14px;
          outline:none;
          background:var(--ax-card-3);
          color:var(--ax-text);
          font-size:13px;
          font-weight:600;
          transition:all .28s ease;
        }

        .ax-input::placeholder{
          color:var(--ax-sub);
        }

        .ax-input:hover{
          border-color:rgba(96,165,250,.30);
          box-shadow:0 10px 22px rgba(59,130,246,.08);
        }

        .ax-input:focus{
          border-color:rgba(59,130,246,.62);
          box-shadow:0 0 0 4px rgba(59,130,246,.10), 0 14px 28px rgba(59,130,246,.12);
          transform:translateY(-1px);
        }

        .ax-textarea{
          resize:vertical;
          min-height:110px;
        }

        .ax-label{
          display:block;
          font-size:10px;
          font-weight:900;
          margin-bottom:8px;
          color:var(--ax-sub);
          letter-spacing:.12em;
          text-transform:uppercase;
          margin-left:4px;
        }

        .ax-muted{
          color:var(--ax-sub);
          font-size:13px;
          font-weight:600;
        }

        .ax-note-hint{
          margin-top:10px;
        }

        .ax-tabs{
          display:flex;
          gap:12px;
          flex-wrap:wrap;
          margin-top:18px;
          margin-bottom:18px;
        }

        .ax-tab{
          position:relative;
          display:inline-flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
          min-width:140px;
          border-radius:999px;
          padding:10px 16px;
          border:1px solid var(--ax-line);
          background:var(--ax-card-3);
          color:var(--ax-text);
          font-weight:900;
          font-size:14px;
          cursor:pointer;
          transition:all .30s ease;
          overflow:hidden;
          box-shadow:0 10px 24px rgba(15,23,42,.06);
        }

        html.dark .ax-tab,
        .dark .ax-tab{
          box-shadow:0 10px 24px rgba(2,6,23,.18);
        }

        .ax-tab::before{
          content:"";
          position:absolute;
          inset:0;
          opacity:0;
          transition:opacity .30s ease;
          background-size:200% 200%;
          animation:axGradientFlow 6s ease infinite;
        }

        .ax-tab:hover{
          transform:translateY(-2px);
          border-color:rgba(96,165,250,.34);
          box-shadow:0 16px 30px rgba(37,99,235,.12);
        }

        .ax-tab:hover::before,
        .ax-tab.active::before{
          opacity:1;
        }

        .ax-tab--pending::before{
          background:linear-gradient(135deg, #2563eb, #3b82f6 42%, #4f46e5);
        }

        .ax-tab--changes::before{
          background:linear-gradient(135deg, #7c3aed, #8b5cf6 45%, #2563eb);
        }

        .ax-tab--approved::before{
          background:linear-gradient(135deg, #0f766e, #14b8a6 45%, #22c55e);
        }

        .ax-tab--rejected::before{
          background:linear-gradient(135deg, #e11d48, #fb7185 45%, #f97316);
        }

        .ax-tab.active{
          color:#fff;
          border-color:transparent;
          box-shadow:0 18px 34px rgba(37,99,235,.22);
        }

        .ax-tab__label{
          position:relative;
          z-index:2;
        }

        .ax-pill{
          position:relative;
          z-index:2;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          min-width:30px;
          height:30px;
          border-radius:999px;
          font-size:13px;
          font-weight:900;
          background:rgba(15,23,42,.08);
          color:var(--ax-text-soft);
        }

        html.dark .ax-pill,
        .dark .ax-pill{
          background:rgba(255,255,255,.08);
          color:#e2e8f0;
        }

        .ax-tab.active .ax-pill{
          background:rgba(255,255,255,.18);
          color:#fff;
        }

        .ax-filters{
          border-radius:24px;
          padding:18px;
          margin-top:2px;
        }

        .ax-row{
          display:flex;
          gap:14px;
          flex-wrap:wrap;
          align-items:end;
        }

        .ax-row > div{
          min-width:180px;
          flex:1;
        }

        .ax-tablewrap{
          margin-top:18px;
          border-radius:26px;
        }

        table{
          width:100%;
          border-collapse:collapse;
        }

        th, td{
          padding:14px 16px;
          border-bottom:1px solid var(--ax-line);
          text-align:left;
          font-size:13px;
          vertical-align:top;
          color:var(--ax-text);
        }

        th{
          background:rgba(248,250,252,.75);
          font-size:9px;
          color:var(--ax-sub);
          text-transform:uppercase;
          letter-spacing:.18em;
          font-weight:900;
        }

        html.dark th,
        .dark th{
          background:rgba(15,23,42,.78);
        }

        tbody tr{
          transition:all .24s ease;
        }

        tbody tr:hover{
          background:rgba(239,246,255,.72);
        }

        html.dark tbody tr:hover,
        .dark tbody tr:hover{
          background:rgba(30,41,59,.46);
        }

        .ax-actions-col{
          display:flex;
          gap:8px;
          flex-wrap:wrap;
        }

        .ax-badge{
          display:inline-flex;
          align-items:center;
          padding:4px 10px;
          border-radius:999px;
          font-size:11px;
          font-weight:900;
          border:1px solid transparent;
          letter-spacing:.04em;
        }

        .ax-badge--pending{
          background:#eff6ff;
          color:#1d4ed8;
          border-color:#bfdbfe;
        }

        .ax-badge--changes{
          background:#f5f3ff;
          color:#6d28d9;
          border-color:#ddd6fe;
        }

        .ax-badge--approved{
          background:#ecfdf3;
          color:#027a48;
          border-color:#abefc6;
        }

        .ax-badge--rejected{
          background:#fef2f2;
          color:#b91c1c;
          border-color:#fecaca;
        }

        html.dark .ax-badge--pending,
        .dark .ax-badge--pending{
          background:rgba(59,130,246,.14);
          color:#93c5fd;
          border-color:rgba(96,165,250,.28);
        }

        html.dark .ax-badge--changes,
        .dark .ax-badge--changes{
          background:rgba(139,92,246,.14);
          color:#c4b5fd;
          border-color:rgba(167,139,250,.28);
        }

        html.dark .ax-badge--approved,
        .dark .ax-badge--approved{
          background:rgba(16,185,129,.14);
          color:#86efac;
          border-color:rgba(52,211,153,.28);
        }

        html.dark .ax-badge--rejected,
        .dark .ax-badge--rejected{
          background:rgba(244,63,94,.14);
          color:#fda4af;
          border-color:rgba(251,113,133,.28);
        }

        .ax-empty{
          padding:32px;
          text-align:center;
          color:var(--ax-sub);
          font-weight:700;
        }

        .ax-toast{
          position:fixed;
          top:18px;
          right:18px;
          z-index:9999;
          display:flex;
          gap:12px;
          align-items:center;
          max-width:390px;
          padding:14px 16px;
          border-radius:18px;
          color:#fff;
          box-shadow:0 18px 34px rgba(0,0,0,.18);
          backdrop-filter:blur(14px);
          animation:axToastIn .28s ease;
        }

        .ax-toast.ok{
          background:linear-gradient(135deg, #059669, #16a34a);
        }

        .ax-toast.err{
          background:linear-gradient(135deg, #dc2626, #f43f5e);
        }

        .ax-backdrop{
          position:fixed;
          inset:0;
          background:rgba(2,6,23,.34);
          backdrop-filter:blur(6px);
          z-index:9998;
          animation:axFade .22s ease;
        }

        html.dark .ax-backdrop,
        .dark .ax-backdrop{
          background:rgba(2,6,23,.62);
        }

        .ax-modal{
          position:fixed;
          z-index:9999;
          left:50%;
          top:50%;
          transform:translate(-50%,-50%);
          width:min(560px,calc(100% - 24px));
          border-radius:24px;
          background:var(--ax-card-2);
          animation:axModalIn .24s ease;
        }

        .ax-modal__head{
          display:flex;
          justify-content:space-between;
          align-items:center;
          padding:18px;
          border-bottom:1px solid var(--ax-line);
        }

        .ax-modal__head h3{
          margin:4px 0 0;
          font-size:24px;
          line-height:1.1;
          font-weight:900;
          color:var(--ax-text);
        }

        .ax-modal__eyebrow{
          margin:0;
          font-size:11px;
          font-weight:900;
          letter-spacing:.24em;
          text-transform:uppercase;
          color:var(--ax-blue);
        }

        .ax-modal__body{
          padding:18px;
        }

        .ax-modal__foot{
          display:flex;
          justify-content:flex-end;
          gap:10px;
          padding:16px 18px 18px;
          border-top:1px solid var(--ax-line);
        }

        @keyframes axBgMove{
          0%,100%{background-position:0% 0%,100% 0%,50% 100%,0% 50%}
          50%{background-position:10% 10%,90% 5%,55% 90%,100% 50%}
        }

        @keyframes axShine{
          0%{transform:translateX(-120%)}
          20%{transform:translateX(140%)}
          100%{transform:translateX(140%)}
        }

        @keyframes axGradientFlow{
          0%,100%{background-position:0% 50%}
          50%{background-position:100% 50%}
        }

        @keyframes axToastIn{
          from{opacity:0;transform:translateY(-12px) translateX(8px)}
          to{opacity:1;transform:translateY(0) translateX(0)}
        }

        @keyframes axModalIn{
          from{opacity:0;transform:translate(-50%,-48%) scale(.96)}
          to{opacity:1;transform:translate(-50%,-50%) scale(1)}
        }

        @keyframes axFade{
          from{opacity:0}
          to{opacity:1}
        }

        @media (max-width:768px){
          .ax-shell{padding:14px}
          .ax-top-card{padding:20px}
          .ax-title h1{font-size:28px}
          .ax-tab{min-width:145px;padding:12px 14px;font-size:15px}
          th,td{padding:12px}
        }
      `}</style>

      <div className="ax-page">
        <Toast toast={toast} onClose={() => setToast(null)} />

        <div className="ax-top-card">
          <div className="ax-top">
            <div className="ax-title">
              <p className="ax-eyebrow">Exam Management</p>
              <h1>Exam Reviews</h1>
              <p>Manage approvals, changes, and rejections.</p>
            </div>

            <button className="ax-btn ax-btn--ghost" onClick={load} disabled={loading || busy} id="exammanagement-button-9">
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="ax-tabs">
            <TabButton
              active={tab === "pending"}
              label="Pending"
              count={stats.pending}
              onClick={() => onTab("pending")}
              variant="pending"
            />
            <TabButton
              active={tab === "changes_requested"}
              label="Changes"
              count={stats.changes_requested}
              onClick={() => onTab("changes_requested")}
              variant="changes"
            />
            <TabButton
              active={tab === "approved"}
              label="Approved"
              count={stats.approved}
              onClick={() => onTab("approved")}
              variant="approved"
            />
            <TabButton
              active={tab === "rejected"}
              label="Rejected"
              count={stats.rejected}
              onClick={() => onTab("rejected")}
              variant="rejected"
            />
          </div>
        </div>

        <div className="ax-filters">
          <div className="ax-row">
            <div>
              <label className="ax-label">Subject</label>
              <select className="ax-input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} id="exammanagement-select-1">
                {(subjects.length ? subjects : [{ id: "all", code: "", name: "All subjects" }]).map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.id === "all" ? "All subjects" : `${s.code ? s.code + " — " : ""}${s.name}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="ax-label">Date</label>
              <input
                type="date"
                className="ax-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
               id="exammanagement-input-1"/>
            </div>

            <div style={{ flex: 2, minWidth: 240 }}>
              <label className="ax-label">Search</label>
              <input
                className="ax-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search title or subject"
               id="exammanagement-input-2"/>
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
               id="exammanagement-button-10">
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="ax-tablewrap">
          {loading ? (
            <div className="ax-empty">Loading exams...</div>
          ) : filtered.length === 0 ? (
            <div className="ax-empty">No exams found</div>
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
                        <div style={{ fontWeight: 900, fontSize: 13 }}>{x.title || "Untitled"}</div>
                        {x.admin_note ? (
                          <div className="ax-muted" style={{ marginTop: 8 }}>
                            <b>Admin note:</b> {x.admin_note}
                          </div>
                        ) : null}
                      </td>

                      <td>
                        {x._subject_code ? (
                          <div style={{ fontWeight: 900, color: "var(--ax-blue)" }}>{x._subject_code}</div>
                        ) : null}
                        <div style={{ fontWeight: 700, marginTop: 4 }}>{x._subject_name || "-"}</div>
                        {x.year && x.semester ? (
                          <div className="ax-muted" style={{ marginTop: 6 }}>{`Y${x.year}S${x.semester}`}</div>
                        ) : null}
                        {x.created_by_staff_id ? (
                          <div className="ax-muted" style={{ marginTop: 6 }}>
                            Staff ID: {x.created_by_staff_id}
                          </div>
                        ) : null}
                      </td>

                      <td>
                        <div><span className="ax-muted">Start:</span> {fmtDateTime(x.start_at)}</div>
                        <div style={{ marginTop: 6 }}><span className="ax-muted">End:</span> {fmtDateTime(x.end_at)}</div>
                        <div className="ax-muted" style={{ marginTop: 8 }}>
                          Duration: {x.duration_minutes ? `${x.duration_minutes} mins` : "-"}
                        </div>
                      </td>

                      <td>
                        <div><b>{x.total_marks ?? "-"}</b> total</div>
                        <div className="ax-muted" style={{ marginTop: 6 }}>Pass: {x.pass_marks ?? "-"}</div>
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
                           id={`exammanagement-approve-${x.id}`}>
                            Approve
                          </button>

                          <button
                            className="ax-btn"
                            onClick={() => askChanges(x)}
                            disabled={busy || !actionOk}
                           id={`exammanagement-changes-${x.id}`}>
                            Request Changes
                          </button>

                          <button
                            className="ax-btn ax-btn--danger"
                            onClick={() => askReject(x)}
                            disabled={busy || !actionOk}
                           id={`exammanagement-reject-${x.id}`}>
                            Reject
                          </button>
                        </div>

                        {!actionOk ? (
                          <div className="ax-muted" style={{ marginTop: 10 }}>
                            View only
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

        <NoteDialog
          open={noteOpen}
          title={noteType === "reject" ? "Reject Exam" : "Request Changes"}
          label={noteType === "reject" ? "Reason" : "Required Changes"}
          placeholder={noteType === "reject" ? "Type the rejection reason..." : "Type the required changes..."}
          value={noteText}
          setValue={setNoteText}
          loading={busy}
          onClose={() => (busy ? null : setNoteOpen(false))}
          onConfirm={runNote}
          confirmText={noteType === "reject" ? "Send Rejection" : "Send Changes"}
        />
      </div>
    </div>
  );
}