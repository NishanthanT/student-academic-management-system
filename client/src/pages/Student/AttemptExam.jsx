// client/src/pages/student/AttemptExam.jsx
import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
  : `http://${window.location.hostname}:8000`;
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

const pad2 = (n) => String(n).padStart(2, "0");
const fmtDT = (d) => new Date(d).toLocaleString();

function secondsLeft(mustEndAt) {
  const end = new Date(mustEndAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((end - now) / 1000));
}

function formatMMSS(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

/**
 * ✅ Status priority
 * 1) submitted (from backend attempt_status OR local submit cache)
 * 2) absent (missed window)
 * 3) upcoming (not started yet)
 * 4) available (within window)
 */
function computeExamWindow(exam) {
  const now = new Date();
  const start = new Date(exam.start_at);

  const durationMs = Number(exam.duration_minutes || 0) * 60000;
  const examEnd = new Date(start.getTime() + durationMs);

  const lateMin = Number(exam.late_minutes ?? 0);
  const expiry = new Date(examEnd.getTime() + lateMin * 60000);

  return { now, start, examEnd, expiry };
}

// ✅ Normalize question_type => type for UI (MCQ/ONE_WORD) + ✅ marks normalize
const normalizeQuestions = (arr) =>
  (arr || []).map((q) => {
    const raw = String(q.type ?? q.question_type ?? "").trim().toUpperCase();

    // ✅ DB column in your screenshot = marks
    const m =
      q.marks ??
      q.mark ??
      q.question_marks ??
      q.question_mark ??
      q.Marks ??
      q.MARKS ??
      0;

    return {
      ...q,
      type:
        raw === "MCQ"
          ? "mcq"
          : raw === "ONE_WORD"
            ? "one_word"
            : raw.toLowerCase(),
      marks: Number.parseFloat(m) || 0,
    };
  });

// ✅ safe marks getter (avoid undefined)
const getQMarks = (q) => {
  const m =
    q?.marks ??
    q?.mark ??
    q?.question_marks ??
    q?.question_mark ??
    q?.Marks ??
    q?.MARKS ??
    0;
  return Number.parseFloat(m) || 0;
};

export default function AttemptExam() {
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [exams, setExams] = useState([]);

  const [activeExam, setActiveExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);

  const [pwd, setPwd] = useState("");
  const [pwdOpen, setPwdOpen] = useState(false);

  const [leftSec, setLeftSec] = useState(0);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  // ✅ local cache: { [examId]: "submitted" }
  const [localAttemptStatus, setLocalAttemptStatus] = useState({});

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  // ==============================
  // LOAD SUBJECTS
  // ==============================
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/student/subjects");
        const list = res.data || [];
        setSubjects(list);
        if (list.length) setSubjectId(String(list[0].id));
      } catch (e) {
        showToast("err", e.message);
      }
    })();
  }, []);

  // ==============================
  // LOAD EXAMS
  // ==============================
  const loadExams = async (sid) => {
    try {
      const res = await apiFetch(`/student/subjects/${sid}/exams`);
      setExams(res.data || []);
    } catch (e) {
      showToast("err", e.message);
    }
  };

  useEffect(() => {
    if (!subjectId) return;
    loadExams(subjectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  // ==============================
  // TIMER
  // ==============================
  useEffect(() => {
    if (!attempt?.must_end_at) return;

    const tick = () => {
      const sec = secondsLeft(attempt.must_end_at);
      setLeftSec(sec);
      if (sec <= 0) autoSubmit();
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt?.must_end_at]);

  const buildAnswerPayload = () => {
    return Object.entries(answers || {})
      .filter(([qid, val]) => val !== undefined && String(val).trim() !== "")
      .map(([qid, val]) => ({
        question_id: Number(qid),
        value: val,
      }));
  };

  const submitNow = async (isAuto = false) => {
    if (!activeExam?.id) return;

    try {
      await apiFetch(`/student/exams/${activeExam.id}/submit`, {
        method: "POST",
        body: {
          answers: buildAnswerPayload(),
          is_auto: isAuto ? 1 : 0,
        },
      });

      setLocalAttemptStatus((prev) => ({
        ...prev,
        [String(activeExam.id)]: "submitted",
      }));

      showToast("ok", isAuto ? "Time over. Auto submitted." : "Submitted");
      resetExam();

      if (subjectId) loadExams(subjectId);
    } catch (e) {
      showToast("err", e.message);
    }
  };

  const autoSubmit = async () => {
    if (window.__autoDone) return;
    window.__autoDone = true;
    await submitNow(true);
  };

  const resetExam = () => {
    setAttempt(null);
    setActiveExam(null);
    setQuestions([]);
    setAnswers({});
    setActiveIndex(0);
    window.__autoDone = false;
  };

  // ==============================
  // START EXAM
  // ==============================
  const startExam = async () => {
    try {
      setBusy(true);

      const res = await apiFetch(`/student/exams/${activeExam.id}/start`, {
        method: "POST",
        body: { password: pwd },
      });

      setAttempt(res.data);

      const qRes = await apiFetch(`/student/exams/${activeExam.id}/questions`);
      setQuestions(normalizeQuestions(qRes.data.questions || []));

      setPwdOpen(false);
      setPwd("");
      showToast("ok", "Exam started");
    } catch (e) {
      showToast("err", e.message);
    } finally {
      setBusy(false);
    }
  };

  // ==============================
  // EXAM STATUS + BUTTON CONTROL
  // ==============================
  const getAttemptStatus = (exam) => {
    const fromBackend = String(
      exam.attempt_status ?? exam.latest_attempt_status ?? ""
    )
      .trim()
      .toLowerCase();

    if (fromBackend) return fromBackend;

    const local = String(localAttemptStatus[String(exam.id)] || "")
      .trim()
      .toLowerCase();

    return local || "";
  };

  const getExamUIState = (exam) => {
    const { now, start, expiry } = computeExamWindow(exam);

    const aStatus = getAttemptStatus(exam);
    if (aStatus === "submitted") {
      return {
        state: "submitted",
        pillText: "Submitted",
        btnText: "Submitted",
        disabled: true,
        pillStyle: sx.pillSubmitted,
        btnStyle: sx.btnDisabled,
        pillClass: "ax-pill-submitted",
      };
    }

    if (now > expiry) {
      return {
        state: "absent",
        pillText: "Absent",
        btnText: "Absent",
        disabled: true,
        pillStyle: sx.pillAbsent,
        btnStyle: sx.btnDisabled,
        pillClass: "ax-pill-absent",
      };
    }

    if (now < start) {
      return {
        state: "upcoming",
        pillText: "Not Available",
        btnText: "Locked",
        disabled: true,
        pillStyle: sx.pillLocked,
        btnStyle: sx.btnDisabled,
        pillClass: "ax-pill-locked",
      };
    }

    return {
      state: "available",
      pillText: "Available",
      btnText: "Attempt Quiz",
      disabled: false,
      pillStyle: sx.pillAvailable,
      btnStyle: sx.btnPrimary,
      pillClass: "ax-pill-available",
    };
  };

  const progressText = useMemo(() => {
    if (!questions?.length) return "";
    return `Question ${activeIndex + 1} / ${questions.length}`;
  }, [questions?.length, activeIndex]);

  const currentQ = questions?.[activeIndex];
  const currentMarks = getQMarks(currentQ);
  // ==============================
  // UI
  // ==============================
  return (
    <div style={sx.page} className="ax-page">
      <style>{`
        .dark .ax-page { color: #f3f4f6; }
        .dark .ax-card, .dark .ax-head-card, .dark .ax-exam-card { background: #111827 !important; border-color: #374151 !important; }
        .dark .ax-title, .dark .ax-card-title, .dark .ax-modal-title, .dark .ax-q-text, .dark .ax-q-label { color: #fff !important; }
        .dark .ax-sub, .dark .ax-muted-text, .dark .ax-meta-item, .dark .ax-timer-label { color: #9ca3af !important; }
        .dark .ax-timer-value { color: #fff !important; }
        .dark .ax-timer-box, .dark .ax-muted-block { background: #1f2937 !important; border-color: #374151 !important; }
        .dark .ax-select, .dark .ax-input, .dark .ax-textarea { background: #1f2937 !important; border-color: #4b5563 !important; color: #f3f4f6 !important; }
        
        /* Pills */
        .dark .ax-pill, .dark .ax-q-type, .dark .ax-marks-pill { background: #1f2937 !important; border-color: #374151 !important; color: #d1d5db !important; }
        .dark .ax-pill-available { background: #064e3b !important; border-color: #065f46 !important; color: #a7f3d0 !important; }
        .dark .ax-pill-locked { background: #1f2937 !important; border-color: #374151 !important; color: #9ca3af !important; }
        .dark .ax-pill-submitted { background: #1e3a8a !important; border-color: #1e40af !important; color: #bfdbfe !important; }
        .dark .ax-pill-absent { background: #7f1d1d !important; border-color: #991b1b !important; color: #fecaca !important; }

        .dark .ax-head-card { background: #111827 !important; border-color: #374151 !important; }
        .dark .ax-badge-soft { background: #1e293b !important; border-color: #334155 !important; color: #38bdf8 !important; }
        .dark .ax-divider { background: #374151 !important; }
        
        /* Buttons */
        .dark .ax-btn { background: #1f2937 !important; border-color: #374151 !important; color: #fff !important; }
        .dark .ax-btn-primary { background: #2563EB !important; border-color: #2563EB !important; color: #fff !important; }
        .dark .ax-btn-danger { background: #DC2626 !important; border-color: #DC2626 !important; color: #fff !important; }
        .dark .ax-btn-ghost { background: #111827 !important; color: #d1d5db !important; border-color: #374151 !important; }
        .dark .ax-btn-ghost:hover { background: #1f2937 !important; }
        .dark .ax-btn:disabled { opacity: 0.45 !important; }

        .dark .ax-q-btn { background: #111827 !important; border-color: #374151 !important; color: #9ca3af !important; }
        .dark .ax-q-btn-answered { background: #064e3b !important; border-color: #065f46 !important; color: #a7f3d0 !important; }
        .dark .ax-q-btn-active { border-color: #2563EB !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.2) !important; color: #fff !important; }
        .dark .ax-q-box { background: #1f2937 !important; border-color: #374151 !important; color: #f3f4f6 !important; }
        .dark .ax-opt-row { background: #111827 !important; border-color: #374151 !important; }
        .dark .ax-opt-row:hover { background: #1f2937 !important; }
        .dark .ax-opt-row.active { border-color: #2563EB !important; background: #1e3a8a33 !important; }
        .dark .ax-opt-key { background: #1f2937 !important; border-color: #374151 !important; color: #d1d5db !important; }
        .dark .ax-opt-text { color: #f3f4f6 !important; }
        .dark .ax-modal { background: #111827 !important; border-color: #374151 !important; }
        .dark .ax-modal-head { border-bottom-color: #374151 !important; }
        .dark .ax-empty { background: #111827 !important; border-color: #374151 !important; color: #9ca3af !important; }
      `}</style>
      {/* ===== TOAST ===== */}
      {toast && (
        <div
          style={{
            ...sx.toast,
            background: toast.type === "ok" ? "#027A48" : "#B42318",
          }}
        >
          <div style={{ fontWeight: 900 }}>
            {toast.type === "ok" ? "Success" : "Error"}
          </div>
          <div style={{ opacity: 0.95 }}>{toast.msg}</div>
          <button
            style={sx.toastX}
            onClick={() => setToast(null)}
            aria-label="close"
           id="attemptexam-button-1">
            ✕
          </button>
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div style={sx.header} className="ax-head-card">
        <div>
          <div style={sx.hTitle} className="ax-title">
            {attempt ? "Exam In Progress" : "Attempt Exam"}
          </div>
          <div style={sx.hSub} className="ax-sub">
            {attempt
              ? "Answer the questions and submit before time ends."
              : "Select your subject and attempt available exams."}
          </div>
        </div>

        {attempt ? (
          <div style={sx.timerBox} className="ax-timer-box">
            <div style={sx.timerLabel} className="ax-timer-label">Time Left</div>
            <div style={sx.timerValue} className="ax-timer-value">{formatMMSS(leftSec)}</div>
          </div>
        ) : (
          <div style={sx.badgeSoft} className="ax-badge-soft">Student</div>
        )}
      </div>

      {/* ===== MAIN BODY ===== */}
      {!attempt ? (
        <div style={sx.grid}>
          {/* LEFT */}
          <div style={sx.card} className="ax-card">
            <div style={sx.cardHead}>
              <div style={sx.cardTitle} className="ax-card-title">Subject</div>
              <div style={sx.cardHint} className="ax-sub">Choose your module/subject</div>
            </div>

            <label style={sx.label}>My Subjects</label>
            <select
              style={sx.select}
              className="ax-select"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              id="student-attempt-subject-select">
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>

            <div style={sx.divider} className="ax-divider" />

            <div style={sx.mutedBlock} className="ax-muted-block">
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Note</div>
              <div style={sx.mutedText} className="ax-muted-text">
                Attempt button enabled only within allowed time window. If you miss
                the window → Absent. If you submit → Submitted.
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={sx.card} className="ax-card">
            <div style={sx.cardHeadRow}>
              <div>
                <div style={sx.cardTitle} className="ax-card-title">Available Exams</div>
                <div style={sx.cardHint} className="ax-sub">Attempt to enter password and start.</div>
              </div>
              <div style={sx.pill} className="ax-pill">{exams.length} exams</div>
            </div>

            {exams.length === 0 ? (
              <div style={sx.empty} className="ax-empty">
                <div style={{ fontWeight: 900, marginBottom: 6 }}>No exams found</div>
                <div style={sx.mutedText} className="ax-muted-text">Try selecting a different subject.</div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {exams.map((e) => {
                  const ui = getExamUIState(e);

                  return (
                    <div key={e.id} style={sx.examCard} className="ax-exam-card">
                      <div style={sx.examTop}>
                        <div style={{ minWidth: 0 }}>
                          <div style={sx.examTitle} className="ax-card-title">{e.title}</div>
                          <div style={sx.examMeta} className="ax-meta-item">
                            <span style={sx.metaItem}>
                              <span style={sx.dot} /> Start: {fmtDT(e.start_at)}
                            </span>
                            <span style={sx.metaItem}>
                              <span style={sx.dot} /> Duration: {e.duration_minutes} mins
                            </span>
                            <span style={sx.metaItem}>
                              <span style={sx.dot} /> Late: {Number(e.late_minutes ?? 0)} mins
                            </span>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <span style={{ ...sx.statusPill, ...ui.pillStyle }} className={`ax-pill ${ui.pillClass}`}>
                            {ui.pillText}
                          </span>

                          <button
                            style={{ ...sx.btn, ...ui.btnStyle }}
                            className={`ax-btn ${ui.state === "available" ? "ax-btn-primary" : ""}`}
                            disabled={ui.disabled}
                            onClick={() => {
                              if (ui.disabled) return;
                              setActiveExam(e);
                              setPwdOpen(true);
                            }}
                           id={`student-attempt-exam-btn-${e.id}`}>
                            {ui.btnText}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={sx.grid2}>
          {/* LEFT: QUESTION NAV */}
          <div style={sx.card} className="ax-card">
            <div style={sx.cardHeadRow}>
              <div>
                <div style={sx.cardTitle} className="ax-card-title">{activeExam?.title}</div>
                <div style={sx.cardHint} className="ax-sub">{progressText}</div>
              </div>
              <span style={sx.pill} className="ax-pill">{questions.length} Q</span>
            </div>

            {questions.length === 0 ? (
              <div style={sx.empty} className="ax-empty">
                <div style={{ fontWeight: 900, marginBottom: 6 }}>No questions</div>
                <div style={sx.mutedText} className="ax-muted-text">Contact staff/admin to add questions.</div>
              </div>
            ) : (
              <div style={sx.qGrid}>
                {questions.map((q, idx) => {
                  const answered = answers[q.id] !== undefined && answers[q.id] !== "";
                  const active = idx === activeIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setActiveIndex(idx)}
                      className={`ax-q-btn ${active ? "ax-q-btn-active" : ""} ${answered ? "ax-q-btn-answered" : ""}`}
                      style={{
                        ...sx.qBtn,
                        ...(active ? sx.qBtnActive : {}),
                        ...(answered ? sx.qBtnAnswered : {}),
                      }}
                      title={answered ? "Answered" : "Not answered"}
                      id={`student-attempt-qindex-btn-${idx}`}>
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            )}

            <div style={sx.divider} className="ax-divider" />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                style={{ ...sx.btn, ...sx.btnGhost }}
                className="ax-btn-ghost"
                onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                disabled={questions.length === 0}
                id="student-attempt-prev-btn">
                ← Previous
              </button>

              <button
                style={{ ...sx.btn, ...sx.btnGhost }}
                className="ax-btn-ghost"
                onClick={() =>
                  setActiveIndex((i) => Math.min(questions.length - 1, i + 1))
                }
                disabled={questions.length === 0}
               id="student-attempt-next-btn">
                Next →
              </button>

              <button
                style={{ ...sx.btn, ...sx.btnDanger, marginLeft: "auto" }}
                className="ax-btn ax-btn-danger"
                onClick={() => submitNow(false)}
                disabled={questions.length === 0}
               id="student-attempt-submit-btn">
                Submit
              </button>
            </div>
          </div>

          {/* RIGHT: CURRENT QUESTION */}
          <div style={sx.card} className="ax-card">
            <div style={sx.cardHead}>
              <div style={sx.cardTitle} className="ax-card-title">Question</div>
              <div style={sx.cardHint} className="ax-sub">Select / type your answer</div>
            </div>

            {!currentQ ? (
              <div style={sx.empty} className="ax-empty">
                <div style={{ fontWeight: 900, marginBottom: 6 }}>No question</div>
                <div style={sx.mutedText} className="ax-muted-text">Choose a question number on the left.</div>
              </div>
            ) : (
              <>
                <div style={sx.qBox} className="ax-q-box">
                  <div style={sx.qLabel} className="ax-q-label">
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span>Q{activeIndex + 1}</span>
                      <span style={sx.qType} className="ax-q-type">
                        {String(currentQ.type || "").toUpperCase() || "QUESTION"}
                      </span>
                    </div>

                    {/* ✅ NEW: MARKS badge */}
                    <span style={sx.marksPill} title="Marks" className="ax-marks-pill">
                      {currentMarks} Marks
                    </span>
                  </div>

                  <div style={sx.qText} className="ax-q-text">{currentQ.question_text}</div>
                </div>

                {currentQ.type === "mcq" ? (
                  <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                    {["A", "B", "C", "D"].map((opt) =>
                      currentQ[`option_${opt.toLowerCase()}`] ? (
                        <label key={opt} style={sx.optRow} className="ax-opt-row">
                          <input
                            type="radio"
                            name={`ans_${currentQ.id}`}
                            checked={answers[currentQ.id] === opt}
                            onChange={() =>
                              setAnswers({
                                ...answers,
                                [currentQ.id]: opt,
                              })
                            }
                           id={`student-attempt-radio-${currentQ.id}-${opt}`}/>
                          <div style={{ display: "flex", gap: 10 }}>
                            <div style={sx.optKey} className="ax-opt-key">{opt}</div>
                            <div style={sx.optText} className="ax-opt-text">
                              {currentQ[`option_${opt.toLowerCase()}`]}
                            </div>
                          </div>
                        </label>
                      ) : null
                    )}
                  </div>
                ) : (
                  <div style={{ marginTop: 14 }}>
                    <label style={sx.label}>Your Answer</label>
                    <textarea
                      style={sx.textarea}
                      className="ax-textarea"
                      rows={6}
                      value={answers[currentQ.id] || ""}
                      onChange={(e) =>
                        setAnswers({
                          ...answers,
                          [currentQ.id]: e.target.value,
                        })
                      }
                      placeholder="Type your answer here..."
                     id={`student-attempt-textarea-${currentQ.id}`}/>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== PASSWORD MODAL ===== */}
      {pwdOpen && (
        <div
          style={sx.backdrop}
          onClick={busy ? undefined : () => setPwdOpen(false)}
        >
          <div style={sx.modal} className="ax-modal" onClick={(e) => e.stopPropagation()}>
            <div style={sx.modalHead}>
              <div>
                <div style={sx.modalTitle}>Enter Exam Password</div>
                <div style={sx.modalSub}>
                  {activeExam?.title
                    ? `Exam: ${activeExam.title}`
                    : "Enter password to start"}
                </div>
              </div>
              <button
                style={sx.iconBtn}
                onClick={() => setPwdOpen(false)}
                disabled={busy}
                aria-label="close"
               id="student-attempt-pwd-modal-close">
                ✕
              </button>
            </div>

            <div style={sx.modalBody}>
              <label style={sx.label}>Password</label>
              <input
                type="password"
                style={sx.input}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="Enter password..."
                autoFocus
               id="student-attempt-pwd-input"/>

              <div style={sx.modalActions}>
                <button
                  style={{ ...sx.btn, ...sx.btnGhost }}
                  onClick={() => setPwdOpen(false)}
                  disabled={busy}
                  id="student-attempt-pwd-modal-cancel">
                  Cancel
                </button>
                <button
                  style={{ ...sx.btn, ...sx.btnPrimary }}
                  className="ax-btn ax-btn-primary"
                  onClick={startExam}
                  disabled={busy || !pwd.trim()}
                 id="student-attempt-start-exam-btn">
                  {busy ? "Starting..." : "Start Exam"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   STYLES (UI ONLY)
========================= */
const sx = {
  page: { padding: 18, maxWidth: 1200, margin: "0 auto" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "flex-start",
    background: "#fff",
    border: "1px solid #E4E7EC",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,.04)",
    marginBottom: 14,
  },
  hTitle: { fontSize: 18, fontWeight: 1000, color: "#101828", letterSpacing: "-0.01em" },
  hSub: { marginTop: 4, color: "#667085", fontWeight: 700, fontSize: 12 },

  badgeSoft: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: 999,
    background: "#EFF8FF",
    border: "1px solid #B2DDFF",
    color: "#175CD3",
    fontWeight: 900,
    height: "fit-content",
  },
  timerBox: {
    minWidth: 150,
    border: "1px solid #E4E7EC",
    borderRadius: 14,
    padding: 12,
    background: "#FCFCFD",
  },
  timerLabel: { fontSize: 11, color: "#667085", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" },
  timerValue: { fontSize: 18, fontWeight: 1000, marginTop: 2, color: "#101828" },

  grid: { display: "grid", gridTemplateColumns: "360px 1fr", gap: 14 },
  grid2: { display: "grid", gridTemplateColumns: "380px 1fr", gap: 14 },

  card: {
    background: "#fff",
    border: "1px solid #E4E7EC",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,.04)",
  },
  cardHead: { marginBottom: 12 },
  cardHeadRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTitle: { fontWeight: 1000, fontSize: 15, color: "#101828", letterSpacing: "-0.01em" },
  cardHint: { marginTop: 4, fontSize: 12, color: "#667085", fontWeight: 700 },

  label: { display: "block", fontSize: 12, fontWeight: 900, color: "#344054", marginBottom: 6 },

  select: {
    width: "100%",
    border: "1px solid #E4E7EC",
    borderRadius: 12,
    padding: "8px 12px",
    outline: "none",
    fontWeight: 800,
    color: "#101828",
    background: "#fff",
    fontSize: 13,
  },
  input: {
    width: "100%",
    border: "1px solid #E4E7EC",
    borderRadius: 12,
    padding: "8px 12px",
    outline: "none",
    fontWeight: 800,
    color: "#101828",
    fontSize: 13,
  },
  textarea: {
    width: "100%",
    border: "1px solid #E4E7EC",
    borderRadius: 12,
    padding: 10,
    outline: "none",
    fontWeight: 700,
    color: "#101828",
    resize: "vertical",
    fontSize: 13,
  },

  divider: { height: 1, background: "#F2F4F7", margin: "14px 0" },
  mutedBlock: { background: "#FCFCFD", border: "1px solid #F2F4F7", borderRadius: 14, padding: 12 },
  mutedText: { color: "#667085", fontWeight: 700, fontSize: 12 },

  pill: {
    display: "inline-flex",
    alignItems: "center",
    height: 24,
    padding: "0 10px",
    borderRadius: 999,
    border: "1px solid #E4E7EC",
    background: "#FCFCFD",
    color: "#344054",
    fontWeight: 900,
    fontSize: 11,
    whiteSpace: "nowrap",
  },

  examCard: { border: "1px solid #E4E7EC", borderRadius: 14, padding: 12, background: "#fff" },
  examTop: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" },
  examTitle: { fontWeight: 1000, color: "#101828", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 520, letterSpacing: "-0.01em" },
  examMeta: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 },
  metaItem: { fontSize: 12, color: "#667085", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 99, background: "#98A2B3", display: "inline-block" },

  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    height: 24,
    padding: "0 10px",
    borderRadius: 999,
    border: "1px solid",
    fontWeight: 900,
    fontSize: 11,
    whiteSpace: "nowrap",
  },

  pillAvailable: { background: "#ECFDF3", borderColor: "#ABEFC6", color: "#027A48" },
  pillLocked: { background: "#F2F4F7", borderColor: "#E4E7EC", color: "#344054" },
  pillSubmitted: { background: "#EFF8FF", borderColor: "#B2DDFF", color: "#175CD3" },
  pillAbsent: { background: "#FEF3F2", borderColor: "#FECDCA", color: "#B42318" },

  btn: { border: "1px solid #E4E7EC", background: "#fff", padding: "8px 14px", borderRadius: 12, cursor: "pointer", fontWeight: 1000, fontSize: 13 },
  btnPrimary: { background: "#2563EB", borderColor: "#2563EB", color: "#fff" },
  btnGhost: { background: "#fff", color: "#101828" },
  btnDanger: { background: "#DC2626", borderColor: "#DC2626", color: "#fff" },
  btnDisabled: { opacity: 0.55, cursor: "not-allowed" },

  empty: { padding: 18, borderRadius: 14, background: "#FCFCFD", border: "1px dashed #E4E7EC", textAlign: "center" },

  qGrid: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 },
  qBtn: { border: "1px solid #E4E7EC", background: "#fff", borderRadius: 12, padding: "8px 0", fontWeight: 1000, cursor: "pointer", fontSize: 13 },
  qBtnActive: { borderColor: "#2563EB", boxShadow: "0 0 0 3px rgba(37,99,235,.12)" },
  qBtnAnswered: { background: "#ECFDF3", borderColor: "#ABEFC6" },

  qBox: { border: "1px solid #E4E7EC", background: "#FCFCFD", borderRadius: 14, padding: 12 },

  // ✅ changed: qLabel must align marks right
  qLabel: { fontWeight: 1000, color: "#101828", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  qType: { fontSize: 10, fontWeight: 1000, padding: "3px 8px", borderRadius: 999, border: "1px solid #E4E7EC", background: "#fff", color: "#344054", textTransform: "uppercase", letterSpacing: "0.05em" },

  // ✅ NEW: marks badge
  marksPill: {
    display: "inline-flex",
    alignItems: "center",
    height: 22,
    padding: "0 8px",
    borderRadius: 999,
    border: "1px solid #E4E7EC",
    background: "#FFFFFF",
    color: "#101828",
    fontWeight: 1000,
    fontSize: 10,
    whiteSpace: "nowrap",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  qText: { marginTop: 8, color: "#101828", fontWeight: 800, lineHeight: 1.6, fontSize: 15 },

  backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 14 },
  modal: { width: "min(520px, 100%)", background: "#fff", borderRadius: 16, border: "1px solid #E4E7EC", boxShadow: "0 25px 70px rgba(0,0,0,.25)", overflow: "hidden" },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, padding: 16, borderBottom: "1px solid #F2F4F7" },
  modalTitle: { fontWeight: 1000, fontSize: 15, color: "#101828", letterSpacing: "-0.01em" },
  modalSub: { marginTop: 4, color: "#667085", fontWeight: 700, fontSize: 12 },
  modalBody: { padding: 16 },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 },
  iconBtn: { border: "none", background: "transparent", cursor: "pointer", fontSize: 16, padding: 6 },

  optRow: { display: "flex", gap: 12, alignItems: "flex-start", padding: 10, borderRadius: 14, border: "1px solid #E4E7EC", cursor: "pointer", background: "#fff" },
  optKey: { width: 24, height: 24, borderRadius: 8, border: "1px solid #E4E7EC", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 1000, color: "#344054", background: "#FCFCFD", fontSize: 12 },
  optText: { fontWeight: 800, color: "#101828", lineHeight: 1.5, fontSize: 13 },

  toast: { position: "fixed", top: 18, right: 18, zIndex: 99999, color: "#fff", padding: "12px 14px", borderRadius: 16, minWidth: 280, maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,.22)", display: "flex", gap: 12, alignItems: "flex-start" },
  toastX: { marginLeft: "auto", border: "none", background: "rgba(255,255,255,.15)", color: "#fff", borderRadius: 10, width: 34, height: 34, cursor: "pointer", fontWeight: 1000 },
};