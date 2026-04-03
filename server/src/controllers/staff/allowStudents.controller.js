// server/src/controllers/staff/allowStudents.controller.js
const db = require("../../config/db");
const bcrypt = require("bcryptjs");

/**
 * ✅ GET /api/staff/allow-exams
 * Return: only exams created by this staff + approved + question_count + password_set + allowed_count + subject info
 */
exports.listAllowExams = (req, res) => {
  const staffId = req.user.id;

  const sql = `
    SELECT 
      e.*,
      s.code AS subject_code,
      s.name AS subject_name,
      s.year,
      s.semester,
      (SELECT COUNT(*) FROM questions q WHERE q.exam_id = e.id) AS question_count,
      (SELECT COUNT(*) FROM exam_allowed_students eas 
        WHERE eas.exam_id = e.id AND eas.status = 'allowed') AS allowed_count,
      CASE WHEN EXISTS (SELECT 1 FROM exam_quiz_settings eqs WHERE eqs.exam_id = e.id)
        THEN 1 ELSE 0 END AS password_set
    FROM exams e
    JOIN subjects s ON s.id = e.subject_id
    WHERE e.created_by_staff_id = ?
      AND e.approval_status = 'approved'
    ORDER BY e.id DESC
  `;

  db.query(sql, [staffId], (err, rows) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    res.json({ ok: true, data: rows });
  });
};

/**
 * ✅ PUT /api/staff/exams/:examId/quiz-settings
 * Body: { password, late_minutes }
 */
exports.saveQuizSettings = (req, res) => {
  const staffId = req.user.id;
  const { examId } = req.params;
  const { password, late_minutes } = req.body;

  if (!password || String(password).trim().length < 4) {
    return res.status(400).json({ ok: false, message: "Password min 4 chars" });
  }

  const lateMins = Number.isFinite(Number(late_minutes)) ? Number(late_minutes) : 15;
  const hash = bcrypt.hashSync(String(password), 10);

  db.query(
    "SELECT id FROM exams WHERE id=? AND created_by_staff_id=? AND approval_status='approved' LIMIT 1",
    [examId, staffId],
    (err, ex) => {
      if (err) return res.status(500).json({ ok: false, message: "DB error" });
      if (!ex.length) return res.status(404).json({ ok: false, message: "Exam not found" });

      const upsert = `
        INSERT INTO exam_quiz_settings (exam_id, quiz_password_hash, late_minutes, created_by_staff_id)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          quiz_password_hash=VALUES(quiz_password_hash),
          late_minutes=VALUES(late_minutes),
          updated_at=CURRENT_TIMESTAMP
      `;

      db.query(upsert, [examId, hash, lateMins, staffId], (e2) => {
        if (e2) return res.status(500).json({ ok: false, message: "DB error" });
        res.json({ ok: true, message: "Quiz password saved", password_set: 1, late_minutes: lateMins });
      });
    }
  );
};

/**
 * ✅ GET /api/staff/exams/:examId/allowed-students
 */
exports.listAllowedStudents = (req, res) => {
  const staffId = req.user.id;
  const { examId } = req.params;

  const sql = `
    SELECT 
      eas.id,
      eas.exam_id,
      eas.student_id,
      eas.status,
      eas.approved,
      eas.approved_at,
      u.name,
      u.email,
      u.current_year,
      u.current_semester
    FROM exam_allowed_students eas
    JOIN users u ON u.id = eas.student_id
    JOIN exams e ON e.id = eas.exam_id
    WHERE eas.exam_id = ?
      AND e.created_by_staff_id = ?
    ORDER BY eas.id DESC
  `;

  db.query(sql, [examId, staffId], (err, rows) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    res.json({ ok: true, data: rows });
  });
};

/**
 * ✅ POST /api/staff/exams/:examId/allowed-students
 * Body: { student_id }
 */
exports.addAllowedStudent = (req, res) => {
  const staffId = req.user.id;
  const { examId } = req.params;
  const { student_id } = req.body;

  if (!student_id) return res.status(400).json({ ok: false, message: "student_id required" });

  db.query(
    "SELECT subject_id FROM exams WHERE id=? AND created_by_staff_id=? AND approval_status='approved' LIMIT 1",
    [examId, staffId],
    (err, ex) => {
      if (err) return res.status(500).json({ ok: false, message: "DB error" });
      if (!ex.length) return res.status(404).json({ ok: false, message: "Exam not found" });

      db.query(
        "SELECT id, role FROM users WHERE id=? LIMIT 1",
        [student_id],
        (e2, urows) => {
          if (e2) return res.status(500).json({ ok: false, message: "DB error" });
          if (!urows.length || urows[0].role !== "student") {
            return res.status(400).json({ ok: false, message: "Invalid student" });
          }

          const sql = `
            INSERT INTO exam_allowed_students (exam_id, student_id, status, approved, allowed_by_staff_id)
            VALUES (?, ?, 'allowed', 0, ?)
            ON DUPLICATE KEY UPDATE 
              status='allowed',
              updated_at=CURRENT_TIMESTAMP
          `;

          db.query(sql, [examId, student_id, staffId], (e3) => {
            if (e3) return res.status(500).json({ ok: false, message: "DB error" });
            res.json({ ok: true, message: "Student added" });
          });
        }
      );
    }
  );
};

/**
 * ✅ PATCH /api/staff/exams/:examId/allowed-students/:studentId/revoke
 */
exports.revokeStudent = (req, res) => {
  const staffId = req.user.id;
  const { examId, studentId } = req.params;

  const sql = `
    UPDATE exam_allowed_students eas
    JOIN exams e ON e.id = eas.exam_id
    SET eas.status='revoked', eas.updated_at=CURRENT_TIMESTAMP
    WHERE eas.exam_id=? AND eas.student_id=? AND e.created_by_staff_id=?
  `;

  db.query(sql, [examId, studentId, staffId], (err, r) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    if (r.affectedRows === 0) return res.status(404).json({ ok: false, message: "Not found" });
    res.json({ ok: true, message: "Student revoked" });
  });
};

/**
 * ✅ PATCH /api/staff/exams/:examId/allowed-students/approve-all
 * Rule: password must be set before approving
 */
exports.approveAll = (req, res) => {
  const staffId = req.user.id;
  const { examId } = req.params;

  db.query(
    `SELECT 1 FROM exam_quiz_settings WHERE exam_id=? LIMIT 1`,
    [examId],
    (e1, rows) => {
      if (e1) return res.status(500).json({ ok: false, message: "DB error" });
      if (!rows.length) return res.status(400).json({ ok: false, message: "Set quiz password first" });

      const sql = `
        UPDATE exam_allowed_students eas
        JOIN exams e ON e.id = eas.exam_id
        SET eas.approved=1, eas.approved_at=NOW(), eas.updated_at=CURRENT_TIMESTAMP
        WHERE eas.exam_id=? AND eas.status='allowed' AND e.created_by_staff_id=?
      `;

      db.query(sql, [examId, staffId], (err, r) => {
        if (err) return res.status(500).json({ ok: false, message: "DB error" });
        res.json({ ok: true, message: "Approved all", affected: r.affectedRows });
      });
    }
  );
};