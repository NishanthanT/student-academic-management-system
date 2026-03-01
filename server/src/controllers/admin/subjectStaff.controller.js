const db = require("../../config/db");

/**
 * ✅ Subject-wise staffs
 * GET /api/admin/subjects/:subjectId/staffs
 */
exports.getSubjectStaffs = (req, res) => {
  const subjectId = Number(req.params.subjectId);
  if (!subjectId) return res.status(422).json({ ok: false, message: "Invalid subject id" });

  const sql = `
    SELECT u.id, u.name, u.email
    FROM subject_staffs ss
    INNER JOIN users u ON u.id = ss.staff_id
    WHERE ss.subject_id = ?
    ORDER BY u.name ASC
  `;

  db.query(sql, [subjectId], (err, rows) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    return res.json({ ok: true, data: rows });
  });
};

/**
 * ✅ Add multiple staffs to one subject
 * POST /api/admin/subjects/:subjectId/staffs  { staff_ids:[1,2,3] }
 */
exports.addSubjectStaffs = (req, res) => {
  const subjectId = Number(req.params.subjectId);
  const staffIds = req.body?.staff_ids;

  if (!subjectId) return res.status(422).json({ ok: false, message: "Invalid subject id" });
  if (!Array.isArray(staffIds) || staffIds.length === 0) {
    return res.status(422).json({ ok: false, message: "staff_ids must be a non-empty array" });
  }

  const uniq = [
    ...new Set(staffIds.map((x) => Number(x)).filter((x) => Number.isInteger(x) && x > 0)),
  ];
  if (uniq.length === 0) {
    return res.status(422).json({ ok: false, message: "Invalid staff_ids" });
  }

  db.query("SELECT id FROM subjects WHERE id = ? LIMIT 1", [subjectId], (err, srows) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    if (!srows.length) return res.status(404).json({ ok: false, message: "Subject not found" });

    const placeholders = uniq.map(() => "?").join(",");
    db.query(
      `SELECT id FROM users WHERE role='staff' AND id IN (${placeholders})`,
      uniq,
      (err2, urows) => {
        if (err2) return res.status(500).json({ ok: false, message: "DB error" });

        const validStaffIds = urows.map((r) => r.id);
        if (validStaffIds.length === 0) {
          return res.status(422).json({ ok: false, message: "No valid staff selected" });
        }

        const values = validStaffIds.map((sid) => [subjectId, sid]);

        db.query(
          "INSERT IGNORE INTO subject_staffs (subject_id, staff_id) VALUES ?",
          [values],
          (err3, result) => {
            if (err3) return res.status(500).json({ ok: false, message: "DB error" });

            return res.status(201).json({
              ok: true,
              message: "Staff assigned successfully",
              inserted: result.affectedRows,
            });
          }
        );
      }
    );
  });
};

/**
 * ✅ Remove one staff from one subject
 * DELETE /api/admin/subjects/:subjectId/staffs/:staffId
 */
exports.removeSubjectStaff = (req, res) => {
  const subjectId = Number(req.params.subjectId);
  const staffId = Number(req.params.staffId);

  if (!subjectId) return res.status(422).json({ ok: false, message: "Invalid subject id" });
  if (!staffId) return res.status(422).json({ ok: false, message: "Invalid staff id" });

  db.query(
    "DELETE FROM subject_staffs WHERE subject_id = ? AND staff_id = ?",
    [subjectId, staffId],
    (err, result) => {
      if (err) return res.status(500).json({ ok: false, message: "DB error" });
      if (result.affectedRows === 0) {
        return res.status(404).json({ ok: false, message: "Assignment not found" });
      }
      return res.json({ ok: true, message: "Removed successfully" });
    }
  );
};

/**
 * ✅ ALL assignments table (for right-side table)
 * GET /api/admin/staff-subjects?subject=&staff=
 * subject -> filter by subject code/name
 * staff   -> filter by staff name/email
 */
exports.listStaffSubjects = (req, res) => {
  const subject = (req.query.subject || "").trim();
  const staff = (req.query.staff || "").trim();

  let sql = `
    SELECT
      ss.id,
      ss.subject_id,
      ss.staff_id,
      s.code AS subject_code,
      s.name AS subject_name,
      s.year,
      s.semester,
      u.name AS staff_name,
      u.email AS staff_email
    FROM subject_staffs ss
    INNER JOIN subjects s ON s.id = ss.subject_id
    INNER JOIN users u ON u.id = ss.staff_id
  `;

  const where = [];
  const params = [];

  if (subject) {
    where.push("(s.code LIKE ? OR s.name LIKE ?)");
    params.push(`%${subject}%`, `%${subject}%`);
  }

  if (staff) {
    where.push("(u.name LIKE ? OR u.email LIKE ?)");
    params.push(`%${staff}%`, `%${staff}%`);
  }

  if (where.length) sql += " WHERE " + where.join(" AND ");
  sql += " ORDER BY ss.id DESC";

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    return res.json({ ok: true, data: rows });
  });
};

/**
 * ✅ Edit one assignment row (change staff or subject)
 * PUT /api/admin/staff-subjects/:id  { subject_id, staff_id }
 */
exports.updateStaffSubject = (req, res) => {
  const id = Number(req.params.id);
  const subject_id = Number(req.body?.subject_id);
  const staff_id = Number(req.body?.staff_id);

  if (!id) return res.status(422).json({ ok: false, message: "Invalid id" });
  if (!subject_id) return res.status(422).json({ ok: false, message: "Invalid subject_id" });
  if (!staff_id) return res.status(422).json({ ok: false, message: "Invalid staff_id" });

  // validate subject exists
  db.query("SELECT id FROM subjects WHERE id=? LIMIT 1", [subject_id], (e1, srows) => {
    if (e1) return res.status(500).json({ ok: false, message: "DB error" });
    if (!srows.length) return res.status(404).json({ ok: false, message: "Subject not found" });

    // validate staff exists & role staff
    db.query(
      "SELECT id FROM users WHERE id=? AND role='staff' LIMIT 1",
      [staff_id],
      (e2, urows) => {
        if (e2) return res.status(500).json({ ok: false, message: "DB error" });
        if (!urows.length) return res.status(404).json({ ok: false, message: "Staff not found" });

        // prevent duplicate combo
        db.query(
          "SELECT id FROM subject_staffs WHERE subject_id=? AND staff_id=? AND id<>? LIMIT 1",
          [subject_id, staff_id, id],
          (e3, drows) => {
            if (e3) return res.status(500).json({ ok: false, message: "DB error" });
            if (drows.length) {
              return res.status(409).json({ ok: false, message: "This assignment already exists" });
            }

            db.query(
              "UPDATE subject_staffs SET subject_id=?, staff_id=? WHERE id=?",
              [subject_id, staff_id, id],
              (e4, result) => {
                if (e4) return res.status(500).json({ ok: false, message: "DB error" });
                if (result.affectedRows === 0) {
                  return res.status(404).json({ ok: false, message: "Assignment not found" });
                }
                return res.json({ ok: true, message: "Assignment updated successfully" });
              }
            );
          }
        );
      }
    );
  });
};

/**
 * ✅ Delete assignment row by id (right table delete)
 * DELETE /api/admin/staff-subjects/:id
 */
exports.deleteStaffSubject = (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(422).json({ ok: false, message: "Invalid id" });

  db.query("DELETE FROM subject_staffs WHERE id=?", [id], (err, result) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, message: "Assignment not found" });
    }
    return res.json({ ok: true, message: "Deleted successfully" });
  });
};
