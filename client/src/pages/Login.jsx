import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setMsg("Please enter both email and password");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("userName", data.user.name);

      if (data.user.role === "admin") {
        navigate("/admin");
      } else if (data.user.role === "staff") {
        navigate("/staff");
      } else {
        navigate("/student");
      }

    } catch (err) {
      setMsg("Connection failed. Please check the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper" id="login-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');

        :root {
          --bg-color: #050505;
          --card-bg: rgba(20, 20, 23, 0.7);
          --accent-primary: #3b82f6;
          --accent-secondary: #a855f7;
          --border-glow: conic-gradient(from 0deg, #3b82f6, #a855f7, #3b82f6);
        }

        .login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-color);
          font-family: 'Outfit', sans-serif;
          color: #fff;
          position: relative;
          overflow: hidden;
        }

        .login-wrapper::before {
          content: "";
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.15), transparent 70%);
          top: -100px;
          right: -100px;
          z-index: 0;
        }

        .login-wrapper::after {
          content: "";
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.1), transparent 70%);
          bottom: -150px;
          left: -150px;
          z-index: 0;
        }

        .magic-card {
          position: relative;
          width: 400px;
          padding: 2px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.05);
          overflow: hidden;
          z-index: 10;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
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

        .login-content {
          background: var(--card-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 40px 32px;
          border-radius: 22px;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .brand-logo {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 20px;
          box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
        }

        .title {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .subtitle {
          font-size: 15px;
          color: #94a3b8;
          margin-bottom: 32px;
          text-align: center;
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
          padding: 14px 18px;
          color: #fff;
          font-size: 16px;
          outline: none;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .premium-input:focus {
          border-color: var(--accent-primary);
          background: rgba(255, 255, 255, 0.07);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
        }

        .forgot-pass {
          width: 100%;
          text-align: right;
          font-size: 14px;
          color: var(--accent-primary);
          cursor: pointer;
          margin-top: -12px;
          margin-bottom: 24px;
          font-weight: 600;
          transition: 0.2s;
        }

        .forgot-pass:hover {
          filter: brightness(1.2);
          text-decoration: underline;
        }

        .login-btn {
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

        .login-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
          filter: brightness(1.1);
        }

        .login-btn:active {
          transform: translateY(0);
        }

        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .error-msg {
          margin-top: 20px;
          padding: 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          border-radius: 12px;
          font-size: 14px;
          width: 100%;
          text-align: center;
          box-sizing: border-box;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .magic-card {
            width: 100%;
            margin: 20px;
          }
        }
      `}</style>

      <div className="magic-card">
        <div className="login-content">
          <div className="brand-logo" id="login-brand-logo">U</div>
          <h1 className="title" id="login-title">Welcome Back</h1>
          <p className="subtitle" id="login-subtitle">Sign in to your UniExam portal</p>

          <div className="form-group">
            <label className="input-label" htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="name@university.com"
              className="premium-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="input-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              placeholder="••••••••"
              className="premium-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div
            id="forgot-password-link"
            className="forgot-pass"
            onClick={() => navigate("/forgot-password")}
          >
            Forgot Password?
          </div>

          <button
            id="login-submit-btn"
            className="login-btn"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? <div className="spinner"></div> : "Sign In to Portal"}
          </button>

          {msg && (
            <div id="login-error-msg" className="error-msg">
              {msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}