// client/src/pages/staff/Results.jsx
import React, { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
  : "http://localhost:8000";
const API = `${API_BASE}/api`;

async function apiFetch(path, { method = "GET", body } = {}) {
  const token = (localStorage.getItem("token") || "").trim();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) { localStorage.clear(); window.location.href = '/'; throw new Error('Session expired'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}

export default function Results() {
  const [toast, setToast] = useState(null);
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3200);
  };

  // Filters
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");

  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState("");

  // ✅ Now used as EMAIL input
  const [studentId, setStudentId] = useState("");

  // Result rows + meta
  const [rows, setRows] = useState([]);
  const [examMeta, setExamMeta] = useState(null);
  const [loading, setLoading] = useState(false);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editMarks, setEditMarks] = useState("");

  // Detailed View modal
  const [viewOpen, setViewOpen] = useState(false);
  const [viewRows, setViewRows] = useState([]);
  const [viewingRow, setViewingRow] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const selectedExam = useMemo(
    () => exams.find((e) => String(e.id) === String(examId)),
    [exams, examId]
  );

  // =========================
  // Load subjects (staff)
  // =========================
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/staff/subjects");
        const list = res.data || [];
        setSubjects(list);
        if (list.length) setSubjectId(String(list[0].id));
      } catch (e) {
        showToast("err", e.message);
      }
    })();
  }, []);

  // =========================
  // Load exams by subject
  // =========================
  useEffect(() => {
    if (!subjectId) return;

    (async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/staff/subjects/${subjectId}/exams`);
        const list = res.data || [];
        setExams(list);
        setExamId(list.length ? String(list[0].id) : "");
      } catch (e) {
        showToast("err", e.message);
        setExams([]);
        setExamId("");
      } finally {
        setLoading(false);
      }
    })();
  }, [subjectId]);

  // =========================
  // When exam changes: auto-grade (optional) + load results
  // =========================
  useEffect(() => {
    if (!examId) {
      setRows([]);
      setExamMeta(null);
      return;
    }

    (async () => {
      try {
        setLoading(true);

        // 1) try auto-grade (optional)
        try {
          await apiFetch(`/staff/exams/${examId}/auto-grade`, { method: "POST" });
        } catch (_) {}

        // 2) load results for this exam
        await loadResults({ examId, studentEmail: "" });
      } catch (e) {
        showToast("err", e.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  // ✅ EMAIL filter query param
  const loadResults = async ({ examId, studentEmail }) => {
    const qs = new URLSearchParams();
    if (studentEmail && studentEmail.trim())
      qs.set("student_email", studentEmail.trim());

    const res = await apiFetch(`/staff/exams/${examId}/results?${qs.toString()}`);

    // controller returns: { ok:true, data:{ exam:{...}, rows:[...] } }
    const payload = res.data || {};
    setExamMeta(payload.exam || null);
    setRows(payload.rows || []);
  };

  // Apply / Clear
  const onApply = async () => {
    if (!examId) return;
    try {
      setLoading(true);
      await loadResults({ examId, studentEmail: studentId });
    } catch (e) {
      showToast("err", e.message);
    } finally {
      setLoading(false);
    }
  };

  const onClear = async () => {
    setStudentId("");
    if (!examId) return;
    try {
      setLoading(true);
      await loadResults({ examId, studentEmail: "" });
    } catch (e) {
      showToast("err", e.message);
    } finally {
      setLoading(false);
    }
  };

  // Edit marks
  const openEdit = (r) => {
    if (r?.can_edit === false) return;
    setEditRow(r);
    setEditMarks(r.total_marks ?? "");
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editRow || !examId) return;

    const num = Number(editMarks);
    if (Number.isNaN(num) || num < 0) {
      showToast("err", "Invalid marks");
      return;
    }

    try {
      setLoading(true);

      await apiFetch(`/staff/exams/${examId}/results/update`, {
        method: "PUT",
        body: { student_id: editRow.student_id, total_marks: num },
      });

      showToast("ok", "Marks updated");
      setEditOpen(false);
      setEditRow(null);

      await loadResults({ examId, studentEmail: studentId });
    } catch (e) {
      showToast("err", e.message);
    } finally {
      setLoading(false);
    }
  };

  // Detailed View
  const openView = async (r) => {
    try {
      setViewingRow(r);
      setViewLoading(true);
      setViewOpen(true);
      const res = await apiFetch(`/staff/exams/${examId}/results/${r.student_id}/details`);
      setViewRows(res.data || []);
    } catch (e) {
      showToast("err", e.message);
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  // PDF Download: All Results
  const handleDownloadAllResults = () => {
    if (!examMeta || rows.length === 0) return;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(21, 112, 239);
    doc.text("UniExam - Official Results Report", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Exam: ${examMeta.title}`, 14, 25);
    doc.text(`Subject: ${subjectId} | Total Marks: ${examMeta.total_marks}`, 14, 31);
    doc.text(`Date Generated: ${new Date().toLocaleString()}`, 14, 37);

    const tableBody = rows.map((r) => [
      r.student_id,
      r.student_name,
      r.student_email || "-",
      r.total_marks,
      r.status,
    ]);

    autoTable(doc, {
      startY: 45,
      head: [["ID", "Name", "Email", "Marks", "Status"]],
      body: tableBody,
      theme: "striped",
      headStyles: { fillColor: [249, 250, 251], textColor: [71, 84, 103], fontStyle: "bold" },
    });

    doc.save(`Results_${examMeta.title.replace(/\s+/g, "_")}.pdf`);
  };

  // Header pills
  const passMark = examMeta?.pass_marks ?? selectedExam?.pass_marks ?? "-";
  const startAt = (examMeta?.start_at || selectedExam?.start_at)
    ? new Date(examMeta?.start_at || selectedExam?.start_at).toLocaleString()
    : "-";

  return (
    <div style={sx.page}>
      {toast && (
        <div
          style={{
            ...sx.toast,
            background: toast.type === "ok" ? "#027A48" : "#B42318",
          }}
        >
          <div style={{ fontWeight: 900 }}>{toast.type === "ok" ? "Success" : "Error"}</div>
          <div style={{ opacity: 0.95 }}>{toast.msg}</div>
          <button style={sx.toastX} onClick={() => setToast(null)} aria-label="close">
            ✕
          </button>
        </div>
      )}

      <div style={sx.headCard}>
        <div>
          <div style={sx.hTitle}>Results</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
          <div style={sx.pillRow}>
            <span style={sx.pill}>Exam: {examMeta?.title || selectedExam?.title || "Results"}</span>
            <span style={sx.pill}>Pass: {passMark}</span>
            <span style={sx.pill}>Start: {startAt}</span>
          </div>
          {rows.length > 0 && (
            <button
              style={{ ...sx.btn, ...sx.btnPrimary, fontSize: 13, padding: "8px 12px" }}
              onClick={handleDownloadAllResults}
            >
              Download Results PDF
            </button>
          )}
        </div>
      </div>

      <div style={sx.card}>
        <div style={sx.filterRow}>
          <div style={sx.field}>
            <label style={sx.label}>Subject</label>
            <select
              style={sx.select}
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div style={sx.field}>
            <label style={sx.label}>Exam</label>
            <select style={sx.select} value={examId} onChange={(e) => setExamId(e.target.value)}>
              {exams.length === 0 ? (
                <option value="">No exams</option>
              ) : (
                exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))
              )}
            </select>
          </div>

          <div style={sx.field}>
            <label style={sx.label}>Student Email</label>
            <input
              style={sx.input}
              placeholder="ex: student@gmail.com"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <button style={{ ...sx.btn, ...sx.btnPrimary }} onClick={onApply} disabled={!examId}>
              Apply
            </button>
            <button style={{ ...sx.btn, ...sx.btnGhost }} onClick={onClear}>
              Clear
            </button>
          </div>
        </div>

        <div style={sx.tableHead}>
          <div style={sx.tTitle}>Result Table</div>
          <div style={sx.pill}>{rows.length} students</div>
        </div>

        <div style={sx.tableWrap}>
          <table style={sx.table}>
            <thead>
              <tr>
                <th style={sx.th}>Student ID</th>
                <th style={sx.th}>Student Email</th>
                <th style={sx.th}>Student Name</th>
                <th style={sx.th}>Total Marks</th>
                <th style={sx.th}>Status</th>
                <th style={{ ...sx.th, textAlign: "right" }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td style={sx.td} colSpan={6}>Loading...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td style={sx.tdEmpty} colSpan={6}>No data found for this filter.</td>
                </tr>
              ) : (
                rows.map((r) => {
                  const status = String(r.status || "").toUpperCase();
                  const badge =
                    status === "PASS"
                      ? sx.badgePass
                      : status === "FAIL"
                      ? sx.badgeFail
                      : sx.badgeAbsent;

                  return (
                    <tr key={`${examId}-${r.student_id}`}>
                      <td style={sx.td}>{r.student_id}</td>
                      <td style={sx.td}>{r.student_email || "-"}</td>
                      <td style={sx.td}>{r.student_name || "-"}</td>
                      <td style={sx.td}>{r.total_marks}</td>
                      <td style={sx.td}>
                        <span style={{ ...sx.badge, ...badge }}>{status}</span>
                      </td>
                      <td style={{ ...sx.td, textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button
                            style={{ ...sx.btnMini, ...sx.btnMiniBlue }}
                            onClick={() => openView(r)}
                            disabled={status === "ABSENT" || status === "PENDING"}
                          >
                            View
                          </button>
                          {r?.can_edit !== false && (
                            <button
                              style={{ ...sx.btnMini, ...sx.btnMiniBlue }}
                              onClick={() => openEdit(r)}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editOpen && (
        <div style={sx.backdrop} onClick={() => setEditOpen(false)}>
          <div style={sx.modal} onClick={(e) => e.stopPropagation()}>
            <div style={sx.modalHead}>
              <div>
                <div style={sx.modalTitle}>Edit Marks</div>
                <div style={sx.modalSub}>
                  {editRow?.student_id} • {examMeta?.title || selectedExam?.title || ""}
                </div>
              </div>
              <button style={sx.iconBtn} onClick={() => setEditOpen(false)} aria-label="close">
                ✕
              </button>
            </div>

            <div style={sx.modalBody}>
              <label style={sx.label}>Total Marks</label>
              <input
                style={sx.input}
                value={editMarks}
                onChange={(e) => setEditMarks(e.target.value)}
                type="number"
                min="0"
              />

              <div style={sx.modalActions}>
                <button style={{ ...sx.btn, ...sx.btnGhost }} onClick={() => setEditOpen(false)}>
                  Cancel
                </button>
                <button style={{ ...sx.btn, ...sx.btnPrimary }} onClick={saveEdit}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewOpen && (
        <div style={sx.backdrop} onClick={() => setViewOpen(false)}>
          <div style={{ ...sx.modal, width: "min(900px, 100%)" }} onClick={(e) => e.stopPropagation()}>
            <div style={sx.modalHead}>
              <div>
                <div style={sx.modalTitle}>Attempt Details</div>
                <div style={sx.modalSub}>
                  {viewingRow?.student_name} ({viewingRow?.student_id})
                </div>
              </div>
              <button style={sx.iconBtn} onClick={() => setViewOpen(false)}>✕</button>
            </div>

            <div style={{ ...sx.modalBody, maxHeight: "70vh", overflowY: "auto" }}>
              {viewLoading ? (
                <div style={{ padding: 20, textAlign: "center" }}>Loading details...</div>
              ) : (
                <table style={sx.table}>
                  <thead>
                    <tr>
                      <th style={sx.th}>Q#</th>
                      <th style={sx.th}>Question</th>
                      <th style={sx.th}>Student Answer</th>
                      <th style={sx.th}>Correct Answer</th>
                      <th style={sx.th}>Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewRows.map((v, i) => {
                      const correct = v.is_correct === 1;
                      const sAns = v.question_type === "MCQ" ? v.selected_option : v.student_text;
                      const cAns = v.question_type === "MCQ" ? v.correct_option : v.correct_text;

                      return (
                        <tr key={i}>
                          <td style={sx.td}>{v.question_no}</td>
                          <td style={{ ...sx.td, fontSize: 13 }}>{v.question_text}</td>
                          <td style={{ ...sx.td, color: correct ? "#027A48" : "#B42318" }}>
                            {sAns || "-"}
                          </td>
                          <td style={{ ...sx.td, color: "#027A48" }}>{cAns || "-"}</td>
                          <td style={sx.td}>
                            {v.marks_awarded} / {v.max_marks}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div style={sx.modalActions}>
              <button style={{ ...sx.btn, ...sx.btnPrimary }} onClick={() => setViewOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   STYLES (unchanged)
========================= */
const sx = {
  page: { padding: 18, maxWidth: 1200, margin: "0 auto" },
  toast: {
    position: "fixed",
    top: 18,
    right: 18,
    zIndex: 99999,
    color: "#fff",
    padding: "12px 14px",
    borderRadius: 16,
    minWidth: 280,
    maxWidth: 420,
    boxShadow: "0 20px 60px rgba(0,0,0,.22)",
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },
  toastX: {
    marginLeft: "auto",
    border: "none",
    background: "rgba(255,255,255,.15)",
    color: "#fff",
    borderRadius: 10,
    width: 34,
    height: 34,
    cursor: "pointer",
    fontWeight: 1000,
  },
  headCard: {
    background: "#fff",
    border: "1px solid #E4E7EC",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,.04)",
    marginBottom: 14,
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "flex-start",
  },
  hTitle: { fontSize: 20, fontWeight: 1000, color: "#101828" },
  hSub: { marginTop: 6, color: "#667085", fontWeight: 700, fontSize: 13 },
  pillRow: { display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    height: 28,
    padding: "0 10px",
    borderRadius: 999,
    border: "1px solid #E4E7EC",
    background: "#FCFCFD",
    color: "#344054",
    fontWeight: 900,
    fontSize: 12,
    whiteSpace: "nowrap",
  },
  card: {
    background: "#fff",
    border: "1px solid #E4E7EC",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,.04)",
  },
  filterRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr auto",
    gap: 12,
    alignItems: "end",
  },
  field: { display: "grid", gap: 8 },
  label: { fontSize: 13, fontWeight: 900, color: "#344054" },
  select: {
    width: "100%",
    border: "1px solid #E4E7EC",
    borderRadius: 12,
    padding: "10px 12px",
    outline: "none",
    fontWeight: 800,
    color: "#101828",
    background: "#fff",
  },
  input: {
    width: "100%",
    border: "1px solid #E4E7EC",
    borderRadius: 12,
    padding: "10px 12px",
    outline: "none",
    fontWeight: 800,
    color: "#101828",
  },
  btn: {
    border: "1px solid #E4E7EC",
    background: "#fff",
    padding: "10px 14px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 1000,
  },
  btnPrimary: { background: "#2563EB", borderColor: "#2563EB", color: "#fff" },
  btnGhost: { background: "#fff", color: "#101828" },
  tableHead: {
    marginTop: 16,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  tTitle: { fontWeight: 1000, fontSize: 16, color: "#101828" },
  tableWrap: {
    marginTop: 10,
    border: "1px solid #E4E7EC",
    borderRadius: 14,
    overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "12px 14px",
    background: "#FCFCFD",
    borderBottom: "1px solid #E4E7EC",
    color: "#475467",
    fontWeight: 900,
    fontSize: 13,
  },
  td: { padding: "12px 14px", borderBottom: "1px solid #F2F4F7", fontWeight: 800, color: "#101828" },
  tdEmpty: { padding: 18, textAlign: "center", color: "#667085", fontWeight: 900 },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid",
    fontWeight: 1000,
    fontSize: 12,
    whiteSpace: "nowrap",
  },
  badgePass: { background: "#ECFDF3", borderColor: "#ABEFC6", color: "#027A48" },
  badgeFail: { background: "#FEF3F2", borderColor: "#FECDCA", color: "#B42318" },
  badgeAbsent: { background: "#F2F4F7", borderColor: "#E4E7EC", color: "#344054" },
  btnMini: {
    border: "1px solid #E4E7EC",
    padding: "8px 10px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 1000,
    background: "#fff",
  },
  btnMiniBlue: { background: "#EFF8FF", borderColor: "#B2DDFF", color: "#175CD3" },
  muted: { color: "#98A2B3", fontWeight: 900 },
  note: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    background: "#FCFCFD",
    border: "1px dashed #E4E7EC",
    color: "#667085",
    fontWeight: 800,
    fontSize: 13,
  },
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 14,
  },
  modal: {
    width: "min(520px, 100%)",
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #E4E7EC",
    boxShadow: "0 25px 70px rgba(0,0,0,.25)",
    overflow: "hidden",
  },
  modalHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderBottom: "1px solid #F2F4F7",
  },
  modalTitle: { fontWeight: 1000, fontSize: 16, color: "#101828" },
  modalSub: { marginTop: 6, color: "#667085", fontWeight: 700, fontSize: 13 },
  modalBody: { padding: 16 },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 },
  iconBtn: { border: "none", background: "transparent", cursor: "pointer", fontSize: 16, padding: 6 },
};