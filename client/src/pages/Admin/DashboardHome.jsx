import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function DashboardHome() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalStaff: 0,
    totalSubjects: 0,
    totalExams: 0,
    recentUsers: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://${window.location.hostname}:8000/api/admin/stats`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => {
        if (res.status === 401) { localStorage.clear(); window.location.href = "/"; throw new Error("Unauthorized"); }
        return res.json();
      })
      .then((res) => {
        if (res.ok) setStats(res.data);
      })
      .catch((err) => console.error("Stats fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("UniExam - Admin Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    // Stats Table
    autoTable(doc, {
      startY: 30,
      head: [["Metric", "Count"]],
      body: [
        ["Total Users", stats.totalUsers],
        ["Total Students", stats.totalStudents],
        ["Total Staff", stats.totalStaff],
        ["Total Subjects", stats.totalSubjects],
        ["Total Exams", stats.totalExams],
      ],
    });

    // Recent Users Table
    if (stats.recentUsers && stats.recentUsers.length > 0) {
      const finalY = doc.lastAutoTable.finalY;
      doc.text("Recent Users Registration", 14, finalY + 10);
      autoTable(doc, {
        startY: finalY + 15,
        head: [["ID", "Name", "Email", "Role", "Joined At"]],
        body: stats.recentUsers.map((u) => [
          u.id,
          u.name,
          u.email,
          u.role,
          new Date(u.created_at).toLocaleDateString(),
        ]),
      });
    }

    doc.save("UniExam_Admin_Report.pdf");
  };

  if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700 ease-out">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">System Overview</h1>
        <button
          onClick={downloadPDF}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:-translate-y-1 active:scale-95 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Export PDF</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Total Users" value={stats.totalUsers} color="blue" delay="delay-0" />
        <StatCard title="Students" value={stats.totalStudents} color="green" delay="delay-75" />
        <StatCard title="Staff Members" value={stats.totalStaff} color="purple" delay="delay-100" />
        <StatCard title="Total Exams" value={stats.totalExams} color="orange" delay="delay-150" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Users Table */}
        <div className="lg:col-span-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-8 hover:shadow-2xl transition-all duration-300">
          <h3 className="text-xl font-bold mb-6 dark:text-white flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
            Recent Users
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 border-b dark:border-gray-700 text-xs uppercase tracking-wider">
                  <th className="pb-4 font-semibold">User Details</th>
                  <th className="pb-4 font-semibold">Contact</th>
                  <th className="pb-4 font-semibold text-right">Access Level</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {stats.recentUsers.map((u) => (
                  <tr key={u.id} className="group text-sm hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                    <td className="py-4">
                      <div className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{u.name}</div>
                      <div className="text-[10px] text-gray-400">ID: #{u.id}</div>
                    </td>
                    <td className="py-4 text-gray-500 dark:text-gray-400">{u.email}</td>
                    <td className="py-4 text-right">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                          u.role === "admin"
                            ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                            : u.role === "staff"
                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                            : "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-8 hover:shadow-2xl transition-all duration-300">
          <h3 className="text-xl font-bold mb-6 dark:text-white flex items-center gap-2">
             <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
             User Distribution
          </h3>
          <div className="space-y-6">
            <ProgressBar
              label="Students"
              value={stats.totalStudents}
              total={stats.totalUsers}
              color="bg-green-500"
              shadow="shadow-green-500/20"
            />
            <ProgressBar
              label="Staff"
              value={stats.totalStaff}
              total={stats.totalUsers}
              color="bg-purple-500"
              shadow="shadow-purple-500/20"
            />
            <ProgressBar
              label="Admins"
              value={stats.totalUsers - stats.totalStudents - stats.totalStaff}
              total={stats.totalUsers}
              color="bg-red-500"
              shadow="shadow-red-500/20"
            />
          </div>
          
          <div className="mt-10 pt-6 border-t dark:border-gray-700/50">
             <div className="text-xs text-gray-400 text-center italic">
                Data automatically synchronized
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color, delay }) {
  const themes = {
    blue: {
      base: "text-blue-600 dark:text-blue-400 border-blue-500/20 bg-blue-500/5",
      hover: "hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-blue-500/40",
      dot: "bg-blue-500",
    },
    green: {
      base: "text-green-600 dark:text-green-400 border-green-500/20 bg-green-500/5",
      hover: "hover:bg-green-600 hover:text-white hover:border-green-600 hover:shadow-green-500/40",
      dot: "bg-green-500",
    },
    purple: {
      base: "text-purple-600 dark:text-purple-400 border-purple-500/20 bg-purple-500/5",
      hover: "hover:bg-purple-600 hover:text-white hover:border-purple-600 hover:shadow-purple-500/40",
      dot: "bg-purple-500",
    },
    orange: {
      base: "text-orange-600 dark:text-orange-400 border-orange-500/20 bg-orange-500/5",
      hover: "hover:bg-orange-600 hover:text-white hover:border-orange-600 hover:shadow-orange-500/40",
      dot: "bg-orange-500",
    },
  };

  const theme = themes[color];

  return (
    <div
      className={`p-8 rounded-2xl border backdrop-blur-md shadow-lg transition-all duration-300 transform hover:-translate-y-3 bg-white/40 dark:bg-gray-800/40 animate-in fade-in zoom-in-95 group cursor-pointer ${delay} ${theme.base} ${theme.hover}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1 group-hover:text-white/80 transition-colors">
            {title}
          </p>
          <h4 className="text-4xl font-black transition-transform duration-300 group-hover:scale-110 origin-left">
            {value}
          </h4>
        </div>
        <div className="p-3 rounded-xl bg-white/20 dark:bg-black/20 group-hover:bg-white/40 transition-colors">
          <div className={`w-3 h-3 rounded-full animate-pulse group-hover:animate-ping ${theme.dot} md:group-hover:bg-white`}></div>
        </div>
      </div>
      <div className="mt-6 flex items-center text-[10px] font-bold tracking-tighter opacity-70 group-hover:opacity-100 transition-opacity">
        <span className="uppercase mr-1 group-hover:text-white/90">System Status:</span>
        <span className="text-green-500 group-hover:text-white animate-pulse">● Optimal</span>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, total, color, shadow }) {
  const percent = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-2 group">
      <div className="flex justify-between text-sm font-bold">
        <span className="text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{label}</span>
        <span className="dark:text-white">{Math.round(percent)}%</span>
      </div>
      <div className="w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-3 p-0.5 overflow-hidden border border-gray-300/20">
        <div
          className={`${color} h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${shadow}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
