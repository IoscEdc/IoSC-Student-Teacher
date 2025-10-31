/**
 * Advanced Performance Monitoring and Alerting System
 * Provides comprehensive performance tracking with alerting capabilities
 */

const logger = require('./logger');
const { cacheManager } = require('./cache');

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            api: new Map(),
            database: new Map(),
            system: {
                startTime: Date.now(),
                requests: 0,
                errors: 0,
                memoryPeaks: [],
                cpuPeaks: []
            }
        };
        
        this.alerts = {
            thresholds: {
                responseTime: {
                    warning: 2000,  // 2 seconds
                    critical: 5000  // 5 seconds
                },
                errorRate: {
                    warning: 0.05,  // 5%
                    critical: 0.10  // 10%
                },
                memoryUsage: {
                    warning: 500 * 1024 * 1024,  // 500MB
                    critical: 1000 * 1024 * 1024 // 1GB
                },
                dbQueryTime: {
                    warning: 1000,  // 1 second
                    critical: 3000  // 3 seconds
                }
            },
            history: [],
            maxHistory: 1000
        };
        
        this.startSystemMonitoring();
    }

    /**
     * Start system-level monitoring
     */
    startSystemMonitoring() {
        // Monitor system metrics every 30 seconds
        setInterval(() => {
            this.collectSystemMetrics();
        }, 30000);

        // Clean up old metrics every hour
        setInterval(() => {
            this.cleanupMetrics();
        }, 3600000);
    }

    /**
     * Collect system metrics
     */
    collectSystemMetrics() {
        try {
            const memoryUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            
            // Track memory peaks
            if (memoryUsage.heapUsed > this.alerts.thresholds.memoryUsage.warning) {
                this.metrics.system.memoryPeaks.push({
                    timestamp: new Date(),
                    heapUsed: memoryUsage.heapUsed,
                    heapTotal: memoryUsage.heapTotal,
                    rss: memoryUsage.rss
                });
                
                // Keep only recent peaks
                if (this.metrics.system.memoryPeaks.length > 100) {
                    this.metrics.system.memoryPeaks.shift();
                }
                
                // Check for memory alert
                this.checkMemoryAlert(memoryUsage);
            }
            
            // Track CPU usage
            this.metrics.system.cpuPeaks.push({
                timestamp: new Date(),
                user: cpuUsage.user,
                system: cpuUsage.system
            });
            
            // Keep only recent CPU data
            if (this.metrics.system.cpuPeaks.length > 100) {
                this.metrics.system.cpuPeaks.shift();
            }
            
        } catch (error) {
            logger.error('System metrics collection error:', error);
        }
    }

    /**
     * Track API request performance
     * @param {Object} requestData - Request performance data
     */
    trackAPIRequest(requestData) {
        try {
            const { method, url, responseTime, statusCode, userId, userRole } = requestData;
            const endpoint = `${method} ${url}`;
            
            // Initialize endpoint metrics if not exists
            if (!this.metrics.api.has(endpoint)) {
                this.metrics.api.set(endpoint, {
                    count: 0,
                    totalTime: 0,
                    avgTime: 0,
                    minTime: Infinity,
                    maxTime: 0,
                    errors: 0,
                    recentRequests: [],
                    slowRequests: []
                });
            }
            
            const endpointMetrics = this.metrics.api.get(endpoint);
            
            // Update metrics
            endpointMetrics.count++;
            endpointMetrics.totalTime += responseTime;
            endpointMetrics.avgTime = endpointMetrics.totalTime / endpointMetrics.count;
            endpointMetrics.minTime = Math.min(endpointMetrics.minTime, responseTime);
            endpointMetrics.maxTime = Math.max(endpointMetrics.maxTime, responseTime);
            
            if (statusCode >= 400) {
                endpointMetrics.errors++;
            }
            
            // Track recent requests (keep last 50)
            endpointMetrics.recentRequests.unshift({
                timestamp: new Date(),
                responseTime,
                statusCode,
                userId,
                userRole
            });
            
            if (endpointMetrics.recentRequests.length > 50) {
                endpointMetrics.recentRequests.pop();
            }
            
            // Track slow requests
            if (responseTime > this.alerts.thresholds.responseTime.warning) {
                endpointMetrics.slowRequests.unshift({
                    timestamp: new Date(),
                    responseTime,
                    statusCode,
                    userId,
                    userRole
                });
                
                if (endpointMetrics.slowRequests.length > 20) {
                    endpointMetrics.slowRequests.pop();
                }
                
                // Check for performance alert
                this.checkPerformanceAlert(endpoint, responseTime, requestData);
            }
            
            // Update system counters
            this.metrics.system.requests++;
            if (statusCode >= 400) {
                this.metrics.system.errors++;
            }
            
        } catch (error) {
            logger.error('API request tracking error:', error);
        }
    }

    /**
     * Track database query performance
     * @param {Object} queryData - Database query performance data
     */
    trackDatabaseQuery(queryData) {
        try {
            const { operation, collection, executionTime, queryHash } = queryData;
            const queryKey = `${operation}_${collection}`;
            
            // Initialize query metrics if not exists
            if (!this.metrics.database.has(queryKey)) {
                this.metrics.database.set(queryKey, {
                    count: 0,
                    totalTime: 0,
                    avgTime: 0,
                    minTime: Infinity,
                    maxTime: 0,
                    slowQueries: [],
                    recentQueries: []
                });
            }
            
            const queryMetrics = this.metrics.database.get(queryKey);
            
            // Update metrics
            queryMetrics.count++;
            queryMetrics.totalTime += executionTime;
            queryMetrics.avgTime = queryMetrics.totalTime / queryMetrics.count;
            queryMetrics.minTime = Math.min(queryMetrics.minTime, executionTime);
            queryMetrics.maxTime = Math.max(queryMetrics.maxTime, executionTime);
            
            // Track recent queries
            queryMetrics.recentQueries.unshift({
                timestamp: new Date(),
                executionTime,
                queryHash
            });
            
            if (queryMetrics.recentQueries.length > 50) {
                queryMetrics.recentQueries.pop();
            }
            
            // Track slow queries
            if (executionTime > this.alerts.thresholds.dbQueryTime.warning) {
                queryMetrics.slowQueries.unshift({
                    timestamp: new Date(),
                    executionTime,
                    queryHash,
                    ...queryData
                });
                
                if (queryMetrics.slowQueries.length > 20) {
                    queryMetrics.slowQueries.pop();
                }
                
                // Check for database performance alert
                this.checkDatabaseAlert(queryKey, executionTime, queryData);
            }
            
        } catch (error) {
            logger.error('Database query tracking error:', error);
        }
    }

    /**
     * Check for performance alerts
     * @param {string} endpoint - API endpoint
     * @param {number} responseTime - Response time in ms
     * @param {Object} requestData - Additional request data
     */
    checkPerformanceAlert(endpoint, responseTime, requestData) {
        try {
            const severity = responseTime > this.alerts.thresholds.responseTime.critical ? 'critical' : 'warning';
            
            const alert = {
                type: 'performance',
                severity,
                endpoint,
                responseTime,
                threshold: this.alerts.thresholds.responseTime[severity],
                timestamp: new Date(),
                requestData,
                id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            
            this.addAlert(alert);
            
            // Log based on severity
            if (severity === 'critical') {
                logger.error('Critical performance alert', alert);
            } else {
                logger.warn('Performance warning', alert);
            }
            
        } catch (error) {
            logger.error('Performance alert check error:', error);
        }
    }

    /**
     * Check for database performance alerts
     * @param {string} queryKey - Database query key
     * @param {number} executionTime - Query execution time in ms
     * @param {Object} queryData - Additional query data
     */
    checkDatabaseAlert(queryKey, executionTime, queryData) {
        try {
            const severity = executionTime > this.alerts.thresholds.dbQueryTime.critical ? 'critical' : 'warning';
            
            const alert = {
                type: 'database',
                severity,
                queryKey,
                executionTime,
                threshold: this.alerts.thresholds.dbQueryTime[severity],
                timestamp: new Date(),
                queryData,
                id: `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            
            this.addAlert(alert);
            
            // Log based on severity
            if (severity === 'critical') {
                logger.error('Critical database performance alert', alert);
            } else {
                logger.warn('Database performance warning', alert);
            }
            
        } catch (error) {
            logger.error('Database alert check error:', error);
        }
    }

    /**
     * Check for memory alerts
     * @param {Object} memoryUsage - Memory usage data
     */
    checkMemoryAlert(memoryUsage) {
        try {
            const heapUsed = memoryUsage.heapUsed;
            const severity = heapUsed > this.alerts.thresholds.memoryUsage.critical ? 'critical' : 'warning';
            
            const alert = {
                type: 'memory',
                severity,
                heapUsed: Math.round(heapUsed / 1024 / 1024), // MB
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
                rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
                threshold: Math.round(this.alerts.thresholds.memoryUsage[severity] / 1024 / 1024), // MB
                timestamp: new Date(),
                id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            
            // Only add alert if it's been a while since the last memory alert
            const recentMemoryAlerts = this.alerts.history.filter(a => 
                a.type === 'memory' && 
                (Date.now() - new Date(a.timestamp).getTime()) < 300000 // 5 minutes
            );
            
            if (recentMemoryAlerts.length === 0) {
                this.addAlert(alert);
                
                // Log based on severity
                if (severity === 'critical') {
                    logger.error('Critical memory usage alert', alert);
                } else {
                    logger.warn('Memory usage warning', alert);
                }
            }
            
        } catch (error) {
            logger.error('Memory alert check error:', error);
        }
    }

    /**
     * Add alert to history
     * @param {Object} alert - Alert object
     */
    addAlert(alert) {
        this.alerts.history.unshift(alert);
        
        // Keep only recent alerts
        if (this.alerts.history.length > this.alerts.maxHistory) {
            this.alerts.history.pop();
        }
        
        // Cache alert for external access
        cacheManager.set(`alert:${alert.id}`, alert, 3600).catch(error => {
            logger.error('Failed to cache alert:', error);
        });
    }

    /**
     * Get performance summary
     * @param {number} timeRange - Time range in milliseconds
     * @returns {Object} Performance summary
     */
    getPerformanceSummary(timeRange = 3600000) { // 1 hour default
        try {
            const cutoffTime = new Date(Date.now() - timeRange);
            
            // API metrics summary
            const apiSummary = {
                totalEndpoints: this.metrics.api.size,
                totalRequests: this.metrics.system.requests,
                totalErrors: this.metrics.system.errors,
                errorRate: this.metrics.system.requests > 0 
                    ? Math.round((this.metrics.system.errors / this.metrics.system.requests) * 100 * 100) / 100
                    : 0,
                slowEndpoints: []
            };
            
            // Find slow endpoints
            for (const [endpoint, metrics] of this.metrics.api.entries()) {
                if (metrics.avgTime > this.alerts.thresholds.responseTime.warning) {
                    apiSummary.slowEndpoints.push({
                        endpoint,
                        avgTime: Math.round(metrics.avgTime * 100) / 100,
                        maxTime: Math.round(metrics.maxTime * 100) / 100,
                        count: metrics.count,
                        errorRate: metrics.count > 0 
                            ? Math.round((metrics.errors / metrics.count) * 100 * 100) / 100
                            : 0
                    });
                }
            }
            
            // Database metrics summary
            const dbSummary = {
                totalQueryTypes: this.metrics.database.size,
                slowQueries: []
            };
            
            // Find slow query types
            for (const [queryKey, metrics] of this.metrics.database.entries()) {
                if (metrics.avgTime > this.alerts.thresholds.dbQueryTime.warning) {
                    dbSummary.slowQueries.push({
                        queryKey,
                        avgTime: Math.round(metrics.avgTime * 100) / 100,
                        maxTime: Math.round(metrics.maxTime * 100) / 100,
                        count: metrics.count
                    });
                }
            }
            
            // Recent alerts
            const recentAlerts = this.alerts.history.filter(alert => 
                new Date(alert.timestamp) >= cutoffTime
            );
            
            // System health
            const memoryUsage = process.memoryUsage();
            const uptime = process.uptime();
            
            return {
                api: apiSummary,
                database: dbSummary,
                system: {
                    uptime: Math.round(uptime / 60 * 100) / 100, // minutes
                    memoryUsage: {
                        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
                        rss: Math.round(memoryUsage.rss / 1024 / 1024) // MB
                    },
                    nodeVersion: process.version,
                    platform: process.platform
                },
                alerts: {
                    total: recentAlerts.length,
                    critical: recentAlerts.filter(a => a.severity === 'critical').length,
                    warning: recentAlerts.filter(a => a.severity === 'warning').length,
                    recent: recentAlerts.slice(0, 10) // Last 10 alerts
                },
                generatedAt: new Date()
            };
            
        } catch (error) {
            logger.error('Performance summary generation error:', error);
            return {
                error: 'Failed to generate performance summary',
                generatedAt: new Date()
            };
        }
    }

    /**
     * Get detailed metrics for a specific endpoint
     * @param {string} endpoint - API endpoint
     * @returns {Object} Detailed endpoint metrics
     */
    getEndpointMetrics(endpoint) {
        const metrics = this.metrics.api.get(endpoint);
        if (!metrics) {
            return null;
        }
        
        return {
            endpoint,
            ...metrics,
            minTime: metrics.minTime === Infinity ? 0 : metrics.minTime,
            errorRate: metrics.count > 0 
                ? Math.round((metrics.errors / metrics.count) * 100 * 100) / 100
                : 0
        };
    }

    /**
     * Clean up old metrics to prevent memory leaks
     */
    cleanupMetrics() {
        try {
            const cutoffTime = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 24 hours
            
            // Clean up API metrics
            for (const [endpoint, metrics] of this.metrics.api.entries()) {
                metrics.recentRequests = metrics.recentRequests.filter(req => 
                    new Date(req.timestamp) >= cutoffTime
                );
                metrics.slowRequests = metrics.slowRequests.filter(req => 
                    new Date(req.timestamp) >= cutoffTime
                );
            }
            
            // Clean up database metrics
            for (const [queryKey, metrics] of this.metrics.database.entries()) {
                metrics.recentQueries = metrics.recentQueries.filter(query => 
                    new Date(query.timestamp) >= cutoffTime
                );
                metrics.slowQueries = metrics.slowQueries.filter(query => 
                    new Date(query.timestamp) >= cutoffTime
                );
            }
            
            // Clean up alerts
            this.alerts.history = this.alerts.history.filter(alert => 
                new Date(alert.timestamp) >= cutoffTime
            );
            
            // Clean up system peaks
            this.metrics.system.memoryPeaks = this.metrics.system.memoryPeaks.filter(peak => 
                new Date(peak.timestamp) >= cutoffTime
            );
            this.metrics.system.cpuPeaks = this.metrics.system.cpuPeaks.filter(peak => 
                new Date(peak.timestamp) >= cutoffTime
            );
            
            logger.info('Performance metrics cleanup completed', {
                apiEndpoints: this.metrics.api.size,
                dbQueryTypes: this.metrics.database.size,
                alertsCount: this.alerts.history.length
            });
            
        } catch (error) {
            logger.error('Metrics cleanup error:', error);
        }
    }

    /**
     * Update alert thresholds
     * @param {Object} newThresholds - New threshold values
     */
    updateThresholds(newThresholds) {
        try {
            this.alerts.thresholds = {
                ...this.alerts.thresholds,
                ...newThresholds
            };
            
            logger.info('Performance alert thresholds updated', this.alerts.thresholds);
            
        } catch (error) {
            logger.error('Threshold update error:', error);
        }
    }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = {
    performanceMonitor
};