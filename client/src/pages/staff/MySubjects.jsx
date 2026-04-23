import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = `http://${window.location.hostname}:8000`; // change if needed

export default function MySubjects() {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);

  // ------- Toast -------
  const [toast, setToast] = useState(null);
  const showToast = (type, message) => {
    setToast({ type, message });
    window.clearTimeout(window.__toastTimer);
    window.__toastTimer = window.setTimeout(() => setToast(null), 2500);
  };

  // ------- Filters -------
  const [year, setYear] = useState("all");
  const [semester, setSemester] = useState("all");
  const [search, setSearch] = useState("");

  // ------- Data -------
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // ------- Fetch (DB only) -------
  const fetchMySubjects = async () => {
    if (!token) {
      setSubjects([]);
      return showToast("error", "Session expired. Please login again.");
    }

    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (year !== "all") params.set("year", year);
      if (semester !== "all") params.set("semester", semester);
      if (search.trim()) params.set("search", search.trim());

      // ✅ BACKEND: GET /api/staff/my-subjects
      const res = await fetch(`${API_BASE}/api/staff/my-subjects?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubjects([]);
        return showToast("error", data?.message || "Failed to load subjects");
      }

      setSubjects(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setSubjects([]);
      showToast("error", "Server not reachable");
    } finally {
      setLoading(false);
    }
  };

  // init
  useEffect(() => {
    fetchMySubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce filters
  useEffect(() => {
    const t = setTimeout(() => fetchMySubjects(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, semester, search]);

  const openView = (sub) => {
    // optional route: /staff/my-subjects/:id
    // navigate(`/staff/my-subjects/${sub.id}`);
    showToast("success", `View: ${sub.code}`);
  };

  const openCreateExam = (sub) => {
    // optional route: /staff/exams/create?subject_id=xx
    // navigate(`/staff/exams?subject_id=${sub.id}&mode=create`);
    showToast("success", `Create Exam for ${sub.code}`);
  };

  const openManageExams = (sub) => {
    // optional route: /staff/exams?subject_id=xx
    // navigate(`/staff/exams?subject_id=${sub.id}`);
    showToast("success", `Manage Exams: ${sub.code}`);
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-xl text-sm text-white
          transform transition-all duration-300 animate-slide-in
          ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
        >
          {toast.message}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-800 p-6 transition-colors duration-300">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-black text-gray-950 dark:text-white tracking-tight">My Subjects</h3>
            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-1">
              Only subjects assigned by Admin will appear here.
            </p>
          </div>

          <button
            onClick={fetchMySubjects}
            className="border dark:border-gray-800 rounded-lg px-4 py-2 text-[12px] font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
           id="mysubjects-button-1">
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg px-3 py-2 text-[13px] font-medium text-gray-900 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            value={year}
            onChange={(e) => setYear(e.target.value)}
           id="mysubjects-select-1">
            <option value="all">All Years</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>

          <select
            className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg px-3 py-2 text-[13px] font-medium text-gray-900 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
           id="mysubjects-select-2">
            <option value="all">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </select>

          <input
            className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg px-3 py-2 text-[13px] font-medium text-gray-900 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            placeholder="Search code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
           id="mysubjects-input-1"/>
        </div>

        {/* Cards */}
        <div className="mt-6">
          {loading ? (
            <div className="text-sm text-gray-500">Loading subjects...</div>
          ) : subjects.length === 0 ? (
            <div className="text-sm text-gray-500">
              No subjects assigned for you.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {subjects.map((s) => (
                <div
                  key={s.id}
                  className="border dark:border-gray-800 rounded-xl p-4 bg-white dark:bg-gray-800/40 shadow-sm hover:border-blue-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                        {s.code}
                      </div>
                      <div className="text-base font-bold text-gray-900 dark:text-white">
                        {s.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Year {s.year ?? "-"} • Semester {s.semester ?? "-"}
                      </div>
                    </div>

                    <span className="text-xs px-2 py-1 rounded-full border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      Assigned
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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