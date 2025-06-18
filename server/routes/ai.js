const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');
const { validateAIRequest, validateCodeInput } = require('../utils/validators');

// Apply rate limiting to AI routes (more restrictive)
router.use(rateLimiter.ai);

/**
 * POST /api/ai/analyze-code
 * Generate AI insights for code structure and quality
 */
router.post('/analyze-code', auth.optional, validateCodeInput, async (req, res, next) => {
  try {
    const { 
      code, 
      language, 
      filename, 
      context = '',
      analysisType = 'comprehensive'
    } = req.body;
    
    const aiAnalysis = await aiController.analyzeCode({
      code,
      language,
      filename,
      context,
      analysisType,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: aiAnalysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/generate-insights
 * Generate AI-powered insights for repository analysis
 */
router.post('/generate-insights', auth.optional, validateAIRequest, async (req, res, next) => {
  try {
    const { 
      repositoryData, 
      analysisResults, 
      focusAreas = [],
      insightType = 'general'
    } = req.body;
    
    const insights = await aiController.generateInsights({
      repositoryData,
      analysisResults,
      focusAreas,
      insightType,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/suggest-improvements
 * Get AI suggestions for code improvements
 */
router.post('/suggest-improvements', auth.optional, validateCodeInput, async (req, res, next) => {
  try {
    const { 
      code, 
      language, 
      filename,
      complexity,
      issues = [],
      preferences = {}
    } = req.body;
    
    const suggestions = await aiController.suggestImprovements({
      code,
      language,
      filename,
      complexity,
      issues,
      preferences,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: suggestions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/explain-code
 * Get AI explanation of code functionality
 */
router.post('/explain-code', auth.optional, validateCodeInput, async (req, res, next) => {
  try {
    const { 
      code, 
      language, 
      filename,
      explanationLevel = 'intermediate',
      includeExamples = false
    } = req.body;
    
    const explanation = await aiController.explainCode({
      code,
      language,
      filename,
      explanationLevel,
      includeExamples,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: explanation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/detect-patterns
 * Detect code patterns and architectural insights
 */
router.post('/detect-patterns', auth.optional, async (req, res, next) => {
  try {
    const { 
      fileStructure, 
      codeSnippets = [],
      analysisScope = 'repository',
      patternTypes = ['architectural', 'design', 'anti-patterns']
    } = req.body;
    
    const patterns = await aiController.detectPatterns({
      fileStructure,
      codeSnippets,
      analysisScope,
      patternTypes,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: patterns,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/generate-documentation
 * Generate AI-powered documentation for code
 */
router.post('/generate-documentation', auth.optional, validateCodeInput, async (req, res, next) => {
  try {
    const { 
      code, 
      language, 
      filename,
      docType = 'inline',
      style = 'comprehensive',
      includeExamples = true
    } = req.body;
    
    const documentation = await aiController.generateDocumentation({
      code,
      language,
      filename,
      docType,
      style,
      includeExamples,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: documentation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/security-analysis
 * Perform AI-powered security analysis
 */
router.post('/security-analysis', auth.optional, validateCodeInput, async (req, res, next) => {
  try {
    const { 
      code, 
      language, 
      filename,
      dependencies = [],
      scanLevel = 'standard'
    } = req.body;
    
    const securityAnalysis = await aiController.performSecurityAnalysis({
      code,
      language,
      filename,
      dependencies,
      scanLevel,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: securityAnalysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/performance-analysis
 * Analyze code performance with AI insights
 */
router.post('/performance-analysis', auth.optional, validateCodeInput, async (req, res, next) => {
  try {
    const { 
      code, 
      language, 
      filename,
      complexity,
      targetEnvironment = 'general',
      optimizationGoals = ['speed', 'memory']
    } = req.body;
    
    const performanceAnalysis = await aiController.analyzePerformance({
      code,
      language,
      filename,
      complexity,
      targetEnvironment,
      optimizationGoals,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: performanceAnalysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/refactoring-suggestions
 * Get AI-powered refactoring suggestions
 */
router.post('/refactoring-suggestions', auth.optional, validateCodeInput, async (req, res, next) => {
  try {
    const { 
      code, 
      language, 
      filename,
      refactoringGoals = ['readability', 'maintainability'],
      aggressiveness = 'moderate'
    } = req.body;
    
    const refactoringSuggestions = await aiController.generateRefactoringSuggestions({
      code,
      language,
      filename,
      refactoringGoals,
      aggressiveness,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: refactoringSuggestions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/code-review
 * Perform AI-powered code review
 */
router.post('/code-review', auth.optional, validateCodeInput, async (req, res, next) => {
  try {
    const { 
      code, 
      language, 
      filename,
      reviewType = 'comprehensive',
      standards = [],
      previousVersion = null
    } = req.body;
    
    const codeReview = await aiController.performCodeReview({
      code,
      language,
      filename,
      reviewType,
      standards,
      previousVersion,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: codeReview,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/ai/analysis-history
 * Get AI analysis history for the user
 */
router.get('/analysis-history', auth.required, async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type = 'all',
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;
    
    const history = await aiController.getAnalysisHistory({
      userId: req.user.id,
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      sortBy,
      order
    });

    res.json({
      success: true,
      data: history,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/ai/usage-stats
 * Get AI service usage statistics
 */
router.get('/usage-stats', auth.required, async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;
    
    const usageStats = await aiController.getUserUsageStats({
      userId: req.user.id,
      period
    });

    res.json({
      success: true,
      data: usageStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/feedback
 * Submit feedback for AI analysis results
 */
router.post('/feedback', auth.optional, async (req, res, next) => {
  try {
    const { 
      analysisId, 
      rating, 
      comments = '',
      helpful = true,
      suggestions = ''
    } = req.body;
    
    await aiController.submitFeedback({
      analysisId,
      rating,
      comments,
      helpful,
      suggestions,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/ai/models
 * Get available AI models and their capabilities
 */
router.get('/models', async (req, res, next) => {
  try {
    const models = await aiController.getAvailableModels();

    res.json({
      success: true,
      data: models,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;