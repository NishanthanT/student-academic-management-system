const db = require("../../config/db");

// GET /api/staff/my-subjects?year=&semester=&search=
exports.listMySubjects = (req, res) => {
  const staffId = Number(req.user?.id);
  if (!staffId) return res.status(401).json({ ok: false, message: "Unauthorized" });

  const year = (req.query.year || "").toString().trim();
  const semester = (req.query.semester || "").toString().trim();
  const search = (req.query.search || "").toString().trim();

  let sql = `
    SELECT
      s.id,
      s.code,
      s.name,
      s.year,
      s.semester,
      s.created_at
    FROM subject_staffs ss
    INNER JOIN subjects s ON s.id = ss.subject_id
    WHERE ss.staff_id = ?
  `;

  const params = [staffId];

  if (year && year !== "all") {
    sql += " AND s.year = ? ";
    params.push(Number(year));
  }

  if (semester && semester !== "all") {
    sql += " AND s.semester = ? ";
    params.push(Number(semester));
  }

  if (search) {
    sql += " AND (s.code LIKE ? OR s.name LIKE ?) ";
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += " ORDER BY s.year ASC, s.semester ASC, s.code ASC ";

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    return res.json({ ok: true, data: rows });
  });
};