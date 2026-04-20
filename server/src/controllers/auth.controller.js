// server/src/controllers/auth.controller.js

const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { transporter } = require("../services/mailer");

const TOKEN_EXP_MIN = 15;

// sha256 helper (fast + deterministic)
const sha256 = (str) => crypto.createHash("sha256").update(str).digest("hex");

// ✅ build frontend URL for email (mobile friendly)
// Priority: FRONTEND_URL -> APP_URL -> fallback using request host
const getFrontendBaseUrl = (req) => {
  return (
    process.env.FRONTEND_URL ||
    process.env.APP_URL ||
    `http://${req.hostname}:5173`
  );
};

// ✅ LOGIN (JWT)
/**
 * Authenticates a user and issues a JWT token.
 * @param {Object} req - The Express request object containing email and password in the body.
 * @param {Object} res - The Express response object used to send back the token or error.
 * @returns {Object} JSON response with authentication status and token.
 */
exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ ok: false, message: "Email and password required" });
  }

  db.query(
    "SELECT id, name, email, password, role FROM users WHERE email = ? LIMIT 1",
    [email],
    async (err, rows) => {
      if (err) return res.status(500).json({ ok: false, message: "DB error" });
      if (!rows.length)
        return res.status(401).json({ ok: false, message: "Invalid credentials" });

      const user = rows[0];

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res
          .status(401)
          .json({ ok: false, message: "Invalid credentials" });
      }

      if (!process.env.JWT_SECRET) {
        return res
          .status(500)
          .json({ ok: false, message: "JWT_SECRET not set in .env" });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );

      return res.json({
        ok: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }
  );
};

// ✅ GET ME (Profile lookup)
exports.getMe = (req, res) => {
  const userId = req.user.id;

  db.query(
    "SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1",
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ ok: false, message: "DB error" });
      if (!rows.length)
        return res.status(404).json({ ok: false, message: "User not found" });

      return res.json({
        ok: true,
        user: rows[0],
      });
    }
  );
};

// ✅ FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  const genericMsg = {
    ok: true,
    message: "If the email exists, a reset link has been sent.",
  };

  if (!email) {
    return res.status(400).json({ ok: false, message: "Email required" });
  }

  db.query(
    "SELECT id, email, name FROM users WHERE email = ? LIMIT 1",
    [email],
    (err, rows) => {
      if (err) return res.status(500).json({ ok: false, message: "DB error" });
      if (!rows.length) return res.json(genericMsg);

      const user = rows[0];

      // 1) raw token
      const rawToken = crypto.randomBytes(32).toString("hex");

      // 2) hash token (sha256)
      const tokenHash = sha256(rawToken);

      // 3) expiry
      const expiresAt = new Date(Date.now() + TOKEN_EXP_MIN * 60 * 1000);

      // 4) invalidate old tokens for that user (optional but good)
      db.query(
        "UPDATE password_resets SET used = 1 WHERE user_id = ?",
        [user.id],
        () => {}
      );

      // 5) store
      db.query(
        "INSERT INTO password_resets (user_id, token_hash, expires_at, used) VALUES (?, ?, ?, 0)",
        [user.id, tokenHash, expiresAt],
        async (err2) => {
          if (err2)
            return res.status(500).json({ ok: false, message: "DB error" });

          // ✅ Use frontend base URL (IMPORTANT for mobile)
          const baseUrl = getFrontendBaseUrl(req);
          const resetLink = `${baseUrl}/reset-password?token=${rawToken}`;

          // ✅ Professional Email Content
          const subject = "UniExam - Password Reset Request";
          const displayName = user.name || "User";

          const html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
              <h2 style="margin: 0 0 10px;">UniExam Password Reset</h2>
              <p>Hi ${displayName},</p>
              <p>We received a request to reset your UniExam account password.</p>

              <p>
                <a href="${resetLink}"
                   style="display:inline-block; background:#2563eb; color:#fff; padding:10px 16px; text-decoration:none; border-radius:6px;">
                  Reset Password
                </a>
              </p>

              <p style="margin-top:10px;">
                This link will expire in <b>${TOKEN_EXP_MIN} minutes</b>.
              </p>

              <p>If you didn’t request this, you can safely ignore this email.</p>

              <hr style="border:none; border-top:1px solid #eee; margin:18px 0;" />

              <p style="font-size: 12px; color:#666;">
                If the button doesn’t work, copy and paste this link into your browser:<br/>
                <a href="${resetLink}">${resetLink}</a>
              </p>

              <p style="font-size: 12px; color:#666; margin-top:12px;">
                © ${new Date().getFullYear()} UniExam
              </p>
            </div>
          `;

          try {
            await transporter.sendMail({
              from: process.env.MAIL_FROM,
              to: user.email,
              subject,
              html,
            });
          } catch (e) {
            console.error("Mail error:", e);
            // still return generic msg (security)
          }

          return res.json(genericMsg);
        }
      );
    }
  );
};

// ✅ RESET PASSWORD
exports.resetPassword = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token || !newPassword || !confirmPassword) {
    return res
      .status(400)
      .json({
        ok: false,
        message: "token, newPassword, confirmPassword required",
      });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ ok: false, message: "Passwords do not match" });
  }

  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ ok: false, message: "Password must be at least 8 characters" });
  }

  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
  if (!strongRegex.test(newPassword)) {
    return res.status(400).json({
      ok: false,
      message:
        "Password must include Uppercase, Lowercase, Number and Special Character",
    });
  }

  const tokenHash = sha256(token);

  db.query(
    `SELECT id, user_id, expires_at, used
     FROM password_resets
     WHERE token_hash = ?
     LIMIT 1`,
    [tokenHash],
    async (err, rows) => {
      if (err) return res.status(500).json({ ok: false, message: "DB error" });
      if (!rows.length)
        return res
          .status(400)
          .json({ ok: false, message: "Invalid or expired token" });

      const r = rows[0];

      if (r.used) return res.status(400).json({ ok: false, message: "Token already used" });

      if (new Date(r.expires_at).getTime() < Date.now()) {
        return res.status(400).json({ ok: false, message: "Token expired" });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      db.query(
        "UPDATE users SET password = ? WHERE id = ?",
        [passwordHash, r.user_id],
        (err2) => {
          if (err2) return res.status(500).json({ ok: false, message: "DB error" });

          db.query(
            "UPDATE password_resets SET used = 1 WHERE id = ?",
            [r.id],
            (err3) => {
              if (err3) return res.status(500).json({ ok: false, message: "DB error" });

              return res.json({ ok: true, message: "Password reset successful" });
            }
          );
        }
      );
    }
  );
};
