# Attendance System Data Models

This document describes the new data models for the revamped attendance system.

## Overview

The new attendance system introduces four main data models to replace the simple attendance arrays in student documents:

1. **AttendanceRecord** - Individual attendance records for each student-session
2. **AttendanceSummary** - Aggregated attendance statistics per student-subject
3. **AttendanceAuditLog** - Audit trail for all attendance modifications
4. **SessionConfiguration** - Configuration for class sessions and scheduling

## Models

### AttendanceRecord

Stores individual attendance records for each student in each session.

**Schema:** `attendanceRecordSchema.js`

**Key Fields:**
- `classId` - Reference to the class (sclass)
- `subjectId` - Reference to the subject
- `teacherId` - Reference to the teacher who marked attendance
- `studentId` - Reference to the student
- `date` - Date of the session
- `session` - Session identifier (e.g., "Lecture 1", "Lab 2")
- `status` - Attendance status: 'present', 'absent', 'late', 'excused'
- `markedBy` - Teacher who marked the attendance
- `schoolId` - Reference to the school/admin

**Indexes:**
- Single field indexes on all reference fields and date
- Compound indexes for common query patterns
- Unique compound index to prevent duplicate records

**Usage:**
```javascript
const AttendanceRecord = require('./models/attendanceRecordSchema');

// Create attendance record
const record = new AttendanceRecord({
    classId: classObjectId,
    subjectId: subjectObjectId,
    teacherId: teacherObjectId,
    studentId: studentObjectId,
    date: new Date(),
    session: 'Lecture 1',
    status: 'present',
    markedBy: teacherObjectId,
    schoolId: schoolObjectId
});
```

### AttendanceSummary

Stores aggregated attendance statistics for each student-subject combination.

**Schema:** `attendanceSummarySchema.js`

**Key Fields:**
- `studentId` - Reference to the student
- `subjectId` - Reference to the subject
- `classId` - Reference to the class
- `totalSessions` - Total number of sessions
- `presentCount` - Number of present sessions
- `absentCount` - Number of absent sessions
- `lateCount` - Number of late sessions
- `excusedCount` - Number of excused sessions
- `attendancePercentage` - Calculated attendance percentage
- `lastUpdated` - Last update timestamp

**Features:**
- Automatic percentage calculation via pre-save middleware
- Static method `recalculateFromRecords()` to rebuild from AttendanceRecord data
- Virtual field for real-time percentage calculation

**Usage:**
```javascript
const AttendanceSummary = require('./models/attendanceSummarySchema');

// Recalculate summary from records
await AttendanceSummary.recalculateFromRecords(studentId, subjectId, classId);

// Get student summaries
const summaries = await AttendanceSummary.find({ studentId });
```

### AttendanceAuditLog

Maintains an audit trail of all attendance record modifications.

**Schema:** `attendanceAuditLogSchema.js`

**Key Fields:**
- `recordId` - Reference to the AttendanceRecord
- `action` - Type of action: 'create', 'update', 'delete'
- `oldValues` - Previous values (for updates)
- `newValues` - New values
- `performedBy` - User who performed the action
- `performedByModel` - Model type ('teacher' or 'admin')
- `performedAt` - Timestamp of the action
- `reason` - Optional reason for the change
- `schoolId` - Reference to the school

**Static Methods:**
- `createAuditLog()` - Create new audit log entry
- `getRecordHistory()` - Get history for specific record
- `getUserActivity()` - Get user activity logs
- `getSchoolAuditSummary()` - Get school-wide audit summary

**Usage:**
```javascript
const AttendanceAuditLog = require('./models/attendanceAuditLogSchema');

// Create audit log
await AttendanceAuditLog.createAuditLog({
    recordId: attendanceRecordId,
    action: 'update',
    oldValues: { status: 'absent' },
    newValues: { status: 'present' },
    performedBy: teacherId,
    performedByModel: 'teacher',
    reason: 'Correction after student verification',
    schoolId: schoolId
});
```

### SessionConfiguration

Defines session configurations for subjects and classes.

**Schema:** `sessionConfigurationSchema.js`

**Key Fields:**
- `subjectId` - Reference to the subject
- `classId` - Reference to the class
- `sessionType` - Type: 'lecture', 'lab', 'tutorial'
- `sessionsPerWeek` - Number of sessions per week
- `sessionDuration` - Duration in minutes
- `totalSessions` - Total sessions in term/semester
- `sessionNamingPattern` - Pattern for session names
- `scheduledDays` - Days of week for sessions
- `timeSlots` - Time slots for sessions
- `isActive` - Whether configuration is active

**Static Methods:**
- `getActiveConfigurationsForClass()` - Get active configs for a class
- `getConfiguration()` - Get specific configuration
- `validateSessionName()` - Validate session name against config
- `getAllSessionNames()` - Get all possible session names

**Usage:**
```javascript
const SessionConfiguration = require('./models/sessionConfigurationSchema');

// Create configuration
const config = new SessionConfiguration({
    subjectId: subjectObjectId,
    classId: classObjectId,
    sessionType: 'lecture',
    sessionsPerWeek: 3,
    sessionDuration: 60,
    totalSessions: 45,
    startDate: new Date(),
    endDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000),
    schoolId: schoolObjectId
});
```

## Database Indexes

### Performance Optimization

All models include comprehensive indexing strategies:

**Single Field Indexes:**
- All reference fields (ObjectId fields)
- Date fields for time-based queries
- Status and type fields for filtering

**Compound Indexes:**
- Common query patterns (e.g., student + subject + date)
- Reporting queries (e.g., school + date range)
- Analytics queries (e.g., class + subject combinations)

**Unique Indexes:**
- Prevent duplicate records
- Ensure data integrity
- Business rule enforcement

### Index Management

Use the provided scripts to manage indexes:

```bash
# Set up all indexes
npm run setup-indexes

# Complete database setup (includes indexes + migration)
npm run setup-database
```

## Migration

### From Old System

The migration process handles:

1. **Data Transformation**
   - Convert student attendance arrays to AttendanceRecord documents
   - Create AttendanceSummary records with calculated statistics
   - Set up default SessionConfiguration for existing subjects

2. **Reference Updates**
   - Map teachers to their assigned subjects and classes
   - Update all foreign key references
   - Maintain data relationships

3. **Data Validation**
   - Verify all migrated data integrity
   - Check for missing references
   - Validate calculated summaries

### Running Migration

```bash
# Run migration
npm run migrate

# Rollback migration
npm run migrate:rollback
```

## Best Practices

### Data Integrity

1. **Always use transactions** for operations that affect multiple collections
2. **Validate references** before creating records
3. **Update summaries** immediately after attendance changes
4. **Create audit logs** for all modifications

### Performance

1. **Use compound indexes** for complex queries
2. **Limit result sets** with pagination
3. **Cache frequently accessed data** (summaries, configurations)
4. **Batch operations** when possible

### Security

1. **Validate user permissions** before any operation
2. **Sanitize input data** to prevent injection attacks
3. **Log all access attempts** for audit purposes
4. **Use role-based access control** consistently

## Example Workflows

### Marking Attendance

```javascript
// 1. Validate teacher assignment
const isAuthorized = await ValidationService.validateTeacherAssignment(
    teacherId, classId, subjectId
);

// 2. Create attendance records
const attendanceRecords = students.map(student => ({
    classId,
    subjectId,
    teacherId,
    studentId: student._id,
    date: new Date(),
    session: 'Lecture 1',
    status: student.status,
    markedBy: teacherId,
    schoolId
}));

await AttendanceRecord.insertMany(attendanceRecords);

// 3. Update summaries
for (const student of students) {
    await AttendanceSummary.recalculateFromRecords(
        student._id, subjectId, classId
    );
}

// 4. Create audit logs
for (const record of attendanceRecords) {
    await AttendanceAuditLog.createAuditLog({
        recordId: record._id,
        action: 'create',
        newValues: record,
        performedBy: teacherId,
        performedByModel: 'teacher',
        schoolId
    });
}
```

### Getting Student Dashboard Data

```javascript
// Get student attendance summaries
const summaries = await AttendanceSummary.find({ studentId })
    .populate('subjectId', 'subName subCode')
    .populate('classId', 'sclassName');

// Get recent attendance records
const recentRecords = await AttendanceRecord.find({ studentId })
    .populate('subjectId', 'subName')
    .sort({ date: -1 })
    .limit(20);
```

### Generating Reports

```javascript
// School-wide attendance analytics
const analytics = await AttendanceRecord.aggregate([
    { $match: { schoolId: new ObjectId(schoolId) } },
    {
        $group: {
            _id: '$status',
            count: { $sum: 1 }
        }
    }
]);

// Class attendance summary
const classSummary = await AttendanceSummary.find({ classId })
    .populate('studentId', 'name rollNum')
    .populate('subjectId', 'subName')
    .sort({ attendancePercentage: -1 });
```