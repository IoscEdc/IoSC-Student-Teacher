

const sampleStudentData = {
  studentId: '12345',  // Student ID
  name: 'John Doe',     // Student Name
  grades: [
    { assignmentId: 'A1', name: 'Math Homework', score: 95, status: 'submitted' },
    { assignmentId: 'A2', name: 'Science Project', score: 85, status: 'pending' }
  ],
  exams: [
    { examId: 'E1', name: 'Midterm Exam', score: 78 }
  ]
};

// Store the data in localStorage
localStorage.setItem('studentData', JSON.stringify(sampleStudentData));

// Verify the data is stored
console.log(localStorage.getItem('studentData'));
