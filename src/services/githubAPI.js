/**
 * GitHub API Service
 * Handles all interactions with the GitHub API for repository analysis
 */

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com';

class GitHubAPIService {
  constructor(token = null) {
    this.token = token;
    this.rateLimitRemaining = 5000;
    this.rateLimitReset = null;
  }

  /**
   * Set GitHub personal access token for authenticated requests
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Get request headers with authentication if token is available
   */
  getHeaders() {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'AI-Code-Visualizer/1.0'
    };

    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }

    return headers;
  }

  /**
   * Make authenticated request to GitHub API
   */
  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers
        }
      });

      // Update rate limit info
      this.rateLimitRemaining = parseInt(response.headers.get('X-RateLimit-Remaining')) || 0;
      this.rateLimitReset = parseInt(response.headers.get('X-RateLimit-Reset')) || null;

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `GitHub API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('GitHub API request failed:', error);
      throw error;
    }
  }

  /**
   * Parse repository URL to extract owner and repo name
   */
  parseRepoUrl(url) {
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?(?:\/.*)?$/,
      /^([^\/]+)\/([^\/]+)$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace(/\.git$/, '')
        };
      }
    }

    throw new Error('Invalid GitHub repository URL format');
  }

  /**
   * Get repository information
   */
  async getRepository(repoUrl) {
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}`;
    
    return await this.makeRequest(url);
  }

  /**
   * Get repository tree structure
   */
  async getRepositoryTree(repoUrl, branch = 'main', recursive = true) {
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    
    try {
      // First try with the specified branch
      const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${branch}${recursive ? '?recursive=1' : ''}`;
      return await this.makeRequest(url);
    } catch (error) {
      // If main branch fails, try master
      if (branch === 'main') {
        return this.getRepositoryTree(repoUrl, 'master', recursive);
      }
      throw error;
    }
  }

  /**
   * Get file content from repository
   */
  async getFileContent(repoUrl, filePath, branch = 'main') {
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    
    try {
      // Use raw GitHub content URL for better performance
      const url = `${GITHUB_RAW_BASE}/${owner}/${repo}/${branch}/${filePath}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (branch === 'main') {
          // Try master branch if main fails
          return this.getFileContent(repoUrl, filePath, 'master');
        }
        throw new Error(`Failed to fetch file: ${response.status}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error(`Error fetching file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple files content in batch
   */
  async getBatchFileContent(repoUrl, filePaths, branch = 'main') {
    const results = {};
    const batchSize = 10; // Process files in batches to avoid overwhelming the API
    
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      const promises = batch.map(async (filePath) => {
        try {
          const content = await this.getFileContent(repoUrl, filePath, branch);
          return { filePath, content, success: true };
        } catch (error) {
          console.warn(`Failed to fetch ${filePath}:`, error.message);
          return { filePath, content: null, success: false, error: error.message };
        }
      });
      
      const batchResults = await Promise.all(promises);
      batchResults.forEach(({ filePath, content, success, error }) => {
        results[filePath] = { content, success, error };
      });
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < filePaths.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Get repository languages
   */
  async getRepositoryLanguages(repoUrl) {
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/languages`;
    
    return await this.makeRequest(url);
  }

  /**
   * Get repository contributors
   */
  async getRepositoryContributors(repoUrl) {
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contributors`;
    
    return await this.makeRequest(url);
  }

  /**
   * Get repository commits
   */
  async getRepositoryCommits(repoUrl, options = {}) {
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    const { per_page = 100, since, until, author } = options;
    
    let url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=${per_page}`;
    
    if (since) url += `&since=${since}`;
    if (until) url += `&until=${until}`;
    if (author) url += `&author=${author}`;
    
    return await this.makeRequest(url);
  }

  /**
   * Search for files in repository
   */
  async searchFiles(repoUrl, query, extension = null) {
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    let searchQuery = `repo:${owner}/${repo} ${query}`;
    
    if (extension) {
      searchQuery += ` extension:${extension}`;
    }
    
    const url = `${GITHUB_API_BASE}/search/code?q=${encodeURIComponent(searchQuery)}`;
    
    return await this.makeRequest(url);
  }

  /**
   * Get code analysis friendly file list
   */
  async getAnalysisFiles(repoUrl, extensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs']) {
    const tree = await this.getRepositoryTree(repoUrl);
    
    const codeFiles = tree.tree.filter(item => {
      if (item.type !== 'blob') return false;
      
      // Skip common non-code directories
      const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage', 'vendor'];
      if (skipDirs.some(dir => item.path.includes(dir))) return false;
      
      // Filter by extensions if provided
      if (extensions.length > 0) {
        return extensions.some(ext => item.path.endsWith(ext));
      }
      
      return true;
    });
    
    return codeFiles.slice(0, 50); // Limit to 50 files for performance
  }

  /**
   * Get current rate limit status
   */
  getRateLimitInfo() {
    return {
      remaining: this.rateLimitRemaining,
      resetTime: this.rateLimitReset ? new Date(this.rateLimitReset * 1000) : null
    };
  }

  /**
   * Check if rate limit allows for more requests
   */
  canMakeRequest() {
    return this.rateLimitRemaining > 10; // Keep a buffer
  }

  /**
   * Get comprehensive repository analysis data
   */
  async getRepositoryAnalysisData(repoUrl) {
    try {
      const [repository, languages, contributors] = await Promise.all([
        this.getRepository(repoUrl),
        this.getRepositoryLanguages(repoUrl),
        this.getRepositoryContributors(repoUrl).catch(() => [])
      ]);

      const analysisFiles = await this.getAnalysisFiles(repoUrl);
      
      // Get content for a subset of important files
      const importantFiles = analysisFiles
        .filter(file => {
          const fileName = file.path.toLowerCase();
          return fileName.includes('index') || 
                 fileName.includes('main') || 
                 fileName.includes('app') ||
                 fileName.includes('server') ||
                 fileName.includes('config');
        })
        .slice(0, 10);

      const fileContents = importantFiles.length > 0 
        ? await this.getBatchFileContent(repoUrl, importantFiles.map(f => f.path))
        : {};

      return {
        repository,
        languages,
        contributors,
        files: analysisFiles,
        fileContents,
        rateLimitInfo: this.getRateLimitInfo()
      };
    } catch (error) {
      console.error('Error getting repository analysis data:', error);
      throw error;
    }
  }
}

// Export singleton instance
const githubAPI = new GitHubAPIService();
export default githubAPI;