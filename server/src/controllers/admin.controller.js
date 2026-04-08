const bcrypt = require("bcrypt");
const db = require("../config/db");
const { sendMail } = require("../services/mailer");

// POST /api/admin/users
exports.createUser = (req, res) => {
  const {
    name,
    email,
    password,
    role,
    current_year,
    current_semester,
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(422).json({ ok: false, message: "Please fill the Name" });
  }

  if (!email || !email.trim()) {
    return res.status(422).json({ ok: false, message: "Please fill the Email" });
  }

  const emailOk = /^\S+@\S+\.\S+$/.test(email);
  if (!emailOk) {
    return res.status(422).json({ ok: false, message: "Please enter a valid Email" });
  }

  if (!password) {
    return res.status(422).json({ ok: false, message: "Please fill the Password" });
  }

  if (password.length < 6) {
    return res
      .status(422)
      .json({ ok: false, message: "Password must be at least 6 characters" });
  }

  const allowedRoles = ["admin", "staff", "student"];
  if (!role || !allowedRoles.includes(role)) {
    return res.status(422).json({ ok: false, message: "Invalid role selected" });
  }

  // ✅ Student extra validations
  let cy = null;
  let cs = null;

  if (role === "student") {
    cy = Number(current_year);
    cs = Number(current_semester);

    if (!current_year) {
      return res.status(422).json({ ok: false, message: "Please select the Year" });
    }
    if (![1, 2, 3, 4].includes(cy)) {
      return res.status(422).json({ ok: false, message: "Year must be 1 to 4" });
    }

    if (!current_semester) {
      return res.status(422).json({ ok: false, message: "Please select the Semester" });
    }
    if (![1, 2].includes(cs)) {
      return res.status(422).json({ ok: false, message: "Semester must be 1 or 2" });
    }
  }

  // ✅ Check duplicate email
  db.query(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [email.trim().toLowerCase()],
    async (err, rows) => {
      if (err) return res.status(500).json({ ok: false, message: "DB error" });

      if (rows.length > 0) {
        return res.status(409).json({ ok: false, message: "Email already exists" });
      }

      try {
        const hash = await bcrypt.hash(password, 10);

        db.query(
          `INSERT INTO users (name, email, password, role, current_year, current_semester)
           VALUES (?,?,?,?,?,?)`,
          [
            name.trim(),
            email.trim().toLowerCase(),
            hash,
            role,
            role === "student" ? cy : null,
            role === "student" ? cs : null,
          ],
          (err2, result) => {
            if (err2) return res.status(500).json({ ok: false, message: "DB error" });

            return res.status(201).json({
              ok: true,
              message: "User created successfully",
              user: {
                id: result.insertId,
                name: name.trim(),
                email: email.trim().toLowerCase(),
                role,
                current_year: role === "student" ? cy : null,
                current_semester: role === "student" ? cs : null,
              },
            });
          }
        );
      } catch (e) {
        return res.status(500).json({ ok: false, message: "Server error" });
      }
    }
  );
};

// GET /api/admin/users
exports.listUsers = (req, res) => {
  const role = (req.query.role || "").trim().toLowerCase();
  const search = (req.query.search || "").trim();

  const allowedRoles = ["admin", "staff", "student"];

  let sql = `SELECT id, name, email, role, current_year, current_semester, created_at
             FROM users`;
  const params = [];
  const where = [];

  if (role && role !== "all") {
    if (!allowedRoles.includes(role)) {
      return res.status(422).json({ ok: false, message: "Invalid role filter" });
    }
    where.push("role = ?");
    params.push(role);
  }

  if (search) {
    where.push("(name LIKE ? OR email LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  if (where.length) sql += " WHERE " + where.join(" AND ");
  sql += " ORDER BY id DESC";

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    return res.json({ ok: true, data: rows });
  });
};

// PUT /api/admin/users/:id
exports.updateUser = (req, res) => {
  const id = Number(req.params.id);
  const { name, email, role, current_year, current_semester } = req.body;

  if (!id) return res.status(422).json({ ok: false, message: "Invalid user id" });

  if (!name || !name.trim()) {
    return res.status(422).json({ ok: false, message: "Please fill the Name" });
  }

  if (!email || !email.trim()) {
    return res.status(422).json({ ok: false, message: "Please fill the Email" });
  }

  const emailOk = /^\S+@\S+\.\S+$/.test(email);
  if (!emailOk) {
    return res.status(422).json({ ok: false, message: "Please enter a valid Email" });
  }

  const allowedRoles = ["admin", "staff", "student"];
  if (!role || !allowedRoles.includes(role)) {
    return res.status(422).json({ ok: false, message: "Invalid role selected" });
  }

  let cy = null;
  let cs = null;

  if (role === "student") {
    if (current_year !== undefined && current_year !== null && current_year !== "") {
      cy = Number(current_year);
      if (![1, 2, 3, 4].includes(cy)) {
        return res.status(422).json({ ok: false, message: "Year must be 1 to 4" });
      }
    }
    if (current_semester !== undefined && current_semester !== null && current_semester !== "") {
      cs = Number(current_semester);
      if (![1, 2].includes(cs)) {
        return res.status(422).json({ ok: false, message: "Semester must be 1 or 2" });
      }
    }
  }

  db.query(
    "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1",
    [email.trim().toLowerCase(), id],
    (err, rows) => {
      if (err) return res.status(500).json({ ok: false, message: "DB error" });
      if (rows.length) {
        return res.status(409).json({ ok: false, message: "Email already exists" });
      }

      db.query(
        `UPDATE users
         SET name = ?, email = ?, role = ?, current_year = ?, current_semester = ?
         WHERE id = ?`,
        [
          name.trim(),
          email.trim().toLowerCase(),
          role,
          role === "student" ? cy : null,
          role === "student" ? cs : null,
          id,
        ],
        (err2) => {
          if (err2) return res.status(500).json({ ok: false, message: "DB error" });
          return res.json({ ok: true, message: "User updated successfully" });
        }
      );
    }
  );
};

// DELETE /api/admin/users/:id
exports.deleteUser = (req, res) => {
  const id = Number(req.params.id);
  const { reason } = req.body;

  if (!id) return res.status(422).json({ ok: false, message: "Invalid user id" });
  if (!reason || reason.trim().length < 5) {
    return res.status(422).json({ ok: false, message: "A valid reason (min 5 chars) is required" });
  }

  // 1) Fetch user data before deletion
  db.query("SELECT email, name FROM users WHERE id = ?", [id], async (err, rows) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    if (rows.length === 0) return res.status(404).json({ ok: false, message: "User not found" });

    const user = rows[0];

    // 2) Delete from DB
    db.query("DELETE FROM users WHERE id = ?", [id], async (err2, result) => {
      if (err2) return res.status(500).json({ ok: false, message: "DB error" });

      // 3) Send Notification Email (async)
      try {
        await sendMail({
          to: user.email,
          subject: "UniExam - Account Notification",
          text: `Hi ${user.name},\n\nYour account has been deleted by the administrator.\nReason: ${reason}\n\nThanks,\nUniExam Admin`,
          html: `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
              <h2>Account Notification</h2>
              <p>Hi <b>${user.name}</b>,</p>
              <p>Your account on the UniExam portal has been deleted by the administrator.</p>
              <p><b>Reason:</b> ${reason}</p>
              <hr />
              <p style="font-size: 12px; color: #666;">If you believe this is an error, please contact the administrator.</p>
            </div>
          `,
        });
      } catch (mailErr) {
        console.error("Mail error during user deletion:", mailErr.message);
      }

      return res.json({ ok: true, message: "User deleted and notified successfully" });
    });
  });
};
// GET /api/admin/stats
exports.getDashboardStats = (req, res) => {
  const stats = {
    totalUsers: 0,
    totalStudents: 0,
    totalStaff: 0,
    totalSubjects: 0,
    totalExams: 0,
    recentUsers: [],
  };

  const queries = [
    "SELECT COUNT(*) as count FROM users",
    "SELECT COUNT(*) as count FROM users WHERE role = 'student'",
    "SELECT COUNT(*) as count FROM users WHERE role = 'staff'",
    "SELECT COUNT(*) as count FROM subjects",
    "SELECT COUNT(*) as count FROM exams",
    "SELECT id, name, email, role, created_at FROM users ORDER BY id DESC LIMIT 5",
  ];

  let completed = 0;
  let hasError = false;

  queries.forEach((sql, idx) => {
    db.query(sql, (err, rows) => {
      if (hasError) return;
      if (err) {
        hasError = true;
        return res.status(500).json({ ok: false, message: "DB error" });
      }

      if (idx === 0) stats.totalUsers = rows[0].count;
      else if (idx === 1) stats.totalStudents = rows[0].count;
      else if (idx === 2) stats.totalStaff = rows[0].count;
      else if (idx === 3) stats.totalSubjects = rows[0].count;
      else if (idx === 4) stats.totalExams = rows[0].count;
      else if (idx === 5) stats.recentUsers = rows;

      completed++;
      if (completed === queries.length) {
        return res.json({ ok: true, data: stats });
      }
    });
  });
};

/* ===========================
   ✅ System Settings
=========================== */

exports.getSettings = (req, res) => {
  db.query("SELECT * FROM global_settings", (err, rows) => {
    if (err) return res.status(500).json({ ok: false, message: "DB error" });
    const settingsMap = {};
    rows.forEach(row => {
      try {
        settingsMap[row.setting_key] = JSON.parse(row.setting_value);
      } catch(e) {
        settingsMap[row.setting_key] = row.setting_value;
      }
    });
    return res.json({ ok: true, data: settingsMap });
  });
};

exports.updateSettings = (req, res) => {
  const settings = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ ok: false, message: "Invalid settings data" });
  }

  const keys = Object.keys(settings);
  if (keys.length === 0) return res.json({ ok: true, message: "Settings updated" });

  let completed = 0;
  let hasError = false;

  keys.forEach((key) => {
    const val = typeof settings[key] === 'object' ? JSON.stringify(settings[key]) : settings[key];
    db.query(
      "INSERT INTO global_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?", 
      [key, String(val), String(val)],
      (err) => {
        if (hasError) return;
        if (err) {
            hasError = true;
            return res.status(500).json({ ok: false, message: "Failed to update settings" });
        }
        completed++;
        if (completed === keys.length) {
            return res.json({ ok: true, message: "Settings updated successfully" });
        }
      }
    );
  });
};
