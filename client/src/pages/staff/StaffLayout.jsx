import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useMemo } from "react";

export default function StaffLayout() {
  const navigate = useNavigate();

  const userName = useMemo(() => localStorage.getItem("userName") || "Staff", []);
  const role = useMemo(() => localStorage.getItem("role") || "staff", []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `w-full text-left px-3 py-2 rounded transition border block
     ${
       isActive
         ? "bg-blue-600 text-white border-blue-600"
         : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
     }`;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r min-h-screen px-4 py-5">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-blue-700">UniExam</h1>
          <p className="text-xs text-gray-500">Staff Panel</p>
        </div>

        <nav className="space-y-2">
          <NavLink to="/staff" end className={linkClass} id="staff-nav-dashboard">
            Dashboard
          </NavLink>

          <NavLink to="/staff/my-subjects" className={linkClass} id="staff-nav-subjects">
            My Subjects
          </NavLink>

          <NavLink to="/staff/exams" className={linkClass} id="staff-nav-exams">
            Exams
          </NavLink>

          <NavLink to="/staff/ApprovedExamNotice" className={linkClass} id="staff-nav-questions">
            ApprovedExamNotice
          </NavLink>

          <NavLink to="/staff/allow-students" className={linkClass} id="staff-nav-allow">
            Allow Students
          </NavLink>

          <NavLink to="/staff/results" className={linkClass} id="staff-nav-results">
            Results
          </NavLink>
        </nav>

        <div className="mt-10">
          <button
            id="staff-logout-btn"
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">
        {/* Topbar */}
        <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Welcome, {userName}</h2>
            <p className="text-sm text-gray-500">
              Manage exams, questions, student access, and results
            </p>
          </div>
          <div className="text-xs text-gray-500">
            Role: <span className="font-semibold">{role}</span>
          </div>
        </div>

        {/* Page Content */}
        <div className="mt-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
