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
const App = () => {
  const { currentRole } = useSelector(state => state.user);
    
  return (
    <Router>
      {/* Always accessible routes */}
      <Routes>
        <Route path="/login-success" element={<LoginSuccess />} />
        <Route path="/logout" element={<Logout />} />
      </Routes>

      {/* Guest-only routes */}
      {currentRole === null && (
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/choose" element={<ChooseUser visitor="normal" />} />
          <Route path="/chooseasguest" element={<ChooseUser visitor="guest" />} />
          <Route path="/register" element={<ChooseRegister />} />

          <Route path="/Adminlogin" element={<LoginPage role="Admin" />} />
          <Route path="/Studentlogin" element={<LoginPage role="Student" />} />
          <Route path="/Student/login" element={<LoginPage role="Student" />} />
          <Route path="/Teacherlogin" element={<LoginPage role="Teacher" />} />
          <Route path="/Teacher/login" element={<LoginPage role="Teacher" />} />

          <Route path="/Adminregister" element={<AdminRegisterPage />} />
          <Route path="/Teacherregister" element={<TeacherRegister />} />
          <Route path="/Studentregister" element={<StudentRegister />} />
          
          <Route path="/StudentResetPassword/:token" element={<StudentResetPassword />} />
          <Route path="/TeacherResetPassword/:token" element={<TeacherResetPassword />} />

          <Route path='*' element={<Navigate to="/" />} />
        </Routes>
      )}

      {/* Role-based dashboards */}
      {currentRole === "Admin" && <AdminDashboard />}
      {currentRole === "Student" && <StudentDashboard />}
      {currentRole === "Teacher" && <TeacherDashboard />}
    </Router>
  )
}

export default App