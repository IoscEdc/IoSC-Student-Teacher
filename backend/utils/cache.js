/**
 * Caching Utility
 * Provides Redis and in-memory caching for frequently accessed attendance data
 */

const redis = require('redis');
const NodeCache = require('node-cache');
const logger = require('./logger');

class CacheManager {
    constructor() {
        this.redisClient = null;
        this.memoryCache = new NodeCache({ 
            stdTTL: 300, // 5 minutes default TTL
            checkperiod: 60, // Check for expired keys every minute
            useClones: false // Better performance
        });
        this.isRedisConnected = false;
        this.cacheStats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0
        };
        
        this.initializeRedis();
        this.setupEventHandlers();
    }

    /**
     * Initialize Redis connection
     */
    async initializeRedis() {
        // Skip Redis initialization if explicitly disabled
        if (process.env.DISABLE_REDIS === 'true' || process.env.NODE_ENV === 'test') {
            logger.info('Redis disabled, using memory cache only');
            return;
        }

        try {
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            
            this.redisClient = redis.createClient({
                url: redisUrl,
                retry_strategy: (options) => {
                    if (options.error && options.error.code === 'ECONNREFUSED') {
                        // Silently fall back to memory cache
                        return undefined; // Don't retry
                    }
                    if (options.total_retry_time > 1000 * 60 * 60) {
                        return undefined;
                    }
                    if (options.attempt > 10) {
                        return undefined;
                    }
                    return Math.min(options.attempt * 100, 3000);
                }
            });

            this.redisClient.on('error', (err) => {
                // Only log Redis errors in production or if explicitly enabled
                if (process.env.NODE_ENV === 'production' || process.env.LOG_REDIS_ERRORS === 'true') {
                    logger.error('Redis Client Error:', { code: err.code });
                }
                this.isRedisConnected = false;
                this.cacheStats.errors++;
            });

            this.redisClient.on('connect', () => {
                logger.info('Redis client connected');
                this.isRedisConnected = true;
            });

            this.redisClient.on('ready', () => {
                logger.info('Redis client ready');
                this.isRedisConnected = true;
            });

            this.redisClient.on('end', () => {
                if (this.isRedisConnected) {
                    logger.warn('Redis client disconnected');
                }
                this.isRedisConnected = false;
            });

            // Try to connect with a timeout
            const connectPromise = this.redisClient.connect();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
            );

            await Promise.race([connectPromise, timeoutPromise]);
            
        } catch (error) {
            // Silently fall back to memory cache in development
            if (process.env.NODE_ENV === 'production') {
                logger.warn('Failed to connect to Redis, using memory cache only:', error.message);
            }
            this.isRedisConnected = false;
            this.redisClient = null;
        }
    }

    /**
     * Setup event handlers for memory cache
     */
    setupEventHandlers() {
        this.memoryCache.on('set', (key, value) => {
            logger.debug('Memory cache set:', { key, size: JSON.stringify(value).length });
        });

        this.memoryCache.on('del', (key, value) => {
            logger.debug('Memory cache delete:', { key });
        });

        this.memoryCache.on('expired', (key, value) => {
            logger.debug('Memory cache expired:', { key });
        });
    }

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {Promise<any>} Cached value or null
     */
    async get(key) {
        try {
            let value = null;

            // Try Redis first if connected
            if (this.isRedisConnected && this.redisClient) {
                try {
                    const redisValue = await this.redisClient.get(key);
                    if (redisValue !== null) {
                        value = JSON.parse(redisValue);
                        this.cacheStats.hits++;
                        logger.debug('Cache hit (Redis):', { key });
                        return value;
                    }
                } catch (redisError) {
                    logger.warn('Redis get error, falling back to memory cache:', redisError.message);
                    this.cacheStats.errors++;
                }
            }

            // Fallback to memory cache
            value = this.memoryCache.get(key);
            if (value !== undefined) {
                this.cacheStats.hits++;
                logger.debug('Cache hit (Memory):', { key });
                return value;
            }

            this.cacheStats.misses++;
            logger.debug('Cache miss:', { key });
            return null;

        } catch (error) {
            logger.error('Cache get error:', error);
            this.cacheStats.errors++;
            return null;
        }
    }

    /**
     * Set value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in seconds (optional)
     * @returns {Promise<boolean>} Success status
     */
    async set(key, value, ttl = 300) {
        try {
            const serializedValue = JSON.stringify(value);
            let success = false;

            // Try Redis first if connected
            if (this.isRedisConnected && this.redisClient) {
                try {
                    await this.redisClient.setEx(key, ttl, serializedValue);
                    success = true;
                    logger.debug('Cache set (Redis):', { key, ttl, size: serializedValue.length });
                } catch (redisError) {
                    logger.warn('Redis set error, falling back to memory cache:', redisError.message);
                    this.cacheStats.errors++;
                }
            }

            // Always set in memory cache as backup
            this.memoryCache.set(key, value, ttl);
            success = true;
            
            this.cacheStats.sets++;
            logger.debug('Cache set (Memory):', { key, ttl, size: serializedValue.length });
            
            return success;

        } catch (error) {
            logger.error('Cache set error:', error);
            this.cacheStats.errors++;
            return false;
        }
    }

    /**
     * Delete value from cache
     * @param {string} key - Cache key
     * @returns {Promise<boolean>} Success status
     */
    async del(key) {
        try {
            let success = false;

            // Delete from Redis if connected
            if (this.isRedisConnected && this.redisClient) {
                try {
                    await this.redisClient.del(key);
                    success = true;
                } catch (redisError) {
                    logger.warn('Redis delete error:', redisError.message);
                    this.cacheStats.errors++;
                }
            }

            // Delete from memory cache
            this.memoryCache.del(key);
            success = true;
            
            this.cacheStats.deletes++;
            logger.debug('Cache delete:', { key });
            
            return success;

        } catch (error) {
            logger.error('Cache delete error:', error);
            this.cacheStats.errors++;
            return false;
        }
    }

    /**
     * Delete multiple keys matching a pattern
     * @param {string} pattern - Key pattern (supports wildcards)
     * @returns {Promise<number>} Number of keys deleted
     */
    async delPattern(pattern) {
        try {
            let deletedCount = 0;

            // Delete from Redis if connected
            if (this.isRedisConnected && this.redisClient) {
                try {
                    const keys = await this.redisClient.keys(pattern);
                    if (keys.length > 0) {
                        deletedCount += await this.redisClient.del(keys);
                    }
                } catch (redisError) {
                    logger.warn('Redis pattern delete error:', redisError.message);
                    this.cacheStats.errors++;
                }
            }

            // Delete from memory cache
            const memoryKeys = this.memoryCache.keys();
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            const matchingKeys = memoryKeys.filter(key => regex.test(key));
            
            matchingKeys.forEach(key => {
                this.memoryCache.del(key);
                deletedCount++;
            });

            this.cacheStats.deletes += deletedCount;
            logger.debug('Cache pattern delete:', { pattern, deletedCount });
            
            return deletedCount;

        } catch (error) {
            logger.error('Cache pattern delete error:', error);
            this.cacheStats.errors++;
            return 0;
        }
    }

    /**
     * Check if key exists in cache
     * @param {string} key - Cache key
     * @returns {Promise<boolean>} Existence status
     */
    async exists(key) {
        try {
            // Check Redis first if connected
            if (this.isRedisConnected && this.redisClient) {
                try {
                    const exists = await this.redisClient.exists(key);
                    if (exists) return true;
                } catch (redisError) {
                    logger.warn('Redis exists error:', redisError.message);
                    this.cacheStats.errors++;
                }
            }

            // Check memory cache
            return this.memoryCache.has(key);

        } catch (error) {
            logger.error('Cache exists error:', error);
            this.cacheStats.errors++;
            return false;
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getStats() {
        const memoryStats = this.memoryCache.getStats();
        
        return {
            ...this.cacheStats,
            memory: {
                keys: memoryStats.keys,
                hits: memoryStats.hits,
                misses: memoryStats.misses,
                ksize: memoryStats.ksize,
                vsize: memoryStats.vsize
            },
            redis: {
                connected: this.isRedisConnected,
                client: this.redisClient ? 'initialized' : 'not_initialized'
            },
            hitRate: this.cacheStats.hits + this.cacheStats.misses > 0 
                ? Math.round((this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses)) * 100 * 100) / 100
                : 0
        };
    }

    /**
     * Clear all cache data
     * @returns {Promise<boolean>} Success status
     */
    async clear() {
        try {
            // Clear Redis if connected
            if (this.isRedisConnected && this.redisClient) {
                try {
                    await this.redisClient.flushDb();
                } catch (redisError) {
                    logger.warn('Redis clear error:', redisError.message);
                    this.cacheStats.errors++;
                }
            }

            // Clear memory cache
            this.memoryCache.flushAll();
            
            logger.info('Cache cleared');
            return true;

        } catch (error) {
            logger.error('Cache clear error:', error);
            this.cacheStats.errors++;
            return false;
        }
    }

    /**
     * Close cache connections
     */
    async close() {
        try {
            if (this.redisClient && this.isRedisConnected) {
                await this.redisClient.quit();
                this.isRedisConnected = false;
            }
            this.memoryCache.close();
            logger.info('Cache connections closed');
        } catch (error) {
            logger.error('Cache close error:', error);
        }
    }
}

// Create singleton instance
const cacheManager = new CacheManager();

/**
 * Cache key generators for attendance data
 */
const CacheKeys = {
    // Student attendance summary: student:{studentId}:summary:{subjectId?}
    studentSummary: (studentId, subjectId = null) => 
        `student:${studentId}:summary${subjectId ? `:${subjectId}` : ''}`,
    
    // Class attendance summary: class:{classId}:subject:{subjectId}:summary
    classSummary: (classId, subjectId) => 
        `class:${classId}:subject:${subjectId}:summary`,
    
    // School analytics: school:{schoolId}:analytics:{startDate}:{endDate}
    schoolAnalytics: (schoolId, startDate, endDate) => 
        `school:${schoolId}:analytics:${startDate}:${endDate}`,
    
    // Attendance records: attendance:{classId}:{subjectId}:{date}:{session}
    attendanceRecords: (classId, subjectId, date, session) => 
        `attendance:${classId}:${subjectId}:${date}:${session}`,
    
    // Class students: class:{classId}:students:{subjectId?}
    classStudents: (classId, subjectId = null) => 
        `class:${classId}:students${subjectId ? `:${subjectId}` : ''}`,
    
    // Teacher assignments: teacher:{teacherId}:assignments
    teacherAssignments: (teacherId) => 
        `teacher:${teacherId}:assignments`,
    
    // Attendance trends: trends:{studentId}:{subjectId}:{startDate}:{endDate}
    attendanceTrends: (studentId, subjectId, startDate, endDate) => 
        `trends:${studentId}:${subjectId}:${startDate}:${endDate}`,
    
    // Low attendance alerts: alerts:{classId}:{subjectId?}:{threshold}
    lowAttendanceAlerts: (classId, subjectId = null, threshold = 75) => 
        `alerts:${classId}${subjectId ? `:${subjectId}` : ''}:${threshold}`
};

/**
 * Cache TTL configurations (in seconds)
 */
const CacheTTL = {
    SHORT: 300,      // 5 minutes - for frequently changing data
    MEDIUM: 1800,    // 30 minutes - for moderately stable data
    LONG: 3600,      // 1 hour - for stable data
    VERY_LONG: 86400 // 24 hours - for very stable data
};

module.exports = {
    cacheManager,
    CacheKeys,
    CacheTTL
};