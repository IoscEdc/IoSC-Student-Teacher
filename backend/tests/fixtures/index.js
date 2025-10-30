// Test fixtures for consistent test data across all tests
const mongoose = require('mongoose');

// Mock ObjectIds for consistent testing
const mockIds = {
  school: '507f1f77bcf86cd799439011',
  admin: '507f1f77bcf86cd799439012',
  teacher1: '507f1f77bcf86cd799439013',
  teacher2: '507f1f77bcf86cd799439014',
  student1: '507f1f77bcf86cd799439015',
  student2: '507f1f77bcf86cd799439016',
  student3: '507f1f77bcf86cd799439017',
  class1: '507f1f77bcf86cd799439018',
  class2: '507f1f77bcf86cd799439019',
  subject1: '507f1f77bcf86cd799439020',
  subject2: '507f1f77bcf86cd799439021',
  attendanceRecord1: '507f1f77bcf86cd799439022',
  attendanceRecord2: '507f1f77bcf86cd799439023',
  attendanceSummary1: '507f1f77bcf86cd799439024',
  sessionConfig1: '507f1f77bcf86cd799439025'
};

// Mock school data
const mockSchool = {
  _id: mockIds.school,
  schoolName: 'Test University',
  email: 'admin@testuniversity.edu',
  password: 'hashedpassword'
};

// Mock admin data
const mockAdmin = {
  _id: mockIds.admin,
  name: 'Test Admin',
  email: 'admin@testuniversity.edu',
  role: 'Admin',
  school: mockIds.school
};

// Mock teacher data
const mockTeachers = [
  {
    _id: mockIds.teacher1,
    name: 'John Teacher',
    email: 'john.teacher@testuniversity.edu',
    password: 'hashedpassword',
    role: 'Teacher',
    school: mockIds.school,
    teachSubject: mockIds.subject1,
    teachSclass: mockIds.class1,
    assignedSubjects: [
      {
        subjectId: mockIds.subject1,
        classId: mockIds.class1,
        assignedAt: new Date('2023-09-01')
      }
    ]
  },
  {
    _id: mockIds.teacher2,
    name: 'Jane Teacher',
    email: 'jane.teacher@testuniversity.edu',
    password: 'hashedpassword',
    role: 'Teacher',
    school: mockIds.school,
    teachSubject: mockIds.subject2,
    teachSclass: mockIds.class2,
    assignedSubjects: [
      {
        subjectId: mockIds.subject2,
        classId: mockIds.class2,
        assignedAt: new Date('2023-09-01')
      }
    ]
  }
];

// Mock student data
const mockStudents = [
  {
    _id: mockIds.student1,
    name: 'Alice Student',
    rollNum: 1,
    universityId: 'CSE2021001',
    password: 'hashedpassword',
    sclassName: mockIds.class1,
    school: mockIds.school,
    role: 'Student',
    enrolledSubjects: [
      {
        subjectId: mockIds.subject1,
        enrolledAt: new Date('2023-09-01')
      }
    ]
  },
  {
    _id: mockIds.student2,
    name: 'Bob Student',
    rollNum: 2,
    universityId: 'CSE2021002',
    password: 'hashedpassword',
    sclassName: mockIds.class1,
    school: mockIds.school,
    role: 'Student',
    enrolledSubjects: [
      {
        subjectId: mockIds.subject1,
        enrolledAt: new Date('2023-09-01')
      }
    ]
  },
  {
    _id: mockIds.student3,
    name: 'Charlie Student',
    rollNum: 3,
    universityId: 'ECE2021001',
    password: 'hashedpassword',
    sclassName: mockIds.class2,
    school: mockIds.school,
    role: 'Student',
    enrolledSubjects: [
      {
        subjectId: mockIds.subject2,
        enrolledAt: new Date('2023-09-01')
      }
    ]
  }
];

// Mock class data
const mockClasses = [
  {
    _id: mockIds.class1,
    sclassName: 'CSE-A',
    school: mockIds.school
  },
  {
    _id: mockIds.class2,
    sclassName: 'ECE-A',
    school: mockIds.school
  }
];

// Mock subject data
const mockSubjects = [
  {
    _id: mockIds.subject1,
    subName: 'Data Structures',
    subCode: 'CS201',
    sessions: 3,
    sclassName: mockIds.class1,
    school: mockIds.school,
    teacher: mockIds.teacher1
  },
  {
    _id: mockIds.subject2,
    subName: 'Digital Electronics',
    subCode: 'EC101',
    sessions: 2,
    sclassName: mockIds.class2,
    school: mockIds.school,
    teacher: mockIds.teacher2
  }
];

// Mock attendance records
const mockAttendanceRecords = [
  {
    _id: mockIds.attendanceRecord1,
    classId: mockIds.class1,
    subjectId: mockIds.subject1,
    teacherId: mockIds.teacher1,
    studentId: mockIds.student1,
    date: new Date('2023-10-15'),
    session: 'Lecture 1',
    status: 'present',
    markedBy: mockIds.teacher1,
    markedAt: new Date('2023-10-15T10:00:00Z'),
    schoolId: mockIds.school
  },
  {
    _id: mockIds.attendanceRecord2,
    classId: mockIds.class1,
    subjectId: mockIds.subject1,
    teacherId: mockIds.teacher1,
    studentId: mockIds.student2,
    date: new Date('2023-10-15'),
    session: 'Lecture 1',
    status: 'absent',
    markedBy: mockIds.teacher1,
    markedAt: new Date('2023-10-15T10:00:00Z'),
    schoolId: mockIds.school
  }
];

// Mock attendance summaries
const mockAttendanceSummaries = [
  {
    _id: mockIds.attendanceSummary1,
    studentId: mockIds.student1,
    subjectId: mockIds.subject1,
    classId: mockIds.class1,
    totalSessions: 10,
    presentCount: 8,
    absentCount: 1,
    lateCount: 1,
    excusedCount: 0,
    attendancePercentage: 85.0,
    lastUpdated: new Date('2023-10-15'),
    schoolId: mockIds.school
  }
];

// Mock session configuration
const mockSessionConfigurations = [
  {
    _id: mockIds.sessionConfig1,
    subjectId: mockIds.subject1,
    classId: mockIds.class1,
    sessionType: 'lecture',
    sessionsPerWeek: 3,
    sessionDuration: 60,
    totalSessions: 45,
    schoolId: mockIds.school
  }
];

// Mock bulk attendance data
const mockBulkAttendanceData = {
  classId: mockIds.class1,
  subjectId: mockIds.subject1,
  teacherId: mockIds.teacher1,
  date: new Date('2023-10-16'),
  session: 'Lecture 2',
  studentAttendance: [
    {
      studentId: mockIds.student1,
      status: 'present'
    },
    {
      studentId: mockIds.student2,
      status: 'late'
    }
  ]
};

// Mock audit info
const mockAuditInfo = {
  ipAddress: '192.168.1.1',
  userAgent: 'Test User Agent',
  sessionId: 'test-session-123'
};

// Helper functions for creating test data
const createMockObjectId = (id) => {
  if (typeof id === 'string') {
    return {
      toString: () => id,
      equals: (other) => id === other.toString(),
      _id: id
    };
  }
  return id;
};

const createMockDate = (dateString) => {
  return new Date(dateString);
};

// Export all fixtures
module.exports = {
  mockIds,
  mockSchool,
  mockAdmin,
  mockTeachers,
  mockStudents,
  mockClasses,
  mockSubjects,
  mockAttendanceRecords,
  mockAttendanceSummaries,
  mockSessionConfigurations,
  mockBulkAttendanceData,
  mockAuditInfo,
  createMockObjectId,
  createMockDate
};