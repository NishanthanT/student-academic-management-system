// server/src/routes/staff.routes.js

const router = require("express").Router();
const { requireAuth, requireStaff } = require("../middleware/auth.middleware");

// ✅ Controllers
const mySubjectsController = require("../controllers/staff/mySubjects.controller");
const examsController = require("../controllers/staff/exams.controller");
const questionsController = require("../controllers/staff/questions.controller");
const allowStudentsController = require("../controllers/staff/allowStudents.controller");
const studentSearchController = require("../controllers/staff/studentSearch.controller");

// ✅ NEW: Results Controller (Auto-correct + Results Table)
const staffResults = require("../controllers/staff/staffResults.controller");

/**
 * ✅ Apply auth + staff guard for all staff routes
 */
router.use(requireAuth, requireStaff);

/* =========================
   ✅ Subjects (Staff assigned)
========================= */
router.get("/subjects", mySubjectsController.listMySubjects);
router.get("/my-subjects", mySubjectsController.listMySubjects);

/* =========================
   ✅ Exams (Staff)
========================= */
router.get("/exams", examsController.listMyExams);
router.post("/exams", examsController.createDraft);
router.put("/exams/:id", examsController.updateDraftOrChanges);
router.delete("/exams/:id", examsController.deleteDraft);
router.patch("/exams/:id/submit", examsController.submitForApproval);
router.patch("/exams/:id/cancel-request", examsController.cancelRequest);
router.patch("/exams/:id/resubmit", examsController.resubmit);
router.patch("/exams/:id/description", examsController.updateDescriptionOnly);

/* =========================
   ✅ Questions (Staff)
========================= */
router.get("/exams/:examId/questions", questionsController.getQuestionsByExam);
router.post("/exams/:examId/questions/bulk", questionsController.bulkUpsertQuestions);
router.delete("/questions/:questionId", questionsController.deleteQuestion);

/* =========================
   ✅ Allow Students Page
========================= */

// List approved exams (for Allow Students main table)
router.get("/allow-exams", allowStudentsController.listAllowExams);

// ✅ Quiz settings (Save Password button uses this)
router.put("/exams/:examId/quiz-settings", allowStudentsController.saveQuizSettings);

// ✅ Allowed students list
router.get("/exams/:examId/allowed-students", allowStudentsController.listAllowedStudents);

// ✅ Add student to allowed list
router.post("/exams/:examId/allowed-students", allowStudentsController.addAllowedStudent);

// ✅ Revoke student
router.patch(
  "/exams/:examId/allowed-students/:studentId/revoke",
  allowStudentsController.revokeStudent
);

// ✅ Approve all allowed students
router.patch(
  "/exams/:examId/allowed-students/approve-all",
  allowStudentsController.approveAll
);

/* =========================
   ✅ Student Search
========================= */
router.get("/students/search", studentSearchController.searchStudents);

/* =========================
   ✅ Results (Auto-correct + Table)  ✅ NEW ✅
   NOTE:
   - /subjects/:subjectId/exams is used by Results page to list exams by subject
   - /exams/:examId/auto-grade runs auto grading
   - /exams/:examId/results gives marks table (with student_id filter)
   - /exams/:examId/results/update lets staff override total marks
========================= */

// 1) Exams by subject (created by this staff)
router.get("/subjects/:subjectId/exams", staffResults.listStaffExamsBySubject);

// 2) Auto-grade (MCQ + ONE_WORD)
router.post("/exams/:examId/auto-grade", staffResults.autoGradeExam);

// 3) Results table
router.get("/exams/:examId/results", staffResults.getExamResults);

// 4) Update total marks override
router.put("/exams/:examId/results/update", staffResults.updateTotalMarks);

module.exports = router;