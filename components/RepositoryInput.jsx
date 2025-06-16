import React, { useState, useEffect, useRef } from 'react';
import { 
  Github, 
  Search, 
  Zap, 
  Upload, 
  History, 
  Star, 
  GitBranch, 
  Code, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  X,
  Sparkles,
  TrendingUp
} from 'lucide-react';

const RepositoryInput = ({ onAnalyze, isAnalyzing = false, analysisProgress = 0 }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(null);
  const [recentRepos, setRecentRepos] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
  const dropRef = useRef(null);

  // Mock recent repositories
  const mockRecentRepos = [
    {
      name: 'facebook/react',
      description: 'A declarative, efficient, and flexible JavaScript library for building user interfaces.',
      stars: 227000,
      language: 'JavaScript',
      lastAnalyzed: '2 hours ago'
    },
    {
      name: 'microsoft/vscode',
      description: 'Visual Studio Code',
      stars: 163000,
      language: 'TypeScript',
      lastAnalyzed: '1 day ago'
    },
    {
      name: 'vercel/next.js',
      description: 'The React Framework',
      stars: 125000,
      language: 'JavaScript',
      lastAnalyzed: '3 days ago'
    }
  ];

  // Popular repositories suggestions
  const popularRepos = [
    'tensorflow/tensorflow',
    'pytorch/pytorch',
    'huggingface/transformers',
    'openai/gpt-3',
    'microsoft/TypeScript',
    'apple/swift'
  ];

  useEffect(() => {
    setRecentRepos(mockRecentRepos);
  }, []);

  // Validate GitHub URL
  useEffect(() => {
    if (!repoUrl) {
      setIsValidUrl(null);
      return;
    }

    const githubUrlPattern = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;
    const isValid = githubUrlPattern.test(repoUrl);
    setIsValidUrl(isValid);
  }, [repoUrl]);

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      // Handle file drop (for future local repository analysis)
      console.log('File dropped:', files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValidUrl && repoUrl && !isAnalyzing) {
      onAnalyze(repoUrl);
      // Add to recent repos
      const newRepo = {
        name: repoUrl.replace('https://github.com/', ''),
        description: 'Recently analyzed repository',
        stars: 0,
        language: 'Unknown',
        lastAnalyzed: 'Just now'
      };
      setRecentRepos(prev => [newRepo, ...prev.slice(0, 4)]);
    }
  };

  const handleQuickSelect = (repo) => {
    const url = typeof repo === 'string' ? `https://github.com/${repo}` : `https://github.com/${repo.name}`;
    setRepoUrl(url);
    setShowSuggestions(false);
    if (typeof repo === 'object') {
      setSelectedRepo(repo);
    }
  };

  const clearInput = () => {
    setRepoUrl('');
    setSelectedRepo(null);
    setIsValidUrl(null);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Input Section */}
      <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 animate-pulse"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Analyze Your Repository
            </h2>
            <p className="text-gray-300 text-lg">
              Unlock AI-powered insights and stunning 3D visualizations
            </p>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <div className={`relative transition-all duration-300 ${
                dragActive ? 'scale-105 ring-2 ring-cyan-400' : ''
              }`}>
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                  <Github className="w-6 h-6 text-gray-400" />
                </div>
                
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Enter GitHub repository URL (e.g., https://github.com/user/repo)"
                  className={`w-full pl-14 pr-32 py-5 bg-gray-800/50 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200 text-lg ${
                    isValidUrl === false ? 'border-red-500' : 
                    isValidUrl === true ? 'border-green-500' : 
                    'border-gray-600'
                  }`}
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  disabled={isAnalyzing}
                />

                {/* Input Status Icons */}
                <div className="absolute right-20 top-1/2 transform -translate-y-1/2">
                  {isAnalyzing ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
                  ) : isValidUrl === true ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : isValidUrl === false ? (
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  ) : null}
                </div>

                {/* Clear Button */}
                {repoUrl && !isAnalyzing && (
                  <button
                    type="button"
                    onClick={clearInput}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-700 transition-colors duration-200"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Validation Message */}
              {isValidUrl === false && (
                <p className="text-red-400 text-sm mt-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Please enter a valid GitHub repository URL
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={!isValidUrl || isAnalyzing}
                className="flex-1 flex items-center justify-center space-x-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Zap className="w-5 h-5" />
                <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Repository'}</span>
                <Sparkles className="w-5 h-5" />
              </button>

              <button
                type="button"
                className="flex items-center justify-center space-x-2 px-6 py-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 rounded-xl font-medium text-gray-300 transition-all duration-200 hover:scale-105"
                onClick={() => setShowSuggestions(!showSuggestions)}
              >
                <TrendingUp className="w-5 h-5" />
                <span>Popular Repos</span>
              </button>
            </div>
          </form>

          {/* Progress Bar */}
          {isAnalyzing && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">Analysis Progress</span>
                <span className="text-sm text-cyan-400">{analysisProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${analysisProgress}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-center mt-4 text-cyan-400">
                <Clock className="w-4 h-4 mr-2" />
                <span className="text-sm">AI is analyzing your repository...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suggestions Panel */}
      {showSuggestions && !isAnalyzing && (
        <div className="mt-4 bg-black/20 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-400" />
              Popular Repositories
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {popularRepos.map((repo) => (
                <button
                  key={repo}
                  onClick={() => handleQuickSelect(repo)}
                  className="flex items-center space-x-3 p-3 bg-gray-800/30 hover:bg-gray-700/50 rounded-lg transition-all duration-200 hover:scale-105 text-left"
                >
                  <Github className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300 font-medium">{repo}</span>
                </button>
              ))}
            </div>

            {/* Recent Repositories */}
            {recentRepos.length > 0 && (
              <>
                <h4 className="text-lg font-semibold text-gray-300 mb-3 flex items-center">
                  <History className="w-5 h-5 mr-2 text-cyan-400" />
                  Recently Analyzed
                </h4>
                <div className="space-y-3">
                  {recentRepos.map((repo, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickSelect(repo)}
                      className="w-full flex items-center justify-between p-4 bg-gray-800/30 hover:bg-gray-700/50 rounded-lg transition-all duration-200 hover:scale-105 text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <Github className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <h5 className="text-white font-medium">{repo.name}</h5>
                          <p className="text-gray-400 text-sm truncate max-w-xs">
                            {repo.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span>{repo.stars.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Code className="w-4 h-4" />
                          <span>{repo.language}</span>
                        </div>
                        <span>{repo.lastAnalyzed}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Drop Zone Overlay */}
      {dragActive && (
        <div
          ref={dropRef}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
        >
          <div className="bg-gray-800 rounded-2xl p-8 border-2 border-dashed border-cyan-400 text-center">
            <Upload className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Drop Repository Files</h3>
            <p className="text-gray-300">Upload your local repository for analysis</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepositoryInput;