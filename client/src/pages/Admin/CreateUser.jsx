import { useMemo, useState } from "react";

const API_BASE = "http://localhost:8000"; // change if needed

export default function CreateUser() {
  const token = useMemo(() => localStorage.getItem("token"), []);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    current_year: "",
    current_semester: "",
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
    <div className="max-w-4xl mx-auto py-4 animate-in fade-in slide-in-from-bottom-5 duration-700 ease-out pb-20">
      {/* ✅ Toast */}
      {toast && (
        <div
          className={`fixed top-10 right-10 z-[100] px-6 py-4 rounded-2xl shadow-2xl text-sm font-bold text-white
          transform transition-all duration-500 animate-slide-in flex items-center gap-3 backdrop-blur-md
          ${toast.type === "success" ? "bg-green-600/90 border border-green-400/30" : "bg-red-600/90 border border-red-400/30"}`}
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            {toast.type === "success" ? "✓" : "!"}
          </div>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-10 text-center lg:text-left">
        <h1 className="text-4xl font-black text-gray-900 dark:text-gray-50 tracking-tight">Access Management</h1>
        <p className="text-gray-800 dark:text-gray-300 mt-2 font-semibold">Create new accounts with specific academic roles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Main Form Area */}
        <section className="lg:col-span-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/20 dark:border-gray-700/30 p-10 hover:border-blue-500/20 transition-all duration-500">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black dark:text-white tracking-tight">User Registration</h3>
          </div>

          <div className="space-y-6">
            {/* Input Groups with Border Animations */}
            <div className="group">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 mb-2 ml-1 group-focus-within:text-blue-500 transition-colors">Full Name</label>
              <input
                type="text"
                className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl py-4 px-6 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 text-gray-950 dark:text-white transition-all font-bold placeholder:text-gray-400"
                placeholder="Enter Full Name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>

            <div className="group">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 mb-2 ml-1 group-focus-within:text-blue-500 transition-colors">Contact Email</label>
              <input
                type="email"
                className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl py-4 px-6 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 text-gray-950 dark:text-white transition-all font-bold placeholder:text-gray-400"
                placeholder="Email Address (e.g. name@uniexam.lk)"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group">
                <label className="block text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 mb-2 ml-1 group-focus-within:text-blue-500 transition-colors">Default Password</label>
                <input
                  type="password"
                  className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl py-4 px-6 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 text-gray-950 dark:text-white transition-all font-bold placeholder:text-gray-400"
                  placeholder="Password (Min 6 chars)"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                />
              </div>

              <div className="group">
                <label className="block text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 mb-2 ml-1 group-focus-within:text-blue-500 transition-colors">Access Role</label>
                <select
                  className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl py-4 px-6 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 text-gray-950 dark:text-white transition-all font-black cursor-pointer"
                  value={form.role}
                  onChange={(e) => handleChange("role", e.target.value)}
                >
                  <option value="student">Student Account</option>
                  <option value="staff">Staff Member</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            {isStudent && (
              <div className="border-2 border-blue-500/20 rounded-3xl p-8 bg-blue-500/10 dark:bg-blue-600/20 animate-in zoom-in-95">
                <h4 className="text-sm font-black text-blue-900 dark:text-blue-100 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
                   Student Academic Mapping
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <select
                      className="bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 outline-none focus:border-blue-600 transition-all font-black text-gray-900 dark:text-white"
                      value={form.current_year}
                      onChange={(e) => handleChange("current_year", e.target.value)}
                    >
                      <option value="">Select Year</option>
                      <option value="1">Year 1</option>
                      <option value="2">Year 2</option>
                      <option value="3">Year 3</option>
                      <option value="4">Year 4</option>
                    </select>
                    <select
                      className="bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 outline-none focus:border-blue-600 transition-all font-black text-gray-900 dark:text-white"
                      value={form.current_semester}
                      onChange={(e) => handleChange("current_semester", e.target.value)}
                    >
                      <option value="">Select Sem</option>
                      <option value="1">Sem 1</option>
                      <option value="2">Sem 2</option>
                    </select>
                </div>
              </div>
            )}

            <button
              onClick={handleCreateUser}
              disabled={loading}
              className={`w-full py-5 rounded-2xl transition-all font-black text-white tracking-widest uppercase text-sm shadow-2xl transform hover:-translate-y-2 active:scale-95 flex items-center justify-center gap-3
                ${loading ? "bg-gray-500 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30"}`}
            >
              {loading ? (
                 <>
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   <span>Creating User...</span>
                 </>
              ) : (
                "Create User"
              )}
            </button>
          </div>
        </section>

        {/* Sidebar Help / Guide */}
        <aside className="lg:col-span-2 hidden lg:block space-y-6">
           <div className="bg-gradient-to-br from-indigo-600 to-blue-800 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-[80px]"></div>
              <h4 className="text-2xl font-black mb-4 tracking-tight">Privacy Guard</h4>
              <p className="text-indigo-100 text-sm leading-relaxed font-medium">
                 All credentials are encrypted and stored securely. Users will receive an automated notification to complete their profile setup.
              </p>
           </div>
           <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border-2 border-gray-200 dark:border-gray-700 shadow-xl">
              <h4 className="font-black text-gray-900 dark:text-white mb-4 uppercase tracking-widest text-xs">Guidelines</h4>
              <ul className="space-y-4 text-xs font-black text-gray-800 dark:text-gray-200">
                 <li className="flex items-start gap-2 text-green-600">✓ Unique Email Required</li>
                 <li className="flex items-start gap-2 text-blue-600">✓ PW Strength Enforced</li>
                 <li className="flex items-start gap-2 text-purple-600">✓ Role Auto-Assignment</li>
              </ul>
           </div>
        </aside>
      </div>

      <style>
        {`
          @keyframes slideInRight {
            from { transform: translateX(60px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          .animate-slide-in { animation: slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        `}
      </style>
    </div>
  );
}
