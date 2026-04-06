const router = require("express").Router();
const { requireAuth, requireStudent } = require("../middleware/auth.middleware");

const attemptController = require("../controllers/student/attemptExam.controller");

const studentResultsController = require("../controllers/student/studentResults.controller");
const statsController = require("../controllers/student/studentStats.controller");

// 🔐 Guard: student only
router.use(requireAuth, requireStudent);

// ✅ NEW: Student Stats for Dashboard
router.get("/stats", statsController.getStudentStats);

// ✅ Get allowed subjects
router.get("/subjects", attemptController.listAllowedSubjects);

// ✅ Get allowed exams by subject
router.get("/subjects/:subjectId/exams", attemptController.listAllowedExamsBySubject);

// ✅ Get ALL approved exam notices for this student's year/sem
router.get("/exams/notices", attemptController.listAllApprovedExams);

// ✅ Start exam (password verify)
router.post("/exams/:examId/start", attemptController.startExam);

// ✅ Get questions (after start)
router.get("/exams/:examId/questions", attemptController.getQuestions);

// ✅ Submit exam
router.post("/exams/:examId/submit", attemptController.submitExam);

/* =========================
   ✅ NEW: Student Results Page Routes (ADD ONLY)
   ========================= */

// ✅ Get my result for a selected exam (PASS/FAIL/ABSENT/PENDING)
router.get("/exams/:examId/result", studentResultsController.getMyExamResult);

module.exports = router;