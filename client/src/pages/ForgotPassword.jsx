import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

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
      setMsg("Enter your email");
      return;
    }

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
      setMsg("Something went wrong. Try again.");
    }
  };

  return (
    <div className="forgot-wrapper">
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

        .forgot-wrapper {
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

        /* Ambient background glow like Login */
        .forgot-wrapper::before {
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

        .forgot-wrapper::after {
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

        /* Extra floating blur */
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

        .forgot-content {
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
          margin-bottom: 22px;
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

        .send-btn {
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

        .send-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(59, 130, 246, 0.28);
          filter: brightness(1.08);
        }

        .send-btn:active {
          transform: translateY(0);
        }

        .status-msg {
          margin-top: 18px;
          padding: 12px;
          width: 100%;
          text-align: center;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          background: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.18);
          color: #cbd5e1;
          line-height: 1.5;
          word-break: break-word;
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

          .forgot-content {
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
        <div className="forgot-content">
          <div className="brand-logo">U</div>

          <h1 className="title">Forgot Password</h1>
          <p className="subtitle">Enter your email to receive reset link</p>

          <div className="form-group">
            <label htmlFor="forgot-email-input" className="input-label">
              Email Address
            </label>

            <input
              id="forgot-email-input"
              type="email"
              className="premium-input"
              placeholder="name@university.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <button className="send-btn" onClick={handleSend}>
            Send Reset Link
          </button>

          {msg && <div className="status-msg">{msg}</div>}
        </div>
      </div>
    </div>
  );
}