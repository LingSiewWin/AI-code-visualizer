const { Octokit } = require('@octokit/rest');
const logger = require('../utils/logger');

class GitHubService {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
      userAgent: 'AI-Code-Visualizer v1.0.0'
    });
    
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get repository information
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Object>} Repository data
   */
  async getRepository(owner, repo) {
    const cacheKey = `repo:${owner}/${repo}`;
    
    try {
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          logger.info(`Repository data served from cache: ${owner}/${repo}`);
          return cached.data;
        }
      }

      const { data } = await this.octokit.rest.repos.get({
        owner,
        repo
      });

      const repoData = {
        success: true,
        data: {
          id: data.id,
          name: data.name,
          fullName: data.full_name,
          description: data.description,
          language: data.language,
          stars: data.stargazers_count,
          forks: data.forks_count,
          watchers: data.watchers_count,
          size: data.size,
          defaultBranch: data.default_branch,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          pushedAt: data.pushed_at,
          url: data.html_url,
          cloneUrl: data.clone_url,
          isPrivate: data.private,
          isFork: data.fork,
          hasIssues: data.has_issues,
          hasWiki: data.has_wiki,
          openIssues: data.open_issues_count,
          license: data.license?.name || null,
          topics: data.topics || []
        }
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: repoData,
        timestamp: Date.now()
      });

      logger.info(`Repository data fetched: ${owner}/${repo}`);
      return repoData;

    } catch (error) {
      logger.error(`Failed to fetch repository ${owner}/${repo}:`, error);
      
      if (error.status === 404) {
        return {
          success: false,
          error: 'Repository not found',
          code: 'REPO_NOT_FOUND'
        };
      } else if (error.status === 403) {
        return {
          success: false,
          error: 'Access denied or rate limit exceeded',
          code: 'ACCESS_DENIED'
        };
      }
      
      return {
        success: false,
        error: 'Failed to fetch repository data',
        details: error.message
      };
    }
  }

  /**
   * Get repository file tree
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} branch - Branch name (optional)
   * @returns {Promise<Object>} File tree data
   */
  async getRepositoryTree(owner, repo, branch = 'main') {
    const cacheKey = `tree:${owner}/${repo}:${branch}`;
    
    try {
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      // Get the repository to find default branch if 'main' doesn't exist
      const repoInfo = await this.getRepository(owner, repo);
      if (!repoInfo.success) {
        return repoInfo;
      }

      const targetBranch = branch === 'main' ? repoInfo.data.defaultBranch : branch;

      const { data } = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: targetBranch,
        recursive: 1
      });

      const processedTree = this.processGitTree(data.tree);

      const result = {
        success: true,
        data: {
          sha: data.sha,
          truncated: data.truncated,
          tree: processedTree,
          totalFiles: data.tree.length,
          branch: targetBranch
        }
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      logger.info(`Repository tree fetched: ${owner}/${repo}:${targetBranch}`);
      return result;

    } catch (error) {
      logger.error(`Failed to fetch repository tree ${owner}/${repo}:`, error);
      return {
        success: false,
        error: 'Failed to fetch repository tree',
        details: error.message
      };
    }
  }

  /**
   * Get file content
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} path - File path
   * @param {string} branch - Branch name (optional)
   * @returns {Promise<Object>} File content
   */
  async getFileContent(owner, repo, path, branch = 'main') {
    const cacheKey = `file:${owner}/${repo}:${path}:${branch}`;
    
    try {
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: branch
      });

      if (data.type !== 'file') {
        return {
          success: false,
          error: 'Path is not a file'
        };
      }

      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      
      const result = {
        success: true,
        data: {
          name: data.name,
          path: data.path,
          sha: data.sha,
          size: data.size,
          content: content,
          encoding: data.encoding,
          url: data.html_url,
          downloadUrl: data.download_url
        }
      };

      // Cache smaller files only (< 100KB)
      if (data.size < 100000) {
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      return result;

    } catch (error) {
      logger.error(`Failed to fetch file content ${owner}/${repo}:${path}:`, error);
      return {
        success: false,
        error: 'Failed to fetch file content',
        details: error.message
      };
    }
  }

  /**
   * Get repository languages
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Object>} Languages data
   */
  async getRepositoryLanguages(owner, repo) {
    try {
      const { data } = await this.octokit.rest.repos.listLanguages({
        owner,
        repo
      });

      const total = Object.values(data).reduce((sum, bytes) => sum + bytes, 0);
      const languages = Object.entries(data).map(([name, bytes]) => ({
        name,
        bytes,
        percentage: ((bytes / total) * 100).toFixed(2)
      })).sort((a, b) => b.bytes - a.bytes);

      return {
        success: true,
        data: {
          languages,
          totalBytes: total,
          primaryLanguage: languages[0]?.name || 'Unknown'
        }
      };

    } catch (error) {
      logger.error(`Failed to fetch repository languages ${owner}/${repo}:`, error);
      return {
        success: false,
        error: 'Failed to fetch repository languages',
        details: error.message
      };
    }
  }

  /**
   * Get repository contributors
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Object>} Contributors data
   */
  async getRepositoryContributors(owner, repo) {
    try {
      const { data } = await this.octokit.rest.repos.listContributors({
        owner,
        repo,
        per_page: 100
      });

      const contributors = data.map(contributor => ({
        login: contributor.login,
        id: contributor.id,
        avatar: contributor.avatar_url,
        url: contributor.html_url,
        contributions: contributor.contributions,
        type: contributor.type
      }));

      return {
        success: true,
        data: {
          contributors,
          totalContributors: contributors.length,
          totalContributions: contributors.reduce((sum, c) => sum + c.contributions, 0)
        }
      };

    } catch (error) {
      logger.error(`Failed to fetch contributors ${owner}/${repo}:`, error);
      return {
        success: false,
        error: 'Failed to fetch contributors',
        details: error.message
      };
    }
  }

  /**
   * Get repository commits
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Commits data
   */
  async getRepositoryCommits(owner, repo, options = {}) {
    try {
      const { data } = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: options.perPage || 50,
        page: options.page || 1,
        since: options.since,
        until: options.until,
        path: options.path,
        author: options.author
      });

      const commits = data.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: {
          name: commit.commit.author.name,
          email: commit.commit.author.email,
          date: commit.commit.author.date,
          login: commit.author?.login
        },
        committer: {
          name: commit.commit.committer.name,
          email: commit.commit.committer.email,
          date: commit.commit.committer.date,
          login: commit.committer?.login
        },
        url: commit.html_url,
        stats: commit.stats
      }));

      return {
        success: true,
        data: {
          commits,
          totalCommits: commits.length
        }
      };

    } catch (error) {
      logger.error(`Failed to fetch commits ${owner}/${repo}:`, error);
      return {
        success: false,
        error: 'Failed to fetch commits',
        details: error.message
      };
    }
  }

  /**
   * Search repositories
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchRepositories(query, options = {}) {
    try {
      const { data } = await this.octokit.rest.search.repos({
        q: query,
        sort: options.sort || 'stars',
        order: options.order || 'desc',
        per_page: options.perPage || 30,
        page: options.page || 1
      });

      const repositories = data.items.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        url: repo.html_url,
        updatedAt: repo.updated_at,
        score: repo.score
      }));

      return {
        success: true,
        data: {
          repositories,
          totalCount: data.total_count,
          incompleteResults: data.incomplete_results
        }
      };

    } catch (error) {
      logger.error('Repository search failed:', error);
      return {
        success: false,
        error: 'Repository search failed',
        details: error.message
      };
    }
  }

  /**
   * Process Git tree data into structured format
   * @param {Array} tree - Raw Git tree
   * @returns {Object} Processed tree structure
   */
  processGitTree(tree) {
    const structure = {
      files: [],
      directories: [],
      totalSize: 0,
      fileTypes: {}
    };

    tree.forEach(item => {
      if (item.type === 'blob') {
        const extension = this.getFileExtension(item.path);
        const fileInfo = {
          path: item.path,
          name: item.path.split('/').pop(),
          sha: item.sha,
          size: item.size || 0,
          extension: extension,
          type: this.getFileType(extension),
          url: item.url
        };

        structure.files.push(fileInfo);
        structure.totalSize += item.size || 0;

        // Count file types
        if (!structure.fileTypes[extension]) {
          structure.fileTypes[extension] = { count: 0, size: 0 };
        }
        structure.fileTypes[extension].count++;
        structure.fileTypes[extension].size += item.size || 0;

      } else if (item.type === 'tree') {
        structure.directories.push({
          path: item.path,
          name: item.path.split('/').pop(),
          sha: item.sha,
          url: item.url
        });
      }
    });

    return structure;
  }

  /**
   * Get file extension from path
   * @param {string} path - File path
   * @returns {string} File extension
   */
  getFileExtension(path) {
    const parts = path.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : 'unknown';
  }

  /**
   * Determine file type from extension
   * @param {string} extension - File extension
   * @returns {string} File type category
   */
  getFileType(extension) {
    const typeMap = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      php: 'php',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      swift: 'swift',
      kt: 'kotlin',
      html: 'markup',
      css: 'stylesheet',
      scss: 'stylesheet',
      sass: 'stylesheet',
      json: 'data',
      xml: 'data',
      yml: 'config',
      yaml: 'config',
      md: 'documentation',
      txt: 'text',
      sql: 'database',
      sh: 'script',
      bat: 'script',
      dockerfile: 'config'
    };

    return typeMap[extension] || 'other';
  }

  /**
   * Get rate limit information
   * @returns {Promise<Object>} Rate limit data
   */
  async getRateLimit() {
    try {
      const { data } = await this.octokit.rest.rateLimit.get();
      return {
        success: true,
        data: {
          core: data.rate,
          search: data.resources.search,
          graphql: data.resources.graphql
        }
      };
    } catch (error) {
      logger.error('Failed to fetch rate limit:', error);
      return {
        success: false,
        error: 'Failed to fetch rate limit'
      };
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('GitHub service cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

module.exports = new GitHubService();