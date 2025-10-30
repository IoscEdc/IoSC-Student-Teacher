#!/bin/bash

# System Testing Script for Attendance System
# This script performs comprehensive system testing including API endpoints, database operations, and frontend functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_BASE_URL="http://localhost:5000/api"
FRONTEND_URL="http://localhost:3000"
TEST_LOG="system-test.log"
RESULTS_FILE="test-results.json"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $TEST_LOG
}

success() {
    echo -e "${GREEN}[PASS]${NC} $1" | tee -a $TEST_LOG
    ((PASSED_TESTS++))
}

fail() {
    echo -e "${RED}[FAIL]${NC} $1" | tee -a $TEST_LOG
    ((FAILED_TESTS++))
}

warning() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a $TEST_LOG
}

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    ((TOTAL_TESTS++))
    log "Running test: $test_name"
    
    if eval "$test_command"; then
        success "$test_name"
        return 0
    else
        fail "$test_name"
        return 1
    fi
}

# API Testing Functions
test_api_health() {
    curl -f -s "$API_BASE_URL/health" > /dev/null 2>&1
}

test_admin_registration() {
    local response=$(curl -s -X POST "$API_BASE_URL/AdminReg" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Test Admin",
            "email": "testadmin@test.com",
            "password": "password123",
            "schoolName": "Test School"
        }')
    
    echo "$response" | grep -q '"success":true' || echo "$response" | grep -q '"result"'
}

test_admin_login() {
    local response=$(curl -s -X POST "$API_BASE_URL/AdminLogin" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "testadmin@test.com",
            "password": "password123"
        }')
    
    echo "$response" | grep -q '"token"'
}

test_class_creation() {
    # First get admin token
    local login_response=$(curl -s -X POST "$API_BASE_URL/AdminLogin" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "testadmin@test.com",
            "password": "password123"
        }')
    
    local token=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    local admin_id=$(echo "$login_response" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$token" ] && [ -n "$admin_id" ]; then
        local response=$(curl -s -X POST "$API_BASE_URL/SclassCreate" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "{
                \"sclassName\": \"Test Class 10A\",
                \"adminID\": \"$admin_id\"
            }")
        
        echo "$response" | grep -q '"success":true' || echo "$response" | grep -q '"result"'
    else
        return 1
    fi
}

test_attendance_endpoints() {
    # Test attendance marking endpoint
    local response=$(curl -s -X POST "$API_BASE_URL/attendance/mark" \
        -H "Content-Type: application/json" \
        -d '{
            "classId": "test-class-id",
            "subjectId": "test-subject-id",
            "teacherId": "test-teacher-id",
            "date": "2024-01-15",
            "session": "Lecture 1",
            "attendanceRecords": [
                {
                    "studentId": "test-student-id",
                    "status": "present"
                }
            ]
        }')
    
    # Should return error for invalid IDs, but endpoint should be accessible
    echo "$response" | grep -q '"success":false' || echo "$response" | grep -q '"error"'
}

test_bulk_operations() {
    local response=$(curl -s -X POST "$API_BASE_URL/attendance/bulk/assign-students" \
        -H "Content-Type: application/json" \
        -d '{
            "pattern": "CS2024*",
            "classId": "test-class-id",
            "subjectIds": ["test-subject-id"]
        }')
    
    # Should return error for invalid IDs, but endpoint should be accessible
    echo "$response" | grep -q '"success":false' || echo "$response" | grep -q '"error"'
}

# Database Testing Functions
test_database_connection() {
    cd backend
    node -e "
        const mongoose = require('mongoose');
        require('dotenv').config();
        
        mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/school_management')
            .then(() => {
                console.log('Database connection successful');
                process.exit(0);
            })
            .catch((err) => {
                console.error('Database connection failed:', err.message);
                process.exit(1);
            });
    "
    cd ..
}

test_database_indexes() {
    cd backend
    node -e "
        const mongoose = require('mongoose');
        require('dotenv').config();
        
        async function testIndexes() {
            try {
                await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/school_management');
                
                const collections = ['attendancerecords', 'attendancesummaries', 'students', 'teachers'];
                
                for (const collectionName of collections) {
                    const collection = mongoose.connection.db.collection(collectionName);
                    const indexes = await collection.indexes();
                    
                    if (indexes.length > 1) { // More than just _id index
                        console.log(\`Indexes found for \${collectionName}\`);
                    }
                }
                
                console.log('Index check completed');
                process.exit(0);
            } catch (err) {
                console.error('Index check failed:', err.message);
                process.exit(1);
            }
        }
        
        testIndexes();
    "
    cd ..
}

# Frontend Testing Functions
test_frontend_accessibility() {
    if command -v curl &> /dev/null; then
        curl -f -s "$FRONTEND_URL" > /dev/null 2>&1
    else
        return 1
    fi
}

test_frontend_build() {
    cd frontend
    if [ -d "build" ]; then
        # Check if build directory has files
        [ "$(ls -A build)" ] && return 0 || return 1
    else
        return 1
    fi
    cd ..
}

# Performance Testing Functions
test_api_response_time() {
    local start_time=$(date +%s%N)
    curl -f -s "$API_BASE_URL/health" > /dev/null 2>&1
    local end_time=$(date +%s%N)
    
    local response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
    
    if [ $response_time -lt 1000 ]; then # Less than 1 second
        log "API response time: ${response_time}ms"
        return 0
    else
        log "API response time too slow: ${response_time}ms"
        return 1
    fi
}

test_concurrent_requests() {
    local pids=()
    local success_count=0
    
    # Start 10 concurrent requests
    for i in {1..10}; do
        (curl -f -s "$API_BASE_URL/health" > /dev/null 2>&1 && echo "success") &
        pids+=($!)
    done
    
    # Wait for all requests to complete
    for pid in "${pids[@]}"; do
        if wait $pid; then
            ((success_count++))
        fi
    done
    
    # At least 8 out of 10 should succeed
    [ $success_count -ge 8 ]
}

# Security Testing Functions
test_cors_headers() {
    local response=$(curl -s -I "$API_BASE_URL/health")
    echo "$response" | grep -i "access-control-allow-origin"
}

test_security_headers() {
    local response=$(curl -s -I "$FRONTEND_URL")
    echo "$response" | grep -i "x-frame-options\|x-xss-protection\|x-content-type-options"
}

# Integration Testing Functions
test_complete_workflow() {
    log "Testing complete user workflow..."
    
    # This is a simplified workflow test
    # In a real scenario, you would use a testing framework like Selenium
    
    # 1. Admin registration
    local admin_response=$(curl -s -X POST "$API_BASE_URL/AdminReg" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Workflow Admin",
            "email": "workflow@test.com",
            "password": "password123",
            "schoolName": "Workflow School"
        }')
    
    if echo "$admin_response" | grep -q '"success":true\|"result"'; then
        log "✓ Admin registration successful"
    else
        log "✗ Admin registration failed"
        return 1
    fi
    
    # 2. Admin login
    local login_response=$(curl -s -X POST "$API_BASE_URL/AdminLogin" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "workflow@test.com",
            "password": "password123"
        }')
    
    if echo "$login_response" | grep -q '"token"'; then
        log "✓ Admin login successful"
        return 0
    else
        log "✗ Admin login failed"
        return 1
    fi
}

# Main Testing Function
run_all_tests() {
    log "Starting comprehensive system testing..."
    
    # Initialize results
    echo '{"timestamp": "'$(date -Iseconds)'", "tests": []}' > $RESULTS_FILE
    
    # API Tests
    log "=== API Tests ==="
    run_test "API Health Check" "test_api_health"
    run_test "Admin Registration" "test_admin_registration"
    run_test "Admin Login" "test_admin_login"
    run_test "Class Creation" "test_class_creation"
    run_test "Attendance Endpoints" "test_attendance_endpoints"
    run_test "Bulk Operations" "test_bulk_operations"
    
    # Database Tests
    log "=== Database Tests ==="
    run_test "Database Connection" "test_database_connection"
    run_test "Database Indexes" "test_database_indexes"
    
    # Frontend Tests
    log "=== Frontend Tests ==="
    run_test "Frontend Accessibility" "test_frontend_accessibility"
    run_test "Frontend Build" "test_frontend_build"
    
    # Performance Tests
    log "=== Performance Tests ==="
    run_test "API Response Time" "test_api_response_time"
    run_test "Concurrent Requests" "test_concurrent_requests"
    
    # Security Tests
    log "=== Security Tests ==="
    run_test "CORS Headers" "test_cors_headers"
    run_test "Security Headers" "test_security_headers"
    
    # Integration Tests
    log "=== Integration Tests ==="
    run_test "Complete Workflow" "test_complete_workflow"
}

# Generate Test Report
generate_report() {
    log "=== Test Summary ==="
    log "Total Tests: $TOTAL_TESTS"
    log "Passed: $PASSED_TESTS"
    log "Failed: $FAILED_TESTS"
    
    local success_rate=$(( PASSED_TESTS * 100 / TOTAL_TESTS ))
    log "Success Rate: $success_rate%"
    
    # Update results file
    local results=$(cat $RESULTS_FILE)
    echo "$results" | jq --arg total "$TOTAL_TESTS" --arg passed "$PASSED_TESTS" --arg failed "$FAILED_TESTS" --arg rate "$success_rate" \
        '.summary = {total: ($total | tonumber), passed: ($passed | tonumber), failed: ($failed | tonumber), success_rate: ($rate | tonumber)}' > $RESULTS_FILE
    
    if [ $FAILED_TESTS -eq 0 ]; then
        success "All tests passed! System is ready for deployment."
        return 0
    else
        fail "$FAILED_TESTS tests failed. Please review the issues before deployment."
        return 1
    fi
}

# Cleanup function
cleanup() {
    log "Cleaning up test data..."
    
    # Remove test users from database if they exist
    cd backend
    node -e "
        const mongoose = require('mongoose');
        require('dotenv').config();
        
        async function cleanup() {
            try {
                await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/school_management');
                
                // Remove test data
                const Admin = require('./models/adminSchema');
                await Admin.deleteMany({ email: { \$regex: /test\\.com\$/ } });
                
                console.log('Test data cleanup completed');
                process.exit(0);
            } catch (err) {
                console.error('Cleanup failed:', err.message);
                process.exit(1);
            }
        }
        
        cleanup();
    " 2>/dev/null || true
    cd ..
}

# Main execution
main() {
    # Create log file
    touch $TEST_LOG
    
    log "System Testing Started"
    log "API Base URL: $API_BASE_URL"
    log "Frontend URL: $FRONTEND_URL"
    
    # Check if services are running
    if ! curl -f -s "$API_BASE_URL/health" > /dev/null 2>&1; then
        warning "Backend API is not accessible. Some tests may fail."
    fi
    
    if ! curl -f -s "$FRONTEND_URL" > /dev/null 2>&1; then
        warning "Frontend is not accessible. Some tests may fail."
    fi
    
    # Run all tests
    run_all_tests
    
    # Generate report
    generate_report
    local exit_code=$?
    
    # Cleanup
    cleanup
    
    log "System testing completed. Check $TEST_LOG for detailed logs."
    log "Test results saved to $RESULTS_FILE"
    
    exit $exit_code
}

# Handle script interruption
trap 'log "Testing interrupted"; cleanup; exit 1' INT TERM

# Check dependencies
if ! command -v curl &> /dev/null; then
    echo "curl is required but not installed. Please install curl."
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "jq is required but not installed. Please install jq for JSON processing."
    exit 1
fi

# Run main function
main "$@"