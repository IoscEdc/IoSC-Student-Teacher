# Attendance System API Documentation

## Overview

The Attendance System API provides comprehensive endpoints for managing student attendance, including marking attendance, retrieving records, generating summaries, and performing bulk operations. The API follows RESTful principles and returns JSON responses.

## Base URL

```
http://localhost:5000/api
```

## Authentication

All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this standard format:

```json
{
  "success": true|false,
  "message": "Response message",
  "data": {}, // Response data (if applicable)
  "error": {  // Error details (if applicable)
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  }
}
```

## Endpoints

### Authentication Endpoints

#### Admin Login
```http
POST /AdminLogin
```

**Request Body:**
```json
{
  "email": "admin@school.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token-here",
    "user": {
      "_id": "admin-id",
      "name": "Admin Name",
      "email": "admin@school.com",
      "role": "Admin"
    }
  }
}
```

#### Teacher Login
```http
POST /TeacherLogin
```

**Request Body:**
```json
{
  "email": "teacher@school.com",
  "password": "password123"
}
```

#### Student Login
```http
POST /StudentLogin
```

**Request Body:**
```json
{
  "rollNum": 123,
  "password": "password123",
  "studentName": "Student Name"
}
```

### Attendance Management

#### Mark Attendance
```http
POST /attendance/mark
```

**Description:** Mark attendance for multiple students in a single session.

**Request Body:**
```json
{
  "classId": "class-id",
  "subjectId": "subject-id",
  "teacherId": "teacher-id",
  "date": "2024-01-15",
  "session": "Lecture 1",
  "attendanceRecords": [
    {
      "studentId": "student-id-1",
      "status": "present"
    },
    {
      "studentId": "student-id-2",
      "status": "absent"
    },
    {
      "studentId": "student-id-3",
      "status": "late"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "data": {
    "records": [
      {
        "_id": "record-id",
        "studentId": "student-id-1",
        "status": "present",
        "date": "2024-01-15T00:00:00.000Z",
        "session": "Lecture 1"
      }
    ],
    "summary": {
      "totalStudents": 3,
      "present": 1,
      "absent": 1,
      "late": 1,
      "excused": 0
    }
  }
}
```

#### Update Attendance Record
```http
PUT /attendance/:recordId
```

**Description:** Update an existing attendance record.

**Request Body:**
```json
{
  "status": "excused",
  "reason": "Medical appointment"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance record updated successfully",
  "data": {
    "record": {
      "_id": "record-id",
      "status": "excused",
      "lastModifiedAt": "2024-01-15T10:30:00.000Z",
      "lastModifiedBy": "teacher-id"
    }
  }
}
```

#### Get Attendance Records
```http
GET /attendance/records
```

**Query Parameters:**
- `classId` (optional): Filter by class ID
- `subjectId` (optional): Filter by subject ID
- `studentId` (optional): Filter by student ID
- `teacherId` (optional): Filter by teacher ID
- `startDate` (optional): Start date for date range (YYYY-MM-DD)
- `endDate` (optional): End date for date range (YYYY-MM-DD)
- `status` (optional): Filter by attendance status
- `session` (optional): Filter by session
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Records per page (default: 50)

**Example:**
```http
GET /attendance/records?classId=class123&startDate=2024-01-01&endDate=2024-01-31&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "_id": "record-id",
        "studentId": "student-id",
        "studentName": "John Doe",
        "classId": "class-id",
        "subjectId": "subject-id",
        "subjectName": "Mathematics",
        "date": "2024-01-15T00:00:00.000Z",
        "session": "Lecture 1",
        "status": "present",
        "markedBy": "teacher-id",
        "markedAt": "2024-01-15T09:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRecords": 100,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### Get Students for Attendance
```http
GET /attendance/class/:classId/students
```

**Query Parameters:**
- `subjectId` (required): Subject ID to filter enrolled students

**Response:**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "_id": "student-id",
        "name": "John Doe",
        "rollNum": 123,
        "universityId": "CS2024001",
        "enrolledSubjects": ["subject-id"]
      }
    ],
    "classInfo": {
      "_id": "class-id",
      "sclassName": "Class 10A"
    },
    "subjectInfo": {
      "_id": "subject-id",
      "subName": "Mathematics"
    }
  }
}
```

### Attendance Summaries

#### Get Student Attendance Summary
```http
GET /attendance/summary/student/:studentId
```

**Query Parameters:**
- `subjectId` (optional): Filter by specific subject
- `startDate` (optional): Start date for summary period
- `endDate` (optional): End date for summary period

**Response:**
```json
{
  "success": true,
  "data": {
    "summaries": [
      {
        "_id": "summary-id",
        "studentId": "student-id",
        "subjectId": "subject-id",
        "subjectName": "Mathematics",
        "totalSessions": 20,
        "presentCount": 18,
        "absentCount": 2,
        "lateCount": 0,
        "excusedCount": 0,
        "attendancePercentage": 90,
        "lastUpdated": "2024-01-15T10:00:00.000Z"
      }
    ],
    "overallSummary": {
      "totalSessions": 60,
      "presentCount": 54,
      "absentCount": 6,
      "overallPercentage": 90
    }
  }
}
```

#### Get Class Attendance Summary
```http
GET /attendance/summary/class/:classId
```

**Query Parameters:**
- `subjectId` (optional): Filter by specific subject
- `startDate` (optional): Start date for summary period
- `endDate` (optional): End date for summary period

**Response:**
```json
{
  "success": true,
  "data": {
    "classSummary": {
      "classId": "class-id",
      "className": "Class 10A",
      "totalStudents": 30,
      "averageAttendance": 85.5,
      "sessionsSummary": {
        "totalSessions": 20,
        "averagePresent": 25.65,
        "averageAbsent": 4.35
      }
    },
    "studentSummaries": [
      {
        "studentId": "student-id",
        "studentName": "John Doe",
        "attendancePercentage": 90,
        "totalSessions": 20,
        "presentCount": 18
      }
    ]
  }
}
```

### Analytics and Reports

#### Get School Analytics
```http
GET /attendance/analytics/school/:schoolId
```

**Query Parameters:**
- `startDate` (optional): Start date for analytics period
- `endDate` (optional): End date for analytics period
- `groupBy` (optional): Group data by 'class', 'subject', or 'teacher'

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalStudents": 500,
      "totalTeachers": 25,
      "totalClasses": 10,
      "overallAttendanceRate": 87.5
    },
    "classWiseAttendance": [
      {
        "classId": "class-id",
        "className": "Class 10A",
        "attendanceRate": 90,
        "totalStudents": 30
      }
    ],
    "subjectWiseAttendance": [
      {
        "subjectId": "subject-id",
        "subjectName": "Mathematics",
        "attendanceRate": 85,
        "totalSessions": 100
      }
    ],
    "trends": {
      "weekly": [
        {
          "week": "2024-W03",
          "attendanceRate": 88
        }
      ],
      "monthly": [
        {
          "month": "2024-01",
          "attendanceRate": 87
        }
      ]
    },
    "alerts": [
      {
        "type": "low_attendance",
        "studentId": "student-id",
        "studentName": "Jane Doe",
        "attendanceRate": 65,
        "threshold": 75
      }
    ]
  }
}
```

#### Export Attendance Report
```http
GET /attendance/reports/export
```

**Query Parameters:**
- `format` (required): Export format ('csv', 'excel', 'pdf')
- `type` (required): Report type ('student', 'class', 'subject', 'teacher')
- `startDate` (required): Start date for report
- `endDate` (required): End date for report
- `classId` (optional): Filter by class
- `subjectId` (optional): Filter by subject
- `teacherId` (optional): Filter by teacher

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "/downloads/attendance-report-2024-01-15.csv",
    "fileName": "attendance-report-2024-01-15.csv",
    "fileSize": "2.5MB",
    "recordCount": 1500
  }
}
```

### Bulk Operations

#### Bulk Assign Students
```http
POST /attendance/bulk/assign-students
```

**Description:** Assign students to subjects based on university ID patterns.

**Request Body:**
```json
{
  "pattern": "CS2024*",
  "classId": "class-id",
  "subjectIds": ["subject-id-1", "subject-id-2"],
  "options": {
    "overwrite": false,
    "validateEnrollment": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk assignment completed",
  "data": {
    "totalProcessed": 50,
    "successCount": 48,
    "failureCount": 2,
    "assignedStudents": [
      {
        "studentId": "student-id",
        "universityId": "CS2024001",
        "assignedSubjects": ["subject-id-1", "subject-id-2"]
      }
    ],
    "errors": [
      {
        "studentId": "student-id",
        "universityId": "CS2024999",
        "error": "Student not found"
      }
    ]
  }
}
```

#### Bulk Mark Attendance
```http
POST /attendance/bulk/mark
```

**Description:** Mark attendance for multiple classes/sessions at once.

**Request Body:**
```json
{
  "sessions": [
    {
      "classId": "class-id-1",
      "subjectId": "subject-id-1",
      "date": "2024-01-15",
      "session": "Lecture 1",
      "attendanceRecords": [
        {
          "studentId": "student-id-1",
          "status": "present"
        }
      ]
    }
  ],
  "teacherId": "teacher-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk attendance marking completed",
  "data": {
    "totalSessions": 5,
    "successfulSessions": 4,
    "failedSessions": 1,
    "totalRecords": 150,
    "successfulRecords": 145,
    "failedRecords": 5,
    "results": [
      {
        "classId": "class-id-1",
        "subjectId": "subject-id-1",
        "success": true,
        "recordsCreated": 30
      }
    ],
    "errors": [
      {
        "classId": "class-id-2",
        "error": "Teacher not authorized for this class"
      }
    ]
  }
}
```

### Error Handling

#### Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional error details"
    }
  },
  "timestamp": "2024-01-15T10:00:00.000Z",
  "path": "/api/attendance/mark"
}
```

#### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `ATTENDANCE_UNAUTHORIZED` | User not authorized for attendance operation | 403 |
| `ATTENDANCE_NOT_FOUND` | Attendance record not found | 404 |
| `DUPLICATE_ATTENDANCE` | Attendance already marked for this session | 409 |
| `BULK_OPERATION_ERROR` | Bulk operation completed with errors | 207 |
| `INTERNAL_SERVER_ERROR` | Server error occurred | 500 |

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **Attendance marking**: 100 requests per minute per user
- **Data retrieval**: 200 requests per minute per user
- **Bulk operations**: 10 requests per minute per user

## Pagination

List endpoints support pagination using query parameters:

- `page`: Page number (default: 1)
- `limit`: Records per page (default: 50, max: 200)

## Date Formats

All dates should be provided in ISO 8601 format:
- Date only: `YYYY-MM-DD` (e.g., "2024-01-15")
- Date and time: `YYYY-MM-DDTHH:mm:ss.sssZ` (e.g., "2024-01-15T10:30:00.000Z")

## Status Codes

The API uses standard HTTP status codes:

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate attendance)
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

## Examples

### Complete Attendance Marking Workflow

1. **Login as Teacher:**
```bash
curl -X POST http://localhost:5000/api/TeacherLogin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@school.com",
    "password": "password123"
  }'
```

2. **Get Students for Class:**
```bash
curl -X GET "http://localhost:5000/api/attendance/class/class123/students?subjectId=subject456" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

3. **Mark Attendance:**
```bash
curl -X POST http://localhost:5000/api/attendance/mark \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "classId": "class123",
    "subjectId": "subject456",
    "teacherId": "teacher789",
    "date": "2024-01-15",
    "session": "Lecture 1",
    "attendanceRecords": [
      {"studentId": "student1", "status": "present"},
      {"studentId": "student2", "status": "absent"}
    ]
  }'
```

4. **View Attendance Records:**
```bash
curl -X GET "http://localhost:5000/api/attendance/records?classId=class123&date=2024-01-15" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Support

For API support and questions:
- Email: support@school.com
- Documentation: http://localhost:5000/api/docs
- Status Page: http://localhost:5000/api/status