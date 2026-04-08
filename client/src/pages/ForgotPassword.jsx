import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import AuthSlider from "../components/AuthSlider";
import Logo from "../components/Logo";
import Dots from "../components/Dots";
import ThemeToggle from "../components/ThemeToggle";
import "../Auth.css";

const API = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
  : "http://localhost:8000";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const navigate = useNavigate();
  const { settings } = useSettings();

  useEffect(() => {
    const checkReset = () => {
      if (localStorage.getItem("pw_reset_done") === "1") {
        localStorage.removeItem("pw_reset_done");
        navigate("/");
      }
    };
    checkReset();
    const interval = setInterval(checkReset, 2000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleSend = async () => {
    if (!email.trim()) {
      setMsg("Please enter your email.");
      return;
    }
    setLoading(true);
    setMsg("Sending...");
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMsg(data.message || "Check your email for reset link.");
    } catch (e) {
      setMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <AuthSlider settings={settings} />

      <div className="auth-form-panel">
        <Dots seed={2} />

        <div className="auth-card">
          <button className="auth-forgot" onClick={() => navigate("/")} style={{ alignSelf: 'flex-start', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', fontWeight: '600' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back to login
          </button>

          <Logo />

          <div className="auth-head">
            <h1 className="auth-title">Forgot Password</h1>
            <p className="auth-sub">Enter your email to receive a reset link</p>
          </div>

          <div className="auth-fields">
            <Field label="Email Address" htmlFor="forgot-email">
              <FieldIcon type="email" />
              <input
                id="forgot-email" type="email"
                className={`auth-input${focused === "email" ? " focused" : ""}`}
                placeholder="you@university.edu" value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                autoComplete="email"
              />
            </Field>
          </div>

          <button className="auth-btn" onClick={handleSend} disabled={loading} style={{ marginTop: '10px' }}>
            {loading ? <><span className="auth-spinner" /> Sending…</> : "Send Reset Link"}
          </button>

          {msg && <MsgBox type={msg.toLowerCase().includes("wrong") || msg.toLowerCase().includes("please") ? "err" : "ok"} msg={msg} />}

          <AdminBadge />
        </div>
      </div>
      <ThemeToggle />
    </div>
  );
}

/* ── Local Helpers ── */
function Field({ label, htmlFor, children }) {
  return (
    <div className="auth-field">
      <label className="auth-label" htmlFor={htmlFor}>{label}</label>
      <div className="auth-input-wrap">{children}</div>
    </div>
  );
}

function FieldIcon({ type }) {
  return (
    <span className="auth-field-icon">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    </span>
  );
}

function MsgBox({ type, msg }) {
  return (
    <div className={`auth-msg ${type === "ok" ? "msg-ok" : "msg-err"}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        {type === "ok" ? (
          <polyline points="20 6 9 17 4 12" />
        ) : (
          <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
        )}
      </svg>
      {msg}
    </div>
  );
}

function AdminBadge() {

}