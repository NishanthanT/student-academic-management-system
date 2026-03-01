import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

/* =========================
   CONFIG
========================= */
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

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}

/* =========================
   HELPERS
========================= */
const COUNT_OPTIONS = [5, 10, 15, 20, 25];

function pickNearestCount(n) {
  const num = Number(n || 0);
  if (!num) return 25;
  let best = COUNT_OPTIONS[0];
  let diff = Math.abs(num - best);
  for (const x of COUNT_OPTIONS) {
    const d = Math.abs(num - x);
    if (d < diff) {
      best = x;
      diff = d;
    }
  }
  return best;
}

function emptyRow(qno) {
  return {
    question_no: qno,
    question_text: "",
    question_type: "MCQ", // "MCQ" | "ONE_WORD"
    marks: "",
    options: { A: "", B: "", C: "", D: "" },
    correct: "",
    answer_text: "",
    _errors: {},
    _id: `row_${qno}`,
    db_id: null,
  };
}

function sumMarks(rows) {
  return rows.reduce((s, r) => s + Number(r.marks || 0), 0);
}

function validateRow(row) {
  const e = {};

  if (!row.question_text?.trim()) e.question_text = "Question required";

  const m = Number(row.marks);
  if (!row.marks && row.marks !== 0) e.marks = "Marks required";
  else if (!Number.isFinite(m) || m <= 0) e.marks = "Marks must be > 0";
  else if (!Number.isInteger(m)) e.marks = "Marks must be an integer";

  if (row.question_type === "MCQ") {
    const { A, B, C, D } = row.options || {};
    if (!A?.trim()) e.optA = "A required";
    if (!B?.trim()) e.optB = "B required";
    if (!C?.trim()) e.optC = "C required";
    if (!D?.trim()) e.optD = "D required";
    if (!row.correct) e.correct = "Correct option required";

    if (row.correct) {
      const text = row.options?.[row.correct];
      if (!text?.trim()) e.correct = "Correct option text is empty";
    }
  }

  if (row.question_type === "ONE_WORD") {
    const ans = row.answer_text || "";
    if (!ans.trim()) e.answer_text = "Answer required";
    if (ans.trim() && ans.trim().includes(" "))
      e.answer_text = "One word only (no spaces)";
  }

  return e;
}

function normalizeFromApi(q, index) {
  const qno = Number(q.question_no ?? index + 1);
  const type = (q.question_type || q.type || "MCQ").toString().toUpperCase();
  const row = emptyRow(qno);

  row.db_id = q.id ?? q.question_id ?? null;
  row.question_text = q.question_text ?? q.question ?? "";
  row.question_type = type === "ONE_WORD" ? "ONE_WORD" : "MCQ";
  row.marks = q.marks ?? "";
  row.answer_text = q.answer_text ?? q.answer ?? "";

  if (q.options && !Array.isArray(q.options)) {
    row.options = {
      A: q.options.A ?? "",
      B: q.options.B ?? "",
      C: q.options.C ?? "",
      D: q.options.D ?? "",
    };
    row.correct = (q.correct || "").toString().toUpperCase();
  } else if (Array.isArray(q.options)) {
    const optMap = { A: "", B: "", C: "", D: "" };
    let corr = "";
    for (const o of q.options) {
      const lab = (o.option_label || o.label || "").toString().toUpperCase();
      if (["A", "B", "C", "D"].includes(lab))
        optMap[lab] = o.option_text ?? o.text ?? "";
      if (o.is_correct === 1 || o.is_correct === true) corr = lab;
    }
    row.options = optMap;
    row.correct = corr;
  } else {
    row.options = {
      A: q.option_a ?? q.A ?? "",
      B: q.option_b ?? q.B ?? "",
      C: q.option_c ?? q.C ?? "",
      D: q.option_d ?? q.D ?? "",
    };
    row.correct = (q.correct || q.correct_option || "")
      .toString()
      .toUpperCase();
  }

  return row;
}

/* =========================
   MAIN
========================= */
export default function Questions() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const PATH_EXAMS_LIST = `/staff/exams`;
  const PATH_GET_QUESTIONS = (id) => `/staff/exams/${id}/questions`;
  const PATH_BULK_SAVE = (id) => `/staff/exams/${id}/questions/bulk`;
  const PATH_DELETE_QUESTION = (qid) => `/staff/questions/${qid}`;

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [exam, setExam] = useState(null);
  const [questionCount, setQuestionCount] = useState(25);
  const [rows, setRows] = useState(() =>
    Array.from({ length: 25 }, (_, i) => emptyRow(i + 1))
  );

  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    window.clearTimeout(window.__qToast);
    window.__qToast = window.setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const [examsRes, qRes] = await Promise.all([
          apiFetch(PATH_EXAMS_LIST),
          apiFetch(PATH_GET_QUESTIONS(examId)).catch(() => ({ data: [] })),
        ]);

        const exams = Array.isArray(examsRes?.data) ? examsRes.data : [];
        const ex = exams.find((x) => String(x.id) === String(examId)) || null;
        setExam(ex);

        if (!ex) {
          // UI safe only
          showToast("error", "Exam not found (check examId / staff access)");
        }

        const list = qRes?.data || qRes?.questions || [];
        const mapped = Array.isArray(list) ? list.map(normalizeFromApi) : [];

        // ✅ FIX: initialCount must be one of COUNT_OPTIONS (avoid dropdown blank)
        const existingCount = mapped.length;
        const initialCount = existingCount ? pickNearestCount(existingCount) : 25;

        setQuestionCount(initialCount);

        const base = Array.from({ length: initialCount }, (_, i) =>
          emptyRow(i + 1)
        );
        const byNo = new Map(mapped.map((r) => [Number(r.question_no), r]));
        const merged = base.map((r) => byNo.get(r.question_no) || r);
        setRows(merged);
      } catch (e) {
        showToast("error", e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  const applyCount = (count) => {
    const c = Number(count);
    if (!COUNT_OPTIONS.includes(c)) return;

    setQuestionCount(c);
    setRows((prev) => {
      const next = Array.from({ length: c }, (_, i) => {
        const qno = i + 1;
        const existing = prev.find((x) => x.question_no === qno);
        return existing ? { ...existing } : emptyRow(qno);
      });
      return next;
    });
  };

  const updateRow = (qno, patch) => {
    setRows((prev) =>
      prev.map((r) => (r.question_no !== qno ? r : { ...r, ...patch }))
    );
  };

  const updateOption = (qno, key, value) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.question_no !== qno) return r;
        return { ...r, options: { ...(r.options || {}), [key]: value } };
      })
    );
  };

  const onTypeChange = (qno, type) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.question_no !== qno) return r;
        const next = { ...r, question_type: type };
        if (type === "ONE_WORD") {
          next.correct = "";
          next.options = { A: "", B: "", C: "", D: "" };
        } else {
          next.answer_text = "";
        }
        return next;
      })
    );
  };

  const deleteRow = async (row) => {
    const ok = window.confirm(`Delete question ${row.question_no}?`);
    if (!ok) return;

    try {
      setBusy(true);
      if (row.db_id) {
        await apiFetch(PATH_DELETE_QUESTION(row.db_id), { method: "DELETE" });
      }
      setRows((prev) =>
        prev.map((r) =>
          r.question_no === row.question_no ? emptyRow(r.question_no) : r
        )
      );
      showToast("success", `Deleted Q${row.question_no}`);
    } catch (e) {
      showToast("error", e.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const computed = useMemo(() => {
    const expected = Number(exam?.total_marks ?? 0);
    const currentTotal = sumMarks(rows);
    const perRowErrors = rows.map((r) => validateRow(r));
    const allRowValid = perRowErrors.every((e) => Object.keys(e).length === 0);
    const totalMatch = expected > 0 ? currentTotal === expected : true;

    return {
      expected,
      currentTotal,
      perRowErrors,
      allRowValid,
      totalMatch,
      canSave: allRowValid && totalMatch && !loading && !busy,
    };
  }, [rows, exam, loading, busy]);

  const applyErrorsToState = () => {
    setRows((prev) =>
      prev.map((r, idx) => ({
        ...r,
        _errors: computed.perRowErrors[idx] || {},
      }))
    );
  };

  const scrollToFirstError = () => {
    const idx = computed.perRowErrors.findIndex(
      (e) => Object.keys(e).length > 0
    );
    if (idx === -1) return;
    const qno = rows[idx]?.question_no;
    const el = document.getElementById(`question_text_${qno}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSaveAll = async () => {
    applyErrorsToState();

    if (!computed.allRowValid) {
      showToast("error", "Fix validation errors first");
      scrollToFirstError();
      return;
    }

    if (!computed.totalMatch) {
      showToast(
        "error",
        `Total marks mismatch: Current ${computed.currentTotal} / Expected ${computed.expected}`
      );
      return;
    }

    const payload = {
      question_count: questionCount,
      expected_total_marks: computed.expected,
      questions: rows.map((r) => ({
        id: r.db_id,
        question_no: r.question_no,
        question_text: r.question_text.trim(),
        question_type: r.question_type,
        marks: Number(r.marks),
        options: r.question_type === "MCQ" ? r.options : undefined,
        correct: r.question_type === "MCQ" ? r.correct : undefined,
        answer_text:
          r.question_type === "ONE_WORD" ? r.answer_text.trim() : undefined,
      })),
    };

    try {
      setBusy(true);
      const res = await apiFetch(PATH_BULK_SAVE(examId), {
        method: "POST",
        body: payload,
      });

      const qRes = await apiFetch(PATH_GET_QUESTIONS(examId)).catch(() => ({
        data: [],
      }));
      const list = qRes?.data || qRes?.questions || [];
      const mapped = Array.isArray(list) ? list.map(normalizeFromApi) : [];

      const base = Array.from({ length: questionCount }, (_, i) =>
        emptyRow(i + 1)
      );
      const byNo = new Map(mapped.map((r) => [Number(r.question_no), r]));
      setRows(base.map((r) => byNo.get(r.question_no) || r));

      showToast("success", res?.message || "Questions saved successfully");
    } catch (e) {
      showToast("error", e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const totalColor = computed.totalMatch ? "#027A48" : "#B42318";

  const durationMins =
    exam?.duration_minutes ??
    (exam?.start_at && exam?.end_at
      ? Math.max(
          0,
          Math.round(
            (new Date(exam.end_at) - new Date(exam.start_at)) / 60000
          )
        )
      : null);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <style>{`
        .q-card{border:1px solid #e4e7ec;border-radius:14px;background:#fff;padding:14px}
        .q-top{display:flex;gap:12px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap}
        .q-title h1{margin:0;font-size:22px}
        .q-muted{color:#667085;font-size:13px}
        .q-btn{border:1px solid #e4e7ec;background:#fff;padding:10px 12px;border-radius:10px;cursor:pointer;font-weight:900}
        .q-btn:disabled{opacity:.6;cursor:not-allowed}
        .q-btn-primary{background:#2563EB;border-color:#2563EB;color:#fff}
        .q-btn-danger{background:#ffe4e6;border-color:#fecdd3;color:#9f1239}
        .q-input{width:100%;border:1px solid #e4e7ec;border-radius:10px;padding:10px 12px;outline:none}
        .q-err{border-color:#fda29b}
        .q-err-msg{color:#b42318;font-size:12px;margin-top:6px}
        .q-tablewrap{margin-top:14px;border:1px solid #e4e7ec;border-radius:14px;overflow:hidden;background:#fff}
        .q-scroll{overflow:auto}
        table{width:100%;border-collapse:collapse;min-width:1180px}
        th,td{padding:12px;border-bottom:1px solid #f2f4f7;text-align:left;font-size:14px;vertical-align:top}
        th{background:#fcfcfd;font-size:12px;color:#667085;text-transform:uppercase;letter-spacing:.04em}
        .q-toast{position:fixed;top:18px;right:18px;z-index:9999;display:flex;gap:12px;align-items:center;max-width:420px;padding:12px 14px;border-radius:14px;color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.12)}
        .q-toast.ok{background:#027a48}
        .q-toast.err{background:#b42318}
        .q-actions{display:flex;gap:8px;flex-wrap:wrap}
      `}</style>

      {toast ? (
        <div
          className={`q-toast ${toast.type === "success" ? "ok" : "err"}`}
          id="toast_questions"
        >
          <span>{toast.message}</span>
          <button
            className="q-btn"
            id="btn_close_toast"
            onClick={() => setToast(null)}
          >
            ✕
          </button>
        </div>
      ) : null}

      <div className="q-top">
        <div className="q-title">
          <h1 id="page_title_questions">Questions</h1>
          <div className="q-muted" id="page_subtitle_questions">
            Create / View questions for an approved exam. Total marks must match
            the exam total.
          </div>
        </div>

        <div className="q-actions">
          <button
            className="q-btn"
            id="btn_back_to_approved_notice"
            onClick={() => navigate("/staff/ApprovedExamNotice")}
            disabled={busy}
            title="Back to Approved Exam Notice"
          >
            ← Approved Notice
          </button>

          <button
            className="q-btn"
            id="btn_back_to_exams"
            onClick={() => navigate("/staff/exams")}
            disabled={busy}
          >
            ← Exams
          </button>

          <button
            className="q-btn q-btn-primary"
            id="btn_save_all_questions"
            onClick={handleSaveAll}
            disabled={!computed.canSave}
            title={
              !computed.totalMatch
                ? `Total mismatch: ${computed.currentTotal}/${computed.expected}`
                : !computed.allRowValid
                ? "Fix row errors"
                : ""
            }
          >
            {busy ? "Saving..." : "Save All"}
          </button>
        </div>
      </div>

      <div className="q-card" style={{ marginTop: 14 }}>
        {loading ? (
          <div id="loading_exam_summary">Loading exam...</div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 10,
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            }}
          >
            <div>
              <div className="q-muted">Exam</div>
              <div style={{ fontWeight: 900 }} id="exam_title_text">
                {exam?.title || "-"}
              </div>
              <div className="q-muted" id="exam_id_text" style={{ marginTop: 4 }}>
                ID: {examId}
              </div>
            </div>

            <div>
              <div className="q-muted">Expected Total Marks</div>
              <div style={{ fontWeight: 900 }} id="exam_expected_total_marks">
                {computed.expected || "-"}
              </div>
            </div>

            <div>
              <div className="q-muted">Current Total</div>
              <div
                style={{ fontWeight: 900, color: totalColor }}
                id="exam_current_total_marks"
              >
                {computed.currentTotal}
              </div>
              {!computed.totalMatch ? (
                <div className="q-err-msg" id="msg_total_mismatch">
                  Total must equal {computed.expected}
                </div>
              ) : null}
            </div>

            <div>
              <div className="q-muted">Duration</div>
              <div style={{ fontWeight: 900 }} id="exam_duration_minutes">
                {durationMins != null ? `${durationMins} mins` : "-"}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="q-card" style={{ marginTop: 14 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
          <div style={{ minWidth: 220 }}>
            <div className="q-muted">Question Count</div>
            <select
              className="q-input"
              id="dropdown_question_count"
              value={questionCount}
              onChange={(e) => applyCount(e.target.value)}
              disabled={busy || loading}
            >
              {COUNT_OPTIONS.map((c) => (
                <option key={c} value={c} id={`opt_qcount_${c}`}>
                  {c} Questions
                </option>
              ))}
            </select>
          </div>

          <button
            className="q-btn"
            id="btn_validate_rows"
            onClick={() => {
              applyErrorsToState();
              if (!computed.allRowValid) {
                showToast("error", "There are validation errors");
                scrollToFirstError();
              } else if (!computed.totalMatch) {
                showToast(
                  "error",
                  `Total mismatch: ${computed.currentTotal}/${computed.expected}`
                );
              } else {
                showToast("success", "All good ✅");
              }
            }}
            disabled={busy || loading}
          >
            Validate
          </button>
        </div>
      </div>

      <div className="q-tablewrap">
        <div className="q-scroll">
          <table id="table_questions">
            <thead>
              <tr>
                <th style={{ width: 60 }}>No</th>
                <th style={{ width: 320 }}>Question</th>
                <th style={{ width: 120 }}>Type</th>
                <th style={{ width: 90 }}>Marks</th>
                <th style={{ width: 220 }}>A</th>
                <th style={{ width: 220 }}>B</th>
                <th style={{ width: 220 }}>C</th>
                <th style={{ width: 220 }}>D</th>
                <th style={{ width: 120 }}>Correct</th>
                <th style={{ width: 220 }}>One Word Answer</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => {
                const e = r._errors || {};
                const isMCQ = r.question_type === "MCQ";
                const isOW = r.question_type === "ONE_WORD";

                return (
                  <tr key={r._id} id={`row_${r.question_no}`}>
                    <td style={{ fontWeight: 900 }}>{r.question_no}</td>

                    <td>
                      <textarea
                        id={`question_text_${r.question_no}`}
                        className={`q-input ${e.question_text ? "q-err" : ""}`}
                        rows={3}
                        value={r.question_text}
                        onChange={(ev) =>
                          updateRow(r.question_no, { question_text: ev.target.value })
                        }
                        placeholder="Enter question..."
                        disabled={busy || loading}
                      />
                      {e.question_text ? (
                        <div className="q-err-msg">{e.question_text}</div>
                      ) : null}
                    </td>

                    <td>
                      <select
                        className="q-input"
                        value={r.question_type}
                        onChange={(ev) => onTypeChange(r.question_no, ev.target.value)}
                        disabled={busy || loading}
                      >
                        <option value="MCQ">MCQ</option>
                        <option value="ONE_WORD">ONE_WORD</option>
                      </select>
                    </td>

                    <td>
                      <input
                        type="number"
                        className={`q-input ${e.marks ? "q-err" : ""}`}
                        value={r.marks}
                        onChange={(ev) => updateRow(r.question_no, { marks: ev.target.value })}
                        min={1}
                        step={1}
                        disabled={busy || loading}
                      />
                      {e.marks ? <div className="q-err-msg">{e.marks}</div> : null}
                    </td>

                    <td>
                      <input
                        className={`q-input ${e.optA ? "q-err" : ""}`}
                        value={r.options?.A || ""}
                        onChange={(ev) => updateOption(r.question_no, "A", ev.target.value)}
                        placeholder="Option A"
                        disabled={!isMCQ || busy || loading}
                      />
                      {isMCQ && e.optA ? <div className="q-err-msg">{e.optA}</div> : null}
                    </td>

                    <td>
                      <input
                        className={`q-input ${e.optB ? "q-err" : ""}`}
                        value={r.options?.B || ""}
                        onChange={(ev) => updateOption(r.question_no, "B", ev.target.value)}
                        placeholder="Option B"
                        disabled={!isMCQ || busy || loading}
                      />
                      {isMCQ && e.optB ? <div className="q-err-msg">{e.optB}</div> : null}
                    </td>

                    <td>
                      <input
                        className={`q-input ${e.optC ? "q-err" : ""}`}
                        value={r.options?.C || ""}
                        onChange={(ev) => updateOption(r.question_no, "C", ev.target.value)}
                        placeholder="Option C"
                        disabled={!isMCQ || busy || loading}
                      />
                      {isMCQ && e.optC ? <div className="q-err-msg">{e.optC}</div> : null}
                    </td>

                    <td>
                      <input
                        className={`q-input ${e.optD ? "q-err" : ""}`}
                        value={r.options?.D || ""}
                        onChange={(ev) => updateOption(r.question_no, "D", ev.target.value)}
                        placeholder="Option D"
                        disabled={!isMCQ || busy || loading}
                      />
                      {isMCQ && e.optD ? <div className="q-err-msg">{e.optD}</div> : null}
                    </td>

                    <td>
                      <select
                        className={`q-input ${e.correct ? "q-err" : ""}`}
                        value={r.correct}
                        onChange={(ev) => updateRow(r.question_no, { correct: ev.target.value })}
                        disabled={!isMCQ || busy || loading}
                      >
                        <option value="">Select</option>
                        {["A", "B", "C", "D"].map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                      {isMCQ && e.correct ? <div className="q-err-msg">{e.correct}</div> : null}
                    </td>

                    <td>
                      <input
                        className={`q-input ${e.answer_text ? "q-err" : ""}`}
                        value={r.answer_text}
                        onChange={(ev) => updateRow(r.question_no, { answer_text: ev.target.value })}
                        placeholder="One word"
                        disabled={!isOW || busy || loading}
                      />
                      {isOW && e.answer_text ? <div className="q-err-msg">{e.answer_text}</div> : null}
                    </td>

                    <td>
                      <div className="q-actions">
                        <button
                          className="q-btn"
                          onClick={() =>
                            setRows((prev) =>
                              prev.map((x) =>
                                x.question_no === r.question_no
                                  ? emptyRow(r.question_no)
                                  : x
                              )
                            )
                          }
                          disabled={busy || loading}
                        >
                          Clear
                        </button>

                        <button
                          className="q-btn q-btn-danger"
                          onClick={() => deleteRow(r)}
                          disabled={busy || loading}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="q-muted" style={{ marginTop: 12 }}>
        Tip: Save only works when all rows are valid and total marks equals exam total marks.
      </div>
    </div>
  );
}