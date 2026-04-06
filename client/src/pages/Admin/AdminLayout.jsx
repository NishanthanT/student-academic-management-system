import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function AdminLayout() {
  const navigate = useNavigate();

  // ✅ Theme State
  const [isDark, setIsDark] = useState(localStorage.getItem("theme") === "dark");

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  // ✅ Profile State
  const [userName, setUserName] = useState(() => localStorage.getItem("userName") || localStorage.getItem("name") || "Admin");
  const role = useMemo(() => localStorage.getItem("role") || "admin", []);

  // ✅ Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // 👤 Fetch Profile if name is generic (fixes display without logout)
    if (userName === "Admin" || !userName) {
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      .then(res => res.json())
      .then(res => {
        if (res.ok && res.user.name) {
          setUserName(res.user.name);
          localStorage.setItem("userName", res.user.name);
        }
      })
      .catch(err => console.error("Profile fetch error:", err));
    }
  }, [userName]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `w-full text-left px-5 py-3.5 rounded-2xl transition-all duration-300 border-2 block transform relative overflow-hidden group
     ${isActive
      ? "bg-blue-600 text-white border-blue-400 shadow-xl shadow-blue-500/40 scale-[1.03] z-10"
      : "bg-gray-50/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-gray-200/60 dark:border-gray-700/60 hover:border-blue-500/50 hover:bg-white dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5"
    }`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex transition-colors duration-300 font-sans">
      {/* Sidebar Backdrop for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:hidden transition-all duration-500"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed on mobile, sticky on desktop */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-gray-100/90 dark:bg-gray-900/90 backdrop-blur-2xl border-r border-gray-200 dark:border-gray-800 
        h-full z-[70] transition-all duration-500 ease-out transform
        md:sticky md:translate-x-0 md:h-screen md:z-20
        ${isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        px-6 py-8 flex flex-col
      `}>
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40">
              <span className="text-white font-black text-xl">U</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">UniExam</h1>
              <p className="text-[10px] uppercase font-bold text-blue-600/70 dark:text-blue-400/70 tracking-widest -mt-1">Operational Hub</p>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-gray-400 hover:text-red-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar" onClick={() => setIsSidebarOpen(false)}>
          <NavLink to="/admin" end className={linkClass}>Dashboard</NavLink>
          <NavLink to="/admin/create-user" className={linkClass}>Create User</NavLink>
          <NavLink to="/admin/view-users" className={linkClass}>View Users</NavLink>
          <NavLink to="/admin/create-subject" className={linkClass}>Create Subject</NavLink>
          <NavLink to="/admin/assign-staff" className={linkClass}>Assign Staff → Subject</NavLink>
          <NavLink to="/admin/exam-management" className={linkClass}>Exam Management</NavLink>
        </nav>

        <div className="mt-10 border-t dark:border-gray-700 pt-5">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition shadow-md font-bold uppercase tracking-widest text-xs"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main - Scrollable */}
      <main className="flex-1 p-4 md:p-6 h-screen overflow-y-auto w-full">
        {/* Topbar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-3 md:p-4 flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Hamburger Button */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-gray-600 dark:text-gray-300 md:hidden hover:text-blue-600 transition-all border dark:border-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            <div className="hidden sm:block">
              <h2 className="text-base md:text-lg font-black dark:text-white capitalize leading-none pt-1">Welcome, {userName}</h2>
              <p className="text-[10px] md:text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                 System Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all border dark:border-gray-600 flex items-center justify-center shadow-sm"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Role: <span className="font-semibold">{role}</span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="pb-10">
          <Outlet />
        </div>
      </main>

      <style>{`
         .custom-scrollbar::-webkit-scrollbar { width: 5px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: #3b82f633; border-radius: 10px; }
         .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3b82f666; }
      `}</style>
    </div>
  );
}
