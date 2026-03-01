import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:8000"; // 🔁 change if needed

export default function ViewUsers() {
  const [activeRole, setActiveRole] = useState("all"); // all | admin | staff | student
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // toast
  const [toast, setToast] = useState(null);
  const showToast = (type, message) => {
    setToast({ type, message });
    window.clearTimeout(window.__toastTimer);
    window.__toastTimer = window.setTimeout(() => setToast(null), 3000);
  };

  // modals
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const token = useMemo(() => localStorage.getItem("token"), []);

  // ✅ Student tab only: Year/Sem columns show
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
        { headers: { Authorization: `Bearer ${token}` } }
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

  // ---------- Edit ----------
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
    if (!/^\S+@\S+\.\S+$/.test(editForm.email))
      return showToast("error", "Please enter a valid Email"), false;

    if (editForm.role === "student") {
      const cy = Number(editForm.current_year);
      const cs = Number(editForm.current_semester);

      if (!editForm.current_year) return showToast("error", "Please select the Year"), false;
      if (![1, 2, 3, 4].includes(cy)) return showToast("error", "Year must be 1 to 4"), false;

      if (!editForm.current_semester)
        return showToast("error", "Please select the Semester"), false;
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

  // ---------- Delete ----------
  const openDelete = (u) => {
    setSelectedUser(u);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
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
        className={`px-4 py-2 rounded-lg text-sm border transition
          ${
            active
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          }`}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          id="vu-toast"
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-xl text-sm text-white
          transform transition-all duration-300 animate-slide-in
          ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
        >
          {toast.message}
        </div>
      )}

      <section className="bg-white rounded-xl shadow-sm border p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-lg font-semibold mb-1">View Users</h3>
            <p className="text-sm text-gray-600">Filter by role, search, edit or delete users.</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="vu-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email..."
              className="border rounded-lg px-3 py-2 text-sm w-64"
            />
            <button
              id="vu-refresh"
              onClick={fetchUsers}
              className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Role Tabs */}
        <div className="mt-4 flex gap-2 flex-wrap">
          <TabBtn id="vu-tab-all" label="All" value="all" />
          <TabBtn id="vu-tab-admin" label="Admin" value="admin" />
          <TabBtn id="vu-tab-staff" label="Staff" value="staff" />
          <TabBtn id="vu-tab-student" label="Student" value="student" />
        </div>

        {/* Table */}
        <div className="mt-5 border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Role</th>

                {/* ✅ Student tab only */}
                {showYearSemColumns && (
                  <>
                    <th className="text-left p-3">Year</th>
                    <th className="text-left p-3">Sem</th>
                  </>
                )}

                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4 text-gray-500" colSpan={showYearSemColumns ? 7 : 5}>
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td className="p-4 text-gray-500" colSpan={showYearSemColumns ? 7 : 5}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="p-3">{u.id}</td>
                    <td className="p-3">{u.name}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full text-xs border">{u.role}</span>
                    </td>

                    {/* ✅ Student tab only */}
                    {showYearSemColumns && (
                      <>
                        <td className="p-3">{u.current_year ?? "-"}</td>
                        <td className="p-3">{u.current_semester ?? "-"}</td>
                      </>
                    )}

                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          id={`vu-edit-${u.id}`}
                          onClick={() => openEdit(u)}
                          className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          id={`vu-del-${u.id}`}
                          onClick={() => openDelete(u)}
                          className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Delete
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

      {/* Edit Modal */}
      {editOpen && (
        <ModalShell id="vu-edit-modal" title="Edit User" onClose={() => setEditOpen(false)}>
          <label htmlFor="vu-edit-name" className="text-sm font-medium">
            Name
          </label>
          <input
            id="vu-edit-name"
            className="w-full border rounded p-2 mt-1 mb-3"
            value={editForm.name}
            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
          />

          <label htmlFor="vu-edit-email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="vu-edit-email"
            className="w-full border rounded p-2 mt-1 mb-3"
            value={editForm.email}
            onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
          />

          <label htmlFor="vu-edit-role" className="text-sm font-medium">
            Role
          </label>
          <select
            id="vu-edit-role"
            className="w-full border rounded p-2 mt-1 mb-3"
            value={editForm.role}
            onChange={(e) =>
              setEditForm((p) => ({
                ...p,
                role: e.target.value,
                // ✅ role change to non-student => clear year/sem
                ...(e.target.value !== "student"
                  ? { current_year: "", current_semester: "" }
                  : {}),
              }))
            }
          >
            <option value="student">student</option>
            <option value="staff">staff</option>
            <option value="admin">admin</option>
          </select>

          {/* ✅ Only when student */}
          {editForm.role === "student" && (
            <div id="vu-edit-student-box" className="border rounded-xl p-4 mb-4 bg-gray-50">
              <p className="text-sm font-semibold mb-3">Student Academic Details</p>

              <label htmlFor="vu-edit-year" className="text-sm font-medium">
                Current Year
              </label>
              <select
                id="vu-edit-year"
                className="w-full border rounded p-2 mt-1 mb-3 bg-white"
                value={editForm.current_year}
                onChange={(e) => setEditForm((p) => ({ ...p, current_year: e.target.value }))}
              >
                <option value="">Select Year</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>

              <label htmlFor="vu-edit-sem" className="text-sm font-medium">
                Current Semester
              </label>
              <select
                id="vu-edit-sem"
                className="w-full border rounded p-2 mt-1 bg-white"
                value={editForm.current_semester}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, current_semester: e.target.value }))
                }
              >
                <option value="">Select Semester</option>
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              id="vu-edit-cancel"
              onClick={() => setEditOpen(false)}
              className="px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              id="vu-edit-save"
              onClick={saveEdit}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </ModalShell>
      )}

      {/* Delete Modal */}
      {deleteOpen && (
        <ModalShell id="vu-delete-modal" title="Delete User" onClose={() => setDeleteOpen(false)}>
          <p className="text-sm text-gray-700 mb-4">
            Are you sure you want to delete <b>{selectedUser?.name}</b>?
          </p>

          <div className="flex justify-end gap-2">
            <button
              id="vu-del-cancel"
              onClick={() => setDeleteOpen(false)}
              className="px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              id="vu-del-confirm"
              onClick={confirmDelete}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </ModalShell>
      )}

      {/* Animation */}
      <style>
        {`
          @keyframes slideInRight {
            from { transform: translateX(20px); opacity: 0; }
            to   { transform: translateX(0);  opacity: 1; }
          }
          .animate-slide-in { animation: slideInRight 0.25s ease-out; }
        `}
      </style>
    </>
  );
}

function ModalShell({ id, title, onClose, children }) {
  return (
    <div
      id={`${id}-backdrop`}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
    >
      <div id={id} className="bg-white w-full max-w-lg rounded-xl shadow-xl border p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold">{title}</h4>
          <button
            id={`${id}-close`}
            onClick={onClose}
            className="px-3 py-1 rounded border hover:bg-gray-50"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
