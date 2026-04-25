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

export default function StudentConcernForm() {
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [staffs, setStaffs] = useState([]);
  const [staffId, setStaffId] = useState("");
  const [message, setMessage] = useState("");
  const [pastFeedbacks, setPastFeedbacks] = useState([]);

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const show = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  // ✅ 1. Load Subjects & History on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [subRes, historyRes] = await Promise.all([
        apiFetch("/student/subjects"),
        apiFetch("/feedback/student")
      ]);
      setSubjects(subRes.data || []);
      setPastFeedbacks(historyRes.data || []);
    } catch (err) {
      show("err", err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await apiFetch("/feedback/student");
      setPastFeedbacks(res.data || []);
    } catch (err) {
      console.error("Failed to reload history", err);
    }
  };

  // ✅ 2. Load Staff when Subject changes
  useEffect(() => {
    if (!subjectId) {
      setStaffs([]);
      setStaffId("");
      return;
    }

    (async () => {
      try {
        const res = await apiFetch(`/feedback/student/subjects/${subjectId}/staffs`);
        setStaffs(res.data || []);
        if (res.data?.length) setStaffId(String(res.data[0].id));
      } catch (err) {
        show("err", "Failed to load staffs");
      }
    })();
  }, [subjectId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!subjectId || !staffId || !message.trim()) {
      show("err", "Subject, Staff, and Message are required");
      return;
    }

    try {
      setBusy(true);
      await apiFetch("/feedback/student", {
        method: "POST",
        body: { subject_id: subjectId, staff_id: staffId, description: message },
      });

      show("ok", "Feedback sent to staff successfully ✅");
      setMessage("");
      loadHistory(); // Reload history after sending
    } catch (err) {
      show("err", err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div id="student-concern-page" style={s.page} className="nx-page">
      <style>{`
        .dark .nx-page { color: #f3f4f6; }
        .dark #student-concern-headcard, 
        .dark #student-concern-card,
        .dark #student-history-card { 
          background: #111827 !important; border-color: #374151 !important; 
        }
        .dark #student-concern-title, .dark #student-history-title { color: #fff !important; }
        .dark #student-concern-subtitle, .dark .nx-label { color: #9ca3af !important; }
        .dark #student-concern-subject-select, 
        .dark #student-concern-staff-select,
        .dark #student-concern-message-textarea { 
          background: #1f2937 !important; border-color: #374151 !important; color: #f3f4f6 !important; 
        }
        .dark #student-concern-note { 
          background: #111827 !important; border-color: #374151 !important; color: #9ca3af !important; 
        }
        .dark button#student-concern-submit-btn {
          background: #3b82f6 !important;
          color: #fff !important;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4) !important;
        }
        .dark button#student-concern-submit-btn:disabled {
          opacity: 0.5 !important;
          background: #1f2937 !important;
          color: #9ca3af !important;
        }
        .dark .nx-history-item { border-bottom: 1px solid #374151 !important; }
        .dark .nx-status-pending { background: #374151 !important; color: #9ca3af !important; }
        .dark .nx-status-resolved { background: #064e3b !important; color: #6ee7b7 !important; }
        .dark .nx-reply-box { background: #064e3b !important; color: #6ee7b7 !important; border-color: #065f46 !important; }
      `}</style>
      {/* ✅ TOAST */}
      {toast && (
        <div style={{ ...s.toast, background: toast.type === "ok" ? "#027A48" : "#B42318" }}>
          <div style={{ fontWeight: 1000 }}>{toast.type === "ok" ? "Success" : "Error"}</div>
          <div style={{ opacity: 0.95 }}>{toast.msg}</div>
        </div>
      )}

      {/* ✅ HEADER */}
      <div id="student-concern-headcard" style={s.headCard}>
        <div id="student-concern-title" style={s.hTitle}>Submit Feedback</div>
        <div id="student-concern-subtitle" style={s.hSub}>
          Select your subject and the staff member to report an issue or provide feedback.
        </div>
      </div>

      {/* ✅ FORM */}
      <div id="student-concern-card" style={s.card}>
        <form onSubmit={submit}>
          <div style={s.grid}>
            <div style={s.field}>
              <label style={s.label} className="nx-label">Subject (Module)</label>
              <select
                id="student-concern-subject-select"
                style={s.select}
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                disabled={loading || busy}
              >
                <option value="">-- Select Subject --</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} - {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={s.field}>
              <label style={s.label} className="nx-label">Staff Member</label>
              <select
                id="student-concern-staff-select"
                style={s.select}
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                disabled={!subjectId || busy}
              >
                {!subjectId ? (
                  <option value="">Select a subject first</option>
                ) : staffs.length === 0 ? (
                  <option value="">No staff found for this subject</option>
                ) : (
                  staffs.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.email})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div style={{ ...s.field, marginTop: 20 }}>
            <label style={s.label} className="nx-label">Issue Description / Message</label>
            <textarea
              id="student-concern-message-textarea"
              style={s.textarea}
              placeholder="Describe the issue in detail..."
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={busy}
            />
          </div>

          <div style={s.foot}>
            <button id="student-concern-submit-btn" type="submit" style={s.btn} disabled={busy || !staffId}>
              {busy ? "Sending..." : "Submit to Staff"}
            </button>
          </div>
        </form>
      </div>

      {/* ✅ FEEDBACK HISTORY */}
      <div id="student-history-card" style={{ ...s.card, marginTop: 24 }}>
        <div id="student-history-title" style={{ ...s.hTitle, marginBottom: 16 }}>My Feedback History</div>
        {loading ? (
          <div style={{ textAlign: "center", padding: 20, color: "#667085", fontSize: 13, fontWeight: 800 }}>Loading history...</div>
        ) : pastFeedbacks.length === 0 ? (
          <div style={{ textAlign: "center", padding: 20, color: "#667085", fontSize: 13, fontWeight: 800 }}>No feedbacks sent yet.</div>
        ) : (
          <div style={s.historyList}>
            {pastFeedbacks.map((fb) => (
              <div key={fb.id} className="nx-history-item" style={s.historyItem}>
                <div style={s.fbHeader}>
                  <div style={s.fbSubject}>{fb.subject_code} - {fb.staff_name}</div>
                  <div 
                    className={fb.status === 'resolved' ? 'nx-status-resolved' : 'nx-status-pending'}
                    style={{ ...s.statusTag, background: fb.status === 'resolved' ? '#ECFDF3' : '#F2F4F7', color: fb.status === 'resolved' ? '#027A48' : '#344054' }}
                  >
                    {fb.status.toUpperCase()}
                  </div>
                </div>
                <div style={s.fbDesc}>{fb.description}</div>
                {fb.staff_reply && (
                  <div style={s.replyBox} className="nx-reply-box">
                    <b style={{ fontSize: 10 }}>STAFF REPLY:</b><br/>
                    {fb.staff_reply}
                  </div>
                )}
                <div style={s.fbDate}>{new Date(fb.created_at).toLocaleDateString()} {new Date(fb.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div id="student-concern-note" style={s.note}>
        <b>Note:</b> Your feedback will be sent directly to the selected staff member.
        They will be able to see your academic details (Year/Semester) along with your message.
      </div>
    </div>
  );
}

const s = {
  page: { padding: 24, maxWidth: 800, margin: "0 auto" },
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
  hTitle: { fontSize: 18, fontWeight: 1000, color: "#101828", letterSpacing: "-0.01em" },
  hSub: { marginTop: 4, color: "#667085", fontSize: 12, fontWeight: 800 },
  card: {
    background: "#fff",
    border: "1px solid #E4E7EC",
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 4px 20px rgba(0,0,0,.04)",
  },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 12, fontWeight: 1000, color: "#344054" },
  select: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid #E4E7EC",
    background: "#F9FAFB",
    fontWeight: 800,
    outline: "none",
    fontSize: 13,
  },
  textarea: {
    width: "100%",
    padding: 10,
    borderRadius: 16,
    border: "1px solid #E4E7EC",
    background: "#F9FAFB",
    fontWeight: 800,
    resize: "vertical",
    minHeight: 120,
    outline: "none",
    fontSize: 13,
  },
  foot: { marginTop: 24, display: "flex", justifyContent: "flex-end" },
  btn: {
    background: "#1570EF",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: 14,
    fontWeight: 1000,
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(21, 112, 239, 0.25)",
    fontSize: 13,
  },
  historyList: { display: "flex", flexDirection: "column" },
  historyItem: { padding: "16px 0", borderBottom: "1px solid #EAECF0" },
  fbHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  fbSubject: { fontSize: 13, fontWeight: 1000, color: "#101828" },
  statusTag: { padding: "4px 8px", borderRadius: 8, fontSize: 10, fontWeight: 1000, letterSpacing: "0.05em" },
  fbDesc: { fontSize: 12, color: "#475467", lineHeight: 1.5, fontWeight: 800 },
  replyBox: {
    marginTop: 8,
    background: "#ECFDF3",
    padding: 8,
    borderRadius: 10,
    border: "1px solid #D1FADF",
    fontSize: 12,
    color: "#027A48",
    fontWeight: 800,
  },
  fbDate: { marginTop: 8, fontSize: 10, color: "#98A2B3", fontWeight: 800 },
  note: {
    marginTop: 20,
    padding: 16,
    background: "#F9FAFB",
    border: "1px dashed #EAECF0",
    borderRadius: 16,
    color: "#475467",
    fontSize: 12,
    lineHeight: 1.5,
    fontWeight: 800,
  },
};