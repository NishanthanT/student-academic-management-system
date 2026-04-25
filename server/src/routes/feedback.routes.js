const router = require("express").Router();
const { requireAuth, requireStudent, requireStaff } = require("../middleware/auth.middleware");

// ✅ ONLY THIS LINE CHANGED
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

/**
 * @swagger
 * /api/student/subjects/{subjectId}/staffs:
 *   get:
 *     summary: Get staffs for a specific subject (Student)
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of staff for subject
 */
router.get("/student/subjects/:subjectId/staffs", requireAuth, requireStudent, feedbackController.getSubjectStaffs);

/**
 * @swagger
 * /api/student/feedback:
 *   post:
 *     summary: Send feedback (Student)
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               staffId:
 *                 type: string
 *               subjectId:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feedback sent successfully
 */
router.post("/student/feedback", requireAuth, requireStudent, feedbackController.studentSendFeedback);

/* =========================
   STAFF: Feedback Routes
========================= */

/**
 * @swagger
 * /api/staff/feedback:
 *   get:
 *     summary: Get feedback (Staff)
 *     tags: [Feedback]
 *     responses:
 *       200:
 *         description: List of feedback for staff
 */
router.get("/staff/feedback", requireAuth, requireStaff, feedbackController.staffGetFeedback);

/**
 * @swagger
 * /api/staff/feedback/{feedbackId}:
 *   patch:
 *     summary: Update feedback status (Staff)
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: feedbackId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feedback status updated
 */
router.patch("/staff/feedback/:feedbackId", requireAuth, requireStaff, feedbackController.updateFeedbackStatus);

module.exports = router;