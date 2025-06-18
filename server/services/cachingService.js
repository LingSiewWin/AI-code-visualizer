const Redis = require('redis');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

class CachingService {
  constructor(options = {}) {
    this.config = {
      redis: {
        enabled: process.env.REDIS_ENABLED === 'true',
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'ai-code-viz:',
        defaultTTL: parseInt(process.env.CACHE_TTL) || 3600, // 1 hour
      },
      fileSystem: {
        enabled: true,
        cacheDir: options.cacheDir || path.join(process.cwd(), '.cache'),
        maxSize: options.maxCacheSize || 100 * 1024 * 1024, // 100MB
        cleanupInterval: options.cleanupInterval || 24 * 60 * 60 * 1000, // 24 hours
      },
      memory: {
        enabled: true,
        maxItems: options.maxMemoryItems || 1000,
        ttl: options.memoryTTL || 300, // 5 minutes
      }
    };

    this.redisClient = null;
    this.memoryCache = new Map();
    this.memoryCacheTimestamps = new Map();
    this.cleanupTimer = null;

    this.initialize();
  }

  /**
   * Initialize caching service
   */
  async initialize() {
    try {
      // Initialize Redis if enabled
      if (this.config.redis.enabled) {
        await this.initializeRedis();
      }

      // Initialize file system cache
      if (this.config.fileSystem.enabled) {
        await this.initializeFileSystemCache();
      }

      // Start cleanup timer
      this.startCleanupTimer();

      logger.info('Caching service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize caching service:', error);
    }
  }

  /**
   * Initialize Redis connection
   */
  async initializeRedis() {
    try {
      this.redisClient = Redis.createClient({
        url: this.config.redis.url,
        retry_strategy: (times) => Math.min(times * 50, 2000),
      });

      this.redisClient.on('error', (error) => {
        logger.error('Redis error:', error);
        this.config.redis.enabled = false;
      });

      this.redisClient.on('connect', () => {
        logger.info('Connected to Redis cache');
      });

      this.redisClient.on('disconnect', () => {
        logger.warn('Disconnected from Redis cache');
      });

      await this.redisClient.connect();
    } catch (error) {
      logger.warn('Redis initialization failed, falling back to other caches:', error);
      this.config.redis.enabled = false;
    }
  }

  /**
   * Initialize file system cache
   */
  async initializeFileSystemCache() {
    try {
      await fs.mkdir(this.config.fileSystem.cacheDir, { recursive: true });
      logger.info(`File system cache initialized at: ${this.config.fileSystem.cacheDir}`);
    } catch (error) {
      logger.warn('File system cache initialization failed:', error);
      this.config.fileSystem.enabled = false;
    }
  }

  /**
   * Start cleanup timer
   */
  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.fileSystem.cleanupInterval);
  }

  /**
   * Get cached data
   */
  async get(key, options = {}) {
    const cacheKey = this.generateCacheKey(key);
    
    try {
      // Try memory cache first (fastest)
      if (this.config.memory.enabled) {
        const memoryResult = this.getFromMemory(cacheKey);
        if (memoryResult !== null) {
          logger.debug(`Cache hit (memory): ${key}`);
          return memoryResult;
        }
      }

      // Try Redis cache (fast)
      if (this.config.redis.enabled && this.redisClient) {
        const redisResult = await this.getFromRedis(cacheKey);
        if (redisResult !== null) {
          logger.debug(`Cache hit (redis): ${key}`);
          // Store in memory for faster future access
          this.setInMemory(cacheKey, redisResult);
          return redisResult;
        }
      }

      // Try file system cache (slower but persistent)
      if (this.config.fileSystem.enabled) {
        const fileResult = await this.getFromFileSystem(cacheKey);
        if (fileResult !== null) {
          logger.debug(`Cache hit (filesystem): ${key}`);
          // Store in faster caches
          this.setInMemory(cacheKey, fileResult);
          if (this.config.redis.enabled && this.redisClient) {
            await this.setInRedis(cacheKey, fileResult, options.ttl);
          }
          return fileResult;
        }
      }

      logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data
   */
  async set(key, value, options = {}) {
    const cacheKey = this.generateCacheKey(key);
    const ttl = options.ttl || this.config.redis.defaultTTL;
    
    try {
      const serializedValue = JSON.stringify({
        data: value,
        timestamp: Date.now(),
        ttl: ttl * 1000, // Convert to milliseconds
        metadata: options.metadata || {}
      });

      // Set in all available caches
      const promises = [];

      if (this.config.memory.enabled) {
        this.setInMemory(cacheKey, value);
      }

      if (this.config.redis.enabled && this.redisClient) {
        promises.push(this.setInRedis(cacheKey, value, ttl));
      }

      if (this.config.fileSystem.enabled) {
        promises.push(this.setInFileSystem(cacheKey, serializedValue));
      }

      await Promise.allSettled(promises);
      logger.debug(`Cache set: ${key}`);
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete cached data
   */
  async delete(key) {
    const cacheKey = this.generateCacheKey(key);
    
    try {
      const promises = [];

      // Delete from memory cache
      if (this.config.memory.enabled) {
        this.memoryCache.delete(cacheKey);
        this.memoryCacheTimestamps.delete(cacheKey);
      }

      // Delete from Redis
      if (this.config.redis.enabled && this.redisClient) {
        promises.push(this.redisClient.del(cacheKey));
      }

      // Delete from file system
      if (this.config.fileSystem.enabled) {
        const filePath = this.getFilePath(cacheKey);
        promises.push(fs.unlink(filePath).catch(() => {})); // Ignore file not found errors
      }

      await Promise.allSettled(promises);
      logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Clear all caches
   */
  async clear() {
    try {
      // Clear memory cache
      this.memoryCache.clear();
      this.memoryCacheTimestamps.clear();

      // Clear Redis cache
      if (this.config.redis.enabled && this.redisClient) {
        const pattern = `${this.config.redis.keyPrefix}*`;
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      }

      // Clear file system cache
      if (this.config.fileSystem.enabled) {
        const files = await fs.readdir(this.config.fileSystem.cacheDir);
        const deletePromises = files.map(file => 
          fs.unlink(path.join(this.config.fileSystem.cacheDir, file)).catch(() => {})
        );
        await Promise.allSettled(deletePromises);
      }

      logger.info('All caches cleared');
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    const stats = {
      memory: {
        enabled: this.config.memory.enabled,
        items: this.memoryCache.size,
        maxItems: this.config.memory.maxItems
      },
      redis: {
        enabled: this.config.redis.enabled,
        connected: this.redisClient?.isOpen || false,
        keys: 0
      },
      fileSystem: {
        enabled: this.config.fileSystem.enabled,
        files: 0,
        totalSize: 0
      }
    };

    try {
      // Redis stats
      if (this.config.redis.enabled && this.redisClient) {
        const pattern = `${this.config.redis.keyPrefix}*`;
        const keys = await this.redisClient.keys(pattern);
        stats.redis.keys = keys.length;
      }

      // File system stats
      if (this.config.fileSystem.enabled) {
        const files = await fs.readdir(this.config.fileSystem.cacheDir);
        stats.fileSystem.files = files.length;
        
        for (const file of files) {
          const filePath = path.join(this.config.fileSystem.cacheDir, file);
          const stat = await fs.stat(filePath);
          stats.fileSystem.totalSize += stat.size;
        }
      }
    } catch (error) {
      logger.error('Error getting cache stats:', error);
    }

    return stats;
  }

  /**
   * Cache analysis results with specialized handling
   */
  async cacheAnalysis(repoUrl, analysis, options = {}) {
    const key = `analysis:${this.hashString(repoUrl)}`;
    await this.set(key, analysis, {
      ttl: options.ttl || 7200, // 2 hours for analysis results
      metadata: {
        type: 'analysis',
        repoUrl,
        analyzedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Get cached analysis results
   */
  async getCachedAnalysis(repoUrl) {
    const key = `analysis:${this.hashString(repoUrl)}`;
    return await this.get(key);
  }

  /**
   * Cache GitHub API responses
   */
  async cacheGitHubResponse(endpoint, response, options = {}) {
    const key = `github:${this.hashString(endpoint)}`;
    await this.set(key, response, {
      ttl: options.ttl || 1800, // 30 minutes for GitHub API responses
      metadata: {
        type: 'github-api',
        endpoint,
        cachedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Get cached GitHub API response
   */
  async getCachedGitHubResponse(endpoint) {
    const key = `github:${this.hashString(endpoint)}`;
    return await this.get(key);
  }

  /**
   * Cache AI insights
   */
  async cacheAIInsights(input, insights, options = {}) {
    const key = `ai-insights:${this.hashString(input)}`;
    await this.set(key, insights, {
      ttl: options.ttl || 3600, // 1 hour for AI insights
      metadata: {
        type: 'ai-insights',
        inputHash: this.hashString(input),
        generatedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Get cached AI insights
   */
  async getCachedAIInsights(input) {
    const key = `ai-insights:${this.hashString(input)}`;
    return await this.get(key);
  }

  // Private methods

  /**
   * Get from memory cache
   */
  getFromMemory(key) {
    if (!this.memoryCache.has(key)) return null;
    
    const timestamp = this.memoryCacheTimestamps.get(key);
    const now = Date.now();
    
    if (now - timestamp > this.config.memory.ttl * 1000) {
      this.memoryCache.delete(key);
      this.memoryCacheTimestamps.delete(key);
      return null;
    }
    
    return this.memoryCache.get(key);
  }

  /**
   * Set in memory cache
   */
  setInMemory(key, value) {
    // Remove oldest items if cache is full
    if (this.memoryCache.size >= this.config.memory.maxItems) {
      const oldestKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(oldestKey);
      this.memoryCacheTimestamps.delete(oldestKey);
    }
    
    this.memoryCache.set(key, value);
    this.memoryCacheTimestamps.set(key, Date.now());
  }

  /**
   * Get from Redis cache
   */
  async getFromRedis(key) {
    try {
      const value = await this.redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  }

  /**
   * Set in Redis cache
   */
  async setInRedis(key, value, ttl) {
    try {
      const serialized = JSON.stringify(value);
      await this.redisClient.setEx(key, ttl, serialized);
    } catch (error) {
      logger.error('Redis set error:', error);
    }
  }

  /**
   * Get from file system cache
   */
  async getFromFileSystem(key) {
    try {
      const filePath = this.getFilePath(key);
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      
      // Check if expired
      const now = Date.now();
      if (now - parsed.timestamp > parsed.ttl) {
        await fs.unlink(filePath).catch(() => {});
        return null;
      }
      
      return parsed.data;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error('File system cache get error:', error);
      }
      return null;
    }
  }

  /**
   * Set in file system cache
   */
  async setInFileSystem(key, value) {
    try {
      const filePath = this.getFilePath(key);
      await fs.writeFile(filePath, value, 'utf-8');
    } catch (error) {
      logger.error('File system cache set error:', error);
    }
  }

  /**
   * Generate cache key
   */
  generateCacheKey(key) {
    const prefix = this.config.redis.keyPrefix;
    const hashedKey = this.hashString(key);
    return `${prefix}${hashedKey}`;
  }

  /**
   * Hash string for consistent key generation
   */
  hashString(str) {
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
  }

  /**
   * Get file path for cache key
   */
  getFilePath(key) {
    const filename = key.replace(/[^a-zA-Z0-9]/g, '_') + '.json';
    return path.join(this.config.fileSystem.cacheDir, filename);
  }

  /**
   * Cleanup expired cache entries
   */
  async cleanup() {
    try {
      logger.debug('Starting cache cleanup');

      // Cleanup memory cache
      const now = Date.now();
      const memoryTTL = this.config.memory.ttl * 1000;
      
      for (const [key, timestamp] of this.memoryCacheTimestamps.entries()) {
        if (now - timestamp > memoryTTL) {
          this.memoryCache.delete(key);
          this.memoryCacheTimestamps.delete(key);
        }
      }

      // Cleanup file system cache
      if (this.config.fileSystem.enabled) {
        const files = await fs.readdir(this.config.fileSystem.cacheDir);
        let totalSize = 0;
        const fileStats = [];

        for (const file of files) {
          const filePath = path.join(this.config.fileSystem.cacheDir, file);
          const stat = await fs.stat(filePath);
          totalSize += stat.size;
          
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = JSON.parse(content);
            
            fileStats.push({
              path: filePath,
              size: stat.size,
              timestamp: parsed.timestamp,
              ttl: parsed.ttl,
              expired: now - parsed.timestamp > parsed.ttl
            });
          } catch (error) {
            // Invalid cache file, mark for deletion
            fileStats.push({ path: filePath, expired: true });
          }
        }

        // Delete expired files
        const expiredFiles = fileStats.filter(f => f.expired);
        for (const file of expiredFiles) {
          await fs.unlink(file.path).catch(() => {});
          totalSize -= file.size || 0;
        }

        // If still over size limit, delete oldest files
        if (totalSize > this.config.fileSystem.maxSize) {
          const validFiles = fileStats
            .filter(f => !f.expired)
            .sort((a, b) => a.timestamp - b.timestamp);
          
          while (totalSize > this.config.fileSystem.maxSize && validFiles.length > 0) {
            const oldest = validFiles.shift();
            await fs.unlink(oldest.path).catch(() => {});
            totalSize -= oldest.size;
          }
        }
      }

      logger.debug('Cache cleanup completed');
    } catch (error) {
      logger.error('Cache cleanup error:', error);
    }
  }

  /**
   * Shutdown caching service
   */
  async shutdown() {
    try {
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
      }

      if (this.redisClient) {
        await this.redisClient.quit();
      }

      logger.info('Caching service shut down');
    } catch (error) {
      logger.error('Cache shutdown error:', error);
    }
  }
}

module.exports = CachingService;