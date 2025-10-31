/**
 * Logging utility for error monitoring and debugging
 * Provides structured logging with different levels and formats
 */

const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        this.ensureLogDirectory();
    }

    /**
     * Ensure log directory exists
     */
    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * Format log message with timestamp and level
     */
    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            message,
            ...(data && { data })
        };

        return JSON.stringify(logEntry, null, 2);
    }

    /**
     * Write log to file
     */
    writeToFile(filename, content) {
        const filePath = path.join(this.logDir, filename);
        const logLine = content + '\n';
        
        fs.appendFile(filePath, logLine, (err) => {
            if (err) {
                console.error('Failed to write to log file:', err);
            }
        });
    }

    /**
     * Log error messages
     */
    error(message, data = null) {
        const formattedMessage = this.formatMessage('error', message, data);
        
        // Console output with color
        console.error('\x1b[31m%s\x1b[0m', formattedMessage);
        
        // Write to error log file
        this.writeToFile('error.log', formattedMessage);
        
        // Write to combined log file
        this.writeToFile('combined.log', formattedMessage);
    }

    /**
     * Log warning messages
     */
    warn(message, data = null) {
        const formattedMessage = this.formatMessage('warn', message, data);
        
        // Console output with color
        console.warn('\x1b[33m%s\x1b[0m', formattedMessage);
        
        // Write to combined log file
        this.writeToFile('combined.log', formattedMessage);
    }

    /**
     * Log info messages
     */
    info(message, data = null) {
        const formattedMessage = this.formatMessage('info', message, data);
        
        // Console output
        console.log(formattedMessage);
        
        // Write to combined log file
        this.writeToFile('combined.log', formattedMessage);
    }

    /**
     * Log debug messages (only in development)
     */
    debug(message, data = null) {
        if (process.env.NODE_ENV === 'development') {
            const formattedMessage = this.formatMessage('debug', message, data);
            
            // Console output with color
            console.log('\x1b[36m%s\x1b[0m', formattedMessage);
            
            // Write to debug log file
            this.writeToFile('debug.log', formattedMessage);
        }
    }

    /**
     * Log attendance-specific events
     */
    attendance(action, data) {
        const message = `Attendance ${action}`;
        const formattedMessage = this.formatMessage('attendance', message, data);
        
        console.log('\x1b[32m%s\x1b[0m', formattedMessage);
        
        // Write to attendance-specific log file
        this.writeToFile('attendance.log', formattedMessage);
        this.writeToFile('combined.log', formattedMessage);
    }

    /**
     * Log security events
     */
    security(event, data) {
        const message = `Security event: ${event}`;
        const formattedMessage = this.formatMessage('security', message, data);
        
        console.warn('\x1b[35m%s\x1b[0m', formattedMessage);
        
        // Write to security log file
        this.writeToFile('security.log', formattedMessage);
        this.writeToFile('combined.log', formattedMessage);
    }

    /**
     * Log performance metrics
     */
    performance(metric, data) {
        const message = `Performance: ${metric}`;
        const formattedMessage = this.formatMessage('performance', message, data);
        
        if (process.env.NODE_ENV === 'development') {
            console.log('\x1b[34m%s\x1b[0m', formattedMessage);
        }
        
        // Write to performance log file
        this.writeToFile('performance.log', formattedMessage);
    }

    /**
     * Clean old log files (keep last 30 days)
     */
    cleanOldLogs() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        fs.readdir(this.logDir, (err, files) => {
            if (err) {
                this.error('Failed to read log directory', { error: err.message });
                return;
            }

            files.forEach(file => {
                const filePath = path.join(this.logDir, file);
                fs.stat(filePath, (err, stats) => {
                    if (err) return;
                    
                    if (stats.mtime < thirtyDaysAgo) {
                        fs.unlink(filePath, (err) => {
                            if (err) {
                                this.error('Failed to delete old log file', { 
                                    file, 
                                    error: err.message 
                                });
                            } else {
                                this.info('Deleted old log file', { file });
                            }
                        });
                    }
                });
            });
        });
    }

    /**
     * Get log statistics
     */
    getLogStats() {
        return new Promise((resolve, reject) => {
            fs.readdir(this.logDir, (err, files) => {
                if (err) {
                    reject(err);
                    return;
                }

                const stats = {};
                let pending = files.length;

                if (pending === 0) {
                    resolve(stats);
                    return;
                }

                files.forEach(file => {
                    const filePath = path.join(this.logDir, file);
                    fs.stat(filePath, (err, fileStat) => {
                        if (!err) {
                            stats[file] = {
                                size: fileStat.size,
                                created: fileStat.birthtime,
                                modified: fileStat.mtime
                            };
                        }
                        
                        pending--;
                        if (pending === 0) {
                            resolve(stats);
                        }
                    });
                });
            });
        });
    }
}

// Create singleton instance
const logger = new Logger();

// Clean old logs on startup
logger.cleanOldLogs();

// Schedule log cleanup every 24 hours
setInterval(() => {
    logger.cleanOldLogs();
}, 24 * 60 * 60 * 1000);

module.exports = logger;