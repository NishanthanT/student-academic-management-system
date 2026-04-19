const router = require("express").Router();
const { requireAuth, requireAdmin } = require("../middleware/auth.middleware");

// ✅ users controller (already)
const adminController = require("../controllers/admin.controller");

// ✅ subjects controller (already)
const subjectController = require("../controllers/admin/subject.controller");

// ✅ subject-staff controller (already)
const subjectStaffController = require("../controllers/admin/subjectStaff.controller");

// ✅ NEW: exam management controller
const adminExamController = require("../controllers/admin/admin.exam.controller");

/* ===========================
   ✅ Dashboard Stats
=========================== */
router.get("/stats", requireAuth, requireAdmin, adminController.getDashboardStats);

/* ===========================
   ✅ System Settings
=========================== */
router.get("/settings", adminController.getSettings); // Public route or admin only depending on consumption! But SettingsContext fetches it globally, so just /settings without auth
router.put("/settings", requireAuth, requireAdmin, adminController.updateSettings);

/* ===========================
   ✅ Users
=========================== */
router.post("/users", requireAuth, requireAdmin, adminController.createUser);
router.get("/users", requireAuth, requireAdmin, adminController.listUsers);
router.put("/users/:id", requireAuth, requireAdmin, adminController.updateUser);
router.delete("/users/:id", requireAuth, requireAdmin, adminController.deleteUser);

/* ===========================
   ✅ Subjects
=========================== */
router.post("/subjects", requireAuth, requireAdmin, subjectController.createSubject);
router.get("/subjects", requireAuth, requireAdmin, subjectController.listSubjects);
router.put("/subjects/:id", requireAuth, requireAdmin, subjectController.updateSubject);
router.delete("/subjects/:id", requireAuth, requireAdmin, subjectController.deleteSubject);

/* ===========================
   ✅ Subject → Staff (One Subject → Many Staff)
=========================== */
router.get(
  "/subjects/:subjectId/staffs",
  requireAuth,
  requireAdmin,
  subjectStaffController.getSubjectStaffs
);

router.post(
  "/subjects/:subjectId/staffs",
  requireAuth,
  requireAdmin,
  subjectStaffController.addSubjectStaffs
);

router.delete(
  "/subjects/:subjectId/staffs/:staffId",
  requireAuth,
  requireAdmin,
  subjectStaffController.removeSubjectStaff
);

/* ===========================
   ✅ All assignments table (Edit/Delete)
=========================== */
router.get(
  "/staff-subjects",
  requireAuth,
  requireAdmin,
  subjectStaffController.listStaffSubjects
);

router.put(
  "/staff-subjects/:id",
  requireAuth,
  requireAdmin,
  subjectStaffController.updateStaffSubject
);

router.delete(
  "/staff-subjects/:id",
  requireAuth,
  requireAdmin,
  subjectStaffController.deleteStaffSubject
);

/* ===========================
   ✅ Exam Management (Admin)
   - List submitted exams
   - Approve / Reject / Request changes
=========================== */

// ✅ GET all exams for admin management (frontend: PATH_LIST="/admin/exams")
router.get("/exams", requireAuth, requireAdmin, adminExamController.listAll);

// ✅ Approve (PENDING -> APPROVED)
router.patch("/exams/:id/approve", requireAuth, requireAdmin, adminExamController.approve);

// ✅ Reject (PENDING -> REJECTED) body: { admin_note }
router.patch("/exams/:id/reject", requireAuth, requireAdmin, adminExamController.reject);

// ✅ Request Changes (PENDING -> CHANGES_REQUESTED) body: { admin_note }
router.patch("/exams/:id/changes", requireAuth, requireAdmin, adminExamController.requestChanges);

module.exports = router;