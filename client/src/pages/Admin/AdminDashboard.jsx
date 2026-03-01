import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useMemo } from "react";

export default function AdminLayout() {
  const navigate = useNavigate();

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
        ? "bg-blue-600 text-white border-blue-600"
        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
      }`;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r min-h-screen px-4 py-5">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-blue-700">UniExam</h1>
          <p className="text-xs text-gray-500">Admin Panel</p>
        </div>

        <nav className="space-y-2">
          <NavLink to="/admin" end className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/create-user" className={linkClass}>
            Create User
          </NavLink>
          <NavLink to="/admin/view-users" className={linkClass}>
            View Users
          </NavLink>
          <NavLink to="/admin/create-subject" className={linkClass}>
            Create Subject
          </NavLink>
          <NavLink to="/admin/assign-staff" className={linkClass}>
            Assign Staff → Subject
          </NavLink>
         <NavLink to="/admin/exam-management" className={linkClass}>
  Exam Management
</NavLink>
        </nav>

        <div className="mt-10">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">
        {/* Top bar */}
        <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Welcome, {userName}</h2>
            <p className="text-sm text-gray-500">
              Manage users, subjects, and staff assignments
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
