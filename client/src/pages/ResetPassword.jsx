import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const navigate = useNavigate();

  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token");
  }, []);

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

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
      setMsg("Password must include Uppercase, Lowercase, Number and Special Character");
      return;
    }

    setLoading(true);
    setMsg("Resetting...");

    try {
      const res = await fetch(
        `http://${window.location.hostname}:8000/api/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            newPassword,
            confirmPassword: confirm,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.message);
        setLoading(false);
        return;
      }

      setMsg("Password reset successful ✅");

      localStorage.setItem("pw_reset_done", "1");

      setTimeout(() => navigate("/"), 1500);
    } catch (e) {
      setMsg("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&display=swap');

        :root {
          --bg-color: #050505;
          --card-bg: rgba(20, 20, 23, 0.72);
          --accent-primary: #3b82f6;
          --accent-secondary: #a855f7;
          --border-glow: conic-gradient(from 0deg, #3b82f6, #a855f7, #3b82f6);
        }

        * {
          box-sizing: border-box;
        }

        .reset-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-color);
          font-family: 'Outfit', sans-serif;
          color: #fff;
          position: relative;
          overflow: hidden;
          padding: 20px;
        }

        .reset-wrapper::before {
          content: "";
          position: absolute;
          width: 520px;
          height: 520px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.16), transparent 70%);
          top: -120px;
          right: -120px;
          z-index: 0;
          pointer-events: none;
        }

        .reset-wrapper::after {
          content: "";
          position: absolute;
          width: 620px;
          height: 620px;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.12), transparent 70%);
          bottom: -170px;
          left: -170px;
          z-index: 0;
          pointer-events: none;
        }

        .bg-orb-1,
        .bg-orb-2 {
          position: absolute;
          border-radius: 999px;
          filter: blur(80px);
          z-index: 0;
          pointer-events: none;
          animation: floatOrb 8s ease-in-out infinite;
        }

        .bg-orb-1 {
          width: 220px;
          height: 220px;
          background: rgba(59, 130, 246, 0.10);
          top: 18%;
          left: 12%;
        }

        .bg-orb-2 {
          width: 260px;
          height: 260px;
          background: rgba(168, 85, 247, 0.10);
          bottom: 14%;
          right: 12%;
          animation-delay: 1.5s;
        }

        @keyframes floatOrb {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-18px) translateX(10px);
          }
        }

        .back-btn {
          position: absolute;
          top: 28px;
          left: 28px;
          z-index: 20;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: #fff;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          transition: all 0.25s ease;
          box-shadow: 0 8px 24px rgba(0,0,0,0.28);
        }

        .back-btn:hover {
          transform: translateY(-2px);
          border-color: rgba(59,130,246,0.45);
          background: rgba(59,130,246,0.10);
          box-shadow: 0 12px 28px rgba(59,130,246,0.18);
        }

        .magic-card {
          position: relative;
          width: 420px;
          max-width: 100%;
          padding: 2px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.04);
          overflow: hidden;
          z-index: 10;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.56);
        }

        .magic-card::before {
          content: "";
          position: absolute;
          width: 200%;
          height: 200%;
          background: var(--border-glow);
          top: -50%;
          left: -50%;
          animation: rotate 4s linear infinite;
          z-index: -1;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .reset-content {
          background: var(--card-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 42px 34px;
          border-radius: 22px;
          min-height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .brand-logo {
          width: 68px;
          height: 68px;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 34px;
          font-weight: 800;
          margin-bottom: 20px;
          box-shadow: 0 12px 24px rgba(59, 130, 246, 0.28);
        }

        .title {
          font-size: 30px;
          font-weight: 800;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
          text-align: center;
        }

        .subtitle {
          font-size: 15px;
          color: #94a3b8;
          margin-bottom: 30px;
          text-align: center;
          line-height: 1.5;
        }

        .form-group {
          width: 100%;
          margin-bottom: 20px;
        }

        .input-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #94a3b8;
          margin-bottom: 8px;
          margin-left: 4px;
        }

        .premium-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 15px 18px;
          color: #fff;
          font-size: 16px;
          outline: none;
          transition: all 0.3s ease;
        }

        .premium-input::placeholder {
          color: #6b7280;
        }

        .premium-input:focus {
          border-color: var(--accent-primary);
          background: rgba(255, 255, 255, 0.07);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
        }

        .reset-btn {
          width: 100%;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          border: none;
          border-radius: 14px;
          padding: 16px;
          color: #fff;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .reset-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(59, 130, 246, 0.28);
          filter: brightness(1.08);
        }

        .reset-btn:active {
          transform: translateY(0);
        }

        .reset-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .status-msg {
          margin-top: 18px;
          padding: 12px;
          width: 100%;
          text-align: center;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.5;
          word-break: break-word;
          background: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.18);
          color: #cbd5e1;
        }

        .status-msg.error {
          background: rgba(239, 68, 68, 0.10);
          border: 1px solid rgba(239, 68, 68, 0.20);
          color: #fda4af;
        }

        .status-msg.success {
          background: rgba(34, 197, 94, 0.10);
          border: 1px solid rgba(34, 197, 94, 0.20);
          color: #86efac;
        }

        @media (max-width: 640px) {
          .back-btn {
            top: 18px;
            left: 18px;
            padding: 10px 14px;
            font-size: 14px;
          }

          .magic-card {
            width: 100%;
            max-width: 100%;
          }

          .reset-content {
            padding: 34px 22px;
          }

          .title {
            font-size: 26px;
          }

          .subtitle {
            font-size: 14px;
          }
        }
      `}</style>

      <div className="bg-orb-1"></div>
      <div className="bg-orb-2"></div>

      <button className="back-btn" onClick={() => navigate("/")}>
        ← Back
      </button>

      <div className="magic-card">
        <div className="reset-content">
          <div className="brand-logo">U</div>

          <h1 className="title">Reset Password</h1>
          <p className="subtitle">Create a strong new password for your UniExam account</p>

          <div className="form-group">
            <label className="input-label">New Password</label>
            <input
              type="password"
              className="premium-input"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="input-label">Confirm Password</label>
            <input
              type="password"
              className="premium-input"
              placeholder="Re-enter password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button
            className="reset-btn"
            onClick={handleReset}
            disabled={loading}
          >
            {loading ? "Please wait..." : "Reset Password"}
          </button>

          {msg && (
            <div
              className={`status-msg ${
                msg.toLowerCase().includes("successful")
                  ? "success"
                  : msg.toLowerCase().includes("wrong") ||
                    msg.toLowerCase().includes("invalid") ||
                    msg.toLowerCase().includes("match") ||
                    msg.toLowerCase().includes("least") ||
                    msg.toLowerCase().includes("include")
                  ? "error"
                  : ""
              }`}
            >
              {msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}