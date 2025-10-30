#!/usr/bin/env node

/**
 * Integration Validation Script
 * This script validates that all components are properly integrated and working together
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'blue') {
    console.log(`${colors[color]}[${new Date().toISOString()}] ${message}${colors.reset}`);
}

function success(message) {
    log(`✓ ${message}`, 'green');
}

function error(message) {
    log(`✗ ${message}`, 'red');
}

function warning(message) {
    log(`⚠ ${message}`, 'yellow');
}

// Validation functions
const validations = {
    // Check if all required backend files exist
    validateBackendStructure() {
        log('Validating backend structure...');
        
        const requiredFiles = [
            'backend/index.js',
            'backend/package.json',
            'backend/models/attendanceRecordSchema.js',
            'backend/models/attendanceSummarySchema.js',
            'backend/models/attendanceAuditLogSchema.js',
            'backend/services/AttendanceService.js',
            'backend/services/SummaryService.js',
            'backend/services/ValidationService.js',
            'backend/services/BulkManagementService.js',
            'backend/controllers/attendanceController.js',
            'backend/routes/attendanceRoutes.js',
            'backend/middleware/auth.js',
            'backend/middleware/errorMiddleware.js'
        ];

        let allExist = true;
        requiredFiles.forEach(file => {
            if (fs.existsSync(file)) {
                success(`Found ${file}`);
            } else {
                error(`Missing ${file}`);
                allExist = false;
            }
        });

        return allExist;
    },

    // Check if all required frontend files exist
    validateFrontendStructure() {
        log('Validating frontend structure...');
        
        const requiredFiles = [
            'frontend/src/App.js',
            'frontend/src/components/attendance/AttendanceMarkingGrid.js',
            'frontend/src/components/attendance/AttendanceDashboard.js',
            'frontend/src/components/attendance/AttendanceHistory.js',
            'frontend/src/components/attendance/AttendanceChart.js',
            'frontend/src/components/attendance/SessionSelector.js',
            'frontend/src/pages/admin/attendanceRelated/AttendanceAnalytics.js',
            'frontend/src/pages/admin/attendanceRelated/BulkStudentManager.js',
            'frontend/src/pages/admin/attendanceRelated/AttendanceReports.js'
        ];

        let allExist = true;
        requiredFiles.forEach(file => {
            if (fs.existsSync(file)) {
                success(`Found ${file}`);
            } else {
                error(`Missing ${file}`);
                allExist = false;
            }
        });

        return allExist;
    },

    // Validate API routes integration
    validateAPIIntegration() {
        log('Validating API integration...');
        
        try {
            // Check main route file
            const routeFile = fs.readFileSync('backend/routes/route.js', 'utf8');
            
            if (routeFile.includes("require('./attendanceRoutes')")) {
                success('Attendance routes are integrated in main route file');
            } else {
                error('Attendance routes not integrated in main route file');
                return false;
            }

            // Check attendance routes file
            if (fs.existsSync('backend/routes/attendanceRoutes.js')) {
                const attendanceRoutes = fs.readFileSync('backend/routes/attendanceRoutes.js', 'utf8');
                
                const requiredEndpoints = [
                    '/mark',
                    '/records',
                    '/summary',
                    '/analytics',
                    '/bulk'
                ];

                let allEndpointsExist = true;
                requiredEndpoints.forEach(endpoint => {
                    if (attendanceRoutes.includes(endpoint)) {
                        success(`Found endpoint: ${endpoint}`);
                    } else {
                        error(`Missing endpoint: ${endpoint}`);
                        allEndpointsExist = false;
                    }
                });

                return allEndpointsExist;
            } else {
                error('Attendance routes file not found');
                return false;
            }
        } catch (err) {
            error(`Error validating API integration: ${err.message}`);
            return false;
        }
    },

    // Validate database models
    validateDatabaseModels() {
        log('Validating database models...');
        
        try {
            const models = [
                'attendanceRecordSchema.js',
                'attendanceSummarySchema.js',
                'attendanceAuditLogSchema.js',
                'sessionConfigurationSchema.js'
            ];

            let allValid = true;
            models.forEach(model => {
                const modelPath = `backend/models/${model}`;
                if (fs.existsSync(modelPath)) {
                    const modelContent = fs.readFileSync(modelPath, 'utf8');
                    
                    // Check if model exports a mongoose model
                    if (modelContent.includes('mongoose.model') || modelContent.includes('module.exports')) {
                        success(`Model ${model} is properly structured`);
                    } else {
                        error(`Model ${model} may not be properly structured`);
                        allValid = false;
                    }
                } else {
                    error(`Model ${model} not found`);
                    allValid = false;
                }
            });

            return allValid;
        } catch (err) {
            error(`Error validating database models: ${err.message}`);
            return false;
        }
    },

    // Validate service layer integration
    validateServiceIntegration() {
        log('Validating service layer integration...');
        
        try {
            const services = [
                'AttendanceService.js',
                'SummaryService.js',
                'ValidationService.js',
                'BulkManagementService.js'
            ];

            let allValid = true;
            services.forEach(service => {
                const servicePath = `backend/services/${service}`;
                if (fs.existsSync(servicePath)) {
                    const serviceContent = fs.readFileSync(servicePath, 'utf8');
                    
                    // Check if service has proper class structure
                    if (serviceContent.includes('class ') || serviceContent.includes('module.exports')) {
                        success(`Service ${service} is properly structured`);
                    } else {
                        error(`Service ${service} may not be properly structured`);
                        allValid = false;
                    }
                } else {
                    error(`Service ${service} not found`);
                    allValid = false;
                }
            });

            return allValid;
        } catch (err) {
            error(`Error validating service integration: ${err.message}`);
            return false;
        }
    },

    // Validate frontend component integration
    validateFrontendIntegration() {
        log('Validating frontend component integration...');
        
        try {
            // Check if App.js includes attendance components
            const appFile = fs.readFileSync('frontend/src/App.js', 'utf8');
            
            // Check main dashboard files
            const dashboards = [
                'AdminDashboard',
                'TeacherDashboard', 
                'StudentDashboard'
            ];

            let allIntegrated = true;
            dashboards.forEach(dashboard => {
                if (appFile.includes(dashboard)) {
                    success(`${dashboard} is integrated in App.js`);
                } else {
                    warning(`${dashboard} may not be integrated in App.js`);
                }
            });

            // Check if attendance components exist and are properly structured
            const attendanceComponents = [
                'AttendanceMarkingGrid.js',
                'AttendanceDashboard.js',
                'AttendanceHistory.js'
            ];

            attendanceComponents.forEach(component => {
                const componentPath = `frontend/src/components/attendance/${component}`;
                if (fs.existsSync(componentPath)) {
                    const componentContent = fs.readFileSync(componentPath, 'utf8');
                    
                    if (componentContent.includes('export default') || componentContent.includes('module.exports')) {
                        success(`Component ${component} is properly structured`);
                    } else {
                        error(`Component ${component} may not be properly structured`);
                        allIntegrated = false;
                    }
                } else {
                    error(`Component ${component} not found`);
                    allIntegrated = false;
                }
            });

            return allIntegrated;
        } catch (err) {
            error(`Error validating frontend integration: ${err.message}`);
            return false;
        }
    },

    // Validate environment configuration
    validateEnvironmentConfig() {
        log('Validating environment configuration...');
        
        let allValid = true;

        // Check backend .env
        if (fs.existsSync('backend/.env')) {
            success('Backend .env file exists');
            
            const backendEnv = fs.readFileSync('backend/.env', 'utf8');
            const requiredBackendVars = ['MONGO_URL', 'JWT_SECRET', 'PORT'];
            
            requiredBackendVars.forEach(varName => {
                if (backendEnv.includes(varName)) {
                    success(`Backend environment variable ${varName} is configured`);
                } else {
                    warning(`Backend environment variable ${varName} may not be configured`);
                }
            });
        } else {
            warning('Backend .env file not found - using defaults');
        }

        // Check frontend .env
        if (fs.existsSync('frontend/.env')) {
            success('Frontend .env file exists');
            
            const frontendEnv = fs.readFileSync('frontend/.env', 'utf8');
            if (frontendEnv.includes('REACT_APP_API_URL')) {
                success('Frontend API URL is configured');
            } else {
                warning('Frontend API URL may not be configured');
            }
        } else {
            warning('Frontend .env file not found - using defaults');
        }

        return allValid;
    },

    // Validate package dependencies
    validateDependencies() {
        log('Validating package dependencies...');
        
        let allValid = true;

        // Check backend dependencies
        if (fs.existsSync('backend/package.json')) {
            const backendPackage = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
            const requiredBackendDeps = [
                'express',
                'mongoose',
                'jsonwebtoken',
                'bcrypt',
                'cors',
                'dotenv'
            ];

            requiredBackendDeps.forEach(dep => {
                if (backendPackage.dependencies && backendPackage.dependencies[dep]) {
                    success(`Backend dependency ${dep} is installed`);
                } else {
                    error(`Backend dependency ${dep} is missing`);
                    allValid = false;
                }
            });
        } else {
            error('Backend package.json not found');
            allValid = false;
        }

        // Check frontend dependencies
        if (fs.existsSync('frontend/package.json')) {
            const frontendPackage = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
            const requiredFrontendDeps = [
                'react',
                'react-dom',
                'react-router-dom',
                'react-redux',
                '@reduxjs/toolkit',
                'axios'
            ];

            requiredFrontendDeps.forEach(dep => {
                if (frontendPackage.dependencies && frontendPackage.dependencies[dep]) {
                    success(`Frontend dependency ${dep} is installed`);
                } else {
                    error(`Frontend dependency ${dep} is missing`);
                    allValid = false;
                }
            });
        } else {
            error('Frontend package.json not found');
            allValid = false;
        }

        return allValid;
    },

    // Validate deployment configuration
    validateDeploymentConfig() {
        log('Validating deployment configuration...');
        
        let allValid = true;

        // Check deployment scripts
        const deploymentFiles = [
            'scripts/deploy.sh',
            'docker-compose.yml',
            'backend/Dockerfile',
            'frontend/Dockerfile',
            'backend/ecosystem.config.js'
        ];

        deploymentFiles.forEach(file => {
            if (fs.existsSync(file)) {
                success(`Deployment file ${file} exists`);
            } else {
                warning(`Deployment file ${file} not found`);
            }
        });

        return allValid;
    },

    // Validate test configuration
    validateTestConfig() {
        log('Validating test configuration...');
        
        let allValid = true;

        // Check backend tests
        if (fs.existsSync('backend/tests')) {
            success('Backend tests directory exists');
            
            const testDirs = ['unit', 'integration', 'services'];
            testDirs.forEach(dir => {
                if (fs.existsSync(`backend/tests/${dir}`)) {
                    success(`Backend ${dir} tests directory exists`);
                } else {
                    warning(`Backend ${dir} tests directory not found`);
                }
            });
        } else {
            warning('Backend tests directory not found');
        }

        // Check if Jest is configured
        if (fs.existsSync('backend/jest.config.js')) {
            success('Backend Jest configuration exists');
        } else {
            warning('Backend Jest configuration not found');
        }

        return allValid;
    }
};

// Main validation function
async function runValidation() {
    log('Starting comprehensive integration validation...');
    
    const results = {};
    let overallSuccess = true;

    // Run all validations
    for (const [name, validation] of Object.entries(validations)) {
        try {
            log(`\n--- Running ${name} ---`);
            const result = await validation();
            results[name] = result;
            
            if (!result) {
                overallSuccess = false;
            }
        } catch (err) {
            error(`Validation ${name} failed with error: ${err.message}`);
            results[name] = false;
            overallSuccess = false;
        }
    }

    // Generate summary
    log('\n=== VALIDATION SUMMARY ===');
    
    const passed = Object.values(results).filter(r => r === true).length;
    const total = Object.keys(results).length;
    
    log(`Validations passed: ${passed}/${total}`);
    
    Object.entries(results).forEach(([name, result]) => {
        if (result) {
            success(`${name}: PASSED`);
        } else {
            error(`${name}: FAILED`);
        }
    });

    if (overallSuccess) {
        success('\n🎉 All validations passed! System is ready for deployment.');
        return 0;
    } else {
        error('\n❌ Some validations failed. Please review the issues above.');
        return 1;
    }
}

// Run validation if called directly
if (require.main === module) {
    runValidation()
        .then(exitCode => process.exit(exitCode))
        .catch(err => {
            error(`Validation failed: ${err.message}`);
            process.exit(1);
        });
}

module.exports = { validations, runValidation };