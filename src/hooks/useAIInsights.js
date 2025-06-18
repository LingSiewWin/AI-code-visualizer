import { useState, useEffect, useCallback, useRef } from 'react';
import { aiAnalyzer } from '../services/aiAnalyzer';

export const useAIInsights = (config = {}) => {
  const [state, setState] = useState({
    insights: null,
    loading: false,
    error: null,
    progress: 0,
    currentTask: null,
    generationId: null,
    lastAnalyzed: null
  });

  const [insightsCache, setInsightsCache] = useState(new Map());
  const [analysisQueue, setAnalysisQueue] = useState([]);
  const abortControllerRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  const {
    enableCaching = true,
    cacheTimeout = 15 * 60 * 1000, // 15 minutes
    maxRetries = 3,
    retryDelay = 2000,
    batchSize = 5,
    enableProgressTracking = true,
    aiProvider = 'openai', // 'openai', 'anthropic', 'local'
    model = 'gpt-4',
    temperature = 0.3
  } = config;

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateProgress = useCallback((progress, task = null) => {
    if (enableProgressTracking) {
      updateState({ progress: Math.max(0, Math.min(100, progress)), currentTask: task });
    }
  }, [enableProgressTracking, updateState]);

  // Generate unique cache key for repository data
  const generateCacheKey = useCallback((repositoryData, analysisType = 'full') => {
    const repoKey = repositoryData.repository?.full_name || 'unknown';
    const fileCount = repositoryData.fileStructure?.length || 0;
    const lastCommit = repositoryData.repository?.pushed_at || '';
    return `${repoKey}:${analysisType}:${fileCount}:${lastCommit}`;
  }, []);

  // Check if insights are cached and still valid
  const getCachedInsights = useCallback((cacheKey) => {
    if (!enableCaching || !insightsCache.has(cacheKey)) return null;
    
    const cached = insightsCache.get(cacheKey);
    const isExpired = Date.now() - cached.timestamp > cacheTimeout;
    
    if (isExpired) {
      setInsightsCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(cacheKey);
        return newCache;
      });
      return null;
    }
    
    return cached.data;
  }, [enableCaching, insightsCache, cacheTimeout]);

  // Cache insights with timestamp
  const cacheInsights = useCallback((cacheKey, insights) => {
    if (!enableCaching) return;
    
    setInsightsCache(prev => new Map(prev.set(cacheKey, {
      data: insights,
      timestamp: Date.now()
    })));
  }, [enableCaching]);

  // Generate comprehensive AI insights
  const generateInsights = useCallback(async (repositoryData, options = {}) => {
    const {
      analysisType = 'full',
      skipCache = false,
      priority = 'normal',
      customPrompts = {}
    } = options;

    if (!repositoryData) {
      throw new Error('Repository data is required for insights generation');
    }

    const cacheKey = generateCacheKey(repositoryData, analysisType);
    const generationId = `insights_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check cache first
    if (!skipCache) {
      const cachedInsights = getCachedInsights(cacheKey);
      if (cachedInsights) {
        updateState({
          insights: cachedInsights,
          loading: false,
          error: null,
          progress: 100,
          generationId,
          lastAnalyzed: cachedInsights.metadata?.generatedAt
        });
        return cachedInsights;
      }
    }

    try {
      updateState({
        loading: true,
        error: null,
        progress: 0,
        currentTask: 'Initializing analysis...',
        generationId
      });

      // Create abort controller for this generation
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      let insights = {
        summary: null,
        codeQuality: null,
        architecture: null,
        security: null,
        performance: null,
        maintainability: null,
        recommendations: null,
        techStack: null,
        complexityAnalysis: null,
        dependencies: null,
        metadata: {
          generatedAt: new Date().toISOString(),
          analysisType,
          model,
          version: '1.0.0'
        }
      };

      // Step 1: Repository Summary
      updateProgress(10, 'Analyzing repository overview...');
      insights.summary = await aiAnalyzer.generateRepositorySummary(repositoryData, {
        signal,
        customPrompt: customPrompts.summary
      });

      if (signal.aborted) throw new Error('Analysis cancelled');

      // Step 2: Code Quality Analysis
      updateProgress(25, 'Evaluating code quality...');
      insights.codeQuality = await aiAnalyzer.analyzeCodeQuality(repositoryData, {
        signal,
        includeMetrics: true,
        customPrompt: customPrompts.codeQuality
      });

      if (signal.aborted) throw new Error('Analysis cancelled');

      // Step 3: Architecture Analysis
      updateProgress(40, 'Analyzing architecture patterns...');
      insights.architecture = await aiAnalyzer.analyzeArchitecture(repositoryData, {
        signal,
        includePatterns: true,
        customPrompt: customPrompts.architecture
      });

      if (signal.aborted) throw new Error('Analysis cancelled');

      // Step 4: Security Analysis
      updateProgress(55, 'Scanning for security issues...');
      insights.security = await aiAnalyzer.analyzeSecurity(repositoryData, {
        signal,
        includeVulnerabilities: true,
        customPrompt: customPrompts.security
      });

      if (signal.aborted) throw new Error('Analysis cancelled');

      // Step 5: Performance Analysis
      updateProgress(70, 'Evaluating performance patterns...');
      insights.performance = await aiAnalyzer.analyzePerformance(repositoryData, {
        signal,
        includeOptimizations: true,
        customPrompt: customPrompts.performance
      });

      if (signal.aborted) throw new Error('Analysis cancelled');

      // Step 6: Maintainability Assessment
      updateProgress(85, 'Assessing maintainability...');
      insights.maintainability = await aiAnalyzer.analyzeMaintainability(repositoryData, {
        signal,
        includeMetrics: true,
        customPrompt: customPrompts.maintainability
      });

      if (signal.aborted) throw new Error('Analysis cancelled');

      // Step 7: Generate Recommendations
      updateProgress(95, 'Generating recommendations...');
      insights.recommendations = await aiAnalyzer.generateRecommendations(insights, {
        signal,
        prioritize: true,
        customPrompt: customPrompts.recommendations
      });

      // Step 8: Tech Stack Analysis
      insights.techStack = await aiAnalyzer.analyzeTechStack(repositoryData, {
        signal,
        includeVersions: true
      });

      // Step 9: Complexity Analysis Summary
      insights.complexityAnalysis = repositoryData.complexity ? 
        await aiAnalyzer.summarizeComplexity(repositoryData.complexity, { signal }) : null;

      // Step 10: Dependency Analysis
      insights.dependencies = repositoryData.dependencies ?
        await aiAnalyzer.analyzeDependencyRisks(repositoryData.dependencies, { signal }) : null;

      updateProgress(100, 'Analysis complete!');

      // Cache the results
      cacheInsights(cacheKey, insights);

      updateState({
        insights,
        loading: false,
        error: null,
        progress: 100,
        currentTask: null,
        lastAnalyzed: insights.metadata.generatedAt
      });

      return insights;

    } catch (error) {
      console.error('AI insights generation failed:', error);
      
      if (error.name === 'AbortError' || error.message.includes('cancelled')) {
        updateState({
          loading: false,
          error: 'Analysis was cancelled',
          progress: 0,
          currentTask: null
        });
      } else {
        updateState({
          loading: false,
          error: error.message || 'Failed to generate insights',
          progress: 0,
          currentTask: null
        });
      }
      
      throw error;
    }
  }, [
    generateCacheKey,
    getCachedInsights,
    cacheInsights,
    updateState,
    updateProgress,
    model
  ]);

  // Generate specific insight type
  const generateSpecificInsight = useCallback(async (repositoryData, insightType, options = {}) => {
    const supportedTypes = [
      'summary', 'codeQuality', 'architecture', 'security', 
      'performance', 'maintainability', 'recommendations', 'techStack'
    ];

    if (!supportedTypes.includes(insightType)) {
      throw new Error(`Unsupported insight type: ${insightType}`);
    }

    try {
      updateState({ loading: true, error: null, currentTask: `Generating ${insightType} insights...` });

      const result = await aiAnalyzer[`analyze${insightType.charAt(0).toUpperCase() + insightType.slice(1)}`](
        repositoryData, 
        options
      );

      updateState({
        loading: false,
        error: null,
        currentTask: null
      });

      return result;

    } catch (error) {
      updateState({
        loading: false,
        error: error.message || `Failed to generate ${insightType} insights`,
        currentTask: null
      });
      throw error;
    }
  }, [updateState]);

  // Batch generate multiple insight types
  const generateBatchInsights = useCallback(async (repositoryData, insightTypes, options = {}) => {
    const { concurrency = 2 } = options;
    const results = {};
    const errors = {};

    try {
      updateState({ loading: true, error: null, currentTask: 'Starting batch analysis...' });

      // Process insights in batches
      for (let i = 0; i < insightTypes.length; i += concurrency) {
        const batch = insightTypes.slice(i, i + concurrency);
        
        const batchPromises = batch.map(async (type) => {
          try {
            const result = await generateSpecificInsight(repositoryData, type, options);
            return { type, result, success: true };
          } catch (error) {
            return { type, error, success: false };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        
        batchResults.forEach(({ type, result, error, success }) => {
          if (success) {
            results[type] = result;
          } else {
            errors[type] = error;
          }
        });

        updateProgress((i + batch.length) / insightTypes.length * 100, 
          `Completed ${i + batch.length}/${insightTypes.length} analyses`);
      }

      updateState({ loading: false, currentTask: null });
      return { results, errors, hasErrors: Object.keys(errors).length > 0 };

    } catch (error) {
      updateState({ 
        loading: false, 
        error: error.message || 'Batch analysis failed',
        currentTask: null 
      });
      throw error;
    }
  }, [generateSpecificInsight, updateState, updateProgress]);

  // Cancel current analysis
  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    updateState({
      loading: false,
      error: 'Analysis cancelled by user',
      progress: 0,
      currentTask: null
    });
  }, [updateState]);

  // Retry failed analysis
  const retryAnalysis = useCallback(async (repositoryData, options = {}) => {
    const retryOptions = { ...options, skipCache: true };
    return generateInsights(repositoryData, retryOptions);
  }, [generateInsights]);

  // Clear insights and cache
  const clearInsights = useCallback((clearCache = false) => {
    if (clearCache) {
      setInsightsCache(new Map());
    }
    
    updateState({
      insights: null,
      error: null,
      progress: 0,
      currentTask: null,
      lastAnalyzed: null
    });
  }, [updateState]);

  // Get insight summary statistics
  const getInsightStats = useCallback(() => {
    if (!state.insights) return null;

    const { insights } = state;
    return {
      totalRecommendations: insights.recommendations?.items?.length || 0,
      securityIssues: insights.security?.issues?.length || 0,
      performanceIssues: insights.performance?.issues?.length || 0,
      codeQualityScore: insights.codeQuality?.overallScore || 0,
      maintainabilityScore: insights.maintainability?.score || 0,
      techStackCount: insights.techStack?.technologies?.length || 0,
      lastGenerated: insights.metadata?.generatedAt
    };
  }, [state.insights]);

  // Export insights to different formats
  const exportInsights = useCallback((format = 'json') => {
    if (!state.insights) return null;

    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(state.insights, null, 2);
      
      case 'markdown':
        return aiAnalyzer.exportToMarkdown(state.insights);
      
      case 'csv':
        return aiAnalyzer.exportToCSV(state.insights);
      
      case 'pdf':
        return aiAnalyzer.exportToPDF(state.insights);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }, [state.insights]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Cache cleanup
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setInsightsCache(prev => {
        const newCache = new Map();
        for (const [key, value] of prev) {
          if (now - value.timestamp < cacheTimeout) {
            newCache.set(key, value);
          }
        }
        return newCache;
      });
    }, cacheTimeout);

    return () => clearInterval(cleanupInterval);
  }, [cacheTimeout]);

  return {
    // State
    ...state,
    
    // Main actions
    generateInsights,
    generateSpecificInsight,
    generateBatchInsights,
    
    // Control actions
    cancelAnalysis,
    retryAnalysis,
    clearInsights,
    
    // Utility functions
    exportInsights,
    
    // Computed values
    insightStats: getInsightStats(),
    cacheSize: insightsCache.size,
    isGenerating: state.loading,
    hasInsights: !!state.insights,
    hasError: !!state.error,
    
    // Progress info
    progressPercentage: state.progress,
    currentOperation: state.currentTask,
    
    // Cache info
    cacheInfo: {
      size: insightsCache.size,
      maxAge: cacheTimeout / 1000 / 60, // in minutes
      enabled: enableCaching
    }
  };
};