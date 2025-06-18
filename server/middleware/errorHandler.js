/**
 * Comprehensive error handling middleware for AI Code Visualizer
 * Handles different types of errors with appropriate responses and logging
 */

/**
 * Custom error class for application-specific errors
 */
class AppError extends Error {
    constructor(message, statusCode, errorCode = null, details = null) {
      super(message);
      this.statusCode = statusCode;
      this.errorCode = errorCode;
      this.details = details;
      this.isOperational = true;
  
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * HTTP status codes mapping
   */
  const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504
  };
  
  /**
   * Error types mapping
   */
  const ERROR_TYPES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
    GITHUB_API_ERROR: 'GITHUB_API_ERROR',
    AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
    FILE_PROCESSING_ERROR: 'FILE_PROCESSING_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR'
  };
  
  /**
   * Log error details
   */
  const logError = (error, req = null) => {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      url: req?.originalUrl,
      method: req?.method,
      ip: req?.ip,
      userAgent: req?.get('User-Agent'),
      userId: req?.user?.id,
      apiKey: req?.apiKey?.key ? '***' + req.apiKey.key.slice(-4) : null
    };
  
    // Log to console in development, use proper logging service in production
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error occurred:', errorInfo);
    } else {
      // In production, you might want to use a logging service like Winston, Bunyan, etc.
      console.error(JSON.stringify(errorInfo));
    }
  
    // Send to external error tracking service (Sentry, LogRocket, etc.)
    if (process.env.ERROR_TRACKING_URL && error.statusCode >= 500) {
      // sendToErrorTrackingService(errorInfo);
    }
  };
  
  /**
   * Handle MongoDB/Database errors
   */
  const handleDatabaseError = (error) => {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return new AppError(
        'Invalid data provided',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_TYPES.VALIDATION_ERROR,
        { fields: errors }
      );
    }
  
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return new AppError(
        `${field} already exists`,
        HTTP_STATUS.CONFLICT,
        ERROR_TYPES.VALIDATION_ERROR,
        { field, value: error.keyValue[field] }
      );
    }
  
    if (error.name === 'CastError') {
      return new AppError(
        'Invalid ID format',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_TYPES.VALIDATION_ERROR,
        { field: error.path, value: error.value }
      );
    }
  
    return new AppError(
      'Database operation failed',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_TYPES.DATABASE_ERROR
    );
  };
  
  /**
   * Handle GitHub API errors
   */
  const handleGitHubError = (error) => {
    if (error.status === 401) {
      return new AppError(
        'Invalid GitHub token',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_TYPES.GITHUB_API_ERROR,
        { githubError: error.message }
      );
    }
  
    if (error.status === 403) {
      if (error.message.includes('rate limit')) {
        return new AppError(
          'GitHub API rate limit exceeded',
          HTTP_STATUS.TOO_MANY_REQUESTS,
          ERROR_TYPES.RATE_LIMIT_ERROR,
          { 
            resetTime: error.response?.headers?.['x-ratelimit-reset'],
            remaining: error.response?.headers?.['x-ratelimit-remaining']
          }
        );
      }
      return new AppError(
        'GitHub API access forbidden',
        HTTP_STATUS.FORBIDDEN,
        ERROR_TYPES.GITHUB_API_ERROR,
        { githubError: error.message }
      );
    }
  
    if (error.status === 404) {
      return new AppError(
        'Repository not found or access denied',
        HTTP_STATUS.NOT_FOUND,
        ERROR_TYPES.NOT_FOUND_ERROR,
        { githubError: error.message }
      );
    }
  
    return new AppError(
      'GitHub API request failed',
      HTTP_STATUS.BAD_GATEWAY,
      ERROR_TYPES.GITHUB_API_ERROR,
      { githubError: error.message, status: error.status }
    );
  };
  
  /**
   * Handle AI service errors
   */
  const handleAIServiceError = (error) => {
    if (error.code === 'insufficient_quota') {
      return new AppError(
        'AI service quota exceeded',
        HTTP_STATUS.TOO_MANY_REQUESTS,
        ERROR_TYPES.AI_SERVICE_ERROR,
        { aiError: error.message }
      );
    }
  
    if (error.code === 'model_overloaded') {
      return new AppError(
        'AI service temporarily unavailable',
        HTTP_STATUS.SERVICE_UNAVAILABLE,
        ERROR_TYPES.AI_SERVICE_ERROR,
        { aiError: error.message }
      );
    }
  
    if (error.code === 'invalid_api_key') {
      return new AppError(
        'Invalid AI service API key',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_TYPES.AI_SERVICE_ERROR,
        { aiError: error.message }
      );
    }
  
    return new AppError(
      'AI analysis service failed',
      HTTP_STATUS.BAD_GATEWAY,
      ERROR_TYPES.AI_SERVICE_ERROR,
      { aiError: error.message }
    );
  };
  
  /**
   * Handle JWT errors
   */
  const handleJWTError = (error) => {
    if (error.name === 'JsonWebTokenError') {
      return new AppError(
        'Invalid authentication token',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_TYPES.AUTHENTICATION_ERROR
      );
    }
  
    if (error.name === 'TokenExpiredError') {
      return new AppError(
        'Authentication token expired',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_TYPES.AUTHENTICATION_ERROR,
        { expiredAt: error.expiredAt }
      );
    }
  
    return new AppError(
      'Authentication failed',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_TYPES.AUTHENTICATION_ERROR
    );
  };
  
  /**
   * Handle file processing errors
   */
  const handleFileProcessingError = (error) => {
    if (error.code === 'ENOENT') {
      return new AppError(
        'File not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_TYPES.FILE_PROCESSING_ERROR,
        { filePath: error.path }
      );
    }
  
    if (error.code === 'EACCES') {
      return new AppError(
        'File access denied',
        HTTP_STATUS.FORBIDDEN,
        ERROR_TYPES.FILE_PROCESSING_ERROR,
        { filePath: error.path }
      );
    }
  
    if (error.code === 'EMFILE' || error.code === 'ENFILE') {
      return new AppError(
        'Too many files open',
        HTTP_STATUS.SERVICE_UNAVAILABLE,
        ERROR_TYPES.FILE_PROCESSING_ERROR
      );
    }
  
    return new AppError(
      'File processing failed',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_TYPES.FILE_PROCESSING_ERROR,
      { originalError: error.message }
    );
  };
  
  /**
   * Main error handling middleware
   */
  const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
  
    // Log the error
    logError(error, req);
  
    // Handle specific error types
    if (err.name === 'ValidationError' || err.code === 11000 || err.name === 'CastError') {
      error = handleDatabaseError(err);
    } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      error = handleJWTError(err);
    } else if (err.status && err.request?.host?.includes('github')) {
      error = handleGitHubError(err);
    } else if (err.code && ['insufficient_quota', 'model_overloaded', 'invalid_api_key'].includes(err.code)) {
      error = handleAIServiceError(err);
    } else if (err.code && ['ENOENT', 'EACCES', 'EMFILE', 'ENFILE'].includes(err.code)) {
      error = handleFileProcessingError(err);
    } else if (!error.isOperational) {
      // Handle unexpected errors
      error = new AppError(
        'Something went wrong',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'INTERNAL_ERROR'
      );
    }
  
    // Prepare error response
    const errorResponse = {
      success: false,
      error: error.message,
      errorCode: error.errorCode,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: error.details
      }),
      ...(error.details && { details: error.details }),
      timestamp: new Date().toISOString(),
      requestId: req.id || generateRequestId()
    };
  
    // Send appropriate response based on content type
    if (req.accepts('json')) {
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
    } else {
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).send(error.message);
    }
  };
  
  /**
   * Handle 404 errors for undefined routes
   */
  const notFoundHandler = (req, res, next) => {
    const error = new AppError(
      `Route ${req.originalUrl} not found`,
      HTTP_STATUS.NOT_FOUND,
      ERROR_TYPES.NOT_FOUND_ERROR,
      {
        method: req.method,
        url: req.originalUrl
      }
    );
    next(error);
  };
  
  /**
   * Async error wrapper to catch async errors
   */
  const asyncHandler = (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };
  
  /**
   * Generate unique request ID
   */
  const generateRequestId = () => {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  };
  
  /**
   * Validation error formatter
   */
  const formatValidationErrors = (errors) => {
    if (Array.isArray(errors)) {
      return errors.map(err => ({
        field: err.path || err.field,
        message: err.message,
        value: err.value
      }));
    }
  
    if (typeof errors === 'object') {
      return Object.keys(errors).map(key => ({
        field: key,
        message: errors[key].message || errors[key],
        value: errors[key].value
      }));
    }
  
    return [{ message: errors }];
  };
  
  /**
   * Create standardized error response
   */
  const createErrorResponse = (message, statusCode, errorCode, details = null) => {
    return new AppError(message, statusCode, errorCode, details);
  };
  
  module.exports = {
    AppError,
    HTTP_STATUS,
    ERROR_TYPES,
    errorHandler,
    notFoundHandler,
    asyncHandler,
    formatValidationErrors,
    createErrorResponse,
    handleDatabaseError,
    handleGitHubError,
    handleAIServiceError,
    handleJWTError,
    handleFileProcessingError
  };