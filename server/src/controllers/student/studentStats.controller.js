// server/src/controllers/student/studentStats.controller.js
const db = require("../../config/db");

exports.getStudentStats = (req, res) => {
  const studentId = req.user.id;

  // 1. Total Allowed Exams
  const sqlAllowed = `
    SELECT COUNT(DISTINCT e.id) AS total
    FROM exams e
    JOIN subjects s ON s.id = e.subject_id
    JOIN users u ON u.id = ?
    WHERE e.approval_status = 'approved'
      AND u.current_year = s.year 
      AND u.current_semester = s.semester
      AND NOT EXISTS (
        SELECT 1 FROM exam_allowed_students eas 
        WHERE eas.exam_id = e.id AND eas.student_id = u.id AND eas.status = 'revoked'
      )
  `;

  // 2. Completed Exams
  const sqlCompleted = `
    SELECT COUNT(DISTINCT exam_id) AS total
    FROM exam_attempts
    WHERE student_id = ? AND status = 'submitted'
  `;

  // 3. Passed Exams (Calculated from attempts)
  const sqlPassed = `
    SELECT COUNT(*) AS total FROM (
      SELECT ea.id
      FROM exam_attempts ea
      JOIN exams e ON e.id = ea.exam_id
      WHERE ea.student_id = ? AND ea.status = 'submitted'
      AND (
        SELECT COALESCE(SUM(marks_awarded), 0) 
        FROM exam_attempt_answers 
        WHERE attempt_id = ea.id
      ) >= e.pass_marks
    ) AS passed_list
  `;

  // 4. Pending Notices
  const sqlNotices = `SELECT COUNT(*) AS total FROM exam_notices`;

  // 5. Recent Results (last 3)
  const sqlRecent = `
    SELECT 
      e.id AS exam_id, e.title AS exam_title, 
      s.code AS subject_code,
      (SELECT COALESCE(SUM(marks_awarded), 0) FROM exam_attempt_answers WHERE attempt_id = ea.id) AS student_marks,
      e.pass_marks,
      ea.submitted_at
    FROM exam_attempts ea
    JOIN exams e ON e.id = ea.exam_id
    JOIN subjects s ON s.id = e.subject_id
    WHERE ea.student_id = ? AND ea.status = 'submitted'
    ORDER BY ea.submitted_at DESC
    LIMIT 3
  `;

  // 6. Next Upcoming Exam
  const sqlNext = `
    SELECT 
      e.id AS exam_id, e.title AS exam_title, 
      s.name AS subject_name, s.code AS subject_code,
      e.start_at
    FROM exams e
    JOIN subjects s ON s.id = e.subject_id
    JOIN users u ON u.id = ?
    WHERE e.approval_status = 'approved'
      AND u.current_year = s.year 
      AND u.current_semester = s.semester
      AND e.start_at > NOW()
      AND NOT EXISTS (
        SELECT 1 FROM exam_allowed_students eas 
        WHERE eas.exam_id = e.id AND eas.student_id = u.id AND eas.status = 'revoked'
      )
    ORDER BY e.start_at ASC
    LIMIT 1
  `;

  // 7. Subject-wise average progress
  const sqlSubjectProgress = `
    SELECT 
      s.name AS subject_name,
      s.code AS subject_code,
      ROUND(AVG(sub.score / e.total_marks * 100), 1) AS avg_score
    FROM exam_attempts ea
    JOIN exams e ON e.id = ea.exam_id
    JOIN subjects s ON s.id = e.subject_id
    JOIN (
      SELECT attempt_id, SUM(marks_awarded) AS score
      FROM exam_attempt_answers
      GROUP BY attempt_id
    ) sub ON sub.attempt_id = ea.id
    WHERE ea.student_id = ? AND ea.status = 'submitted'
    GROUP BY s.id
    LIMIT 6
  `;

  // 8. Latest 5 Notices
  const sqlLatestNotices = `
    SELECT id, title, description, created_at 
    FROM exam_notices 
    ORDER BY created_at DESC 
    LIMIT 5
  `;

  db.query(sqlAllowed, [studentId], (err1, r1) => {
    if (err1) return res.status(500).json({ ok: false, message: "DB error 1" });
    db.query(sqlCompleted, [studentId], (err2, r2) => {
      if (err2) return res.status(500).json({ ok: false, message: "DB error 2" });
      db.query(sqlPassed, [studentId], (err3, r3) => {
        if (err3) return res.status(500).json({ ok: false, message: "DB error 3" });
        db.query(sqlNotices, (err4, r4) => {
          if (err4) return res.status(500).json({ ok: false, message: "DB error 4" });
          db.query(sqlRecent, [studentId], (err5, r5) => {
            if (err5) return res.status(500).json({ ok: false, message: "DB error 5" });
            db.query(sqlNext, [studentId], (err6, r6) => {
              if (err6) return res.status(500).json({ ok: false, message: "DB error 6" });
              db.query(sqlSubjectProgress, [studentId], (err7, r7) => {
                if (err7) return res.status(500).json({ ok: false, message: "DB error 7" });
                db.query(sqlLatestNotices, (err8, r8) => {
                  if (err8) return res.status(500).json({ ok: false, message: "DB error 8" });

                  res.json({
                    ok: true,
                    stats: {
                      totalAllowed: r1[0].total || 0,
                      completed: r2[0].total || 0,
                      passed: r3[0].total || 0,
                      notices: r4[0].total || 0
                    },
                    recentResults: r5.map(row => ({
                      ...row,
                      status: row.student_marks >= row.pass_marks ? "PASS" : "FAIL"
                    })),
                    nextExam: r6[0] || null,
                    subjectProgress: r7 || [],
                    latestNotices: r8 || []
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};
