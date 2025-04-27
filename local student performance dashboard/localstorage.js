
const sampleStudentData = {
  studentId: 'S12345',
  name: 'John Doe',
  grades: [
    { assignmentId: 'A1', name: 'Math Homework', score: 90, status: 'Completed' },
    { assignmentId: 'A2', name: 'Science Homework', score: 85, status: 'Completed' },
  ],
  exams: [
    { examId: 'E1', name: 'Math Exam', score: 88 },
    { examId: 'E2', name: 'Science Exam', score: 92 },
  ],
};

try {
  localStorage.setItem('studentData', JSON.stringify(sampleStudentData));
  console.log(localStorage.getItem('studentData'));  // Verify data storage
} catch (error) {
  console.error('Failed to store student data in localStorage:', error);  // Log any error
}
