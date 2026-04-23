import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { useSettings } from "../../context/SettingsContext";
import { useTheme } from "../../context/ThemeContext";
import PageTransitionLoader from "../../components/PageTransitionLoader";

export default function StaffLayout() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { isDark, toggleTheme } = useTheme();

  // ✅ Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getUserName = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user && user.name) return user.name;
    } catch (e) {}
    return localStorage.getItem("userName") || localStorage.getItem("name") || "Staff";
  };
  const userName = useMemo(getUserName, []);
  const role = useMemo(() => localStorage.getItem("role") || "staff", []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `w-full text-left px-5 py-3 rounded-xl transition-all duration-300 border block flex items-center gap-3 transform relative overflow-hidden group
     ${isActive
      ? "bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/20 scale-[1.02] z-10"
      : "bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700/50 hover:border-blue-500/30 hover:bg-white dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-md hover:-translate-y-0.5"
    } text-[12px] font-semibold tracking-tight`;

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
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="w-10 h-10 object-contain rounded-xl  border border-gray-200" />
            ) : (
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40 rotate-3">
                <span className="text-white font-black text-lg">
                  {(settings?.system_name || "UniExam").charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                {settings?.system_name || "UniExam"}
              </h1>
              <p className="text-[9px] uppercase font-bold text-blue-600/70 dark:text-blue-400/70 tracking-[0.2em] mt-1">Staff Portal</p>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-gray-400 hover:text-red-500 transition-colors" id="stafflayout-button-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="space-y-3 flex-1  pr-2 custom-scrollbar" onClick={() => setIsSidebarOpen(false)}>
          <NavLink to="/staff" end className={linkClass} id="staff-nav-dashboard">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/staff/my-subjects" className={linkClass} id="staff-nav-subjects">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            <span>My Subjects</span>
          </NavLink>

          <NavLink to="/staff/exams" className={linkClass} id="staff-nav-exams">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <span>Exams</span>
          </NavLink>
          <NavLink to="/staff/ApprovedExamNotice" className={linkClass} id="staff-nav-questions">
            ApprovedExamNotice
          </NavLink>

          <NavLink to="/staff/allow-students" className={linkClass} id="staff-nav-allow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            <span>Eligibility</span>
          </NavLink>

          <NavLink to="/staff/results" className={linkClass} id="staff-nav-results">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10m9-10h2a2 2 0 002-2V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v4a2 2 0 002 2zm0 10V9a2 2 0 00-2-2h-2a2 2 0 00-2 2v10m9-10h2a2 2 0 002-2V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v4a2 2 0 002 2z" /></svg>
            <span>Results</span>
          </NavLink>

          <NavLink to="/staff/analysis" className={linkClass} id="staff-nav-analysis">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
            <span>Analysis</span>
          </NavLink>

          <NavLink to="/staff/feedback" className={linkClass} id="staff-nav-feedback">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            <span>Feedback</span>
          </NavLink>
        </nav>

        <div className="mt-10 border-t dark:border-gray-700 pt-5 space-y-4">
          {/* Theme Toggle Button matched to Admin style */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-all border dark:border-gray-700 shadow-sm group"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
           id="stafflayout-button-2">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 group-hover:text-blue-600 transition-colors">Theme</span>
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <button
            id="staff-logout-btn"
            onClick={handleLogout}
            className="w-full bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 transition-all shadow-lg active:scale-95 uppercase tracking-[0.2em] text-[9px] flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            LOGOUT
          </button>
        </div>
      </aside>

      {/* Main Container - Combined Scroll Area */}
      <main className="flex-1 h-screen overflow-y-auto w-full relative custom-scrollbar flex flex-col bg-gray-50/30 dark:bg-gray-950/30">
        <PageTransitionLoader>
          <div className="min-h-screen flex flex-col">
            {/* Superior Topbar */}
            <div className="px-4 md:px-10 pt-4 md:pt-10 pb-4 md:pb-6 border-b border-gray-200/50 dark:border-gray-800/50 transition-colors duration-500">
              <div className="bg-white dark:bg-gray-900 rounded-2xl md:rounded-[1.5rem] shadow-xl border dark:border-gray-800 p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-500">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  {/* Hamburger Button */}
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-gray-600 dark:text-gray-300 md:hidden hover:text-blue-600 transition-all border dark:border-gray-700"
                   id="stafflayout-button-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                  </button>
                  <div>
                    <h2 className="text-[13px] md:text-[14px] font-black text-gray-900 dark:text-white capitalize leading-none">Welcome, {userName}</h2>
                    <p className="text-[9px] md:text-xs font-semibold text-gray-400 mt-1 uppercase tracking-[0.15em] hidden sm:block">
                      Academic Hub Console
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 px-5 py-3 rounded-2xl border dark:border-gray-800 scale-90 md:scale-100">
                  <div className="w-10 h-10 bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center font-black">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest leading-none">Status</div>
                    <div className="text-[13px] font-black text-gray-800 dark:text-gray-200 capitalize">{role}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Page Content */}
            <div className="flex-1 px-4 md:px-10 py-6 md:py-10 w-full">
              <Outlet />
            </div>
          </div>
        </PageTransitionLoader>
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
