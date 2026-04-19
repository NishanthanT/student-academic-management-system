const db = require("../../config/db"); // உங்க db connection path adjust பண்ணு

// helper: promise wrapper
const q = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

// ✅ Security check: exam approved + staff assigned subject
async function assertStaffCanEditExam({ examId, staffId }) {
  const exams = await q(
    `SELECT id, subject_id, total_marks, approval_status
     FROM exams
     WHERE id = ? LIMIT 1`,
    [examId]
  );

  if (!exams.length) {
    const err = new Error("Exam not found");
    err.status = 404;
    throw err;
  }

  const exam = exams[0];

  if (String(exam.approval_status).toLowerCase() !== "approved") {
    const err = new Error("Only approved exams can have questions");
    err.status = 403;
    throw err;
  }

  // subject_staffs table check (adjust table/column names)
  const assigned = await q(
    `SELECT 1
     FROM subject_staffs
     WHERE subject_id = ? AND staff_id = ?
     LIMIT 1`,
    [exam.subject_id, staffId]
  );

  if (!assigned.length) {
    const err = new Error("You are not assigned to this subject");
    err.status = 403;
    throw err;
  }

  return exam; // includes total_marks
}

function validateRow(r) {
  const errors = [];

  if (!r.question_no || Number(r.question_no) < 1) errors.push("question_no invalid");
  if (!r.question_text || !String(r.question_text).trim()) errors.push("question_text required");

  const marks = Number(r.marks);
  if (!Number.isInteger(marks) || marks <= 0) errors.push("marks must be positive integer");

  const type = String(r.question_type || "MCQ").toUpperCase();
  if (!["MCQ", "ONE_WORD"].includes(type)) errors.push("question_type invalid");

  if (type === "MCQ") {
    const opt = r.options || {};
    const A = (opt.A ?? r.option_a ?? "").toString().trim();
    const B = (opt.B ?? r.option_b ?? "").toString().trim();
    const C = (opt.C ?? r.option_c ?? "").toString().trim();
    const D = (opt.D ?? r.option_d ?? "").toString().trim();
    const correct = (r.correct ?? r.correct_option ?? "").toString().toUpperCase();

    if (!A) errors.push("option A required");
    if (!B) errors.push("option B required");
    if (!C) errors.push("option C required");
    if (!D) errors.push("option D required");
    if (!["A", "B", "C", "D"].includes(correct)) errors.push("correct option required");

    if (correct) {
      const map = { A, B, C, D };
      if (!map[correct]) errors.push("correct option text empty");
    }
  }

  if (type === "ONE_WORD") {
    const ans = (r.answer_text ?? r.answer ?? "").toString().trim();
    if (!ans) errors.push("answer required");
    if (ans.includes(" ")) errors.push("one word only (no spaces)");
  }

  return errors;
}

exports.getQuestionsByExam = async (req, res) => {
  try {
    const staffId = req.user.id;
    const examId = Number(req.params.examId);

    await assertStaffCanEditExam({ examId, staffId });

    const rows = await q(
      `SELECT id, exam_id, question_no, question_type, question_text, marks,
              option_a, option_b, option_c, option_d, correct_option,
              answer_text, created_at, updated_at
       FROM questions
       WHERE exam_id = ?
       ORDER BY question_no ASC`,
      [examId]
    );

    return res.json({ ok: true, data: rows });
  } catch (e) {
    return res.status(e.status || 500).json({ ok: false, message: e.message || "Server error" });
  }
};

exports.bulkUpsertQuestions = async (req, res) => {
  const conn = db; // same connection (if you have pool.getConnection, use transaction properly)

  try {
    const staffId = req.user.id;
    const examId = Number(req.params.examId);

    const exam = await assertStaffCanEditExam({ examId, staffId });

    const questions = Array.isArray(req.body.questions) ? req.body.questions : [];
    if (!questions.length) {
      return res.status(400).json({ ok: false, message: "No questions provided" });
    }

    // ✅ Validate each row
    const allErrors = [];
    for (const r of questions) {
      const errs = validateRow(r);
      if (errs.length) {
        allErrors.push({ question_no: r.question_no, errors: errs });
      }
    }
    if (allErrors.length) {
      return res.status(400).json({ ok: false, message: "Validation failed", errors: allErrors });
    }

    // ✅ Total marks check (MUST match exam.total_marks)
    const total = questions.reduce((s, r) => s + Number(r.marks || 0), 0);
    if (Number(total) !== Number(exam.total_marks)) {
      return res.status(400).json({
        ok: false,
        message: `Total marks mismatch: current ${total}, expected ${exam.total_marks}`,
      });
    }

    // ✅ Upsert (by unique key exam_id + question_no)
    // NOTE: this uses ON DUPLICATE KEY UPDATE
    for (const r of questions) {
      const type = String(r.question_type || "MCQ").toUpperCase();

      const opt = r.options || {};
      const A = type === "MCQ" ? (opt.A ?? "").toString().trim() : null;
      const B = type === "MCQ" ? (opt.B ?? "").toString().trim() : null;
      const C = type === "MCQ" ? (opt.C ?? "").toString().trim() : null;
      const D = type === "MCQ" ? (opt.D ?? "").toString().trim() : null;
      const correct = type === "MCQ" ? (r.correct ?? "").toString().toUpperCase() : null;

      const answer = type === "ONE_WORD" ? (r.answer_text ?? "").toString().trim() : null;

      await q(
        `INSERT INTO questions
          (exam_id, question_no, question_type, question_text, marks,
           option_a, option_b, option_c, option_d, correct_option,
           answer_text, created_by_staff_id)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           question_type=VALUES(question_type),
           question_text=VALUES(question_text),
           marks=VALUES(marks),
           option_a=VALUES(option_a),
           option_b=VALUES(option_b),
           option_c=VALUES(option_c),
           option_d=VALUES(option_d),
           correct_option=VALUES(correct_option),
           answer_text=VALUES(answer_text),
           updated_at=CURRENT_TIMESTAMP`,
        [
          examId,
          Number(r.question_no),
          type,
          String(r.question_text).trim(),
          Number(r.marks),
          A,
          B,
          C,
          D,
          correct,
          answer,
          staffId,
        ]
      );
    }

    return res.json({ ok: true, message: "Questions saved" });
  } catch (e) {
    return res.status(e.status || 500).json({ ok: false, message: e.message || "Server error" });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const staffId = req.user.id;
    const qid = Number(req.params.questionId);

    const qs = await q(`SELECT id, exam_id FROM questions WHERE id = ? LIMIT 1`, [qid]);
    if (!qs.length) return res.status(404).json({ ok: false, message: "Question not found" });

    // security: staff can edit that exam?
    await assertStaffCanEditExam({ examId: qs[0].exam_id, staffId });

    await q(`DELETE FROM questions WHERE id = ?`, [qid]);

    return res.json({ ok: true, message: "Deleted" });
  } catch (e) {
    return res.status(e.status || 500).json({ ok: false, message: e.message || "Server error" });
  }
};