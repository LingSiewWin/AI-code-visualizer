/**
 * Dependency Mapper
 * Maps and analyzes dependencies between files, modules, and packages
 * Creates dependency graphs and identifies dependency-related issues
 */

import path from 'path';

class DependencyMapper {
  constructor() {
    this.dependencyGraph = new Map();
    this.packageDependencies = new Map();
    this.fileDependencies = new Map();
    this.circularDependencies = [];
    this.unusedDependencies = [];
    this.analysis = {
      totalDependencies: 0,
      directDependencies: 0,
      devDependencies: 0,
      peerDependencies: 0,
      circularCount: 0,
      unusedCount: 0,
      riskScore: 0
    };
  }

  /**
   * Analyze relationships between files
   * @param {Array} files - File analysis results
   * @returns {Array} Array of relationship objects
   */
  analyzeRelationships(files) {
    const relationships = [];

    files.forEach(file => {
      file.dependencies.forEach(dep => {
        if (dep.type === 'internal') {
          relationships.push({
            from: file.fileName,
            to: dep.target,
            type: 'depends_on',
            strength: 1,
            line: dep.line
          });
        }
      });
    });

    return relationships;
  }

  /**
   * Detect circular dependencies
   * @param {Array} files - File analysis results
   * @returns {Array} Array of circular dependency chains
   */
  detectCircularDependencies(files) {
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];

    const dfs = (fileName, path = []) => {
      if (recursionStack.has(fileName)) {
        // Found a cycle
        const cycleStart = path.indexOf(fileName);
        if (cycleStart !== -1) {
          cycles.push({
            cycle: path.slice(cycleStart).concat(fileName),
            length: path.length - cycleStart + 1,
            severity: path.length - cycleStart > 3 ? 'high' : 'medium'
          });
        }
        return;
      }

      if (visited.has(fileName)) {
        return;
      }

      visited.add(fileName);
      recursionStack.add(fileName);
      path.push(fileName);

      const file = files.find(f => f.fileName === fileName);
      if (file) {
        file.dependencies.forEach(dep => {
          if (dep.type === 'internal') {
            dfs(dep.target, [...path]);
          }
        });
      }

      recursionStack.delete(fileName);
    };

    files.forEach(file => {
      if (!visited.has(file.fileName)) {
        dfs(file.fileName);
      }
    });

    return cycles;
  }

  /**
   * Detect unused dependencies
   * @param {Array} packages - Package analysis results
   * @param {Array} files - File analysis results
   * @returns {Array} Array of unused dependencies
   */
  detectUnusedDependencies(packages, files) {
    const unused = [];
    
    packages.forEach(pkg => {
      const allDependencies = {
        ...pkg.dependencies,
        ...pkg.devDependencies
      };

      Object.keys(allDependencies).forEach(depName => {
        const isUsed = files.some(file => 
          file.imports.some(imp => 
            imp.path === depName || imp.path.startsWith(depName + '/')
          )
        );

        if (!isUsed) {
          unused.push({
            name: depName,
            version: allDependencies[depName],
            package: pkg.name,
            type: pkg.dependencies[depName] ? 'dependency' : 'devDependency'
          });
        }
      });
    });

    return unused;
  }

  /**
   * Detect missing dependencies
   * @param {Array} files - File analysis results
   * @param {Array} packages - Package analysis results
   * @returns {Array} Array of missing dependencies
   */
  detectMissingDependencies(files, packages) {
    const missing = [];
    const declaredDeps = new Set();

    // Collect all declared dependencies
    packages.forEach(pkg => {
      Object.keys(pkg.dependencies || {}).forEach(dep => declaredDeps.add(dep));
      Object.keys(pkg.devDependencies || {}).forEach(dep => declaredDeps.add(dep));
    });

    files.forEach(file => {
      file.dependencies.forEach(dep => {
        if (dep.type === 'external' && !declaredDeps.has(dep.target)) {
          // Check if it's a built-in module
          if (!this.isBuiltInModule(dep.target)) {
            missing.push({
              name: dep.target,
              file: file.fileName,
              line: dep.line,
              severity: 'high'
            });
          }
        }
      });
    });

    return missing;
  }

  /**
   * Calculate dependency metrics
   * @param {Object} analysis - Analysis results
   * @returns {Object} Calculated metrics
   */
  calculateDependencyMetrics(analysis) {
    const metrics = {
      coupling: 0,
      cohesion: 0,
      stability: 0,
      abstractness: 0,
      distance: 0,
      complexity: 0
    };

    if (analysis.files.length === 0) return metrics;

    // Calculate coupling (average fan-out)
    const totalFanOut = analysis.files.reduce((sum, file) => sum + file.metrics.fanOut, 0);
    metrics.coupling = totalFanOut / analysis.files.length;

    // Calculate stability (average instability)
    const totalInstability = analysis.files.reduce((sum, file) => sum + file.metrics.instability, 0);
    metrics.stability = 1 - (totalInstability / analysis.files.length);

    // Calculate complexity based on dependency graph
    metrics.complexity = this.calculateGraphComplexity(analysis.overview.dependencyGraph);

    // Calculate distance from main sequence
    metrics.distance = Math.abs(metrics.abstractness + metrics.stability - 1);

    return metrics;
  }

  /**
   * Calculate graph complexity
   * @param {Object} graph - Dependency graph
   * @returns {number} Complexity score
   */
  calculateGraphComplexity(graph) {
    if (!graph.nodes || graph.nodes.length === 0) return 0;

    const nodeCount = graph.nodes.length;
    const edgeCount = graph.edges ? graph.edges.length : 0;
    
    // Cyclomatic complexity for graphs: E - N + 2P (where P is connected components)
    const connectedComponents = this.countConnectedComponents(graph);
    return Math.max(0, edgeCount - nodeCount + 2 * connectedComponents);
  }

  /**
   * Count connected components in graph
   * @param {Object} graph - Dependency graph
   * @returns {number} Number of connected components
   */
  countConnectedComponents(graph) {
    if (!graph.nodes || graph.nodes.length === 0) return 0;

    const visited = new Set();
    let components = 0;

    const dfs = (nodeId) => {
      visited.add(nodeId);
      const connectedEdges = graph.edges.filter(edge => 
        edge.source === nodeId || edge.target === nodeId
      );
      
      connectedEdges.forEach(edge => {
        const nextNode = edge.source === nodeId ? edge.target : edge.source;
        if (!visited.has(nextNode)) {
          dfs(nextNode);
        }
      });
    };

    graph.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id);
        components++;
      }
    });

    return components;
  }

  /**
   * Assess overall risk
   * @param {Object} analysis - Complete analysis
   * @returns {Object} Risk assessment
   */
  assessRisk(analysis) {
    const risk = {
      overall: 'low',
      score: 0,
      factors: []
    };

    let riskScore = 0;

    // Circular dependencies
    if (analysis.issues.circular.length > 0) {
      riskScore += analysis.issues.circular.length * 10;
      risk.factors.push(`${analysis.issues.circular.length} circular dependencies`);
    }

    // Unused dependencies
    if (analysis.issues.unused.length > 5) {
      riskScore += 15;
      risk.factors.push('Many unused dependencies');
    }

    // Missing dependencies
    if (analysis.issues.missing.length > 0) {
      riskScore += analysis.issues.missing.length * 20;
      risk.factors.push('Missing dependencies detected');
    }

    // High coupling
    if (analysis.metrics.coupling > 10) {
      riskScore += 20;
      risk.factors.push('High coupling detected');
    }

    // Complex dependency graph
    if (analysis.metrics.complexity > 20) {
      riskScore += 15;
      risk.factors.push('Complex dependency structure');
    }

    risk.score = Math.min(100, riskScore);

    if (risk.score < 20) risk.overall = 'low';
    else if (risk.score < 50) risk.overall = 'medium';
    else if (risk.score < 80) risk.overall = 'high';
    else risk.overall = 'critical';

    return risk;
  }

  /**
   * Generate recommendations
   * @param {Object} analysis - Complete analysis
   * @returns {Array} Array of recommendations
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    // Circular dependencies
    if (analysis.issues.circular.length > 0) {
      recommendations.push({
        type: 'refactor',
        priority: 'high',
        title: 'Resolve Circular Dependencies',
        description: `Found ${analysis.issues.circular.length} circular dependencies that should be resolved`,
        action: 'Break circular dependencies by introducing interfaces or moving shared code'
      });
    }

    // Unused dependencies
    if (analysis.issues.unused.length > 0) {
      recommendations.push({
        type: 'cleanup',
        priority: 'medium',
        title: 'Remove Unused Dependencies',
        description: `${analysis.issues.unused.length} unused dependencies can be removed`,
        action: 'Remove unused packages to reduce bundle size and security risks'
      });
    }

    // Missing dependencies
    if (analysis.issues.missing.length > 0) {
      recommendations.push({
        type: 'fix',
        priority: 'high',
        title: 'Add Missing Dependencies',
        description: `${analysis.issues.missing.length} missing dependencies detected`,
        action: 'Add missing dependencies to package.json'
      });
    }

    // High coupling
    if (analysis.metrics.coupling > 8) {
      recommendations.push({
        type: 'architecture',
        priority: 'medium',
        title: 'Reduce Coupling',
        description: 'High coupling detected between modules',
        action: 'Consider using dependency injection or interfaces to reduce coupling'
      });
    }

    // Complex files
    const complexFiles = analysis.files.filter(f => f.metrics.fanOut > 15);
    if (complexFiles.length > 0) {
      recommendations.push({
        type: 'refactor',
        priority: 'medium',
        title: 'Simplify Complex Files',
        description: `${complexFiles.length} files have high fan-out`,
        action: 'Break down complex files into smaller, focused modules'
      });
    }

    return recommendations;
  }

  // Helper methods

  /**
   * Reset analysis state
   */
  reset() {
    this.dependencyGraph.clear();
    this.packageDependencies.clear();
    this.fileDependencies.clear();
    this.circularDependencies = [];
    this.unusedDependencies = [];
  }

  /**
   * Detect programming language from file name
   * @param {string} fileName - File name
   * @returns {string} Programming language
   */
  detectLanguage(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'cs': 'csharp',
      'swift': 'swift',
      'kt': 'kotlin'
    };
    return languageMap[extension] || 'unknown';
  }

  /**
   * Check if file is a code file
   * @param {string} fileName - File name
   * @returns {boolean} True if code file
   */
  isCodeFile(fileName) {
    const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs', 'cs', 'swift', 'kt'];
    const extension = fileName.split('.').pop().toLowerCase();
    return codeExtensions.includes(extension);
  }

  /**
   * Categorize import type
   * @param {string} importPath - Import path
   * @returns {string} Import category
   */
  categorizeImport(importPath) {
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      return 'relative';
    }
    if (importPath.startsWith('/')) {
      return 'absolute';
    }
    if (this.isBuiltInModule(importPath)) {
      return 'builtin';
    }
    return 'external';
  }

  /**
   * Check if import is relative
   * @param {string} importPath - Import path
   * @returns {boolean} True if relative import
   */
  isRelativeImport(importPath) {
    return importPath.startsWith('./') || importPath.startsWith('../');
  }

  /**
   * Categorize export type
   * @param {string} line - Source line
   * @returns {string} Export category
   */
  categorizeExport(line) {
    if (line.includes('default')) return 'default';
    if (line.includes('class')) return 'class';
    if (line.includes('function')) return 'function';
    if (line.includes('const') || line.includes('let') || line.includes('var')) return 'variable';
    return 'unknown';
  }

  /**
   * Resolve possible file paths for relative imports
   * @param {string} importPath - Import path
   * @param {string} currentDir - Current directory
   * @returns {Array} Array of possible file paths
   */
  resolvePossiblePaths(importPath, currentDir) {
    const possiblePaths = [];
    const resolvedPath = path.resolve(currentDir, importPath);
    
    // Try different extensions
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];
    
    possiblePaths.push(resolvedPath);
    extensions.forEach(ext => {
      possiblePaths.push(resolvedPath + ext);
    });
    
    // Try index files
    possiblePaths.push(path.join(resolvedPath, 'index.js'));
    possiblePaths.push(path.join(resolvedPath, 'index.ts'));
    
    return possiblePaths;
  }

  /**
   * Check if module is built-in
   * @param {string} moduleName - Module name
   * @returns {boolean} True if built-in module
   */
  isBuiltInModule(moduleName) {
    const builtInModules = [
      // Node.js built-ins
      'fs', 'path', 'http', 'https', 'url', 'crypto', 'os', 'util', 'events',
      'stream', 'buffer', 'querystring', 'zlib', 'child_process', 'cluster',
      'dns', 'net', 'tls', 'dgram', 'readline', 'repl', 'vm', 'assert',
      // Browser built-ins
      'console', 'window', 'document', 'navigator', 'location', 'history'
    ];
    
    return builtInModules.includes(moduleName);
  }
}

export default DependencyMapper;
   * Analyze repository dependencies
   * @param {Object} repository - Repository data with files and package info
   * @returns {Object} Comprehensive dependency analysis
   */
  analyzeRepository(repository) {
    // Reset analysis state
    this.reset();

    const analysis = {
      overview: {
        totalFiles: 0,
        totalDependencies: 0,
        packageDependencies: {},
        fileDependencies: {},
        dependencyGraph: {},
        riskAssessment: {}
      },
      packages: [],
      files: [],
      relationships: [],
      issues: {
        circular: [],
        unused: [],
        outdated: [],
        security: [],
        missing: []
      },
      metrics: {
        coupling: 0,
        cohesion: 0,
        stability: 0,
        abstractness: 0
      },
      recommendations: []
    };

    // Analyze package.json files
    const packageFiles = repository.files.filter(f => f.name === 'package.json');
    packageFiles.forEach(packageFile => {
      const packageAnalysis = this.analyzePackageFile(packageFile);
      analysis.packages.push(packageAnalysis);
      analysis.overview.packageDependencies = { ...analysis.overview.packageDependencies, ...packageAnalysis.dependencies };
    });

    // Analyze code files for internal dependencies
    const codeFiles = repository.files.filter(f => this.isCodeFile(f.name));
    codeFiles.forEach(file => {
      const fileAnalysis = this.analyzeFileDependencies(file, codeFiles);
      analysis.files.push(fileAnalysis);
    });

    // Build dependency graph
    analysis.overview.dependencyGraph = this.buildDependencyGraph(analysis.files);

    // Analyze relationships
    analysis.relationships = this.analyzeRelationships(analysis.files);

    // Detect issues
    analysis.issues.circular = this.detectCircularDependencies(analysis.files);
    analysis.issues.unused = this.detectUnusedDependencies(analysis.packages, analysis.files);
    analysis.issues.missing = this.detectMissingDependencies(analysis.files, analysis.packages);

    // Calculate metrics
    analysis.metrics = this.calculateDependencyMetrics(analysis);

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);

    // Update overview
    analysis.overview.totalFiles = analysis.files.length;
    analysis.overview.totalDependencies = analysis.relationships.length;
    analysis.overview.riskAssessment = this.assessRisk(analysis);

    return analysis;
  }

  /**
   * Analyze package.json file
   * @param {Object} packageFile - Package.json file object
   * @returns {Object} Package dependency analysis
   */
  analyzePackageFile(packageFile) {
    let packageData;
    try {
      packageData = JSON.parse(packageFile.content);
    } catch (error) {
      return { error: 'Invalid package.json', dependencies: {} };
    }

    const analysis = {
      name: packageData.name || 'unnamed',
      version: packageData.version || '0.0.0',
      dependencies: packageData.dependencies || {},
      devDependencies: packageData.devDependencies || {},
      peerDependencies: packageData.peerDependencies || {},
      optionalDependencies: packageData.optionalDependencies || {},
      scripts: packageData.scripts || {},
      analysis: {
        dependencyCount: Object.keys(packageData.dependencies || {}).length,
        devDependencyCount: Object.keys(packageData.devDependencies || {}).length,
        totalDependencies: 0,
        riskFactors: []
      }
    };

    analysis.analysis.totalDependencies = 
      analysis.analysis.dependencyCount + analysis.analysis.devDependencyCount;

    // Analyze risk factors
    if (analysis.analysis.dependencyCount > 50) {
      analysis.analysis.riskFactors.push('High dependency count');
    }

    // Check for potentially risky dependencies
    const riskyPackages = ['eval', 'vm2', 'node-serialize'];
    Object.keys(analysis.dependencies).forEach(dep => {
      if (riskyPackages.some(risky => dep.includes(risky))) {
        analysis.analysis.riskFactors.push(`Potentially risky dependency: ${dep}`);
      }
    });

    return analysis;
  }

  /**
   * Analyze file dependencies
   * @param {Object} file - File object
   * @param {Array} allFiles - All code files in repository
   * @returns {Object} File dependency analysis
   */
  analyzeFileDependencies(file, allFiles) {
    const analysis = {
      fileName: file.name,
      path: file.path || file.name,
      imports: [],
      exports: [],
      dependencies: [],
      dependents: [],
      language: this.detectLanguage(file.name),
      metrics: {
        fanIn: 0,  // Number of files that depend on this file
        fanOut: 0, // Number of files this file depends on
        instability: 0,
        abstractness: 0
      }
    };

    const content = file.content || '';
    
    // Extract imports/requires based on language
    analysis.imports = this.extractImports(content, analysis.language);
    analysis.exports = this.extractExports(content, analysis.language);

    // Map imports to actual files
    analysis.dependencies = this.mapImportsToFiles(analysis.imports, allFiles, file.path);

    // Calculate metrics
    analysis.metrics.fanOut = analysis.dependencies.length;

    return analysis;
  }

  /**
   * Extract import statements from code
   * @param {string} code - Source code
   * @param {string} language - Programming language
   * @returns {Array} Array of import objects
   */
  extractImports(code, language) {
    const imports = [];
    const lines = code.split('\n');

    let importRegexes = [];
    
    switch (language) {
      case 'javascript':
      case 'typescript':
        importRegexes = [
          /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)?\s*from\s+['"`]([^'"`]+)['"`]/g,
          /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
          /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g
        ];
        break;
      case 'python':
        importRegexes = [
          /from\s+([^\s]+)\s+import/g,
          /import\s+([^\s,]+)/g
        ];
        break;
      case 'java':
        importRegexes = [
          /import\s+(?:static\s+)?([^;]+);/g
        ];
        break;
    }

    lines.forEach((line, lineNumber) => {
      importRegexes.forEach(regex => {
        let match;
        while ((match = regex.exec(line)) !== null) {
          const importPath = match[1];
          if (importPath) {
            imports.push({
              path: importPath,
              line: lineNumber + 1,
              type: this.categorizeImport(importPath),
              isRelative: this.isRelativeImport(importPath)
            });
          }
        }
      });
    });

    return imports;
  }

  /**
   * Extract export statements from code
   * @param {string} code - Source code
   * @param {string} language - Programming language
   * @returns {Array} Array of export objects
   */
  extractExports(code, language) {
    const exports = [];
    const lines = code.split('\n');

    let exportRegexes = [];
    
    switch (language) {
      case 'javascript':
      case 'typescript':
        exportRegexes = [
          /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g,
          /export\s+{\s*([^}]+)\s*}/g,
          /export\s+\*\s+from\s+['"`]([^'"`]+)['"`]/g,
          /module\.exports\s*=\s*(\w+)/g
        ];
        break;
      case 'python':
        exportRegexes = [
          /__all__\s*=\s*\[([^\]]+)\]/g,
          /def\s+(\w+)/g,
          /class\s+(\w+)/g
        ];
        break;
    }

    lines.forEach((line, lineNumber) => {
      exportRegexes.forEach(regex => {
        let match;
        while ((match = regex.exec(line)) !== null) {
          const exportName = match[1];
          if (exportName) {
            exports.push({
              name: exportName.trim(),
              line: lineNumber + 1,
              type: this.categorizeExport(line)
            });
          }
        }
      });
    });

    return exports;
  }

  /**
   * Map import paths to actual files
   * @param {Array} imports - Import statements
   * @param {Array} allFiles - All files in repository
   * @param {string} currentFilePath - Current file path
   * @returns {Array} Mapped dependencies
   */
  mapImportsToFiles(imports, allFiles, currentFilePath) {
    const dependencies = [];
    const currentDir = path.dirname(currentFilePath || '');

    imports.forEach(imp => {
      if (imp.isRelative) {
        // Try to resolve relative imports
        const possiblePaths = this.resolvePossiblePaths(imp.path, currentDir);
        const matchedFile = allFiles.find(file => 
          possiblePaths.some(possiblePath => 
            file.path === possiblePath || file.name === path.basename(possiblePath)
          )
        );

        if (matchedFile) {
          dependencies.push({
            type: 'internal',
            target: matchedFile.name,
            targetPath: matchedFile.path,
            importPath: imp.path,
            line: imp.line
          });
        } else {
          dependencies.push({
            type: 'missing',
            target: imp.path,
            importPath: imp.path,
            line: imp.line
          });
        }
      } else {
        // External dependency
        dependencies.push({
          type: 'external',
          target: imp.path,
          importPath: imp.path,
          line: imp.line
        });
      }
    });

    return dependencies;
  }

  /**
   * Build dependency graph
   * @param {Array} files - File analysis results
   * @returns {Object} Dependency graph structure
   */
  buildDependencyGraph(files) {
    const graph = {
      nodes: [],
      edges: [],
      clusters: []
    };

    // Create nodes for each file
    files.forEach(file => {
      graph.nodes.push({
        id: file.fileName,
        label: file.fileName,
        type: 'file',
        language: file.language,
        fanIn: file.metrics.fanIn,
        fanOut: file.metrics.fanOut,
        size: file.imports.length + file.exports.length
      });
    });

    // Create edges for dependencies
    files.forEach((file, index) => {
      file.dependencies.forEach(dep => {
        if (dep.type === 'internal') {
          graph.edges.push({
            source: file.fileName,
            target: dep.target,
            type: 'dependency',
            weight: 1
          });
        }
      });
    });

    // Calculate fan-in for each file
    files.forEach(file => {
      file.metrics.fanIn = graph.edges.filter(edge => edge.target === file.fileName).length;
      
      // Update node with calculated fan-in
      const node = graph.nodes.find(n => n.id === file.fileName);
      if (node) {
        node.fanIn = file.metrics.fanIn;
        node.instability = file.metrics.fanOut / (file.metrics.fanIn + file.metrics.fanOut + 1);
      }
    });

    return graph;
  }

  /**