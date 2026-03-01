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
        navigate("/"); // or "/login"
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
    <div
      id="forgot-page-container"
      className="min-h-screen flex items-center justify-center bg-gray-100 relative"
    >
      {/* ✅ BACK ICON */}
      <button
        onClick={() => navigate("/")}  // change to "/login" if needed
        className="absolute top-6 left-6 text-blue-600 font-semibold hover:underline"
      >
        ← Back
      </button>

      <div
        id="forgot-card"
        className="bg-white p-8 rounded-xl shadow w-96"
      >
        <h1
          id="forgot-title"
          className="text-2xl font-bold text-center mb-6"
        >
          Forgot Password
        </h1>

        <label
          id="forgot-email-label"
          htmlFor="forgot-email-input"
          className="block mb-1 text-sm font-medium"
        >
          Email
        </label>

        <input
          id="forgot-email-input"
          type="email"
          className="w-full border p-2 rounded mb-4"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          id="forgot-send-button"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          onClick={handleSend}
        >
          Send Reset Link
        </button>

        {msg && (
          <p
            id="forgot-status-message"
            className="text-sm mt-3 text-center"
          >
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}