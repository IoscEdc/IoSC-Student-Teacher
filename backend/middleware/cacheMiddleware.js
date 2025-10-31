/**
 * Caching Middleware
 * Provides caching functionality for attendance API endpoints
 */

const { cacheManager, CacheKeys, CacheTTL } = require('../utils/cache');
const logger = require('../utils/logger');

/**
 * Generic cache middleware
 * @param {Function} keyGenerator - Function to generate cache key from req
 * @param {number} ttl - Time to live in seconds
 * @param {Function} condition - Optional condition function to determine if caching should be applied
 */
const cacheMiddleware = (keyGenerator, ttl = CacheTTL.MEDIUM, condition = null) => {
    return async (req, res, next) => {
        try {
            // Check condition if provided
            if (condition && !condition(req)) {
                return next();
            }

            const cacheKey = keyGenerator(req);
            
            // Try to get from cache
            const cachedData = await cacheManager.get(cacheKey);
            
            if (cachedData) {
                logger.debug('Cache hit for key:', cacheKey);
                
                // Add cache headers
                res.set({
                    'X-Cache': 'HIT',
                    'X-Cache-Key': cacheKey,
                    'Cache-Control': `public, max-age=${ttl}`
                });
                
                return res.status(200).json({
                    ...cachedData,
                    cached: true,
                    cacheKey: process.env.NODE_ENV === 'development' ? cacheKey : undefined
                });
            }

            // Cache miss - continue to controller
            logger.debug('Cache miss for key:', cacheKey);
            
            // Override res.json to cache the response
            const originalJson = res.json;
            res.json = function(data) {
                // Only cache successful responses
                if (res.statusCode === 200 && data.success) {
                    cacheManager.set(cacheKey, data, ttl).catch(error => {
                        logger.error('Failed to cache response:', error);
                    });
                }
                
                // Add cache headers
                res.set({
                    'X-Cache': 'MISS',
                    'X-Cache-Key': cacheKey,
                    'Cache-Control': `public, max-age=${ttl}`
                });
                
                return originalJson.call(this, data);
            };

            next();

        } catch (error) {
            logger.error('Cache middleware error:', error);
            // Continue without caching on error
            next();
        }
    };
};

/**
 * Cache invalidation middleware
 * Invalidates cache entries based on the operation performed
 */
const cacheInvalidationMiddleware = (invalidationRules) => {
    return async (req, res, next) => {
        // Override res.json to handle cache invalidation after successful operations
        const originalJson = res.json;
        res.json = function(data) {
            // Only invalidate cache for successful operations
            if (res.statusCode === 200 && data.success) {
                invalidateCache(req, invalidationRules).catch(error => {
                    logger.error('Cache invalidation error:', error);
                });
            }
            
            return originalJson.call(this, data);
        };

        next();
    };
};

/**
 * Invalidate cache based on rules
 * @param {Object} req - Express request object
 * @param {Array} rules - Array of invalidation rules
 */
async function invalidateCache(req, rules) {
    try {
        for (const rule of rules) {
            if (typeof rule === 'function') {
                const patterns = rule(req);
                if (Array.isArray(patterns)) {
                    for (const pattern of patterns) {
                        await cacheManager.delPattern(pattern);
                        logger.debug('Cache invalidated for pattern:', pattern);
                    }
                } else if (patterns) {
                    await cacheManager.delPattern(patterns);
                    logger.debug('Cache invalidated for pattern:', patterns);
                }
            } else if (typeof rule === 'string') {
                await cacheManager.delPattern(rule);
                logger.debug('Cache invalidated for pattern:', rule);
            }
        }
    } catch (error) {
        logger.error('Cache invalidation error:', error);
    }
}

/**
 * Specific cache middleware for attendance endpoints
 */

// Cache student summary
const cacheStudentSummary = cacheMiddleware(
    (req) => CacheKeys.studentSummary(req.params.studentId, req.query.subjectId),
    CacheTTL.MEDIUM,
    (req) => req.method === 'GET'
);

// Cache class summary
const cacheClassSummary = cacheMiddleware(
    (req) => CacheKeys.classSummary(req.params.classId, req.params.subjectId),
    CacheTTL.MEDIUM,
    (req) => req.method === 'GET'
);

// Cache school analytics
const cacheSchoolAnalytics = cacheMiddleware(
    (req) => {
        const startDate = req.query.startDate || 'default';
        const endDate = req.query.endDate || 'default';
        return CacheKeys.schoolAnalytics(req.params.schoolId, startDate, endDate);
    },
    CacheTTL.LONG,
    (req) => req.method === 'GET'
);

// Cache class students
const cacheClassStudents = cacheMiddleware(
    (req) => CacheKeys.classStudents(req.params.classId, req.query.subjectId),
    CacheTTL.VERY_LONG, // Student enrollment changes infrequently
    (req) => req.method === 'GET'
);

// Cache teacher assignments
const cacheTeacherAssignments = cacheMiddleware(
    (req) => CacheKeys.teacherAssignments(req.user.id),
    CacheTTL.LONG,
    (req) => req.method === 'GET'
);

// Cache attendance trends
const cacheAttendanceTrends = cacheMiddleware(
    (req) => {
        const startDate = req.query.startDate || 'default';
        const endDate = req.query.endDate || 'default';
        return CacheKeys.attendanceTrends(req.params.studentId, req.params.subjectId, startDate, endDate);
    },
    CacheTTL.MEDIUM,
    (req) => req.method === 'GET'
);

// Cache low attendance alerts
const cacheLowAttendanceAlerts = cacheMiddleware(
    (req) => CacheKeys.lowAttendanceAlerts(req.params.classId, req.query.subjectId, req.query.threshold),
    CacheTTL.SHORT, // Alerts should be relatively fresh
    (req) => req.method === 'GET'
);

/**
 * Cache invalidation rules for different operations
 */

// Invalidate student-related caches when attendance is marked/updated
const invalidateStudentCaches = (req) => {
    const patterns = [];
    
    if (req.body.studentAttendance) {
        // Bulk attendance marking
        req.body.studentAttendance.forEach(attendance => {
            patterns.push(`student:${attendance.studentId}:*`);
        });
    } else if (req.body.studentId || req.params.studentId) {
        // Single student update
        const studentId = req.body.studentId || req.params.studentId;
        patterns.push(`student:${studentId}:*`);
    }
    
    // Also invalidate class and school level caches
    if (req.body.classId || req.params.classId) {
        const classId = req.body.classId || req.params.classId;
        patterns.push(`class:${classId}:*`);
    }
    
    if (req.user.school) {
        patterns.push(`school:${req.user.school}:*`);
    }
    
    // Invalidate alerts
    patterns.push('alerts:*');
    
    return patterns;
};

// Invalidate class-related caches when students are assigned/transferred
const invalidateClassCaches = (req) => {
    const patterns = [];
    
    if (req.body.targetClassId) {
        patterns.push(`class:${req.body.targetClassId}:*`);
    }
    
    if (req.body.fromClassId) {
        patterns.push(`class:${req.body.fromClassId}:*`);
    }
    
    if (req.body.toClassId) {
        patterns.push(`class:${req.body.toClassId}:*`);
    }
    
    if (req.user.school) {
        patterns.push(`school:${req.user.school}:*`);
    }
    
    return patterns;
};

// Invalidate teacher-related caches when assignments change
const invalidateTeacherCaches = (req) => {
    const patterns = [];
    
    if (req.body.teacherId) {
        patterns.push(`teacher:${req.body.teacherId}:*`);
    }
    
    if (req.user.id) {
        patterns.push(`teacher:${req.user.id}:*`);
    }
    
    return patterns;
};

/**
 * Pre-configured cache invalidation middleware for different operations
 */
const invalidateAttendanceCaches = cacheInvalidationMiddleware([invalidateStudentCaches]);
const invalidateBulkCaches = cacheInvalidationMiddleware([invalidateStudentCaches, invalidateClassCaches]);
const invalidateAssignmentCaches = cacheInvalidationMiddleware([invalidateClassCaches, invalidateTeacherCaches]);

/**
 * Cache warming functions
 * Pre-populate cache with frequently accessed data
 */
const warmCache = {
    /**
     * Warm student summary cache
     * @param {string} studentId - Student ID
     * @param {Array} subjectIds - Array of subject IDs
     */
    async studentSummary(studentId, subjectIds = []) {
        try {
            // This would typically call the actual service to get data
            // and populate the cache. Implementation depends on your service layer.
            logger.info('Cache warming for student summary:', { studentId, subjectIds });
        } catch (error) {
            logger.error('Cache warming error for student summary:', error);
        }
    },

    /**
     * Warm class summary cache
     * @param {string} classId - Class ID
     * @param {Array} subjectIds - Array of subject IDs
     */
    async classSummary(classId, subjectIds = []) {
        try {
            logger.info('Cache warming for class summary:', { classId, subjectIds });
        } catch (error) {
            logger.error('Cache warming error for class summary:', error);
        }
    }
};

module.exports = {
    cacheMiddleware,
    cacheInvalidationMiddleware,
    cacheStudentSummary,
    cacheClassSummary,
    cacheSchoolAnalytics,
    cacheClassStudents,
    cacheTeacherAssignments,
    cacheAttendanceTrends,
    cacheLowAttendanceAlerts,
    invalidateAttendanceCaches,
    invalidateBulkCaches,
    invalidateAssignmentCaches,
    warmCache
};