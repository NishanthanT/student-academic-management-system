const db = require("../../config/db");

/** Helper: mysql query promise */
function q(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

/** Get student current year/semester from users table */
async function getStudentYearSem(studentId) {
  const rows = await q(
    `SELECT current_year, current_semester FROM users WHERE id = ? LIMIT 1`,
    [studentId]
  );
  if (!rows.length) return null;

  return {
    year: Number(rows[0].current_year),
    semester: Number(rows[0].current_semester),
  };
}

/**
 * GET /api/student/exam-notice/subjects
 */
exports.listNoticeSubjects = async (req, res) => {
  try {
    const studentId = req.user.id;

    const ys = await getStudentYearSem(studentId);
    if (!ys) return res.status(404).json({ ok: false, message: "Student not found" });

    const { year, semester } = ys;

    if (!year || !semester) {
      return res.status(400).json({
        ok: false,
        message: "Student current_year/current_semester not set",
      });
    }

    const subjects = await q(
      `
      SELECT id, code, name, year, semester
      FROM subjects
      WHERE is_active = 1
        AND year = ?
        AND semester = ?
      ORDER BY code ASC
      `,
      [year, semester]
    );

    return res.json({ ok: true, data: subjects });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
};

/**
 * GET /api/student/exam-notice/subjects/:subjectId/exams
 */
exports.listNoticeExamsBySubject = async (req, res) => {
  try {
    const studentId = req.user.id;
    const subjectId = Number(req.params.subjectId);

    const ys = await getStudentYearSem(studentId);
    if (!ys) return res.status(404).json({ ok: false, message: "Student not found" });

    const { year, semester } = ys;

    // ✅ Subject must belong to student's year/semester
    const subjectRows = await q(
      `
      SELECT id, code, name, year, semester
      FROM subjects
      WHERE id = ?
        AND is_active = 1
        AND year = ?
        AND semester = ?
      LIMIT 1
      `,
      [subjectId, year, semester]
    );

    if (!subjectRows.length) {
      return res.status(403).json({
        ok: false,
        message: "This subject is not in your current year/semester",
      });
    }

    // ✅ Only APPROVED exams and not ended + student must be allowed
    const exams = await q(
      `
      SELECT
        e.id,
        e.subject_id,
        e.title,
        e.description,
        e.start_at,
        e.end_at,
        e.duration_minutes,
        e.total_marks,
        e.pass_marks,
        e.approval_status
      FROM exams e
      INNER JOIN exam_allowed_students eas
        ON eas.exam_id = e.id
       AND eas.student_id = ?
      WHERE e.subject_id = ?
        AND e.approval_status = 'APPROVED'
        AND e.end_at > NOW()
      ORDER BY e.start_at ASC
      `,
      [studentId, subjectId]
    );

    return res.json({
      ok: true,
      data: {
        subject: subjectRows[0],
        exams,
      },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
};