import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
  : `http://${window.location.hostname}:8000`;
const API = `${API_BASE}/api`;

/** ✅ common fetch */
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

const fmtDT = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleString();
};

export default function StaffFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const show = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/feedback/staff");
      setFeedbacks(res.data || []);
    } catch (err) {
      show("err", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const toggleStatus = async (item) => {
    const newStatus = item.status === "pending" ? "resolved" : "pending";
    try {
      await apiFetch(`/feedback/staff/${item.id}`, {
        method: "PATCH",
        body: { status: newStatus },
      });
      show("ok", `Status updated to ${newStatus}`);
      loadFeedback();
    } catch (err) {
      show("err", err.message);
    }
  };

  return (
    <div style={s.page} className="fx-page">
      <style>{`
        .dark .fx-page { color: #f3f4f6; }
        .dark .fx-card, .dark .fx-head-card { background: #111827 !important; border-color: #374151 !important; }
        .dark .fx-title { color: #fff !important; }
        .dark .fx-sub { color: #9ca3af !important; }
        .dark .fx-th { background: #1f2937 !important; border-bottom-color: #374151 !important; color: #9ca3af !important; }
        .dark .fx-td { border-bottom-color: #374151 !important; color: #d1d5db !important; }
        .dark .fx-desc-box { background: #1f2937 !important; border-color: #374151 !important; color: #d1d5db !important; }
        .dark .fx-badge-ys { background: #374151 !important; color: #d1d5db !important; }
        .dark .fx-btn-reset { background: #1f2937 !important; color: #d1d5db !important; border-color: #374151 !important; }
        .dark .fx-muted { color: #9ca3af !important; }
      `}</style>
      {/* ✅ TOAST */}
      {toast && (
        <div style={{ ...s.toast, background: toast.type === "ok" ? "#027A48" : "#B42318" }}>
          <div style={{ fontWeight: 1000 }}>{toast.type === "ok" ? "Success" : "Error"}</div>
          <div style={{ opacity: 0.95 }}>{toast.msg}</div>
        </div>
      )}

      {/* ✅ HEADER */}
      <div style={s.headCard} className="fx-head-card">
        <div style={s.hTitle} className="fx-title">Received Feedback</div>
        <div style={s.hSub} className="fx-sub">
          View and manage issues reported by students for your modules.
        </div>
      </div>

      {/* ✅ LIST */}
      <div style={s.card} className="fx-card">
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th} className="fx-th">Student Details</th>
                <th style={s.th} className="fx-th">Module</th>
                <th style={s.th} className="fx-th">Description</th>
                <th style={s.th} className="fx-th">Date</th>
                <th style={s.th} className="fx-th">Status</th>
                <th style={{ ...s.th, textAlign: "right" }} className="fx-th">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={s.tdEmpty}>Loading feedback...</td>
                </tr>
              ) : feedbacks.length === 0 ? (
                <tr>
                  <td colSpan={6} style={s.tdEmpty}>No feedback received yet.</td>
                </tr>
              ) : (
                feedbacks.map((f) => (
                  <tr key={f.id}>
                    <td style={s.td} className="fx-td">
                      <div style={{ fontWeight: 1000 }} className="fx-title">{f.student_name}</div>
                      <div style={{ fontSize: 11, color: "#667085", fontWeight: 700 }} className="fx-muted">{f.student_email}</div>
                      <div style={s.badgeYS} className="fx-badge-ys">Yr {f.student_year} • Sem {f.student_semester}</div>
                    </td>
                    <td style={s.td} className="fx-td">
                      <div style={{ fontWeight: 900 }} className="fx-title">{f.subject_code}</div>
                      <div style={{ fontSize: 11, color: "#667085", fontWeight: 700 }} className="fx-muted">{f.subject_name}</div>
                    </td>
                    <td style={{ ...s.td, maxWidth: 300 }} className="fx-td">
                      <div style={s.descBox} className="fx-desc-box">{f.description}</div>
                    </td>
                    <td style={s.td} className="fx-td">{fmtDT(f.created_at)}</td>
                    <td style={s.td} className="fx-td">
                      <span style={{ ...s.statusBadge, ...(f.status === "resolved" ? s.statusOk : s.statusPending) }}>
                        {f.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ ...s.td, textAlign: "right" }} className="fx-td">
                      <button
                        onClick={() => toggleStatus(f)}
                        style={{ ...s.btnMini, ...(f.status === "resolved" ? s.btnReset : s.btnResolve) }}
                        className={f.status === "resolved" ? "fx-btn-reset" : ""}
                       id="stafffeedback-button-1">
                        {f.status === "resolved" ? "Undo" : "Resolve"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { padding: 24, maxWidth: 1200, margin: "0 auto" },
  toast: {
    position: "fixed",
    top: 24,
    right: 24,
    zIndex: 99999,
    color: "#fff",
    padding: "12px 16px",
    borderRadius: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,.15)",
    minWidth: 260,
  },
  headCard: {
    background: "#fff",
    border: "1px solid #E4E7EC",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    boxShadow: "0 2px 10px rgba(0,0,0,.02)",
  },
  hTitle: { fontSize: 20, fontWeight: 1000, color: "#101828", letterSpacing: "-0.01em" },
  hSub: { marginTop: 4, color: "#667085", fontSize: 13, fontWeight: 800 },
  card: {
    background: "#fff",
    border: "1px solid #E4E7EC",
    borderRadius: 20,
    boxShadow: "0 4px 20px rgba(0,0,0,.04)",
    overflow: "hidden",
  },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "10px 14px",
    background: "#F9FAFB",
    borderBottom: "1px solid #EAECF0",
    color: "#475467",
    fontWeight: 1000,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  td: {
    padding: "10px 14px",
    borderBottom: "1px solid #F2F4F7",
    verticalAlign: "middle",
    color: "#101828",
    fontSize: 13,
    fontWeight: 800,
  },
  tdEmpty: { padding: 40, textAlign: "center", color: "#667085", fontWeight: 800 },
  badgeYS: {
    display: "inline-block",
    marginTop: 4,
    padding: "2px 8px",
    background: "#F2F4F7",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 900,
    color: "#344054",
  },
  descBox: {
    background: "#F9FAFB",
    padding: 10,
    borderRadius: 10,
    border: "1px solid #EAECF0",
    fontSize: 13,
    lineHeight: 1.4,
    color: "#475467",
    fontWeight: 800,
    maxHeight: 100,
    overflowY: "auto",
  },
  statusBadge: {
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 1000,
  },
  statusPending: { background: "#FEF0C7", color: "#93370D" },
  statusOk: { background: "#ECFDF3", color: "#027A48" },
  btnMini: {
    padding: "6px 12px",
    border: "1px solid #E4E7EC",
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 1000,
    cursor: "pointer",
    background: "#fff",
  },
  btnResolve: { background: "#1570EF", color: "#fff", border: "none" },
  btnReset: { background: "#F2F4F7", color: "#344054" },
};
