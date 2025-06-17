/**
 * Code Complexity Analyzer
 * Analyzes code complexity metrics including cyclomatic complexity,
 * cognitive complexity, and maintainability index
 */

// Language-specific complexity patterns
const COMPLEXITY_PATTERNS = {
    javascript: {
      conditionals: /\b(if|else|switch|case|while|for|do|catch|&&|\|\||\?)/g,
      functions: /\b(function|=>|async|class)/g,
      loops: /\b(for|while|do|forEach|map|filter|reduce)/g,
      branches: /\b(if|else|case|default|catch|finally)/g,
      operators: /(\+\+|--|&&|\|\||==|!=|===|!==|<=|>=|<|>)/g,
    },
    python: {
      conditionals: /\b(if|elif|else|while|for|try|except|and|or|not)/g,
      functions: /\b(def|class|lambda|async|await)/g,
      loops: /\b(for|while|map|filter|reduce|comprehension)/g,
      branches: /\b(if|elif|else|except|finally)/g,
      operators: /(\+\+|--|and|or|==|!=|<=|>=|<|>|is|in)/g,
    },
    java: {
      conditionals: /\b(if|else|switch|case|while|for|do|catch|&&|\|\||instanceof)/g,
      functions: /\b(public|private|protected|static|class|interface|method)/g,
      loops: /\b(for|while|do|forEach|stream)/g,
      branches: /\b(if|else|case|default|catch|finally)/g,
      operators: /(\+\+|--|&&|\|\||==|!=|<=|>=|<|>)/g,
    },
    // Add more languages as needed
  };
  
  class ComplexityAnalyzer {
    constructor() {
      this.metrics = {
        cyclomaticComplexity: 0,
        cognitiveComplexity: 0,
        maintainabilityIndex: 0,
        linesOfCode: 0,
        functions: [],
        classes: [],
        files: []
      };
    }
  
    /**
     * Analyze repository complexity
     * @param {Object} repository - Repository data with files and content
     * @returns {Object} Comprehensive complexity analysis
     */
    analyzeRepository(repository) {
      const analysis = {
        overall: {
          cyclomaticComplexity: 0,
          cognitiveComplexity: 0,
          maintainabilityIndex: 0,
          totalLinesOfCode: 0,
          averageComplexity: 0,
          riskLevel: 'low'
        },
        files: [],
        functions: [],
        classes: [],
        hotspots: [],
        recommendations: []
      };
  
      // Analyze each file
      repository.files.forEach(file => {
        if (this.isCodeFile(file.name)) {
          const fileAnalysis = this.analyzeFile(file);
          analysis.files.push(fileAnalysis);
          
          // Aggregate metrics
          analysis.overall.cyclomaticComplexity += fileAnalysis.cyclomaticComplexity;
          analysis.overall.cognitiveComplexity += fileAnalysis.cognitiveComplexity;
          analysis.overall.totalLinesOfCode += fileAnalysis.linesOfCode;
          
          // Collect functions and classes
          analysis.functions.push(...fileAnalysis.functions);
          analysis.classes.push(...fileAnalysis.classes);
        }
      });
  
      // Calculate derived metrics
      analysis.overall.averageComplexity = analysis.files.length > 0 
        ? analysis.overall.cyclomaticComplexity / analysis.files.length 
        : 0;
  
      analysis.overall.maintainabilityIndex = this.calculateMaintainabilityIndex(
        analysis.overall.cyclomaticComplexity,
        analysis.overall.totalLinesOfCode,
        analysis.functions.length
      );
  
      analysis.overall.riskLevel = this.determineRiskLevel(analysis.overall.cyclomaticComplexity);
  
      // Identify complexity hotspots
      analysis.hotspots = this.identifyHotspots(analysis.files, analysis.functions);
  
      // Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis);
  
      return analysis;
    }
  
    /**
     * Analyze individual file complexity
     * @param {Object} file - File object with name and content
     * @returns {Object} File complexity analysis
     */
    analyzeFile(file) {
      const language = this.detectLanguage(file.name);
      const content = file.content || '';
      const lines = content.split('\n');
  
      const analysis = {
        fileName: file.name,
        language,
        linesOfCode: this.countLinesOfCode(lines),
        cyclomaticComplexity: this.calculateCyclomaticComplexity(content, language),
        cognitiveComplexity: this.calculateCognitiveComplexity(content, language),
        maintainabilityIndex: 0,
        functions: this.extractFunctions(content, language),
        classes: this.extractClasses(content, language),
        complexity: 'low',
        issues: []
      };
  
      analysis.maintainabilityIndex = this.calculateMaintainabilityIndex(
        analysis.cyclomaticComplexity,
        analysis.linesOfCode,
        analysis.functions.length
      );
  
      analysis.complexity = this.categorizeComplexity(analysis.cyclomaticComplexity);
      analysis.issues = this.identifyIssues(analysis);
  
      return analysis;
    }
  
    /**
     * Calculate cyclomatic complexity
     * @param {string} code - Source code
     * @param {string} language - Programming language
     * @returns {number} Cyclomatic complexity score
     */
    calculateCyclomaticComplexity(code, language) {
      const patterns = COMPLEXITY_PATTERNS[language] || COMPLEXITY_PATTERNS.javascript;
      let complexity = 1; // Base complexity
  
      // Count decision points
      const conditionals = (code.match(patterns.conditionals) || []).length;
      const loops = (code.match(patterns.loops) || []).length;
      
      complexity += conditionals + loops;
  
      // Additional complexity for nested structures
      const nestingLevel = this.calculateNestingLevel(code);
      complexity += Math.floor(nestingLevel / 2);
  
      return Math.max(complexity, 1);
    }
  
    /**
     * Calculate cognitive complexity (more human-friendly metric)
     * @param {string} code - Source code
     * @param {string} language - Programming language
     * @returns {number} Cognitive complexity score
     */
    calculateCognitiveComplexity(code, language) {
      const patterns = COMPLEXITY_PATTERNS[language] || COMPLEXITY_PATTERNS.javascript;
      let complexity = 0;
      let nestingLevel = 0;
  
      const lines = code.split('\n');
  
      lines.forEach(line => {
        const trimmed = line.trim();
        
        // Increment nesting for opening braces/blocks
        if (trimmed.includes('{') || trimmed.includes(':')) {
          nestingLevel++;
        }
        
        // Decrement nesting for closing braces
        if (trimmed.includes('}')) {
          nestingLevel = Math.max(0, nestingLevel - 1);
        }
  
        // Add complexity based on control structures
        if (patterns.conditionals.test(trimmed)) {
          complexity += 1 + nestingLevel;
        }
  
        // Additional complexity for binary logical operators
        const logicalOps = (trimmed.match(/&&|\|\|/g) || []).length;
        complexity += logicalOps;
      });
  
      return complexity;
    }
  
    /**
     * Calculate maintainability index
     * @param {number} complexity - Cyclomatic complexity
     * @param {number} linesOfCode - Lines of code
     * @param {number} functionCount - Number of functions
     * @returns {number} Maintainability index (0-100)
     */
    calculateMaintainabilityIndex(complexity, linesOfCode, functionCount) {
      if (linesOfCode === 0) return 100;
  
      const volume = linesOfCode * Math.log2(functionCount + 1);
      const maintainability = Math.max(0, 
        171 - 5.2 * Math.log(volume) - 0.23 * complexity - 16.2 * Math.log(linesOfCode)
      );
  
      return Math.min(100, Math.max(0, maintainability));
    }
  
    /**
     * Extract functions from code
     * @param {string} code - Source code
     * @param {string} language - Programming language
     * @returns {Array} Array of function objects
     */
    extractFunctions(code, language) {
      const functions = [];
      const lines = code.split('\n');
  
      let functionRegex;
      switch (language) {
        case 'javascript':
          functionRegex = /(?:function\s+(\w+)|(\w+)\s*[=:]\s*(?:function|async|\([^)]*\)\s*=>))/g;
          break;
        case 'python':
          functionRegex = /def\s+(\w+)\s*\(/g;
          break;
        case 'java':
          functionRegex = /(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\(/g;
          break;
        default:
          functionRegex = /function\s+(\w+)|(\w+)\s*\(/g;
      }
  
      lines.forEach((line, index) => {
        let match;
        while ((match = functionRegex.exec(line)) !== null) {
          const functionName = match[1] || match[2];
          if (functionName && !functionName.startsWith('_')) {
            const functionCode = this.extractFunctionBody(lines, index);
            functions.push({
              name: functionName,
              line: index + 1,
              complexity: this.calculateCyclomaticComplexity(functionCode, language),
              linesOfCode: functionCode.split('\n').length
            });
          }
        }
      });
  
      return functions;
    }
  
    /**
     * Extract classes from code
     * @param {string} code - Source code
     * @param {string} language - Programming language
     * @returns {Array} Array of class objects
     */
    extractClasses(code, language) {
      const classes = [];
      const lines = code.split('\n');
  
      let classRegex;
      switch (language) {
        case 'javascript':
          classRegex = /class\s+(\w+)/g;
          break;
        case 'python':
          classRegex = /class\s+(\w+)/g;
          break;
        case 'java':
          classRegex = /(?:public|private|protected)?\s*class\s+(\w+)/g;
          break;
        default:
          classRegex = /class\s+(\w+)/g;
      }
  
      lines.forEach((line, index) => {
        let match;
        while ((match = classRegex.exec(line)) !== null) {
          const className = match[1];
          const classCode = this.extractClassBody(lines, index);
          classes.push({
            name: className,
            line: index + 1,
            complexity: this.calculateCyclomaticComplexity(classCode, language),
            linesOfCode: classCode.split('\n').length,
            methods: this.extractFunctions(classCode, language).length
          });
        }
      });
  
      return classes;
    }
  
    /**
     * Identify complexity hotspots
     * @param {Array} files - File analysis results
     * @param {Array} functions - Function analysis results
     * @returns {Array} Array of hotspot objects
     */
    identifyHotspots(files, functions) {
      const hotspots = [];
  
      // File-level hotspots
      files.forEach(file => {
        if (file.cyclomaticComplexity > 20 || file.linesOfCode > 500) {
          hotspots.push({
            type: 'file',
            name: file.fileName,
            issue: 'High complexity file',
            complexity: file.cyclomaticComplexity,
            severity: file.cyclomaticComplexity > 30 ? 'high' : 'medium'
          });
        }
      });
  
      // Function-level hotspots
      functions.forEach(func => {
        if (func.complexity > 10) {
          hotspots.push({
            type: 'function',
            name: func.name,
            issue: 'Complex function',
            complexity: func.complexity,
            severity: func.complexity > 15 ? 'high' : 'medium'
          });
        }
      });
  
      return hotspots.sort((a, b) => b.complexity - a.complexity);
    }
  
    /**
     * Generate recommendations based on analysis
     * @param {Object} analysis - Complete analysis results
     * @returns {Array} Array of recommendation objects
     */
    generateRecommendations(analysis) {
      const recommendations = [];
  
      if (analysis.overall.averageComplexity > 15) {
        recommendations.push({
          type: 'refactor',
          priority: 'high',
          message: 'Consider breaking down complex functions into smaller, more manageable pieces',
          scope: 'codebase'
        });
      }
  
      if (analysis.overall.maintainabilityIndex < 40) {
        recommendations.push({
          type: 'maintainability',
          priority: 'high',
          message: 'Improve code maintainability by reducing complexity and adding documentation',
          scope: 'codebase'
        });
      }
  
      // File-specific recommendations
      analysis.files.forEach(file => {
        if (file.linesOfCode > 500) {
          recommendations.push({
            type: 'refactor',
            priority: 'medium',
            message: `Consider splitting ${file.fileName} into smaller modules`,
            scope: 'file',
            target: file.fileName
          });
        }
      });
  
      return recommendations;
    }
  
    // Helper methods
  
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
        'rs': 'rust'
      };
      return languageMap[extension] || 'unknown';
    }
  
    isCodeFile(fileName) {
      const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs'];
      const extension = fileName.split('.').pop().toLowerCase();
      return codeExtensions.includes(extension);
    }
  
    countLinesOfCode(lines) {
      return lines.filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('#');
      }).length;
    }
  
    calculateNestingLevel(code) {
      let maxNesting = 0;
      let currentNesting = 0;
      
      for (let char of code) {
        if (char === '{' || char === '(') {
          currentNesting++;
          maxNesting = Math.max(maxNesting, currentNesting);
        } else if (char === '}' || char === ')') {
          currentNesting = Math.max(0, currentNesting - 1);
        }
      }
      
      return maxNesting;
    }
  
    extractFunctionBody(lines, startIndex) {
      let braceCount = 0;
      let functionBody = '';
      let started = false;
  
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];
        functionBody += line + '\n';
  
        for (let char of line) {
          if (char === '{') {
            braceCount++;
            started = true;
          } else if (char === '}') {
            braceCount--;
            if (started && braceCount === 0) {
              return functionBody;
            }
          }
        }
      }
  
      return functionBody;
    }
  
    extractClassBody(lines, startIndex) {
      // Similar to extractFunctionBody but for classes
      return this.extractFunctionBody(lines, startIndex);
    }
  
    categorizeComplexity(complexity) {
      if (complexity <= 5) return 'low';
      if (complexity <= 10) return 'medium';
      if (complexity <= 20) return 'high';
      return 'very-high';
    }
  
    determineRiskLevel(complexity) {
      if (complexity <= 10) return 'low';
      if (complexity <= 20) return 'medium';
      if (complexity <= 40) return 'high';
      return 'critical';
    }
  
    identifyIssues(fileAnalysis) {
      const issues = [];
  
      if (fileAnalysis.cyclomaticComplexity > 20) {
        issues.push('High cyclomatic complexity');
      }
  
      if (fileAnalysis.linesOfCode > 500) {
        issues.push('Large file size');
      }
  
      if (fileAnalysis.functions.some(f => f.complexity > 15)) {
        issues.push('Complex functions detected');
      }
  
      if (fileAnalysis.maintainabilityIndex < 40) {
        issues.push('Low maintainability');
      }
  
      return issues;
    }
  }
  
  export default ComplexityAnalyzer;