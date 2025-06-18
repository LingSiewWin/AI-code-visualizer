const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const { validateRepositoryData, validateAnalysisRequest } = require('../utils/validators');
const rateLimiter = require('../middleware/rateLimiter');

// Apply rate limiting to all analysis routes
router.use(rateLimiter.analysis);

/**
 * POST /api/analyze/repository
 * Analyze a complete repository structure and generate insights
 */
router.post('/repository', validateRepositoryData, async (req, res, next) => {
  try {
    const { repositoryUrl, branch = 'main', includeTests = false } = req.body;
    
    const analysisResult = await analysisController.analyzeRepository({
      repositoryUrl,
      branch,
      includeTests,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: analysisResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/analyze/code
 * Analyze specific code files or snippets
 */
router.post('/code', validateAnalysisRequest, async (req, res, next) => {
  try {
    const { code, language, filename, analysisType = 'full' } = req.body;
    
    const codeAnalysis = await analysisController.analyzeCode({
      code,
      language,
      filename,
      analysisType
    });

    res.json({
      success: true,
      data: codeAnalysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analyze/complexity/:repositoryId
 * Get complexity metrics for a previously analyzed repository
 */
router.get('/complexity/:repositoryId', async (req, res, next) => {
  try {
    const { repositoryId } = req.params;
    const { detailed = false } = req.query;
    
    const complexityData = await analysisController.getComplexityMetrics({
      repositoryId,
      detailed: detailed === 'true'
    });

    res.json({
      success: true,
      data: complexityData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analyze/dependencies/:repositoryId
 * Get dependency analysis for a repository
 */
router.get('/dependencies/:repositoryId', async (req, res, next) => {
  try {
    const { repositoryId } = req.params;
    const { includeDevDependencies = true, depth = 3 } = req.query;
    
    const dependencyData = await analysisController.getDependencyAnalysis({
      repositoryId,
      includeDevDependencies: includeDevDependencies === 'true',
      depth: parseInt(depth)
    });

    res.json({
      success: true,
      data: dependencyData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/analyze/diff
 * Compare two versions of a repository or specific files
 */
router.post('/diff', async (req, res, next) => {
  try {
    const { 
      repositoryUrl, 
      baseBranch = 'main', 
      compareBranch, 
      files = [] 
    } = req.body;
    
    const diffAnalysis = await analysisController.analyzeDiff({
      repositoryUrl,
      baseBranch,
      compareBranch,
      files
    });

    res.json({
      success: true,
      data: diffAnalysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analyze/status/:jobId
 * Get the status of a long-running analysis job
 */
router.get('/status/:jobId', async (req, res, next) => {
  try {
    const { jobId } = req.params;
    
    const jobStatus = await analysisController.getAnalysisStatus(jobId);

    res.json({
      success: true,
      data: jobStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/analyze/:repositoryId
 * Delete analysis data for a repository
 */
router.delete('/:repositoryId', async (req, res, next) => {
  try {
    const { repositoryId } = req.params;
    
    await analysisController.deleteAnalysis({
      repositoryId,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Analysis data deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analyze/history
 * Get analysis history for the current user
 */
router.get('/history', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt' } = req.query;
    
    const history = await analysisController.getAnalysisHistory({
      userId: req.user?.id,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy
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
 * POST /api/analyze/batch
 * Analyze multiple repositories in batch
 */
router.post('/batch', async (req, res, next) => {
  try {
    const { repositories, options = {} } = req.body;
    
    const batchJob = await analysisController.analyzeBatch({
      repositories,
      options,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: {
        jobId: batchJob.id,
        status: 'queued',
        estimatedTime: batchJob.estimatedTime
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;