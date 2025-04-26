// StudentDashboard.js

import React, { useEffect, useState } from 'react';

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    // Fetch the student data from localStorage
    const data = JSON.parse(localStorage.getItem('studentData'));
    if (data) {
      setStudentData(data);
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
        <p>Loading student data...</p>
      )}
    </div>
  );
};

export default StudentDashboard;
