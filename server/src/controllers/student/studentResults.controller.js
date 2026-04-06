// server/src/controllers/student/studentResults.controller.js
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
 * GET /api/student/subjects
 * Student allowed subjects list (from exam_allowed_students -> exams -> subjects)
 */
exports.listAllowedSubjects = async (req, res) => {
  try {
    const studentId = req.user.id;

    const rows = await q(
      `
      SELECT DISTINCT s.id, s.code, s.name
      FROM subjects s
      JOIN exams e ON e.subject_id = s.id
      JOIN users u ON u.id = ?
      WHERE (
        (u.current_year = s.year AND u.current_semester = s.semester)
        OR EXISTS (
          SELECT 1 FROM exam_allowed_students eas 
          WHERE eas.exam_id = e.id AND eas.student_id = u.id AND eas.status = 'allowed'
        )
      )
      AND NOT EXISTS (
        SELECT 1 FROM exam_allowed_students eas 
        WHERE eas.exam_id = e.id AND eas.student_id = u.id AND eas.status = 'revoked'
      )
      ORDER BY s.code ASC
      `,
      [studentId]
    );

    return res.json({ ok: true, data: rows });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
};

/**
 * GET /api/student/subjects/:subjectId/exams
 * Student allowed exams under this subject
 */
exports.listAllowedExamsBySubject = async (req, res) => {
  try {
    const studentId = req.user.id;
    const subjectId = Number(req.params.subjectId);

    const rows = await q(
      `
      SELECT DISTINCT e.id, e.subject_id, e.title, e.start_at, e.end_at,
             e.duration_minutes, e.total_marks, e.pass_marks, e.approval_status
      FROM exams e
      JOIN subjects s ON s.id = e.subject_id
      JOIN users u ON u.id = ?
      WHERE e.subject_id = ?
        AND (
          (u.current_year = s.year AND u.current_semester = s.semester)
          OR EXISTS (
            SELECT 1 FROM exam_allowed_students eas 
            WHERE eas.exam_id = e.id AND eas.student_id = u.id AND eas.status = 'allowed'
          )
        )
        AND NOT EXISTS (
          SELECT 1 FROM exam_allowed_students eas 
          WHERE eas.exam_id = e.id AND eas.student_id = u.id AND eas.status = 'revoked'
        )
      ORDER BY e.start_at DESC
      `,
      [studentId, subjectId]
    );

    return res.json({ ok: true, data: rows });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
};

/**
 * GET /api/student/exams/:examId/result
 * Returns ONLY logged-in student's result for the exam.
 *
 * Response:
 * { ok:true, data:{ exam:{...}, result:{ total_marks, status, attempt_status, is_expired } } }
 *
 * Logic:
 * - If submitted attempt => sum(marks_awarded) then override (exam_result_overrides) if exists
 * - Else if expired => ABSENT
 * - Else => PENDING
 */
exports.getMyExamResult = async (req, res) => {
  try {
    const studentId = req.user.id;
    const examId = Number(req.params.examId);

    // ✅ ensure this student is allowed for this exam (Inclusive)
    const allowedRows = await q(
      `
      SELECT 1 FROM exams e
      JOIN subjects s ON s.id = e.subject_id
      JOIN users u ON u.id = ?
      WHERE e.id = ?
        AND (
          (u.current_year = s.year AND u.current_semester = s.semester)
          OR EXISTS (
            SELECT 1 FROM exam_allowed_students eas 
            WHERE eas.exam_id = e.id AND eas.student_id = u.id AND eas.status = 'allowed'
          )
        )
        AND NOT EXISTS (
          SELECT 1 FROM exam_allowed_students eas 
          WHERE eas.exam_id = e.id AND eas.student_id = u.id AND eas.status = 'revoked'
        )
      LIMIT 1
      `,
      [studentId, examId]
    );
    if (!allowedRows.length) {
      return res.status(403).json({ ok: false, message: "Not allowed for this exam" });
    }

    // ✅ exam meta
    const examRows = await q(
      `
      SELECT id, subject_id, title, start_at, duration_minutes, total_marks, pass_marks
      FROM exams
      WHERE id = ? LIMIT 1
      `,
      [examId]
    );
    if (!examRows.length) {
      return res.status(404).json({ ok: false, message: "Exam not found" });
    }
    const exam = examRows[0];

    const lateMinutes = await getLateMinutes(examId);
    const expiryMs = computeExpiry(exam, lateMinutes);
    const isExpired = nowMs() > expiryMs;

    // ✅ latest attempt
    const atRows = await q(
      `
      SELECT id, status, submitted_at
      FROM exam_attempts
      WHERE exam_id = ? AND student_id = ?
      ORDER BY submitted_at DESC, id DESC
      LIMIT 1
      `,
      [examId, studentId]
    );

    // no submitted attempt
    if (!atRows.length || String(atRows[0].status || "").toLowerCase() !== "submitted") {
      const result = isExpired
        ? { total_marks: "AB", status: "ABSENT", attempt_status: atRows[0]?.status || "none", is_expired: true }
        : { total_marks: "-", status: "PENDING", attempt_status: atRows[0]?.status || "none", is_expired: false };

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
          result,
        },
      });
    }

    const attemptId = atRows[0].id;

    // computed total
    const sumRows = await q(
      `
      SELECT COALESCE(SUM(COALESCE(marks_awarded,0)),0) AS total
      FROM exam_attempt_answers
      WHERE exam_id = ? AND attempt_id = ?
      `,
      [examId, attemptId]
    );
    const computedTotal = Number(sumRows[0]?.total || 0);

    // override total (optional)
    const ovRows = await q(
      `
      SELECT total_marks
      FROM exam_result_overrides
      WHERE exam_id = ? AND student_id = ?
      LIMIT 1
      `,
      [examId, studentId]
    );

    const finalTotal = ovRows.length
      ? Number(ovRows[0].total_marks || 0)
      : computedTotal;

    const result = {
      total_marks: finalTotal,
      status: passFail(finalTotal, exam.pass_marks),
      attempt_status: "submitted",
      is_expired: isExpired,
    };

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
        result,
      },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
};