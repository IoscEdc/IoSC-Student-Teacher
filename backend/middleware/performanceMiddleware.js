/**
 * Performance Monitoring Middleware
 * Tracks API response times, database query performance, and system metrics
 */

const logger = require('../utils/logger');
const { performanceMonitor: performanceMonitorUtil } = require('../utils/performanceMonitor');

/**
 * Performance monitoring middleware
 * Tracks request processing time and logs performance metrics
 */
const performanceMonitor = (req, res, next) => {
    const startTime = Date.now();
    const startHrTime = process.hrtime();

    // Track memory usage at request start
    const memoryUsageStart = process.memoryUsage();

    // Override res.json to capture response time
    const originalJson = res.json;
    res.json = function(data) {
        const endTime = Date.now();
        const endHrTime = process.hrtime(startHrTime);
        const responseTime = endTime - startTime;
        const preciseResponseTime = endHrTime[0] * 1000 + endHrTime[1] / 1000000; // Convert to milliseconds

        // Track memory usage at request end
        const memoryUsageEnd = process.memoryUsage();

        // Log performance metrics
        const performanceData = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime: Math.round(preciseResponseTime * 100) / 100, // Round to 2 decimal places
            userAgent: req.get('User-Agent'),
            contentLength: JSON.stringify(data).length,
            memoryDelta: {
                rss: memoryUsageEnd.rss - memoryUsageStart.rss,
                heapUsed: memoryUsageEnd.heapUsed - memoryUsageStart.heapUsed,
                heapTotal: memoryUsageEnd.heapTotal - memoryUsageStart.heapTotal
            },
            timestamp: new Date().toISOString(),
            userId: req.user?.id,
            userRole: req.user?.role
        };

        // Log based on response time thresholds
        if (responseTime > 5000) { // > 5 seconds
            logger.error('Slow API Response', performanceData);
        } else if (responseTime > 2000) { // > 2 seconds
            logger.warn('Slow API Response', performanceData);
        } else if (process.env.NODE_ENV === 'development' || responseTime > 1000) {
            logger.performance('API Response Time', performanceData);
        }

        // Track performance metrics for analytics
        trackPerformanceMetrics(performanceData);
        
        // Track with advanced performance monitor
        performanceMonitorUtil.trackAPIRequest(performanceData);

        // Call original json method
        return originalJson.call(this, data);
    };

    next();
};

/**
 * Database query performance tracker
 * Wraps database operations to track query performance
 */
class DatabasePerformanceTracker {
    constructor() {
        this.queryMetrics = new Map();
        this.slowQueries = [];
        this.maxSlowQueries = 100;
        this.slowQueryThreshold = 1000; // 1 second
    }

    /**
     * Track a database query
     * @param {string} operation - Database operation type
     * @param {string} collection - Collection/table name
     * @param {Object} query - Query object
     * @param {number} executionTime - Query execution time in ms
     * @param {Object} context - Additional context
     */
    trackQuery(operation, collection, query, executionTime, context = {}) {
        const queryInfo = {
            operation,
            collection,
            executionTime: Math.round(executionTime * 100) / 100,
            timestamp: new Date(),
            context,
            queryHash: this.hashQuery(query)
        };

        // Update query metrics
        const key = `${operation}_${collection}`;
        if (!this.queryMetrics.has(key)) {
            this.queryMetrics.set(key, {
                count: 0,
                totalTime: 0,
                avgTime: 0,
                minTime: Infinity,
                maxTime: 0,
                slowQueries: 0
            });
        }

        const metrics = this.queryMetrics.get(key);
        metrics.count++;
        metrics.totalTime += executionTime;
        metrics.avgTime = metrics.totalTime / metrics.count;
        metrics.minTime = Math.min(metrics.minTime, executionTime);
        metrics.maxTime = Math.max(metrics.maxTime, executionTime);

        // Track slow queries
        if (executionTime > this.slowQueryThreshold) {
            metrics.slowQueries++;
            this.slowQueries.unshift(queryInfo);
            
            // Keep only recent slow queries
            if (this.slowQueries.length > this.maxSlowQueries) {
                this.slowQueries.pop();
            }

            // Log slow query
            logger.warn('Slow Database Query', queryInfo);
            
            // Track with advanced performance monitor
            performanceMonitorUtil.trackDatabaseQuery(queryInfo);
        } else if (process.env.NODE_ENV === 'development') {
            logger.performance('Database Query', queryInfo);
        }
    }

    /**
     * Create a hash of the query for grouping similar queries
     * @param {Object} query - Query object
     * @returns {string} Query hash
     */
    hashQuery(query) {
        try {
            const queryString = JSON.stringify(query, Object.keys(query).sort());
            return require('crypto').createHash('md5').update(queryString).digest('hex').substring(0, 8);
        } catch (error) {
            return 'unknown';
        }
    }

    /**
     * Get query performance metrics
     * @returns {Object} Performance metrics
     */
    getMetrics() {
        const metrics = {};
        for (const [key, value] of this.queryMetrics.entries()) {
            metrics[key] = {
                ...value,
                minTime: value.minTime === Infinity ? 0 : value.minTime
            };
        }

        return {
            queryMetrics: metrics,
            slowQueries: this.slowQueries.slice(0, 20), // Return top 20 slow queries
            summary: {
                totalQueries: Array.from(this.queryMetrics.values()).reduce((sum, m) => sum + m.count, 0),
                totalSlowQueries: this.slowQueries.length,
                avgResponseTime: this.calculateOverallAverage()
            }
        };
    }

    /**
     * Calculate overall average response time
     * @returns {number} Average response time
     */
    calculateOverallAverage() {
        const metrics = Array.from(this.queryMetrics.values());
        if (metrics.length === 0) return 0;

        const totalTime = metrics.reduce((sum, m) => sum + m.totalTime, 0);
        const totalCount = metrics.reduce((sum, m) => sum + m.count, 0);
        
        return totalCount > 0 ? Math.round((totalTime / totalCount) * 100) / 100 : 0;
    }

    /**
     * Clear old metrics to prevent memory issues
     */
    cleanup() {
        const cutoffTime = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 24 hours
        
        // Clear old slow queries
        this.slowQueries = this.slowQueries.filter(q => q.timestamp >= cutoffTime);
        
        logger.info('Database performance metrics cleanup completed', {
            slowQueriesCount: this.slowQueries.length,
            metricsCount: this.queryMetrics.size
        });
    }
}

// Create singleton instance
const dbPerformanceTracker = new DatabasePerformanceTracker();

/**
 * Performance metrics storage for analytics
 */
const performanceMetrics = {
    requests: [],
    maxRequests: 1000,
    
    add(metric) {
        this.requests.unshift(metric);
        if (this.requests.length > this.maxRequests) {
            this.requests.pop();
        }
    },
    
    getMetrics(timeRange = 60 * 60 * 1000) { // 1 hour default
        const cutoffTime = new Date(Date.now() - timeRange);
        const recentRequests = this.requests.filter(r => new Date(r.timestamp) >= cutoffTime);
        
        if (recentRequests.length === 0) {
            return {
                summary: { totalRequests: 0, avgResponseTime: 0, slowRequests: 0 },
                endpoints: {},
                trends: []
            };
        }
        
        const summary = {
            totalRequests: recentRequests.length,
            avgResponseTime: recentRequests.reduce((sum, r) => sum + r.responseTime, 0) / recentRequests.length,
            slowRequests: recentRequests.filter(r => r.responseTime > 2000).length,
            errorRequests: recentRequests.filter(r => r.statusCode >= 400).length
        };
        
        // Group by endpoint
        const endpoints = {};
        recentRequests.forEach(request => {
            const key = `${request.method} ${request.url}`;
            if (!endpoints[key]) {
                endpoints[key] = {
                    count: 0,
                    totalTime: 0,
                    avgTime: 0,
                    minTime: Infinity,
                    maxTime: 0,
                    errors: 0
                };
            }
            
            const endpoint = endpoints[key];
            endpoint.count++;
            endpoint.totalTime += request.responseTime;
            endpoint.avgTime = endpoint.totalTime / endpoint.count;
            endpoint.minTime = Math.min(endpoint.minTime, request.responseTime);
            endpoint.maxTime = Math.max(endpoint.maxTime, request.responseTime);
            
            if (request.statusCode >= 400) {
                endpoint.errors++;
            }
        });
        
        // Fix infinity values
        Object.values(endpoints).forEach(endpoint => {
            if (endpoint.minTime === Infinity) endpoint.minTime = 0;
        });
        
        return { summary, endpoints, recentRequests: recentRequests.slice(0, 50) };
    },
    
    cleanup() {
        const cutoffTime = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 24 hours
        this.requests = this.requests.filter(r => new Date(r.timestamp) >= cutoffTime);
    }
};

/**
 * Track performance metrics
 * @param {Object} data - Performance data
 */
function trackPerformanceMetrics(data) {
    performanceMetrics.add(data);
}

/**
 * Mongoose query performance wrapper
 * Wraps Mongoose queries to track performance
 */
const wrapMongooseQuery = (originalMethod, operation) => {
    return function(...args) {
        const startTime = Date.now();
        const result = originalMethod.apply(this, args);
        
        // Handle both promises and callbacks
        if (result && typeof result.then === 'function') {
            return result.then(data => {
                const executionTime = Date.now() - startTime;
                dbPerformanceTracker.trackQuery(
                    operation,
                    this.collection?.name || 'unknown',
                    this.getQuery ? this.getQuery() : {},
                    executionTime,
                    { resultCount: Array.isArray(data) ? data.length : 1 }
                );
                return data;
            }).catch(error => {
                const executionTime = Date.now() - startTime;
                dbPerformanceTracker.trackQuery(
                    operation,
                    this.collection?.name || 'unknown',
                    this.getQuery ? this.getQuery() : {},
                    executionTime,
                    { error: error.message }
                );
                throw error;
            });
        }
        
        return result;
    };
};

// Schedule cleanup every hour
setInterval(() => {
    dbPerformanceTracker.cleanup();
    performanceMetrics.cleanup();
}, 60 * 60 * 1000);

module.exports = {
    performanceMonitor,
    dbPerformanceTracker,
    performanceMetrics,
    wrapMongooseQuery
};