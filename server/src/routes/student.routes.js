const router = require("express").Router();
const { requireAuth, requireStudent } = require("../middleware/auth.middleware");

const attemptController = require("../controllers/student/attemptExam.controller");

// ✅ NEW: Student Results Controller (only for results page)
const studentResultsController = require("../controllers/student/studentResults.controller");

// 🔐 Guard: student only
router.use(requireAuth, requireStudent);

// ✅ Get allowed subjects
router.get("/subjects", attemptController.listAllowedSubjects);

// ✅ Get allowed exams by subject
router.get("/subjects/:subjectId/exams", attemptController.listAllowedExamsBySubject);

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