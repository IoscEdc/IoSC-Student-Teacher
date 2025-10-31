/**
 * Database Query Optimization Utility
 * Provides query optimization and monitoring for Mongoose operations
 */

const mongoose = require('mongoose');
const logger = require('./logger');
const { performanceMonitor } = require('./performanceMonitor');

class QueryOptimizer {
    constructor() {
        this.queryCache = new Map();
        this.optimizationRules = new Map();
        this.indexSuggestions = new Set();
        this.setupMongooseHooks();
    }

    /**
     * Setup Mongoose hooks for query monitoring
     */
    setupMongooseHooks() {
        // Hook into Mongoose query execution
        const originalExec = mongoose.Query.prototype.exec;
        const self = this; // Store reference to QueryOptimizer instance
        
        mongoose.Query.prototype.exec = function(callback) {
            const startTime = Date.now();
            const query = this.getQuery();
            const collection = this.model.collection.name;
            const operation = this.op;
            
            // Generate query signature for tracking
            const querySignature = self.generateQuerySignature(query, operation, collection);
            
            const result = originalExec.call(this, callback);
            
            // Handle promise-based execution
            if (result && typeof result.then === 'function') {
                return result.then(data => {
                    const executionTime = Date.now() - startTime;
                    self.trackQueryExecution(querySignature, executionTime, data, query, operation, collection);
                    return data;
                }).catch(error => {
                    const executionTime = Date.now() - startTime;
                    self.trackQueryExecution(querySignature, executionTime, null, query, operation, collection, error);
                    throw error;
                });
            }
            
            return result;
        };
    }

    /**
     * Generate a unique signature for a query
     * @param {Object} query - MongoDB query object
     * @param {string} operation - Query operation type
     * @param {string} collection - Collection name
     * @returns {string} Query signature
     */
    generateQuerySignature(query, operation, collection) {
        try {
            // Create a normalized version of the query for grouping similar queries
            const normalizedQuery = this.normalizeQuery(query);
            const signature = `${operation}_${collection}_${JSON.stringify(normalizedQuery)}`;
            return require('crypto').createHash('md5').update(signature).digest('hex');
        } catch (error) {
            logger.error('Query signature generation error:', error);
            return `${operation}_${collection}_unknown`;
        }
    }

    /**
     * Normalize query for pattern matching
     * @param {Object} query - MongoDB query object
     * @returns {Object} Normalized query
     */
    normalizeQuery(query) {
        if (!query || typeof query !== 'object') {
            return {};
        }

        const normalized = {};
        
        for (const [key, value] of Object.entries(query)) {
            if (typeof value === 'object' && value !== null) {
                if (value instanceof mongoose.Types.ObjectId) {
                    normalized[key] = 'ObjectId';
                } else if (value instanceof Date) {
                    normalized[key] = 'Date';
                } else if (Array.isArray(value)) {
                    normalized[key] = value.length > 0 ? [typeof value[0]] : [];
                } else {
                    normalized[key] = this.normalizeQuery(value);
                }
            } else {
                normalized[key] = typeof value;
            }
        }
        
        return normalized;
    }

    /**
     * Track query execution metrics
     * @param {string} signature - Query signature
     * @param {number} executionTime - Execution time in ms
     * @param {any} result - Query result
     * @param {Object} query - Original query
     * @param {string} operation - Operation type
     * @param {string} collection - Collection name
     * @param {Error} error - Error if query failed
     */
    trackQueryExecution(signature, executionTime, result, query, operation, collection, error = null) {
        try {
            // Track with performance monitor
            performanceMonitor.trackDatabaseQuery({
                operation,
                collection,
                executionTime,
                queryHash: signature.substring(0, 8),
                resultCount: this.getResultCount(result),
                error: error ? error.message : null
            });

            // Update query cache metrics
            if (!this.queryCache.has(signature)) {
                this.queryCache.set(signature, {
                    query: this.normalizeQuery(query),
                    operation,
                    collection,
                    count: 0,
                    totalTime: 0,
                    avgTime: 0,
                    minTime: Infinity,
                    maxTime: 0,
                    errors: 0,
                    lastExecuted: null
                });
            }

            const metrics = this.queryCache.get(signature);
            metrics.count++;
            metrics.totalTime += executionTime;
            metrics.avgTime = metrics.totalTime / metrics.count;
            metrics.minTime = Math.min(metrics.minTime, executionTime);
            metrics.maxTime = Math.max(metrics.maxTime, executionTime);
            metrics.lastExecuted = new Date();

            if (error) {
                metrics.errors++;
            }

            // Check for optimization opportunities
            this.analyzeQueryPerformance(signature, metrics, query, operation, collection);

        } catch (trackingError) {
            logger.error('Query tracking error:', trackingError);
        }
    }

    /**
     * Get result count from query result
     * @param {any} result - Query result
     * @returns {number} Result count
     */
    getResultCount(result) {
        if (!result) return 0;
        if (Array.isArray(result)) return result.length;
        if (typeof result === 'object') return 1;
        return 0;
    }

    /**
     * Analyze query performance and suggest optimizations
     * @param {string} signature - Query signature
     * @param {Object} metrics - Query metrics
     * @param {Object} query - Original query
     * @param {string} operation - Operation type
     * @param {string} collection - Collection name
     */
    analyzeQueryPerformance(signature, metrics, query, operation, collection) {
        try {
            const suggestions = [];

            // Check for slow queries
            if (metrics.avgTime > 1000) { // 1 second
                suggestions.push({
                    type: 'slow_query',
                    severity: metrics.avgTime > 3000 ? 'critical' : 'warning',
                    message: `Query averaging ${Math.round(metrics.avgTime)}ms execution time`,
                    recommendation: 'Consider adding indexes or optimizing query structure'
                });

                // Suggest specific indexes based on query structure
                this.suggestIndexes(query, collection, suggestions);
            }

            // Check for frequent queries
            if (metrics.count > 100 && metrics.avgTime > 100) {
                suggestions.push({
                    type: 'frequent_query',
                    severity: 'info',
                    message: `Query executed ${metrics.count} times with ${Math.round(metrics.avgTime)}ms average`,
                    recommendation: 'Consider caching results or optimizing query'
                });
            }

            // Check for queries with high error rates
            if (metrics.errors > 0 && (metrics.errors / metrics.count) > 0.1) {
                suggestions.push({
                    type: 'error_prone_query',
                    severity: 'warning',
                    message: `Query has ${Math.round((metrics.errors / metrics.count) * 100)}% error rate`,
                    recommendation: 'Review query logic and error handling'
                });
            }

            // Store optimization suggestions
            if (suggestions.length > 0) {
                this.optimizationRules.set(signature, {
                    query: this.normalizeQuery(query),
                    operation,
                    collection,
                    metrics: { ...metrics },
                    suggestions,
                    lastAnalyzed: new Date()
                });

                // Log significant performance issues
                const criticalSuggestions = suggestions.filter(s => s.severity === 'critical');
                if (criticalSuggestions.length > 0) {
                    logger.warn('Critical query performance issue detected', {
                        signature: signature.substring(0, 8),
                        collection,
                        operation,
                        avgTime: Math.round(metrics.avgTime),
                        count: metrics.count,
                        suggestions: criticalSuggestions
                    });
                }
            }

        } catch (error) {
            logger.error('Query analysis error:', error);
        }
    }

    /**
     * Suggest database indexes based on query patterns
     * @param {Object} query - MongoDB query object
     * @param {string} collection - Collection name
     * @param {Array} suggestions - Array to add suggestions to
     */
    suggestIndexes(query, collection, suggestions) {
        try {
            const indexFields = [];

            // Analyze query structure for index opportunities
            this.analyzeQueryFields(query, indexFields);

            if (indexFields.length > 0) {
                const indexSuggestion = {
                    collection,
                    fields: indexFields,
                    type: indexFields.length === 1 ? 'single' : 'compound'
                };

                const suggestionKey = `${collection}_${indexFields.join('_')}`;
                
                if (!this.indexSuggestions.has(suggestionKey)) {
                    this.indexSuggestions.add(suggestionKey);
                    
                    suggestions.push({
                        type: 'index_suggestion',
                        severity: 'info',
                        message: `Consider adding ${indexSuggestion.type} index on ${indexFields.join(', ')}`,
                        recommendation: `db.${collection}.createIndex({${indexFields.map(f => `"${f}": 1`).join(', ')}})`
                    });

                    logger.info('Index suggestion generated', indexSuggestion);
                }
            }

        } catch (error) {
            logger.error('Index suggestion error:', error);
        }
    }

    /**
     * Analyze query fields for indexing opportunities
     * @param {Object} query - Query object
     * @param {Array} indexFields - Array to collect index field suggestions
     * @param {string} prefix - Field prefix for nested objects
     */
    analyzeQueryFields(query, indexFields, prefix = '') {
        if (!query || typeof query !== 'object') {
            return;
        }

        for (const [key, value] of Object.entries(query)) {
            const fieldPath = prefix ? `${prefix}.${key}` : key;

            // Skip MongoDB operators
            if (key.startsWith('$')) {
                if (key === '$and' || key === '$or') {
                    if (Array.isArray(value)) {
                        value.forEach(subQuery => {
                            this.analyzeQueryFields(subQuery, indexFields, prefix);
                        });
                    }
                }
                continue;
            }

            // Add field to index suggestions
            if (!indexFields.includes(fieldPath)) {
                indexFields.push(fieldPath);
            }

            // Recursively analyze nested objects
            if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof mongoose.Types.ObjectId) && !(value instanceof Date)) {
                this.analyzeQueryFields(value, indexFields, fieldPath);
            }
        }
    }

    /**
     * Get query optimization report
     * @returns {Object} Optimization report
     */
    getOptimizationReport() {
        try {
            const report = {
                summary: {
                    totalQueries: this.queryCache.size,
                    optimizationRules: this.optimizationRules.size,
                    indexSuggestions: this.indexSuggestions.size
                },
                slowQueries: [],
                frequentQueries: [],
                errorProneQueries: [],
                indexSuggestions: Array.from(this.indexSuggestions),
                generatedAt: new Date()
            };

            // Collect slow queries
            for (const [signature, metrics] of this.queryCache.entries()) {
                if (metrics.avgTime > 1000) {
                    report.slowQueries.push({
                        signature: signature.substring(0, 8),
                        collection: metrics.collection,
                        operation: metrics.operation,
                        avgTime: Math.round(metrics.avgTime),
                        maxTime: Math.round(metrics.maxTime),
                        count: metrics.count
                    });
                }

                if (metrics.count > 100) {
                    report.frequentQueries.push({
                        signature: signature.substring(0, 8),
                        collection: metrics.collection,
                        operation: metrics.operation,
                        count: metrics.count,
                        avgTime: Math.round(metrics.avgTime)
                    });
                }

                if (metrics.errors > 0 && (metrics.errors / metrics.count) > 0.1) {
                    report.errorProneQueries.push({
                        signature: signature.substring(0, 8),
                        collection: metrics.collection,
                        operation: metrics.operation,
                        errorRate: Math.round((metrics.errors / metrics.count) * 100),
                        count: metrics.count
                    });
                }
            }

            // Sort by performance impact
            report.slowQueries.sort((a, b) => b.avgTime - a.avgTime);
            report.frequentQueries.sort((a, b) => b.count - a.count);
            report.errorProneQueries.sort((a, b) => b.errorRate - a.errorRate);

            return report;

        } catch (error) {
            logger.error('Optimization report generation error:', error);
            return {
                error: 'Failed to generate optimization report',
                generatedAt: new Date()
            };
        }
    }

    /**
     * Clear optimization data
     */
    cleanup() {
        try {
            const cutoffTime = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 24 hours

            // Clean up old query metrics
            for (const [signature, metrics] of this.queryCache.entries()) {
                if (metrics.lastExecuted && metrics.lastExecuted < cutoffTime) {
                    this.queryCache.delete(signature);
                }
            }

            // Clean up old optimization rules
            for (const [signature, rule] of this.optimizationRules.entries()) {
                if (rule.lastAnalyzed && rule.lastAnalyzed < cutoffTime) {
                    this.optimizationRules.delete(signature);
                }
            }

            logger.info('Query optimizer cleanup completed', {
                queryCacheSize: this.queryCache.size,
                optimizationRulesSize: this.optimizationRules.size,
                indexSuggestionsSize: this.indexSuggestions.size
            });

        } catch (error) {
            logger.error('Query optimizer cleanup error:', error);
        }
    }
}

// Create singleton instance
const queryOptimizer = new QueryOptimizer();

// Schedule cleanup every hour
setInterval(() => {
    queryOptimizer.cleanup();
}, 60 * 60 * 1000);

module.exports = {
    queryOptimizer
};