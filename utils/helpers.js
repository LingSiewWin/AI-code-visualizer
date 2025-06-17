import { 
    FILE_TYPES, 
    COMPLEXITY_THRESHOLDS, 
    COLOR_SCHEMES,
    SUPPORTED_EXTENSIONS,
    GITHUB_CONSTANTS,
    ERROR_MESSAGES
  } from './constants.js';
  
  /**
   * Extract file extension from filename
   * @param {string} filename - The filename
   * @returns {string} - File extension in lowercase
   */
  export const getFileExtension = (filename) => {
    if (!filename || typeof filename !== 'string') return '';
    
    const parts = filename.split('.');
    if (parts.length < 2) return '';
    
    return parts[parts.length - 1].toLowerCase();
  };
  
  /**
   * Get file type information based on extension
   * @param {string} filename - The filename
   * @returns {object} - File type info with color, category, and icon
   */
  export const getFileTypeInfo = (filename) => {
    const extension = getFileExtension(filename);
    return FILE_TYPES[extension] || FILE_TYPES.default;
  };
  
  /**
   * Parse GitHub repository URL
   * @param {string} url - GitHub repository URL
   * @returns {object|null} - Parsed repo info or null if invalid
   */
  export const parseGitHubUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    
    // Remove trailing slash and whitespace
    const cleanUrl = url.trim().replace(/\/$/, '');
    
    // Handle different GitHub URL formats
    const patterns = [
      /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\/.*)?$/,
      /^https?:\/\/www\.github\.com\/([^\/]+)\/([^\/]+)(?:\/.*)?$/,
      /^github\.com\/([^\/]+)\/([^\/]+)(?:\/.*)?$/,
      /^([^\/]+)\/([^\/]+)$/
    ];
    
    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match) {
        const [, owner, repo] = match;
        // Remove .git suffix if present
        const cleanRepo = repo.replace(/\.git$/, '');
        return { owner, repo: cleanRepo };
      }
    }
    
    return null;
  };
  
  /**
   * Validate GitHub repository URL
   * @param {string} url - GitHub repository URL
   * @returns {boolean} - Whether the URL is valid
   */
  export const isValidGitHubUrl = (url) => {
    return parseGitHubUrl(url) !== null;
  };
  
  /**
   * Format file size in human-readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted file size
   */
  export const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };
  
  /**
   * Calculate complexity level based on metrics
   * @param {number} complexity - Complexity value
   * @param {string} type - Type of complexity ('cyclomatic', 'cognitive', 'loc')
   * @returns {string} - Complexity level
   */
  export const getComplexityLevel = (complexity, type = 'cyclomatic') => {
    if (!complexity || complexity < 0) return 'low';
    
    const thresholds = COMPLEXITY_THRESHOLDS[type.toUpperCase()] || COMPLEXITY_THRESHOLDS.CYCLOMATIC;
    
    if (complexity <= thresholds.LOW) return 'low';
    if (complexity <= thresholds.MEDIUM) return 'medium';
    if (complexity <= thresholds.HIGH) return 'high';
    return 'critical';
  };
  
  /**
   * Get color for complexity level
   * @param {string} level - Complexity level
   * @returns {string} - Hex color code
   */
  export const getComplexityColor = (level) => {
    const colorMap = {
      low: COLOR_SCHEMES.COMPLEXITY.LOW,
      medium: COLOR_SCHEMES.COMPLEXITY.MEDIUM,
      high: COLOR_SCHEMES.COMPLEXITY.HIGH,
      critical: COLOR_SCHEMES.COMPLEXITY.CRITICAL
    };
    
    return colorMap[level] || colorMap.low;
  };
  
  /**
   * Debounce function to limit function calls
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} - Debounced function
   */
  export const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };
  
  /**
   * Throttle function to limit function calls
   * @param {Function} func - Function to throttle
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} - Throttled function
   */
  export const throttle = (func, delay) => {
    let inProgress = false;
    return (...args) => {
      if (inProgress) return;
      inProgress = true;
      setTimeout(() => {
        func.apply(null, args);
        inProgress = false;
      }, delay);
    };
  };
  
  /**
   * Deep clone an object
   * @param {*} obj - Object to clone
   * @returns {*} - Cloned object
   */
  export const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  };
  
  /**
   * Generate unique ID
   * @param {string} prefix - Optional prefix
   * @returns {string} - Unique ID
   */
  export const generateId = (prefix = '') => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `${prefix}${timestamp}${random}`;
  };
  
  /**
   * Sanitize filename for display
   * @param {string} filename - Filename to sanitize
   * @returns {string} - Sanitized filename
   */
  export const sanitizeFilename = (filename) => {
    if (!filename) return '';
    return filename.replace(/[<>:"/\\|?*]/g, '_');
  };
  
  /**
   * Check if file is supported for analysis
   * @param {string} filename - Filename to check
   * @returns {boolean} - Whether file is supported
   */
  export const isSupportedFile = (filename) => {
    const extension = getFileExtension(filename);
    return SUPPORTED_EXTENSIONS.includes(extension);
  };
  
  /**
   * Filter files by type
   * @param {Array} files - Array of file objects
   * @param {string} category - Category to filter by
   * @returns {Array} - Filtered files
   */
  export const filterFilesByType = (files, category) => {
    if (!Array.isArray(files)) return [];
    
    return files.filter(file => {
      const typeInfo = getFileTypeInfo(file.name);
      return typeInfo.category === category;
    });
  };
  
  /**
   * Calculate repository statistics
   * @param {Array} files - Array of file objects
   * @returns {object} - Repository statistics
   */
  export const calculateRepoStats = (files) => {
    if (!Array.isArray(files)) return {};
    
    const stats = {
      totalFiles: files.length,
      totalSize: 0,
      languages: {},
      categories: {},
      complexity: {
        total: 0,
        average: 0,
        files: 0
      }
    };
    
    files.forEach(file => {
      const typeInfo = getFileTypeInfo(file.name);
      const extension = getFileExtension(file.name);
      
      // Size
      if (file.size) {
        stats.totalSize += file.size;
      }
      
      // Languages
      if (extension && extension !== '') {
        stats.languages[extension] = (stats.languages[extension] || 0) + 1;
      }
      
      // Categories
      stats.categories[typeInfo.category] = (stats.categories[typeInfo.category] || 0) + 1;
      
      // Complexity
      if (file.complexity && typeof file.complexity === 'number') {
        stats.complexity.total += file.complexity;
        stats.complexity.files++;
      }
    });
    
    // Calculate average complexity
    if (stats.complexity.files > 0) {
      stats.complexity.average = stats.complexity.total / stats.complexity.files;
    }
    
    return stats;
  };
  
  /**
   * Sort files by various criteria
   * @param {Array} files - Array of file objects
   * @param {string} criteria - Sort criteria ('name', 'size', 'complexity', 'modified')
   * @param {string} order - Sort order ('asc' or 'desc')
   * @returns {Array} - Sorted files
   */
  export const sortFiles = (files, criteria = 'name', order = 'asc') => {
    if (!Array.isArray(files)) return [];
    
    const sorted = [...files].sort((a, b) => {
      let aValue, bValue;
      
      switch (criteria) {
        case 'size':
          aValue = a.size || 0;
          bValue = b.size || 0;
          break;
        case 'complexity':
          aValue = a.complexity || 0;
          bValue = b.complexity || 0;
          break;
        case 'modified':
          aValue = new Date(a.lastModified || 0);
          bValue = new Date(b.lastModified || 0);
          break;
        case 'name':
        default:
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
      }
      
      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  };
  
  /**
   * Create error object with consistent structure
   * @param {string} type - Error type
   * @param {string} message - Error message
   * @param {*} details - Additional error details
   * @returns {Error} - Formatted error object
   */
  export const createError = (type, message, details = null) => {
    const error = new Error(message || ERROR_MESSAGES[type] || 'Unknown error');
    error.type = type;
    error.details = details;
    return error;
  };
  
  /**
   * Validate file size against limits
   * @param {number} size - File size in bytes
   * @returns {boolean} - Whether file size is valid
   */
  export const isValidFileSize = (size) => {
    return size <= GITHUB_CONSTANTS.MAX_FILE_SIZE;
  };
  
  /**
   * Format date to human-readable string
   * @param {Date|string} date - Date to format
   * @returns {string} - Formatted date string
   */
  export const formatDate = (date) => {
    if (!date) return 'Unknown';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  /**
   * Calculate time ago from date
   * @param {Date|string} date - Date to calculate from
   * @returns {string} - Time ago string
   */
  export const timeAgo = (date) => {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    
    const minute = 60 * 1000;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;
    const year = day * 365;
    
    if (diffMs < minute) return 'Just now';
    if (diffMs < hour) return `${Math.floor(diffMs / minute)} minutes ago`;
    if (diffMs < day) return `${Math.floor(diffMs / hour)} hours ago`;
    if (diffMs < week) return `${Math.floor(diffMs / day)} days ago`;
    if (diffMs < month) return `${Math.floor(diffMs / week)} weeks ago`;
    if (diffMs < year) return `${Math.floor(diffMs / month)} months ago`;
    return `${Math.floor(diffMs / year)} years ago`;
  };
  
  /**
   * Escape HTML characters
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  export const escapeHtml = (text) => {
    if (!text) return '';
    
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    
    return text.replace(/[&<>"']/g, char => map[char]);
  };
  
  // Export all functions as default
  export default {
    getFileExtension,
    getFileTypeInfo,
    parseGitHubUrl,
    isValidGitHubUrl,
    formatFileSize,
    getComplexityLevel,
    getComplexityColor,
    debounce,
    throttle,
    deepClone,
    generateId,
    sanitizeFilename,
    isSupportedFile,
    filterFilesByType,
    calculateRepoStats,
    sortFiles,
    createError,
    isValidFileSize,
    formatDate,
    timeAgo,
    escapeHtml
  };