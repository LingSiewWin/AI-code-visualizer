/**
 * Code Parser Service
 * Analyzes and extracts information from various programming languages
 */

class CodeParser {
    constructor() {
      this.supportedLanguages = {
        javascript: ['js', 'jsx', 'ts', 'tsx'],
        python: ['py', 'pyx', 'pyi'],
        java: ['java'],
        cpp: ['cpp', 'cc', 'cxx', 'c++', 'c'],
        csharp: ['cs'],
        go: ['go'],
        rust: ['rs'],
        php: ['php'],
        ruby: ['rb'],
        swift: ['swift'],
        kotlin: ['kt'],
        scala: ['scala'],
        r: ['r'],
        sql: ['sql'],
        html: ['html', 'htm'],
        css: ['css', 'scss', 'sass', 'less'],
        markdown: ['md', 'markdown'],
        json: ['json'],
        yaml: ['yml', 'yaml'],
        xml: ['xml']
      };
  
      this.languagePatterns = this.initializePatterns();
    }
  
    /**
     * Initialize regex patterns for different languages
     * @returns {Object} Language-specific regex patterns
     */
    initializePatterns() {
      return {
        javascript: {
          functions: /(?:function\s+(\w+)|(\w+)\s*=\s*(?:function|async\s+function|\([^)]*\)\s*=>)|(?:async\s+)?(\w+)\s*\([^)]*\)\s*{)/g,
          classes: /class\s+(\w+)(?:\s+extends\s+(\w+))?/g,
          imports: /import\s+(?:{[^}]*}|\w+|\*\s+as\s+\w+)\s+from\s+['"`]([^'"`]+)['"`]/g,
          exports: /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g,
          variables: /(?:const|let|var)\s+(\w+)/g,
          comments: /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
          complexity: /(?:if|for|while|switch|catch|&&|\|\|)/g
        },
        python: {
          functions: /def\s+(\w+)\s*\(/g,
          classes: /class\s+(\w+)(?:\([^)]*\))?:/g,
          imports: /(?:from\s+(\S+)\s+)?import\s+([^#\n]+)/g,
          variables: /(\w+)\s*=\s*[^=]/g,
          comments: /#.*$|"""[\s\S]*?"""|'''[\s\S]*?'''/gm,
          complexity: /(?:if|for|while|try|except|elif|and|or)/g
        },
        java: {
          functions: /(?:public|private|protected|static|\s)+[\w<>\[\]]+\s+(\w+)\s*\([^)]*\)\s*{/g,
          classes: /(?:public|private|protected)?\s*class\s+(\w+)(?:\s+extends\s+(\w+))?/g,
          imports: /import\s+([^;]+);/g,
          variables: /(?:private|public|protected|static|\s)+[\w<>\[\]]+\s+(\w+)\s*[=;]/g,
          comments: /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
          complexity: /(?:if|for|while|switch|catch|&&|\|\|)/g
        },
        cpp: {
          functions: /(?:[\w:]+\s+)?(\w+)\s*\([^)]*\)\s*{/g,
          classes: /class\s+(\w+)(?:\s*:\s*(?:public|private|protected)\s+(\w+))?/g,
          includes: /#include\s*[<"]([^>"]+)[>"]/g,
          variables: /(?:int|float|double|char|string|auto|const)\s+(\w+)/g,
          comments: /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
          complexity: /(?:if|for|while|switch|catch|&&|\|\|)/g
        }
      };
    }
  
    /**
     * Parse a single file and extract information
     * @param {string} content - File content
     * @param {string} filename - Name of the file
     * @param {string} filepath - Full path to the file
     * @returns {Object} Parsed file information
     */
    parseFile(content, filename, filepath) {
      const extension = this.getFileExtension(filename);
      const language = this.detectLanguage(extension);
      
      if (!language) {
        return this.createEmptyFileInfo(filename, filepath, extension);
      }
  
      const basicInfo = this.extractBasicInfo(content);
      const languageSpecific = this.extractLanguageSpecificInfo(content, language);
      const metrics = this.calculateMetrics(content, language);
      const dependencies = this.extractDependencies(content, language);
  
      return {
        filename,
        filepath,
        extension,
        language,
        size: content.length,
        ...basicInfo,
        ...languageSpecific,
        metrics,
        dependencies,
        parsed: true,
        timestamp: new Date().toISOString()
      };
    }
  
    /**
     * Parse multiple files
     * @param {Array} files - Array of file objects {content, filename, filepath}
     * @returns {Object} Parsed repository information
     */
    parseRepository(files) {
      const parsedFiles = files.map(file => 
        this.parseFile(file.content, file.filename, file.filepath)
      );
  
      return {
        files: parsedFiles,
        summary: this.generateRepositorySummary(parsedFiles),
        languages: this.analyzeLanguageDistribution(parsedFiles),
        structure: this.analyzeStructure(parsedFiles),
        complexity: this.analyzeComplexity(parsedFiles)
      };
    }
  
    /**
     * Extract basic information from file content
     * @param {string} content - File content
     * @returns {Object} Basic file information
     */
    extractBasicInfo(content) {
      const lines = content.split('\n');
      const nonEmptyLines = lines.filter(line => line.trim().length > 0);
      const commentLines = lines.filter(line => this.isCommentLine(line));
  
      return {
        totalLines: lines.length,
        codeLines: nonEmptyLines.length - commentLines.length,
        commentLines: commentLines.length,
        emptyLines: lines.length - nonEmptyLines.length,
        averageLineLength: content.length / lines.length
      };
    }
  
    /**
     * Extract language-specific information
     * @param {string} content - File content
     * @param {string} language - Programming language
     * @returns {Object} Language-specific information
     */
    extractLanguageSpecificInfo(content, language) {
      const patterns = this.languagePatterns[language];
      if (!patterns) return {};
  
      const info = {};
  
      // Extract functions
      if (patterns.functions) {
        info.functions = this.extractMatches(content, patterns.functions);
      }
  
      // Extract classes
      if (patterns.classes) {
        info.classes = this.extractMatches(content, patterns.classes);
      }
  
      // Extract imports/includes
      if (patterns.imports) {
        info.imports = this.extractMatches(content, patterns.imports);
      } else if (patterns.includes) {
        info.imports = this.extractMatches(content, patterns.includes);
      }
  
      // Extract variables
      if (patterns.variables) {
        info.variables = this.extractMatches(content, patterns.variables);
      }
  
      // Extract exports (for languages that support it)
      if (patterns.exports) {
        info.exports = this.extractMatches(content, patterns.exports);
      }
  
      return info;
    }
  
    /**
     * Calculate code metrics
     * @param {string} content - File content
     * @param {string} language - Programming language
     * @returns {Object} Code metrics
     */
    calculateMetrics(content, language) {
      const patterns = this.languagePatterns[language];
      const lines = content.split('\n');
  
      // Cyclomatic complexity approximation
      const complexityMatches = patterns?.complexity ? 
        (content.match(patterns.complexity) || []).length : 0;
  
      // Calculate nesting depth
      const maxNesting = this.calculateMaxNesting(content, language);
  
      // Calculate maintainability index (simplified)
      const maintainabilityIndex = this.calculateMaintainabilityIndex(content, complexityMatches);
  
      return {
        cyclomaticComplexity: complexityMatches + 1, // +1 for the base path
        maxNestingDepth: maxNesting,
        maintainabilityIndex,
        halsteadVolume: this.calculateHalsteadVolume(content),
        technicalDebt: this.estimateTechnicalDebt(content, complexityMatches)
      };
    }
  
    /**
     * Extract dependencies from file content
     * @param {string} content - File content
     * @param {string} language - Programming language
     * @returns {Array} Array of dependencies
     */
    extractDependencies(content, language) {
      const patterns = this.languagePatterns[language];
      const dependencies = [];
  
      if (patterns?.imports) {
        const matches = content.match(patterns.imports) || [];
        matches.forEach(match => {
          const dep = this.parseDependency(match, language);
          if (dep) dependencies.push(dep);
        });
      }
  
      return dependencies;
    }
  
    /**
     * Generate repository summary
     * @param {Array} parsedFiles - Array of parsed files
     * @returns {Object} Repository summary
     */
    generateRepositorySummary(parsedFiles) {
      const totalFiles = parsedFiles.length;
      const totalLines = parsedFiles.reduce((sum, file) => sum + (file.totalLines || 0), 0);
      const totalCodeLines = parsedFiles.reduce((sum, file) => sum + (file.codeLines || 0), 0);
      const totalFunctions = parsedFiles.reduce((sum, file) => sum + (file.functions?.length || 0), 0);
      const totalClasses = parsedFiles.reduce((sum, file) => sum + (file.classes?.length || 0), 0);
  
      return {
        totalFiles,
        totalLines,
        totalCodeLines,
        totalFunctions,
        totalClasses,
        averageFileSize: totalLines / totalFiles,
        codeToCommentRatio: this.calculateCodeToCommentRatio(parsedFiles)
      };
    }
  
    /**
     * Analyze language distribution
     * @param {Array} parsedFiles - Array of parsed files
     * @returns {Object} Language distribution
     */
    analyzeLanguageDistribution(parsedFiles) {
      const distribution = {};
      let totalLines = 0;
  
      parsedFiles.forEach(file => {
        if (file.language) {
          if (!distribution[file.language]) {
            distribution[file.language] = {
              files: 0,
              lines: 0,
              percentage: 0
            };
          }
          distribution[file.language].files++;
          distribution[file.language].lines += file.totalLines || 0;
          totalLines += file.totalLines || 0;
        }
      });
  
      // Calculate percentages
      Object.keys(distribution).forEach(lang => {
        distribution[lang].percentage = (distribution[lang].lines / totalLines) * 100;
      });
  
      return distribution;
    }
  
    /**
     * Analyze repository structure
     * @param {Array} parsedFiles - Array of parsed files
     * @returns {Object} Structure analysis
     */
    analyzeStructure(parsedFiles) {
      const structure = {
        directories: new Set(),
        maxDepth: 0,
        fileTypes: {},
        patterns: []
      };
  
      parsedFiles.forEach(file => {
        const pathParts = file.filepath.split('/');
        const depth = pathParts.length - 1;
        
        structure.maxDepth = Math.max(structure.maxDepth, depth);
        
        // Add directories
        for (let i = 0; i < pathParts.length - 1; i++) {
          structure.directories.add(pathParts.slice(0, i + 1).join('/'));
        }
  
        // Count file types
        const ext = file.extension;
        structure.fileTypes[ext] = (structure.fileTypes[ext] || 0) + 1;
      });
  
      structure.directories = Array.from(structure.directories);
      structure.patterns = this.detectStructurePatterns(parsedFiles);
  
      return structure;
    }
  
    /**
     * Analyze overall complexity
     * @param {Array} parsedFiles - Array of parsed files
     * @returns {Object} Complexity analysis
     */
    analyzeComplexity(parsedFiles) {
      const complexities = parsedFiles
        .filter(file => file.metrics?.cyclomaticComplexity)
        .map(file => file.metrics.cyclomaticComplexity);
  
      if (complexities.length === 0) {
        return { average: 0, max: 0, min: 0, distribution: {} };
      }
  
      const average = complexities.reduce((sum, c) => sum + c, 0) / complexities.length;
      const max = Math.max(...complexities);
      const min = Math.min(...complexities);
  
      // Complexity distribution
      const distribution = {
        low: complexities.filter(c => c <= 5).length,
        medium: complexities.filter(c => c > 5 && c <= 10).length,
        high: complexities.filter(c => c > 10 && c <= 20).length,
        veryHigh: complexities.filter(c => c > 20).length
      };
  
      return { average, max, min, distribution };
    }
  
    // Helper methods
  
    getFileExtension(filename) {
      return filename.split('.').pop()?.toLowerCase() || '';
    }
  
    detectLanguage(extension) {
      for (const [lang, exts] of Object.entries(this.supportedLanguages)) {
        if (exts.includes(extension)) {
          return lang;
        }
      }
      return null;
    }
  
    createEmptyFileInfo(filename, filepath, extension) {
      return {
        filename,
        filepath,
        extension,
        language: null,
        size: 0,
        totalLines: 0,
        codeLines: 0,
        commentLines: 0,
        emptyLines: 0,
        parsed: false,
        timestamp: new Date().toISOString()
      };
    }
  
    extractMatches(content, pattern) {
      const matches = [];
      let match;
      const globalPattern = new RegExp(pattern.source, pattern.flags);
      
      while ((match = globalPattern.exec(content)) !== null) {
        matches.push({
          name: match[1] || match[2] || match[3] || match[0],
          match: match[0],
          index: match.index
        });
      }
      
      return matches;
    }
  
    isCommentLine(line) {
      const trimmed = line.trim();
      return trimmed.startsWith('//') || 
             trimmed.startsWith('#') || 
             trimmed.startsWith('/*') || 
             trimmed.startsWith('*') ||
             trimmed.startsWith('<!--');
    }
  
    calculateMaxNesting(content, language) {
      const openBraces = ['{', '(', '['];
      const closeBraces = ['}', ')', ']'];
      let maxDepth = 0;
      let currentDepth = 0;
  
      for (const char of content) {
        if (openBraces.includes(char)) {
          currentDepth++;
          maxDepth = Math.max(maxDepth, currentDepth);
        } else if (closeBraces.includes(char)) {
          currentDepth = Math.max(0, currentDepth - 1);
        }
      }
  
      return maxDepth;
    }
  
    calculateMaintainabilityIndex(content, complexity) {
      const lines = content.split('\n').length;
      const volume = this.calculateHalsteadVolume(content);
      
      // Simplified maintainability index calculation
      const mi = Math.max(0, 
        171 - 5.2 * Math.log(volume) - 0.23 * complexity - 16.2 * Math.log(lines)
      );
      
      return Math.round(mi * 100) / 100;
    }
  
    calculateHalsteadVolume(content) {
      // Simplified Halstead volume calculation
      const operators = content.match(/[+\-*\/=<>!&|]{1,2}/g) || [];
      const operands = content.match(/\w+/g) || [];
      
      const uniqueOperators = new Set(operators).size;
      const uniqueOperands = new Set(operands).size;
      
      const vocabulary = uniqueOperators + uniqueOperands;
      const length = operators.length + operands.length;
      
      return length * Math.log2(vocabulary) || 0;
    }
  
    estimateTechnicalDebt(content, complexity) {
      // Simple technical debt estimation based on complexity and code smells
      const codeSmells = [
        /function\s+\w+\s*\([^)]*\)\s*{[\s\S]{500,}?}/g, // Long functions
        /class\s+\w+[\s\S]{1000,}?(?=class|\n$)/g, // Large classes
        /if\s*\([^)]*\)\s*{[\s\S]*?if\s*\([^)]*\)\s*{[\s\S]*?if/g, // Deep nesting
        /\/\/\s*TODO|\/\/\s*FIXME|\/\/\s*HACK/gi // TODO comments
      ];
  
      let smellCount = 0;
      codeSmells.forEach(pattern => {
        smellCount += (content.match(pattern) || []).length;
      });
  
      return {
        score: complexity + smellCount,
        level: this.getTechnicalDebtLevel(complexity + smellCount),
        issues: smellCount
      };
    }
  
    getTechnicalDebtLevel(score) {
      if (score <= 5) return 'low';
      if (score <= 15) return 'medium';
      if (score <= 30) return 'high';
      return 'critical';
    }
  
    parseDependency(match, language) {
      // Parse dependency based on language
      switch (language) {
        case 'javascript':
          const jsMatch = match.match(/from\s+['"`]([^'"`]+)['"`]/);
          return jsMatch ? { name: jsMatch[1], type: 'import' } : null;
        
        case 'python':
          const pyMatch = match.match(/import\s+([^#\n]+)/);
          return pyMatch ? { name: pyMatch[1].trim(), type: 'import' } : null;
        
        case 'java':
          const javaMatch = match.match(/import\s+([^;]+);/);
          return javaMatch ? { name: javaMatch[1], type: 'import' } : null;
        
        default:
          return null;
      }
    }
  
    calculateCodeToCommentRatio(parsedFiles) {
      const totalCode = parsedFiles.reduce((sum, file) => sum + (file.codeLines || 0), 0);
      const totalComments = parsedFiles.reduce((sum, file) => sum + (file.commentLines || 0), 0);
      
      return totalComments === 0 ? Infinity : totalCode / totalComments;
    }
  
    detectStructurePatterns(parsedFiles) {
      const patterns = [];
      
      // Check for common patterns
      const hasTests = parsedFiles.some(file => 
        file.filepath.includes('test') || file.filepath.includes('spec')
      );
      
      const hasConfig = parsedFiles.some(file => 
        ['package.json', 'config.js', 'webpack.config.js', 'tsconfig.json'].includes(file.filename)
      );
      
      const hasDocs = parsedFiles.some(file => 
        file.filepath.includes('doc') || file.extension === 'md'
      );
  
      if (hasTests) patterns.push('testing');
      if (hasConfig) patterns.push('configuration');
      if (hasDocs) patterns.push('documentation');
  
      return patterns;
    }
  }
  
  // Export singleton instance
  export default new CodeParser();