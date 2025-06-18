const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class CodeAnalysisService {
  constructor() {
    this.supportedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rb', '.php'];
    this.languageConfigs = {
      javascript: { extensions: ['.js', '.jsx'], parser: 'babel' },
      typescript: { extensions: ['.ts', '.tsx'], parser: 'typescript' },
      python: { extensions: ['.py'], parser: 'python' },
      java: { extensions: ['.java'], parser: 'java' },
      cpp: { extensions: ['.cpp', '.c', '.cc'], parser: 'cpp' },
      csharp: { extensions: ['.cs'], parser: 'csharp' },
      go: { extensions: ['.go'], parser: 'go' },
      ruby: { extensions: ['.rb'], parser: 'ruby' },
      php: { extensions: ['.php'], parser: 'php' }
    };
  }

  /**
   * Analyze repository structure and code quality
   */
  async analyzeRepository(repoPath, options = {}) {
    try {
      logger.info(`Starting analysis of repository: ${repoPath}`);
      
      const startTime = Date.now();
      const analysis = {
        metadata: {
          repoPath,
          analyzedAt: new Date().toISOString(),
          analysisOptions: options
        },
        structure: await this.analyzeStructure(repoPath),
        files: await this.analyzeFiles(repoPath, options),
        dependencies: await this.analyzeDependencies(repoPath),
        metrics: {},
        insights: []
      };

      // Calculate aggregate metrics
      analysis.metrics = this.calculateAggregateMetrics(analysis.files);
      
      // Generate insights
      analysis.insights = this.generateInsights(analysis);
      
      const duration = Date.now() - startTime;
      analysis.metadata.analysisDuration = duration;
      
      logger.info(`Repository analysis completed in ${duration}ms`);
      return analysis;
      
    } catch (error) {
      logger.error('Repository analysis failed:', error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze repository structure
   */
  async analyzeStructure(repoPath) {
    const structure = {
      totalFiles: 0,
      totalLines: 0,
      languages: {},
      directories: {},
      fileTypes: {},
      largestFiles: [],
      deepestNesting: 0
    };

    const scanDirectory = async (dirPath, depth = 0) => {
      try {
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        
        structure.deepestNesting = Math.max(structure.deepestNesting, depth);
        
        for (const item of items) {
          const fullPath = path.join(dirPath, item.name);
          
          if (item.isDirectory()) {
            if (!item.name.startsWith('.') && item.name !== 'node_modules') {
              const relativePath = path.relative(repoPath, fullPath);
              structure.directories[relativePath] = {
                depth,
                files: 0,
                size: 0
              };
              await scanDirectory(fullPath, depth + 1);
            }
          } else if (item.isFile()) {
            const ext = path.extname(item.name).toLowerCase();
            const relativePath = path.relative(repoPath, fullPath);
            
            structure.totalFiles++;
            structure.fileTypes[ext] = (structure.fileTypes[ext] || 0) + 1;
            
            try {
              const stats = await fs.stat(fullPath);
              const language = this.detectLanguage(ext);
              
              if (language) {
                if (!structure.languages[language]) {
                  structure.languages[language] = { files: 0, lines: 0, size: 0 };
                }
                structure.languages[language].files++;
                structure.languages[language].size += stats.size;
                
                // Count lines for supported files
                if (this.supportedExtensions.includes(ext)) {
                  const content = await fs.readFile(fullPath, 'utf-8');
                  const lines = content.split('\n').length;
                  structure.totalLines += lines;
                  structure.languages[language].lines += lines;
                  
                  structure.largestFiles.push({
                    path: relativePath,
                    size: stats.size,
                    lines,
                    language
                  });
                }
              }
            } catch (error) {
              logger.warn(`Could not analyze file ${fullPath}:`, error.message);
            }
          }
        }
      } catch (error) {
        logger.warn(`Could not scan directory ${dirPath}:`, error.message);
      }
    };

    await scanDirectory(repoPath);
    
    // Sort and limit largest files
    structure.largestFiles = structure.largestFiles
      .sort((a, b) => b.lines - a.lines)
      .slice(0, 20);

    return structure;
  }

  /**
   * Analyze individual files
   */
  async analyzeFiles(repoPath, options = {}) {
    const files = [];
    const maxFiles = options.maxFiles || 100;
    let processedFiles = 0;

    const analyzeFile = async (filePath) => {
      if (processedFiles >= maxFiles) return;
      
      try {
        const ext = path.extname(filePath).toLowerCase();
        if (!this.supportedExtensions.includes(ext)) return;

        const content = await fs.readFile(filePath, 'utf-8');
        const relativePath = path.relative(repoPath, filePath);
        const language = this.detectLanguage(ext);

        const analysis = {
          path: relativePath,
          language,
          extension: ext,
          size: content.length,
          lines: content.split('\n').length,
          complexity: await this.analyzeComplexity(content, language),
          quality: this.analyzeQuality(content, language),
          dependencies: this.extractDependencies(content, language),
          functions: this.extractFunctions(content, language),
          classes: this.extractClasses(content, language),
          issues: this.detectIssues(content, language)
        };

        files.push(analysis);
        processedFiles++;
        
      } catch (error) {
        logger.warn(`Could not analyze file ${filePath}:`, error.message);
      }
    };

    const scanForFiles = async (dirPath) => {
      try {
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(dirPath, item.name);
          
          if (item.isDirectory()) {
            if (!item.name.startsWith('.') && item.name !== 'node_modules') {
              await scanForFiles(fullPath);
            }
          } else if (item.isFile()) {
            await analyzeFile(fullPath);
          }
        }
      } catch (error) {
        logger.warn(`Could not scan directory ${dirPath}:`, error.message);
      }
    };

    await scanForFiles(repoPath);
    return files;
  }

  /**
   * Analyze code complexity
   */
  async analyzeComplexity(content, language) {
    const complexity = {
      cyclomatic: 1, // Base complexity
      cognitive: 0,
      nesting: 0,
      functions: 0,
      conditionals: 0,
      loops: 0
    };

    try {
      if (language === 'javascript' || language === 'typescript') {
        const ast = parse(content, {
          sourceType: 'module',
          plugins: ['jsx', 'typescript', 'decorators-legacy']
        });

        let maxNesting = 0;
        let currentNesting = 0;

        traverse(ast, {
          enter(path) {
            currentNesting++;
            maxNesting = Math.max(maxNesting, currentNesting);

            // Cyclomatic complexity
            if (path.isIfStatement() || path.isConditionalExpression()) {
              complexity.cyclomatic++;
              complexity.conditionals++;
              complexity.cognitive++;
            }
            
            if (path.isWhileStatement() || path.isForStatement() || path.isDoWhileStatement()) {
              complexity.cyclomatic++;
              complexity.loops++;
              complexity.cognitive += 2;
            }
            
            if (path.isSwitchCase()) {
              complexity.cyclomatic++;
            }
            
            // Function complexity
            if (path.isFunctionDeclaration() || path.isFunctionExpression() || path.isArrowFunctionExpression()) {
              complexity.functions++;
            }
          },
          exit() {
            currentNesting--;
          }
        });

        complexity.nesting = maxNesting;
      } else {
        // Fallback analysis for other languages using regex
        complexity.cyclomatic += this.countPatterns(content, [
          /\bif\b/g, /\belse\b/g, /\bwhile\b/g, /\bfor\b/g, /\bswitch\b/g, /\bcatch\b/g
        ]);
        complexity.functions = this.countPatterns(content, [/\bfunction\b/g, /\bdef\b/g, /\bvoid\b/g]);
      }
    } catch (error) {
      logger.warn('Complexity analysis failed:', error.message);
    }

    return complexity;
  }

  /**
   * Analyze code quality metrics
   */
  analyzeQuality(content, language) {
    const lines = content.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    const commentLines = lines.filter(line => this.isComment(line, language));

    return {
      linesOfCode: nonEmptyLines.length,
      commentRatio: commentLines.length / nonEmptyLines.length,
      averageLineLength: nonEmptyLines.reduce((sum, line) => sum + line.length, 0) / nonEmptyLines.length,
      longestLine: Math.max(...lines.map(line => line.length)),
      duplicatedLines: this.findDuplicatedLines(lines),
      maintainabilityIndex: this.calculateMaintainabilityIndex(content, language)
    };
  }

  /**
   * Extract dependencies from code
   */
  extractDependencies(content, language) {
    const dependencies = [];

    try {
      if (language === 'javascript' || language === 'typescript') {
        const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
        const requireRegex = /require\(['"`]([^'"`]+)['"`]\)/g;
        
        let match;
        while ((match = importRegex.exec(content)) !== null) {
          dependencies.push({ name: match[1], type: 'import' });
        }
        while ((match = requireRegex.exec(content)) !== null) {
          dependencies.push({ name: match[1], type: 'require' });
        }
      } else if (language === 'python') {
        const importRegex = /^(?:from\s+(\S+)\s+)?import\s+(.+)$/gm;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
          const module = match[1] || match[2].split(',')[0].trim();
          dependencies.push({ name: module, type: 'import' });
        }
      }
    } catch (error) {
      logger.warn('Dependency extraction failed:', error.message);
    }

    return dependencies;
  }

  /**
   * Extract functions from code
   */
  extractFunctions(content, language) {
    const functions = [];

    try {
      if (language === 'javascript' || language === 'typescript') {
        const ast = parse(content, {
          sourceType: 'module',
          plugins: ['jsx', 'typescript', 'decorators-legacy']
        });

        traverse(ast, {
          FunctionDeclaration(path) {
            functions.push({
              name: path.node.id?.name || 'anonymous',
              type: 'function',
              params: path.node.params.length,
              line: path.node.loc?.start.line
            });
          },
          ArrowFunctionExpression(path) {
            const parent = path.parent;
            const name = parent.type === 'VariableDeclarator' ? parent.id.name : 'anonymous';
            functions.push({
              name,
              type: 'arrow',
              params: path.node.params.length,
              line: path.node.loc?.start.line
            });
          }
        });
      }
    } catch (error) {
      logger.warn('Function extraction failed:', error.message);
    }

    return functions;
  }

  /**
   * Extract classes from code
   */
  extractClasses(content, language) {
    const classes = [];

    try {
      if (language === 'javascript' || language === 'typescript') {
        const ast = parse(content, {
          sourceType: 'module',
          plugins: ['jsx', 'typescript', 'decorators-legacy']
        });

        traverse(ast, {
          ClassDeclaration(path) {
            classes.push({
              name: path.node.id?.name || 'anonymous',
              methods: path.node.body.body.filter(node => node.type === 'MethodDefinition').length,
              line: path.node.loc?.start.line
            });
          }
        });
      }
    } catch (error) {
      logger.warn('Class extraction failed:', error.message);
    }

    return classes;
  }

  /**
   * Detect code issues
   */
  detectIssues(content, language) {
    const issues = [];

    // Common issues
    if (content.includes('console.log')) {
      issues.push({ type: 'warning', message: 'Console.log statements found' });
    }
    
    if (content.includes('TODO') || content.includes('FIXME')) {
      issues.push({ type: 'info', message: 'TODO/FIXME comments found' });
    }

    // Long lines
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.length > 120) {
        issues.push({
          type: 'warning',
          message: `Line ${index + 1} exceeds 120 characters`,
          line: index + 1
        });
      }
    });

    return issues;
  }

  /**
   * Analyze dependencies (package.json, requirements.txt, etc.)
   */
  async analyzeDependencies(repoPath) {
    const dependencies = {
      production: {},
      development: {},
      total: 0
    };

    try {
      // JavaScript/Node.js
      const packageJsonPath = path.join(repoPath, 'package.json');
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        if (packageJson.dependencies) {
          Object.assign(dependencies.production, packageJson.dependencies);
        }
        if (packageJson.devDependencies) {
          Object.assign(dependencies.development, packageJson.devDependencies);
        }
      } catch (error) {
        // Package.json not found or invalid
      }

      // Python
      const requirementsPath = path.join(repoPath, 'requirements.txt');
      try {
        const requirements = await fs.readFile(requirementsPath, 'utf-8');
        requirements.split('\n').forEach(line => {
          const dep = line.trim().split('==')[0].split('>=')[0].split('<=')[0];
          if (dep) {
            dependencies.production[dep] = line.trim();
          }
        });
      } catch (error) {
        // Requirements.txt not found
      }

      dependencies.total = Object.keys(dependencies.production).length + Object.keys(dependencies.development).length;
    } catch (error) {
      logger.warn('Dependency analysis failed:', error.message);
    }

    return dependencies;
  }

  /**
   * Calculate aggregate metrics
   */
  calculateAggregateMetrics(files) {
    const metrics = {
      totalFiles: files.length,
      totalLines: 0,
      totalComplexity: 0,
      averageComplexity: 0,
      totalFunctions: 0,
      averageQuality: 0,
      languages: {},
      riskScore: 0
    };

    files.forEach(file => {
      metrics.totalLines += file.lines;
      metrics.totalComplexity += file.complexity.cyclomatic;
      metrics.totalFunctions += file.functions.length;

      if (!metrics.languages[file.language]) {
        metrics.languages[file.language] = { files: 0, lines: 0, complexity: 0 };
      }
      metrics.languages[file.language].files++;
      metrics.languages[file.language].lines += file.lines;
      metrics.languages[file.language].complexity += file.complexity.cyclomatic;
    });

    if (files.length > 0) {
      metrics.averageComplexity = metrics.totalComplexity / files.length;
      metrics.averageQuality = files.reduce((sum, file) => sum + file.quality.maintainabilityIndex, 0) / files.length;
    }

    // Calculate risk score (0-100)
    metrics.riskScore = Math.min(100, Math.max(0, 
      (metrics.averageComplexity * 10) + 
      (metrics.totalLines / 1000) + 
      (files.filter(f => f.issues.some(i => i.type === 'error')).length * 20)
    ));

    return metrics;
  }

  /**
   * Generate insights
   */
  generateInsights(analysis) {
    const insights = [];

    // High complexity files
    const highComplexityFiles = analysis.files.filter(f => f.complexity.cyclomatic > 10);
    if (highComplexityFiles.length > 0) {
      insights.push({
        type: 'warning',
        category: 'complexity',
        message: `${highComplexityFiles.length} files have high cyclomatic complexity`,
        details: highComplexityFiles.map(f => f.path)
      });
    }

    // Large files
    const largeFiles = analysis.files.filter(f => f.lines > 500);
    if (largeFiles.length > 0) {
      insights.push({
        type: 'info',
        category: 'maintainability',
        message: `${largeFiles.length} files are quite large (>500 lines)`,
        details: largeFiles.map(f => `${f.path} (${f.lines} lines)`)
      });
    }

    // Test coverage suggestion
    const testFiles = analysis.files.filter(f => f.path.includes('test') || f.path.includes('spec'));
    const sourceFiles = analysis.files.filter(f => !f.path.includes('test') && !f.path.includes('spec'));
    const testRatio = testFiles.length / sourceFiles.length;
    
    if (testRatio < 0.3) {
      insights.push({
        type: 'suggestion',
        category: 'testing',
        message: 'Consider adding more test files to improve code coverage',
        details: [`Test ratio: ${(testRatio * 100).toFixed(1)}%`]
      });
    }

    return insights;
  }

  // Helper methods
  detectLanguage(extension) {
    for (const [lang, config] of Object.entries(this.languageConfigs)) {
      if (config.extensions.includes(extension)) {
        return lang;
      }
    }
    return 'unknown';
  }

  countPatterns(content, patterns) {
    return patterns.reduce((count, pattern) => {
      const matches = content.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  isComment(line, language) {
    const trimmed = line.trim();
    const commentPrefixes = {
      javascript: ['//', '/*', '*'],
      typescript: ['//', '/*', '*'],
      python: ['#'],
      java: ['//', '/*', '*'],
      cpp: ['//', '/*', '*'],
      csharp: ['//', '/*', '*'],
      go: ['//', '/*', '*'],
      ruby: ['#'],
      php: ['//', '#', '/*', '*']
    };

    const prefixes = commentPrefixes[language] || [];
    return prefixes.some(prefix => trimmed.startsWith(prefix));
  }

  findDuplicatedLines(lines) {
    const lineMap = new Map();
    let duplicated = 0;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.length > 10) { // Only count substantial lines
        lineMap.set(trimmed, (lineMap.get(trimmed) || 0) + 1);
      }
    });

    lineMap.forEach(count => {
      if (count > 1) {
        duplicated += count - 1;
      }
    });

    return duplicated;
  }

  calculateMaintainabilityIndex(content, language) {
    // Simplified maintainability index calculation
    const lines = content.split('\n').filter(line => line.trim().length > 0).length;
    const complexity = Math.max(1, content.split(/\bif\b|\bfor\b|\bwhile\b/).length - 1);
    const commentRatio = content.split('\n').filter(line => this.isComment(line, language)).length / lines;
    
    // Formula: 171 - 5.2 * ln(Halstead Volume) - 0.23 * (Cyclomatic Complexity) - 16.2 * ln(Lines of Code) + 50 * sin(sqrt(2.4 * perCM))
    // Simplified version
    const index = Math.max(0, Math.min(100, 
      100 - (complexity * 5) - (lines / 10) + (commentRatio * 30)
    ));
    
    return Math.round(index);
  }
}

module.exports = CodeAnalysisService;