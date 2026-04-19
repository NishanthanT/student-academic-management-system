import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:8000"; // change if needed

export default function ViewUsers() {
  const [activeRole, setActiveRole] = useState("all");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = (type, message) => {
    setToast({ type, message });
    window.clearTimeout(window.__toastTimer);
    window.__toastTimer = window.setTimeout(() => setToast(null), 3000);
  };

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const token = useMemo(() => localStorage.getItem("token"), []);

  const showYearSemColumns = activeRole === "student";

  const fetchUsers = async () => {
    if (!token) {
      showToast("error", "Session expired. Please login again.");
      return;
    }

    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (activeRole !== "all") params.set("role", activeRole);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(
        `${API_BASE}/api/admin/users?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showToast("error", data?.message || "Failed to load users");
        setUsers([]);
        return;
      }

      const list = Array.isArray(data?.data) ? data.data : data?.data?.data || [];
      setUsers(list);
    } catch (e) {
      showToast("error", "Server not reachable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRole]);

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "student",
    current_year: "",
    current_semester: "",
  });

  const openEdit = (u) => {
    setSelectedUser(u);
    setEditForm({
      name: u?.name || "",
      email: u?.email || "",
      role: u?.role || "student",
      current_year: u?.current_year ?? "",
      current_semester: u?.current_semester ?? "",
    });
    setEditOpen(true);
  };

  const validateEdit = () => {
    if (!editForm.name.trim()) return showToast("error", "Please fill the Name"), false;
    if (!editForm.email.trim()) return showToast("error", "Please fill the Email"), false;
    if (!/^\S+@\S+\.\S+$/.test(editForm.email)) {
      return showToast("error", "Please enter a valid Email"), false;
    }

    if (editForm.role === "student") {
      const cy = Number(editForm.current_year);
      const cs = Number(editForm.current_semester);

      if (!editForm.current_year) return showToast("error", "Please select the Year"), false;
      if (![1, 2, 3, 4].includes(cy)) return showToast("error", "Year must be 1 to 4"), false;

      if (!editForm.current_semester) {
        return showToast("error", "Please select the Semester"), false;
      }
      if (![1, 2].includes(cs)) return showToast("error", "Semester must be 1 or 2"), false;
    }

    return true;
  };

  const saveEdit = async () => {
    if (!selectedUser) return;
    if (!validateEdit()) return;

    try {
      const payload = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        ...(editForm.role === "student"
          ? {
            current_year: Number(editForm.current_year),
            current_semester: Number(editForm.current_semester),
          }
          : {
            current_year: null,
            current_semester: null,
          }),
      };

      const res = await fetch(`${API_BASE}/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showToast("error", data?.message || "Update failed");
        return;
      }

      showToast("success", data?.message || "User updated");
      setEditOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (e) {
      showToast("error", "Server not reachable");
    }
  };

  const openDelete = (u) => {
    setSelectedUser(u);
    setDeleteReason("");
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: deleteReason }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showToast("error", data?.message || "Delete failed");
        return;
      }

      showToast("success", data?.message || "User deleted");
      setDeleteOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (e) {
      showToast("error", "Server not reachable");
    }
  };

  const TabBtn = ({ id, label, value }) => {
    const active = activeRole === value;

    return (
      <button
        id={id}
        onClick={() => setActiveRole(value)}
        className={`px-5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 border
          ${active
            ? "bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/20 scale-105"
            : "bg-white/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-transparent hover:border-blue-500/30 hover:text-blue-600 shadow-sm"
          }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out pb-20">
      {toast && (
        <div
          className={`fixed top-10 right-10 z-[100] px-6 py-4 rounded-2xl shadow-2xl text-sm font-bold text-white
          transform transition-all duration-500 animate-slide-in flex items-center gap-3 backdrop-blur-md
          ${toast.type === "success"
              ? "bg-green-600/90 border border-green-400/30"
              : "bg-red-600/90 border border-red-400/30"
            }`}
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            {toast.type === "success" ? "✓" : "!"}
          </div>
          {toast.message}
        </div>
      )}

      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-50 tracking-tight">
            User Management
          </h1>
          <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-1">
            View, search, edit, and manage all system users in one place.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              id="vu-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pl-11 pr-5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 text-gray-950 dark:text-white transition-all text-sm font-medium w-full md:w-72 shadow-sm"
            />
          </div>

          <button
            id="vu-refresh"
            onClick={fetchUsers}
            className="p-3.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border-2 border-gray-100 dark:border-gray-700 rounded-2xl hover:border-blue-500/50 hover:text-blue-600 transition-all shadow-xl shadow-black/5 group"
            title="Refresh"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"
                }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      <section className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-2xl rounded-[1.5rem] shadow-xl border border-white/20 dark:border-gray-700/30 p-6 overflow-hidden">
        <div className="flex gap-2.5 mb-6 flex-wrap">
          <TabBtn id="vu-tab-all" label="All Users" value="all" />
          <TabBtn id="vu-tab-admin" label="Admins" value="admin" />
          <TabBtn id="vu-tab-staff" label="Staff" value="staff" />
          <TabBtn id="vu-tab-student" label="Students" value="student" />
        </div>

        <div className="border-2 border-gray-100 dark:border-gray-700/50 rounded-[2rem] overflow-x-auto custom-scrollbar bg-white/30 dark:bg-gray-900/30 transition-all">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b-2 border-gray-100 dark:border-gray-700">
                <th className="text-left py-5 px-6 block-xs font-black uppercase tracking-widest text-[10px] text-gray-400">
                  ID
                </th>
                <th className="text-left py-5 px-6 block-xs font-black uppercase tracking-widest text-[10px] text-gray-400">
                  Name
                </th>
                <th className="text-left py-5 px-6 block-xs font-black uppercase tracking-widest text-[10px] text-gray-400">
                  Email
                </th>
                <th className="text-left py-5 px-6 block-xs font-black uppercase tracking-widest text-[10px] text-gray-400 text-center">
                  Role
                </th>

                {showYearSemColumns && (
                  <>
                    <th className="text-left py-5 px-6 block-xs font-black uppercase tracking-widest text-[10px] text-gray-400 text-center">
                      Year
                    </th>
                    <th className="text-left py-5 px-6 block-xs font-black uppercase tracking-widest text-[10px] text-gray-400 text-center">
                      Semester
                    </th>
                  </>
                )}

                <th className="text-right py-5 px-8 block-xs font-black uppercase tracking-widest text-[10px] text-gray-400">
                  Options
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td className="p-20 text-center" colSpan={showYearSemColumns ? 7 : 5}>
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                      <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                        Loading users...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td className="p-20 text-center" colSpan={showYearSemColumns ? 7 : 5}>
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 italic">
                      No users found.
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="group hover:bg-blue-500/5 dark:hover:bg-blue-500/10 transition-all duration-300"
                  >
                    <td className="py-5 px-6 text-xs font-black text-gray-400">#{u.id}</td>

                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black">
                          {u.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-white leading-none">
                            {u.name}
                          </p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter mt-1">
                            {u.role}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-5 px-6">
                      <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
                        {u.email}
                      </p>
                    </td>

                    <td className="py-5 px-6 text-center">
                      <span
                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 
                          ${u.role === "admin"
                            ? "bg-purple-100 dark:bg-purple-900/20 text-purple-600 border-purple-200 dark:border-purple-800"
                            : u.role === "staff"
                              ? "bg-orange-100 dark:bg-orange-900/20 text-orange-600 border-orange-200 dark:border-orange-800"
                              : "bg-blue-100 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800"
                          }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    {showYearSemColumns && (
                      <>
                        <td className="py-5 px-6 text-center text-sm font-black dark:text-white">
                          {u.current_year ?? "-"}
                        </td>
                        <td className="py-5 px-6 text-center text-sm font-black dark:text-white">
                          {u.current_semester ?? "-"}
                        </td>
                      </>
                    )}

                    <td className="py-5 px-8 min-w-[180px]">
                      <div className="flex justify-end gap-3 opacity-100 translate-x-0 transition-all duration-300">
                        <button
                          id={`vu-edit-${u.id}`}
                          onClick={() => openEdit(u)}
                          className="flex items-center justify-center p-3 rounded-xl bg-blue-50 border-2 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition-all shadow-sm"
                          title="Edit User"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>

                        <button
                          id={`vu-del-${u.id}`}
                          onClick={() => openDelete(u)}
                          className="flex items-center justify-center p-3 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-400 transition-all shadow-sm"
                          title="Delete User"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editOpen && (
        <ModalShell
          id="vu-edit-modal"
          title="Edit User Details"
          onClose={() => setEditOpen(false)}
        >
          <div className="space-y-5 py-4">            <div className="group">
            <label
              htmlFor="vu-edit-name"
              className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 ml-1"
            >
              Name
            </label>
            <input
              id="vu-edit-name"
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-5 outline-none focus:border-blue-500 transition-all font-medium text-sm"
              value={editForm.name}
              onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>

            <div className="group">
              <label
                htmlFor="vu-edit-email"
                className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 ml-1"
              >
                Email
              </label>
              <input
                id="vu-edit-email"
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-5 outline-none focus:border-blue-500 transition-all font-medium text-sm"
                value={editForm.email}
                onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>

            <div className="group">
              <label
                htmlFor="vu-edit-role"
                className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 ml-1"
              >
                Role
              </label>
              <select
                id="vu-edit-role"
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-5 outline-none focus:border-blue-500 transition-all font-medium text-sm cursor-pointer appearance-none"
                value={editForm.role}
                onChange={(e) =>
                  setEditForm((p) => ({
                    ...p,
                    role: e.target.value,
                    ...(e.target.value !== "student"
                      ? { current_year: "", current_semester: "" }
                      : {}),
                  }))
                }
              >
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="student">Student</option>
              </select>
            </div>

            {editForm.role === "student" && (
              <div
                id="vu-edit-student-box"
                className="border border-blue-500/10 rounded-2xl p-5 bg-blue-500/5 animate-in zoom-in-95"
              >
                <p className="text-[11px] font-bold dark:text-white uppercase tracking-wider mb-4">
                  Student Details
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <select
                    id="vu-edit-year"
                    className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:border-blue-500 rounded-xl py-2 px-4 outline-none transition-all font-medium text-sm"
                    value={editForm.current_year}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, current_year: e.target.value }))
                    }
                  >
                    <option value="">Year</option>
                    {[1, 2, 3, 4].map((y) => (
                      <option key={y} value={y}>
                        {y} Year
                      </option>
                    ))}
                  </select>

                  <select
                    id="vu-edit-sem"
                    className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:border-blue-500 rounded-xl py-2 px-4 outline-none transition-all font-medium text-sm"
                    value={editForm.current_semester}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, current_semester: e.target.value }))
                    }
                  >
                    <option value="">Semester</option>
                    {[1, 2].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-3">
              <button
                id="vu-edit-cancel"
                onClick={() => setEditOpen(false)}
                className="flex-1 py-3 rounded-xl border border-gray-100 dark:border-gray-800 font-bold uppercase text-[11px] tracking-wider hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
              >
                Cancel
              </button>
              <button
                id="vu-edit-save"
                onClick={saveEdit}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold uppercase text-[11px] tracking-wider shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-1 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {deleteOpen && (
        <ModalShell
          id="vu-delete-modal"
          title="Delete User"
          onClose={() => setDeleteOpen(false)}
        >
          <div className="py-8 text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 scale-110">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <p className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
              Are you sure you want to delete <br />
              <span className="text-xl font-black text-gray-900 dark:text-white">
                "{selectedUser?.name}"
              </span>
              ?
            </p>

            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mt-4 animate-pulse">
              This action cannot be undone
            </p>

            <div className="mt-8 text-left">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">
                Reason for Deletion (Required)
              </label>
              <textarea
                id="vu-delete-reason"
                className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl py-4 px-6 outline-none focus:border-red-500 transition-all font-bold text-sm min-h-[100px] resize-none"
                placeholder="Ex: Violating terms of service / User requested removal..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              id="vu-del-cancel"
              onClick={() => setDeleteOpen(false)}
              className="flex-1 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 font-black uppercase text-xs tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
            >
              Cancel
            </button>
            <button
              id="vu-del-confirm"
              onClick={confirmDelete}
              disabled={deleteReason.trim().length < 5}
              className={`flex-1 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all
                ${deleteReason.trim().length < 5
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                  : "bg-red-600 text-white shadow-red-500/20 hover:bg-red-700 hover:-translate-y-1"}`}
            >
              Confirm and Delete
            </button>
          </div>
        </ModalShell>
      )}

      <style>
        {`
          @keyframes slideInRight {
            from { transform: translateX(60px); opacity: 0; }
            to   { transform: translateX(0); opacity: 1; }
          }
          .animate-slide-in { animation: slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        `}
      </style>
    </div>
  );
}

function ModalShell({ id, title, onClose, children }) {
  return (
    <div
      id={`${id}-backdrop`}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300"
    >
      <div
        id={id}
        className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl w-full max-w-lg rounded-[1.5rem] shadow-2xl border border-white/20 dark:border-gray-700/50 p-8 animate-in zoom-in-95 duration-500"
      >
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-bold dark:text-white tracking-tight">{title}</h4>
          <button
            id={`${id}-close`}
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-500 hover:border-red-500 hover:text-red-500 transition-all font-black"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}