// server/src/controllers/staff/exam.controller.js
const db = require("../../config/db");

// ✅ Convert any date input to MySQL DATETIME format: "YYYY-MM-DD HH:MM:SS"
// ✅ IMPORTANT FIX: DO NOT use toISOString() (UTC shift)
// ✅ If frontend sends local "YYYY-MM-DDTHH:mm" or "YYYY-MM-DDTHH:mm:ss", keep it as local.
const formatToMySQL = (input) => {
  if (!input) return null;

  // 1) If frontend sends "DD/MM/YYYY HH:mm"
  if (typeof input === "string" && input.includes("/") && input.includes(":")) {
    const [datePart, timePart] = input.split(" ");
    const [dd, mm, yyyy] = datePart.split("/");
    if (dd && mm && yyyy && timePart) {
      const hhmmss = timePart.length === 5 ? `${timePart}:00` : timePart;
      return `${yyyy}-${mm}-${dd} ${hhmmss}`.slice(0, 19);
    }
  }

  // 2) If input already is MySQL style "YYYY-MM-DD HH:mm:ss" (or without seconds)
  if (typeof input === "string") {
    // "YYYY-MM-DDTHH:mm" / "YYYY-MM-DDTHH:mm:ss"
    const isoLocal = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;
    if (isoLocal.test(input)) {
      const withSeconds = input.length === 16 ? `${input}:00` : input;
      return withSeconds.replace("T", " ").slice(0, 19);
    }

    // "YYYY-MM-DD HH:mm" / "YYYY-MM-DD HH:mm:ss"
    const mysqlLike = /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}(:\d{2})?$/;
    if (mysqlLike.test(input)) {
      const withSeconds = input.length === 16 ? `${input}:00` : input;
      return withSeconds.slice(0, 19);
    }

    // If backend receives ISO with timezone "Z" or "+05:30" (old frontend)
    // We'll parse it, BUT convert using LOCAL parts (no UTC shift).
    // Example: "2026-02-26T06:06:00Z" -> use local time components.
    const looksZoned = /Z$|[+-]\d{2}:\d{2}$/.test(input);
    if (looksZoned) {
      const d = new Date(input);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const mi = String(d.getMinutes()).padStart(2, "0");
        const ss = String(d.getSeconds()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
      }
    }
  }

  // 3) Fallback: parseable Date (but again, use LOCAL parts, not toISOString)
  const d = new Date(input);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  }

  return input;
};

// overlap: newStart < existingEnd AND newEnd > existingStart
const conflictSql = `
SELECT e.id, e.title, e.start_at, e.end_at
FROM exams e
JOIN subjects s ON s.id = e.subject_id
WHERE e.approval_status IN ('pending','approved')
  AND s.year = ?
  AND s.semester = ?
  AND (? < e.end_at) AND (? > e.start_at)
LIMIT 1
`;

/* =========================
   ✅ GET /api/staff/subjects
========================= */
exports.getMySubjects = (req, res) => {
  const staffId = req.user.id;

  const sql = `
    SELECT s.*
    FROM subject_staffs ss
    JOIN subjects s ON s.id = ss.subject_id
    WHERE ss.staff_id = ?
    ORDER BY s.year, s.semester, s.code
  `;

  db.query(sql, [staffId], (err, rows) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    res.json({ ok: true, data: rows });
  });
};

/* =========================
   ✅ GET /api/staff/exams
========================= */
exports.listMyExams = (req, res) => {
  const staffId = req.user.id;

  // ✅ ONLY CHANGE: add questions_count
  const sql = `
    SELECT 
      e.*, 
      s.code AS subject_code, 
      s.name AS subject_name, 
      s.year, 
      s.semester,
      COALESCE(qc.questions_count, 0) AS questions_count
    FROM exams e
    JOIN subjects s ON s.id = e.subject_id
    LEFT JOIN (
      SELECT exam_id, COUNT(*) AS questions_count
      FROM questions
      GROUP BY exam_id
    ) qc ON qc.exam_id = e.id
    WHERE e.created_by_staff_id = ?
    ORDER BY e.id DESC
  `;

  db.query(sql, [staffId], (err, rows) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    res.json({ ok: true, data: rows });
  });
};

/* =========================
   ✅ POST /api/staff/exams  (create DRAFT)
========================= */
exports.createDraft = (req, res) => {
  const staffId = req.user.id;

  const {
    subject_id,
    title,
    description,
    start_at,
    end_at,
    duration_minutes,
    total_marks,
    pass_marks,
  } = req.body;

  if (!subject_id || !title || !start_at || !end_at) {
    return res.status(400).json({ ok: false, message: "Missing fields" });
  }

  const startMySQL = formatToMySQL(start_at);
  const endMySQL = formatToMySQL(end_at);

  // 🔒 staff must be assigned to subject
  db.query(
    "SELECT 1 FROM subject_staffs WHERE staff_id=? AND subject_id=? LIMIT 1",
    [staffId, subject_id],
    (err, okRows) => {
      if (err) return res.status(500).json({ ok: false, message: "DB error" });
      if (!okRows.length) {
        return res
          .status(403)
          .json({ ok: false, message: "Not assigned to this subject" });
      }

      const sql = `
        INSERT INTO exams
        (subject_id, created_by_staff_id, title, description, start_at, end_at,
         duration_minutes, total_marks, pass_marks, approval_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
      `;

      db.query(
        sql,
        [
          subject_id,
          staffId,
          title,
          description || null,
          startMySQL,
          endMySQL,
          duration_minutes || 60,
          total_marks || 100,
          pass_marks || 40,
        ],
        (e2, result) => {
          if (e2) return res.status(500).json({ ok: false, message: "DB error" });
          res.json({ ok: true, id: result.insertId });
        }
      );
    }
  );
};

/* =========================
   ✅ PUT /api/staff/exams/:id  (edit DRAFT/CHANGES)
========================= */
exports.updateDraftOrChanges = (req, res) => {
  const staffId = req.user.id;
  const id = req.params.id;

  db.query(
    "SELECT * FROM exams WHERE id=? AND created_by_staff_id=? LIMIT 1",
    [id, staffId],
    (err, rows) => {
      if (err) return res.status(500).json({ ok: false, message: "DB error" });
      if (!rows.length)
        return res.status(404).json({ ok: false, message: "Exam not found" });

      const ex = rows[0];
      if (!["draft", "changes_requested"].includes(ex.approval_status)) {
        return res
          .status(403)
          .json({ ok: false, message: "Cannot edit in this status" });
      }

      const {
        subject_id,
        title,
        description,
        start_at,
        end_at,
        duration_minutes,
        total_marks,
        pass_marks,
      } = req.body;

      const startMySQL = formatToMySQL(start_at ?? ex.start_at);
      const endMySQL = formatToMySQL(end_at ?? ex.end_at);

      const doUpdate = (finalSubjectId) => {
        const sql = `
          UPDATE exams SET
            subject_id=?,
            title=?,
            description=?,
            start_at=?,
            end_at=?,
            duration_minutes=?,
            total_marks=?,
            pass_marks=?
          WHERE id=? AND created_by_staff_id=?
        `;

        db.query(
          sql,
          [
            finalSubjectId,
            title ?? ex.title,
            description ?? ex.description,
            startMySQL,
            endMySQL,
            duration_minutes ?? ex.duration_minutes,
            total_marks ?? ex.total_marks,
            pass_marks ?? ex.pass_marks,
            id,
            staffId,
          ],
          (e2) => {
            if (e2) return res.status(500).json({ ok: false, message: "DB error" });
            res.json({ ok: true });
          }
        );
      };

      // if subject changed, re-check assignment
      if (subject_id && Number(subject_id) !== Number(ex.subject_id)) {
        db.query(
          "SELECT 1 FROM subject_staffs WHERE staff_id=? AND subject_id=? LIMIT 1",
          [staffId, subject_id],
          (e3, okRows) => {
            if (e3) return res.status(500).json({ ok: false, message: "DB error" });
            if (!okRows.length) {
              return res
                .status(403)
                .json({ ok: false, message: "Not assigned to this subject" });
            }
            doUpdate(subject_id);
          }
        );
      } else {
        doUpdate(ex.subject_id);
      }
    }
  );
};

/* =========================
   ✅ DELETE /api/staff/exams/:id  (only DRAFT)
========================= */
exports.deleteDraft = (req, res) => {
  const staffId = req.user.id;
  const id = req.params.id;

  db.query(
    "SELECT approval_status FROM exams WHERE id=? AND created_by_staff_id=? LIMIT 1",
    [id, staffId],
    (err, rows) => {
      if (err) return res.status(500).json({ ok: false, message: "DB error" });
      if (!rows.length) return res.status(404).json({ ok: false, message: "Not found" });

      if (rows[0].approval_status !== "draft") {
        return res
          .status(403)
          .json({ ok: false, message: "Only Draft can be deleted" });
      }

      db.query(
        "DELETE FROM exams WHERE id=? AND created_by_staff_id=?",
        [id, staffId],
        (e2) => {
          if (e2) return res.status(500).json({ ok: false, message: "DB error" });
          res.json({ ok: true });
        }
      );
    }
  );
};

/* =========================
   ✅ PATCH /api/staff/exams/:id/submit  (DRAFT -> PENDING)
========================= */
exports.submitForApproval = (req, res) => {
  const staffId = req.user.id;
  const id = req.params.id;

  db.query(
    `SELECT e.*, s.year, s.semester
     FROM exams e
     JOIN subjects s ON s.id = e.subject_id
     WHERE e.id=? AND e.created_by_staff_id=? LIMIT 1`,
    [id, staffId],
    (err, rows) => {
      if (err) return res.status(500).json({ ok: false, message: "DB error" });
      if (!rows.length) return res.status(404).json({ ok: false, message: "Not found" });

      const ex = rows[0];
      if (ex.approval_status !== "draft") {
        return res
          .status(403)
          .json({ ok: false, message: "Only Draft can be submitted" });
      }

      db.query(conflictSql, [ex.year, ex.semester, ex.start_at, ex.end_at], (e2, conf) => {
        if (e2) return res.status(500).json({ ok: false, message: "DB error" });

        if (conf.length) {
          return res.status(409).json({
            ok: false,
            message: `Time clash with another exam (${conf[0].title}). Change schedule.`,
          });
        }

        db.query(
          "UPDATE exams SET approval_status='pending', admin_note=NULL WHERE id=? AND created_by_staff_id=?",
          [id, staffId],
          (e3) => {
            if (e3) return res.status(500).json({ ok: false, message: "DB error" });
            res.json({ ok: true, message: "Submitted for approval" });
          }
        );
      });
    }
  );
};

/* =========================
   ✅ PATCH /api/staff/exams/:id/cancel-request  (PENDING -> DRAFT)
========================= */
exports.cancelRequest = (req, res) => {
  const staffId = req.user.id;
  const id = req.params.id;

  db.query(
    "UPDATE exams SET approval_status='draft' WHERE id=? AND created_by_staff_id=? AND approval_status='pending'",
    [id, staffId],
    (err, r) => {
      if (err) return res.status(500).json({ ok: false, message: "DB error" });
      if (r.affectedRows === 0)
        return res.status(403).json({ ok: false, message: "Cannot cancel now" });
      res.json({ ok: true });
    }
  );
};

/* =========================
   ✅ PATCH /api/staff/exams/:id/resubmit  (CHANGES -> PENDING)
========================= */
exports.resubmit = (req, res) => {
  const staffId = req.user.id;
  const id = req.params.id;

  db.query(
    `SELECT e.*, s.year, s.semester
     FROM exams e
     JOIN subjects s ON s.id = e.subject_id
     WHERE e.id=? AND e.created_by_staff_id=? LIMIT 1`,
    [id, staffId],
    (err, rows) => {
      if (err) return res.status(500).json({ ok: false, message: "DB error" });
      if (!rows.length) return res.status(404).json({ ok: false, message: "Not found" });

      const ex = rows[0];
      if (ex.approval_status !== "changes_requested") {
        return res.status(403).json({
          ok: false,
          message: "Only Changes Requested can be resubmitted",
        });
      }

      db.query(conflictSql, [ex.year, ex.semester, ex.start_at, ex.end_at], (e2, conf) => {
        if (e2) return res.status(500).json({ ok: false, message: "DB error" });

        if (conf.length) {
          return res.status(409).json({
            ok: false,
            message: `Time clash with another exam (${conf[0].title}). Change schedule.`,
          });
        }

        db.query(
          "UPDATE exams SET approval_status='pending' WHERE id=? AND created_by_staff_id=?",
          [id, staffId],
          (e3) => {
            if (e3) return res.status(500).json({ ok: false, message: "DB error" });
            res.json({ ok: true });
          }
        );
      });
    }
  );
};

/* =========================
   ✅ PATCH /api/staff/exams/:id/description  (APPROVED desc only)
========================= */
exports.updateDescriptionOnly = (req, res) => {
  const staffId = req.user.id;
  const id = req.params.id;
  const { description } = req.body;

  db.query(
    "UPDATE exams SET description=? WHERE id=? AND created_by_staff_id=? AND approval_status='approved'",
    [description || null, id, staffId],
    (err, r) => {
      if (err) return res.status(500).json({ ok: false, message: "DB error" });
      if (r.affectedRows === 0)
        return res.status(403).json({ ok: false, message: "Cannot edit now" });
      res.json({ ok: true });
    }
  );
};