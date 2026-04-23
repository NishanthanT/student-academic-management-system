// server/src/app.js (or server.js)  ✅ UPDATED FULL CODE

const express = require("express");
const cors = require("cors");

require("./config/db");

const app = express();


// ✅ CORS
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow any origin for local development flexibility
      return cb(null, true);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.options(/.*/, cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

/* =========================
   ✅ Routes
========================= */

// Auth
const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

// Admin
const adminRoutes = require("./routes/admin.routes");
app.use("/api/admin", adminRoutes);

// Staff (all staff modules)
const staffRoutes = require("./routes/staff.routes");
app.use("/api/staff", staffRoutes);

// ✅ Student
const studentRoutes = require("./routes/student.routes");
app.use("/api/student", studentRoutes);

// ✅ Feedback
const feedbackRoutes = require("./routes/feedback.routes");
app.use("/api", feedbackRoutes);

/* =========================
   ✅ Health
========================= */
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "UniExam API running" });
});

module.exports = app;