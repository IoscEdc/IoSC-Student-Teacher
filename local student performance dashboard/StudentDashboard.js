// StudentDashboard.js

import React, { useEffect, useState } from 'react';
import './StudentDashboard.css'; // import the CSS file for styling

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    try {
      const storedData = localStorage.getItem('studentData');
      if (storedData) {
        const data = JSON.parse(storedData);
        if (data && data.studentId && data.name) {
          setStudentData(data);
        } else {
          console.error('Invalid student data format');
        }
      } else {
        console.error('No student data found in localStorage');
      }
    } catch (error) {
      console.error('Failed to parse student data:', error);
    }
  }, []);

  return (
    <div className="dashboard">
      {studentData ? (
        <div>
          <h1>Welcome, {studentData.name}</h1>
          <h2>Student ID: {studentData.studentId}</h2>

          <h3>Assignments:</h3>
          <ul>
            {studentData.grades && studentData.grades.length > 0 ? (
              studentData.grades.map((assignment) => (
                <li key={assignment.assignmentId}>
                  {assignment.name || 'Unnamed assignment'}: {assignment.score || 'N/A'} (Status: {assignment.status || 'unknown'})
                </li>
              ))
            ) : (
              <li>No assignments available</li>
            )}
          </ul>

          <h3>Exams:</h3>
          <ul>
            {studentData.exams && studentData.exams.length > 0 ? (
              studentData.exams.map((exam) => (
                <li key={exam.examId}>
                  {exam.name || 'Unnamed exam'}: {exam.score || 'N/A'}
                </li>
              ))
            ) : (
              <li>No exams available</li>
            )}
          </ul>
        </div>
      ) : (
        <p>Loading student data...</p>
      )}
    </div>
  );
};

export default StudentDashboard;
