import React, { useEffect, useState } from 'react';
import './StudentDashboard.css';  // Ensure CSS is imported

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);  // Loading state
  const [error, setError] = useState(null);  // Error state

  useEffect(() => {
    try {
      const storedData = localStorage.getItem('studentData');
      if (!storedData) {
        throw new Error('No student data found in localStorage');
      }
      const data = JSON.parse(storedData);
      if (!data?.studentId || !data?.name) {
        throw new Error('Invalid student data format');
      }
      setStudentData(data);
      setLoading(false);  // Stop loading when data is fetched
    } catch (err) {
      setError(err.message);  // Set error message if something goes wrong
      setLoading(false);  // Stop loading even if there's an error
      console.error(err);
    }
  }, []);

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;  // Show loading spinner
  }

  if (error) {
    return <div className="error">Error: {error}</div>;  // Show error message
  }

  return (
    <div className="dashboard">
      {studentData && (
        <div>
          <h1>Welcome, {studentData.name}</h1>
          <h2>Student ID: {studentData.studentId}</h2>

          <h3>Assignments:</h3>
          <ul>
            {studentData.grades.map((assignment) => (
              <li key={assignment.assignmentId}>
                {assignment.name}: {assignment.score} (Status: {assignment.status})
              </li>
            ))}
          </ul>

          <h3>Exams:</h3>
          <ul>
            {studentData.exams.map((exam) => (
              <li key={exam.examId}>
                {exam.name}: {exam.score}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
