// server/src/controllers/staff/studentSearch.controller.js
const db = require("../../config/db");

/**
 * ✅ GET /api/staff/students/search?q=&year=&semester=
 * Search by id/name/email, return only students
 */
exports.searchStudents = (req, res) => {
  const q = (req.query.q || "").trim();
  const year = (req.query.year || "").trim();
  const semester = (req.query.semester || "").trim();

  const where = [`u.role='student'`];
  const params = [];

  if (q) {
    where.push(`(u.id LIKE ? OR u.name LIKE ? OR u.email LIKE ?)`);
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (year) {
    where.push(`u.current_year = ?`);
    params.push(year);
  }
  if (semester) {
    where.push(`u.current_semester = ?`);
    params.push(semester);
  }

  const sql = `
    SELECT u.id, u.name, u.email, u.current_year, u.current_semester
    FROM users u
    WHERE ${where.join(" AND ")}
    ORDER BY u.id DESC
    LIMIT 50
  `;

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    res.json({ ok: true, data: rows });
  });
};