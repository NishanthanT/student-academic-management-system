// server/src/app.js (or server.js)  ✅ UPDATED FULL CODE

const express = require("express");
const cors = require("cors");

require("./config/db");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://10.253.38.225:5173",
];

// ✅ CORS
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS blocked: " + origin));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.options(/.*/, cors());
app.use(express.json());

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

/* =========================
   ✅ Health
========================= */
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "UniExam API running" });
});

module.exports = app;