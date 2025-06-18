const openaiService = require('../services/openaiService');
const codeAnalysisService = require('../services/codeAnalysisService');
const cachingService = require('../services/cachingService');
const logger = require('../utils/logger');

/**
 * Controller for handling AI-powered analysis and insights
 */
class AIController {
  /**
   * Generate comprehensive insights for a repository
   */
  async generateRepositoryInsights(req, res) {
    try {
      const { owner, repo } = req.params;
      const { 
        includeComplexity = true,
        includeDependencies = true,
        includeArchitecture = true,
        includeRecommendations = true,
        language = 'en'
      } = req.body;

      const cacheKey = `ai:insights:${owner}:${repo}:${includeComplexity}:${includeDependencies}:${includeArchitecture}:${includeRecommendations}:${language}`;
      const cachedResult = await cachingService.get(cacheKey);

      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult,
          cached: true
        });
      }

      logger.info(`Generating AI insights for repository: ${owner}/${repo}`);

      // Get repository analysis data
      const analysisData = await codeAnalysisService.analyzeRepository({
        owner,
        repo,
        analysisType: 'full'
      });

      // Generate AI insights
      const insights = await openaiService.generateRepositoryInsights({
        repositoryData: analysisData,
        options: {
          includeComplexity,
          includeDependencies,
          includeArchitecture,
          includeRecommendations,
          language
        }
      });

      // Cache for 2 hours
      await cachingService.set(cacheKey, insights, 7200);

      logger.info(`AI insights generated successfully for ${owner}/${repo}`);

      res.json({
        success: true,
        data: insights,
        cached: false
      });

    } catch (error) {
      logger.error('Error in generateRepositoryInsights:', error);
      
      if (error.message.includes('OpenAI API')) {
        return res.status(503).json({
          error: 'AI service temporarily unavailable'
        });
      }

      if (error.message.includes('Token limit')) {
        return res.status(413).json({
          error: 'Repository too large for AI analysis'
        });
      }

      res.status(500).json({
        error: 'Failed to generate AI insights',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Analyze code quality and provide suggestions
   */
  async analyzeCodeQuality(req, res) {
    try {
      const { owner, repo } = req.params;
      const { filePath, codeSnippet, analysisType = 'quality' } = req.body;

      if (!filePath && !codeSnippet) {
        return res.status(400).json({
          error: 'Either filePath or codeSnippet is required'
        });
      }

      let code = codeSnippet;
      let fileName = 'snippet';

      if (filePath) {
        const fileContent = await codeAnalysisService.analyzeFile({
          owner,
          repo,
          path: filePath
        });
        code = fileContent.content;
        fileName = filePath;
      }

      const cacheKey = `ai:quality:${owner}:${repo}:${fileName}:${analysisType}`;
      const cachedResult = await cachingService.get(cacheKey);

      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult,
          cached: true
        });
      }

      logger.info(`Analyzing code quality for: ${fileName}`);

      const qualityAnalysis = await openaiService.analyzeCodeQuality({
        code,
        fileName,
        analysisType,
        context: {
          repository: `${owner}/${repo}`,
          filePath
        }
      });

      // Cache for 1 hour
      await cachingService.set(cacheKey, qualityAnalysis, 3600);

      res.json({
        success: true,
        data: qualityAnalysis,
        cached: false
      });

    } catch (error) {
      logger.error('Error in analyzeCodeQuality:', error);
      res.status(500).json({
        error: 'Failed to analyze code quality'
      });
    }
  }

  /**
   * Generate architectural recommendations
   */
  async generateArchitectureRecommendations(req, res) {
    try {
      const { owner, repo } = req.params;
      const { 
        focus = 'general', // general, performance, scalability, security, maintainability
        projectType = 'web',
        currentIssues = []
      } = req.body;

      const cacheKey = `ai:architecture:${owner}:${repo}:${focus}:${projectType}`;
      const cachedResult = await cachingService.get(cacheKey);

      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult,
          cached: true
        });
      }

      logger.info(`Generating architecture recommendations for: ${owner}/${repo}`);

      // Get repository structure and analysis
      const repositoryData = await codeAnalysisService.analyzeRepository({
        owner,
        repo,
        analysisType: 'structure'
      });

      const recommendations = await openaiService.generateArchitectureRecommendations({
        repositoryData,
        focus,
        projectType,
        currentIssues
      });

      // Cache for 4 hours
      await cachingService.set(cacheKey, recommendations, 14400);

      res.json({
        success: true,
        data: recommendations,
        cached: false
      });

    } catch (error) {
      logger.error('Error in generateArchitectureRecommendations:', error);
      res.status(500).json({
        error: 'Failed to generate architecture recommendations'
      });
    }
  }

  /**
   * Explain code functionality
   */
  async explainCode(req, res) {
    try {
      const { owner, repo } = req.params;
      const { 
        filePath, 
        codeSnippet, 
        lineStart, 
        lineEnd,
        explanationLevel = 'intermediate' // beginner, intermediate, advanced
      } = req.body;

      if (!filePath && !codeSnippet) {
        return res.status(400).json({
          error: 'Either filePath or codeSnippet is required'
        });
      }

      let code = codeSnippet;
      let fileName = 'snippet';

      if (filePath) {
        const fileContent = await codeAnalysisService.analyzeFile({
          owner,
          repo,
          path: filePath
        });
        
        code = fileContent.content;
        fileName = filePath;

        // Extract specific lines if requested
        if (lineStart && lineEnd) {
          const lines = code.split('\n');
          code = lines.slice(lineStart - 1, lineEnd).join('\n');
        }
      }

      const cacheKey = `ai:explain:${owner}:${repo}:${fileName}:${lineStart}:${lineEnd}:${explanationLevel}`;
      const cachedResult = await cachingService.get(cacheKey);

      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult,
          cached: true
        });
      }

      logger.info(`Explaining code for: ${fileName}`);

      const explanation = await openaiService.explainCode({
        code,
        fileName,
        explanationLevel,
        context: {
          repository: `${owner}/${repo}`,
          filePath,
          lineRange: lineStart && lineEnd ? `${lineStart}-${lineEnd}` : null
        }
      });

      // Cache for 1 hour
      await cachingService.set(cacheKey, explanation, 3600);

      res.json({
        success: true,
        data: explanation,
        cached: false
      });

    } catch (error) {
      logger.error('Error in explainCode:', error);
      res.status(500).json({
        error: 'Failed to explain code'
      });
    }
  }

  /**
   * Generate documentation suggestions
   */
  async generateDocumentation(req, res) {
    try {
      const { owner, repo } = req.params;
      const { 
        filePath,
        documentationType = 'readme', // readme, api, comments, jsdoc
        includeExamples = true,
        targetAudience = 'developers'
      } = req.body;

      const cacheKey = `ai:docs:${owner}:${repo}:${filePath}:${documentationType}:${includeExamples}:${targetAudience}`;
      const cachedResult = await cachingService.get(cacheKey);

      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult,
          cached: true
        });
      }

      logger.info(`Generating documentation for: ${owner}/${repo}/${filePath || 'repository'}`);

      let analysisData;
      if (filePath) {
        analysisData = await codeAnalysisService.analyzeFile({
          owner,
          repo,
          path: filePath
        });
      } else {
        analysisData = await codeAnalysisService.analyzeRepository({
          owner,
          repo,
          analysisType: 'structure'
        });
      }

      const documentation = await openaiService.generateDocumentation({
        analysisData,
        documentationType,
        includeExamples,
        targetAudience,
        context: {
          repository: `${owner}/${repo}`,
          filePath
        }
      });

      // Cache for 2 hours
      await cachingService.set(cacheKey, documentation, 7200);

      res.json({
        success: true,
        data: documentation,
        cached: false
      });

    } catch (error) {
      logger.error('Error in generateDocumentation:', error);
      res.status(500).json({
        error: 'Failed to generate documentation'
      });
    }
  }

  /**
   * Detect code patterns and anti-patterns
   */
  async detectPatterns(req, res) {
    try {
      const { owner, repo } = req.params;
      const { 
        patternType = 'all', // design-patterns, anti-patterns, security, performance
        language,
        severity = 'all' // low, medium, high, critical
      } = req.query;

      const cacheKey = `ai:patterns:${owner}:${repo}:${patternType}:${language}:${severity}`;
      const cachedResult = await cachingService.get(cacheKey);

      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult,
          cached: true
        });
      }

      logger.info(`Detecting patterns in repository: ${owner}/${repo}`);

      const repositoryData = await codeAnalysisService.analyzeRepository({
        owner,
        repo,
        analysisType: 'patterns'
      });

      const patterns = await openaiService.detectPatterns({
        repositoryData,
        patternType,
        language,
        severity
      });

      // Cache for 3 hours
      await cachingService.set(cacheKey, patterns, 10800);

      res.json({
        success: true,
        data: patterns,
        cached: false
      });

    } catch (error) {
      logger.error('Error in detectPatterns:', error);
      res.status(500).json({
        error: 'Failed to detect patterns'
      });
    }
  }

  /**
   * Generate test suggestions
   */
  async generateTestSuggestions(req, res) {
    try {
      const { owner, repo } = req.params;
      const { 
        filePath,
        testType = 'unit', // unit, integration, e2e
        framework,
        coverageTarget = 80
      } = req.body;

      const cacheKey = `ai:tests:${owner}:${repo}:${filePath}:${testType}:${framework}:${coverageTarget}`;
      const cachedResult = await cachingService.get(cacheKey);

      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult,
          cached: true
        });
      }

      logger.info(`Generating test suggestions for: ${filePath || 'repository'}`);

      let analysisData;
      if (filePath) {
        analysisData = await codeAnalysisService.analyzeFile({
          owner,
          repo,
          path: filePath
        });
      } else {
        analysisData = await codeAnalysisService.analyzeRepository({
          owner,
          repo,
          analysisType: 'testing'
        });
      }

      const testSuggestions = await openaiService.generateTestSuggestions({
        analysisData,
        testType,
        framework,
        coverageTarget,
        context: {
          repository: `${owner}/${repo}`,
          filePath
        }
      });

      // Cache for 1 hour
      await cachingService.set(cacheKey, testSuggestions, 3600);

      res.json({
        success: true,
        data: testSuggestions,
        cached: false
      });

    } catch (error) {
      logger.error('Error in generateTestSuggestions:', error);
      res.status(500).json({
        error: 'Failed to generate test suggestions'
      });
    }
  }

  /**
   * Get AI service status and usage statistics
   */
  async getAIStatus(req, res) {
    try {
      const status = await openaiService.getServiceStatus();
      
      res.json({
        success: true,
        data: {
          status: 'operational',
          ...status,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error in getAIStatus:', error);
      res.status(500).json({
        error: 'Failed to get AI service status'
      });
    }
  }

  /**
   * Chat with AI about repository
   */
  async chatWithRepository(req, res) {
    try {
      const { owner, repo } = req.params;
      const { 
        message, 
        conversationId,
        context = []
      } = req.body;

      if (!message) {
        return res.status(400).json({
          error: 'Message is required'
        });
      }

      logger.info(`AI chat session for repository: ${owner}/${repo}`);

      // Get repository context if not provided
      let repositoryContext = context;
      if (context.length === 0) {
        const analysisData = await codeAnalysisService.analyzeRepository({
          owner,
          repo,
          analysisType: 'summary'
        });
        repositoryContext = [analysisData];
      }

      const response = await openaiService.chatWithRepository({
        message,
        repositoryContext,
        conversationId,
        repository: `${owner}/${repo}`
      });

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      logger.error('Error in chatWithRepository:', error);
      res.status(500).json({
        error: 'Failed to process chat message'
      });
    }
  }

  /**
   * Clear AI-related cache
   */
  async clearAICache(req, res) {
    try {
      const { owner, repo } = req.params;
      const { cacheType = 'all' } = req.query; // all, insights, quality, architecture, patterns

      const cachePatterns = [];
      
      if (cacheType === 'all') {
        cachePatterns.push(`ai:*:${owner}:${repo}:*`);
      } else {
        cachePatterns.push(`ai:${cacheType}:${owner}:${repo}:*`);
      }

      await Promise.all(cachePatterns.map(pattern => 
        cachingService.deletePattern(pattern)
      ));

      logger.info(`AI cache cleared for repository: ${owner}/${repo}, type: ${cacheType}`);

      res.json({
        success: true,
        message: 'AI cache cleared successfully'
      });

    } catch (error) {
      logger.error('Error in clearAICache:', error);
      res.status(500).json({
        error: 'Failed to clear AI cache'
      });
    }
  }
}

module.exports = new AIController();