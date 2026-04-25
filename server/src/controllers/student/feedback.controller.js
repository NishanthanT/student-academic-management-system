const db = require("../../config/db");

const ok = (res, data) => res.json({ ok: true, data });
const bad = (res, message, code = 400) =>
  res.status(code).json({ ok: false, message });

/* =========================
   STUDENT: Get Staffs for a Subject
   ========================= */
exports.getSubjectStaffs = (req, res) => {
  const { subjectId } = req.params;

  const sql = `
    SELECT u.id, u.name, u.email
    FROM subject_staffs ss
    JOIN users u ON u.id = ss.staff_id
    WHERE ss.subject_id = ? AND u.role = 'staff'
  `;

  db.query(sql, [subjectId], (err, rows) => {
    if (err) return bad(res, "DB error", 500);
    ok(res, rows);
  });
};

/* =========================
   STUDENT: Send Feedback
   ========================= */
exports.studentSendFeedback = (req, res) => {
  const studentId = req.user.id;
  const { subject_id, staff_id, description } = req.body;

  if (!subject_id || !staff_id || !description) {
    return bad(res, "All fields are required");
  }

  const sql = `
    INSERT INTO feedbacks (student_id, staff_id, subject_id, description, status)
    VALUES (?, ?, ?, ?, 'pending')
  `;

  db.query(sql, [studentId, staff_id, subject_id, description], (err) => {
    if (err) return bad(res, "DB error", 500);
    ok(res, { message: "Feedback sent successfully" });
  });
};

/* =========================
   STUDENT: Get My Feedbacks
   ========================= */
exports.studentGetMyFeedbacks = (req, res) => {
  const studentId = req.user.id;

  const sql = `
    SELECT 
      f.id, f.description, f.status, f.created_at,
      u.name AS staff_name, 
      s.name AS subject_name, s.code AS subject_code
    FROM feedbacks f
    JOIN users u ON u.id = f.staff_id
    JOIN subjects s ON s.id = f.subject_id
    WHERE f.student_id = ?
    ORDER BY f.created_at DESC
  `;

  db.query(sql, [studentId], (err, rows) => {
    if (err) return bad(res, "DB error", 500);
    ok(res, rows);
  });
};

/* =========================
   STAFF: Get Received Feedback
   ========================= */
exports.staffGetFeedback = (req, res) => {
  const staffId = req.user.id;

  const sql = `
    SELECT 
      f.id, f.description, f.status, f.created_at,
      u.name AS student_name, u.email AS student_email, 
      u.current_year AS student_year, u.current_semester AS student_semester,
      s.name AS subject_name, s.code AS subject_code
    FROM feedbacks f
    JOIN users u ON u.id = f.student_id
    JOIN subjects s ON s.id = f.subject_id
    WHERE f.staff_id = ?
    ORDER BY f.created_at DESC
  `;

  db.query(sql, [staffId], (err, rows) => {
    if (err) return bad(res, "DB error", 500);
    ok(res, rows);
  });
};

/* =========================
   STAFF: Update Feedback Status
   ========================= */
exports.updateFeedbackStatus = (req, res) => {
  const staffId = req.user.id;
  const { feedbackId } = req.params;
  const { status } = req.body; // 'pending' or 'resolved'

  if (!status) return bad(res, "Status is required");

  const sql = `
    UPDATE feedbacks 
    SET status = ? 
    WHERE id = ? AND staff_id = ?
  `;

  db.query(sql, [status, feedbackId, staffId], (err, result) => {
    if (err) return bad(res, "DB error", 500);
    if (result.affectedRows === 0) return bad(res, "Feedback not found or not yours");
    ok(res, { message: "Status updated" });
  });
};
