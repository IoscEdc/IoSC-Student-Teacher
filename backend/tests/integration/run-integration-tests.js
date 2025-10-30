#!/usr/bin/env node

/**
 * Integration Test Runner
 * 
 * This script runs all integration tests for the attendance system
 * with proper setup, teardown, and reporting.
 */

const { spawn } = require('child_process');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
    timeout: 60000, // 60 seconds per test
    verbose: true,
    detectOpenHandles: true,
    forceExit: true,
    maxWorkers: 1, // Run tests sequentially to avoid database conflicts
    testPathPattern: 'tests/integration/',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};

// Test suites to run
const TEST_SUITES = [
    {
        name: 'Basic Attendance Operations',
        pattern: 'attendance.integration.test.js',
        description: 'Tests for basic CRUD operations on attendance records'
    },
    {
        name: 'Bulk Operations',
        pattern: 'attendance-bulk.integration.test.js',
        description: 'Tests for bulk attendance and student management operations'
    },
    {
        name: 'Analytics and Summaries',
        pattern: 'attendance-analytics.integration.test.js',
        description: 'Tests for attendance analytics and summary endpoints'
    },
    {
        name: 'End-to-End Workflows',
        pattern: 'attendance-workflows.integration.test.js',
        description: 'Tests for complete user workflows across different roles'
    },
    {
        name: 'Performance Tests',
        pattern: 'attendance-performance.integration.test.js',
        description: 'Performance tests for bulk operations and large datasets'
    }
];

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

function printHeader() {
    console.log(colorize('\n' + '='.repeat(80), 'cyan'));
    console.log(colorize('ATTENDANCE SYSTEM INTEGRATION TESTS', 'cyan'));
    console.log(colorize('='.repeat(80), 'cyan'));
    console.log(colorize(`Running ${TEST_SUITES.length} test suites...\n`, 'blue'));
}

function printSuiteHeader(suite, index) {
    console.log(colorize(`\n[${ index + 1 }/${TEST_SUITES.length}] ${suite.name}`, 'bright'));
    console.log(colorize(`Description: ${suite.description}`, 'blue'));
    console.log(colorize(`Pattern: ${suite.pattern}`, 'yellow'));
    console.log(colorize('-'.repeat(60), 'yellow'));
}

function runJestTest(pattern) {
    return new Promise((resolve, reject) => {
        const jestArgs = [
            '--testPathPatterns', pattern,
            '--testTimeout', TEST_CONFIG.timeout.toString(),
            '--verbose',
            '--detectOpenHandles',
            '--forceExit',
            '--maxWorkers', TEST_CONFIG.maxWorkers.toString(),
            '--setupFilesAfterEnv', '<rootDir>/tests/setup.js'
        ];

        const jest = spawn('npx', ['jest', ...jestArgs], {
            cwd: process.cwd(),
            stdio: 'inherit',
            env: {
                ...process.env,
                NODE_ENV: 'test',
                JWT_SECRET: 'test-secret-key-for-integration-tests'
            }
        });

        jest.on('close', (code) => {
            if (code === 0) {
                resolve({ success: true, code });
            } else {
                resolve({ success: false, code });
            }
        });

        jest.on('error', (error) => {
            reject(error);
        });
    });
}

async function runAllTests() {
    printHeader();

    const results = [];
    let totalPassed = 0;
    let totalFailed = 0;

    for (let i = 0; i < TEST_SUITES.length; i++) {
        const suite = TEST_SUITES[i];
        printSuiteHeader(suite, i);

        try {
            const startTime = Date.now();
            const result = await runJestTest(suite.pattern);
            const duration = Date.now() - startTime;

            results.push({
                ...suite,
                success: result.success,
                duration,
                code: result.code
            });

            if (result.success) {
                totalPassed++;
                console.log(colorize(`✓ ${suite.name} PASSED (${duration}ms)`, 'green'));
            } else {
                totalFailed++;
                console.log(colorize(`✗ ${suite.name} FAILED (${duration}ms)`, 'red'));
            }

        } catch (error) {
            totalFailed++;
            results.push({
                ...suite,
                success: false,
                error: error.message,
                duration: 0
            });
            console.log(colorize(`✗ ${suite.name} ERROR: ${error.message}`, 'red'));
        }
    }

    // Print summary
    console.log(colorize('\n' + '='.repeat(80), 'cyan'));
    console.log(colorize('TEST SUMMARY', 'cyan'));
    console.log(colorize('='.repeat(80), 'cyan'));

    results.forEach((result, index) => {
        const status = result.success ? 
            colorize('PASSED', 'green') : 
            colorize('FAILED', 'red');
        const duration = result.duration ? `(${result.duration}ms)` : '';
        console.log(`${index + 1}. ${result.name}: ${status} ${duration}`);
    });

    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
    
    console.log(colorize('\nOVERALL RESULTS:', 'bright'));
    console.log(colorize(`Total Suites: ${TEST_SUITES.length}`, 'blue'));
    console.log(colorize(`Passed: ${totalPassed}`, 'green'));
    console.log(colorize(`Failed: ${totalFailed}`, 'red'));
    console.log(colorize(`Total Duration: ${totalDuration}ms`, 'yellow'));

    if (totalFailed > 0) {
        console.log(colorize('\nFAILED SUITES:', 'red'));
        results.filter(r => !r.success).forEach(result => {
            console.log(colorize(`- ${result.name}`, 'red'));
            if (result.error) {
                console.log(colorize(`  Error: ${result.error}`, 'red'));
            }
        });
    }

    console.log(colorize('\n' + '='.repeat(80), 'cyan'));

    // Exit with appropriate code
    process.exit(totalFailed > 0 ? 1 : 0);
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(colorize('Attendance System Integration Test Runner', 'cyan'));
    console.log('\nUsage: node run-integration-tests.js [options]');
    console.log('\nOptions:');
    console.log('  --help, -h     Show this help message');
    console.log('  --list, -l     List available test suites');
    console.log('  --suite <name> Run specific test suite');
    console.log('\nTest Suites:');
    TEST_SUITES.forEach((suite, index) => {
        console.log(`  ${index + 1}. ${suite.name}`);
        console.log(`     ${suite.description}`);
    });
    process.exit(0);
}

if (args.includes('--list') || args.includes('-l')) {
    console.log(colorize('Available Test Suites:', 'cyan'));
    TEST_SUITES.forEach((suite, index) => {
        console.log(colorize(`${index + 1}. ${suite.name}`, 'bright'));
        console.log(`   Pattern: ${suite.pattern}`);
        console.log(`   Description: ${suite.description}\n`);
    });
    process.exit(0);
}

const suiteIndex = args.indexOf('--suite');
if (suiteIndex !== -1 && args[suiteIndex + 1]) {
    const suiteName = args[suiteIndex + 1];
    const suite = TEST_SUITES.find(s => 
        s.name.toLowerCase().includes(suiteName.toLowerCase()) ||
        s.pattern.includes(suiteName)
    );
    
    if (suite) {
        console.log(colorize(`Running specific test suite: ${suite.name}`, 'cyan'));
        runJestTest(suite.pattern).then(result => {
            process.exit(result.success ? 0 : 1);
        }).catch(error => {
            console.error(colorize(`Error running test suite: ${error.message}`, 'red'));
            process.exit(1);
        });
    } else {
        console.error(colorize(`Test suite not found: ${suiteName}`, 'red'));
        console.log('\nAvailable suites:');
        TEST_SUITES.forEach(s => console.log(`  - ${s.name}`));
        process.exit(1);
    }
} else {
    // Run all tests
    runAllTests().catch(error => {
        console.error(colorize(`Fatal error: ${error.message}`, 'red'));
        process.exit(1);
    });
}