import { useMemo, useState } from "react";

const API_BASE = "http://localhost:8000"; // change if needed

export default function CreateUser() {
  const token = useMemo(() => localStorage.getItem("token"), []);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    current_year: "",       // ✅ added
    current_semester: "",   // ✅ added
  });

  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    window.clearTimeout(window.__toastTimer);
    window.__toastTimer = window.setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (key, val) => {
    setForm((prev) => {
      // ✅ if role change away from student -> clear year/sem
      if (key === "role" && val !== "student") {
        return { ...prev, role: val, current_year: "", current_semester: "" };
      }
      return { ...prev, [key]: val };
    });
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const e = {};

    if (!form.name.trim()) e.name = "Name is required";

    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Invalid email format";

    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Password must be at least 6 characters";

    if (!["admin", "staff", "student"].includes(form.role)) e.role = "Invalid role";

    // ✅ Student extra validation
    if (form.role === "student") {
      if (!form.current_year) e.current_year = "Please select the Year";
      if (!form.current_semester) e.current_semester = "Please select the Semester";
    }

    setErrors(e);

    const firstKey = Object.keys(e)[0];
    return { ok: Object.keys(e).length === 0, firstKey, firstMsg: firstKey ? e[firstKey] : null };
  };

  const handleCreateUser = async () => {
    const v = validate();

    if (!v.ok) {
      // ✅ toast message by field
      if (v.firstKey === "name") showToast("error", "Please fill the Name");
      else if (v.firstKey === "email") {
        if (v.firstMsg === "Invalid email format") showToast("error", "Please enter a valid Email");
        else showToast("error", "Please fill the Email");
      } else if (v.firstKey === "password") showToast("error", "Please fill the Password");
      else if (v.firstKey === "current_year") showToast("error", "Please select the Year");
      else if (v.firstKey === "current_semester") showToast("error", "Please select the Semester");
      else showToast("error", v.firstMsg || "Please fix the form errors");
      return;
    }

    if (!token) {
      showToast("error", "Session expired. Please login again.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      };

      // ✅ only send for student
      if (form.role === "student") {
        payload.current_year = Number(form.current_year);
        payload.current_semester = Number(form.current_semester);
      }

      const res = await fetch(`${API_BASE}/api/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showToast("error", data?.message || "Failed to create user");
        return;
      }

      showToast("success", data?.message || `User "${form.name}" created successfully!`);

      setForm({
        name: "",
        email: "",
        password: "",
        role: "student",
        current_year: "",
        current_semester: "",
      });
      setErrors({});
    } catch (e) {
      showToast("error", "Server not reachable");
    } finally {
      setLoading(false);
    }
  };

  const isStudent = form.role === "student";

  return (
    <>
      {/* ✅ Toast */}
      {toast && (
        <div
          id="cu-toast"
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-xl text-sm text-white
          transform transition-all duration-300 animate-slide-in
          ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
        >
          {toast.message}
        </div>
      )}

      <section id="create-user-section" className="bg-white rounded-xl shadow-sm border p-6 max-w-xl">
        <h3 id="create-user-title" className="text-lg font-semibold mb-4">
          Create User
        </h3>

        {/* Name */}
        <label htmlFor="cu-name-input" className="text-sm font-medium">Name</label>
        <input
          id="cu-name-input"
          type="text"
          className="w-full border rounded p-2 mt-1 mb-1"
          placeholder="Enter name"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />
        {errors.name && <p id="cu-name-error" className="text-xs text-red-500 mb-3">{errors.name}</p>}

        {/* Email */}
        <label htmlFor="cu-email-input" className="text-sm font-medium">Email</label>
        <input
          id="cu-email-input"
          type="email"
          className="w-full border rounded p-2 mt-1 mb-1"
          placeholder="Enter email"
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
        />
        {errors.email && <p id="cu-email-error" className="text-xs text-red-500 mb-3">{errors.email}</p>}

        {/* Password */}
        <label htmlFor="cu-password-input" className="text-sm font-medium">Temp Password</label>
        <input
          id="cu-password-input"
          type="password"
          className="w-full border rounded p-2 mt-1 mb-1"
          placeholder="Enter temp password"
          value={form.password}
          onChange={(e) => handleChange("password", e.target.value)}
        />
        {errors.password && <p id="cu-password-error" className="text-xs text-red-500 mb-3">{errors.password}</p>}

        {/* Role */}
        <label htmlFor="cu-role-select" className="text-sm font-medium">Role</label>
        <select
          id="cu-role-select"
          className="w-full border rounded p-2 mt-1 mb-4"
          value={form.role}
          onChange={(e) => handleChange("role", e.target.value)}
        >
          <option value="student">student</option>
          <option value="staff">staff</option>
          <option value="admin">admin</option>
        </select>

        {/* ✅ Student fields */}
        {isStudent && (
          <div id="cu-student-box" className="border rounded-xl p-4 mb-4 bg-gray-50">
            <h4 id="cu-student-title" className="font-semibold mb-3">Student Academic Details</h4>

            <label htmlFor="cu-year-select" className="text-sm font-medium">Current Year</label>
            <select
              id="cu-year-select"
              className="w-full border rounded p-2 mt-1 mb-1"
              value={form.current_year}
              onChange={(e) => handleChange("current_year", e.target.value)}
            >
              <option value="">Select Year</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
            {errors.current_year && (
              <p id="cu-year-error" className="text-xs text-red-500 mb-3">{errors.current_year}</p>
            )}

            <label htmlFor="cu-sem-select" className="text-sm font-medium">Current Semester</label>
            <select
              id="cu-sem-select"
              className="w-full border rounded p-2 mt-1 mb-1"
              value={form.current_semester}
              onChange={(e) => handleChange("current_semester", e.target.value)}
            >
              <option value="">Select Semester</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
            {errors.current_semester && (
              <p id="cu-sem-error" className="text-xs text-red-500">{errors.current_semester}</p>
            )}
          </div>
        )}

        <button
          id="cu-submit-button"
          onClick={handleCreateUser}
          disabled={loading}
          className={`w-full py-2 rounded transition text-white
            ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {loading ? "Creating..." : "Create User"}
        </button>
      </section>

      <style>
        {`
          @keyframes slideInRight {
            from { transform: translateX(20px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          .animate-slide-in { animation: slideInRight 0.25s ease-out; }
        `}
      </style>
    </>
  );
}
