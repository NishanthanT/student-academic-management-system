import React, { useState, useEffect, useMemo } from "react";
import { Link, Outlet, useLocation, useNavigate, NavLink } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function StudentDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/student";

  // ✅ Theme State
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark" || 
           (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  // ✅ Profile & Stats State
  const [userName, setUserName] = useState(() => localStorage.getItem("userName") || localStorage.getItem("name") || "Student");
  const [stats, setStats] = useState({ totalAllowed: 0, completed: 0, passed: 0, notices: 0 });
  const [recentResults, setRecentResults] = useState([]);
  const [subjectProgress, setSubjectProgress] = useState([]);
  const [latestNotices, setLatestNotices] = useState([]);
  const [nextExam, setNextExam] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // 🌙 Apply Dark Mode
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    // 👤 Fetch Profile
    if (userName === "Student" || !userName) {
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
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

    // 📊 Fetch Stats & Extra Data
    const fetchStats = () => {
      fetch(`${API_BASE}/api/student/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(res => {
        if (res.ok) {
          setStats(res.stats);
          setRecentResults(res.recentResults || []);
          setNextExam(res.nextExam || null);
          setSubjectProgress(res.subjectProgress || []);
          setLatestNotices(res.latestNotices || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Stats fetch error:", err);
        setLoading(false);
      });
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // 30s auto refresh
    return () => clearInterval(interval);
  }, [userName]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    navigate("/");
  };

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 border-2 group relative overflow-hidden
     ${isActive
      ? "bg-indigo-600 text-white border-indigo-400 shadow-xl shadow-indigo-500/40 scale-[1.03] z-10 font-bold"
      : "bg-gray-50/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-gray-200/60 dark:border-gray-700/60 hover:border-indigo-500/50 hover:bg-white dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-lg hover:-translate-y-0.5"
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
      {/* Sidebar - Perfectly Fixed */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-gray-100/90 dark:bg-gray-900/90 backdrop-blur-2xl border-r border-gray-200 dark:border-gray-800 
        h-full z-[70] transition-all duration-500 ease-out transform
        md:sticky md:translate-x-0 md:h-screen md:z-20
        ${isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        px-6 py-8 flex flex-col
      `}>
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/40 rotate-6">
            <span className="text-white font-black text-xl">U</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">UniExam</h1>
            <p className="text-[10px] uppercase font-bold text-indigo-600/70 dark:text-indigo-400/70 tracking-widest -mt-1">Student Portal</p>
          </div>
          {/* Mobile Close Button */}
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-gray-400 hover:text-red-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar text-sm" onClick={() => setIsSidebarOpen(false)}>
          <NavLink to="/student" end className={navItemClass}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
             <span>Dashboard</span>
          </NavLink>
          
          <NavLink to="/student/exam-notice" className={navItemClass}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
             <span>Exam Notice</span>
          </NavLink>
          
          <NavLink to="/student/attempt" className={navItemClass}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
             <span>Attempt Exam</span>
          </NavLink>
          
          <NavLink to="/student/results" className={navItemClass}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10m9-10h2a2 2 0 002-2V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v4a2 2 0 002 2zm0 10V9a2 2 0 00-2-2h-2a2 2 0 00-2 2v10m9-10h2a2 2 0 002-2V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v4a2 2 0 002 2z" /></svg>
             <span>View Results</span>
          </NavLink>
          
          <NavLink to="/student/feedback" className={navItemClass}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
             <span>Feedback</span>
          </NavLink>
        </nav>

        <div className="mt-10 border-t dark:border-gray-700 pt-5 space-y-4">
           {/* Theme Toggle */}
           <button onClick={() => setIsDark(!isDark)} className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-all border dark:border-gray-700 shadow-sm group">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 transition-colors">Theme</span>
              {isDark ? (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" /></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>)}
            </button>
            <button onClick={handleLogout} className="w-full bg-red-600 text-white font-black py-3 rounded-2xl hover:bg-red-700 transition-all shadow-lg active:scale-95 uppercase tracking-widest text-xs flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              LOGOUT
            </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 h-screen overflow-hidden flex flex-col bg-gray-50/30 dark:bg-gray-950/30">
        
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 w-full bg-gray-50 dark:bg-gray-950 px-4 md:px-10 pt-4 md:pt-10 pb-4 md:pb-6 border-b border-gray-200/50 dark:border-gray-800/50 transition-colors duration-500">
          <div className="bg-white dark:bg-gray-900 rounded-2xl md:rounded-[2rem] shadow-2xl border dark:border-gray-800 p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-500 hover:shadow-indigo-500/5">
            <div className="flex items-center gap-4 w-full md:w-auto">
              {/* Hamburger Button */}
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-gray-600 dark:text-gray-300 md:hidden hover:text-indigo-600 transition-all border dark:border-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
              <div>
                <h2 className="text-lg md:text-2xl font-black text-gray-900 dark:text-white capitalize tracking-tight leading-none">Welcome, {userName}</h2>
                <p className="text-[10px] md:text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest hidden sm:block">
                   Academic Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 px-5 py-3 rounded-2xl border dark:border-gray-800 scale-90 md:scale-100">
               <div className="w-10 h-10 bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-black">
                 {userName.charAt(0).toUpperCase()}
               </div>
               <div>
                  <div className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest leading-none">Status</div>
                  <div className="text-sm font-black text-gray-800 dark:text-gray-200 capitalize">Student</div>
               </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-10 custom-scrollbar animate-in fade-in duration-1000 w-full">
          {isHome ? (
            <div className="space-y-12 max-w-7xl mx-auto">

              {/* ✅ Quick Action Cards Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <QuickActionCard 
                   title="Attempt Exam" 
                   desc="Launch your latest scheduled assessment"
                   icon="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                   to="/student/attempt"
                   color="indigo"
                />
                <QuickActionCard 
                   title="Check Results" 
                   desc="Review your performance and transcripts"
                   icon="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                   to="/student/results"
                   color="emerald"
                />
                <QuickActionCard 
                   title="Send Feedback" 
                   desc="Report issues or suggest enhancements"
                   icon="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                   to="/student/feedback"
                   color="rose"
                />
              </div>

              {/* Top Banner Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-white">
                 {/* Next Exam Widget */}
                 <div className="lg:col-span-2 bg-gradient-to-br from-indigo-700 to-indigo-500 rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-500/20 relative overflow-hidden flex flex-col justify-between group">
                    <div className="absolute top-0 right-0 p-10 opacity-10 transform scale-150 rotate-12 group-hover:scale-[1.7] transition-transform duration-700">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="relative z-10">
                       <span className="bg-white/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Upcoming Challenge</span>
                       <h3 className="text-4xl font-black mt-6 tracking-tighter">
                          {nextExam ? nextExam.exam_title : "No Upcoming Exams"}
                       </h3>
                       <p className="text-indigo-100 font-bold mt-2">
                          {nextExam ? `${nextExam.subject_code} • ${nextExam.subject_name}` : "Relax! No exams scheduled for now."}
                       </p>
                    </div>
                    {nextExam && (
                       <div className="mt-8 flex items-center gap-8 relative z-10">
                          <CountdownTimer targetDate={nextExam.start_at} />
                          <Link to="/student/attempt" className="bg-white text-indigo-700 px-8 py-3.5 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl">Prepare Now</Link>
                       </div>
                    )}
                 </div>

                 {/* Stats Sidebar */}
                 <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border dark:border-gray-800 p-8 shadow-2xl flex flex-col justify-between gap-6 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl" />
                    <div className="space-y-6">
                       <MiniStat label="Pass Count" value={stats.passed} total={stats.completed} color="green" />
                       <MiniStat label="Submission Rate" value={stats.completed > 0 ? Math.round((stats.completed / stats.totalAllowed) * 100) + "%" : "0%"} color="blue" />
                       <MiniStat label="Pending Notices" value={stats.notices} color="rose" />
                    </div>
                    <Link to="/student/results" className="w-full py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                       Full Analytics
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </Link>
                 </div>
              </div>

              {/* Stats Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <StatCard title="Total Allowed Exams" value={stats.totalAllowed} color="blue" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                 <StatCard title="Completed/Attempted" value={stats.completed} color="green" icon="M5 13l4 4L19 7" />
                 <StatCard title="Passed Exams" value={stats.passed} color="indigo" icon="M13 10V3L4 14h7v7l9-11h-7z" />
                 <StatCard title="Active Notices" value={stats.notices} color="rose" icon="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </div>

              {/* Two Column Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                 {/* ✅ Subject-wise Progress Chart */}
                 <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border dark:border-gray-800 shadow-2xl p-10 group">
                    <div className="flex items-center justify-between mb-10">
                       <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Subject Progress</h3>
                       <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                          <span className="w-3 h-3 bg-indigo-500 rounded-full" /> Average Performance
                       </div>
                    </div>
                    <div className="space-y-8">
                       {subjectProgress.length === 0 ? (
                          <div className="py-10 text-center text-gray-400 font-bold italic">No academic data available yet.</div>
                       ) : subjectProgress.map((sp, idx) => (
                          <div key={idx} className="space-y-2">
                             <div className="flex justify-between items-end text-sm">
                                <span className="font-black text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{sp.subject_name}</span>
                                <span className="font-bold text-gray-500">{sp.avg_score}%</span>
                             </div>
                             <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-indigo-500/20 group-hover:bg-indigo-600"
                                  style={{ width: `${sp.avg_score}%` }}
                                />
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* Recent Results List */}
                 <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col">
                    <div className="p-8 pb-4 flex items-center justify-between">
                       <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Recent Results</h3>
                       <Link to="/student/results" className="text-xs font-black text-indigo-600 hover:text-indigo-400 transition-colors uppercase tracking-widest">All Details</Link>
                    </div>
                    <div className="px-2 pb-6">
                       {recentResults.length === 0 ? (
                          <div className="py-20 text-center text-gray-500 font-bold italic">Your submission log is empty.</div>
                       ) : (
                          <div className="space-y-2">
                             {recentResults.map(res => (
                                <div key={res.attempt_id} className="mx-4 p-5 rounded-3xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-800 flex items-center justify-between group">
                                   <div className="flex items-center gap-4">
                                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all group-hover:scale-110 shadow-lg ${
                                         res.status === 'PASS' 
                                         ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                         : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                      }`}>
                                         {res.status === 'PASS' ? 'A+' : 'F'}
                                      </div>
                                      <div>
                                         <div className="font-black text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate max-w-[150px]">{res.exam_title}</div>
                                         <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{res.subject_code}</div>
                                      </div>
                                   </div>
                                   <div className="text-right">
                                      <div className="font-black text-gray-900 dark:text-white">{res.student_marks}</div>
                                      <div className="text-[10px] font-black uppercase text-gray-400">{res.status}</div>
                                   </div>
                                </div>
                             ))}
                          </div>
                       )}
                    </div>
                 </div>
              </div>

              {/* ✅ Latest Announcements Section */}
              <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border dark:border-gray-800 shadow-2xl p-10 overflow-hidden relative">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                       Latest Announcements
                    </h3>
                    <Link to="/student/exam-notice" className="text-xs font-black text-indigo-600 hover:text-indigo-400 transition-colors uppercase tracking-widest">View All</Link>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {latestNotices.length === 0 ? (
                       <div className="col-span-2 py-10 text-center text-gray-500 font-bold italic">No major announcements at this time.</div>
                    ) : latestNotices.map((notice, idx) => (
                       <div key={idx} className="p-6 rounded-[2rem] bg-gray-50 dark:bg-gray-800/50 border dark:border-gray-800 flex flex-col justify-between hover:scale-[1.02] transition-all">
                          <div>
                             <h4 className="font-black text-gray-900 dark:text-white text-lg leading-tight group-hover:text-indigo-600">{notice.title}</h4>
                             <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 line-clamp-3">
                                {notice.description}
                             </p>
                          </div>
                          <div className="mt-6 flex items-center justify-between">
                             <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                {new Date(notice.created_at).toLocaleDateString()}
                             </span>
                             <Link to="/student/exam-notice" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Read More</Link>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>

      <style>{`
         .custom-scrollbar::-webkit-scrollbar { width: 5px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: #6366f133; border-radius: 10px; }
         .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6366f166; }
      `}</style>
    </div>
  );
}

function QuickActionCard({ title, desc, icon, to, color }) {
  const colors = {
    indigo: "bg-indigo-50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600",
    emerald: "bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600",
    rose: "bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600"
  };

  return (
    <Link to={to} className={`p-6 rounded-[2rem] border transition-all duration-300 flex flex-col items-center text-center group shadow-sm hover:shadow-xl hover:-translate-y-1 ${colors[color]}`}>
       <div className={`w-14 h-14 rounded-2xl bg-white/50 dark:bg-white/5 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
       </div>
       <h4 className="font-black text-sm uppercase tracking-wider">{title}</h4>
       <p className="text-[10px] mt-1 opacity-70 font-bold group-hover:text-white transition-colors">{desc}</p>
    </Link>
  );
}

function StatCard({ title, value, color, icon }) {
  const colors = {
    blue: "text-blue-600 bg-blue-600/10 border-blue-200/50",
    green: "text-green-600 bg-green-600/10 border-green-200/50",
    indigo: "text-indigo-600 bg-indigo-600/10 border-indigo-200/50",
    rose: "text-rose-600 bg-rose-600/10 border-rose-200/50"
  };
  return (
    <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border dark:border-gray-800 shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
       <div className="relative z-10 flex flex-col justify-between h-full">
          <div className={`w-14 h-14 rounded-2xl ${colors[color]} border flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
          </div>
          <div>
             <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{title}</div>
             <div className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</div>
          </div>
       </div>
    </div>
  );
}

function MiniStat({ label, value, total, color }) {
  const c = color === 'green' ? 'bg-green-500' : color === 'rose' ? 'bg-rose-500' : 'bg-blue-500';
  return (
     <div className="flex items-center justify-between p-4 rounded-3xl bg-gray-50 dark:bg-gray-800/50 border dark:border-gray-800">
        <div>
           <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</div>
           <div className="text-2xl font-black text-gray-900 dark:text-white uppercase">
              {value} {total !== undefined && <span className="text-xs text-gray-400 font-bold tracking-normal">/ {total}</span>}
           </div>
        </div>
        <div className={`w-12 h-12 rounded-2xl ${c} flex items-center justify-center text-white shadow-lg shadow-${color}-500/20`}>
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
     </div>
  );
}

function CountdownTimer({ targetDate }) {
   const [timeLeft, setTimeLeft] = useState("");
   useEffect(() => {
     const timer = setInterval(() => {
       const now = new Date().getTime();
       const distance = new Date(targetDate).getTime() - now;
       if (distance < 0) {
         setTimeLeft("Live Now");
         return;
       }
       const days = Math.floor(distance / (1000 * 60 * 60 * 24));
       const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
       const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
       const seconds = Math.floor((distance % (1000 * 60)) / 1000);
       setTimeLeft(`${days > 0 ? days + "d " : ""}${hours}h ${minutes}m ${seconds}s`);
     }, 1000);
     return () => clearInterval(timer);
   }, [targetDate]);

   return (
      <div className="flex flex-col">
         <span className="text-[10px] font-black uppercase text-indigo-200 tracking-widest">T-Minus</span>
         <span className="text-2xl font-black tracking-tighter">{timeLeft}</span>
      </div>
   );
}