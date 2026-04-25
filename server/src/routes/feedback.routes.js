const router = require("express").Router();
const { requireAuth, requireStudent, requireStaff } = require("../middleware/auth.middleware");
const feedbackController = require("../controllers/student/feedback.controller");

/**
 * @swagger
 * tags:
 *   name: Feedback
 *   description: Student and Staff Feedback management
 */

/* =========================
   STUDENT: Feedback Routes
========================= */

// Get staffs for a specific subject
router.get("/student/subjects/:subjectId/staffs", requireAuth, requireStudent, feedbackController.getSubjectStaffs);

// Send feedback
router.post("/student", requireAuth, requireStudent, feedbackController.studentSendFeedback);

// Get my feedbacks (History)
router.get("/student", requireAuth, requireStudent, feedbackController.studentGetMyFeedbacks);

/* =========================
   STAFF: Feedback Routes
========================= */

// Get feedback received by staff
router.get("/staff", requireAuth, requireStaff, feedbackController.staffGetFeedback);

// Update feedback status
router.patch("/staff/:feedbackId", requireAuth, requireStaff, feedbackController.updateFeedbackStatus);

module.exports = router;