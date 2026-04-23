import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import AuthSlider from "../components/AuthSlider";
import Logo from "../components/Logo";
import Dots from "../components/Dots";
import ThemeToggle from "../components/ThemeToggle";
import "../Auth.css";

const API = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
  : `http://${window.location.hostname}:8000`;

export default function Login() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(null);

  const handleLogin = async () => {
    if (!email || !password) { setMsg("Please enter your email and password."); return; }
    setLoading(true); setMsg("");
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.message || "Invalid credentials."); return; }
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "admin") navigate("/admin");
      else if (data.user.role === "staff") navigate("/staff");
      else navigate("/student");
    } catch {
      setMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <AuthSlider settings={settings} />

      <div className="auth-form-panel">
        <Dots seed={1} />

        <div className="auth-card">
          <Logo />

          <div className="auth-head">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-sub">Sign in to your {settings?.system_name || "UniExam"} portal</p>
          </div>

          <div className="auth-fields">
            <Field label="Email Address" htmlFor="login-email">
              <FieldIcon type="email" />
              <input
                id="login-email" type="email"
                className={`auth-input${focused === "email" ? " focused" : ""}`}
                placeholder="you@university.edu" value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                autoComplete="email"
              />
            </Field>

            <Field label="Password" htmlFor="login-password">
              <FieldIcon type="lock" />
              <input
                id="login-password" type={showPassword ? "text" : "password"}
                className={`auth-input${focused === "pwd" ? " focused" : ""}`}
                placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocused("pwd")} onBlur={() => setFocused(null)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                autoComplete="current-password"
              />
              <EyeBtn show={showPassword} toggle={() => setShowPassword(!showPassword)} />
            </Field>
          </div>

          <div className="auth-forgot-row">
            <button className="auth-forgot" onClick={() => navigate("/forgot-password")} id="login-forgot-btn">
              Forgot password?
            </button>
          </div>

          <button className="auth-btn" onClick={handleLogin} disabled={loading} id="login-submit-btn">
            {loading ? <><span className="auth-spinner" /> Signing in…</> : "Sign In to Portal"}
          </button>

          {msg && <MsgBox type="err" msg={msg} />}

          <AdminBadge />
        </div>
      </div>
      <ThemeToggle />
    </div>
  );
}

/* ── Local Helpers (Specific to this page or too small for separate files) ── */
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
      {type === "email" ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )}
    </span>
  );
}

function EyeBtn({ show, toggle }) {
  return (
    <button className="auth-eye" onClick={toggle} tabIndex={-1} type="button" id="login-eye-btn">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        {show ? (
          <>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </>
        ) : (
          <>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </>
        )}
      </svg>
    </button>
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
  return (
    <div className="auth-admin-badge">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      Integrated University Management
    </div>
  );
}