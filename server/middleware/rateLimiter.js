const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('redis');

/**
 * Rate limiting middleware configurations
 * Different limits for different types of operations
 */

// Initialize Redis client if available
let redisClient;
if (process.env.REDIS_URL) {
  try {
    redisClient = Redis.createClient({
      url: process.env.REDIS_URL,
      legacyMode: false
    });
    redisClient.connect();
  } catch (error) {
    console.warn('Redis connection failed, falling back to memory store:', error.message);
    redisClient = null;
  }
}

/**
 * Create Redis store if Redis is available
 */
const createStore = () => {
  if (redisClient) {
    return new RedisStore({
      client: redisClient,
      prefix: 'rl:',
    });
  }
  return undefined; // Falls back to memory store
};

/**
 * General API rate limiter
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore(),
  keyGenerator: (req) => {
    // Use API key if available, otherwise IP
    return req.apiKey?.key || req.ip;
  }
});

/**
 * Strict rate limiter for resource-intensive operations
 */
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 requests per hour
  message: {
    success: false,
    error: 'Rate limit exceeded for resource-intensive operations. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore(),
  keyGenerator: (req) => {
    return req.apiKey?.key || req.ip;
  }
});

/**
 * GitHub API rate limiter
 */
const githubLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Limit to 30 GitHub API calls per hour
  message: {
    success: false,
    error: 'GitHub API rate limit exceeded. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore(),
  keyGenerator: (req) => {
    // Use GitHub token if available, otherwise API key or IP
    return req.githubToken || req.apiKey?.key || req.ip;
  }
});

/**
 * AI Analysis rate limiter
 */
const aiAnalysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit to 20 AI analysis requests per hour
  message: {
    success: false,
    error: 'AI analysis rate limit exceeded. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore(),
  keyGenerator: (req) => {
    return req.apiKey?.key || req.ip;
  }
});

/**
 * Authentication rate limiter (for login attempts)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore(),
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Premium user rate limiter (higher limits)
 */
const premiumLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Higher limit for premium users
  message: {
    success: false,
    error: 'Premium rate limit exceeded. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore(),
  keyGenerator: (req) => {
    return req.apiKey?.key || req.ip;
  }
});

/**
 * Dynamic rate limiter based on user type
 */
const dynamicLimiter = (req, res, next) => {
  // Check if user is premium
  if (req.user?.roles?.includes('premium') || req.user?.roles?.includes('admin')) {
    return premiumLimiter(req, res, next);
  }
  
  // Check if user has API key (different limits)
  if (req.apiKey) {
    return generalLimiter(req, res, next);
  }
  
  // Default limiter for anonymous users
  return strictLimiter(req, res, next);
};

/**
 * Repository analysis specific limiter
 */
const repoAnalysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // Limit repository analysis requests
  message: {
    success: false,
    error: 'Repository analysis rate limit exceeded. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore(),
  keyGenerator: (req) => {
    return req.apiKey?.key || req.ip;
  }
});

/**
 * Create custom rate limiter with specific options
 */
const createCustomLimiter = (options) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      success: false,
      error: 'Rate limit exceeded',
      retryAfter: 'Please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore()
  };

  return rateLimit({ ...defaultOptions, ...options });
};

/**
 * Bypass rate limiter for specific conditions
 */
const bypassLimiter = (req, res, next) => {
  // Bypass for admin users
  if (req.user?.roles?.includes('admin')) {
    return next();
  }
  
  // Bypass for whitelisted IPs
  const whitelistedIPs = process.env.WHITELISTED_IPS?.split(',') || [];
  if (whitelistedIPs.includes(req.ip)) {
    return next();
  }
  
  // Apply general limiter
  return generalLimiter(req, res, next);
};

/**
 * Rate limit info middleware - adds rate limit info to response
 */
const rateLimitInfo = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (res.locals.rateLimitInfo) {
      const response = typeof data === 'string' ? JSON.parse(data) : data;
      response.rateLimitInfo = res.locals.rateLimitInfo;
      data = JSON.stringify(response);
    }
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Clean up Redis connection on app shutdown
 */
const cleanup = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    }
  }
};

// Handle graceful shutdown
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

module.exports = {
  generalLimiter,
  strictLimiter,
  githubLimiter,
  aiAnalysisLimiter,
  authLimiter,
  premiumLimiter,
  dynamicLimiter,
  repoAnalysisLimiter,
  createCustomLimiter,
  bypassLimiter,
  rateLimitInfo,
  cleanup
};