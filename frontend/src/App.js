import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import Homepage from './pages/Homepage';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import LoginPage from './pages/LoginPage';
import AdminRegisterPage from './pages/admin/AdminRegisterPage';
import TeacherRegister from './pages/TeacherRegister';
import StudentRegister from './pages/StudentRegister';
import ChooseRegister from './pages/ChooseRegister';
import ChooseUser from './pages/ChooseUser';
import StudentResetPassword from './pages/StudentResetPassword';
import TeacherResetPassword from './pages/TeacherResetPassword';
import LoginSuccess from './pages/LoginSuccess';
import Logout from './pages/Logout';

import AttendanceTest from './components/AttendanceTest';
const App = () => {
  const { currentRole } = useSelector(state => state.user);

  console.log('🔍 APP.JS RENDER - currentRole:', currentRole);
    
  return (
    <Router>
      <Routes>
        {/* Always accessible */}
        <Route path="/login-success" element={<LoginSuccess />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/StudentResetPassword/:token" element={<StudentResetPassword />} />
        <Route path="/TeacherResetPassword/:token" element={<TeacherResetPassword />} />

        {/* Guest routes - only show if NOT logged in */}
        {!currentRole && (
          <>
            <Route path="/" element={<Homepage />} />
            <Route path="/choose" element={<ChooseUser visitor="normal" />} />
            <Route path="/chooseasguest" element={<ChooseUser visitor="guest" />} />
            <Route path="/register" element={<ChooseRegister />} />

            <Route path="/Adminlogin" element={<LoginPage role="Admin" />} />
            <Route path="/Teacherlogin" element={<LoginPage role="Teacher" />} />
            <Route path="/Studentlogin" element={<LoginPage role="Student" />} />
            <Route path="/Student/login" element={<LoginPage role="Student" />} />
            <Route path="/Teacher/login" element={<LoginPage role="Teacher" />} />
            <Route path="/test-attendance" element={<AttendanceTest />} />

            <Route path="/Adminregister" element={<AdminRegisterPage />} />
            <Route path="/Teacherregister" element={<TeacherRegister />} />
            <Route path="/Studentregister" element={<StudentRegister />} />
          </>
        )}

        {/* Role-based dashboards */}
        {currentRole === "Admin" && <Route path="/*" element={<AdminDashboard />} />}
        {currentRole === "Student" && <Route path="/*" element={<StudentDashboard />} />}
        {currentRole === "Teacher" && <Route path="/*" element={<TeacherDashboard />} />}

        {/* Fallback redirect - IMPORTANT: This must be LAST */}
        <Route path="*" element={<Navigate to={currentRole ? `/${currentRole.toLowerCase()}` : "/"} replace />} />
      </Routes>
    </Router>
  )
}

export default App