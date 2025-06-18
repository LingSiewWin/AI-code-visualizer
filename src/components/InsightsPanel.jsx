import React, { useState, useMemo } from 'react';
import { 
  Brain, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  Target,
  Zap,
  Shield,
  Clock,
  Users,
  Code,
  FileText,
  GitBranch,
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ExternalLink,
  Bookmark,
  Filter,
  Search,
  ChevronRight,
  ChevronDown,
  Info
} from 'lucide-react';

const InsightsPanel = ({ 
  insightsData, 
  isLoading = false, 
  onInsightAction = () => {},
  onFeedback = () => {}
}) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedInsights, setExpandedInsights] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('priority');

  // Mock insights data - replace with actual insightsData
  const defaultData = {
    summary: {
      totalInsights: 12,
      criticalIssues: 2,
      recommendations: 7,
      opportunities: 3,
      aiConfidence: 89
    },
    insights: [
      {
        id: 1,
        type: 'critical',
        category: 'performance',
        title: 'Memory Leak Detected in Three.js Scene',
        description: 'The ThreeScene.jsx component is not properly disposing of geometries and materials, leading to memory accumulation over time.',
        impact: 'High',
        priority: 1,
        confidence: 95,
        aiReasoning: 'Analysis of memory allocation patterns shows continuous growth without proper cleanup in the animation loop.',
        recommendations: [
          'Implement proper disposal of Three.js objects in useEffect cleanup',
          'Use object pooling for frequently created/destroyed geometries',
          'Add memory monitoring to detect leaks early'
        ],
        codeExample: `// Add to useEffect cleanup
return () => {
  geometry.dispose();
  material.dispose();
  renderer.dispose();
};`,
        relatedFiles: ['src/components/ThreeScene.jsx'],
        tags: ['memory-leak', 'three.js', 'performance'],
        timestamp: '2024-06-17T10:30:00Z',
        status: 'new'
      },
      {
        id: 2,
        type: 'recommendation',
        category: 'code-quality',
        title: 'Extract Complex Logic into Custom Hooks',
        description: 'Several components contain complex state management that could be extracted into reusable custom hooks.',
        impact: 'Medium',
        priority: 2,
        confidence: 87,
        aiReasoning: 'Components like AICodeVisualizer.jsx have over 200 lines with mixed concerns. Extracting hooks would improve testability and reusability.',
        recommendations: [
          'Create useRepositoryData hook for data fetching logic',
          'Extract useVisualization hook for Three.js state management',
          'Implement useAnalysis hook for code analysis operations'
        ],
        codeExample: `// Example custom hook
const useRepositoryData = (repoUrl) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  // ... logic here
  return { data, loading, refetch };
};`,
        relatedFiles: ['src/components/AICodeVisualizer.jsx', 'src/components/AnalysisPanel.jsx'],
        tags: ['refactoring', 'hooks', 'maintainability'],
        timestamp: '2024-06-17T09:15:00Z',
        status: 'new'
      },
      {
        id: 3,
        type: 'opportunity',
        category: 'architecture',
        title: 'Implement State Management with Zustand',
        description: 'The application would benefit from centralized state management to reduce prop drilling and improve data flow.',
        impact: 'Medium',
        priority: 3,
        confidence: 78,
        aiReasoning: 'Analysis shows prop drilling across 5+ component levels and repeated state logic in multiple components.',
        recommendations: [
          'Set up Zustand store for global application state',
          'Create separate stores for repository data, UI state, and user preferences',
          'Implement persistence for user settings'
        ],
        codeExample: `// Zustand store example
const useAppStore = create((set) => ({
  repository: null,
  analysisData: null,
  setRepository: (repo) => set({ repository: repo }),
  setAnalysisData: (data) => set({ analysisData: data })
}));`,
        relatedFiles: ['src/App.jsx', 'src/components/'],
        tags: ['state-management', 'architecture', 'zustand'],
        timestamp: '2024-06-17T08:45:00Z',
        status: 'bookmarked'
      },
      {
        id: 4,
        type: 'security',
        category: 'security',
        title: 'API Keys Exposure Risk',
        description: 'Environment variables handling could be improved to prevent accidental exposure of sensitive data.',
        impact: 'High',
        priority: 1,
        confidence: 92,
        aiReasoning: 'Found patterns that suggest client-side access to environment variables that should remain server-side only.',
        recommendations: [
          'Move sensitive API calls to backend endpoints',
          'Implement proper environment variable validation',
          'Add runtime checks for required environment variables'
        ],
        codeExample: `// Server-side API route
export default async function handler(req, res) {
  const apiKey = process.env.OPENAI_API_KEY; // Server-only
  // ... API logic
}`,
        relatedFiles: ['src/services/aiAnalyzer.js', 'server/services/openaiService.js'],
        tags: ['security', 'api-keys', 'environment'],
        timestamp: '2024-06-17T07:20:00Z',
        status: 'in-progress'
      },
      {
        id: 5,
        type: 'performance',
        category: 'performance',
        title: 'Optimize Bundle Size with Code Splitting',
        description: 'The application bundle could be optimized by implementing route-based code splitting.',
        impact: 'Medium',
        priority: 4,
        confidence: 83,
        aiReasoning: 'Bundle analysis shows large initial payload. Route-based splitting could reduce initial load time by ~40%.',
        recommendations: [
          'Implement React.lazy for route components',
          'Split vendor libraries into separate chunks',
          'Add bundle analyzer to CI/CD pipeline'
        ],
        codeExample: `// Lazy loading example
const AnalysisPanel = lazy(() => import('./components/AnalysisPanel'));

<Suspense fallback={<LoadingSpinner />}>
  <AnalysisPanel />
</Suspense>`,
        relatedFiles: ['src/App.jsx', 'webpack.config.js'],
        tags: ['performance', 'code-splitting', 'bundle-size'],
        timestamp: '2024-06-17T06:00:00Z',
        status: 'completed'
      }
    ],
    patterns: [
      {
        pattern: 'Component Size',
        description: 'Large components detected',
        frequency: 3,
        severity: 'medium'
      },
      {
        pattern: 'Prop Drilling',
        description: 'Props passed through multiple levels',
        frequency: 5,
        severity: 'high'
      },
      {
        pattern: 'Unused Imports',
        description: 'Imports not being used',
        frequency: 8,
        severity: 'low'
      }
    ]
  };

  const data = insightsData || defaultData;

  const categories = [
    { id: 'all', label: 'All Insights', icon: Brain },
    { id: 'critical', label: 'Critical', icon: AlertTriangle },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'code-quality', label: 'Code Quality', icon: Code },
    { id: 'architecture', label: 'Architecture', icon: GitBranch }
  ];

  const getInsightIcon = (type) => {
    switch (type) {
      case 'critical': return AlertTriangle;
      case 'recommendation': return Lightbulb;
      case 'opportunity': return Target;
      case 'security': return Shield;
      case 'performance': return Zap;
      default: return Info;
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'critical': return '#ef4444';
      case 'recommendation': return '#3b82f6';
      case 'opportunity': return '#10b981';
      case 'security': return '#f59e0b';
      case 'performance': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in-progress': return Clock;
      case 'bookmarked': return Bookmark;
      default: return null;
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1: return 'Critical';
      case 2: return 'High';
      case 3: return 'Medium';
      case 4: return 'Low';
      default: return 'Unknown';
    }
  };

  const filteredInsights = useMemo(() => {
    let filtered = data.insights;

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(insight => 
        insight.category === activeCategory || insight.type === activeCategory
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(insight =>
        insight.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        insight.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        insight.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort insights
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return a.priority - b.priority;
        case 'confidence':
          return b.confidence - a.confidence;
        case 'timestamp':
          return new Date(b.timestamp) - new Date(a.timestamp);
        default:
          return 0;
      }
    });

    return filtered;
  }, [data.insights, activeCategory, searchTerm, sortBy]);

  const toggleInsightExpansion = (id) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedInsights(newExpanded);
  };

  const handleFeedback = (insightId, type) => {
    onFeedback(insightId, type);
  };

  const InsightCard = ({ insight }) => {
    const Icon = getInsightIcon(insight.type);
    const StatusIcon = getStatusIcon(insight.status);
    const isExpanded = expandedInsights.has(insight.id);
    const color = getInsightColor(insight.type);

    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="p-2 rounded-full" style={{ backgroundColor: `${color}20` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                  {StatusIcon && <StatusIcon className="w-4 h-4 text-gray-500" />}
                </div>
                <p className="text-gray-600 mb-3">{insight.description}</p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    insight.priority === 1 ? 'bg-red-100 text-red-800' :
                    insight.priority === 2 ? 'bg-orange-100 text-orange-800' :
                    insight.priority === 3 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getPriorityLabel(insight.priority)} Priority
                  </span>
                  <span className="flex items-center space-x-1">
                    <Brain className="w-3 h-3" />
                    <span>{insight.confidence}% confidence</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(insight.timestamp).toLocaleDateString()}</span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {insight.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => toggleInsightExpansion(insight.id)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {isExpanded ? 
                <ChevronDown className="w-5 h-5 text-gray-500" /> :
                <ChevronRight className="w-5 h-5 text-gray-500" />
              }
            </button>
          </div>

          {isExpanded && (
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">AI Reasoning</h4>
                <p className="text-gray-600 text-sm bg-blue-50 p-3 rounded-lg">
                  {insight.aiReasoning}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                <ul className="space-y-2">
                  {insight.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {insight.codeExample && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Code Example</h4>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{insight.codeExample}</code>
                  </pre>
                </div>
              )}

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Related Files</h4>
                <div className="flex flex-wrap gap-2">
                  {insight.relatedFiles.map((file, index) => (
                    <span key={index} className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-md text-xs">
                      <FileText className="w-3 h-3" />
                      <span>{file}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Was this insight helpful?</span>
                  <button
                    onClick={() => handleFeedback(insight.id, 'positive')}
                    className="p-1 hover:bg-green-100 rounded transition-colors"
                  >
                    <ThumbsUp className="w-4 h-4 text-gray-400 hover:text-green-600" />
                  </button>
                  <button
                    onClick={() => handleFeedback(insight.id, 'negative')}
                    className="p-1 hover:bg-red-100 rounded transition-colors"
                  >
                    <ThumbsDown className="w-4 h-4 text-gray-400 hover:text-red-600" />
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onInsightAction(insight.id, 'bookmark')}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={() => onInsightAction(insight.id, 'apply')}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Apply Fix</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const SummaryCard = ({ title, value, subtitle, icon: Icon, color = '#3b82f6' }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className="p-2 rounded-full" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 animate-pulse text-blue-500" />
            <span className="text-gray-600">Generating AI insights...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Brain className="w-7 h-7 text-blue-600" />
            <span>AI Insights</span>
          </h2>
          <p className="text-gray-600">Intelligent recommendations powered by code analysis</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <SummaryCard
          title="Total Insights"
          value={data.summary.totalInsights}
          icon={Brain}
          color="#3b82f6"
        />
        <SummaryCard
          title="Critical Issues"
          value={data.summary.criticalIssues}
          icon={AlertTriangle}
          color="#ef4444"
        />
        <SummaryCard
          title="Recommendations"
          value={data.summary.recommendations}
          icon={Lightbulb}
          color="#f59e0b"
        />
        <SummaryCard
          title="Opportunities"
          value={data.summary.opportunities}
          icon={Target}
          color="#10b981"
        />
        <SummaryCard
          title="AI Confidence"
          value={`${data.summary.aiConfidence}%`}
          subtitle="Average accuracy"
          icon={Star}
          color="#8b5cf6"
        />
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                  activeCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search insights..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="priority">Sort by Priority</option>
            <option value="confidence">Sort by Confidence</option>
            <option value="timestamp">Sort by Date</option>
          </select>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {filteredInsights.length > 0 ? (
          filteredInsights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))
        ) : (
          <div className="text-center py-12">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No insights found</h3>
            <p className="text-gray-600">
              {searchTerm || activeCategory !== 'all' 
                ? 'Try adjusting your filters or search terms'
                : 'Run an analysis to generate AI insights'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightsPanel;