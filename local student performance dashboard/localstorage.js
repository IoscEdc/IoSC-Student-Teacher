
// Sample student data to be stored in localStorage
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
  // Attempt to store the student data in localStorage
  localStorage.setItem('studentData', JSON.stringify(sampleStudentData));
  console.log(localStorage.getItem('studentData'));  // Verify the data is stored
} catch (error) {
  console.error('Failed to store student data in localStorage:', error);  // Log any errors
  // Optionally, notify the user or fallback behavior can be implemented here
}

