/**
 * AI Analyzer Service
 * Provides AI-powered code analysis, insights, and recommendations
 */

class AIAnalyzerService {
    constructor() {
      this.analysisCache = new Map();
      this.supportedLanguages = [
        'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp',
        'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'scala', 'html', 'css'
      ];
    }
  
    /**
     * Detect programming language from file extension
     */
    detectLanguage(filePath) {
      const extension = filePath.split('.').pop().toLowerCase();
      const languageMap = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'py': 'python',
        'java': 'java',
        'cpp': 'cpp',
        'cc': 'cpp',
        'c': 'c',
        'cs': 'csharp',
        'go': 'go',
        'rs': 'rust',
        'php': 'php',
        'rb': 'ruby',
        'swift': 'swift',
        'kt': 'kotlin',
        'scala': 'scala',
        'html': 'html',
        'css': 'css',
        'scss': 'css',
        'sass': 'css'
      };
      return languageMap[extension] || 'unknown';
    }
  
    /**
     * Calculate cyclomatic complexity for code
     */
    calculateCyclomaticComplexity(code, language) {
      const complexityPatterns = {
        javascript: [
          /\bif\s*\(/g,
          /\belse\s+if\s*\(/g,
          /\bwhile\s*\(/g,
          /\bfor\s*\(/g,
          /\bswitch\s*\(/g,
          /\bcase\s+/g,
          /\bcatch\s*\(/g,
          /\b&&\b/g,
          /\b\|\|\b/g,
          /\?\s*.*\s*:/g
        ],
        python: [
          /\bif\s+/g,
          /\belif\s+/g,
          /\bwhile\s+/g,
          /\bfor\s+/g,
          /\btry\s*:/g,
          /\bexcept\s/g,
          /\band\b/g,
          /\bor\b/g
        ],
        java: [
          /\bif\s*\(/g,
          /\belse\s+if\s*\(/g,
          /\bwhile\s*\(/g,
          /\bfor\s*\(/g,
          /\bswitch\s*\(/g,
          /\bcase\s+/g,
          /\bcatch\s*\(/g,
          /\b&&\b/g,
          /\b\|\|\b/g,
          /\?\s*.*\s*:/g
        ]
      };
  
      const patterns = complexityPatterns[language] || complexityPatterns.javascript;
      let complexity = 1; // Base complexity
  
      patterns.forEach(pattern => {
        const matches = code.match(pattern);
        if (matches) {
          complexity += matches.length;
        }
      });
  
      return complexity;
    }
  
    /**
     * Count lines of code (excluding comments and empty lines)
     */
    countLinesOfCode(code, language) {
      const lines = code.split('\n');
      let loc = 0;
      let commentLines = 0;
      let emptyLines = 0;
  
      const commentPatterns = {
        javascript: [/^\s*\/\//, /^\s*\/\*/, /^\s*\*/],
        python: [/^\s*#/],
        java: [/^\s*\/\//, /^\s*\/\*/, /^\s*\*/],
        css: [/^\s*\/\*/, /^\s*\*/]
      };
  
      const patterns = commentPatterns[language] || commentPatterns.javascript;
  
      lines.forEach(line => {
        const trimmedLine = line.trim();
        
        if (trimmedLine === '') {
          emptyLines++;
        } else if (patterns.some(pattern => pattern.test(trimmedLine))) {
          commentLines++;
        } else {
          loc++;
        }
      });
  
      return {
        totalLines: lines.length,
        linesOfCode: loc,
        commentLines,
        emptyLines
      };
    }
  
    /**
     * Extract functions/methods from code
     */
    extractFunctions(code, language) {
      const functionPatterns = {
        javascript: [
          /function\s+(\w+)\s*\(/g,
          /(\w+)\s*:\s*function\s*\(/g,
          /(\w+)\s*=\s*\([^)]*\)\s*=>/g,
          /(\w+)\s*\([^)]*\)\s*{/g
        ],
        python: [
          /def\s+(\w+)\s*\(/g
        ],
        java: [
          /(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\(/g
        ]
      };
  
      const patterns = functionPatterns[language] || functionPatterns.javascript;
      const functions = [];
  
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(code)) !== null) {
          functions.push({
            name: match[1],
            line: code.substring(0, match.index).split('\n').length
          });
        }
      });
  
      return functions;
    }
  
    /**
     * Extract import/dependency information
     */
    extractDependencies(code, language) {
      const dependencyPatterns = {
        javascript: [
          /import\s+.*\s+from\s+['"`]([^'"`]+)['"`]/g,
          /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g
        ],
        python: [
          /from\s+(\w+(?:\.\w+)*)\s+import/g,
          /import\s+(\w+(?:\.\w+)*)/g
        ],
        java: [
          /import\s+([\w.]+);/g
        ]
      };
  
      const patterns = dependencyPatterns[language] || dependencyPatterns.javascript;
      const dependencies = new Set();
  
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(code)) !== null) {
          dependencies.add(match[1]);
        }
      });
  
      return Array.from(dependencies);
    }
  
    /**
     * Analyze code structure and patterns
     */
    analyzeCodeStructure(code, language, filePath) {
      const cacheKey = `${filePath}-${code.length}`;
      if (this.analysisCache.has(cacheKey)) {
        return this.analysisCache.get(cacheKey);
      }
  
      const analysis = {
        filePath,
        language,
        metrics: this.countLinesOfCode(code, language),
        complexity: this.calculateCyclomaticComplexity(code, language),
        functions: this.extractFunctions(code, language),
        dependencies: this.extractDependencies(code, language),
        patterns: this.detectCodePatterns(code, language),
        quality: this.assessCodeQuality(code, language)
      };
  
      this.analysisCache.set(cacheKey, analysis);
      return analysis;
    }
  
    /**
     * Detect common code patterns and anti-patterns
     */
    detectCodePatterns(code, language) {
      const patterns = {
        designPatterns: [],
        antiPatterns: [],
        bestPractices: []
      };
  
      // Design Patterns Detection
      if (code.includes('new ') && code.includes('.getInstance')) {
        patterns.designPatterns.push('Singleton');
      }
      if (code.includes('Observer') || code.includes('addEventListener')) {
        patterns.designPatterns.push('Observer');
      }
      if (code.includes('Factory') && code.includes('create')) {
        patterns.designPatterns.push('Factory');
      }
  
      // Anti-patterns Detection
      if (code.split('\n').some(line => line.length > 120)) {
        patterns.antiPatterns.push('Long Lines');
      }
      if (this.calculateCyclomaticComplexity(code, language) > 15) {
        patterns.antiPatterns.push('High Complexity');
      }
      if (code.includes('TODO') || code.includes('FIXME')) {
        patterns.antiPatterns.push('Technical Debt');
      }
  
      // Best Practices
      if (code.includes('const ') || code.includes('let ')) {
        patterns.bestPractices.push('Modern Variable Declarations');
      }
      if (code.includes('async ') && code.includes('await ')) {
        patterns.bestPractices.push('Async/Await Usage');
      }
  
      return patterns;
    }
  
    /**
     * Assess overall code quality
     */
    assessCodeQuality(code, language) {
      let score = 100;
      const issues = [];
  
      const metrics = this.countLinesOfCode(code, language);
      const complexity = this.calculateCyclomaticComplexity(code, language);
  
      // Complexity penalty
      if (complexity > 20) {
        score -= 30;
        issues.push('Very high cyclomatic complexity');
      } else if (complexity > 10) {
        score -= 15;
        issues.push('High cyclomatic complexity');
      }
  
      // Long function penalty
      if (metrics.linesOfCode > 100) {
        score -= 20;
        issues.push('Very long function/file');
      } else if (metrics.linesOfCode > 50) {
        score -= 10;
        issues.push('Long function/file');
      }
  
      // Comment ratio
      const commentRatio = metrics.commentLines / metrics.totalLines;
      if (commentRatio < 0.1) {
        score -= 15;
        issues.push('Insufficient comments');
      } else if (commentRatio > 0.1 && commentRatio < 0.3) {
        score += 5; // Bonus for good commenting
      }
  
      // Long lines penalty
      const longLines = code.split('\n').filter(line => line.length > 120).length;
      if (longLines > 0) {
        score -= Math.min(longLines * 2, 20);
        issues.push('Lines too long');
      }
  
      return {
        score: Math.max(0, Math.min(100, score)),
        grade: this.getQualityGrade(score),
        issues,
        recommendations: this.getRecommendations(issues)
      };
    }
  
    /**
     * Convert quality score to letter grade
     */
    getQualityGrade(score) {
      if (score >= 90) return 'A';
      if (score >= 80) return 'B';
      if (score >= 70) return 'C';
      if (score >= 60) return 'D';
      return 'F';
    }
  
    /**
     * Generate recommendations based on issues
     */
    getRecommendations(issues) {
      const recommendations = [];
  
      if (issues.includes('Very high cyclomatic complexity')) {
        recommendations.push('Break down complex functions into smaller, more focused functions');
      }
      if (issues.includes('Very long function/file')) {
        recommendations.push('Consider splitting large files/functions into smaller modules');
      }
      if (issues.includes('Insufficient comments')) {
        recommendations.push('Add more documentation and inline comments');
      }
      if (issues.includes('Lines too long')) {
        recommendations.push('Keep line length under 120 characters for better readability');
      }
  
      return recommendations;
    }
  
    /**
     * Analyze repository structure and architecture
     */
    analyzeRepositoryArchitecture(files, fileContents) {
      const architecture = {
        structure: 'Unknown',
        patterns: [],
        technologies: new Set(),
        frameworks: new Set(),
        buildTools: new Set(),
        testFrameworks: new Set()
      };
  
      // Detect project structure
      const hasPackageJson = files.some(f => f.path === 'package.json');
      const hasSrcFolder = files.some(f => f.path.startsWith('src/'));
      const hasPublicFolder = files.some(f => f.path.startsWith('public/'));
      const hasComponents = files.some(f => f.path.includes('components'));
  
      if (hasPackageJson && hasSrcFolder && hasComponents) {
        architecture.structure = 'React/Modern Frontend';
      } else if (hasPackageJson) {
        architecture.structure = 'Node.js Project';
      } else if (files.some(f => f.path === 'requirements.txt' || f.path === 'setup.py')) {
        architecture.structure = 'Python Project';
      } else if (files.some(f => f.path === 'pom.xml' || f.path.endsWith('.gradle'))) {
        architecture.structure = 'Java Project';
      }
  
      // Analyze file contents for technologies
      Object.entries(fileContents).forEach(([filePath, { content }]) => {
        if (!content) return;
  
        // Framework detection
        if (content.includes('React') || content.includes('jsx')) {
          architecture.frameworks.add('React');
        }
        if (content.includes('Vue') || content.includes('.vue')) {
          architecture.frameworks.add('Vue.js');
        }
        if (content.includes('Angular') || content.includes('@angular')) {
          architecture.frameworks.add('Angular');
        }
        if (content.includes('express')) {
          architecture.frameworks.add('Express.js');
        }
  
        // Build tools
        if (filePath.includes('webpack') || content.includes('webpack')) {
          architecture.buildTools.add('Webpack');
        }
        if (filePath.includes('vite') || content.includes('vite')) {
          architecture.buildTools.add('Vite');
        }
        if (content.includes('babel')) {
          architecture.buildTools.add('Babel');
        }
  
        // Test frameworks
        if (content.includes('jest') || content.includes('describe(')) {
          architecture.testFrameworks.add('Jest');
        }
        if (content.includes('mocha') || content.includes('chai')) {
          architecture.testFrameworks.add('Mocha/Chai');
        }
      });
  
      return {
        ...architecture,
        technologies: Array.from(architecture.technologies),
        frameworks: Array.from(architecture.frameworks),
        buildTools: Array.from(architecture.buildTools),
        testFrameworks: Array.from(architecture.testFrameworks)
      };
    }
  
    /**
     * Generate comprehensive repository insights
     */
    generateRepositoryInsights(repositoryData) {
      const { repository, languages, contributors, files, fileContents } = repositoryData;
      
      // Analyze all available file contents
      const codeAnalyses = [];
      Object.entries(fileContents).forEach(([filePath, { content, success }]) => {
        if (success && content) {
          const language = this.detectLanguage(filePath);
          if (this.supportedLanguages.includes(language)) {
            codeAnalyses.push(this.analyzeCodeStructure(content, language, filePath));
          }
        }
      });
  
      // Calculate aggregate metrics
      const totalMetrics = codeAnalyses.reduce((acc, analysis) => {
        acc.totalLines += analysis.metrics.totalLines;
        acc.linesOfCode += analysis.metrics.linesOfCode;
        acc.commentLines += analysis.metrics.commentLines;
        acc.functions += analysis.functions.length;
        acc.totalComplexity += analysis.complexity;
        return acc;
      }, { totalLines: 0, linesOfCode: 0, commentLines: 0, functions: 0, totalComplexity: 0 });
  
      const averageComplexity = codeAnalyses.length > 0 
        ? totalMetrics.totalComplexity / codeAnalyses.length 
        : 0;
  
      const averageQuality = codeAnalyses.length > 0
        ? codeAnalyses.reduce((sum, analysis) => sum + analysis.quality.score, 0) / codeAnalyses.length
        : 0;
  
      // Architecture analysis
      const architecture = this.analyzeRepositoryArchitecture(files, fileContents);
  
      // Generate insights
      const insights = {
        overview: {
          name: repository.name,
          description: repository.description,
          language: repository.language,
          size: repository.size,
          stars: repository.stargazers_count,
          forks: repository.forks_count,
          issues: repository.open_issues_count,
          lastUpdate: repository.updated_at
        },
        codeMetrics: {
          ...totalMetrics,
          averageComplexity: Math.round(averageComplexity * 100) / 100,
          averageQuality: Math.round(averageQuality * 100) / 100,
          commentRatio: totalMetrics.totalLines > 0 
            ? Math.round((totalMetrics.commentLines / totalMetrics.totalLines) * 10000) / 100 
            : 0
        },
        languages: Object.entries(languages).map(([lang, bytes]) => ({
          name: lang,
          bytes,
          percentage: Math.round((bytes / Object.values(languages).reduce((a, b) => a + b, 0)) * 10000) / 100
        })).sort((a, b) => b.percentage - a.percentage),
        architecture,
        qualityAnalysis: {
          overallGrade: this.getQualityGrade(averageQuality),
          fileAnalyses: codeAnalyses.map(analysis => ({
            file: analysis.filePath,
            quality: analysis.quality,
            complexity: analysis.complexity,
            linesOfCode: analysis.metrics.linesOfCode
          })).sort((a, b) => b.complexity - a.complexity),
          commonIssues: this.getCommonIssues(codeAnalyses),
          recommendations: this.getProjectRecommendations(codeAnalyses, architecture)
        },
        contributors: contributors.slice(0, 10).map(contributor => ({
          login: contributor.login,
          contributions: contributor.contributions,
          avatar: contributor.avatar_url
        }))
      };
  
      return insights;
    }
  
    /**
     * Get common issues across the codebase
     */
    getCommonIssues(codeAnalyses) {
      const issueCount = {};
      
      codeAnalyses.forEach(analysis => {
        analysis.quality.issues.forEach(issue => {
          issueCount[issue] = (issueCount[issue] || 0) + 1;
        });
      });
  
      return Object.entries(issueCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([issue, count]) => ({ issue, count }));
    }
  
    /**
     * Generate project-level recommendations
     */
    getProjectRecommendations(codeAnalyses, architecture) {
      const recommendations = [];
  
      const highComplexityFiles = codeAnalyses.filter(a => a.complexity > 15).length;
      if (highComplexityFiles > 0) {
        recommendations.push(`Refactor ${highComplexityFiles} files with high complexity`);
      }
  
      const lowQualityFiles = codeAnalyses.filter(a => a.quality.score < 70).length;
      if (lowQualityFiles > 0) {
        recommendations.push(`Improve code quality in ${lowQualityFiles} files`);
      }
  
      if (architecture.testFrameworks.length === 0) {
        recommendations.push('Consider adding automated testing framework');
      }
  
      if (architecture.buildTools.length === 0 && architecture.structure.includes('Frontend')) {
        recommendations.push('Consider adding a modern build tool like Vite or Webpack');
      }
  
      const averageComplexity = codeAnalyses.reduce((sum, a) => sum + a.complexity, 0) / codeAnalyses.length;
      if (averageComplexity > 10) {
        recommendations.push('Focus on reducing overall code complexity');
      }
  
      return recommendations;
    }
  
    /**
     * Generate 3D visualization data for repository structure
     */
    generateVisualizationData(repositoryData, insights) {
      const { files } = repositoryData;
      const { languages, codeMetrics } = insights;
  
      // Create hierarchical structure for 3D visualization
      const visualizationData = {
        nodes: [],
        edges: [],
        clusters: [],
        metadata: {
          totalFiles: files.length,
          totalSize: codeMetrics.linesOfCode,
          complexity: codeMetrics.averageComplexity
        }
      };
  
      // Group files by directory
      const directoryStructure = {};
      files.forEach(file => {
        const pathParts = file.path.split('/');
        let currentLevel = directoryStructure;
        
        pathParts.forEach((part, index) => {
          if (index === pathParts.length - 1) {
            // It's a file
            currentLevel[part] = {
              type: 'file',
              path: file.path,
              size: file.size || 100,
              language: this.detectLanguage(file.path)
            };
          } else {
            // It's a directory
            if (!currentLevel[part]) {
              currentLevel[part] = { type: 'directory', children: {} };
            }
            currentLevel = currentLevel[part].children;
          }
        });
      });
  
      // Convert directory structure to nodes
      let nodeId = 0;
      const createNodes = (structure, parentId = null, depth = 0, pathPrefix = '') => {
        Object.entries(structure).forEach(([name, item]) => {
          const currentNodeId = nodeId++;
          const fullPath = pathPrefix ? `${pathPrefix}/${name}` : name;
          
          const node = {
            id: currentNodeId,
            name,
            path: fullPath,
            type: item.type,
            parentId,
            depth,
            size: item.size || 50,
            language: item.language || 'unknown',
            position: this.calculateNodePosition(currentNodeId, depth, parentId),
            color: this.getLanguageColor(item.language || 'unknown'),
            complexity: item.complexity || 1
          };
  
          visualizationData.nodes.push(node);
  
          // Create edge to parent
          if (parentId !== null) {
            visualizationData.edges.push({
              id: `edge-${parentId}-${currentNodeId}`,
              source: parentId,
              target: currentNodeId,
              type: 'hierarchy'
            });
          }
  
          // Recursively create child nodes
          if (item.type === 'directory' && item.children) {
            createNodes(item.children, currentNodeId, depth + 1, fullPath);
          }
        });
      };
  
      createNodes(directoryStructure);
  
      // Create language clusters
      languages.forEach((lang, index) => {
        visualizationData.clusters.push({
          id: `cluster-${lang.name}`,
          name: lang.name,
          color: this.getLanguageColor(lang.name),
          size: lang.percentage,
          nodes: visualizationData.nodes.filter(node => node.language === lang.name.toLowerCase())
        });
      });
  
      return visualizationData;
    }
  
    /**
     * Calculate 3D position for nodes
     */
    calculateNodePosition(nodeId, depth, parentId) {
      const radius = depth * 50 + 100;
      const angle = (nodeId * 137.5) * (Math.PI / 180); // Golden angle
      
      return {
        x: Math.cos(angle) * radius,
        y: (depth - 2) * 80,
        z: Math.sin(angle) * radius
      };
    }
  
    /**
     * Get color scheme for different programming languages
     */
    getLanguageColor(language) {
      const colorMap = {
        javascript: '#f7df1e',
        typescript: '#3178c6',
        python: '#3776ab',
        java: '#ed8b00',
        cpp: '#00599c',
        c: '#a8b9cc',
        csharp: '#239120',
        go: '#00add8',
        rust: '#dea584',
        php: '#777bb4',
        ruby: '#cc342d',
        swift: '#fa7343',
        kotlin: '#7f52ff',
        scala: '#dc322f',
        html: '#e34f26',
        css: '#1572b6',
        unknown: '#6c757d'
      };
      
      return colorMap[language.toLowerCase()] || colorMap.unknown;
    }
  
    /**
     * Generate AI-powered suggestions for code improvement
     */
    generateAIRecommendations(insights) {
      const recommendations = [];
      const { codeMetrics, qualityAnalysis, architecture } = insights;
  
      // Performance recommendations
      if (codeMetrics.averageComplexity > 15) {
        recommendations.push({
          type: 'performance',
          priority: 'high',
          title: 'Reduce Code Complexity',
          description: 'Several files have high cyclomatic complexity. Consider refactoring complex functions.',
          impact: 'Improved maintainability and reduced bug potential',
          effort: 'medium'
        });
      }
  
      // Architecture recommendations
      if (architecture.testFrameworks.length === 0) {
        recommendations.push({
          type: 'architecture',
          priority: 'high',
          title: 'Add Testing Framework',
          description: 'No testing framework detected. Adding tests will improve code reliability.',
          impact: 'Better code quality and confidence in deployments',
          effort: 'high'
        });
      }
  
      // Code quality recommendations
      if (codeMetrics.commentRatio < 10) {
        recommendations.push({
          type: 'quality',
          priority: 'medium',
          title: 'Improve Documentation',
          description: 'Low comment ratio detected. Adding more documentation will help with maintenance.',
          impact: 'Better code understanding and team collaboration',
          effort: 'low'
        });
      }
  
      // Security recommendations
      if (architecture.frameworks.includes('React') && !architecture.buildTools.includes('ESLint')) {
        recommendations.push({
          type: 'security',
          priority: 'medium',
          title: 'Add Code Linting',
          description: 'ESLint not detected. Linting helps catch potential security issues and bugs.',
          impact: 'Reduced security vulnerabilities and improved code consistency',
          effort: 'low'
        });
      }
  
      // Modernization recommendations
      if (architecture.structure === 'Node.js Project' && !architecture.frameworks.length) {
        recommendations.push({
          type: 'modernization',
          priority: 'low',
          title: 'Consider Modern Framework',
          description: 'Project could benefit from a modern framework for better structure.',
          impact: 'Improved development speed and maintainability',
          effort: 'high'
        });
      }
  
      return recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    }
  
    /**
     * Clear analysis cache
     */
    clearCache() {
      this.analysisCache.clear();
    }
  
    /**
     * Get cache statistics
     */
    getCacheStats() {
      return {
        size: this.analysisCache.size,
        keys: Array.from(this.analysisCache.keys())
      };
    }
  }
  
  // Export singleton instance
  const aiAnalyzer = new AIAnalyzerService();
  export default aiAnalyzer;