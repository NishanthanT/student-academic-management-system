const jwt = require("jsonwebtoken");

exports.requireAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return res.status(401).json({ ok: false, message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, message: "Invalid token" });
  }
};

exports.requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ ok: false, message: "Admin only" });
  }
  next();
};

/*
// TEST PLAN - requireAuth
// describe('Auth Middleware', () => {
//   it.todo('should return 401 if authorization header is absent');
//   it.todo('should return 401 if invalid JWT is passed');
//   it.todo('should call next() and populate req.user on valid token');
// });
*/

// ✅ NEW: Staff only (existing logic touch pannala)
exports.requireStaff = (req, res, next) => {
  if (req.user?.role !== "staff") {
    return res.status(403).json({ ok: false, message: "Staff only" });
  }
  next();
};

// ✅ NEW: Student only
exports.requireStudent = (req, res, next) => {
  if (req.user?.role !== "student") {
    return res.status(403).json({ ok: false, message: "Student only" });
  }
  next();
};