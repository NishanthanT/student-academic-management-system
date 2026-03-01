import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const navigate = useNavigate();

  // ✅ token மட்டும்
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

    setLoading(true);
    setMsg("Resetting...");

    try {
      const res = await fetch(
        "http://10.253.38.225:8000/api/auth/reset-password",
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

      // ✅ ADD THIS ONLY (for forgot page auto-redirect)
      localStorage.setItem("pw_reset_done", "1");

      setTimeout(() => navigate("/"), 1500);
    } catch (e) {
      setMsg("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow w-96">
        <h1 className="text-2xl font-bold text-center mb-6">
          Reset Password
        </h1>

        <input
          type="password"
          className="w-full border p-2 rounded mb-4"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <input
          type="password"
          className="w-full border p-2 rounded mb-4"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <button
          className="w-full bg-blue-600 text-white py-2 rounded"
          onClick={handleReset}
          disabled={loading}
        >
          {loading ? "Please wait..." : "Reset Password"}
        </button>

        {msg && <p className="text-sm mt-3 text-center">{msg}</p>}
      </div>
    </div>
  );
}