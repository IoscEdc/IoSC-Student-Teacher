import React, { useEffect, useState } from 'react';
import './StudentDashboard.css'; // Ensure CSS is imported

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState(null);
  const [error, setError] = useState(null);  // Added error state

  useEffect(() => {
    try {
      const storedData = localStorage.getItem('studentData');
      if (!storedData) {
        throw new Error('No student data found in localStorage');  // Handle missing data
      }
      const data = JSON.parse(storedData);
      if (!data?.studentId || !data?.name) {
        throw new Error('Invalid student data format');  // Handle invalid data format
      }
      setStudentData(data);  // Set valid data
    } catch (err) {
      setError(err.message);  // Set error message if any error occurs
      console.error(err);  // Log error for debugging
    }
  }, []);

  return (
    <div className="dashboard">
      {error ? (
        <p className="error">Error: {error}</p>  // Display error message
      ) : studentData ? (
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
      ) : (
        <p>Loading student data...</p>  // Show loading if no error and no data
      )}
    </div>
  );
};

export default StudentDashboard;

