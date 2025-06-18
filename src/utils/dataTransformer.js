/**
 * Data Transformers - Utility functions for transforming and processing data
 * for the AI Code Visualizer application
 */

import { LANGUAGE_COLORS, FILE_TYPE_ICONS } from './constants.js';

/**
 * Transform repository data for Three.js visualization
 * @param {Object} repoData - Raw repository data from GitHub API
 * @returns {Object} Transformed data for 3D visualization
 */
export const transformRepoDataForVisualization = (repoData) => {
  if (!repoData || !repoData.files) {
    return { nodes: [], edges: [], metrics: {} };
  }

  const nodes = [];
  const edges = [];
  const fileMap = new Map();
  
  // Create nodes for each file
  repoData.files.forEach((file, index) => {
    const node = {
      id: index,
      name: file.name,
      path: file.path,
      type: getFileType(file.name),
      language: file.language || 'unknown',
      size: file.size || 0,
      lines: file.lines || 0,
      complexity: file.complexity || 0,
      dependencies: file.dependencies || [],
      position: calculateNodePosition(index, repoData.files.length),
      color: getLanguageColor(file.language),
      scale: calculateNodeScale(file.size, file.complexity)
    };
    
    nodes.push(node);
    fileMap.set(file.path, index);
  });

  // Create edges for dependencies
  repoData.files.forEach((file, sourceIndex) => {
    if (file.dependencies) {
      file.dependencies.forEach(depPath => {
        const targetIndex = fileMap.get(depPath);
        if (targetIndex !== undefined && targetIndex !== sourceIndex) {
          edges.push({
            source: sourceIndex,
            target: targetIndex,
            type: 'dependency',
            weight: 1
          });
        }
      });
    }
  });

  const metrics = calculateVisualizationMetrics(nodes, edges);

  return { nodes, edges, metrics };
};

/**
 * Transform code analysis data for UI components
 * @param {Object} analysisData - Raw analysis data
 * @returns {Object} Transformed data for UI display
 */
export const transformAnalysisDataForUI = (analysisData) => {
  if (!analysisData) return {};

  return {
    overview: {
      totalFiles: analysisData.totalFiles || 0,
      totalLines: analysisData.totalLines || 0,
      languages: transformLanguageStats(analysisData.languages),
      complexity: {
        average: analysisData.averageComplexity || 0,
        highest: analysisData.highestComplexity || 0,
        distribution: analysisData.complexityDistribution || []
      }
    },
    fileTree: transformFileTreeData(analysisData.fileTree),
    dependencies: transformDependencyData(analysisData.dependencies),
    hotspots: identifyCodeHotspots(analysisData),
    patterns: extractCodePatterns(analysisData)
  };
};

/**
 * Transform language statistics for charts
 * @param {Object} languages - Language data
 * @returns {Array} Chart-ready language data
 */
export const transformLanguageStats = (languages) => {
  if (!languages) return [];

  return Object.entries(languages)
    .map(([language, data]) => ({
      name: language,
      value: data.lines || data.count || 0,
      percentage: data.percentage || 0,
      files: data.files || 0,
      color: getLanguageColor(language)
    }))
    .sort((a, b) => b.value - a.value);
};

/**
 * Transform file tree data for tree view component
 * @param {Object} fileTree - Raw file tree data
 * @returns {Array} Hierarchical tree data
 */
export const transformFileTreeData = (fileTree) => {
  if (!fileTree) return [];

  const transformNode = (node, path = '') => {
    const fullPath = path ? `${path}/${node.name}` : node.name;
    
    return {
      id: fullPath,
      name: node.name,
      path: fullPath,
      type: node.type || (node.children ? 'folder' : 'file'),
      size: node.size || 0,
      lines: node.lines || 0,
      language: node.language,
      complexity: node.complexity || 0,
      icon: getFileIcon(node.name, node.type),
      children: node.children ? node.children.map(child => 
        transformNode(child, fullPath)
      ) : undefined
    };
  };

  return Array.isArray(fileTree) 
    ? fileTree.map(node => transformNode(node))
    : [transformNode(fileTree)];
};

/**
 * Transform dependency data for network visualization
 * @param {Object} dependencies - Raw dependency data
 * @returns {Object} Network-ready dependency data
 */
export const transformDependencyData = (dependencies) => {
  if (!dependencies) return { nodes: [], edges: [] };

  const nodes = new Map();
  const edges = [];

  // Process internal dependencies
  if (dependencies.internal) {
    Object.entries(dependencies.internal).forEach(([file, deps]) => {
      if (!nodes.has(file)) {
        nodes.set(file, {
          id: file,
          name: getFileName(file),
          type: 'internal',
          category: getFileCategory(file)
        });
      }

      deps.forEach(dep => {
        if (!nodes.has(dep)) {
          nodes.set(dep, {
            id: dep,
            name: getFileName(dep),
            type: 'internal',
            category: getFileCategory(dep)
          });
        }

        edges.push({
          source: file,
          target: dep,
          type: 'internal'
        });
      });
    });
  }

  // Process external dependencies
  if (dependencies.external) {
    Object.entries(dependencies.external).forEach(([file, deps]) => {
      deps.forEach(dep => {
        const depId = `external:${dep}`;
        if (!nodes.has(depId)) {
          nodes.set(depId, {
            id: depId,
            name: dep,
            type: 'external',
            category: 'package'
          });
        }

        edges.push({
          source: file,
          target: depId,
          type: 'external'
        });
      });
    });
  }

  return {
    nodes: Array.from(nodes.values()),
    edges
  };
};

/**
 * Transform metrics data for dashboard display
 * @param {Object} metrics - Raw metrics data
 * @returns {Object} Dashboard-ready metrics
 */
export const transformMetricsForDashboard = (metrics) => {
  if (!metrics) return {};

  return {
    codeQuality: {
      score: metrics.qualityScore || 0,
      issues: metrics.issues || [],
      suggestions: metrics.suggestions || []
    },
    maintainability: {
      index: metrics.maintainabilityIndex || 0,
      factors: {
        complexity: metrics.cyclomaticComplexity || 0,
        volume: metrics.halsteadVolume || 0,
        effort: metrics.halsteadEffort || 0
      }
    },
    testCoverage: {
      percentage: metrics.testCoverage || 0,
      lines: {
        total: metrics.totalLines || 0,
        covered: metrics.coveredLines || 0,
        uncovered: metrics.uncoveredLines || 0
      }
    },
    dependencies: {
      total: metrics.totalDependencies || 0,
      outdated: metrics.outdatedDependencies || 0,
      vulnerable: metrics.vulnerableDependencies || 0
    }
  };
};

/**
 * Transform AI insights data for display
 * @param {Object} insights - Raw AI insights
 * @returns {Object} Formatted insights
 */
export const transformAIInsights = (insights) => {
  if (!insights) return {};

  return {
    summary: insights.summary || '',
    recommendations: (insights.recommendations || []).map(rec => ({
      id: generateId(),
      type: rec.type || 'general',
      priority: rec.priority || 'medium',
      title: rec.title || '',
      description: rec.description || '',
      files: rec.files || [],
      effort: rec.effort || 'unknown'
    })),
    patterns: (insights.patterns || []).map(pattern => ({
      id: generateId(),
      name: pattern.name || '',
      type: pattern.type || 'architectural',
      confidence: pattern.confidence || 0,
      description: pattern.description || '',
      examples: pattern.examples || []
    })),
    risks: (insights.risks || []).map(risk => ({
      id: generateId(),
      level: risk.level || 'low',
      category: risk.category || 'technical',
      description: risk.description || '',
      mitigation: risk.mitigation || '',
      impact: risk.impact || ''
    }))
  };
};

/**
 * Calculate node position for 3D visualization
 * @param {number} index - Node index
 * @param {number} total - Total number of nodes
 * @returns {Object} 3D position coordinates
 */
const calculateNodePosition = (index, total) => {
  const radius = Math.sqrt(total) * 5;
  const angle = (index / total) * Math.PI * 2;
  const height = (Math.random() - 0.5) * 10;
  
  return {
    x: Math.cos(angle) * radius,
    y: height,
    z: Math.sin(angle) * radius
  };
};

/**
 * Calculate node scale based on file metrics
 * @param {number} size - File size
 * @param {number} complexity - File complexity
 * @returns {number} Scale factor
 */
const calculateNodeScale = (size, complexity) => {
  const sizeScale = Math.log(size + 1) / 10;
  const complexityScale = complexity / 10;
  return Math.max(0.5, Math.min(3, sizeScale + complexityScale));
};

/**
 * Calculate visualization metrics
 * @param {Array} nodes - Graph nodes
 * @param {Array} edges - Graph edges
 * @returns {Object} Calculated metrics
 */
const calculateVisualizationMetrics = (nodes, edges) => {
  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    density: edges.length / (nodes.length * (nodes.length - 1)),
    averageComplexity: nodes.reduce((sum, node) => sum + node.complexity, 0) / nodes.length,
    languageDistribution: calculateLanguageDistribution(nodes)
  };
};

/**
 * Calculate language distribution from nodes
 * @param {Array} nodes - Graph nodes
 * @returns {Object} Language distribution
 */
const calculateLanguageDistribution = (nodes) => {
  const distribution = {};
  nodes.forEach(node => {
    const lang = node.language || 'unknown';
    distribution[lang] = (distribution[lang] || 0) + 1;
  });
  return distribution;
};

/**
 * Identify code hotspots from analysis data
 * @param {Object} analysisData - Analysis data
 * @returns {Array} Code hotspots
 */
const identifyCodeHotspots = (analysisData) => {
  if (!analysisData.files) return [];

  return analysisData.files
    .filter(file => file.complexity > 10 || file.size > 1000)
    .map(file => ({
      file: file.path,
      type: file.complexity > 15 ? 'high-complexity' : 'large-file',
      severity: file.complexity > 20 ? 'critical' : 'warning',
      metrics: {
        complexity: file.complexity,
        size: file.size,
        lines: file.lines
      }
    }))
    .sort((a, b) => b.metrics.complexity - a.metrics.complexity);
};

/**
 * Extract code patterns from analysis data
 * @param {Object} analysisData - Analysis data
 * @returns {Array} Detected patterns
 */
const extractCodePatterns = (analysisData) => {
  const patterns = [];

  // Detect MVC pattern
  if (hasPattern(analysisData, ['model', 'view', 'controller'])) {
    patterns.push({
      name: 'Model-View-Controller',
      type: 'architectural',
      confidence: 0.8
    });
  }

  // Detect component pattern
  if (hasPattern(analysisData, ['component', 'jsx', 'tsx'])) {
    patterns.push({
      name: 'Component-Based Architecture',
      type: 'architectural',
      confidence: 0.9
    });
  }

  return patterns;
};

/**
 * Check if a pattern exists in the codebase
 * @param {Object} analysisData - Analysis data
 * @param {Array} keywords - Pattern keywords
 * @returns {boolean} Pattern exists
 */
const hasPattern = (analysisData, keywords) => {
  if (!analysisData.files) return false;
  
  const fileNames = analysisData.files.map(f => f.name.toLowerCase());
  return keywords.some(keyword => 
    fileNames.some(name => name.includes(keyword))
  );
};

/**
 * Get file type from filename
 * @param {string} filename - File name
 * @returns {string} File type
 */
const getFileType = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const typeMap = {
    'js': 'javascript',
    'jsx': 'react',
    'ts': 'typescript',
    'tsx': 'react',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'css': 'stylesheet',
    'html': 'markup',
    'json': 'data',
    'md': 'documentation'
  };
  return typeMap[ext] || 'unknown';
};

/**
 * Get language color
 * @param {string} language - Programming language
 * @returns {string} Color hex code
 */
const getLanguageColor = (language) => {
  return LANGUAGE_COLORS[language?.toLowerCase()] || '#888888';
};

/**
 * Get file icon
 * @param {string} filename - File name
 * @param {string} type - File type
 * @returns {string} Icon name
 */
const getFileIcon = (filename, type) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return FILE_TYPE_ICONS[ext] || FILE_TYPE_ICONS[type] || 'file';
};

/**
 * Get filename from path
 * @param {string} path - File path
 * @returns {string} Filename
 */
const getFileName = (path) => {
  return path.split('/').pop() || path;
};

/**
 * Get file category
 * @param {string} path - File path
 * @returns {string} File category
 */
const getFileCategory = (path) => {
  const segments = path.split('/');
  if (segments.includes('src')) return 'source';
  if (segments.includes('test') || segments.includes('tests')) return 'test';
  if (segments.includes('docs')) return 'documentation';
  if (segments.includes('config')) return 'configuration';
  return 'other';
};

/**
 * Generate unique ID
 * @returns {string} Unique identifier
 */
const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Normalize data for consistent processing
 * @param {any} data - Input data
 * @returns {any} Normalized data
 */
export const normalizeData = (data) => {
  if (Array.isArray(data)) {
    return data.map(normalizeData);
  }
  
  if (data && typeof data === 'object') {
    const normalized = {};
    Object.keys(data).forEach(key => {
      normalized[key] = normalizeData(data[key]);
    });
    return normalized;
  }
  
  return data;
};

/**
 * Filter data based on criteria
 * @param {Array} data - Input data array
 * @param {Object} criteria - Filter criteria
 * @returns {Array} Filtered data
 */
export const filterData = (data, criteria) => {
  if (!Array.isArray(data)) return [];
  
  return data.filter(item => {
    return Object.entries(criteria).every(([key, value]) => {
      if (typeof value === 'function') {
        return value(item[key]);
      }
      return item[key] === value;
    });
  });
};

/**
 * Sort data by specified criteria
 * @param {Array} data - Input data array
 * @param {string|Function} criteria - Sort criteria
 * @param {string} order - Sort order ('asc' or 'desc')
 * @returns {Array} Sorted data
 */
export const sortData = (data, criteria, order = 'asc') => {
  if (!Array.isArray(data)) return [];
  
  const sorted = [...data].sort((a, b) => {
    let aVal, bVal;
    
    if (typeof criteria === 'function') {
      aVal = criteria(a);
      bVal = criteria(b);
    } else {
      aVal = a[criteria];
      bVal = b[criteria];
    }
    
    if (typeof aVal === 'string') {
      return order === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    
    return order === 'asc' ? aVal - bVal : bVal - aVal;
  });
  
  return sorted;
};

/**
 * Group data by specified key
 * @param {Array} data - Input data array
 * @param {string|Function} key - Grouping key
 * @returns {Object} Grouped data
 */
export const groupData = (data, key) => {
  if (!Array.isArray(data)) return {};
  
  return data.reduce((groups, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {});
};

export default {
  transformRepoDataForVisualization,
  transformAnalysisDataForUI,
  transformLanguageStats,
  transformFileTreeData,
  transformDependencyData,
  transformMetricsForDashboard,
  transformAIInsights,
  normalizeData,
  filterData,
  sortData,
  groupData
};