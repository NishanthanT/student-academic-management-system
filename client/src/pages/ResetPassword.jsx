import { useMemo, useState } from "react";
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

export default function ResetPassword() {
  const navigate = useNavigate();
  const { settings } = useSettings();

  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token");
  }, []);

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [showPwd1, setShowPwd1] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const handleReset = async () => {
    if (!token) {
      setMsg("Invalid reset link (token missing).");
      return;
    }

    if (newPassword !== confirm) {
      setMsg("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setMsg("Password must be at least 8 characters");
      return;
    }

    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    if (!strongRegex.test(newPassword)) {
      setMsg("Password must include Uppercase, Lowercase, Number & Special Char");
      return;
    }

    setLoading(true);
    setMsg("Resetting...");

    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword: confirm,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.message || "Failed to reset password.");
        setLoading(false);
        return;
      }

      setMsg("Password reset successful ✅");
      localStorage.setItem("pw_reset_done", "1");
      setTimeout(() => navigate("/"), 1500);
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
        <Dots seed={3} />

        <div className="auth-card">
          <button className="auth-forgot" onClick={() => navigate("/")} style={{alignSelf: 'flex-start', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', fontWeight: '600'}}>
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
             Back to login
          </button>
          
          <Logo />

          <div className="auth-head">
            <h1 className="auth-title">Reset Password</h1>
            <p className="auth-sub">Create a new secure password</p>
          </div>

          <div className="auth-fields">
            <Field label="New Password" htmlFor="reset-new-pwd">
              <FieldIcon type="lock" />
              <input
                id="reset-new-pwd" type={showPwd1 ? "text" : "password"}
                className={`auth-input${focused === "pwd1" ? " focused" : ""}`}
                placeholder="Enter new password" value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                onFocus={() => setFocused("pwd1")} onBlur={() => setFocused(null)}
                autoComplete="new-password"
              />
              <EyeBtn show={showPwd1} toggle={() => setShowPwd1(!showPwd1)} />
            </Field>

            <Field label="Confirm Password" htmlFor="reset-confirm-pwd">
              <FieldIcon type="lock" />
              <input
                id="reset-confirm-pwd" type={showPwd2 ? "text" : "password"}
                className={`auth-input${focused === "pwd2" ? " focused" : ""}`}
                placeholder="Re-enter new password" value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onFocus={() => setFocused("pwd2")} onBlur={() => setFocused(null)}
                onKeyDown={e => e.key === "Enter" && handleReset()}
                autoComplete="new-password"
              />
              <EyeBtn show={showPwd2} toggle={() => setShowPwd2(!showPwd2)} />
            </Field>
          </div>

          <button className="auth-btn" onClick={handleReset} disabled={loading} style={{marginTop: '10px'}}>
            {loading ? <><span className="auth-spinner" /> Resetting…</> : "Reset Password"}
          </button>

          {msg && (
            <MsgBox 
              type={msg.toLowerCase().includes("successful") ? "ok" : "err"} 
              msg={msg} 
            />
          )}

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
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    </span>
  );
}

function EyeBtn({ show, toggle }) {
  return (
    <button className="auth-eye" onClick={toggle} tabIndex={-1} type="button">
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
    <div className="auth-admin-badge" style={{marginTop: '25px'}}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      Integrated University Management
    </div>
  );
}