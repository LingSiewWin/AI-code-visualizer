import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Code, FileText, GitBranch, Activity, Zap, Shield, Target, TrendingUp } from 'lucide-react';

const CodeMetrics = ({ metrics, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="p-6 bg-gray-900 rounded-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-700 rounded"></div>
            <div className="h-64 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Default metrics if none provided
  const defaultMetrics = {
    overview: {
      totalFiles: 0,
      totalLines: 0,
      totalFunctions: 0,
      complexity: 0
    },
    languages: [],
    complexity: {
      distribution: [],
      trend: []
    },
    quality: {
      score: 0,
      issues: 0,
      coverage: 0,
      maintainability: 0
    },
    dependencies: {
      total: 0,
      outdated: 0,
      vulnerable: 0
    }
  };

  const data = metrics || defaultMetrics;

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

  const MetricCard = ({ icon: Icon, title, value, subtitle, color = 'blue' }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      yellow: 'from-yellow-500 to-yellow-600',
      red: 'from-red-500 to-red-600',
      purple: 'from-purple-500 to-purple-600',
      indigo: 'from-indigo-500 to-indigo-600'
    };

    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClasses[color]}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{value}</div>
            {subtitle && <div className="text-sm text-gray-400">{subtitle}</div>}
          </div>
        </div>
        <h3 className="text-sm font-medium text-gray-300">{title}</h3>
      </div>
    );
  };

  const QualityIndicator = ({ label, value, maxValue = 100 }) => {
    const percentage = Math.min((value / maxValue) * 100, 100);
    const getColor = (perc) => {
      if (perc >= 80) return 'bg-green-500';
      if (perc >= 60) return 'bg-yellow-500';
      return 'bg-red-500';
    };

    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-300 mb-1">
          <span>{label}</span>
          <span>{value}{typeof value === 'number' && maxValue === 100 ? '%' : ''}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getColor(percentage)}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-900 rounded-lg">
      <div className="flex items-center mb-6">
        <Activity className="w-6 h-6 text-blue-400 mr-2" />
        <h2 className="text-xl font-bold text-white">Code Metrics</h2>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={FileText}
          title="Total Files"
          value={data.overview.totalFiles.toLocaleString()}
          color="blue"
        />
        <MetricCard
          icon={Code}
          title="Lines of Code"
          value={data.overview.totalLines.toLocaleString()}
          color="green"
        />
        <MetricCard
          icon={GitBranch}
          title="Functions"
          value={data.overview.totalFunctions.toLocaleString()}
          color="purple"
        />
        <MetricCard
          icon={Zap}
          title="Avg Complexity"
          value={data.overview.complexity.toFixed(1)}
          subtitle="per function"
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Language Distribution */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Code className="w-5 h-5 mr-2" />
            Language Distribution
          </h3>
          {data.languages.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.languages}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.languages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500">
              No language data available
            </div>
          )}
        </div>

        {/* Complexity Distribution */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Complexity Distribution
          </h3>
          {data.complexity.distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.complexity.distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="range" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500">
              No complexity data available
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Quality */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Code Quality
          </h3>
          <QualityIndicator
            label="Quality Score"
            value={data.quality.score}
            maxValue={100}
          />
          <QualityIndicator
            label="Test Coverage"
            value={data.quality.coverage}
            maxValue={100}
          />
          <QualityIndicator
            label="Maintainability"
            value={data.quality.maintainability}
            maxValue={100}
          />
          <div className="mt-4 p-3 bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Issues Found</span>
              <span className="text-lg font-bold text-red-400">{data.quality.issues}</span>
            </div>
          </div>
        </div>

        {/* Dependencies */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <GitBranch className="w-5 h-5 mr-2" />
            Dependencies
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-300">Total Dependencies</span>
              <span className="text-lg font-bold text-blue-400">{data.dependencies.total}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-300">Outdated</span>
              <span className="text-lg font-bold text-yellow-400">{data.dependencies.outdated}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-300">Vulnerable</span>
              <span className="text-lg font-bold text-red-400">{data.dependencies.vulnerable}</span>
            </div>
          </div>
          
          {data.dependencies.vulnerable > 0 && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
              <div className="flex items-center text-red-400">
                <Shield className="w-4 h-4 mr-2" />
                <span className="text-sm">Security vulnerabilities detected</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Complexity Trend */}
      {data.complexity.trend.length > 0 && (
        <div className="mt-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Complexity Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.complexity.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="complexity" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default CodeMetrics;