const { URL } = require('url');

/**
 * Validation utility functions for the AI Code Visualizer API
 */

class ValidationError extends Error {
  constructor(message, field = null, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.code = code;
  }
}

/**
 * GitHub repository URL validation
 */
const validateGitHubUrl = (url) => {
  if (!url || typeof url !== 'string') {
    throw new ValidationError('Repository URL is required', 'url');
  }

  // Clean the URL
  url = url.trim();
  
  // Remove .git suffix if present
  url = url.replace(/\.git$/, '');
  
  // Handle different GitHub URL formats
  const patterns = [
    /^https:\/\/github\.com\/([a-zA-Z0-9\-_.]+)\/([a-zA-Z0-9\-_.]+)$/,
    /^git@github\.com:([a-zA-Z0-9\-_.]+)\/([a-zA-Z0-9\-_.]+)$/,
    /^([a-zA-Z0-9\-_.]+)\/([a-zA-Z0-9\-_.]+)$/ // owner/repo format
  ];

  let match = null;
  for (const pattern of patterns) {
    match = url.match(pattern);
    if (match) break;
  }

  if (!match) {
    throw new ValidationError(
      'Invalid GitHub repository URL format. Expected: https://github.com/owner/repo or owner/repo',
      'url'
    );
  }

  const [, owner, repo] = match;

  // Validate owner and repo names
  if (!isValidGitHubName(owner)) {
    throw new ValidationError('Invalid repository owner name', 'owner');
  }

  if (!isValidGitHubName(repo)) {
    throw new ValidationError('Invalid repository name', 'repo');
  }

  return {
    owner,
    repo,
    fullName: `${owner}/${repo}`,
    url: `https://github.com/${owner}/${repo}`
  };
};

/**
 * Validate GitHub username/organization name or repository name
 */
const isValidGitHubName = (name) => {
  if (!name || typeof name !== 'string') return false;
  
  // GitHub username/repo rules:
  // - May contain alphanumeric characters, hyphens, dots, and underscores
  // - Cannot start or end with a hyphen
  // - Cannot have consecutive hyphens
  // - Max 39 characters for usernames, 100 for repos
  const pattern = /^[a-zA-Z0-9]([a-zA-Z0-9\-_.]*[a-zA-Z0-9])?$/;
  
  return pattern.test(name) && 
         name.length <= 100 && 
         !name.includes('--') &&
         name !== '.' &&
         name !== '..';
};

/**
 * Validate analysis options
 */
const validateAnalysisOptions = (options = {}) => {
  const validated = {};

  // Depth validation
  if (options.depth !== undefined) {
    if (!Number.isInteger(options.depth) || options.depth < 1 || options.depth > 10) {
      throw new ValidationError('Depth must be an integer between 1 and 10', 'depth');
    }
    validated.depth = options.depth;
  } else {
    validated.depth = 3; // default
  }

  // Include patterns validation
  if (options.include) {
    if (!Array.isArray(options.include)) {
      throw new ValidationError('Include patterns must be an array', 'include');
    }
    if (options.include.length > 50) {
      throw new ValidationError('Too many include patterns (max 50)', 'include');
    }
    validated.include = options.include.filter(pattern => 
      typeof pattern === 'string' && pattern.length > 0
    );
  }

  // Exclude patterns validation
  if (options.exclude) {
    if (!Array.isArray(options.exclude)) {
      throw new ValidationError('Exclude patterns must be an array', 'exclude');
    }
    if (options.exclude.length > 50) {
      throw new ValidationError('Too many exclude patterns (max 50)', 'exclude');
    }
    validated.exclude = options.exclude.filter(pattern => 
      typeof pattern === 'string' && pattern.length > 0
    );
  }

  // Analysis type validation
  const validAnalysisTypes = ['basic', 'detailed', 'comprehensive'];
  if (options.analysisType) {
    if (!validAnalysisTypes.includes(options.analysisType)) {
      throw new ValidationError(
        `Invalid analysis type. Must be one of: ${validAnalysisTypes.join(', ')}`,
        'analysisType'
      );
    }
    validated.analysisType = options.analysisType;
  } else {
    validated.analysisType = 'detailed';
  }

  // Enable AI insights validation
  if (options.enableAI !== undefined) {
    if (typeof options.enableAI !== 'boolean') {
      throw new ValidationError('EnableAI must be a boolean', 'enableAI');
    }
    validated.enableAI = options.enableAI;
  } else {
    validated.enableAI = true;
  }

  // Max file size validation (in bytes)
  if (options.maxFileSize !== undefined) {
    if (!Number.isInteger(options.maxFileSize) || options.maxFileSize < 1 || options.maxFileSize > 10 * 1024 * 1024) {
      throw new ValidationError('Max file size must be between 1 byte and 10MB', 'maxFileSize');
    }
    validated.maxFileSize = options.maxFileSize;
  } else {
    validated.maxFileSize = 1024 * 1024; // 1MB default
  }

  return validated;
};

/**
 * Validate API key format
 */
const validateApiKey = (apiKey, keyType = 'generic') => {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new ValidationError(`${keyType} API key is required`, 'apiKey');
  }

  apiKey = apiKey.trim();

  switch (keyType.toLowerCase()) {
    case 'github':
      // GitHub personal access tokens
      if (!apiKey.match(/^(ghp_|gho_|ghu_|ghs_|ghr_)[a-zA-Z0-9]{36}$/)) {
        throw new ValidationError('Invalid GitHub API key format', 'apiKey');
      }
      break;
    
    case 'openai':
      // OpenAI API keys
      if (!apiKey.match(/^sk-[a-zA-Z0-9]{48}$/)) {
        throw new ValidationError('Invalid OpenAI API key format', 'apiKey');
      }
      break;
    
    default:
      // Generic validation - at least 20 characters
      if (apiKey.length < 20) {
        throw new ValidationError('API key must be at least 20 characters long', 'apiKey');
      }
  }

  return apiKey;
};

/**
 * Validate request body size
 */
const validateRequestSize = (req, maxSize = 10 * 1024 * 1024) => { // 10MB default
  const contentLength = req.get('Content-Length');
  if (contentLength && parseInt(contentLength) > maxSize) {
    throw new ValidationError(
      `Request body too large. Maximum size: ${maxSize} bytes`,
      'contentLength'
    );
  }
};

/**
 * Validate and sanitize file path
 */
const validateFilePath = (filePath) => {
  if (!filePath || typeof filePath !== 'string') {
    throw new ValidationError('File path is required', 'filePath');
  }

  // Remove leading/trailing slashes and normalize
  filePath = filePath.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');

  // Check for path traversal attempts
  if (filePath.includes('..') || filePath.includes('~')) {
    throw new ValidationError('Invalid file path: path traversal not allowed', 'filePath');
  }

  // Check for invalid characters
  if (filePath.match(/[<>:"|?*\x00-\x1f\x7f]/)) {
    throw new ValidationError('Invalid file path: contains illegal characters', 'filePath');
  }

  // Check length
  if (filePath.length > 260) {
    throw new ValidationError('File path too long (max 260 characters)', 'filePath');
  }

  return filePath;
};

/**
 * Validate programming language
 */
const validateLanguage = (language) => {
  const supportedLanguages = [
    'javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'c',
    'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala', 'html',
    'css', 'scss', 'sass', 'less', 'vue', 'react', 'angular', 'svelte',
    'json', 'yaml', 'xml', 'markdown', 'sql', 'shell', 'bash', 'powershell'
  ];

  if (language && !supportedLanguages.includes(language.toLowerCase())) {
    throw new ValidationError(
      `Unsupported language: ${language}. Supported languages: ${supportedLanguages.join(', ')}`,
      'language'
    );
  }

  return language ? language.toLowerCase() : null;
};

/**
 * Validate pagination parameters
 */
const validatePagination = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;

  if (page < 1) {
    throw new ValidationError('Page must be a positive integer', 'page');
  }

  if (limit < 1 || limit > 100) {
    throw new ValidationError('Limit must be between 1 and 100', 'limit');
  }

  return {
    page,
    limit,
    offset: (page - 1) * limit
  };
};

/**
 * Validate sort parameters
 */
const validateSort = (query, allowedFields = []) => {
  const { sort, order = 'asc' } = query;

  if (sort && !allowedFields.includes(sort)) {
    throw new ValidationError(
      `Invalid sort field. Allowed fields: ${allowedFields.join(', ')}`,
      'sort'
    );
  }

  if (order && !['asc', 'desc'].includes(order.toLowerCase())) {
    throw new ValidationError('Order must be "asc" or "desc"', 'order');
  }

  return {
    sort: sort || allowedFields[0],
    order: order.toLowerCase()
  };
};

/**
 * Sanitize HTML content
 */
const sanitizeHtml = (html) => {
  if (!html || typeof html !== 'string') return '';
  
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Express middleware for validation errors
 */
const validationErrorHandler = (error, req, res, next) => {
  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        message: error.message,
        field: error.field,
        code: error.code
      }
    });
  }
  next(error);
};

/**
 * Create validation middleware
 */
const createValidator = (validationFn) => {
  return async (req, res, next) => {
    try {
      const result = await validationFn(req);
      if (result) {
        req.validated = result;
      }
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: {
            message: error.message,
            field: error.field,
            code: error.code
          }
        });
      }
      next(error);
    }
  };
};

module.exports = {
  ValidationError,
  validateGitHubUrl,
  isValidGitHubName,
  validateAnalysisOptions,
  validateApiKey,
  validateRequestSize,
  validateFilePath,
  validateLanguage,
  validatePagination,
  validateSort,
  sanitizeHtml,
  validationErrorHandler,
  createValidator
};