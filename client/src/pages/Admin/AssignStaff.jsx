import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:5000"; // change if needed

export default function AssignStaffSubject() {
  const token = useMemo(() => localStorage.getItem("token"), []);

  // ---------- Toast ----------
  const [toast, setToast] = useState(null);
  const showToast = (type, message) => {
    setToast({ type, message });
    window.clearTimeout(window.__toastTimer);
    window.__toastTimer = window.setTimeout(() => setToast(null), 3000);
  };

  // ---------- Data ----------
  const [staffs, setStaffs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingSub, setLoadingSub] = useState(false);

  // subject filters (left)
  const [subYear, setSubYear] = useState("all");
  const [subSem, setSubSem] = useState("all");
  const [subSearch, setSubSearch] = useState("");

  // selected subject (left)
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  // staff multi select (left)
  const [staffSearch, setStaffSearch] = useState("");
  const [selectedStaffIds, setSelectedStaffIds] = useState([]); // multi
  const [assigning, setAssigning] = useState(false);

  // ---------- Assigned staff list (subject wise) ----------
  const [assignedStaff, setAssignedStaff] = useState([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);

  // remove (subject wise) modal
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  // ---------- All assignments table (right) ----------
  const [allAssignments, setAllAssignments] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [fltSubject, setFltSubject] = useState(""); // subject code/name
  const [fltStaffName, setFltStaffName] = useState(""); // staff name/email

  // edit assignment modal
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState({ subject_id: "", staff_id: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  // ---------- Helpers ----------
  const subjectLabel = (x) =>
    `${x?.code || ""} — ${x?.name || ""} (Y${x?.year || "-"} S${x?.semester || "-"})`;

  const isSelected = (id) => selectedStaffIds.includes(id);

  const toggleStaff = (id) => {
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clearSelectedStaff = () => setSelectedStaffIds([]);

  // ---------- Fetch Staffs ----------
  const fetchStaffs = async () => {
    if (!token) return showToast("error", "Session expired. Please login again.");

    try {
      setLoadingStaff(true);

      const params = new URLSearchParams();
      params.set("role", "staff");
      if (staffSearch.trim()) params.set("search", staffSearch.trim());

      const res = await fetch(`${API_BASE}/api/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data?.message || "Failed to load staff list");
        setStaffs([]);
        return;
      }

      const list = Array.isArray(data?.data) ? data.data : [];
      setStaffs(list);
    } catch (e) {
      showToast("error", "Server not reachable");
    } finally {
      setLoadingStaff(false);
    }
  };

  // staff search debounce
  useEffect(() => {
    const t = setTimeout(() => fetchStaffs(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffSearch]);

  // ---------- Fetch Subjects ----------
  const fetchSubjects = async () => {
    if (!token) return showToast("error", "Session expired. Please login again.");

    try {
      setLoadingSub(true);

      const params = new URLSearchParams();
      if (subYear !== "all") params.set("year", subYear);
      if (subSem !== "all") params.set("semester", subSem);
      if (subSearch.trim()) params.set("search", subSearch.trim());

      const res = await fetch(`${API_BASE}/api/admin/subjects?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data?.message || "Failed to load subjects");
        setSubjects([]);
        return;
      }

      const list = Array.isArray(data?.data) ? data.data : [];
      setSubjects(list);
    } catch (e) {
      showToast("error", "Server not reachable");
    } finally {
      setLoadingSub(false);
    }
  };

  // subject filter debounce
  useEffect(() => {
    const t = setTimeout(() => fetchSubjects(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subYear, subSem, subSearch]);

  // ---------- Fetch Assigned Staff (subject wise) ----------
  const fetchAssignedStaff = async () => {
    if (!token) return showToast("error", "Session expired. Please login again.");
    if (!selectedSubjectId) {
      setAssignedStaff([]);
      return;
    }

    try {
      setLoadingAssigned(true);

      const res = await fetch(`${API_BASE}/api/admin/subjects/${selectedSubjectId}/staffs`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data?.message || "Failed to load assigned staff");
        setAssignedStaff([]);
        return;
      }

      const list = Array.isArray(data?.data) ? data.data : [];
      setAssignedStaff(list);
    } catch (e) {
      showToast("error", "Server not reachable");
    } finally {
      setLoadingAssigned(false);
    }
  };

  // subject change → load assigned staff + reset selection
  useEffect(() => {
    fetchAssignedStaff();
    clearSelectedStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubjectId]);

  // ---------- Assign Multiple Staff ----------
  const handleAssign = async () => {
    if (!selectedSubjectId) return showToast("error", "Please select a Subject");
    if (selectedStaffIds.length === 0)
      return showToast("error", "Please select at least one Staff");
    if (!token) return showToast("error", "Session expired. Please login again.");

    try {
      setAssigning(true);

      const res = await fetch(`${API_BASE}/api/admin/subjects/${selectedSubjectId}/staffs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          staff_ids: selectedStaffIds.map(Number),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data?.message || "Assignment failed");
        return;
      }

      showToast("success", data?.message || "Staff assigned successfully");
      clearSelectedStaff();
      fetchAssignedStaff();
      fetchAllAssignments();
    } catch (e) {
      showToast("error", "Server not reachable");
    } finally {
      setAssigning(false);
    }
  };

  // ---------- Remove Staff from Selected Subject ----------
  const openRemove = (staff) => {
    setRemoveTarget(staff);
    setRemoveOpen(true);
  };

  const confirmRemove = async () => {
    if (!removeTarget?.id || !selectedSubjectId) return;
    if (!token) return showToast("error", "Session expired. Please login again.");

    try {
      setRemoving(true);

      const res = await fetch(
        `${API_BASE}/api/admin/subjects/${selectedSubjectId}/staffs/${removeTarget.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data?.message || "Remove failed");
        return;
      }

      showToast("success", data?.message || "Removed successfully");
      setRemoveOpen(false);
      setRemoveTarget(null);
      fetchAssignedStaff();
      fetchAllAssignments();
    } catch (e) {
      showToast("error", "Server not reachable");
    } finally {
      setRemoving(false);
    }
  };

  // ---------- Fetch ALL Assignments (right table) ----------
  const fetchAllAssignments = async () => {
    if (!token) return showToast("error", "Session expired. Please login again.");

    try {
      setLoadingAll(true);

      const params = new URLSearchParams();
      if (fltSubject.trim()) params.set("subject", fltSubject.trim());
      if (fltStaffName.trim()) params.set("staff", fltStaffName.trim());

      const res = await fetch(
        `${API_BASE}/api/admin/staff-subjects?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data?.message || "Failed to load assignments");
        setAllAssignments([]);
        return;
      }

      const list = Array.isArray(data?.data) ? data.data : [];
      setAllAssignments(list);
    } catch (e) {
      showToast("error", "Server not reachable");
    } finally {
      setLoadingAll(false);
    }
  };

  // debounce filters (right)
  useEffect(() => {
    const t = setTimeout(() => fetchAllAssignments(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fltSubject, fltStaffName]);

  // init load
  useEffect(() => {
    fetchStaffs();
    fetchSubjects();
    fetchAllAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Edit Assignment ----------
  const openEdit = (row) => {
    setEditRow(row);
    setEditForm({
      subject_id: String(row.subject_id),
      staff_id: String(row.staff_id),
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editRow?.id) return;

    if (!editForm.subject_id) return showToast("error", "Please select Subject");
    if (!editForm.staff_id) return showToast("error", "Please select Staff");

    if (!token) return showToast("error", "Session expired. Please login again.");

    try {
      setSavingEdit(true);

      const res = await fetch(`${API_BASE}/api/admin/staff-subjects/${editRow.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject_id: Number(editForm.subject_id),
          staff_id: Number(editForm.staff_id),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data?.message || "Update failed");
        return;
      }

      showToast("success", data?.message || "Assignment updated");
      setEditOpen(false);
      setEditRow(null);
      fetchAssignedStaff();
      fetchAllAssignments();
    } catch (e) {
      showToast("error", "Server not reachable");
    } finally {
      setSavingEdit(false);
    }
  };

  // ---------- Delete Assignment (row wise) ----------
  const deleteAssignmentRow = async (row) => {
    if (!row?.id) return;
    if (!token) return showToast("error", "Session expired. Please login again.");

    try {
      const res = await fetch(`${API_BASE}/api/admin/staff-subjects/${row.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data?.message || "Delete failed");
        return;
      }

      showToast("success", data?.message || "Deleted successfully");
      fetchAssignedStaff();
      fetchAllAssignments();
    } catch (e) {
      showToast("error", "Server not reachable");
    }
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          id="as-toast"
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-xl text-sm text-white
          transform transition-all duration-300 animate-slide-in
          ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
        >
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: Assign Form */}
        <section
          id="as-form-card"
          className="bg-white rounded-xl shadow-sm border p-6 lg:col-span-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 id="as-title" className="text-lg font-semibold">
                Assign Staff → Subject (One Subject → Many Staff)
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Select a subject, then choose multiple staff and assign.
              </p>
            </div>

            <button
              id="as-clear-btn"
              type="button"
              onClick={() => {
                setSelectedSubjectId("");
                clearSelectedStaff();
                setStaffSearch("");
                showToast("success", "Cleared");
              }}
              className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
          </div>

          {/* Subject filters */}
          <div id="as-sub-filters" className="mt-4 grid grid-cols-2 gap-2">
            <select
              id="as-sub-year"
              className="border rounded-lg p-2 text-sm"
              value={subYear}
              onChange={(e) => setSubYear(e.target.value)}
            >
              <option value="all">All Years</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>

            <select
              id="as-sub-sem"
              className="border rounded-lg p-2 text-sm"
              value={subSem}
              onChange={(e) => setSubSem(e.target.value)}
            >
              <option value="all">All Sem</option>
              <option value="1">Sem 1</option>
              <option value="2">Sem 2</option>
            </select>
          </div>

          <div className="mt-2">
            <input
              id="as-sub-search"
              value={subSearch}
              onChange={(e) => setSubSearch(e.target.value)}
              placeholder="Search subject code/name..."
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Subject dropdown */}
          <div className="mt-3">
            <label htmlFor="as-subject-select" className="text-sm font-medium">
              Subject
            </label>
            <select
              id="as-subject-select"
              className="w-full border rounded-lg p-2 mt-1"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={loadingSub}
            >
              <option value="">{loadingSub ? "Loading subjects..." : "Select Subject"}</option>
              {subjects.map((x) => (
                <option key={x.id} value={x.id}>
                  {subjectLabel(x)}
                </option>
              ))}
            </select>
          </div>

          {/* Staff Search */}
          <div className="mt-4">
            <label htmlFor="as-staff-search" className="text-sm font-medium">
              Search Staff
            </label>
            <input
              id="as-staff-search"
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
              placeholder="Search staff name/email..."
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
            />
          </div>

          {/* Staff multi list */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Select Staff (Multi)</label>
              <button
                id="as-clear-staff"
                type="button"
                onClick={clearSelectedStaff}
                className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-50"
              >
                Clear Selected
              </button>
            </div>

            <div
              id="as-staff-multi"
              className="border rounded-xl p-2 max-h-56 overflow-auto"
            >
              {loadingStaff ? (
                <div className="text-sm text-gray-500 p-2">Loading staff...</div>
              ) : staffs.length === 0 ? (
                <div className="text-sm text-gray-500 p-2">No staff found.</div>
              ) : (
                staffs.map((s) => (
                  <button
                    key={s.id}
                    id={`as-staff-item-${s.id}`}
                    type="button"
                    onClick={() => toggleStaff(s.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg border mb-2 last:mb-0 transition
                      ${
                        isSelected(s.id)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    <div className="font-medium">{s.name}</div>
                    <div className={`text-xs ${isSelected(s.id) ? "text-blue-100" : "text-gray-500"}`}>
                      {s.email}
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="mt-2 text-xs text-gray-600">
              Selected: <b>{selectedStaffIds.length}</b>
            </div>
          </div>

          {/* Assign Button */}
          <button
            id="as-assign-btn"
            onClick={handleAssign}
            disabled={assigning}
            className={`mt-5 w-full py-2.5 rounded-lg transition text-white font-medium
              ${assigning ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {assigning ? "Assigning..." : "Assign Selected Staff"}
          </button>

          {/* Subject-wise assigned staff quick view */}
          <div className="mt-6 border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
              <div className="text-sm font-semibold">Assigned Staff (Selected Subject)</div>
              <button
                id="as-mini-refresh"
                onClick={fetchAssignedStaff}
                className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-50"
                disabled={!selectedSubjectId}
              >
                Refresh
              </button>
            </div>

            <div className="p-3">
              {!selectedSubjectId ? (
                <div className="text-sm text-gray-500">Select a subject to view assigned staff.</div>
              ) : loadingAssigned ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : assignedStaff.length === 0 ? (
                <div className="text-sm text-gray-500">No staff assigned for this subject.</div>
              ) : (
                <div className="space-y-2">
                  {assignedStaff.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between gap-2 border rounded-lg p-2"
                    >
                      <div>
                        <div className="text-sm font-medium">{st.name}</div>
                        <div className="text-xs text-gray-500">{st.email}</div>
                      </div>
                      <button
                        id={`as-mini-remove-${st.id}`}
                        onClick={() => openRemove(st)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* RIGHT: All Subject-Staff Assignments */}
        <section
          id="as-all-table-card"
          className="bg-white rounded-xl shadow-sm border p-6 lg:col-span-3"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 id="as-all-title" className="text-lg font-semibold">
                Subject ↔ Staff Assignments (All)
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Filter by subject code/name & staff name/email. Edit/Delete available.
              </p>
            </div>

            <button
              id="as-all-refresh"
              onClick={fetchAllAssignments}
              className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              id="as-filter-subject"
              value={fltSubject}
              onChange={(e) => setFltSubject(e.target.value)}
              placeholder="Filter Subject (code/name)..."
              className="border rounded-lg px-3 py-2 text-sm"
            />
            <input
              id="as-filter-staff"
              value={fltStaffName}
              onChange={(e) => setFltStaffName(e.target.value)}
              placeholder="Filter Staff (name/email)..."
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Table */}
          <div className="mt-5 border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="text-left p-3 w-16">ID</th>
                  <th className="text-left p-3">Subject</th>
                  <th className="text-left p-3">Staff</th>
                  <th className="text-left p-3 w-40">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loadingAll ? (
                  <tr>
                    <td className="p-4 text-gray-500" colSpan={4}>
                      Loading assignments...
                    </td>
                  </tr>
                ) : allAssignments.length === 0 ? (
                  <tr>
                    <td className="p-4 text-gray-500" colSpan={4}>
                      No assignments found.
                    </td>
                  </tr>
                ) : (
                  allAssignments.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-3">{r.id}</td>

                      <td className="p-3">
                        <div className="font-semibold">{r.subject_code || "-"}</div>
                        <div className="text-xs text-gray-600">
                          {r.subject_name || ""} • Y{r.year ?? "-"} S{r.semester ?? "-"}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-medium">{r.staff_name || "-"}</div>
                        <div className="text-xs text-gray-500">{r.staff_email || ""}</div>
                      </td>

                      <td className="p-3 flex gap-2">
                        <button
                          id={`as-edit-${r.id}`}
                          onClick={() => openEdit(r)}
                          className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          id={`as-del-${r.id}`}
                          onClick={() => deleteAssignmentRow(r)}
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

      {/* Remove Modal (subject wise) */}
      {removeOpen && (
        <ModalShell id="as-remove-modal" title="Remove Staff" onClose={() => setRemoveOpen(false)}>
          <p className="text-sm text-gray-700 mb-4">
            Remove <b>{removeTarget?.name}</b> from selected subject?
          </p>

          <div className="flex justify-end gap-2">
            <button
              id="as-remove-cancel"
              onClick={() => setRemoveOpen(false)}
              className="px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              id="as-remove-confirm"
              onClick={confirmRemove}
              disabled={removing}
              className={`px-4 py-2 rounded-lg text-white ${
                removing ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {removing ? "Removing..." : "Remove"}
            </button>
          </div>
        </ModalShell>
      )}

      {/* Edit Modal (row wise) */}
      {editOpen && (
        <ModalShell id="as-edit-modal" title="Edit Assignment" onClose={() => setEditOpen(false)}>
          <label htmlFor="as-edit-subject" className="text-sm font-medium">
            Subject
          </label>
          <select
            id="as-edit-subject"
            className="w-full border rounded p-2 mt-1 mb-3"
            value={editForm.subject_id}
            onChange={(e) => setEditForm((p) => ({ ...p, subject_id: e.target.value }))}
          >
            <option value="">Select Subject</option>
            {subjects.map((x) => (
              <option key={x.id} value={x.id}>
                {subjectLabel(x)}
              </option>
            ))}
          </select>

          <label htmlFor="as-edit-staff" className="text-sm font-medium">
            Staff
          </label>
          <select
            id="as-edit-staff"
            className="w-full border rounded p-2 mt-1 mb-4"
            value={editForm.staff_id}
            onChange={(e) => setEditForm((p) => ({ ...p, staff_id: e.target.value }))}
          >
            <option value="">Select Staff</option>
            {staffs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.email}
              </option>
            ))}
          </select>

          <div className="flex justify-end gap-2">
            <button
              id="as-edit-cancel"
              onClick={() => setEditOpen(false)}
              className="px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              id="as-edit-save"
              onClick={saveEdit}
              disabled={savingEdit}
              className={`px-4 py-2 rounded-lg text-white ${
                savingEdit ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {savingEdit ? "Saving..." : "Save"}
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
