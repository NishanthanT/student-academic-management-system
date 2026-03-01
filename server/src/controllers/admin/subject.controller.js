const Subject = require("../../models/subject.model");

// helpers
const normCode = (v) =>
  String(v || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9_-]/g, "");

const validYear = (y) => [1, 2, 3, 4].includes(Number(y));
const validSem = (s) => [1, 2].includes(Number(s));

/**
 * POST /api/admin/subjects
 */
exports.createSubject = (req, res) => {
  const { code, name, year, semester } = req.body;

  const c = normCode(code);
  const n = String(name || "").trim();
  const y = Number(year);
  const s = Number(semester);

  if (!c) return res.status(422).json({ ok: false, message: "Please fill the Subject Code" });
  if (c.length < 3) return res.status(422).json({ ok: false, message: "Code must be at least 3 characters" });

  if (!n) return res.status(422).json({ ok: false, message: "Please fill the Subject Name" });
  if (n.length < 3) return res.status(422).json({ ok: false, message: "Name must be at least 3 characters" });

  if (!year) return res.status(422).json({ ok: false, message: "Please select the Year" });
  if (!validYear(y)) return res.status(422).json({ ok: false, message: "Year must be 1 to 4" });

  if (!semester) return res.status(422).json({ ok: false, message: "Please select the Semester" });
  if (!validSem(s)) return res.status(422).json({ ok: false, message: "Semester must be 1 or 2" });

  Subject.findByCodeYearSem(c, y, s, (err, rows) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    if (rows.length) return res.status(409).json({ ok: false, message: "Subject already exists for this Year/Sem" });

    Subject.create({ code: c, name: n, year: y, semester: s, is_active: 1 }, (err2, result) => {
      if (err2) return res.status(500).json({ ok: false, message: "DB error" });

      return res.status(201).json({
        ok: true,
        message: "Subject created successfully",
        data: { id: result.insertId, code: c, name: n, year: y, semester: s, is_active: 1 },
      });
    });
  });
};

/**
 * GET /api/admin/subjects?year=&semester=&search=
 */
exports.listSubjects = (req, res) => {
  const year = req.query.year && req.query.year !== "all" ? Number(req.query.year) : null;
  const semester = req.query.semester && req.query.semester !== "all" ? Number(req.query.semester) : null;
  const search = String(req.query.search || "").trim();

  if (year && !validYear(year)) return res.status(422).json({ ok: false, message: "Invalid year filter" });
  if (semester && !validSem(semester)) return res.status(422).json({ ok: false, message: "Invalid semester filter" });

  Subject.list({ year, semester, search }, (err, rows) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    return res.json({ ok: true, data: rows });
  });
};

/**
 * PUT /api/admin/subjects/:id
 */
exports.updateSubject = (req, res) => {
  const id = Number(req.params.id);
  const { code, name, year, semester, is_active } = req.body;

  if (!id) return res.status(422).json({ ok: false, message: "Invalid subject id" });

  const c = normCode(code);
  const n = String(name || "").trim();
  const y = Number(year);
  const s = Number(semester);
  const active = is_active === 0 || is_active === "0" ? 0 : 1;

  if (!c) return res.status(422).json({ ok: false, message: "Please fill the Subject Code" });
  if (!n) return res.status(422).json({ ok: false, message: "Please fill the Subject Name" });
  if (!validYear(y)) return res.status(422).json({ ok: false, message: "Year must be 1 to 4" });
  if (!validSem(s)) return res.status(422).json({ ok: false, message: "Semester must be 1 or 2" });

  Subject.existsDuplicateForUpdate(id, c, y, s, (err, dup) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    if (dup.length) return res.status(409).json({ ok: false, message: "Duplicate subject for this Year/Sem" });

    Subject.update(id, { code: c, name: n, year: y, semester: s, is_active: active }, (err2, result) => {
      if (err2) return res.status(500).json({ ok: false, message: "DB error" });
      if (result.affectedRows === 0) return res.status(404).json({ ok: false, message: "Subject not found" });

      return res.json({ ok: true, message: "Subject updated successfully" });
    });
  });
};

/**
 * DELETE /api/admin/subjects/:id
 */
exports.deleteSubject = (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(422).json({ ok: false, message: "Invalid subject id" });

  Subject.delete(id, (err, result) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, message: "Subject not found" });

    return res.json({ ok: true, message: "Subject deleted successfully" });
  });
};
