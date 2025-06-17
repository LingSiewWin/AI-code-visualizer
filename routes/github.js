const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');
const auth = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');
const { validateGitHubUrl, validateRepositoryParams } = require('../utils/validators');

// Apply rate limiting to GitHub API routes
router.use(rateLimiter.github);

/**
 * POST /api/github/auth
 * Authenticate with GitHub using OAuth
 */
router.post('/auth', async (req, res, next) => {
  try {
    const { code, state } = req.body;
    
    const authResult = await githubController.authenticate({
      code,
      state,
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET
    });

    res.json({
      success: true,
      data: authResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/github/repositories
 * Get user's repositories from GitHub
 */
router.get('/repositories', auth.optional, async (req, res, next) => {
  try {
    const { 
      page = 1, 
      per_page = 30, 
      sort = 'updated', 
      direction = 'desc',
      type = 'all',
      language = ''
    } = req.query;
    
    const repositories = await githubController.getUserRepositories({
      accessToken: req.user?.githubToken,
      page: parseInt(page),
      per_page: parseInt(per_page),
      sort,
      direction,
      type,
      language
    });

    res.json({
      success: true,
      data: repositories,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/github/repository/:owner/:repo
 * Get detailed information about a specific repository
 */
router.get('/repository/:owner/:repo', validateRepositoryParams, async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const { include_stats = false } = req.query;
    
    const repositoryData = await githubController.getRepository({
      owner,
      repo,
      accessToken: req.user?.githubToken,
      includeStats: include_stats === 'true'
    });

    res.json({
      success: true,
      data: repositoryData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/github/repository/:owner/:repo/tree
 * Get repository file tree structure
 */
router.get('/repository/:owner/:repo/tree', validateRepositoryParams, async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const { 
      sha = 'main', 
      recursive = false, 
      max_depth = 5,
      include_content = false 
    } = req.query;
    
    const fileTree = await githubController.getRepositoryTree({
      owner,
      repo,
      sha,
      recursive: recursive === 'true',
      maxDepth: parseInt(max_depth),
      includeContent: include_content === 'true',
      accessToken: req.user?.githubToken
    });

    res.json({
      success: true,
      data: fileTree,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/github/repository/:owner/:repo/contents/*
 * Get contents of a specific file or directory
 */
router.get('/repository/:owner/:repo/contents/*', validateRepositoryParams, async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const path = req.params[0] || '';
    const { ref = 'main', raw = false } = req.query;
    
    const contents = await githubController.getFileContents({
      owner,
      repo,
      path,
      ref,
      raw: raw === 'true',
      accessToken: req.user?.githubToken
    });

    res.json({
      success: true,
      data: contents,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/github/repository/:owner/:repo/commits
 * Get commit history for a repository
 */
router.get('/repository/:owner/:repo/commits', validateRepositoryParams, async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const { 
      sha = 'main', 
      per_page = 30, 
      page = 1,
      since = '',
      until = '',
      path = '',
      author = ''
    } = req.query;
    
    const commits = await githubController.getCommits({
      owner,
      repo,
      sha,
      per_page: parseInt(per_page),
      page: parseInt(page),
      since,
      until,
      path,
      author,
      accessToken: req.user?.githubToken
    });

    res.json({
      success: true,
      data: commits,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/github/repository/:owner/:repo/branches
 * Get all branches for a repository
 */
router.get('/repository/:owner/:repo/branches', validateRepositoryParams, async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const { per_page = 30, page = 1 } = req.query;
    
    const branches = await githubController.getBranches({
      owner,
      repo,
      per_page: parseInt(per_page),
      page: parseInt(page),
      accessToken: req.user?.githubToken
    });

    res.json({
      success: true,
      data: branches,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/github/repository/:owner/:repo/languages
 * Get programming languages used in a repository
 */
router.get('/repository/:owner/:repo/languages', validateRepositoryParams, async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    
    const languages = await githubController.getLanguages({
      owner,
      repo,
      accessToken: req.user?.githubToken
    });

    res.json({
      success: true,
      data: languages,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/github/repository/:owner/:repo/contributors
 * Get repository contributors
 */
router.get('/repository/:owner/:repo/contributors', validateRepositoryParams, async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const { per_page = 30, page = 1, anon = false } = req.query;
    
    const contributors = await githubController.getContributors({
      owner,
      repo,
      per_page: parseInt(per_page),
      page: parseInt(page),
      anon: anon === 'true',
      accessToken: req.user?.githubToken
    });

    res.json({
      success: true,
      data: contributors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/github/repository/:owner/:repo/stats
 * Get repository statistics
 */
router.get('/repository/:owner/:repo/stats', validateRepositoryParams, async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const { type = 'all' } = req.query;
    
    const stats = await githubController.getRepositoryStats({
      owner,
      repo,
      type,
      accessToken: req.user?.githubToken
    });

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/github/validate
 * Validate GitHub repository URL and check accessibility
 */
router.post('/validate', validateGitHubUrl, async (req, res, next) => {
  try {
    const { repositoryUrl } = req.body;
    
    const validation = await githubController.validateRepository({
      repositoryUrl,
      accessToken: req.user?.githubToken
    });

    res.json({
      success: true,
      data: validation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/github/search/repositories
 * Search for repositories on GitHub
 */
router.get('/search/repositories', async (req, res, next) => {
  try {
    const { 
      q, 
      sort = 'stars', 
      order = 'desc', 
      per_page = 30, 
      page = 1,
      language = '',
      size = '',
      stars = '',
      created = '',
      pushed = ''
    } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const searchResults = await githubController.searchRepositories({
      q,
      sort,
      order,
      per_page: parseInt(per_page),
      page: parseInt(page),
      language,
      size,
      stars,
      created,
      pushed,
      accessToken: req.user?.githubToken
    });

    res.json({
      success: true,
      data: searchResults,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/github/rate-limit
 * Get current GitHub API rate limit status
 */
router.get('/rate-limit', async (req, res, next) => {
  try {
    const rateLimitStatus = await githubController.getRateLimit({
      accessToken: req.user?.githubToken
    });

    res.json({
      success: true,
      data: rateLimitStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;