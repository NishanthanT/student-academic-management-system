const router = require("express").Router();
const { requireAuth, requireStudent, requireStaff } = require("../middleware/auth.middleware");

// ✅ ONLY THIS LINE CHANGED
const feedbackController = require("../controllers/student/feedback.controller");

/* =========================
   STUDENT: Feedback Routes
========================= */
router.get("/student/subjects/:subjectId/staffs", requireAuth, requireStudent, feedbackController.getSubjectStaffs);
router.post("/student/feedback", requireAuth, requireStudent, feedbackController.studentSendFeedback);

/* =========================
   STAFF: Feedback Routes
========================= */
router.get("/staff/feedback", requireAuth, requireStaff, feedbackController.staffGetFeedback);
router.patch("/staff/feedback/:feedbackId", requireAuth, requireStaff, feedbackController.updateFeedbackStatus);

module.exports = router;