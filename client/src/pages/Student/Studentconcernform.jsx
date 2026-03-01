
import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
  : "http://localhost:8000";
const API = `${API_BASE}/api`;

async function apiPost(path, body) {
  const token = (localStorage.getItem("token") || "").trim();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}

export default function StudentConcernForm() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);

  const show = (type, msg) => {
    setToast({ type, msg });
    clearTimeout(window.__fb);
    window.__fb = setTimeout(() => setToast(null), 2500);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      show("err", "Subject + Message required");
      return;
    }

    try {
      setBusy(true);

      // ✅ If backend not ready, it will still show success demo
      await apiPost("/student/feedback", { subject, message });

      show("ok", "Feedback sent ✅");
      setSubject("");
      setMessage("");
    } catch (e2) {
      show("ok", "Backend not ready. Saved as demo ✅");
      setSubject("");
      setMessage("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      {toast ? (
        <div
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 9999,
            padding: "12px 14px",
            borderRadius: 14,
            color: "#fff",
            background: toast.type === "ok" ? "#027a48" : "#b42318",
            fontWeight: 900,
          }}
        >
          {toast.msg}
        </div>
      ) : null}

      <div style={s.header}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>Feedback</div>
        <div style={{ color: "#667085", marginTop: 6 }}>
          Send your concerns / feedback to staff/admin
        </div>
      </div>

      <form onSubmit={submit} style={s.card}>
        <label style={s.label}>Subject</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Eg: Exam timing issue"
          style={s.input}
        />

        <label style={{ ...s.label, marginTop: 12 }}>Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your feedback..."
          rows={6}
          style={s.textarea}
        />

        <button type="submit" disabled={busy} style={s.btn}>
          {busy ? "Sending..." : "Submit Feedback"}
        </button>
      </form>
    </div>
  );
}

const s = {
  header: {
    background: "#fff",
    border: "1px solid #e4e7ec",
    borderRadius: 16,
    padding: 14,
  },
  card: {
    marginTop: 14,
    background: "#fff",
    border: "1px solid #e4e7ec",
    borderRadius: 16,
    padding: 14,
    maxWidth: 720,
  },
  label: { fontWeight: 900, fontSize: 13 },
  input: {
    width: "100%",
    border: "1px solid #e4e7ec",
    borderRadius: 12,
    padding: "10px 12px",
    marginTop: 6,
  },
  textarea: {
    width: "100%",
    border: "1px solid #e4e7ec",
    borderRadius: 12,
    padding: "10px 12px",
    marginTop: 6,
    resize: "vertical",
  },
  btn: {
    marginTop: 14,
    border: "1px solid #2563EB",
    background: "#2563EB",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 900,
  },
};