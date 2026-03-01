import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000"; // change if needed

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setMsg("Enter email and password");
      return;
    }

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.message || "Invalid credentials");
        return;
      }

      // ✅ Save token + role
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);

      // ✅ Role-based navigation
      if (data.user.role === "admin") {
        navigate("/admin");
      } else if (data.user.role === "staff") {
        navigate("/staff");
      } else {
        navigate("/student");
      }

    } catch (err) {
      setMsg("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">UniExam Login</h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-4 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-4 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <p
          className="text-sm text-blue-600 cursor-pointer mb-4 hover:underline"
          onClick={() => navigate("/forgot-password")}
        >
          Forgot Password?
        </p>

        <button
          className="w-full bg-blue-600 text-white py-2 rounded"
          onClick={handleLogin}
        >
          Login
        </button>

        {msg && (
          <p className="text-red-500 text-sm mt-3 text-center">{msg}</p>
        )}
      </div>
    </div>
  );
}
