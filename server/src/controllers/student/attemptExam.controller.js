const db = require("../../config/db");
const bcrypt = require("bcryptjs");

const ok = (res, data) => res.json({ ok: true, data });
const bad = (res, message, code = 400) =>
  res.status(code).json({ ok: false, message });

/* =========================
   GET Allowed Subjects
========================= */
exports.listAllowedSubjects = (req, res) => {
  const studentId = req.user.id;

  const sql = `
    SELECT DISTINCT s.id, s.code, s.name, s.year, s.semester
    FROM subjects s
    JOIN exams e ON e.subject_id = s.id
    JOIN users u ON u.id = ?
    WHERE e.approval_status = 'approved'
      AND u.current_year = s.year 
      AND u.current_semester = s.semester
      AND NOT EXISTS (
        SELECT 1 FROM exam_allowed_students eas 
        WHERE eas.exam_id = e.id AND eas.student_id = u.id AND eas.status = 'revoked'
      )
  `;

  db.query(sql, [studentId], (err, rows) => {
    if (err) return bad(res, "DB error", 500);
    ok(res, rows);
  });
};

/* =========================
   GET Allowed Exams (by subject)
   ✅ add late_minutes for UI window
   ✅ add latest attempt_status for this student (submitted / in_progress)
   ✅ DO NOT change logic - only extra fields
========================= */
exports.listAllowedExamsBySubject = (req, res) => {
  const studentId = req.user.id;
  const { subjectId } = req.params;

  const sql = `
    SELECT 
      e.id, e.title, e.start_at, e.end_at, e.duration_minutes,
      COALESCE(eqs.late_minutes, 0) AS late_minutes,

      -- ✅ latest attempt status for THIS student + exam
      la.status AS attempt_status,
      la.started_at AS last_started_at,
      la.submitted_at AS last_submitted_at

    FROM exams e
    JOIN subjects s ON s.id = e.subject_id
    JOIN users u ON u.id = ?
    LEFT JOIN exam_quiz_settings eqs ON eqs.exam_id = e.id

    -- ✅ latest attempt row per exam for this student (using MAX(id))
    LEFT JOIN (
      SELECT a.exam_id, a.status, a.started_at, a.submitted_at
      FROM exam_attempts a
      JOIN (
        SELECT exam_id, MAX(id) AS max_id
        FROM exam_attempts
        WHERE student_id = ?
        GROUP BY exam_id
      ) x ON x.max_id = a.id
      WHERE a.student_id = ?
    ) la ON la.exam_id = e.id

    WHERE e.subject_id = ?
      AND e.approval_status = 'approved'
      AND u.current_year = s.year
      AND u.current_semester = s.semester
      AND (SELECT COUNT(*) FROM questions q WHERE q.exam_id=e.id) > 0
      AND NOT EXISTS (
        SELECT 1 FROM exam_allowed_students eas 
        WHERE eas.exam_id = e.id AND eas.student_id = u.id AND eas.status = 'revoked'
      )
  `;

  // ✅ studentId used 3 times + subjectId
  db.query(sql, [studentId, studentId, studentId, subjectId], (err, rows) => {
    if (err) return bad(res, "DB error", 500);
    ok(res, rows);
  });
};

/* =========================
   GET ALL Approved Exam Notices (Unified)
   ========================= */
exports.listAllApprovedExams = (req, res) => {
  const studentId = req.user.id;

  const sql = `
    SELECT 
      e.id, e.title, e.start_at, e.end_at, e.duration_minutes, e.total_marks, e.pass_marks, e.description,
      s.name AS subject_name, s.code AS subject_code, s.year, s.semester,
      COALESCE(eqs.late_minutes, 0) AS late_minutes
    FROM exams e
    JOIN subjects s ON s.id = e.subject_id
    JOIN users u ON u.id = ?
    LEFT JOIN exam_quiz_settings eqs ON eqs.exam_id = e.id
    WHERE e.approval_status = 'approved'
      AND u.current_year = s.year
      AND u.current_semester = s.semester
      AND NOT EXISTS (
        SELECT 1 FROM exam_allowed_students eas 
        WHERE eas.exam_id = e.id AND eas.student_id = u.id AND eas.status = 'revoked'
      )
    ORDER BY e.start_at ASC
  `;

  db.query(sql, [studentId], (err, rows) => {
    if (err) return bad(res, "DB error", 500);
    ok(res, rows);
  });
};

/* =========================
   START Exam (Password)
========================= */
exports.startExam = (req, res) => {
  const studentId = req.user.id;
  const { examId } = req.params;
  const password = String(req.body?.password || "").trim();

  if (!password) return bad(res, "Password required");

  const sql = `
    SELECT e.*, eqs.quiz_password_hash
    FROM exams e
    JOIN subjects s ON s.id = e.subject_id
    JOIN users u ON u.id = ?
    LEFT JOIN exam_quiz_settings eqs ON eqs.exam_id = e.id
    WHERE e.id = ? 
      AND e.approval_status = 'approved'
      AND u.current_year = s.year 
      AND u.current_semester = s.semester
      AND NOT EXISTS (
        SELECT 1 FROM exam_allowed_students eas 
        WHERE eas.exam_id = e.id AND eas.student_id = u.id AND eas.status = 'revoked'
      )
    LIMIT 1
  `;

  db.query(sql, [studentId, examId], (err, rows) => {
    if (err) return bad(res, "DB error", 500);
    if (!rows.length) return bad(res, "Not allowed", 403);

    const exam = rows[0];

    if (!exam.quiz_password_hash) return bad(res, "Quiz password not set");

    const passOk = bcrypt.compareSync(password, exam.quiz_password_hash);
    if (!passOk) return bad(res, "Invalid password", 401);

    // ✅ Optional: prevent multiple active attempts for same exam
    const checkAttemptSql = `
      SELECT id FROM exam_attempts
      WHERE exam_id=? AND student_id=? AND status='in_progress'
      ORDER BY id DESC LIMIT 1
    `;
    db.query(checkAttemptSql, [examId, studentId], (e0, arows) => {
      if (e0) return bad(res, "DB error", 500);
      if (arows.length) {
        // already started
        const getSql = `
          SELECT id, must_end_at
          FROM exam_attempts
          WHERE exam_id=? AND student_id=? AND status='in_progress'
          ORDER BY id DESC LIMIT 1
        `;
        return db.query(getSql, [examId, studentId], (e1, rr) => {
          if (e1) return bad(res, "DB error", 500);
          return ok(res, {
            message: "Exam already started",
            attempt_id: rr[0].id,
            must_end_at: rr[0].must_end_at,
          });
        });
      }

      // create attempt
      const now = new Date();
      const mustEnd = new Date(
        now.getTime() + Number(exam.duration_minutes) * 60000
      );

      const insertSql = `
        INSERT INTO exam_attempts (exam_id, student_id, started_at, must_end_at, status)
        VALUES (?, ?, NOW(), ?, 'in_progress')
      `;

      db.query(insertSql, [examId, studentId, mustEnd], (e2, r2) => {
        if (e2) return bad(res, "DB error", 500);

        ok(res, {
          message: "Exam started",
          attempt_id: r2.insertId,
          must_end_at: mustEnd,
        });
      });
    });
  });
};

/* =========================
   GET Questions (after start)
   ✅ only if attempt is in_progress
========================= */
exports.getQuestions = (req, res) => {
  const studentId = req.user.id;
  const { examId } = req.params;

  const attemptSql = `
    SELECT id, must_end_at, status
    FROM exam_attempts
    WHERE exam_id=? AND student_id=?
    ORDER BY id DESC
    LIMIT 1
  `;

  db.query(attemptSql, [examId, studentId], (err, rows) => {
    if (err) return bad(res, "DB error", 500);
    if (!rows.length)
      return bad(res, "No attempt found. Start exam first.", 400);

    const attempt = rows[0];

    if (attempt.status !== "in_progress") {
      return bad(res, "Attempt not in progress", 400);
    }

    // ✅ time validation
    const now = new Date();
    const mustEnd = new Date(attempt.must_end_at);
    if (now > mustEnd) {
      return bad(res, "Time over. Submit exam.", 400);
    }

    const qSql = `
      SELECT *
      FROM questions
      WHERE exam_id=?
      ORDER BY id ASC
    `;

    db.query(qSql, [examId], (e2, qrows) => {
      if (e2) return bad(res, "DB error", 500);

      ok(res, {
        attempt_id: attempt.id,
        must_end_at: attempt.must_end_at,
        questions: qrows || [],
      });
    });
  });
};

/* =========================
   SUBMIT Exam
   ✅ NEW: Save answers into exam_attempt_answers
   ✅ THEN mark attempt as submitted
========================= */
exports.submitExam = (req, res) => {
  const studentId = req.user.id;
  const { examId } = req.params;

  // frontend sends: { answers: [ { question_id, value } ], is_auto }
  const incoming = Array.isArray(req.body?.answers) ? req.body.answers : [];

  // 1) find current in_progress attempt
  const getAttemptSql = `
    SELECT id
    FROM exam_attempts
    WHERE exam_id=? AND student_id=? AND status='in_progress'
    ORDER BY id DESC
    LIMIT 1
  `;

  db.query(getAttemptSql, [examId, studentId], (e0, arows) => {
    if (e0) return bad(res, "DB error", 500);
    if (!arows.length) return bad(res, "No active attempt", 400);

    const attemptId = arows[0].id;

    // start transaction (safe)
    db.beginTransaction((txErr) => {
      if (txErr) return bad(res, "DB error", 500);

      const doRollback = (msg = "DB error") =>
        db.rollback(() => bad(res, msg, 500));

      // 2) save answers (if any)
      const saveAnswers = (cb) => {
        if (!incoming.length) return cb(); // allow submit even if empty (auto submit)

        // build multi insert rows
        const rows = [];
        for (const a of incoming) {
          const qid = Number(a?.question_id);
          const val = a?.value;

          if (!qid) continue;
          if (val === undefined || val === null) continue;

          const v = String(val).trim();
          if (!v) continue;

          // if MCQ like A/B/C/D => selected_option else answer_text
          const isMcqOpt = ["A", "B", "C", "D"].includes(v);
          rows.push([
            attemptId,
            Number(examId),
            qid,
            isMcqOpt ? v : null,
            isMcqOpt ? null : v,
          ]);
        }

        if (!rows.length) return cb();

        const insSql = `
          INSERT INTO exam_attempt_answers
            (attempt_id, exam_id, question_id, selected_option, answer_text)
          VALUES ?
          ON DUPLICATE KEY UPDATE
            selected_option=VALUES(selected_option),
            answer_text=VALUES(answer_text),
            updated_at=CURRENT_TIMESTAMP
        `;

        db.query(insSql, [rows], (e1) => {
          if (e1) return doRollback("DB error (save answers)");
          cb();
        });
      };

      // 3) mark attempt as submitted
      const markSubmit = () => {
        const updSql = `
          UPDATE exam_attempts
          SET status='submitted', submitted_at=NOW()
          WHERE id=? AND status='in_progress'
        `;

        db.query(updSql, [attemptId], (e2, r2) => {
          if (e2) return doRollback("DB error (submit)");
          if (!r2.affectedRows) return doRollback("Submit failed");

          db.commit((e3) => {
            if (e3) return doRollback("DB error (commit)");
            ok(res, { message: "Submitted" });
          });
        });
      };

      saveAnswers(markSubmit);
    });
  });
};