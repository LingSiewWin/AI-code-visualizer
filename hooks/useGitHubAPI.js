import { useState, useEffect, useCallback, useRef } from 'react';
import { githubAPI } from '../services/githubAPI';

export const useGitHubAPI = (config = {}) => {
  const [state, setState] = useState({
    isAuthenticated: false,
    user: null,
    rateLimits: {
      core: { limit: 60, remaining: 60, reset: null },
      search: { limit: 10, remaining: 10, reset: null },
      graphql: { limit: 5000, remaining: 5000, reset: null }
    },
    loading: false,
    error: null,
    lastRequest: null
  });

  const [requestQueue, setRequestQueue] = useState([]);
  const [cache, setCache] = useState(new Map());
  const abortControllerRef = useRef(null);
  const rateLimitTimerRef = useRef(null);

  const {
    enableCaching = true,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
    maxRetries = 3,
    retryDelay = 1000,
    enableRateLimitHandling = true
  } = config;

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Initialize GitHub API with token
  const authenticate = useCallback(async (token) => {
    if (!token) {
      updateState({ 
        isAuthenticated: false, 
        user: null, 
        error: 'No GitHub token provided' 
      });
      return false;
    }

    try {
      updateState({ loading: true, error: null });
      
      githubAPI.setToken(token);
      const user = await githubAPI.getCurrentUser();
      const rateLimits = await githubAPI.getRateLimit();
      
      updateState({
        isAuthenticated: true,
        user,
        rateLimits,
        loading: false,
        error: null
      });
      
      return true;
    } catch (error) {
      console.error('GitHub authentication failed:', error);
      updateState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: error.message || 'Authentication failed'
      });
      return false;
    }
  }, [updateState]);

  // Logout and clear authentication
  const logout = useCallback(() => {
    githubAPI.clearToken();
    setCache(new Map());
    updateState({
      isAuthenticated: false,
      user: null,
      rateLimits: {
        core: { limit: 60, remaining: 60, reset: null },
        search: { limit: 10, remaining: 10, reset: null },
        graphql: { limit: 5000, remaining: 5000, reset: null }
      },
      error: null
    });
  }, [updateState]);

  // Generic request handler with rate limiting and caching
  const makeRequest = useCallback(async (requestFn, cacheKey = null, options = {}) => {
    const { 
      skipCache = false, 
      priority = 'normal',
      retries = maxRetries 
    } = options;

    // Check cache first
    if (enableCaching && cacheKey && !skipCache && cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < cacheTimeout) {
        return cached.data;
      }
    }

    // Check rate limits
    if (enableRateLimitHandling && state.rateLimits.core.remaining <= 1) {
      const resetTime = new Date(state.rateLimits.core.reset * 1000);
      const waitTime = resetTime.getTime() - Date.now();
      
      if (waitTime > 0) {
        throw new Error(`Rate limit exceeded. Resets in ${Math.ceil(waitTime / 1000)} seconds`);
      }
    }

    let attempt = 0;
    let lastError;

    while (attempt < retries) {
      try {
        updateState({ loading: true, error: null });

        // Create abort controller for this request
        abortControllerRef.current = new AbortController();
        
        const result = await requestFn(abortControllerRef.current.signal);
        
        // Update rate limits if provided in response
        if (result.rateLimits) {
          updateState({ rateLimits: result.rateLimits });
        }
        
        // Cache successful result
        if (enableCaching && cacheKey) {
          setCache(prev => new Map(prev.set(cacheKey, {
            data: result.data || result,
            timestamp: Date.now()
          })));
        }
        
        updateState({ 
          loading: false, 
          lastRequest: { 
            timestamp: Date.now(), 
            success: true, 
            cacheKey 
          } 
        });
        
        return result.data || result;

      } catch (error) {
        lastError = error;
        attempt++;
        
        // Handle specific GitHub API errors
        if (error.status === 401) {
          updateState({ 
            isAuthenticated: false, 
            user: null,
            error: 'Authentication expired. Please re-authenticate.' 
          });
          throw error;
        }
        
        if (error.status === 403 && error.message?.includes('rate limit')) {
          if (enableRateLimitHandling) {
            // Wait for rate limit reset
            const resetTime = error.rateLimitReset ? 
              new Date(error.rateLimitReset * 1000) : 
              new Date(Date.now() + 60000);
            const waitTime = resetTime.getTime() - Date.now();
            
            if (waitTime > 0 && waitTime < 300000) { // Don't wait more than 5 minutes
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
          }
          throw error;
        }
        
        // Retry on network errors or 5xx responses
        if (attempt < retries && (
          error.code === 'NETWORK_ERROR' || 
          (error.status >= 500 && error.status < 600)
        )) {
          await new Promise(resolve => 
            setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1))
          );
          continue;
        }
        
        break;
      }
    }

    updateState({ 
      loading: false, 
      error: lastError?.message || 'Request failed',
      lastRequest: { 
        timestamp: Date.now(), 
        success: false, 
        error: lastError?.message 
      }
    });
    
    throw lastError;
  }, [
    enableCaching, 
    cache, 
    cacheTimeout, 
    enableRateLimitHandling, 
    state.rateLimits.core.remaining, 
    state.rateLimits.core.reset,
    maxRetries,
    retryDelay,
    updateState
  ]);

  // Repository operations
  const getRepository = useCallback(async (owner, repo, options = {}) => {
    const cacheKey = `repo:${owner}/${repo}`;
    return makeRequest(
      (signal) => githubAPI.getRepository(`${owner}/${repo}`, { signal }),
      cacheKey,
      options
    );
  }, [makeRequest]);

  const searchRepositories = useCallback(async (query, options = {}) => {
    const { sort = 'stars', order = 'desc', per_page = 30, page = 1 } = options;
    const cacheKey = `search:repos:${query}:${sort}:${order}:${page}`;
    
    return makeRequest(
      (signal) => githubAPI.searchRepositories(query, {
        sort, order, per_page, page, signal
      }),
      enableCaching ? cacheKey : null,
      { ...options, skipCache: !enableCaching }
    );
  }, [makeRequest, enableCaching]);

  const getRepositoryContents = useCallback(async (owner, repo, path = '', options = {}) => {
    const cacheKey = `contents:${owner}/${repo}:${path}`;
    return makeRequest(
      (signal) => githubAPI.getRepositoryContents(owner, repo, path, { signal }),
      cacheKey,
      options
    );
  }, [makeRequest]);

  const getFileContent = useCallback(async (owner, repo, path, options = {}) => {
    const cacheKey = `file:${owner}/${repo}:${path}`;
    return makeRequest(
      (signal) => githubAPI.getFileContent(owner, repo, path, { signal }),
      cacheKey,
      options
    );
  }, [makeRequest]);

  // Repository tree operations
  const getRepositoryTree = useCallback(async (owner, repo, sha = 'HEAD', options = {}) => {
    const { recursive = false } = options;
    const cacheKey = `tree:${owner}/${repo}:${sha}:${recursive}`;
    
    return makeRequest(
      (signal) => githubAPI.getRepositoryTree(owner, repo, sha, { recursive, signal }),
      cacheKey,
      options
    );
  }, [makeRequest]);

  // Commit operations
  const getRepositoryCommits = useCallback(async (owner, repo, options = {}) => {
    const { sha, path, author, since, until, per_page = 30, page = 1 } = options;
    const cacheKey = `commits:${owner}/${repo}:${sha || 'HEAD'}:${page}`;
    
    return makeRequest(
      (signal) => githubAPI.getRepositoryCommits(owner, repo, {
        sha, path, author, since, until, per_page, page, signal
      }),
      cacheKey,
      options
    );
  }, [makeRequest]);

  // Language statistics
  const getRepositoryLanguages = useCallback(async (owner, repo, options = {}) => {
    const cacheKey = `languages:${owner}/${repo}`;
    return makeRequest(
      (signal) => githubAPI.getRepositoryLanguages(owner, repo, { signal }),
      cacheKey,
      options
    );
  }, [makeRequest]);

  // Contributors
  const getRepositoryContributors = useCallback(async (owner, repo, options = {}) => {
    const { anon = false, per_page = 30, page = 1 } = options;
    const cacheKey = `contributors:${owner}/${repo}:${page}`;
    
    return makeRequest(
      (signal) => githubAPI.getRepositoryContributors(owner, repo, {
        anon, per_page, page, signal
      }),
      cacheKey,
      options
    );
  }, [makeRequest]);

  // User operations
  const getUser = useCallback(async (username, options = {}) => {
    const cacheKey = `user:${username}`;
    return makeRequest(
      (signal) => githubAPI.getUser(username, { signal }),
      cacheKey,
      options
    );
  }, [makeRequest]);

  const getUserRepositories = useCallback(async (username, options = {}) => {
    const { type = 'all', sort = 'updated', direction = 'desc', per_page = 30, page = 1 } = options;
    const cacheKey = `user_repos:${username}:${type}:${sort}:${page}`;
    
    return makeRequest(
      (signal) => githubAPI.getUserRepositories(username, {
        type, sort, direction, per_page, page, signal
      }),
      cacheKey,
      options
    );
  }, [makeRequest]);

  // Rate limit operations
  const checkRateLimit = useCallback(async () => {
    try {
      const rateLimits = await githubAPI.getRateLimit();
      updateState({ rateLimits });
      return rateLimits;
    } catch (error) {
      console.error('Failed to check rate limit:', error);
      return state.rateLimits;
    }
  }, [updateState, state.rateLimits]);

  // Cancel all pending requests
  const cancelRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    updateState({ loading: false });
  }, [updateState]);

  // Clear cache
  const clearCache = useCallback((pattern = null) => {
    if (!pattern) {
      setCache(new Map());
    } else {
      setCache(prev => {
        const newCache = new Map();
        for (const [key, value] of prev) {
          if (!key.includes(pattern)) {
            newCache.set(key, value);
          }
        }
        return newCache;
      });
    }
  }, []);

  // Parse GitHub URL
  const parseGitHubUrl = useCallback((url) => {
    return githubAPI.parseRepositoryUrl(url);
  }, []);

  // Batch operations
  const batchRequests = useCallback(async (requests, options = {}) => {
    const { concurrency = 3, failFast = false } = options;
    const results = [];
    const errors = [];

    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (request, index) => {
        try {
          const result = await request();
          return { success: true, data: result, index: i + index };
        } catch (error) {
          const errorResult = { success: false, error, index: i + index };
          if (failFast) throw errorResult;
          return errorResult;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        if (result.success) {
          results[result.index] = result.data;
        } else {
          errors[result.index] = result.error;
        }
      });
    }

    return { results, errors, hasErrors: errors.length > 0 };
  }, []);

  // Auto-refresh rate limits
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const refreshRateLimits = () => {
      checkRateLimit().catch(console.error);
    };

    // Check rate limits every 5 minutes
    rateLimitTimerRef.current = setInterval(refreshRateLimits, 5 * 60 * 1000);

    return () => {
      if (rateLimitTimerRef.current) {
        clearInterval(rateLimitTimerRef.current);
      }
    };
  }, [state.isAuthenticated, checkRateLimit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRequests();
      if (rateLimitTimerRef.current) {
        clearInterval(rateLimitTimerRef.current);
      }
    };
  }, [cancelRequests]);

  // Cache cleanup
  useEffect(() => {
    const cleanupCache = () => {
      const now = Date.now();
      setCache(prev => {
        const newCache = new Map();
        for (const [key, value] of prev) {
          if (now - value.timestamp < cacheTimeout) {
            newCache.set(key, value);
          }
        }
        return newCache;
      });
    };

    const cleanupInterval = setInterval(cleanupCache, cacheTimeout);
    return () => clearInterval(cleanupInterval);
  }, [cacheTimeout]);

  return {
    // State
    ...state,
    
    // Authentication
    authenticate,
    logout,
    
    // Repository operations
    getRepository,
    searchRepositories,
    getRepositoryContents,
    getFileContent,
    getRepositoryTree,
    getRepositoryCommits,
    getRepositoryLanguages,
    getRepositoryContributors,
    
    // User operations
    getUser,
    getUserRepositories,
    
    // Utility operations
    checkRateLimit,
    cancelRequests,
    clearCache,
    parseGitHubUrl,
    batchRequests,
    
    // Computed values
    canMakeRequest: state.rateLimits.core.remaining > 0,
    rateLimitStatus: {
      core: `${state.rateLimits.core.remaining}/${state.rateLimits.core.limit}`,
      search: `${state.rateLimits.search.remaining}/${state.rateLimits.search.limit}`,
      graphql: `${state.rateLimits.graphql.remaining}/${state.rateLimits.graphql.limit}`
    },
    cacheSize: cache.size,
    
    // Status flags
    hasValidToken: state.isAuthenticated && state.user,
    isRateLimited: state.rateLimits.core.remaining <= 0,
    hasError: !!state.error
  };
};