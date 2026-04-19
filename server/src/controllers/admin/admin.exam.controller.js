const db = require("../../config/db");
const { sendMail } = require("../../services/mailer");

// helper: exam + staff email
const getExamWithStaff = (examId, cb) => {
  const sql = `
    SELECT e.*,
           u.email AS staff_email,
           u.name  AS staff_name,
           s.code  AS subject_code,
           s.name  AS subject_name
    FROM exams e
    JOIN users u ON u.id = e.created_by_staff_id
    JOIN subjects s ON s.id = e.subject_id
    WHERE e.id = ?
    LIMIT 1
  `;
  db.query(sql, [examId], (err, rows) => {
    if (err) return cb(err);
    cb(null, rows[0] || null);
  });
};

// ✅ GET /api/admin/exams
exports.listAll = (req, res) => {
  const sql = `
    SELECT e.*,
           u.name AS staff_name,
           u.email AS staff_email,
           s.code AS subject_code,
           s.name AS subject_name,
           s.year, s.semester
    FROM exams e
    JOIN users u ON u.id = e.created_by_staff_id
    JOIN subjects s ON s.id = e.subject_id
    ORDER BY e.id DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    res.json({ ok: true, data: rows });
  });
};

// ✅ PATCH /api/admin/exams/:id/approve
exports.approve = (req, res) => {
  const adminId = req.user.id;
  const id = req.params.id;

  getExamWithStaff(id, async (err, exam) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    if (!exam) return res.status(404).json({ ok: false, message: "Exam not found" });

    if (exam.approval_status !== "pending") {
      return res.status(403).json({ ok: false, message: "Only PENDING can be approved" });
    }

    db.query(
      `UPDATE exams
       SET approval_status='approved',
           admin_note=NULL,
           approved_by_admin_id=?,
           approved_at=NOW()
       WHERE id=?`,
      [adminId, id],
      async (e2) => {
        if (e2) return res.status(500).json({ ok: false, message: "DB error" });

        // ✅ Email to staff
        try {
          await sendMail({
            to: exam.staff_email,
            subject: "UniExam - Exam Approved",
            text: `Hi ${exam.staff_name},\n\nYour exam "${exam.title}" (${exam.subject_code}) has been APPROVED.\n\nThanks,\nUniExam`,
          });
        } catch (mailErr) {
          // mail fail should not block approval
          console.log("MAIL ERROR:", mailErr.message);
        }

        res.json({ ok: true, message: "Approved" });
      }
    );
  });
};

// ✅ PATCH /api/admin/exams/:id/reject  body: { admin_note }
exports.reject = (req, res) => {
  const adminId = req.user.id;
  const id = req.params.id;
  const { admin_note } = req.body;

  if (!admin_note || admin_note.trim().length < 3) {
    return res.status(400).json({ ok: false, message: "Rejection reason required" });
  }

  getExamWithStaff(id, async (err, exam) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    if (!exam) return res.status(404).json({ ok: false, message: "Exam not found" });

    if (exam.approval_status !== "pending") {
      return res.status(403).json({ ok: false, message: "Only PENDING can be rejected" });
    }

    db.query(
      `UPDATE exams
       SET approval_status='rejected',
           admin_note=?,
           approved_by_admin_id=?,
           approved_at=NOW()
       WHERE id=?`,
      [admin_note.trim(), adminId, id],
      async (e2) => {
        if (e2) return res.status(500).json({ ok: false, message: "DB error" });

        try {
          await sendMail({
            to: exam.staff_email,
            subject: "UniExam - Exam Rejected",
            text: `Hi ${exam.staff_name},\n\nYour exam "${exam.title}" (${exam.subject_code}) has been REJECTED.\nReason: ${admin_note}\n\nThanks,\nUniExam`,
          });
        } catch (mailErr) {
          console.log("MAIL ERROR:", mailErr.message);
        }

        res.json({ ok: true, message: "Rejected" });
      }
    );
  });
};

// ✅ PATCH /api/admin/exams/:id/changes  body: { admin_note }
exports.requestChanges = (req, res) => {
  const adminId = req.user.id;
  const id = req.params.id;
  const { admin_note } = req.body;

  if (!admin_note || admin_note.trim().length < 3) {
    return res.status(400).json({ ok: false, message: "Change note required" });
  }

  getExamWithStaff(id, async (err, exam) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    if (!exam) return res.status(404).json({ ok: false, message: "Exam not found" });

    if (exam.approval_status !== "pending") {
      return res.status(403).json({ ok: false, message: "Only PENDING can request changes" });
    }

    db.query(
      `UPDATE exams
       SET approval_status='changes_requested',
           admin_note=?,
           approved_by_admin_id=?,
           approved_at=NOW()
       WHERE id=?`,
      [admin_note.trim(), adminId, id],
      async (e2) => {
        if (e2) return res.status(500).json({ ok: false, message: "DB error" });

        try {
          await sendMail({
            to: exam.staff_email,
            subject: "UniExam - Changes Requested",
            text: `Hi ${exam.staff_name},\n\nChanges requested for "${exam.title}" (${exam.subject_code}).\nNote: ${admin_note}\n\nPlease edit and resubmit.\n\nThanks,\nUniExam`,
          });
        } catch (mailErr) {
          console.log("MAIL ERROR:", mailErr.message);
        }

        res.json({ ok: true, message: "Changes Requested" });
      }
    );
  });
};