const db = require("../config/db");

exports.findByCodeYearSem = (code, year, semester, cb) => {
  db.query(
    "SELECT id FROM subjects WHERE code = ? AND year = ? AND semester = ? LIMIT 1",
    [code, year, semester],
    cb
  );
};

exports.create = (payload, cb) => {
  db.query(
    "INSERT INTO subjects (code, name, year, semester, is_active) VALUES (?,?,?,?,?)",
    [payload.code, payload.name, payload.year, payload.semester, payload.is_active ?? 1],
    cb
  );
};

exports.list = (filters, cb) => {
  const { year, semester, search } = filters;

  let sql = "SELECT id, code, name, year, semester, is_active, created_at FROM subjects";
  const where = [];
  const params = [];

  if (year) {
    where.push("year = ?");
    params.push(year);
  }
  if (semester) {
    where.push("semester = ?");
    params.push(semester);
  }
  if (search) {
    where.push("(code LIKE ? OR name LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  if (where.length) sql += " WHERE " + where.join(" AND ");
  sql += " ORDER BY id DESC";

  db.query(sql, params, cb);
};

exports.update = (id, payload, cb) => {
  db.query(
    "UPDATE subjects SET code=?, name=?, year=?, semester=?, is_active=? WHERE id=?",
    [payload.code, payload.name, payload.year, payload.semester, payload.is_active ?? 1, id],
    cb
  );
};

exports.delete = (id, cb) => {
  db.query("DELETE FROM subjects WHERE id=?", [id], cb);
};

exports.findById = (id, cb) => {
  db.query("SELECT * FROM subjects WHERE id=? LIMIT 1", [id], cb);
};

exports.existsDuplicateForUpdate = (id, code, year, semester, cb) => {
  db.query(
    "SELECT id FROM subjects WHERE code=? AND year=? AND semester=? AND id<>? LIMIT 1",
    [code, year, semester, id],
    cb
  );
};
