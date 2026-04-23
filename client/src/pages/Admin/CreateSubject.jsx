import { useEffect, useMemo, useState } from "react";

const API_BASE = `http://${window.location.hostname}:8000`;

export default function CreateSubject() {
  const token = useMemo(() => localStorage.getItem("token"), []);

  const [toast, setToast] = useState(null);
  const showToast = (type, message) => {
    setToast({ type, message });
    window.clearTimeout(window.__toastTimer);
    window.__toastTimer = window.setTimeout(() => setToast(null), 3000);
  };

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
    return {
      ok: Object.keys(e).length === 0,
      firstKey,
      firstMsg: firstKey ? e[firstKey] : null,
    };
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
      fetchSubjects();
    } catch (e) {
      showToast("error", "Server not reachable");
    } finally {
      setCreating(false);
    }
  };

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    const t = setTimeout(() => fetchSubjects(), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

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
    if (!editForm.code.trim()) {
      showToast("error", "Please fill the Subject Code");
      return false;
    }
    if (editForm.code.trim().length < 3) {
      showToast("error", "Code must be at least 3 characters");
      return false;
    }

    if (!editForm.name.trim()) {
      showToast("error", "Please fill the Subject Name");
      return false;
    }
    if (editForm.name.trim().length < 3) {
      showToast("error", "Name must be at least 3 characters");
      return false;
    }

    const y = Number(editForm.year);
    if (!editForm.year) {
      showToast("error", "Please select the Year");
      return false;
    }
    if (![1, 2, 3, 4].includes(y)) {
      showToast("error", "Year must be 1 to 4");
      return false;
    }

    const s = Number(editForm.semester);
    if (!editForm.semester) {
      showToast("error", "Please select the Semester");
      return false;
    }
    if (![1, 2].includes(s)) {
      showToast("error", "Semester must be 1 or 2");
      return false;
    }

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
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 min-w-[260px] max-w-sm px-5 py-4 rounded-2xl shadow-2xl border text-sm font-semibold text-white backdrop-blur-md animate-slide-in ${
            toast.type === "success"
              ? "bg-emerald-500/90 border-emerald-300/30"
              : "bg-rose-500/90 border-rose-300/30"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="rounded-[28px] border border-white/30 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-2xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-blue-600 dark:text-blue-400">
                  Subject Management
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Subjects
                </h1>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
                <InfoStat
                  label="Total"
                  value={subjects.length}
                  chipClass="bg-blue-600 text-white shadow-blue-600/25"
                />
                <InfoStat
                  label="Year"
                  value={fYear === "all" ? "All" : fYear}
                  chipClass="bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700"
                />
                <InfoStat
                  label="Sem"
                  value={fSem === "all" ? "All" : fSem}
                  chipClass="bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <section className="xl:col-span-2 rounded-[28px] border border-white/30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl p-6 md:p-7 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                    New Subject
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                    Create Subject
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setForm({ code: "", name: "", year: "", semester: "" });
                    setErrors({});
                    showToast("success", "Form cleared");
                  }}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-4 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                 id="createsubject-button-1">
                  Clear
                </button>
              </div>

              <div className="mt-6 space-y-5">
                <InputBlock
                  label="Subject Code"
                  placeholder="Ex: IT3040"
                  value={form.code}
                  onChange={(e) => handleChange("code", normalizeCode(e.target.value))}
                  error={errors.code}
                  id="createsubject-code-input"
                />

                <InputBlock
                  label="Subject Name"
                  placeholder="Enter subject name"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  error={errors.name}
                  id="createsubject-name-input"
                />

                <SelectBlock
                  label="Year"
                  value={form.year}
                  onChange={(e) => handleChange("year", e.target.value)}
                  error={errors.year}
                  id="createsubject-year-select"
                >
                  <option value="">Select Year</option>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                </SelectBlock>

                <SelectBlock
                  label="Semester"
                  value={form.semester}
                  onChange={(e) => handleChange("semester", e.target.value)}
                  error={errors.semester}
                  id="createsubject-sem-select"
                >
                  <option value="">Select Semester</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </SelectBlock>

                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className={`w-full rounded-2xl py-3.5 font-extrabold text-white shadow-xl transition-all duration-300 active:scale-[0.98] ${
                    creating
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:-translate-y-1 hover:shadow-blue-500/30"
                  }`}
                 id="createsubject-button-2">
                  {creating ? "Creating..." : "Create Subject"}
                </button>
              </div>
            </section>

            <section className="xl:col-span-3 rounded-[28px] border border-white/30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl p-6 md:p-7 transition-all duration-300 hover:-translate-y-1">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400">
                    Subject List
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                    Manage Subjects
                  </h2>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                        />
                      </svg>
                    </span>
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search"
                      className="w-full sm:w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 pl-11 pr-4 py-2.5 text-sm text-slate-800 dark:text-white outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-medium"
                     id="createsubject-input-1"/>
                  </div>

                  <button
                    onClick={fetchSubjects}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-4 py-2.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                   id="createsubject-button-3">
                    Refresh
                  </button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <select
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-100 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  value={fYear}
                  onChange={(e) => setFYear(e.target.value)}
                 id="createsubject-select-1">
                  <option value="all">All Years</option>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                </select>

                <select
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-100 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  value={fSem}
                  onChange={(e) => setFSem(e.target.value)}
                 id="createsubject-select-2">
                  <option value="all">All Semesters</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </select>
              </div>

              <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200/70 dark:border-slate-700/60 bg-white/70 dark:bg-slate-950/50 shadow-inner">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200">
                      <tr>
                        <th className="text-left px-5 py-3 font-bold uppercase text-[9px] tracking-[0.15em]">
                          ID
                        </th>
                        <th className="text-left px-5 py-3 font-bold uppercase text-[9px] tracking-[0.15em]">
                          Code
                        </th>
                        <th className="text-left px-5 py-3 font-bold uppercase text-[9px] tracking-[0.15em]">
                          Name
                        </th>
                        <th className="text-left px-5 py-3 font-bold uppercase text-[9px] tracking-[0.15em]">
                          Year
                        </th>
                        <th className="text-left px-5 py-3 font-bold uppercase text-[9px] tracking-[0.15em]">
                          Semester
                        </th>
                        <th className="text-left px-5 py-3 font-bold uppercase text-[9px] tracking-[0.15em]">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-5 py-10 text-center font-medium text-slate-500 dark:text-slate-400"
                          >
                            Loading subjects...
                          </td>
                        </tr>
                      ) : subjects.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-5 py-10 text-center font-medium text-slate-500 dark:text-slate-400"
                          >
                            No subjects found
                          </td>
                        </tr>
                      ) : (
                        subjects.map((s, index) => (
                          <tr
                            key={s.id}
                            className={`border-t border-slate-200/70 dark:border-slate-800 transition-all duration-200 hover:bg-blue-50/60 dark:hover:bg-slate-800/60 ${
                              index % 2 === 0 ? "bg-white/40 dark:bg-slate-900/20" : ""
                            }`}
                          >
                            <td className="px-5 py-3 font-bold text-slate-700 dark:text-slate-200 text-[12px]">
                              {s.id}
                            </td>
                            <td className="px-5 py-3">
                              <span className="inline-flex rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2.5 py-1 text-[10px] font-bold tracking-wider">
                                {s.code}
                              </span>
                            </td>
                            <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100 text-[13px]">
                              {s.name}
                            </td>
                            <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-[13px]">{s.year}</td>
                            <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-[13px]">
                              {s.semester}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openEdit(s)}
                                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 font-bold text-[10px] text-slate-700 dark:text-slate-200 uppercase tracking-wider transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                                 id={`createsubject-button-edit-${s.id}`}>
                                  Edit
                                </button>
                                <button
                                  onClick={() => openDelete(s)}
                                  className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5 font-bold text-[10px] text-rose-600 dark:text-rose-300 uppercase tracking-wider transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                                 id={`createsubject-button-delete-${s.id}`}>
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
              </div>
            </section>
          </div>
        </div>
      </div>

      {editOpen && (
        <ModalShell title="Edit Subject" onClose={() => setEditOpen(false)}>
          <InputBlock
            label="Subject Code"
            value={editForm.code}
            onChange={(e) => setEditForm((p) => ({ ...p, code: normalizeCode(e.target.value) }))}
          />

          <InputBlock
            label="Subject Name"
            value={editForm.name}
            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
          />

          <SelectBlock
            label="Year"
            value={editForm.year}
            onChange={(e) => setEditForm((p) => ({ ...p, year: e.target.value }))}
          >
            <option value="">Select Year</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </SelectBlock>

          <SelectBlock
            label="Semester"
            value={editForm.semester}
            onChange={(e) => setEditForm((p) => ({ ...p, semester: e.target.value }))}
          >
            <option value="">Select Semester</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </SelectBlock>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setEditOpen(false)}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3 font-bold text-slate-700 dark:text-slate-200 transition-all duration-300 hover:-translate-y-0.5"
             id="createsubject-button-6">
              Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={saving}
              className={`rounded-2xl px-5 py-3 font-extrabold text-white shadow-lg transition-all duration-300 ${
                saving
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:-translate-y-0.5"
              }`}
             id="createsubject-button-7">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </ModalShell>
      )}

      {deleteOpen && (
        <ModalShell title="Delete Subject" onClose={() => setDeleteOpen(false)}>
          <div className="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20 p-4">
            <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">
              Are you sure you want to delete{" "}
              <span className="font-extrabold text-rose-600 dark:text-rose-300">
                {selected?.code}
              </span>
              ?
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setDeleteOpen(false)}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3 font-bold text-slate-700 dark:text-slate-200 transition-all duration-300 hover:-translate-y-0.5"
             id="createsubject-button-8">
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className={`rounded-2xl px-5 py-3 font-extrabold text-white shadow-lg transition-all duration-300 ${
                deleting
                  ? "bg-rose-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-rose-500 to-red-600 hover:-translate-y-0.5"
              }`}
             id="createsubject-button-9">
              {deleting ? "Deleting..." : "Delete Subject"}
            </button>
          </div>
        </ModalShell>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(24px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in {
          animation: slideInRight 0.28s ease-out;
        }
      `}</style>
    </>
  );
}

function InfoStat({ label, value, chipClass }) {
  return (
    <div className={`rounded-xl px-4 py-2 shadow-sm ${chipClass}`}>
      <p className="text-[10px] uppercase tracking-[0.15em] font-extrabold opacity-80">{label}</p>
      <p className="text-lg font-black mt-0.5">{value}</p>
    </div>
  );
}

function InputBlock({ label, error, id, ...props }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 ml-1">
        {label}
      </label>
      <input
        {...props}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-white outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5"
       id={id}/>
      {error && <p className="mt-1.5 text-[10px] font-bold uppercase tracking-tight text-rose-500 ml-1">{error}</p>}
    </div>
  );
}

function SelectBlock({ label, error, id, children, ...props }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 ml-1">
        {label}
      </label>
      <select
        {...props}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-white outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5"
       id={id}>
        {children}
      </select>
      {error && <p className="mt-1.5 text-[10px] font-bold uppercase tracking-tight text-rose-500 ml-1">{error}</p>}
    </div>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-[28px] border border-white/20 bg-white/85 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl p-6 md:p-7">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400 font-extrabold">
              Action
            </p>
            <h3 className="mt-0.5 text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>

          <button
            onClick={onClose}
            className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-base transition-all duration-300 hover:rotate-90 hover:shadow-md flex items-center justify-center font-bold"
           id="createsubject-button-10">
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}