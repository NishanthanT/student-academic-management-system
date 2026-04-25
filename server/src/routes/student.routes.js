const router = require("express").Router();
const { requireAuth, requireStudent } = require("../middleware/auth.middleware");

const attemptController = require("../controllers/student/attemptExam.controller");

const studentResultsController = require("../controllers/student/studentResults.controller");
const statsController = require("../controllers/student/studentStats.controller");

/**
 * @swagger
 * tags:
 *   name: Student
 *   description: Student portal and exam taking routes
 */

// 🔐 Guard: student only
router.use(requireAuth, requireStudent);

/**
 * @swagger
 * /api/student/stats:
 *   get:
 *     summary: Get student statistics for dashboard
 *     tags: [Student]
 *     responses:
 *       200:
 *         description: Student dashboard stats
 */
// ✅ NEW: Student Stats for Dashboard
router.get("/stats", statsController.getStudentStats);

/**
 * @swagger
 * /api/student/subjects:
 *   get:
 *     summary: Get allowed subjects for student
 *     tags: [Student]
 *     responses:
 *       200:
 *         description: List of allowed subjects
 */
// ✅ Get allowed subjects
router.get("/subjects", attemptController.listAllowedSubjects);

/**
 * @swagger
 * /api/student/subjects/{subjectId}/exams:
 *   get:
 *     summary: Get allowed exams by subject
 *     tags: [Student]
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of allowed exams for the subject
 */
// ✅ Get allowed exams by subject
router.get("/subjects/:subjectId/exams", attemptController.listAllowedExamsBySubject);

/**
 * @swagger
 * /api/student/exams/notices:
 *   get:
 *     summary: Get ALL approved exam notices for this student's year/sem
 *     tags: [Student]
 *     responses:
 *       200:
 *         description: List of approved exams
 */
// ✅ Get ALL approved exam notices for this student's year/sem
router.get("/exams/notices", attemptController.listAllApprovedExams);

/**
 * @swagger
 * /api/student/exams/{examId}/start:
 *   post:
 *     summary: Start an exam (verifies password)
 *     tags: [Student]
 *     parameters:
 *       - in: path
 *         name: examId
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
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Exam started successfully
 */
// ✅ Start exam (password verify)
router.post("/exams/:examId/start", attemptController.startExam);

/**
 * @swagger
 * /api/student/exams/{examId}/questions:
 *   get:
 *     summary: Get exam questions (after starting)
 *     tags: [Student]
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Exam questions retrieved
 */
// ✅ Get questions (after start)
router.get("/exams/:examId/questions", attemptController.getQuestions);

/**
 * @swagger
 * /api/student/exams/{examId}/submit:
 *   post:
 *     summary: Submit an exam
 *     tags: [Student]
 *     parameters:
 *       - in: path
 *         name: examId
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
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Exam submitted successfully
 */
// ✅ Submit exam
router.post("/exams/:examId/submit", attemptController.submitExam);

/* =========================
   ✅ NEW: Student Results Page Routes (ADD ONLY)
   ========================= */

/**
 * @swagger
 * /api/student/exams/{examId}/result:
 *   get:
 *     summary: Get student's result for a selected exam
 *     tags: [Student]
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Exam result data
 */
// ✅ Get my result for a selected exam (PASS/FAIL/ABSENT/PENDING)
router.get("/exams/:examId/result", studentResultsController.getMyExamResult);

module.exports = router;