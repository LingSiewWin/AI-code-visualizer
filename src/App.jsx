import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import AICodeVisualizer from './components/AICodeVisualizer';
import RepositoryInput from './components/RepositoryInput';
import ThreeScene from './components/ThreeScene';
import AnalysisPanel from './components/AnalysisPanel';
import InsightsPanel from './components/InsightsPanel';
import FileExplorer from './components/FileExplorer';
import CodeMetrics from './components/CodeMetrics';
import LoadingSpinner from './components/LoadingSpinner';
import { useRepositoryAnalysis } from './hooks/useRepositoryAnalysis';
import { useThreeScene } from './hooks/useThreeScene';
import { useGitHubAPI } from './hooks/useGitHubAPI';
import { useAIInsights } from './hooks/useAIInsights';
import './styles/globals.css';

const App = () => {
  // Core application state
  const [currentView, setCurrentView] = useState('input'); // 'input', 'analyzing', 'visualization'
  const [repositoryData, setRepositoryData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [themeMode, setThemeMode] = useState('dark');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Custom hooks for data management
  const {
    analyzeRepository,
    analysisData,
    isAnalyzing,
    analysisError,
    resetAnalysis
  } = useRepositoryAnalysis();

  const {
    githubData,
    fetchRepository,
    isGitHubLoading,
    githubError
  } = useGitHubAPI();

  const {
    insights,
    generateInsights,
    isGeneratingInsights,
    insightsError
  } = useAIInsights();

  const {
    sceneRef,
    updateVisualization,
    resetScene,
    isSceneReady
  } = useThreeScene();

  // Theme management
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    localStorage.setItem('theme-preference', themeMode);
  }, [themeMode]);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-preference');
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      setThemeMode(savedTheme);
    }
  }, []);

  // Handle repository analysis workflow
  const handleRepositorySubmit = async (repoUrl, options = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      setCurrentView('analyzing');

      // Step 1: Fetch repository data from GitHub
      const githubRepoData = await fetchRepository(repoUrl);
      
      if (!githubRepoData) {
        throw new Error('Failed to fetch repository data from GitHub');
      }

      // Step 2: Analyze repository structure and code
      const analysis = await analyzeRepository(githubRepoData, options);
      
      if (!analysis) {
        throw new Error('Failed to analyze repository');
      }

      // Step 3: Generate AI insights
      if (options.generateInsights !== false) {
        await generateInsights(analysis);
      }

      // Step 4: Update visualization
      setRepositoryData({
        ...githubRepoData,
        analysis,
        insights: insights || null
      });

      // Step 5: Update 3D scene
      if (isSceneReady && analysis) {
        updateVisualization(analysis);
      }

      setCurrentView('visualization');
    } catch (err) {
      console.error('Repository analysis error:', err);
      setError(err.message || 'Failed to analyze repository');
      setCurrentView('input');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection in the visualization
  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  // Handle view changes
  const handleViewChange = (view) => {
    if (view === 'input') {
      resetAnalysis();
      resetScene();
      setRepositoryData(null);
      setSelectedFile(null);
      setError(null);
    }
    setCurrentView(view);
  };

  // Toggle theme
  const toggleTheme = () => {
    setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  // Render loading state
  if (isLoading || isAnalyzing || isGitHubLoading) {
    return (
      <div className="app">
        <Navbar 
          currentView={currentView}
          onViewChange={handleViewChange}
          themeMode={themeMode}
          onThemeToggle={toggleTheme}
        />
        <div className="app-content loading-container">
          <LoadingSpinner 
            message={
              isGitHubLoading ? 'Fetching repository...' :
              isAnalyzing ? 'Analyzing code structure...' :
              'Loading...'
            }
          />
        </div>
        <Toaster position="top-right" />
      </div>
    );
  }

  // Render main application
  return (
    <div className="app">
      <Navbar 
        currentView={currentView}
        onViewChange={handleViewChange}
        repositoryData={repositoryData}
        themeMode={themeMode}
        onThemeToggle={toggleTheme}
        sidebarCollapsed={sidebarCollapsed}
        onSidebarToggle={toggleSidebar}
      />

      <div className={`app-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Repository Input View */}
        {currentView === 'input' && (
          <div className="input-view">
            <RepositoryInput 
              onSubmit={handleRepositorySubmit}
              isLoading={isLoading}
              error={error || analysisError || githubError}
            />
          </div>
        )}

        {/* Main Visualization View */}
        {currentView === 'visualization' && repositoryData && (
          <div className="visualization-view">
            {/* Left Sidebar */}
            <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
              <div className="sidebar-content">
                {/* File Explorer */}
                <section className="sidebar-section">
                  <FileExplorer 
                    repositoryData={repositoryData}
                    selectedFile={selectedFile}
                    onFileSelect={handleFileSelect}
                    collapsed={sidebarCollapsed}
                  />
                </section>

                {/* Code Metrics */}
                {!sidebarCollapsed && (
                  <section className="sidebar-section">
                    <CodeMetrics 
                      analysisData={analysisData}
                      repositoryData={repositoryData}
                    />
                  </section>
                )}
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-content">
              {/* 3D Visualization */}
              <section className="visualization-container">
                <AICodeVisualizer>
                  <ThreeScene 
                    ref={sceneRef}
                    repositoryData={repositoryData}
                    analysisData={analysisData}
                    selectedFile={selectedFile}
                    onFileSelect={handleFileSelect}
                  />
                </AICodeVisualizer>
              </section>

              {/* Bottom Panels */}
              <section className="bottom-panels">
                <div className="panels-container">
                  {/* Analysis Panel */}
                  <div className="panel analysis-panel">
                    <AnalysisPanel 
                      analysisData={analysisData}
                      selectedFile={selectedFile}
                      repositoryData={repositoryData}
                    />
                  </div>

                  {/* AI Insights Panel */}
                  {insights && (
                    <div className="panel insights-panel">
                      <InsightsPanel 
                        insights={insights}
                        isGenerating={isGeneratingInsights}
                        error={insightsError}
                        onRegenerate={() => generateInsights(analysisData)}
                      />
                    </div>
                  )}
                </div>
              </section>
            </main>
          </div>
        )}

        {/* Error State */}
        {error && currentView !== 'input' && (
          <div className="error-container">
            <div className="error-message">
              <h3>Something went wrong</h3>
              <p>{error}</p>
              <button 
                className="retry-button"
                onClick={() => handleViewChange('input')}
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Global Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: themeMode === 'dark' ? '#2d3748' : '#ffffff',
            color: themeMode === 'dark' ? '#ffffff' : '#2d3748',
            border: `1px solid ${themeMode === 'dark' ? '#4a5568' : '#e2e8f0'}`,
          },
        }}
      />
    </div>
  );
};

export default App;