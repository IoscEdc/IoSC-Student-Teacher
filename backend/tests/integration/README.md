# Attendance System Integration Tests

This directory contains comprehensive integration tests for the attendance system API endpoints. These tests validate the complete functionality of the attendance system including authentication, authorization, data persistence, and business logic.

## Test Structure

### Test Files

1. **`attendance.integration.test.js`** - Basic CRUD operations
   - Student retrieval for attendance marking
   - Attendance marking and updating
   - Record retrieval with filtering
   - Record deletion (admin only)
   - Session summaries

2. **`attendance-bulk.integration.test.js`** - Bulk operations
   - Bulk student assignment by patterns
   - Bulk attendance marking
   - Student transfers between classes
   - Teacher reassignments
   - Bulk operation statistics

3. **`attendance-analytics.integration.test.js`** - Analytics and summaries
   - Student attendance summaries
   - Class attendance summaries
   - Attendance trends analysis
   - School-wide analytics
   - Low attendance alerts

4. **`attendance-workflows.integration.test.js`** - End-to-end workflows
   - Complete teacher workflow (mark → view → edit)
   - Complete student workflow (view attendance and analytics)
   - Complete admin workflow (bulk operations and analytics)
   - Cross-role interactions
   - Data consistency validation

5. **`attendance-performance.integration.test.js`** - Performance tests
   - Bulk operations with large datasets (100-1000 students)
   - Query performance with large datasets
   - Concurrent operation handling
   - Memory usage validation
   - Response time thresholds

### Supporting Files

- **`run-integration-tests.js`** - Test runner script with reporting
- **`../fixtures/index.js`** - Test data fixtures and utilities
- **`../setup.js`** - Global test setup and configuration

## Running Tests

### Prerequisites

1. Ensure all dependencies are installed:
   ```bash
   npm install
   ```

2. Ensure MongoDB Memory Server is available (included in devDependencies)

### Running All Integration Tests

```bash
# Run all integration tests with detailed reporting
npm run test:integration

# Alternative: Run with Jest directly
npm run test -- --testPathPattern=integration
```

### Running Specific Test Suites

```bash
# Basic CRUD operations
npm run test:integration:basic

# Bulk operations
npm run test:integration:bulk

# Analytics and summaries
npm run test:integration:analytics

# End-to-end workflows
npm run test:integration:workflows

# Performance tests (takes longer)
npm run test:integration:performance
```

### Running Individual Test Files

```bash
# Run specific test file
npx jest tests/integration/attendance.integration.test.js

# Run with verbose output
npx jest tests/integration/attendance.integration.test.js --verbose

# Run specific test case
npx jest tests/integration/attendance.integration.test.js -t "should mark attendance successfully"
```

### Test Runner Options

The custom test runner (`run-integration-tests.js`) provides additional options:

```bash
# Show help
node tests/integration/run-integration-tests.js --help

# List available test suites
node tests/integration/run-integration-tests.js --list

# Run specific suite by name
node tests/integration/run-integration-tests.js --suite "Basic Attendance"
node tests/integration/run-integration-tests.js --suite "Performance"
```

## Test Configuration

### Environment Variables

Tests use the following environment variables:

- `NODE_ENV=test` - Set automatically by test runner
- `JWT_SECRET` - Set to test value for token generation
- MongoDB connection is handled by MongoDB Memory Server

### Timeouts

Different test suites have different timeout configurations:

- Basic tests: 30 seconds
- Bulk operations: 30 seconds
- Analytics: 30 seconds
- Workflows: 45 seconds
- Performance: 120 seconds (2 minutes)

### Database Setup

Each test suite:

1. Creates an in-memory MongoDB instance
2. Sets up test data (admin, teachers, students, classes, subjects)
3. Clears attendance data before each test
4. Tears down the database after all tests

## Test Coverage

### API Endpoints Tested

#### Basic Attendance Operations
- `GET /api/attendance/class/:classId/students`
- `POST /api/attendance/mark`
- `PUT /api/attendance/:id`
- `GET /api/attendance/records`
- `DELETE /api/attendance/:id`
- `GET /api/attendance/session-summary/:classId/:subjectId`

#### Bulk Operations
- `POST /api/attendance/bulk/assign-students`
- `POST /api/attendance/bulk/mark`
- `PUT /api/attendance/bulk/transfer`
- `PUT /api/attendance/bulk/reassign-teacher`
- `GET /api/attendance/bulk/stats/:schoolId`

#### Analytics and Summaries
- `GET /api/attendance/summary/student/:studentId`
- `GET /api/attendance/summary/class/:classId/subject/:subjectId`
- `GET /api/attendance/analytics/trends/:studentId/:subjectId`
- `GET /api/attendance/analytics/school/:schoolId`
- `GET /api/attendance/analytics/alerts/:classId`

### Authentication & Authorization

All tests validate:

- JWT token authentication
- Role-based access control (Admin, Teacher, Student)
- Resource-level authorization (teachers can only access assigned classes)
- Unauthorized access rejection

### Data Validation

Tests cover:

- Required field validation
- Data type validation
- Business rule validation
- Error handling and response formats

### Performance Metrics

Performance tests validate:

- Bulk operations with 100-1000 students
- Query response times with large datasets
- Memory usage during operations
- Concurrent operation handling

## Test Data

### Mock Data Structure

Tests use consistent mock data defined in `../fixtures/index.js`:

- **Schools**: Test University
- **Classes**: CSE-A, ECE-A
- **Subjects**: Data Structures, Digital Electronics
- **Teachers**: John Teacher, Jane Teacher
- **Students**: Alice, Bob, Charlie (expandable to 1000+ for performance tests)

### Test Scenarios

#### Happy Path Scenarios
- Successful attendance marking
- Successful data retrieval
- Successful bulk operations
- Successful analytics generation

#### Error Scenarios
- Invalid authentication
- Unauthorized access
- Missing required fields
- Invalid data formats
- Non-existent resources

#### Edge Cases
- Large datasets
- Concurrent operations
- Boundary conditions
- Performance limits

## Performance Benchmarks

### Response Time Thresholds

- Bulk marking 100 students: < 5 seconds
- Bulk marking 500 students: < 15 seconds
- Bulk assignment 1000 students: < 10 seconds
- Analytics large dataset: < 8 seconds
- Pagination large dataset: < 3 seconds
- Concurrent operations: < 10 seconds

### Memory Usage

- Large payload operations: < 100MB memory increase
- Consistent performance across multiple operations
- No memory leaks during extended operations

## Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**
   - Ensure MongoDB Memory Server is properly installed
   - Check for port conflicts
   - Verify sufficient system memory

2. **Test Timeouts**
   - Performance tests may take longer on slower systems
   - Increase timeout values if needed
   - Check system resources during test execution

3. **Authentication Errors**
   - Verify JWT_SECRET is set correctly
   - Check token generation in test setup
   - Ensure user roles are properly configured

4. **Data Consistency Issues**
   - Verify database cleanup between tests
   - Check for race conditions in concurrent tests
   - Ensure proper test isolation

### Debug Mode

Run tests with additional debugging:

```bash
# Enable verbose Jest output
npx jest --verbose tests/integration/

# Run with Node.js debugging
node --inspect-brk node_modules/.bin/jest tests/integration/

# Enable MongoDB debug logging
DEBUG=mongodb* npm run test:integration
```

### Performance Debugging

Monitor performance during tests:

```bash
# Run with memory monitoring
node --max-old-space-size=4096 tests/integration/run-integration-tests.js

# Profile memory usage
node --prof tests/integration/run-integration-tests.js --suite performance
```

## Contributing

When adding new integration tests:

1. Follow the existing test structure and naming conventions
2. Include both happy path and error scenarios
3. Add appropriate authentication and authorization tests
4. Update this README with new test descriptions
5. Ensure tests are isolated and don't depend on external services
6. Add performance considerations for bulk operations
7. Include proper cleanup and teardown procedures

## Continuous Integration

These tests are designed to run in CI/CD environments:

- No external dependencies (uses in-memory database)
- Deterministic test data and results
- Proper cleanup and resource management
- Clear pass/fail criteria
- Detailed error reporting