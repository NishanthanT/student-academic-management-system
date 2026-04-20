import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";

export default function AdminLayout() {
  const navigate = useNavigate();

  const { isDark, toggleTheme } = useTheme();

  const userName = useMemo(() => localStorage.getItem("userName") || "Admin", []);
  const role = useMemo(() => localStorage.getItem("role") || "admin", []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `w-full text-left px-3 py-2 rounded transition border block
      ${isActive
        ? "bg-blue-600 text-white border-blue-600 shadow-md"
        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
      }`;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex transition-colors duration-300">
      {/* Sidebar - Made Sticky */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 h-screen sticky top-0 px-4 py-5 shadow-sm flex flex-col">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-blue-700 dark:text-blue-400">UniExam</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
        </div>

        <nav className="space-y-2 flex-1">
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
            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition shadow-md"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main - Made scrollable */}
      <main className="flex-1 p-6 h-screen overflow-y-auto">
        {/* Top bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4 flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold dark:text-white">Welcome, {userName}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage users, subjects, and staff assignments
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* ✅ Theme Toggle Button (SVG for visibility) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all border dark:border-gray-600 flex items-center justify-center"
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
    </div>
  );
}
