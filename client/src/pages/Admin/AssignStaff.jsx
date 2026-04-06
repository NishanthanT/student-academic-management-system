import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:8000";

export default function AssignStaffSubject() {
  const token = useMemo(() => localStorage.getItem("token"), []);

  const [toast, setToast] = useState(null);
  const showToast = (type, message) => {
    setToast({ type, message });
    window.clearTimeout(window.__toastTimer);
    window.__toastTimer = window.setTimeout(() => setToast(null), 3000);
  };

  const [staffs, setStaffs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingSub, setLoadingSub] = useState(false);

  const [subYear, setSubYear] = useState("all");
  const [subSem, setSubSem] = useState("all");
  const [subSearch, setSubSearch] = useState("");

  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const [staffSearch, setStaffSearch] = useState("");
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [assigning, setAssigning] = useState(false);

  const [assignedStaff, setAssignedStaff] = useState([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);

  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  const [allAssignments, setAllAssignments] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [fltSubject, setFltSubject] = useState("");
  const [fltStaffName, setFltStaffName] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState({ subject_id: "", staff_id: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  const subjectLabel = (x) =>
    `${x?.code || ""} — ${x?.name || ""} (Y${x?.year || "-"} S${x?.semester || "-"})`;

  const isSelected = (id) => selectedStaffIds.includes(id);

  const toggleStaff = (id) => {
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clearSelectedStaff = () => setSelectedStaffIds([]);

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

  useEffect(() => {
    const t = setTimeout(() => fetchStaffs(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffSearch]);

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

  useEffect(() => {
    const t = setTimeout(() => fetchSubjects(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subYear, subSem, subSearch]);

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

  useEffect(() => {
    fetchAssignedStaff();
    clearSelectedStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubjectId]);

  const handleAssign = async () => {
    if (!selectedSubjectId) return showToast("error", "Please select Subject");
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

  const fetchAllAssignments = async () => {
    if (!token) return showToast("error", "Session expired. Please login again.");

    try {
      setLoadingAll(true);

      const params = new URLSearchParams();
      if (fltSubject.trim()) params.set("subject", fltSubject.trim());
      if (fltStaffName.trim()) params.set("staff", fltStaffName.trim());

      const res = await fetch(`${API_BASE}/api/admin/staff-subjects?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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

  useEffect(() => {
    const t = setTimeout(() => fetchAllAssignments(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fltSubject, fltStaffName]);

  useEffect(() => {
    fetchStaffs();
    fetchSubjects();
    fetchAllAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                <p className="text-xs uppercase tracking-[0.24em] font-extrabold text-blue-600 dark:text-blue-400">
                  Staff Subject Management
                </p>
                <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                  Assignments
                </h1>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <AnimatedInfoStat
                  label="Subjects"
                  value={subjects.length}
                  variant="blue"
                />
                <AnimatedInfoStat
                  label="Staff"
                  value={staffs.length}
                  variant="violet"
                />
                <AnimatedInfoStat
                  label="Assigned"
                  value={allAssignments.length}
                  variant="cyan"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <section className="lg:col-span-2 rounded-[28px] border border-white/30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl p-6 md:p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-blue-500/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-400">
                    Assignment Panel
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                    Assign Staff
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubjectId("");
                    clearSelectedStaff();
                    setStaffSearch("");
                    showToast("success", "Cleared");
                  }}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md"
                >
                  Clear
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <FilterSelect value={subYear} onChange={(e) => setSubYear(e.target.value)}>
                  <option value="all">All Years</option>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                </FilterSelect>

                <FilterSelect value={subSem} onChange={(e) => setSubSem(e.target.value)}>
                  <option value="all">All Semesters</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </FilterSelect>
              </div>

              <div className="mt-3">
                <InputBlock
                  placeholder="Search Subject"
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                />
              </div>

              <div className="mt-4">
                <LabelText>Subject</LabelText>
                <select
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 p-3 mt-2 text-sm text-slate-800 dark:text-white outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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

              <div className="mt-4">
                <LabelText>Search Staff</LabelText>
                <InputBlock
                  placeholder="Search Staff"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                />
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <LabelText>Select Staff</LabelText>
                  <button
                    type="button"
                    onClick={clearSelectedStaff}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 dark:hover:border-blue-500"
                  >
                    Clear Selected
                  </button>
                </div>

                <div className="rounded-[22px] border border-slate-200/80 dark:border-slate-700/70 bg-white/50 dark:bg-slate-950/30 p-3 max-h-64 overflow-auto shadow-inner">
                  {loadingStaff ? (
                    <div className="text-sm text-slate-500 dark:text-slate-400 p-2">Loading staff...</div>
                  ) : staffs.length === 0 ? (
                    <div className="text-sm text-slate-500 dark:text-slate-400 p-2">No staff found</div>
                  ) : (
                    staffs.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleStaff(s.id)}
                        className={`w-full text-left px-4 py-3 rounded-2xl border mb-2 last:mb-0 transition-all duration-300 hover:-translate-y-0.5 ${
                          isSelected(s.id)
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-lg shadow-blue-500/20"
                            : "bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md"
                        }`}
                      >
                        <div className="font-bold text-sm">{s.name}</div>
                        <div
                          className={`text-xs mt-1 ${
                            isSelected(s.id) ? "text-blue-100" : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {s.email}
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Selected: {selectedStaffIds.length}
                </div>
              </div>

              <button
                onClick={handleAssign}
                disabled={assigning}
                className={`mt-5 w-full rounded-2xl py-3.5 font-extrabold text-white shadow-xl transition-all duration-300 active:scale-[0.98] ${
                  assigning
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:-translate-y-1 hover:shadow-blue-500/30"
                }`}
              >
                {assigning ? "Assigning..." : "Assign Staff"}
              </button>

              <div className="mt-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700/70 overflow-hidden bg-white/60 dark:bg-slate-950/30 shadow-inner">
                <div className="px-4 py-3 bg-slate-100/70 dark:bg-slate-800/70 flex items-center justify-between">
                  <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    Assigned Staff
                  </div>
                  <button
                    onClick={fetchAssignedStaff}
                    disabled={!selectedSubjectId}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 dark:hover:border-blue-500 disabled:opacity-50"
                  >
                    Refresh
                  </button>
                </div>

                <div className="p-3">
                  {!selectedSubjectId ? (
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Select a subject
                    </div>
                  ) : loadingAssigned ? (
                    <div className="text-sm text-slate-500 dark:text-slate-400">Loading...</div>
                  ) : assignedStaff.length === 0 ? (
                    <div className="text-sm text-slate-500 dark:text-slate-400">No assigned staff</div>
                  ) : (
                    <div className="space-y-2">
                      {assignedStaff.map((st) => (
                        <div
                          key={st.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md"
                        >
                          <div>
                            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {st.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {st.email}
                            </div>
                          </div>
                          <button
                            onClick={() => openRemove(st)}
                            className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-300 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
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

            <section className="lg:col-span-3 rounded-[28px] border border-white/30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl p-6 md:p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-blue-500/10">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-purple-600 dark:text-purple-400">
                    Assignment Table
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                    All Assignments
                  </h2>
                </div>

                <button
                  onClick={fetchAllAssignments}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md"
                >
                  Refresh
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                <InputWithIcon
                  placeholder="Filter Subject"
                  value={fltSubject}
                  onChange={(e) => setFltSubject(e.target.value)}
                />
                <InputWithIcon
                  placeholder="Filter Staff"
                  value={fltStaffName}
                  onChange={(e) => setFltStaffName(e.target.value)}
                />
              </div>

              <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200/70 dark:border-slate-700/60 bg-white/70 dark:bg-slate-950/50 shadow-inner">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200">
                      <tr>
                        <th className="text-left px-5 py-4 font-extrabold uppercase text-[11px] tracking-wide">
                          ID
                        </th>
                        <th className="text-left px-5 py-4 font-extrabold uppercase text-[11px] tracking-wide">
                          Subject
                        </th>
                        <th className="text-left px-5 py-4 font-extrabold uppercase text-[11px] tracking-wide">
                          Staff
                        </th>
                        <th className="text-left px-5 py-4 font-extrabold uppercase text-[11px] tracking-wide">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {loadingAll ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-10 text-center font-medium text-slate-500 dark:text-slate-400">
                            Loading assignments...
                          </td>
                        </tr>
                      ) : allAssignments.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-10 text-center font-medium text-slate-500 dark:text-slate-400">
                            No assignments found
                          </td>
                        </tr>
                      ) : (
                        allAssignments.map((r, index) => (
                          <tr
                            key={r.id}
                            className={`border-t border-slate-200/70 dark:border-slate-800 transition-all duration-200 hover:bg-blue-50/60 dark:hover:bg-slate-800/60 ${
                              index % 2 === 0 ? "bg-white/40 dark:bg-slate-900/20" : ""
                            }`}
                          >
                            <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-200">
                              {r.id}
                            </td>

                            <td className="px-5 py-4">
                              <div className="inline-flex rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-3 py-1 text-xs font-extrabold tracking-wide">
                                {r.subject_code || "-"}
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                                {r.subject_name || ""}
                              </div>
                              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Year {r.year ?? "-"} • Semester {r.semester ?? "-"}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                {r.staff_name || "-"}
                              </div>
                              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {r.staff_email || ""}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openEdit(r)}
                                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 font-bold text-slate-700 dark:text-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteAssignmentRow(r)}
                                  className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-4 py-2 font-bold text-rose-600 dark:text-rose-300 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
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
              </div>
            </section>
          </div>
        </div>
      </div>

      {removeOpen && (
        <ModalShell title="Remove Staff" onClose={() => setRemoveOpen(false)}>
          <div className="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20 p-4">
            <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">
              Remove{" "}
              <span className="font-extrabold text-rose-600 dark:text-rose-300">
                {removeTarget?.name}
              </span>
              ?
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setRemoveOpen(false)}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3 font-bold text-slate-700 dark:text-slate-200 transition-all duration-300 hover:-translate-y-0.5"
            >
              Cancel
            </button>
            <button
              onClick={confirmRemove}
              disabled={removing}
              className={`rounded-2xl px-5 py-3 font-extrabold text-white shadow-lg transition-all duration-300 ${
                removing
                  ? "bg-rose-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-rose-500 to-red-600 hover:-translate-y-0.5"
              }`}
            >
              {removing ? "Removing..." : "Remove"}
            </button>
          </div>
        </ModalShell>
      )}

      {editOpen && (
        <ModalShell title="Edit Assignment" onClose={() => setEditOpen(false)}>
          <LabelText>Subject</LabelText>
          <select
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 p-3 mt-2 mb-4 text-sm text-slate-800 dark:text-white outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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

          <LabelText>Staff</LabelText>
          <select
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 p-3 mt-2 mb-4 text-sm text-slate-800 dark:text-white outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setEditOpen(false)}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3 font-bold text-slate-700 dark:text-slate-200 transition-all duration-300 hover:-translate-y-0.5"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={savingEdit}
              className={`rounded-2xl px-5 py-3 font-extrabold text-white shadow-lg transition-all duration-300 ${
                savingEdit
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:-translate-y-0.5"
              }`}
            >
              {savingEdit ? "Saving..." : "Save Changes"}
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

        @keyframes statGradientMove {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes statBorderPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(59,130,246,0.12), 0 10px 30px rgba(15,23,42,0.10);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(59,130,246,0.08), 0 16px 36px rgba(59,130,246,0.16);
          }
        }

        @keyframes statShine {
          0% {
            transform: translateX(-140%) skewX(-20deg);
            opacity: 0;
          }
          25% {
            opacity: 0.55;
          }
          60% {
            opacity: 0.15;
          }
          100% {
            transform: translateX(220%) skewX(-20deg);
            opacity: 0;
          }
        }

        @keyframes statFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-2px);
          }
        }

        @keyframes numberPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .animate-slide-in {
          animation: slideInRight 0.28s ease-out;
        }

        .stat-animated {
          background-size: 220% 220%;
          animation:
            statGradientMove 8s ease infinite,
            statBorderPulse 3.2s ease-in-out infinite,
            statFloat 4.2s ease-in-out infinite;
        }

        .stat-animated::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            110deg,
            transparent 10%,
            rgba(255,255,255,0.10) 30%,
            rgba(255,255,255,0.35) 48%,
            rgba(255,255,255,0.08) 62%,
            transparent 80%
          );
          transform: translateX(-140%) skewX(-20deg);
          animation: statShine 5.2s linear infinite;
          pointer-events: none;
        }

        .stat-number-pop {
          animation: numberPulse 2.8s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}

function AnimatedInfoStat({ label, value, variant = "blue" }) {
  const variants = {
    blue: {
      bg: "bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600",
      ring: "from-blue-400/40 via-white/10 to-indigo-300/30",
      border: "border-blue-300/20",
      text: "text-white",
      sub: "text-blue-100/85",
      dot: "bg-white/90",
    },
    violet: {
      bg: "bg-gradient-to-br from-slate-800 via-slate-700 to-violet-700",
      ring: "from-violet-300/30 via-white/10 to-slate-300/20",
      border: "border-violet-300/20",
      text: "text-white",
      sub: "text-slate-200/80",
      dot: "bg-violet-200",
    },
    cyan: {
      bg: "bg-gradient-to-br from-slate-800 via-cyan-700 to-sky-600",
      ring: "from-cyan-300/30 via-white/10 to-sky-300/25",
      border: "border-cyan-300/20",
      text: "text-white",
      sub: "text-cyan-100/80",
      dot: "bg-cyan-100",
    },
  };

  const theme = variants[variant];

  return (
    <div
      className={`stat-animated relative overflow-hidden rounded-[24px] border ${theme.border} ${theme.bg} ${theme.text} px-5 py-4 min-w-[132px] shadow-xl transition-all duration-500 hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-2xl cursor-pointer`}
    >
      <div
        className={`absolute inset-0 rounded-[24px] bg-gradient-to-br ${theme.ring} opacity-70`}
      />
      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -left-4 -bottom-5 h-14 w-14 rounded-full bg-black/10 blur-2xl" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className={`text-[11px] uppercase tracking-[0.22em] font-extrabold ${theme.sub}`}>
            {label}
          </p>
          <p className="stat-number-pop mt-2 text-4xl leading-none font-black">
            {value}
          </p>
        </div>

        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm">
          <div className={`h-2.5 w-2.5 rounded-full ${theme.dot} animate-pulse`} />
        </div>
      </div>
    </div>
  );
}

function LabelText({ children }) {
  return (
    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
      {children}
    </label>
  );
}

function InputBlock(props) {
  return (
    <input
      {...props}
      className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-4 py-3 text-sm text-slate-800 dark:text-white outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
    />
  );
}

function InputWithIcon(props) {
  return (
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
        {...props}
        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 pl-11 pr-4 py-3 text-sm text-slate-800 dark:text-white outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      />
    </div>
  );
}

function FilterSelect({ children, ...props }) {
  return (
    <select
      {...props}
      className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-100 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
    >
      {children}
    </select>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-[28px] border border-white/20 bg-white/85 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl p-6 md:p-7">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400 font-extrabold">
              Action
            </p>
            <h3 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{title}</h3>
          </div>

          <button
            onClick={onClose}
            className="h-11 w-11 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-lg font-black transition-all duration-300 hover:rotate-90 hover:shadow-md"
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}