const db = require("../../config/db");
const { sendMail } = require("../../services/mailer");

function q(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

exports.listRequests = async (req, res) => {
  try {
    const rows = await q(`
      SELECT er.id, er.exam_id, er.student_id, er.total_marks as current_marks, 
             er.requested_marks, er.approval_status, er.updated_at as requested_at,
             e.title as exam_title, s.name as subject_name,
             u_student.name as student_name, u_student.email as student_email,
             u_staff.name as staff_name, u_staff.email as staff_email
      FROM exam_result_overrides er
      JOIN exams e ON e.id = er.exam_id
      JOIN subjects s ON s.id = e.subject_id
      JOIN users u_student ON u_student.id = er.student_id
      LEFT JOIN users u_staff ON u_staff.id = er.updated_by_staff_id
      ORDER BY 
        CASE WHEN er.approval_status = 'pending' THEN 1 ELSE 2 END ASC, 
        er.updated_at ASC
    `);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
};

exports.approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const exist = await q(`SELECT id, requested_marks FROM exam_result_overrides WHERE id=? AND approval_status='pending'`, [id]);
    if (!exist.length) return res.status(404).json({ ok: false, message: "Request not found or already processed" });

    await q(`
      UPDATE exam_result_overrides 
      SET approval_status = 'approved', total_marks = requested_marks, approved_by_admin_id = ?, approved_at = NOW()
      WHERE id = ?
    `, [adminId, id]);

    res.json({ ok: true, message: "Mark edit request approved successfully" });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_comment } = req.body || {};
    const adminId = req.user.id;
    
    const exist = await q(`
      SELECT er.id, er.requested_marks, er.total_marks,
             u_staff.email as staff_email, u_staff.name as staff_name,
             u_student.name as student_name, e.title as exam_title
      FROM exam_result_overrides er
      JOIN users u_staff ON u_staff.id = er.updated_by_staff_id
      JOIN users u_student ON u_student.id = er.student_id
      JOIN exams e ON e.id = er.exam_id
      WHERE er.id=? AND er.approval_status='pending'
    `, [id]);
    
    if (!exist.length) return res.status(404).json({ ok: false, message: "Request not found or already processed" });
    const reqData = exist[0];

    await q(`
      UPDATE exam_result_overrides 
      SET approval_status = 'rejected', approved_by_admin_id = ?, approved_at = NOW(), admin_comment = ?
      WHERE id = ?
    `, [adminId, admin_comment || null, id]);

    // Send email to staff
    if (reqData.staff_email) {
      try {
        await sendMail({
          to: reqData.staff_email,
          subject: "Mark Edit Request Rejected",
          text: `Hello ${reqData.staff_name},\n\nYour request to change marks for student ${reqData.student_name} in exam "${reqData.exam_title}" from ${reqData.total_marks} to ${reqData.requested_marks} has been rejected by the administrator.\n\nReason: ${admin_comment || "No reason provided."}\n\nRegards,\nAdmin Team`
        });
      } catch (err) {
         console.error("Failed to send rejection email to staff", err);
      }
    }

    res.json({ ok: true, message: "Mark edit request rejected successfully" });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
};
