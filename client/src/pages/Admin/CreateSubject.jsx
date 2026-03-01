import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:8000"; // change if needed

export default function CreateSubject() {
  const token = useMemo(() => localStorage.getItem("token"), []);

  // ---------- Toast ----------
  const [toast, setToast] = useState(null);
  const showToast = (type, message) => {
    setToast({ type, message });
    window.clearTimeout(window.__toastTimer);
    window.__toastTimer = window.setTimeout(() => setToast(null), 3000);
  };

  // ---------- Create Form ----------
  const [form, setForm] = useState({
    code: "",
    name: "",
    year: "",
    semester: "",
  });
  const [errors, setErrors] = useState({});
  const [creating, setCreating] = useState(false);

  const normalizeCode = (v) =>
    (v || "")
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace(/[^A-Z0-9_-]/g, "");

  const handleChange = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const validate = () => {
    const e = {};

    if (!form.code.trim()) e.code = "Subject Code is required";
    else if (form.code.trim().length < 3) e.code = "Code must be at least 3 characters";

    if (!form.name.trim()) e.name = "Subject Name is required";
    else if (form.name.trim().length < 3) e.name = "Name must be at least 3 characters";

    const y = Number(form.year);
    if (!form.year) e.year = "Please select the Year";
    else if (![1, 2, 3, 4].includes(y)) e.year = "Year must be 1 to 4";

    const s = Number(form.semester);
    if (!form.semester) e.semester = "Please select the Semester";
    else if (![1, 2].includes(s)) e.semester = "Semester must be 1 or 2";

    setErrors(e);

    const firstKey = Object.keys(e)[0];
    return { ok: Object.keys(e).length === 0, firstKey, firstMsg: firstKey ? e[firstKey] : null };
  };

  const handleCreate = async () => {
    const v = validate();

    if (!v.ok) {
      if (v.firstKey === "code") showToast("error", "Please fill the Subject Code");
      else if (v.firstKey === "name") showToast("error", "Please fill the Subject Name");
      else if (v.firstKey === "year") showToast("error", "Please select the Year");
      else if (v.firstKey === "semester") showToast("error", "Please select the Semester");
      else showToast("error", v.firstMsg || "Please fix the form errors");
      return;
    }

    if (!token) {
      showToast("error", "Session expired. Please login again.");
      return;
    }

    try {
      setCreating(true);

      const res = await fetch(`${API_BASE}/api/admin/subjects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: normalizeCode(form.code),
          name: form.name.trim(),
          year: Number(form.year),
          semester: Number(form.semester),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data?.message || "Failed to create subject");
        return;
      }

      showToast("success", data?.message || "Subject created successfully");
      setForm({ code: "", name: "", year: "", semester: "" });
      setErrors({});
      fetchSubjects(); // refresh table
    } catch (e) {
      showToast("error", "Server not reachable");
    } finally {
      setCreating(false);
    }
  };

  // ---------- View / Table ----------
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // filters
  const [fYear, setFYear] = useState("all");
  const [fSem, setFSem] = useState("all");
  const [search, setSearch] = useState("");

  const fetchSubjects = async () => {
    if (!token) {
      showToast("error", "Session expired. Please login again.");
      return;
    }

    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (fYear !== "all") params.set("year", fYear);
      if (fSem !== "all") params.set("semester", fSem);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`${API_BASE}/api/admin/subjects?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data?.message || "Failed to load subjects");
        setSubjects([]);
        return;
      }

      const list = Array.isArray(data?.data) ? data.data : data?.data?.data || [];
      setSubjects(list);
    } catch (e) {
      showToast("error", "Server not reachable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fYear, fSem]);

  // search debounce
  useEffect(() => {
    const t = setTimeout(() => fetchSubjects(), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // ---------- Edit Modal ----------
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({ code: "", name: "", year: "", semester: "" });
  const [saving, setSaving] = useState(false);

  const openEdit = (s) => {
    setSelected(s);
    setEditForm({
      code: s?.code || "",
      name: s?.name || "",
      year: String(s?.year ?? ""),
      semester: String(s?.semester ?? ""),
    });
    setEditOpen(true);
  };

  const validateEdit = () => {
    if (!editForm.code.trim()) return showToast("error", "Please fill the Subject Code"), false;
    if (editForm.code.trim().length < 3) return showToast("error", "Code must be at least 3 characters"), false;

    if (!editForm.name.trim()) return showToast("error", "Please fill the Subject Name"), false;
    if (editForm.name.trim().length < 3) return showToast("error", "Name must be at least 3 characters"), false;

    const y = Number(editForm.year);
    if (!editForm.year) return showToast("error", "Please select the Year"), false;
    if (![1, 2, 3, 4].includes(y)) return showToast("error", "Year must be 1 to 4"), false;

    const s = Number(editForm.semester);
    if (!editForm.semester) return showToast("error", "Please select the Semester"), false;
    if (![1, 2].includes(s)) return showToast("error", "Semester must be 1 or 2"), false;

    return true;
  };

  const saveEdit = async () => {
    if (!selected) return;
    if (!validateEdit()) return;

    try {
      setSaving(true);

      const res = await fetch(`${API_BASE}/api/admin/subjects/${selected.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: normalizeCode(editForm.code),
          name: editForm.name.trim(),
          year: Number(editForm.year),
          semester: Number(editForm.semester),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data?.message || "Update failed");
        return;
      }

      showToast("success", data?.message || "Subject updated");
      setEditOpen(false);
      setSelected(null);
      fetchSubjects();
    } catch (e) {
      showToast("error", "Server not reachable");
    } finally {
      setSaving(false);
    }
  };

  // ---------- Delete Modal ----------
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const openDelete = (s) => {
    setSelected(s);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selected) return;

    try {
      setDeleting(true);

      const res = await fetch(`${API_BASE}/api/admin/subjects/${selected.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data?.message || "Delete failed");
        return;
      }

      showToast("success", data?.message || "Subject deleted");
      setDeleteOpen(false);
      setSelected(null);
      fetchSubjects();
    } catch (e) {
      showToast("error", "Server not reachable");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          id="cs-toast"
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-xl text-sm text-white
          transform transition-all duration-300 animate-slide-in
          ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
        >
          {toast.message}
        </div>
      )}

      {/* Top layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Create Card */}
        <section id="cs-create-card" className="bg-white rounded-xl shadow-sm border p-6 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 id="cs-title" className="text-lg font-semibold">
                Create Subject
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Add subjects by Year & Semester.
              </p>
            </div>

            <button
              id="cs-clear-btn"
              type="button"
              onClick={() => {
                setForm({ code: "", name: "", year: "", semester: "" });
                setErrors({});
                showToast("success", "Form cleared");
              }}
              className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {/* Code */}
            <div>
              <label htmlFor="cs-code-input" className="text-sm font-medium">
                Subject Code
              </label>
              <input
                id="cs-code-input"
                type="text"
                className="w-full border rounded-lg p-2 mt-1"
                placeholder="Ex: IT3040"
                value={form.code}
                onChange={(e) => handleChange("code", normalizeCode(e.target.value))}
              />
              {errors.code && (
                <p id="cs-code-error" className="text-xs text-red-500 mt-1">
                  {errors.code}
                </p>
              )}
            </div>

            {/* Name */}
            <div>
              <label htmlFor="cs-name-input" className="text-sm font-medium">
                Subject Name
              </label>
              <input
                id="cs-name-input"
                type="text"
                className="w-full border rounded-lg p-2 mt-1"
                placeholder="Ex: IT Project Management"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
              {errors.name && (
                <p id="cs-name-error" className="text-xs text-red-500 mt-1">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Year */}
            <div>
              <label htmlFor="cs-year-select" className="text-sm font-medium">
                Year
              </label>
              <select
                id="cs-year-select"
                className="w-full border rounded-lg p-2 mt-1"
                value={form.year}
                onChange={(e) => handleChange("year", e.target.value)}
              >
                <option value="">Select Year</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
              {errors.year && (
                <p id="cs-year-error" className="text-xs text-red-500 mt-1">
                  {errors.year}
                </p>
              )}
            </div>

            {/* Semester */}
            <div>
              <label htmlFor="cs-sem-select" className="text-sm font-medium">
                Semester
              </label>
              <select
                id="cs-sem-select"
                className="w-full border rounded-lg p-2 mt-1"
                value={form.semester}
                onChange={(e) => handleChange("semester", e.target.value)}
              >
                <option value="">Select Semester</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
              {errors.semester && (
                <p id="cs-sem-error" className="text-xs text-red-500 mt-1">
                  {errors.semester}
                </p>
              )}
            </div>

            <button
              id="cs-submit-btn"
              onClick={handleCreate}
              disabled={creating}
              className={`w-full py-2.5 rounded-lg transition text-white font-medium
                ${creating ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {creating ? "Creating..." : "Create Subject"}
            </button>
          </div>
        </section>

        {/* View Card */}
        <section id="cs-view-card" className="bg-white rounded-xl shadow-sm border p-6 lg:col-span-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 id="cs-view-title" className="text-lg font-semibold">
                View Subjects
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Search, filter, update, or delete subjects.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="cs-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code or name..."
                className="border rounded-lg px-3 py-2 text-sm w-64"
              />
              <button
                id="cs-refresh"
                onClick={fetchSubjects}
                className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <select
              id="cs-filter-year"
              className="border rounded-lg px-3 py-2 text-sm"
              value={fYear}
              onChange={(e) => setFYear(e.target.value)}
            >
              <option value="all">All Years</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>

            <select
              id="cs-filter-sem"
              className="border rounded-lg px-3 py-2 text-sm"
              value={fSem}
              onChange={(e) => setFSem(e.target.value)}
            >
              <option value="all">All Semesters</option>
              <option value="1">Sem 1</option>
              <option value="2">Sem 2</option>
            </select>
          </div>

          {/* Table */}
          <div className="mt-5 border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="text-left p-3 w-16">ID</th>
                  <th className="text-left p-3">Code</th>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3 w-24">Year</th>
                  <th className="text-left p-3 w-24">Sem</th>
                  <th className="text-left p-3 w-40">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td className="p-4 text-gray-500" colSpan={6}>
                      Loading subjects...
                    </td>
                  </tr>
                ) : subjects.length === 0 ? (
                  <tr>
                    <td className="p-4 text-gray-500" colSpan={6}>
                      No subjects found.
                    </td>
                  </tr>
                ) : (
                  subjects.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="p-3">{s.id}</td>
                      <td className="p-3 font-semibold">{s.code}</td>
                      <td className="p-3">{s.name}</td>
                      <td className="p-3">{s.year}</td>
                      <td className="p-3">{s.semester}</td>
                      <td className="p-3 flex gap-2">
                        <button
                          id={`cs-edit-${s.id}`}
                          onClick={() => openEdit(s)}
                          className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          id={`cs-del-${s.id}`}
                          onClick={() => openDelete(s)}
                          className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <ModalShell id="cs-edit-modal" title="Edit Subject" onClose={() => setEditOpen(false)}>
          <label htmlFor="cs-edit-code" className="text-sm font-medium">
            Subject Code
          </label>
          <input
            id="cs-edit-code"
            className="w-full border rounded p-2 mt-1 mb-3"
            value={editForm.code}
            onChange={(e) => setEditForm((p) => ({ ...p, code: normalizeCode(e.target.value) }))}
          />

          <label htmlFor="cs-edit-name" className="text-sm font-medium">
            Subject Name
          </label>
          <input
            id="cs-edit-name"
            className="w-full border rounded p-2 mt-1 mb-3"
            value={editForm.name}
            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
          />

          <label htmlFor="cs-edit-year" className="text-sm font-medium">
            Year
          </label>
          <select
            id="cs-edit-year"
            className="w-full border rounded p-2 mt-1 mb-3"
            value={editForm.year}
            onChange={(e) => setEditForm((p) => ({ ...p, year: e.target.value }))}
          >
            <option value="">Select Year</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>

          <label htmlFor="cs-edit-sem" className="text-sm font-medium">
            Semester
          </label>
          <select
            id="cs-edit-sem"
            className="w-full border rounded p-2 mt-1 mb-4"
            value={editForm.semester}
            onChange={(e) => setEditForm((p) => ({ ...p, semester: e.target.value }))}
          >
            <option value="">Select Semester</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </select>

          <div className="flex justify-end gap-2">
            <button
              id="cs-edit-cancel"
              onClick={() => setEditOpen(false)}
              className="px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              id="cs-edit-save"
              onClick={saveEdit}
              disabled={saving}
              className={`px-4 py-2 rounded-lg text-white ${
                saving ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </ModalShell>
      )}

      {/* Delete Modal */}
      {deleteOpen && (
        <ModalShell id="cs-delete-modal" title="Delete Subject" onClose={() => setDeleteOpen(false)}>
          <p className="text-sm text-gray-700 mb-4">
            Are you sure you want to delete <b>{selected?.code}</b>?
          </p>

          <div className="flex justify-end gap-2">
            <button
              id="cs-del-cancel"
              onClick={() => setDeleteOpen(false)}
              className="px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              id="cs-del-confirm"
              onClick={confirmDelete}
              disabled={deleting}
              className={`px-4 py-2 rounded-lg text-white ${
                deleting ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </ModalShell>
      )}

      {/* Anim */}
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
