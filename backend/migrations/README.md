# Attendance System Migration Scripts

This directory contains migration scripts for the attendance system revamp. These scripts handle the conversion from the old attendance tracking system to the new structured attendance system with proper authorization controls, automated summaries, and comprehensive audit trails.

## Overview

The migration transforms the attendance system from:
- Simple attendance arrays stored in student/teacher documents
- Basic attendance tracking without session information
- Limited access controls and no audit trails

To:
- Structured AttendanceRecord collection with session tracking
- Automated AttendanceSummary calculations
- Comprehensive audit logging with AttendanceAuditLog
- Enhanced user schemas with proper enrollment and assignment tracking

## Migration Scripts

### 1. `001_attendance_system_migration.js`
Main migration class that handles the complete transformation:
- **Data Backup**: Creates backup collections before making changes
- **Student Migration**: Updates student schema and migrates attendance data
- **Teacher Migration**: Updates teacher schema and assignment structure
- **Summary Creation**: Generates initial attendance summaries
- **Validation**: Validates migration results and data integrity
- **Rollback**: Provides rollback capability in case of failures

### 2. `runMigration.js`
Migration runner script that:
- Connects to the database
- Executes the migration process
- Handles errors and cleanup
- Provides detailed logging

**Usage:**
```bash
node backend/migrations/runMigration.js
```

### 3. `validateData.js`
Data validation script that:
- Validates student and teacher data integrity
- Checks attendance record consistency
- Verifies attendance summary calculations
- Validates relationships between collections
- Provides detailed validation reports

**Usage:**
```bash
node backend/migrations/validateData.js
```

### 4. `rollbackMigration.js`
Rollback script that:
- Removes new attendance data (records, summaries, audit logs)
- Restores original data from backup collections
- Cleans up migration-added fields
- Validates rollback results

**Usage:**
```bash
node backend/migrations/rollbackMigration.js
```

## Migration Process

### Pre-Migration Steps

1. **Backup Database**: Create a full database backup
   ```bash
   mongodump --db school --out backup_$(date +%Y%m%d_%H%M%S)
   ```

2. **Validate Current Data**: Run validation to check current data state
   ```bash
   node backend/migrations/validateData.js
   ```

3. **Review Migration Plan**: Understand what changes will be made

### Running Migration

1. **Execute Migration**:
   ```bash
   node backend/migrations/runMigration.js
   ```

2. **Monitor Progress**: Watch console output for progress and any issues

3. **Validate Results**: Run validation after migration
   ```bash
   node backend/migrations/validateData.js
   ```

### Post-Migration Steps

1. **Test Application**: Verify all attendance functionality works correctly
2. **Monitor Performance**: Check database performance with new schema
3. **Update Documentation**: Update API documentation and user guides

### Rollback (if needed)

If issues are discovered after migration:

1. **Stop Application**: Ensure no new data is being created
2. **Run Rollback**:
   ```bash
   node backend/migrations/rollbackMigration.js
   ```
3. **Validate Rollback**: Ensure data is restored correctly
4. **Investigate Issues**: Analyze what went wrong before re-attempting

## Data Transformations

### Student Schema Changes

**Before:**
```javascript
{
  name: "John Doe",
  rollNum: 123,
  attendance: [
    {
      subName: ObjectId("..."),
      present: 5,
      absent: 2,
      date: Date("2024-01-15")
    }
  ]
}
```

**After:**
```javascript
{
  name: "John Doe",
  rollNum: 123,
  universityId: "STU000123",
  enrolledSubjects: [
    {
      subjectId: ObjectId("..."),
      enrolledAt: Date("2024-01-15")
    }
  ]
  // attendance array removed
}
```

### Teacher Schema Changes

**Before:**
```javascript
{
  name: "Jane Smith",
  teachSubject: ObjectId("..."),
  teachSclass: ObjectId("..."),
  attendance: [...]
}
```

**After:**
```javascript
{
  name: "Jane Smith",
  teachSubject: ObjectId("..."), // kept for compatibility
  teachSclass: ObjectId("..."),  // kept for compatibility
  assignedSubjects: [
    {
      subjectId: ObjectId("..."),
      classId: ObjectId("..."),
      assignedAt: Date("2024-01-15")
    }
  ]
  // attendance array removed
}
```

### New Collections Created

1. **AttendanceRecord**: Individual attendance entries with session tracking
2. **AttendanceSummary**: Calculated summaries per student-subject
3. **AttendanceAuditLog**: Audit trail for all attendance changes

## Error Handling

The migration includes comprehensive error handling:

- **Validation Errors**: Invalid data is logged and skipped
- **Database Errors**: Connection and operation failures are handled gracefully
- **Rollback on Failure**: Automatic rollback if critical errors occur
- **Detailed Logging**: All operations are logged for debugging

## Performance Considerations

- **Batch Processing**: Large datasets are processed in batches
- **Index Creation**: Database indexes are created for optimal performance
- **Memory Management**: Memory usage is monitored and optimized
- **Connection Pooling**: Database connections are managed efficiently

## Monitoring and Logging

All migration operations are logged with:
- **Timestamps**: When each operation occurred
- **Progress Indicators**: How many records processed
- **Error Details**: Specific error messages and stack traces
- **Statistics**: Summary of migration results

## Troubleshooting

### Common Issues

1. **Database Connection Failures**
   - Check MongoDB connection string
   - Verify database is running and accessible
   - Check network connectivity

2. **Memory Issues with Large Datasets**
   - Increase Node.js memory limit: `node --max-old-space-size=4096`
   - Process data in smaller batches
   - Monitor memory usage during migration

3. **Data Validation Failures**
   - Review validation error messages
   - Fix data issues before re-running migration
   - Consider data cleanup scripts

4. **Migration Timeout**
   - Increase timeout values in migration script
   - Run migration during low-traffic periods
   - Consider breaking migration into smaller steps

### Recovery Procedures

1. **Partial Migration Failure**
   - Review error logs to identify issues
   - Fix underlying problems
   - Run rollback if necessary
   - Re-run migration after fixes

2. **Data Corruption**
   - Stop all application processes
   - Restore from database backup
   - Investigate root cause
   - Fix issues before re-attempting

## Testing

Before running in production:

1. **Test on Development Environment**: Run complete migration process
2. **Test with Sample Data**: Verify transformations are correct
3. **Performance Testing**: Ensure migration completes in reasonable time
4. **Rollback Testing**: Verify rollback process works correctly

## Support

For issues or questions:
1. Check error logs for specific error messages
2. Review this documentation for troubleshooting steps
3. Validate data before and after migration
4. Contact development team with detailed error information

## Version History

- **v1.0**: Initial migration script for attendance system revamp
- Handles student/teacher schema updates
- Creates new attendance collections
- Includes validation and rollback capabilities