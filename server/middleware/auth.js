const jwt = require('jsonwebtoken');
const { promisify } = require('util');

/**
 * Authentication middleware for protecting routes
 * Supports both JWT tokens and API keys
 */

/**
 * Verify JWT token middleware
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No authorization header provided'
      });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Verify JWT token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Token verification failed'
    });
  }
};

/**
 * Verify API key middleware (for external integrations)
 */
const verifyApiKey = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required'
      });
    }

    // Validate API key format (adjust based on your key format)
    if (!isValidApiKeyFormat(apiKey)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key format'
      });
    }

    // In production, validate against database or key store
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
    
    if (!validApiKeys.includes(apiKey)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    // Attach API key metadata to request
    req.apiKey = {
      key: apiKey,
      // Add additional metadata if needed
      source: 'external'
    };

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'API key verification failed'
    });
  }
};

/**
 * Optional authentication middleware - allows both authenticated and anonymous access
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    // If no auth provided, continue as anonymous
    if (!authHeader && !apiKey) {
      req.user = null;
      req.apiKey = null;
      return next();
    }

    // Try JWT authentication first
    if (authHeader) {
      try {
        const token = authHeader.startsWith('Bearer ') 
          ? authHeader.slice(7) 
          : authHeader;
        
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
        req.user = decoded;
      } catch (error) {
        // JWT failed, but continue as anonymous
        req.user = null;
      }
    }

    // Try API key authentication
    if (apiKey && isValidApiKeyFormat(apiKey)) {
      const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
      if (validApiKeys.includes(apiKey)) {
        req.apiKey = {
          key: apiKey,
          source: 'external'
        };
      }
    }

    next();
  } catch (error) {
    // On error, continue as anonymous
    req.user = null;
    req.apiKey = null;
    next();
  }
};

/**
 * GitHub token validation middleware
 */
const verifyGitHubToken = (req, res, next) => {
  try {
    const githubToken = req.headers['x-github-token'] || req.body.githubToken;
    
    if (!githubToken) {
      return res.status(400).json({
        success: false,
        error: 'GitHub token required for repository analysis'
      });
    }

    // Validate GitHub token format (ghp_ prefix for personal access tokens)
    if (!githubToken.startsWith('ghp_') && !githubToken.startsWith('github_pat_')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid GitHub token format'
      });
    }

    req.githubToken = githubToken;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'GitHub token validation failed'
    });
  }
};

/**
 * Role-based access control middleware
 */
const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Admin-only access middleware
 */
const requireAdmin = requireRole(['admin']);

/**
 * Premium user access middleware
 */
const requirePremium = requireRole(['premium', 'admin']);

/**
 * Helper function to validate API key format
 */
function isValidApiKeyFormat(apiKey) {
  // Adjust regex based on your API key format
  const apiKeyRegex = /^[a-zA-Z0-9]{32,}$/;
  return apiKeyRegex.test(apiKey);
}

/**
 * Generate JWT token helper
 */
const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Extract user info from request
 */
const getUserInfo = (req) => {
  return {
    user: req.user || null,
    apiKey: req.apiKey || null,
    githubToken: req.githubToken || null,
    isAuthenticated: !!(req.user || req.apiKey),
    isAnonymous: !req.user && !req.apiKey
  };
};

module.exports = {
  verifyToken,
  verifyApiKey,
  optionalAuth,
  verifyGitHubToken,
  requireRole,
  requireAdmin,
  requirePremium,
  generateToken,
  getUserInfo,
  isValidApiKeyFormat
};