const db = require("../../config/db");

/** Helper: mysql query promise */
function q(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

function nowMs() {
  return Date.now();
}

function normalizeText(s) {
  return String(s || "").trim().toLowerCase();
}

function passFail(total, passMarks) {
  const t = Number(total || 0);
  const p = Number(passMarks || 0);
  return t >= p ? "PASS" : "FAIL";
}

async function getLateMinutes(examId) {
  const rows = await q(
    `SELECT late_minutes FROM exam_quiz_settings WHERE exam_id = ? LIMIT 1`,
    [examId]
  );
  return rows.length ? Number(rows[0].late_minutes || 0) : 0;
}

function computeExpiry(exam, lateMinutes) {
  const start = new Date(exam.start_at).getTime();
  const durationMs = Number(exam.duration_minutes || 0) * 60000;
  const lateMs = Number(lateMinutes || 0) * 60000;
  return start + durationMs + lateMs;
}

/**
 * GET /api/staff/subjects
 * subject_staffs(staff_id, subject_id)
 */
exports.listStaffSubjects = async (req, res) => {
  try {
    const staffId = req.user.id;

    const rows = await q(
      `
      SELECT s.id, s.code, s.name
      FROM subject_staffs ss
      JOIN subjects s ON s.id = ss.subject_id
      WHERE ss.staff_id = ?
      ORDER BY s.code ASC
      `,
      [staffId]
    );

    return res.json({ ok: true, data: rows });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
};

/**
 * GET /api/staff/subjects/:subjectId/exams
 */
exports.listStaffExamsBySubject = async (req, res) => {
  try {
    const staffId = req.user.id;
    const subjectId = Number(req.params.subjectId);

    const rows = await q(
      `
      SELECT id, subject_id, created_by_staff_id, title, start_at, end_at,
             duration_minutes, total_marks, pass_marks, approval_status
      FROM exams
      WHERE subject_id = ? AND created_by_staff_id = ?
      ORDER BY start_at DESC
      `,
      [subjectId, staffId]
    );

    return res.json({ ok: true, data: rows });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
};

/**
 * POST /api/staff/exams/:examId/auto-grade
 */
exports.autoGradeExam = async (req, res) => {
  try {
    const staffId = req.user.id;
    const examId = Number(req.params.examId);

    const examRows = await q(
      `SELECT id, created_by_staff_id FROM exams WHERE id = ? LIMIT 1`,
      [examId]
    );
    if (!examRows.length)
      return res.status(404).json({ ok: false, message: "Exam not found" });

    if (Number(examRows[0].created_by_staff_id) !== Number(staffId)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const attempts = await q(
      `SELECT id FROM exam_attempts WHERE exam_id = ? AND status = 'submitted'`,
      [examId]
    );

    if (!attempts.length) {
      return res.json({ ok: true, message: "No submitted attempts to grade" });
    }

    for (const at of attempts) {
      const attemptId = at.id;

      const answers = await q(
        `
        SELECT ea.id AS ans_id,
               ea.question_id,
               ea.selected_option,
               ea.answer_text AS student_text,
               q.question_type,
               q.correct_option,
               q.answer_text AS correct_text,
               q.marks
        FROM exam_attempt_answers ea
        JOIN questions q ON q.id = ea.question_id
        WHERE ea.exam_id = ? AND ea.attempt_id = ?
        `,
        [examId, attemptId]
      );

      for (const a of answers) {
        const qType = String(a.question_type || "").toUpperCase();
        let isCorrect = 0;

        if (qType === "MCQ") {
          isCorrect =
            String(a.selected_option || "").trim().toUpperCase() ===
            String(a.correct_option || "").trim().toUpperCase()
              ? 1
              : 0;
        } else if (qType === "ONE_WORD") {
          isCorrect =
            normalizeText(a.student_text) === normalizeText(a.correct_text)
              ? 1
              : 0;
        } else {
          isCorrect = 0;
        }

        const marksAwarded = isCorrect ? Number(a.marks || 0) : 0;

        await q(
          `
          UPDATE exam_attempt_answers
          SET is_correct = ?, marks_awarded = ?, updated_at = NOW()
          WHERE id = ?
          `,
          [isCorrect, marksAwarded, a.ans_id]
        );
      }
    }

    return res.json({ ok: true, message: "Auto grading completed" });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
};

/**
 * GET /api/staff/exams/:examId/results
 * ✅ Supports:
 *   - ?student_id=14   (optional)
 *   - ?student_email=student@gmail.com  ✅ NEW
 */
exports.getExamResults = async (req, res) => {
  try {
    const staffId = req.user.id;
    const examId = Number(req.params.examId);

    // ✅ NEW: email filter
    const studentIdFilter = String(req.query.student_id || "").trim();
    const studentEmailFilter = String(req.query.student_email || "").trim();

    const examRows = await q(
      `
      SELECT id, created_by_staff_id, title, start_at,
             duration_minutes, total_marks, pass_marks
      FROM exams
      WHERE id = ? LIMIT 1
      `,
      [examId]
    );
    if (!examRows.length)
      return res.status(404).json({ ok: false, message: "Exam not found" });

    const exam = examRows[0];

    if (Number(exam.created_by_staff_id) !== Number(staffId)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const lateMinutes = await getLateMinutes(examId);
    const expiryMs = computeExpiry(exam, lateMinutes);
    const isExpired = nowMs() > expiryMs;

    // ✅ Allowed students (filter by id OR email)
    const params = [examId];
    let extraWhere = "";

    if (studentIdFilter) {
      extraWhere += " AND eas.student_id = ? ";
      params.push(studentIdFilter);
    }

    if (studentEmailFilter) {
      // exact match (recommended)
      extraWhere += " AND u.email = ? ";
      params.push(studentEmailFilter);
    }

    const allowed = await q(
      `
      SELECT eas.student_id,
             u.name AS student_name,
             u.email AS student_email
      FROM exam_allowed_students eas
      LEFT JOIN users u ON u.id = eas.student_id
      WHERE eas.exam_id = ?
      ${extraWhere}
      ORDER BY eas.student_id ASC
      `,
      params
    );

    const rows = [];

    for (const st of allowed) {
      const sid = st.student_id;

      const atRows = await q(
        `
        SELECT id, status, submitted_at
        FROM exam_attempts
        WHERE exam_id = ? AND student_id = ?
        ORDER BY submitted_at DESC, id DESC
        LIMIT 1
        `,
        [examId, sid]
      );

      if (
        !atRows.length ||
        String(atRows[0].status || "").toLowerCase() !== "submitted"
      ) {
        if (isExpired) {
          rows.push({
            exam_id: examId,
            student_id: sid,
            student_email: st.student_email || null, // ✅ NEW field
            student_name: st.student_name || "-",
            total_marks: "AB",
            status: "ABSENT",
            can_edit: false,
          });
        } else {
          rows.push({
            exam_id: examId,
            student_id: sid,
            student_email: st.student_email || null, // ✅ NEW field
            student_name: st.student_name || "-",
            total_marks: "-",
            status: "PENDING",
            can_edit: false,
          });
        }
        continue;
      }

      const attemptId = atRows[0].id;

      const sumRows = await q(
        `
        SELECT COALESCE(SUM(COALESCE(marks_awarded,0)),0) AS total
        FROM exam_attempt_answers
        WHERE exam_id = ? AND attempt_id = ?
        `,
        [examId, attemptId]
      );
      const computedTotal = Number(sumRows[0]?.total || 0);

      const ovRows = await q(
        `
        SELECT total_marks
        FROM exam_result_overrides
        WHERE exam_id = ? AND student_id = ?
        LIMIT 1
        `,
        [examId, sid]
      );

      const finalTotal = ovRows.length
        ? Number(ovRows[0].total_marks || 0)
        : computedTotal;

      rows.push({
        exam_id: examId,
        attempt_id: attemptId,
        student_id: sid,
        student_email: st.student_email || null, // ✅ NEW field
        student_name: st.student_name || "-",
        total_marks: finalTotal,
        status: passFail(finalTotal, exam.pass_marks),
        can_edit: true,
      });
    }

    return res.json({
      ok: true,
      data: {
        exam: {
          id: exam.id,
          title: exam.title,
          pass_marks: exam.pass_marks,
          total_marks: exam.total_marks,
          start_at: exam.start_at,
          duration_minutes: exam.duration_minutes,
          late_minutes: lateMinutes,
        },
        rows,
      },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
};

/**
 * PUT /api/staff/exams/:examId/results/update
 * body: { student_id, total_marks }
 */
exports.updateTotalMarks = async (req, res) => {
  try {
    const staffId = req.user.id;
    const examId = Number(req.params.examId);
    const student_id = String(req.body.student_id || "").trim();
    const total_marks = Number(req.body.total_marks);

    if (!student_id)
      return res.status(400).json({ ok: false, message: "student_id required" });

    if (!Number.isFinite(total_marks))
      return res
        .status(400)
        .json({ ok: false, message: "total_marks must be a number" });

    const examRows = await q(
      `SELECT id, created_by_staff_id FROM exams WHERE id = ? LIMIT 1`,
      [examId]
    );
    if (!examRows.length)
      return res.status(404).json({ ok: false, message: "Exam not found" });

    if (Number(examRows[0].created_by_staff_id) !== Number(staffId)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    await q(
      `
      INSERT INTO exam_result_overrides (exam_id, student_id, total_marks, updated_by_staff_id)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        total_marks = VALUES(total_marks),
        updated_by_staff_id = VALUES(updated_by_staff_id),
        updated_at = NOW()
      `,
      [examId, Number(student_id), total_marks, staffId]
    );

    return res.json({ ok: true, message: "Marks override saved" });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
};

/**
 * GET /api/staff/exams/:examId/results/:studentId/details
 * Fetches granular question-by-question answers for staff review
 */
exports.getAttemptDetails = async (req, res) => {
  try {
    const staffId = req.user.id;
    const examId = Number(req.params.examId);
    const studentId = Number(req.params.studentId);

    // 1. Verify staff owns the exam
    const examRows = await q(
      `SELECT id, created_by_staff_id, title FROM exams WHERE id = ? LIMIT 1`,
      [examId]
    );
    if (!examRows.length) {
      return res.status(404).json({ ok: false, message: "Exam not found" });
    }
    if (Number(examRows[0].created_by_staff_id) !== Number(staffId)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    // 2. Find latest submitted attempt for this student
    const atRows = await q(
      `
      SELECT id 
      FROM exam_attempts 
      WHERE exam_id = ? AND student_id = ? AND status = 'submitted'
      ORDER BY submitted_at DESC LIMIT 1
      `,
      [examId, studentId]
    );

    if (!atRows.length) {
      return res.status(404).json({ ok: false, message: "No submitted attempt found" });
    }
    const attemptId = atRows[0].id;

    // 3. Get questions + student answers
    const details = await q(
      `
      SELECT 
        q.question_no,
        q.question_text,
        q.question_type,
        q.correct_option,
        q.answer_text AS correct_text,
        q.marks AS max_marks,
        ea.selected_option,
        ea.answer_text AS student_text,
        ea.is_correct,
        ea.marks_awarded
      FROM questions q
      LEFT JOIN exam_attempt_answers ea ON ea.question_id = q.id AND ea.attempt_id = ?
      WHERE q.exam_id = ?
      ORDER BY q.question_no ASC
      `,
      [attemptId, examId]
    );

    return res.json({ ok: true, data: details });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
};

/**
 * GET /api/staff/exams/:examId/analysis
 * Detailed analysis for an exam
 */
exports.getExamAnalysis = async (req, res) => {
  try {
    const staffId = req.user.id;
    const examId = Number(req.params.examId);

    // 1. Verify staff owns the exam
    const examRows = await q(
      `SELECT id, created_by_staff_id, title, total_marks, pass_marks FROM exams WHERE id = ? LIMIT 1`,
      [examId]
    );
    if (!examRows.length) return res.status(404).json({ ok: false, message: "Exam not found" });
    const exam = examRows[0];
    if (Number(exam.created_by_staff_id) !== Number(staffId)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    // 2. Get total allowed students
    const allowedRows = await q(
      `SELECT COUNT(*) AS total FROM exam_allowed_students WHERE exam_id = ?`,
      [examId]
    );
    const totalStudents = Number(allowedRows[0].total || 0);

    // 3. Get all submitted attempts with final marks (considering overrides)
    const attempts = await q(
      `
      SELECT 
        ea.student_id,
        COALESCE(ero.total_marks, sub.auto_total) AS final_marks
      FROM exam_attempts ea
      LEFT JOIN (
        SELECT attempt_id, SUM(marks_awarded) as auto_total 
        FROM exam_attempt_answers 
        GROUP BY attempt_id
      ) sub ON sub.attempt_id = ea.id
      LEFT JOIN exam_result_overrides ero ON ero.exam_id = ea.exam_id AND ero.student_id = ea.student_id
      WHERE ea.exam_id = ? AND ea.status = 'submitted'
      `,
      [examId]
    );

    const attendedCount = attempts.length;
    const absentCount = Math.max(0, totalStudents - attendedCount);
    
    let highestMark = 0;
    let passCount = 0;
    const distribution = {
      "0-40": 0,
      "40-60": 0,
      "60-80": 0,
      "80-100": 0
    };

    attempts.forEach(at => {
      const marks = Number(at.final_marks || 0);
      if (marks > highestMark) highestMark = marks;
      if (marks >= exam.pass_marks) passCount++;

      // Distribution as percentage
      const percentage = exam.total_marks > 0 ? (marks / exam.total_marks) * 100 : 0;
      if (percentage < 40) distribution["0-40"]++;
      else if (percentage < 60) distribution["40-60"]++;
      else if (percentage < 80) distribution["60-80"]++;
      else distribution["80-100"]++;
    });

    const passPercentage = attendedCount > 0 ? ((passCount / attendedCount) * 100).toFixed(2) : 0;

    return res.json({
      ok: true,
      data: {
        examTitle: exam.title,
        totalMarks: exam.total_marks,
        passMarks: exam.pass_marks,
        totalStudents,
        attendedCount,
        absentCount,
        highestMark,
        passPercentage,
        distribution
      }
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
};