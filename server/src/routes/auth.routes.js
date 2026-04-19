const router = require("express").Router();
const authController = require("../controllers/auth.controller");

const { requireAuth } = require("../middleware/auth.middleware");

// ✅ Auth
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// ✅ Get Profile (using token)
router.get("/me", requireAuth, authController.getMe);

module.exports = router;
