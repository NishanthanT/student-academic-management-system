const db = require("../../config/db");

// GET /api/staff/stats
exports.getStaffStats = (req, res) => {
  const staffId = req.user.id;

  const stats = {
    totalSubjects: 0,
    totalExams: 0,
    pendingExams: 0,
    approvedExams: 0,
    rejectedExams: 0,
    totalStudents: 0
  };

  // 1. Total Assigned Subjects
  const q1 = "SELECT COUNT(*) as count FROM subject_staffs WHERE staff_id = ?";

  // 2. Exams by Status
  const q2 = `
    SELECT approval_status, COUNT(*) as count 
    FROM exams 
    WHERE created_by_staff_id = ? 
    GROUP BY approval_status
  `;

  // 3. Total Unique Students (from all exams created by this staff)
  const q3 = `
    SELECT COUNT(DISTINCT student_id) as count 
    FROM exam_allowed_students 
    WHERE exam_id IN (SELECT id FROM exams WHERE created_by_staff_id = ?)
  `;

  db.query(q1, [staffId], (err1, rows1) => {
    if (err1) return res.status(500).json({ ok: false, message: "DB error Q1" });
    stats.totalSubjects = rows1[0].count;

    db.query(q2, [staffId], (err2, rows2) => {
      if (err2) return res.status(500).json({ ok: false, message: "DB error Q2" });

      let totalExams = 0;
      rows2.forEach(row => {
        totalExams += row.count;
        if (row.approval_status === 'pending') stats.pendingExams = row.count;
        if (row.approval_status === 'approved') stats.approvedExams = row.count;
        if (row.approval_status === 'rejected') stats.rejectedExams = row.count;
        if (row.approval_status === 'changes_requested') stats.changesExams = row.count;
      });
      stats.totalExams = totalExams;
      stats.changesExams = stats.changesExams || 0; // ensure defined

      db.query(q3, [staffId], (err3, rows3) => {
        if (err3) return res.status(500).json({ ok: false, message: "DB error Q3" });
        stats.totalStudents = rows3[0].count;

        // 4. Upcoming Approved Exams (next 5)
        const q4 = `
          SELECT id, title, start_at 
          FROM exams 
          WHERE created_by_staff_id = ? 
            AND approval_status = 'approved' 
            AND start_at > NOW() 
          ORDER BY start_at ASC 
          LIMIT 5
        `;
        db.query(q4, [staffId], (err4, rows4) => {
          if (err4) return res.status(500).json({ ok: false, message: "DB error Q4" });
          stats.upcomingExams = rows4 || [];
          res.json({ ok: true, data: stats });
        });
      });
    });
  });
};
