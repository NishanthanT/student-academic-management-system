import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
  : "http://localhost:8000";
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

  if (res.status === 401) { localStorage.clear(); window.location.href = '/'; throw new Error('Session expired'); }
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

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const show = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  // ✅ 1. Load Subjects on mount
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await apiFetch("/student/subjects");
        setSubjects(res.data || []);
      } catch (err) {
        show("err", err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ✅ 2. Load Staff when Subject changes
  useEffect(() => {
    if (!subjectId) {
      setStaffs([]);
      setStaffId("");
      return;
    }

    (async () => {
      try {
        const res = await apiFetch(`/student/subjects/${subjectId}/staffs`);
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
      await apiFetch("/student/feedback", {
        method: "POST",
        body: { subject_id: subjectId, staff_id: staffId, description: message },
      });

      show("ok", "Feedback sent to staff successfully ✅");
      setMessage("");
    } catch (err) {
      show("err", err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={s.page}>
      {/* ✅ TOAST */}
      {toast && (
        <div style={{ ...s.toast, background: toast.type === "ok" ? "#027A48" : "#B42318" }}>
          <div style={{ fontWeight: 1000 }}>{toast.type === "ok" ? "Success" : "Error"}</div>
          <div style={{ opacity: 0.95 }}>{toast.msg}</div>
        </div>
      )}

      {/* ✅ HEADER */}
      <div style={s.headCard}>
        <div style={s.hTitle}>Submit Feedback</div>
        <div style={s.hSub}>
          Select your subject and the staff member to report an issue or provide feedback.
        </div>
      </div>

      {/* ✅ FORM */}
      <div style={s.card}>
        <form onSubmit={submit}>
          <div style={s.grid}>
            <div style={s.field}>
              <label style={s.label}>Subject (Module)</label>
              <select
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
              <label style={s.label}>Staff Member</label>
              <select
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
            <label style={s.label}>Issue Description / Message</label>
            <textarea
              style={s.textarea}
              placeholder="Describe the issue in detail..."
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={busy}
            />
          </div>

          <div style={s.foot}>
            <button type="submit" style={s.btn} disabled={busy || !staffId}>
              {busy ? "Sending..." : "Submit to Staff"}
            </button>
          </div>
        </form>
      </div>

      <div style={s.note}>
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
  hTitle: { fontSize: 20, fontWeight: 1000, color: "#101828" },
  hSub: { marginTop: 6, color: "#667085", fontSize: 13, fontWeight: 800 },
  card: {
    background: "#fff",
    border: "1px solid #E4E7EC",
    borderRadius: 20,
    padding: 24,
    boxShadow: "0 4px 20px rgba(0,0,0,.04)",
  },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 13, fontWeight: 1000, color: "#344054" },
  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #E4E7EC",
    background: "#F9FAFB",
    fontWeight: 800,
    outline: "none",
  },
  textarea: {
    width: "100%",
    padding: 12,
    borderRadius: 16,
    border: "1px solid #E4E7EC",
    background: "#F9FAFB",
    fontWeight: 800,
    resize: "vertical",
    minHeight: 120,
    outline: "none",
  },
  foot: { marginTop: 24, display: "flex", justifyContent: "flex-end" },
  btn: {
    background: "#1570EF",
    color: "#fff",
    border: "none",
    padding: "12px 24px",
    borderRadius: 14,
    fontWeight: 1000,
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(21, 112, 239, 0.25)",
  },
  note: {
    marginTop: 20,
    padding: 16,
    background: "#F9FAFB",
    border: "1px dashed #EAECF0",
    borderRadius: 16,
    color: "#475467",
    fontSize: 13,
    lineHeight: 1.5,
    fontWeight: 800,
  },
};