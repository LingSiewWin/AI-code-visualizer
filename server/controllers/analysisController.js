const codeAnalysisService = require('../services/codeAnalysisService');
const openaiService = require('../services/openaiService');
const cachingService = require('../services/cachingService');
const logger = require('../utils/logger');

/**
 * Controller for handling code analysis operations
 */
class AnalysisController {
  /**
   * Analyze repository structure and generate insights
   */
  async analyzeRepository(req, res) {
    try {
      const { repositoryUrl, owner, repo, analysisType = 'full' } = req.body;

      // Validate required parameters
      if (!repositoryUrl && (!owner || !repo)) {
        return res.status(400).json({
          error: 'Repository URL or owner/repo combination is required'
        });
      }

      // Generate cache key
      const cacheKey = `analysis:${owner}:${repo}:${analysisType}`;
      
      // Check cache first
      const cachedResult = await cachingService.get(cacheKey);
      if (cachedResult) {
        logger.info(`Returning cached analysis for ${owner}/${repo}`);
        return res.json({
          success: true,
          data: cachedResult,
          cached: true
        });
      }

      logger.info(`Starting analysis for repository: ${owner}/${repo}`);

      // Perform code analysis
      const analysisResult = await codeAnalysisService.analyzeRepository({
        owner,
        repo,
        analysisType
      });

      // Generate AI insights if requested
      if (analysisType === 'full' || analysisType === 'insights') {
        logger.info('Generating AI insights...');
        const aiInsights = await openaiService.generateInsights(analysisResult);
        analysisResult.aiInsights = aiInsights;
      }

      // Cache the result
      await cachingService.set(cacheKey, analysisResult, 3600); // Cache for 1 hour

      logger.info(`Analysis completed for ${owner}/${repo}`);

      res.json({
        success: true,
        data: analysisResult,
        cached: false
      });

    } catch (error) {
      logger.error('Error in analyzeRepository:', error);
      
      if (error.message.includes('Repository not found')) {
        return res.status(404).json({
          error: 'Repository not found or not accessible'
        });
      }

      if (error.message.includes('Rate limit')) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Please try again later.'
        });
      }

      res.status(500).json({
        error: 'Internal server error during analysis',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get analysis status for a repository
   */
  async getAnalysisStatus(req, res) {
    try {
      const { owner, repo } = req.params;
      
      const cacheKey = `analysis:${owner}:${repo}:full`;
      const cachedResult = await cachingService.get(cacheKey);
      
      res.json({
        success: true,
        data: {
          owner,
          repo,
          hasAnalysis: !!cachedResult,
          lastAnalyzed: cachedResult?.metadata?.analyzedAt || null
        }
      });

    } catch (error) {
      logger.error('Error in getAnalysisStatus:', error);
      res.status(500).json({
        error: 'Failed to get analysis status'
      });
    }
  }

  /**
   * Analyze specific file or directory
   */
  async analyzeFile(req, res) {
    try {
      const { owner, repo, path } = req.params;
      const { includeAI = false } = req.query;

      logger.info(`Analyzing file: ${owner}/${repo}/${path}`);

      const fileAnalysis = await codeAnalysisService.analyzeFile({
        owner,
        repo,
        path
      });

      if (includeAI === 'true') {
        const aiInsights = await openaiService.analyzeFile(fileAnalysis);
        fileAnalysis.aiInsights = aiInsights;
      }

      res.json({
        success: true,
        data: fileAnalysis
      });

    } catch (error) {
      logger.error('Error in analyzeFile:', error);
      
      if (error.message.includes('File not found')) {
        return res.status(404).json({
          error: 'File not found'
        });
      }

      res.status(500).json({
        error: 'Failed to analyze file'
      });
    }
  }

  /**
   * Get complexity metrics for repository
   */
  async getComplexityMetrics(req, res) {
    try {
      const { owner, repo } = req.params;
      const { fileTypes = 'all' } = req.query;

      const cacheKey = `complexity:${owner}:${repo}:${fileTypes}`;
      const cachedResult = await cachingService.get(cacheKey);

      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult,
          cached: true
        });
      }

      const complexityMetrics = await codeAnalysisService.getComplexityMetrics({
        owner,
        repo,
        fileTypes: fileTypes === 'all' ? null : fileTypes.split(',')
      });

      await cachingService.set(cacheKey, complexityMetrics, 1800); // Cache for 30 minutes

      res.json({
        success: true,
        data: complexityMetrics,
        cached: false
      });

    } catch (error) {
      logger.error('Error in getComplexityMetrics:', error);
      res.status(500).json({
        error: 'Failed to get complexity metrics'
      });
    }
  }

  /**
   * Get dependency analysis
   */
  async getDependencyAnalysis(req, res) {
    try {
      const { owner, repo } = req.params;
      const { includeDevDeps = false } = req.query;

      const cacheKey = `dependencies:${owner}:${repo}:${includeDevDeps}`;
      const cachedResult = await cachingService.get(cacheKey);

      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult,
          cached: true
        });
      }

      const dependencyAnalysis = await codeAnalysisService.getDependencyAnalysis({
        owner,
        repo,
        includeDevDependencies: includeDevDeps === 'true'
      });

      await cachingService.set(cacheKey, dependencyAnalysis, 3600); // Cache for 1 hour

      res.json({
        success: true,
        data: dependencyAnalysis,
        cached: false
      });

    } catch (error) {
      logger.error('Error in getDependencyAnalysis:', error);
      res.status(500).json({
        error: 'Failed to get dependency analysis'
      });
    }
  }

  /**
   * Generate visualization data
   */
  async getVisualizationData(req, res) {
    try {
      const { owner, repo } = req.params;
      const { type = 'tree' } = req.query; // tree, graph, hierarchy

      const cacheKey = `visualization:${owner}:${repo}:${type}`;
      const cachedResult = await cachingService.get(cacheKey);

      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult,
          cached: true
        });
      }

      const visualizationData = await codeAnalysisService.getVisualizationData({
        owner,
        repo,
        type
      });

      await cachingService.set(cacheKey, visualizationData, 1800); // Cache for 30 minutes

      res.json({
        success: true,
        data: visualizationData,
        cached: false
      });

    } catch (error) {
      logger.error('Error in getVisualizationData:', error);
      res.status(500).json({
        error: 'Failed to generate visualization data'
      });
    }
  }

  /**
   * Clear analysis cache for a repository
   */
  async clearCache(req, res) {
    try {
      const { owner, repo } = req.params;

      const cacheKeys = [
        `analysis:${owner}:${repo}:*`,
        `complexity:${owner}:${repo}:*`,
        `dependencies:${owner}:${repo}:*`,
        `visualization:${owner}:${repo}:*`
      ];

      await Promise.all(cacheKeys.map(key => cachingService.deletePattern(key)));

      logger.info(`Cache cleared for repository: ${owner}/${repo}`);

      res.json({
        success: true,
        message: 'Cache cleared successfully'
      });

    } catch (error) {
      logger.error('Error in clearCache:', error);
      res.status(500).json({
        error: 'Failed to clear cache'
      });
    }
  }
}

module.exports = new AnalysisController();