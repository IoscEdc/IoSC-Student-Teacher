/**
 * Performance Monitoring and Caching Tests
 * Tests for the performance monitoring and caching implementation
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { cacheManager } = require('../utils/cache');
const { performanceMonitor } = require('../utils/performanceMonitor');
const { queryOptimizer } = require('../utils/queryOptimizer');

let mongoServer;

describe('Performance Monitoring and Caching', () => {
    beforeAll(async () => {
        // Start in-memory MongoDB
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        
        // Connect to test database
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    });

    afterAll(async () => {
        try {
            // Close cache manager first
            await cacheManager.close();
            
            // Close mongoose connection
            if (mongoose.connection.readyState !== 0) {
                await mongoose.connection.close();
            }
            
            // Stop mongo server
            if (mongoServer) {
                await mongoServer.stop();
            }
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }, 30000); // Increase timeout for cleanup

    describe('Cache Manager', () => {
        beforeEach(async () => {
            await cacheManager.clear();
        });

        test('should set and get cache values', async () => {
            const key = 'test:key';
            const value = { data: 'test data', timestamp: new Date() };

            // Set cache value
            const setResult = await cacheManager.set(key, value, 300);
            expect(setResult).toBe(true);

            // Get cache value
            const cachedValue = await cacheManager.get(key);
            expect(cachedValue).toEqual(value);
        });

        test('should handle cache expiration', async () => {
            const key = 'test:expiry';
            const value = { data: 'expiring data' };

            // Set with short TTL
            await cacheManager.set(key, value, 1);

            // Should exist immediately
            const immediateValue = await cacheManager.get(key);
            expect(immediateValue).toEqual(value);

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 1100));

            // Should be expired
            const expiredValue = await cacheManager.get(key);
            expect(expiredValue).toBeNull();
        });

        test('should delete cache values', async () => {
            const key = 'test:delete';
            const value = { data: 'to be deleted' };

            await cacheManager.set(key, value);
            
            // Verify it exists
            let cachedValue = await cacheManager.get(key);
            expect(cachedValue).toEqual(value);

            // Delete it
            const deleteResult = await cacheManager.del(key);
            expect(deleteResult).toBe(true);

            // Verify it's gone
            cachedValue = await cacheManager.get(key);
            expect(cachedValue).toBeNull();
        });

        test('should delete cache patterns', async () => {
            // Set multiple keys with pattern
            await cacheManager.set('student:123:summary', { data: 'student 123' });
            await cacheManager.set('student:456:summary', { data: 'student 456' });
            await cacheManager.set('class:789:summary', { data: 'class 789' });

            // Delete student pattern
            const deletedCount = await cacheManager.delPattern('student:*');
            expect(deletedCount).toBeGreaterThan(0);

            // Verify student keys are gone
            const student123 = await cacheManager.get('student:123:summary');
            const student456 = await cacheManager.get('student:456:summary');
            expect(student123).toBeNull();
            expect(student456).toBeNull();

            // Verify class key still exists
            const class789 = await cacheManager.get('class:789:summary');
            expect(class789).toEqual({ data: 'class 789' });
        });

        test('should provide cache statistics', async () => {
            // Set some test data
            await cacheManager.set('test:stats:1', { data: 'stats test 1' });
            await cacheManager.set('test:stats:2', { data: 'stats test 2' });

            // Get some data to generate hits
            await cacheManager.get('test:stats:1');
            await cacheManager.get('test:stats:1');
            await cacheManager.get('nonexistent:key'); // miss

            const stats = cacheManager.getStats();
            
            expect(stats).toHaveProperty('hits');
            expect(stats).toHaveProperty('misses');
            expect(stats).toHaveProperty('sets');
            expect(stats).toHaveProperty('hitRate');
            expect(stats.hits).toBeGreaterThan(0);
            expect(stats.misses).toBeGreaterThan(0);
            expect(stats.sets).toBeGreaterThan(0);
        });
    });

    describe('Performance Monitoring', () => {
        test('should track API request performance', async () => {
            const requestData = {
                method: 'GET',
                url: '/api/test',
                responseTime: 150,
                statusCode: 200,
                userId: 'test-user-id',
                userRole: 'Admin'
            };

            performanceMonitor.trackAPIRequest(requestData);

            const summary = performanceMonitor.getPerformanceSummary();
            expect(summary).toHaveProperty('api');
            expect(summary.api).toHaveProperty('totalRequests');
            expect(summary.api.totalRequests).toBeGreaterThan(0);
        });

        test('should track database query performance', async () => {
            const queryData = {
                operation: 'find',
                collection: 'students',
                executionTime: 250,
                queryHash: 'abc12345',
                resultCount: 10
            };

            performanceMonitor.trackDatabaseQuery(queryData);

            const summary = performanceMonitor.getPerformanceSummary();
            expect(summary).toHaveProperty('database');
            expect(summary.database).toHaveProperty('slowQueries');
        });

        test('should generate performance alerts for slow requests', async () => {
            const slowRequestData = {
                method: 'GET',
                url: '/api/slow-endpoint',
                responseTime: 6000, // 6 seconds - should trigger critical alert
                statusCode: 200,
                userId: 'test-user-id',
                userRole: 'Admin'
            };

            performanceMonitor.trackAPIRequest(slowRequestData);

            const summary = performanceMonitor.getPerformanceSummary();
            expect(summary.alerts.total).toBeGreaterThan(0);
            expect(summary.alerts.critical).toBeGreaterThan(0);
        });

        test('should update performance thresholds', async () => {
            const newThresholds = {
                responseTime: {
                    warning: 1500,
                    critical: 4000
                },
                errorRate: {
                    warning: 0.03,
                    critical: 0.08
                }
            };

            performanceMonitor.updateThresholds(newThresholds);

            // Verify thresholds were updated by checking if a request triggers appropriate alerts
            const requestData = {
                method: 'GET',
                url: '/api/threshold-test',
                responseTime: 2000, // Should trigger warning with new threshold
                statusCode: 200,
                userId: 'test-user-id',
                userRole: 'Admin'
            };

            performanceMonitor.trackAPIRequest(requestData);

            const summary = performanceMonitor.getPerformanceSummary();
            expect(summary.alerts.warning).toBeGreaterThan(0);
        });
    });

    describe('Query Optimizer', () => {
        test('should generate optimization report', async () => {
            const report = queryOptimizer.getOptimizationReport();
            
            expect(report).toHaveProperty('summary');
            expect(report).toHaveProperty('slowQueries');
            expect(report).toHaveProperty('frequentQueries');
            expect(report).toHaveProperty('errorProneQueries');
            expect(report).toHaveProperty('indexSuggestions');
            expect(report).toHaveProperty('generatedAt');
            
            expect(report.summary).toHaveProperty('totalQueries');
            expect(report.summary).toHaveProperty('optimizationRules');
            expect(report.summary).toHaveProperty('indexSuggestions');
        });
    });


});