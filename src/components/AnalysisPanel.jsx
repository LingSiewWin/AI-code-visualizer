import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  Code, 
  FileText, 
  GitBranch, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Target,
  Zap,
  Database,
  Settings,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

const AnalysisPanel = ({ 
  analysisData, 
  isLoading = false, 
  onRefresh = () => {},
  onExport = () => {}
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [filterBy, setFilterBy] = useState('all');

  // Mock data structure - replace with actual analysisData
  const defaultData = {
    overview: {
      totalFiles: 145,
      linesOfCode: 12547,
      complexity: 'Medium',
      maintainability: 78,
      technicalDebt: 'Low',
      lastAnalyzed: new Date().toISOString()
    },
    metrics: {
      codeQuality: 85,
      testCoverage: 72,
      documentation: 65,
      performance: 91,
      security: 88
    },
    fileTypes: [
      { name: 'JavaScript', count: 45, percentage: 31, color: '#f7df1e' },
      { name: 'CSS', count: 12, percentage: 8, color: '#1572b6' },
      { name: 'HTML', count: 8, percentage: 6, color: '#e34f26' },
      { name: 'JSON', count: 25, percentage: 17, color: '#000000' },
      { name: 'Markdown', count: 15, percentage: 10, color: '#083fa1' },
      { name: 'Other', count: 40, percentage: 28, color: '#6c757d' }
    ],
    complexity: [
      { file: 'App.jsx', complexity: 15, category: 'High' },
      { file: 'AICodeVisualizer.jsx', complexity: 12, category: 'Medium' },
      { file: 'ThreeScene.jsx', complexity: 18, category: 'High' },
      { file: 'RepositoryInput.jsx', complexity: 8, category: 'Low' },
      { file: 'Navbar.jsx', complexity: 5, category: 'Low' }
    ],
    dependencies: {
      total: 45,
      outdated: 3,
      vulnerable: 1,
      unused: 2
    },
    trends: [
      { date: '2024-01', complexity: 12, maintainability: 75, coverage: 68 },
      { date: '2024-02', complexity: 13, maintainability: 76, coverage: 70 },
      { date: '2024-03', complexity: 11, maintainability: 78, coverage: 72 },
      { date: '2024-04', complexity: 10, maintainability: 80, coverage: 75 },
      { date: '2024-05', complexity: 9, maintainability: 82, coverage: 77 },
      { date: '2024-06', complexity: 8, maintainability: 85, coverage: 80 }
    ]
  };

  const data = analysisData || defaultData;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'metrics', label: 'Code Metrics', icon: BarChart },
    { id: 'files', label: 'File Analysis', icon: FileText },
    { id: 'dependencies', label: 'Dependencies', icon: GitBranch },
    { id: 'trends', label: 'Trends', icon: TrendingUp }
  ];

  const getComplexityColor = (complexity) => {
    switch (complexity?.toLowerCase()) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getQualityColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const MetricCard = ({ title, value, subtitle, icon: Icon, color = '#3b82f6' }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  );

  const QualityBar = ({ label, score, color }) => (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{score}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="h-2 rounded-full transition-all duration-500"
          style={{ 
            width: `${score}%`, 
            backgroundColor: color 
          }}
        />
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Files"
          value={data.overview.totalFiles.toLocaleString()}
          icon={FileText}
          color="#3b82f6"
        />
        <MetricCard
          title="Lines of Code"
          value={data.overview.linesOfCode.toLocaleString()}
          icon={Code}
          color="#10b981"
        />
        <MetricCard
          title="Complexity"
          value={data.overview.complexity}
          subtitle="Overall rating"
          icon={Target}
          color={getComplexityColor(data.overview.complexity)}
        />
        <MetricCard
          title="Maintainability"
          value={`${data.overview.maintainability}%`}
          subtitle="Index score"
          icon={Settings}
          color={getQualityColor(data.overview.maintainability)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">File Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                dataKey="count"
                data={data.fileTypes}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
              >
                {data.fileTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, props) => [value, props.payload.name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {data.fileTypes.map((type, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: type.color }}
                />
                <span className="text-sm text-gray-600">{type.name} ({type.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Metrics</h3>
          <div className="space-y-4">
            <QualityBar 
              label="Code Quality" 
              score={data.metrics.codeQuality} 
              color={getQualityColor(data.metrics.codeQuality)}
            />
            <QualityBar 
              label="Test Coverage" 
              score={data.metrics.testCoverage} 
              color={getQualityColor(data.metrics.testCoverage)}
            />
            <QualityBar 
              label="Documentation" 
              score={data.metrics.documentation} 
              color={getQualityColor(data.metrics.documentation)}
            />
            <QualityBar 
              label="Performance" 
              score={data.metrics.performance} 
              color={getQualityColor(data.metrics.performance)}
            />
            <QualityBar 
              label="Security" 
              score={data.metrics.security} 
              color={getQualityColor(data.metrics.security)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderMetrics = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Code Quality Metrics</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={[
            { metric: 'Code Quality', score: data.metrics.codeQuality },
            { metric: 'Test Coverage', score: data.metrics.testCoverage },
            { metric: 'Documentation', score: data.metrics.documentation },
            { metric: 'Performance', score: data.metrics.performance },
            { metric: 'Security', score: data.metrics.security }
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="metric" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderFiles = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">File Complexity Analysis</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Complexity Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.complexity.map((file, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {file.file}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {file.complexity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        file.category === 'Low' ? 'bg-green-100 text-green-800' :
                        file.category === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}
                    >
                      {file.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {file.category === 'Low' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderDependencies = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Dependencies"
          value={data.dependencies.total}
          icon={Database}
          color="#3b82f6"
        />
        <MetricCard
          title="Outdated"
          value={data.dependencies.outdated}
          subtitle="Need updates"
          icon={Clock}
          color="#f59e0b"
        />
        <MetricCard
          title="Vulnerable"
          value={data.dependencies.vulnerable}
          subtitle="Security risks"
          icon={AlertTriangle}
          color="#ef4444"
        />
        <MetricCard
          title="Unused"
          value={data.dependencies.unused}
          subtitle="Can be removed"
          icon={Target}
          color="#6b7280"
        />
      </div>
    </div>
  );

  const renderTrends = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Trends Over Time</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data.trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="maintainability" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Maintainability"
            />
            <Line 
              type="monotone" 
              dataKey="coverage" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Test Coverage"
            />
            <Line 
              type="monotone" 
              dataKey="complexity" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Complexity"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'metrics': return renderMetrics();
      case 'files': return renderFiles();
      case 'dependencies': return renderDependencies();
      case 'trends': return renderTrends();
      default: return renderOverview();
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-gray-600">Analyzing repository...</span>
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
          <h2 className="text-2xl font-bold text-gray-900">Code Analysis</h2>
          <p className="text-gray-600">
            Last analyzed: {new Date(data.overview.lastAnalyzed).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={onExport}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-200 rounded-lg p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default AnalysisPanel;