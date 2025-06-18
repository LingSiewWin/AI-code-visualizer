import { useState, useEffect, useCallback } from 'react';
import { githubAPI } from '../services/githubAPI';
import { aiAnalyzer } from '../services/aiAnalyzer';
import { codeParser } from '../services/codeParser';
import { complexityAnalyzer } from '../services/complexityAnalyzer';
import { dependencyMapper } from '../services/dependencyMapper';

export const useRepositoryAnalysis = (repositoryUrl) => {
  const [state, setState] = useState({
    loading: false,
    error: null,
    repository: null,
    fileStructure: null,
    codeMetrics: null,
    dependencies: null,
    complexity: null,
    aiInsights: null,
    progress: 0
  });

  const [analysisCache, setAnalysisCache] = useState(new Map());

  const updateProgress = useCallback((progress) => {
    setState(prev => ({ ...prev, progress }));
  }, []);

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetAnalysis = useCallback(() => {
    setState({
      loading: false,
      error: null,
      repository: null,
      fileStructure: null,
      codeMetrics: null,
      dependencies: null,
      complexity: null,
      aiInsights: null,
      progress: 0
    });
  }, []);

  const analyzeRepository = useCallback(async (url) => {
    if (!url) return;

    // Check cache first
    const cacheKey = url.toLowerCase().trim();
    if (analysisCache.has(cacheKey)) {
      const cachedData = analysisCache.get(cacheKey);
      setState(prev => ({ ...prev, ...cachedData, loading: false }));
      return;
    }

    try {
      updateState({ loading: true, error: null, progress: 0 });

      // Step 1: Fetch repository data
      updateProgress(10);
      const repoData = await githubAPI.getRepository(url);
      updateState({ repository: repoData });

      // Step 2: Get file structure
      updateProgress(25);
      const fileStructure = await githubAPI.getFileStructure(repoData.full_name);
      updateState({ fileStructure });

      // Step 3: Parse code files
      updateProgress(40);
      const parsedFiles = await codeParser.parseRepository(fileStructure);
      
      // Step 4: Analyze code metrics
      updateProgress(55);
      const codeMetrics = await Promise.all([
        complexityAnalyzer.analyzeComplexity(parsedFiles),
        dependencyMapper.mapDependencies(parsedFiles)
      ]);

      const [complexity, dependencies] = codeMetrics;
      updateState({ complexity, dependencies });

      // Step 5: Generate AI insights
      updateProgress(80);
      const aiInsights = await aiAnalyzer.generateInsights({
        repository: repoData,
        fileStructure,
        complexity,
        dependencies
      });

      updateProgress(100);
      
      const finalState = {
        loading: false,
        repository: repoData,
        fileStructure,
        codeMetrics: {
          totalFiles: parsedFiles.length,
          totalLines: parsedFiles.reduce((acc, file) => acc + (file.lines || 0), 0),
          languages: [...new Set(parsedFiles.map(f => f.language).filter(Boolean))],
          lastAnalyzed: new Date().toISOString()
        },
        dependencies,
        complexity,
        aiInsights,
        progress: 100
      };

      // Cache the results
      setAnalysisCache(prev => new Map(prev.set(cacheKey, finalState)));
      
      updateState(finalState);

    } catch (error) {
      console.error('Repository analysis failed:', error);
      updateState({
        loading: false,
        error: error.message || 'Failed to analyze repository',
        progress: 0
      });
    }
  }, [analysisCache, updateState, updateProgress]);

  const refetchRepository = useCallback(async () => {
    if (!repositoryUrl) return;
    
    // Clear cache for this repository
    const cacheKey = repositoryUrl.toLowerCase().trim();
    setAnalysisCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(cacheKey);
      return newCache;
    });
    
    await analyzeRepository(repositoryUrl);
  }, [repositoryUrl, analyzeRepository]);

  const getFilesByLanguage = useCallback(() => {
    if (!state.fileStructure) return {};
    
    return state.fileStructure.reduce((acc, file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext) {
        acc[ext] = (acc[ext] || 0) + 1;
      }
      return acc;
    }, {});
  }, [state.fileStructure]);

  const getComplexityStats = useCallback(() => {
    if (!state.complexity) return null;
    
    return {
      averageComplexity: state.complexity.averageComplexity || 0,
      highComplexityFiles: state.complexity.files?.filter(f => f.complexity > 10).length || 0,
      totalFunctions: state.complexity.totalFunctions || 0,
      mostComplexFile: state.complexity.files?.reduce((max, file) => 
        file.complexity > (max?.complexity || 0) ? file : max, null
      )
    };
  }, [state.complexity]);

  const getDependencyStats = useCallback(() => {
    if (!state.dependencies) return null;
    
    return {
      totalDependencies: state.dependencies.external?.length || 0,
      internalDependencies: state.dependencies.internal?.length || 0,
      circularDependencies: state.dependencies.circular?.length || 0,
      unusedDependencies: state.dependencies.unused?.length || 0
    };
  }, [state.dependencies]);

  // Auto-analyze when repository URL changes
  useEffect(() => {
    if (repositoryUrl && repositoryUrl.trim()) {
      analyzeRepository(repositoryUrl);
    } else {
      resetAnalysis();
    }
  }, [repositoryUrl, analyzeRepository, resetAnalysis]);

  // Cleanup cache when component unmounts or cache gets too large
  useEffect(() => {
    return () => {
      if (analysisCache.size > 10) {
        setAnalysisCache(new Map());
      }
    };
  }, [analysisCache.size]);

  return {
    // State
    ...state,
    
    // Actions
    analyzeRepository,
    refetchRepository,
    resetAnalysis,
    
    // Computed values
    filesByLanguage: getFilesByLanguage(),
    complexityStats: getComplexityStats(),
    dependencyStats: getDependencyStats(),
    
    // Utility flags
    isAnalyzing: state.loading,
    hasData: !!(state.repository && state.fileStructure),
    hasError: !!state.error,
    
    // Cache info
    cacheSize: analysisCache.size
  };
};