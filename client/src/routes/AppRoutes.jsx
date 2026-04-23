// src/routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import ProtectedRoute from "../components/ProtectedRoute";

// ✅ Student
import StudentDashboard from "../pages/Student/StudentDashboard";
import ExamNotice from "../pages/Student/ExamNotice";
import AttemptExam from "../pages/Student/AttemptExam";
import StudentResults from "../pages/Student/StudentResults";
import StudentConcernForm from "../pages/Student/Studentconcernform";

// ✅ Admin
import AdminLayout from "../pages/Admin/AdminLayout";
import DashboardHome from "../pages/Admin/DashboardHome";
import CreateUser from "../pages/Admin/CreateUser";
import ViewUsers from "../pages/Admin/ViewUsers";
import CreateSubject from "../pages/Admin/CreateSubject";
import AssignStaff from "../pages/Admin/AssignStaff";
import ExamManagement from "../pages/Admin/ExamManagement";
import Settings from "../pages/Admin/Settings";
import MarkRequests from "../pages/Admin/MarkRequests";

// ✅ Staff
import StaffLayout from "../pages/staff/StaffLayout";
import StaffHome from "../pages/staff/DashboardHome";
import MySubjects from "../pages/staff/MySubjects";
import Exams from "../pages/staff/Exams";
import ApprovedExamNotice from "../pages/staff/ApprovedExamNotice";
import AllowStudents from "../pages/staff/AllowStudents";
import Results from "../pages/staff/Results";
import Questions from "../pages/staff/Questions";
import StaffFeedback from "../pages/Staff/StaffFeedback";
import ResultAnalysis from "../pages/staff/ResultAnalysis";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* ✅ Admin (nested routes) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="create-user" element={<CreateUser />} />
        <Route path="view-users" element={<ViewUsers />} />
        <Route path="create-subject" element={<CreateSubject />} />
        <Route path="assign-staff" element={<AssignStaff />} />
        <Route path="exam-management" element={<ExamManagement />} />
        <Route path="mark-requests" element={<MarkRequests />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* ✅ Staff (nested routes) */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRole="staff">
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StaffHome />} />
        <Route path="my-subjects" element={<MySubjects />} />
        <Route path="exams" element={<Exams />} />
        <Route path="ApprovedExamNotice" element={<ApprovedExamNotice />} />
        <Route path="allow-students" element={<AllowStudents />} />
        <Route path="results" element={<Results />} />
        <Route path="questions/:examId" element={<Questions />} />
        <Route path="feedback" element={<StaffFeedback />} />
        <Route path="analysis" element={<ResultAnalysis />} />
      </Route>

      {/* ✅ Student (nested routes) */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<ExamNotice />} />
        <Route path="exam-notice" element={<ExamNotice />} />
        <Route path="attempt" element={<AttemptExam />} />
        <Route path="results" element={<StudentResults />} />
        <Route path="feedback" element={<StudentConcernForm />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<div style={{ padding: 20 }}>404 Not Found</div>} />
    </Routes>
  );
}