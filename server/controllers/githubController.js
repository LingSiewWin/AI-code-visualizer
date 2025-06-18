const githubService = require('../services/githubService');
const cachingService = require('../services/cachingService');
const logger = require('../utils/logger');

/**
 * Controller for handling GitHub API operations
 */
class GitHubController {
  /**
   * Get repository information
   */
  async getRepository(req, res) {
    try {
      const { owner, repo } = req.params;

      const cacheKey = `repo:${owner}:${repo}`;
      const cachedResult = await cachingService.get(cacheKey);

      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult,
          cached: true
        });
      }

      const repository = await githubService.getRepository(owner, repo);

      // Cache for 10 minutes
      await cachingService.set(cacheKey, repository, 600);

      res.json({
        success: true,
        data: repository,
        cached: false
      });

    } catch (error) {
      logger.error('Error in getRepository:', error);
      
      if (error.status === 404) {
        return res.status(404).json({
          error: 'Repository not found'
        });
      }

      if (error.status === 403) {
        return res.status(403).json({
          error: 'Access forbidden. Repository may be private or rate limit exceeded.'
        });
      }

      res.status(500).json({
        error: 'Failed to fetch repository information'
      });
    }
  }

  /**
   * Get repository contents (files and directories)
   */
  async getContents(req, res) {
    try {
      const { owner, repo } = req.params;
      const { path = '', recursive = false } = req.query;

      const cacheKey = `contents:${owner}:${repo}:${path}:${recursive}`;
      const cachedResult = await cachingService.get(cacheKey);

      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult,
          cached: true
        });
      }

      const contents = await githubService.getContents(owner, repo, path, recursive === 'true');

      // Cache for 5 minutes
      await cachingService.set(cacheKey, contents, 300);

      res.json({
        success: true,
        data: contents,
        cached: false
      });

    } catch (error) {
      logger.error('Error in getContents:', error);
      
      if (error.status === 404) {
        return res.status(404).json({
          error: 'Path not found in repository'
        });
      }

      res.status(500).json({
        error: 'Failed to fetch repository contents'
      });
    }
  }

  /**
   * Get file content
   */
  async getFileContent(req, res) {
    try {
      const { owner, repo } = req.params;
      const { path } = req.query;

      if (!path) {
        return res.status(400).json({
          error: 'File path is required'
        });
      }

      const cacheKey = `file:${owner}:${repo}:${path}`;
      const cachedResult = await cachingService.get(cacheKey);

      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult,
          cached: true
        });
      }

      const fileContent = await githubService.getFileContent(owner, repo, path);

      // Cache for 15 minutes
      await cachingService.set(cacheKey, fileContent, 900);

      res.json({
        success: true,
        data: fileContent,
        cached: false
      });

    } catch (error) {
      logger.error('Error in getFileContent:', error);
      
      if (error.status === 404) {
        return res.status(404).json({
          error: 'File not found'
        });
      }

      res.status(500).json({
        error: 'Failed to fetch file content'
      });
    }
  }

  /**
   * Get repository tree structure
   */
  async getTree(req, res) {
    try {
      const { owner, repo } = req.params;
      const { sha = 'main', recursive = true } = req.query;

      const cacheKey = `tree:${owner}:${repo}:${sha}:${recursive}`;
      const cachedResult = await cachingService.get(cacheKey);

      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult,
          cached: true
        });
      }

      const tree = await githubService.getTree(owner, repo, sha, recursive === 'true');

      // Cache for 10 minutes
      await cachingService.set(cacheKey, tree, 600);

      res.json({
        success: true,
        data: tree,
        cached: false
      });

    } catch (error) {
      logger.error('Error in getTree:', error);
      
      if (error.status === 404) {
        return res.status(404).json({
          error: 'Tree not found. Check if repository exists and SHA is valid.'
        });
      }

      res.status(500).json({
        error: 'Failed to fetch repository tree'
      });
    }
  }

  /**
   * Get repository commits
   */
  async getCommits(req, res) {
    try {
      const { owner, repo } = req.params;
      const { 
        sha = 'main', 
        path = '', 
        per_page = 30, 
        page = 1 
      } = req.query;

      const cacheKey = `commits:${owner}:${repo}:${sha}:${path}:${per_page}:${page}`;
      const cachedResult = await cachingService.get(cacheKey);

      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult,
          cached: true
        });
      }

      const commits = await githubService.getCommits(owner, repo, {
        sha,
        path,
        per_page: parseInt(per_page),
        page: parseInt(page)
      });

      // Cache for 5 minutes
      await cachingService.set(cacheKey, commits, 300);

      res.json({
        success: true,
        data: commits,
        cached: false
      });

    } catch (error) {
      logger.error('Error in getCommits:', error);
      res.status(500).json({
        error: 'Failed to fetch repository commits'
      });
    }
  }

  /**
   * Get repository branches
   */
  async getBranches(req, res) {
    try {
      const { owner, repo } = req.params;

      const cacheKey = `branches:${owner}:${repo}`;
      const cachedResult = await cachingService.get(cacheKey);

      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult,
          cached: true
        });
      }

      const branches = await githubService.getBranches(owner, repo);

      // Cache for 10 minutes
      await cachingService.set(cacheKey, branches, 600);

      res.json({
        success: true,
        data: branches,
        cached: false
      });

    } catch (error) {
      logger.error('Error in getBranches:', error);
      res.status(500).json({
        error: 'Failed to fetch repository branches'
      });
    }
  }

  /**
   * Get repository languages
   */
  async getLanguages(req, res) {
    try {
      const { owner, repo } = req.params;

      const cacheKey = `languages:${owner}:${repo}`;
      const cachedResult = await cachingService.get(cacheKey);

      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult,
          cached: true
        });
      }

      const languages = await githubService.getLanguages(owner, repo);

      // Cache for 30 minutes
      await cachingService.set(cacheKey, languages, 1800);

      res.json({
        success: true,
        data: languages,
        cached: false
      });

    } catch (error) {
      logger.error('Error in getLanguages:', error);
      res.status(500).json({
        error: 'Failed to fetch repository languages'
      });
    }
  }

  /**
   * Get repository contributors
   */
  async getContributors(req, res) {
    try {
      const { owner, repo } = req.params;
      const { per_page = 30, page = 1 } = req.query;

      const cacheKey = `contributors:${owner}:${repo}:${per_page}:${page}`;
      const cachedResult = await cachingService.get(cacheKey);

      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult,
          cached: true
        });
      }

      const contributors = await githubService.getContributors(owner, repo, {
        per_page: parseInt(per_page),
        page: parseInt(page)
      });

      // Cache for 20 minutes
      await cachingService.set(cacheKey, contributors, 1200);

      res.json({
        success: true,
        data: contributors,
        cached: false
      });

    } catch (error) {
      logger.error('Error in getContributors:', error);
      res.status(500).json({
        error: 'Failed to fetch repository contributors'
      });
    }
  }

  /**
   * Search repositories
   */
  async searchRepositories(req, res) {
    try {
      const { q, sort = 'stars', order = 'desc', per_page = 30, page = 1 } = req.query;

      if (!q) {
        return res.status(400).json({
          error: 'Search query (q) is required'
        });
      }

      const cacheKey = `search:repos:${q}:${sort}:${order}:${per_page}:${page}`;
      const cachedResult = await cachingService.get(cacheKey);

      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult,
          cached: true
        });
      }

      const searchResults = await githubService.searchRepositories({
        q,
        sort,
        order,
        per_page: parseInt(per_page),
        page: parseInt(page)
      });

      // Cache for 5 minutes
      await cachingService.set(cacheKey, searchResults, 300);

      res.json({
        success: true,
        data: searchResults,
        cached: false
      });

    } catch (error) {
      logger.error('Error in searchRepositories:', error);
      res.status(500).json({
        error: 'Failed to search repositories'
      });
    }
  }

  /**
   * Get repository statistics
   */
  async getRepositoryStats(req, res) {
    try {
      const { owner, repo } = req.params;

      const cacheKey = `stats:${owner}:${repo}`;
      const cachedResult = await cachingService.get(cacheKey);

      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult,
          cached: true
        });
      }

      const stats = await githubService.getRepositoryStats(owner, repo);

      // Cache for 15 minutes
      await cachingService.set(cacheKey, stats, 900);

      res.json({
        success: true,
        data: stats,
        cached: false
      });

    } catch (error) {
      logger.error('Error in getRepositoryStats:', error);
      res.status(500).json({
        error: 'Failed to fetch repository statistics'
      });
    }
  }

  /**
   * Get rate limit status
   */
  async getRateLimit(req, res) {
    try {
      const rateLimitInfo = await githubService.getRateLimit();

      res.json({
        success: true,
        data: rateLimitInfo
      });

    } catch (error) {
      logger.error('Error in getRateLimit:', error);
      res.status(500).json({
        error: 'Failed to fetch rate limit information'
      });
    }
  }

  /**
   * Validate repository URL and extract owner/repo
   */
  async validateRepository(req, res) {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({
          error: 'Repository URL is required'
        });
      }

      const validation = githubService.parseRepositoryUrl(url);

      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Invalid GitHub repository URL',
          details: validation.error
        });
      }

      // Check if repository exists
      try {
        await githubService.getRepository(validation.owner, validation.repo);
        validation.exists = true;
      } catch (error) {
        validation.exists = false;
        validation.error = error.status === 404 ? 'Repository not found' : 'Repository not accessible';
      }

      res.json({
        success: true,
        data: validation
      });

    } catch (error) {
      logger.error('Error in validateRepository:', error);
      res.status(500).json({
        error: 'Failed to validate repository'
      });
    }
  }
}

module.exports = new GitHubController();