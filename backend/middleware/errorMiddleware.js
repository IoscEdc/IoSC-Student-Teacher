const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const { formatErrorResponse } = require('../utils/errorResponses');
const errorMonitoringService = require('../services/ErrorMonitoringService');

/**
 * Comprehensive error handler middleware
 * Handles all types of errors with proper logging and user-friendly responses
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Track error in monitoring service
    const errorContext = {
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        userId: req.user?.id,
        userRole: req.user?.role,
        endpoint: `${req.method} ${req.originalUrl}`,
        body: req.method !== 'GET' ? req.body : undefined,
        query: req.query,
        params: req.params
    };

    // Log error details
    logError(err, req);

    // Handle specific error types
    if (err.name === 'CastError') {
        error = handleCastError(err);
    } else if (err.code === 11000) {
        error = handleDuplicateKeyError(err);
    } else if (err.name === 'ValidationError' && !err.isOperational) {
        // Handle Mongoose ValidationError (different from our custom ValidationError)
        error = handleValidationError(err);
    } else if (err.name === 'JsonWebTokenError') {
        error = handleJWTError(err);
    } else if (err.name === 'TokenExpiredError') {
        error = handleJWTExpiredError(err);
    } else if (err.name === 'MongoError' || err.name === 'MongoServerError') {
        error = handleMongoError(err);
    }

    // If it's not an operational error, convert it to a generic AppError
    if (!error.isOperational) {
        error = new AppError(
            process.env.NODE_ENV === 'production' 
                ? 'Something went wrong' 
                : error.message,
            error.statusCode || 500,
            'INTERNAL_SERVER_ERROR',
            process.env.NODE_ENV === 'development' ? { stack: err.stack } : null
        );
    }

    // Track the processed error
    errorMonitoringService.trackError(error, errorContext);

    // Send user-friendly error response
    const errorResponse = formatErrorResponse(error, req);
    
    // Add development-specific information
    if (process.env.NODE_ENV === 'development') {
        errorResponse.debug = {
            stack: error.stack,
            originalError: error.message
        };
    }

    res.status(error.statusCode || 500).json(errorResponse);
};

/**
 * Handle MongoDB CastError (invalid ObjectId)
 */
const handleCastError = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400, 'INVALID_ID');
};

/**
 * Handle MongoDB duplicate key error
 */
const handleDuplicateKeyError = (err) => {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field} '${value}' already exists`;
    return new AppError(message, 409, 'DUPLICATE_FIELD', { field, value });
};

/**
 * Handle Mongoose validation error
 */
const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map(val => ({
        field: val.path,
        message: val.message,
        value: val.value
    }));
    
    const message = 'Validation failed';
    return new AppError(message, 400, 'VALIDATION_ERROR', { errors });
};

/**
 * Handle JWT errors
 */
const handleJWTError = (err) => {
    return new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN');
};

/**
 * Handle JWT expired error
 */
const handleJWTExpiredError = (err) => {
    return new AppError('Token expired. Please log in again.', 401, 'TOKEN_EXPIRED');
};

/**
 * Handle MongoDB errors
 */
const handleMongoError = (err) => {
    let message = 'Database operation failed';
    let code = 'DATABASE_ERROR';
    
    if (err.code === 11000) {
        return handleDuplicateKeyError(err);
    }
    
    // Handle specific MongoDB error codes
    switch (err.code) {
        case 121:
            message = 'Document validation failed';
            code = 'DOCUMENT_VALIDATION_ERROR';
            break;
        case 50:
            message = 'Operation exceeded time limit';
            code = 'OPERATION_TIMEOUT';
            break;
        default:
            message = process.env.NODE_ENV === 'production' 
                ? 'Database operation failed' 
                : err.message;
    }
    
    return new AppError(message, 500, code);
};

/**
 * Log error with context information
 */
const logError = (err, req) => {
    const errorInfo = {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        userRole: req.user?.role,
        timestamp: new Date().toISOString(),
        body: req.method !== 'GET' ? req.body : undefined,
        query: req.query,
        params: req.params
    };

    // Log based on error severity
    if (err.statusCode >= 500) {
        logger.error('Server Error:', errorInfo);
    } else if (err.statusCode >= 400) {
        logger.warn('Client Error:', errorInfo);
    } else {
        logger.info('Error:', errorInfo);
    }
};

/**
 * Async error wrapper to catch async errors in route handlers
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Handle 404 errors for undefined routes
 */
const notFoundHandler = (req, res, next) => {
    const error = new AppError(
        `Route ${req.originalUrl} not found`,
        404,
        'ROUTE_NOT_FOUND',
        {
            method: req.method,
            url: req.originalUrl
        }
    );
    next(error);
};

module.exports = {
    errorHandler,
    asyncHandler,
    notFoundHandler
};