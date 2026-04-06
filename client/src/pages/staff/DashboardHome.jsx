import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function StaffDashboard() {
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalExams: 0,
    pendingExams: 0,
    approvedExams: 0,
    rejectedExams: 0,
    changesExams: 0,
    totalStudents: 0,
    upcomingExams: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/staff/stats`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) setStats(res.data);
      })
      .catch((err) => console.error("Stats fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
     return (
       <div className="flex items-center justify-center min-h-[60vh]">
         <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
       </div>
     );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700 ease-out">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-gray-950 dark:text-white tracking-tight">
            Staff Analytics Hub
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-bold tracking-tight italic">
            Overview of your academic responsibilities and examination status.
          </p>
        </div>
        
        <div className="flex bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl border-2 border-white/20 dark:border-gray-800 rounded-3xl p-2 shadow-xl shrink-0">
           <button className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20">
             Live Overview
           </button>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Assigned Subjects" value={stats.totalSubjects} color="blue" subtitle="Global Units" />
        <StatCard title="Total Students" value={stats.totalStudents} color="emerald" subtitle="Enrolled Capacity" />
        <StatCard title="Pending Review" value={stats.pendingExams} color="amber" subtitle="Exams awaiting Admin" />
        <StatCard title="Approved Exams" value={stats.approvedExams} color="indigo" subtitle="Active Cycle" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Navigation & Quick Actions */}
        <section className="xl:col-span-8 space-y-8">
          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-3xl rounded-[3rem] shadow-2xl border-2 border-white/20 dark:border-gray-700/50 p-10 overflow-hidden">
             <div className="flex items-center justify-between mb-10">
                <div>
                   <h2 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight">Management Modules</h2>
                   <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mt-1">Personnel Operation Center</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NavCard 
                  to="/staff/my-subjects" 
                  title="My Subjects" 
                  desc="View detailed curriculum and module data assigned to your profile."
                  icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />}
                />
                <NavCard 
                  to="/staff/exams" 
                  title="Exam Control" 
                  desc="Create, edit, and schedule examination papers and session drafts."
                  icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />}
                />
                <NavCard 
                  to="/staff/allow-students" 
                  title="Student Access" 
                  desc="Grant or revoke examination eligibility for specific student groups."
                  icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />}
                />
                <NavCard 
                  to="/staff/results" 
                  title="Result Matrix" 
                  desc="Analyze exam performance and publish finalized student grades."
                  icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10m9-10h2a2 2 0 002-2V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v4a2 2 0 002 2zm0 10V9a2 2 0 00-2-2h-2a2 2 0 00-2 2v10m9-10h2a2 2 0 002-2V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v4a2 2 0 002 2z" />}
                />
             </div>
          </div>
        </section>

        {/* Exam Tracking & Alerts */}
        <section className="xl:col-span-4 space-y-8">
           <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-3xl rounded-[3rem] shadow-2xl border-2 border-white/20 dark:border-gray-700/50 p-8 overflow-hidden">
              <h3 className="text-xl font-black text-gray-950 dark:text-white tracking-tight leading-none mb-8">Exam Status Tracking</h3>
              <div className="space-y-6">
                 <StatusRow label="Approved & Active" count={stats.approvedExams} color="emerald" />
                 <StatusRow label="Under Draft" count={stats.totalExams - stats.pendingExams - stats.approvedExams - stats.rejectedExams} color="blue" />
                 <StatusRow label="Awaiting Review" count={stats.pendingExams} color="amber" />
                 <StatusRow label="Revise / Changes" count={stats.changesExams || 0} color="orange" />
                 <StatusRow label="Rejected / Void" count={stats.rejectedExams} color="red" />
              </div>

              <div className="mt-12 p-6 bg-blue-600 rounded-[2rem] text-white shadow-xl shadow-blue-600/30">
                 <h4 className="font-black tracking-tight text-lg mb-2">Need Help?</h4>
                 <p className="text-xs font-bold text-blue-100 italic leading-relaxed">Refer to the staff handbook or contact Admin for module assignment requests.</p>
              </div>
           </div>

           {/* Upcoming Exams Section ✅ NEW */}
           <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-3xl rounded-[3rem] shadow-2xl border-2 border-white/20 dark:border-gray-700/50 p-8 overflow-hidden">
              <h3 className="text-xl font-black text-gray-950 dark:text-white tracking-tight leading-none mb-8">Upcoming Exams Timeline</h3>
              <div className="space-y-6">
                 {(!stats.upcomingExams || stats.upcomingExams.length === 0) ? (
                   <div className="p-6 bg-gray-50/50 dark:bg-gray-950/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">No scheduled exams</p>
                   </div>
                 ) : (
                   stats.upcomingExams.map((ex) => (
                     <UpcomingExamItem key={ex.id} exam={ex} />
                   ))
                 )}
              </div>
           </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ title, value, color, subtitle }) {
  const colors = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
    green: "text-green-600 bg-green-50 dark:bg-green-900/30",
    emerald: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30",
    purple: "text-purple-600 bg-purple-50 dark:bg-purple-900/30",
    orange: "text-orange-600 bg-orange-50 dark:bg-orange-900/30",
    amber: "text-amber-500 bg-amber-50 dark:bg-amber-900/30",
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30",
  };

  return (
    <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-3xl rounded-[2.5rem] p-8 border-2 border-white/20 dark:border-gray-800 shadow-xl group hover:shadow-2xl hover:-translate-y-1 transition-all">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">{title}</div>
      <div className="flex items-end justify-between">
        <div className="text-4xl font-black text-gray-950 dark:text-white">{value}</div>
        <div className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${colors[color]}`}>{subtitle}</div>
      </div>
    </div>
  );
}

function NavCard({ to, title, desc, icon }) {
  return (
    <Link 
      to={to} 
      className="group p-8 rounded-[2rem] bg-gray-50 dark:bg-gray-950/50 border-2 border-gray-100 dark:border-gray-800 hover:border-blue-600 transition-all shadow-sm flex flex-col items-start gap-4"
    >
      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-900 shadow-md flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {icon}
        </svg>
      </div>
      <div>
         <h3 className="font-black text-gray-950 dark:text-white mb-1 tracking-tight">{title}</h3>
         <p className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
      </div>
    </Link>
  );
}

function StatusRow({ label, count, color }) {
  const bg = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-600",
    amber: "bg-amber-500",
    orange: "bg-orange-500",
    red: "bg-red-600"
  };
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-950/50 border-2 border-transparent hover:border-white/20 transition-all">
       <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${bg[color]}`}></div>
          <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">{label}</span>
       </div>
       <span className="text-sm font-black text-gray-950 dark:text-white">{count}</span>
    </div>
  );
}

function UpcomingExamItem({ exam }) {
  const d = new Date(exam.start_at);
  const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="group relative flex items-start gap-5 p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-950/50 border-2 border-transparent hover:border-blue-600/30 transition-all">
       <div className="flex flex-col items-center gap-1 shrink-0 bg-white dark:bg-gray-900 p-2 rounded-xl shadow-sm border dark:border-gray-800 min-w-[55px]">
          <span className="text-[10px] font-black uppercase text-blue-600 tracking-tighter">{dateStr.split(' ')[0]}</span>
          <span className="text-xl font-black text-gray-900 dark:text-white leading-none">{dateStr.split(' ')[1]}</span>
       </div>
       <div className="flex-1 min-w-0">
          <h4 className="text-sm font-black text-gray-950 dark:text-white truncate tracking-tight">{exam.title}</h4>
          <div className="flex items-center gap-2 mt-1">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{timeStr}</span>
          </div>
       </div>
       <Link 
         to="/staff/exams" 
         className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all p-2 rounded-lg bg-blue-600/10 text-blue-600"
       >
         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
         </svg>
       </Link>
    </div>
  );
}
