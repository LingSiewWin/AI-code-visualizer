const path = require('path');

/**
 * Code and data parsing utilities for the AI Code Visualizer
 */

/**
 * File extension to language mapping
 */
const LANGUAGE_MAP = {
  // JavaScript ecosystem
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.vue': 'vue',
  '.svelte': 'svelte',
  
  // Python
  '.py': 'python',
  '.pyw': 'python',
  '.pyi': 'python',
  
  // Java ecosystem
  '.java': 'java',
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  '.scala': 'scala',
  
  // C family
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.cxx': 'cpp',
  '.cc': 'cpp',
  '.hpp': 'cpp',
  '.hxx': 'cpp',
  '.cs': 'csharp',
  
  // Web technologies
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',
  
  // Other languages
  '.php': 'php',
  '.rb': 'ruby',
  '.go': 'go',
  '.rs': 'rust',
  '.swift': 'swift',
  '.m': 'objective-c',
  '.mm': 'objective-c',
  
  // Data formats
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.xml': 'xml',
  '.toml': 'toml',
  '.ini': 'ini',
  
  // Documentation
  '.md': 'markdown',
  '.markdown': 'markdown',
  '.rst': 'restructuredtext',
  '.txt': 'text',
  
  // Shell scripts
  '.sh': 'shell',
  '.bash': 'bash',
  '.zsh': 'zsh',
  '.fish': 'fish',
  '.ps1': 'powershell',
  '.bat': 'batch',
  '.cmd': 'batch',
  
  // SQL
  '.sql': 'sql',
  
  // Configuration
  '.dockerfile': 'dockerfile',
  '.gitignore': 'gitignore',
  '.env': 'env'
};

/**
 * Language complexity weights for analysis
 */
const LANGUAGE_COMPLEXITY = {
  'c': 1.0,
  'cpp': 1.2,
  'java': 1.1,
  'csharp': 1.1,
  'javascript': 0.8,
  'typescript': 0.9,
  'python': 0.7,
  'ruby': 0.7,
  'php': 0.8,
  'go': 0.9,
  'rust': 1.3,
  'swift': 1.0,
  'kotlin': 1.0,
  'scala': 1.4
};

/**
 * Parse file extension and detect language
 */
const parseFileLanguage = (filename) => {
  if (!filename) return null;
  
  const ext = path.extname(filename).toLowerCase();
  
  // Special cases for files without extensions
  if (!ext) {
    const basename = path.basename(filename).toLowerCase();
    if (basename === 'dockerfile') return 'dockerfile';
    if (basename === 'makefile') return 'makefile';
    if (basename === 'jenkinsfile') return 'groovy';
    if (basename === 'vagrantfile') return 'ruby';
    if (basename.startsWith('.env')) return 'env';
  }
  
  return LANGUAGE_MAP[ext] || null;
};

/**
 * Parse import/require statements from code
 */
const parseImports = (content, language) => {
  const imports = [];
  
  if (!content || typeof content !== 'string') return imports;
  
  const lines = content.split('\n');
  
  switch (language) {
    case 'javascript':
    case 'typescript':
      imports.push(...parseJavaScriptImports(lines));
      break;
    case 'python':
      imports.push(...parsePythonImports(lines));
      break;
    case 'java':
      imports.push(...parseJavaImports(lines));
      break;
    case 'csharp':
      imports.push(...parseCSharpImports(lines));
      break;
    case 'go':
      imports.push(...parseGoImports(lines));
      break;
    case 'rust':
      imports.push(...parseRustImports(lines));
      break;
    case 'php':
      imports.push(...parsePHPImports(lines));
      break;
    case 'ruby':
      imports.push(...parseRubyImports(lines));
      break;
  }
  
  return [...new Set(imports)]; // Remove duplicates
};

/**
 * Parse JavaScript/TypeScript imports
 */
const parseJavaScriptImports = (lines) => {
  const imports = [];
  const patterns = [
    /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g,
    /import\s+['"`]([^'"`]+)['"`]/g,
    /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
    /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g
  ];
  
  lines.forEach(line => {
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        imports.push(match[1]);
      }
    });
  });
  
  return imports;
};

/**
 * Parse Python imports
 */
const parsePythonImports = (lines) => {
  const imports = [];
  const patterns = [
    /^import\s+([^\s#]+)/,
    /^from\s+([^\s#]+)\s+import/
  ];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    patterns.forEach(pattern => {
      const match = trimmed.match(pattern);
      if (match) {
        imports.push(match[1]);
      }
    });
  });
  
  return imports;
};

/**
 * Parse Java imports
 */
const parseJavaImports = (lines) => {
  const imports = [];
  const pattern = /^import\s+(?:static\s+)?([^;]+);/;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    const match = trimmed.match(pattern);
    if (match) {
      imports.push(match[1]);
    }
  });
  
  return imports;
};

/**
 * Parse C# using statements
 */
const parseCSharpImports = (lines) => {
  const imports = [];
  const pattern = /^using\s+([^;]+);/;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    const match = trimmed.match(pattern);
    if (match) {
      imports.push(match[1]);
    }
  });
  
  return imports;
};

/**
 * Parse Go imports
 */
const parseGoImports = (lines) => {
  const imports = [];
  let inImportBlock = false;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (trimmed === 'import (') {
      inImportBlock = true;
      return;
    }
    
    if (inImportBlock && trimmed === ')') {
      inImportBlock = false;
      return;
    }
    
    if (inImportBlock) {
      const match = trimmed.match(/['"`]([^'"`]+)['"`]/);
      if (match) {
        imports.push(match[1]);
      }
    } else {
      const singleImportMatch = trimmed.match(/^import\s+['"`]([^'"`]+)['"`]/);
      if (singleImportMatch) {
        imports.push(singleImportMatch[1]);
      }
    }
  });
  
  return imports;
};

/**
 * Parse Rust imports
 */
const parseRustImports = (lines) => {
  const imports = [];
  const patterns = [
    /^use\s+([^;]+);/,
    /^extern\s+crate\s+([^;]+);/
  ];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    patterns.forEach(pattern => {
      const match = trimmed.match(pattern);
      if (match) {
        imports.push(match[1]);
      }
    });
  });
  
  return imports;
};

/**
 * Parse PHP imports
 */
const parsePHPImports = (lines) => {
  const imports = [];
  const patterns = [
    /^use\s+([^;]+);/,
    /^require(?:_once)?\s*\(\s*['"`]([^'"`]+)['"`]\s*\);/,
    /^include(?:_once)?\s*\(\s*['"`]([^'"`]+)['"`]\s*\);/
  ];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    patterns.forEach(pattern => {
      const match = trimmed.match(pattern);
      if (match) {
        imports.push(match[1]);
      }
    });
  });
  
  return imports;
};

/**
 * Parse Ruby imports
 */
const parseRubyImports = (lines) => {
  const imports = [];
  const patterns = [
    /^require\s+['"`]([^'"`]+)['"`]/,
    /^require_relative\s+['"`]([^'"`]+)['"`]/,
    /^load\s+['"`]([^'"`]+)['"`]/
  ];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    patterns.forEach(pattern => {
      const match = trimmed.match(pattern);
      if (match) {
        imports.push(match[1]);
      }
    });
  });
  
  return imports;
};

/**
 * Parse function/method definitions
 */
const parseFunctions = (content, language) => {
  const functions = [];
  
  if (!content || typeof content !== 'string') return functions;
  
  const lines = content.split('\n');
  
  switch (language) {
    case 'javascript':
    case 'typescript':
      functions.push(...parseJavaScriptFunctions(lines));
      break;
    case 'python':
      functions.push(...parsePythonFunctions(lines));
      break;
    case 'java':
      functions.push(...parseJavaFunctions(lines));
      break;
    case 'csharp':
      functions.push(...parseCSharpFunctions(lines));
      break;
    case 'go':
      functions.push(...parseGoFunctions(lines));
      break;
    case 'rust':
      functions.push(...parseRustFunctions(lines));
      break;
    case 'php':
      functions.push(...parsePHPFunctions(lines));
      break;
    case 'ruby':
      functions.push(...parseRubyFunctions(lines));
      break;
    case 'cpp':
    case 'c':
      functions.push(...parseCFunctions(lines));
      break;
  }
  
  return functions;
};

/**
 * Parse JavaScript/TypeScript functions
 */
const parseJavaScriptFunctions = (lines) => {
  const functions = [];
  const patterns = [
    /(?:function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\()/,
    /(?:const\s+|let\s+|var\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[=:]\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>)/,
    /(?:async\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*{/,
    /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*(?:async\s+)?function/
  ];
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    patterns.forEach(pattern => {
      const match = trimmed.match(pattern);
      if (match && match[1]) {
        functions.push({
          name: match[1],
          line: index + 1,
          type: 'function'
        });
      }
    });
  });
  
  return functions;
};

/**
 * Parse Python functions
 */
const parsePythonFunctions = (lines) => {
  const functions = [];
  const pattern = /^(\s*)def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/;
  
  lines.forEach((line, index) => {
    const match = line.match(pattern);
    if (match) {
      functions.push({
        name: match[2],
        line: index + 1,
        type: 'function',
        indent: match[1].length
      });
    }
  });
  
  return functions;
};

/**
 * Parse Java methods
 */
const parseJavaFunctions = (lines) => {
  const functions = [];
  const pattern = /(?:public|private|protected)?\s*(?:static)?\s*(?:\w+\s+)*(\w+)\s*\([^)]*\)\s*(?:throws\s+\w+(?:\s*,\s*\w+)*)?\s*{/;
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const match = trimmed.match(pattern);
    if (match && match[1] && !match[1].match(/^(if|for|while|switch|try|catch)$/)) {
      functions.push({
        name: match[1],
        line: index + 1,
        type: 'method'
      });
    }
  });
  
  return functions;
};

/**
 * Parse C# methods
 */
const parseCSharpFunctions = (lines) => {
  const functions = [];
  const pattern = /(?:public|private|protected|internal)?\s*(?:static)?\s*(?:async)?\s*(?:\w+\s+)*(\w+)\s*\([^)]*\)\s*{/;
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const match = trimmed.match(pattern);
    if (match && match[1] && !match[1].match(/^(if|for|while|switch|try|catch|using)$/)) {
      functions.push({
        name: match[1],
        line: index + 1,
        type: 'method'
      });
    }
  });
  
  return functions;
};

/**
 * Parse Go functions
 */
const parseGoFunctions = (lines) => {
  const functions = [];
  const pattern = /^func\s+(?:\([^)]*\)\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/;
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const match = trimmed.match(pattern);
    if (match) {
      functions.push({
        name: match[1],
        line: index + 1,
        type: 'function'
      });
    }
  });
  
  return functions;
};

/**
 * Parse Rust functions
 */
const parseRustFunctions = (lines) => {
  const functions = [];
  const pattern = /^(?:pub\s+)?(?:async\s+)?fn\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/;
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const match = trimmed.match(pattern);
    if (match) {
      functions.push({
        name: match[1],
        line: index + 1,
        type: 'function'
      });
    }
  });
  
  return functions;
};

/**
 * Parse PHP functions
 */
const parsePHPFunctions = (lines) => {
  const functions = [];
  const patterns = [
    /^(?:public|private|protected)?\s*(?:static)?\s*function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/,
    /^function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/
  ];
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    patterns.forEach(pattern => {
      const match = trimmed.match(pattern);
      if (match) {
        functions.push({
          name: match[1],
          line: index + 1,
          type: 'function'
        });
      }
    });
  });
  
  return functions;
};

/**
 * Parse Ruby methods
 */
const parseRubyFunctions = (lines) => {
  const functions = [];
  const pattern = /^(\s*)def\s+([a-zA-Z_][a-zA-Z0-9_?!]*)/;
  
  lines.forEach((line, index) => {
    const match = line.match(pattern);
    if (match) {
      functions.push({
        name: match[2],
        line: index + 1,
        type: 'method',
        indent: match[1].length
      });
    }
  });
  
  return functions;
};

/**
 * Parse C/C++ functions
 */
const parseCFunctions = (lines) => {
  const functions = [];
  const pattern = /^(?:\w+\s+)*([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*{/;
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const match = trimmed.match(pattern);
    if (match && match[1] && !match[1].match(/^(if|for|while|switch)$/)) {
      functions.push({
        name: match[1],
        line: index + 1,
        type: 'function'
      });
    }
  });
  
  return functions;
};

/**
 * Calculate cyclomatic complexity
 */
const calculateComplexity = (content, language) => {
  if (!content || typeof content !== 'string') return 1;
  
  const complexityKeywords = {
    javascript: ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch', '?', '&&', '||'],
    typescript: ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch', '?', '&&', '||'],
    python: ['if', 'elif', 'else', 'for', 'while', 'try', 'except', 'and', 'or'],
    java: ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch', '?', '&&', '||'],
    csharp: ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch', '?', '&&', '||'],
    go: ['if', 'else', 'for', 'switch', 'case', 'select', '&&', '||'],
    rust: ['if', 'else', 'for', 'while', 'match', '&&', '||'],
    php: ['if', 'else', 'elseif', 'for', 'while', 'foreach', 'switch', 'case', 'catch', '?', '&&', '||'],
    ruby: ['if', 'elsif', 'else', 'for', 'while', 'case', 'when', 'rescue', '&&', '||'],
    cpp: ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch', '?', '&&', '||'],
    c: ['if', 'else', 'for', 'while', 'do', 'switch', 'case', '?', '&&', '||']
  };
  
  const keywords = complexityKeywords[language] || complexityKeywords.javascript;
  let complexity = 1; // Base complexity
  
  // Remove comments and strings to avoid false positives
  const cleanContent = removeCommentsAndStrings(content, language);
  
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    const matches = cleanContent.match(regex);
    if (matches) {
      complexity += matches.length;
    }
  });
  
  return complexity;
};

/**
 * Remove comments and strings from code
 */
const removeCommentsAndStrings = (content, language) => {
  let cleaned = content;
  
  // Remove single-line comments
  const singleLineComments = {
    javascript: /\/\/.*$/gm,
    typescript: /\/\/.*$/gm,
    python: /#.*$/gm,
    java: /\/\/.*$/gm,
    csharp: /\/\/.*$/gm,
    go: /\/\/.*$/gm,
    rust: /\/\/.*$/gm,
    php: /(?:\/\/|#).*$/gm,
    ruby: /#.*$/gm,
    cpp: /\/\/.*$/gm,
    c: /\/\/.*$/gm
  };
  
  if (singleLineComments[language]) {
    cleaned = cleaned.replace(singleLineComments[language], '');
  }
  
  // Remove multi-line comments
  const multiLineComments = {
    javascript: /\/\*[\s\S]*?\*\//g,
    typescript: /\/\*[\s\S]*?\*\//g,
    java: /\/\*[\s\S]*?\*\//g,
    csharp: /\/\*[\s\S]*?\*\//g,
    go: /\/\*[\s\S]*?\*\//g,
    rust: /\/\*[\s\S]*?\*\//g,
    php: /\/\*[\s\S]*?\*\//g,
    cpp: /\/\*[\s\S]*?\*\//g,
    c: /\/\*[\s\S]*?\*\//g
  };
  
  if (multiLineComments[language]) {
    cleaned = cleaned.replace(multiLineComments[language], '');
  }
  
  // Remove strings (basic removal, may not handle all edge cases)
  cleaned = cleaned.replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '""');
  cleaned = cleaned.replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, "''");
  cleaned = cleaned.replace(/`[^`\\]*(?:\\.[^`\\]*)*`/g, '``');
  
  return cleaned;
};

/**
 * Parse package.json dependencies
 */
const parsePackageJson = (content) => {
  try {
    const pkg = JSON.parse(content);
    return {
      name: pkg.name,
      version: pkg.version,
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {},
      scripts: pkg.scripts || {},
      author: pkg.author,
      license: pkg.license,
      description: pkg.description
    };
  } catch (error) {
    return null;
  }
};

/**
 * Parse requirements.txt (Python)
 */
const parseRequirementsTxt = (content) => {
  const dependencies = {};
  const lines = content.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([a-zA-Z0-9\-_.]+)(?:[=<>!]+(.+))?/);
      if (match) {
        dependencies[match[1]] = match[2] || '*';
      }
    }
  });
  
  return dependencies;
};

/**
 * Parse Cargo.toml (Rust)
 */
const parseCargoToml = (content) => {
  try {
    // Basic TOML parsing for dependencies section
    const lines = content.split('\n');
    const result = {
      dependencies: {},
      devDependencies: {}
    };
    
    let currentSection = null;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      if (trimmed === '[dependencies]') {
        currentSection = 'dependencies';
      } else if (trimmed === '[dev-dependencies]') {
        currentSection = 'devDependencies';
      } else if (trimmed.startsWith('[')) {
        currentSection = null;
      } else if (currentSection && trimmed.includes('=')) {
        const [name, version] = trimmed.split('=').map(s => s.trim());
        if (name && version) {
          result[currentSection][name] = version.replace(/['"]/g, '');
        }
      }
    });
    
    return result;
  } catch (error) {
    return null;
  }
};

/**
 * Parse file metadata
 */
const parseFileMetadata = (filename, content, stats) => {
  const language = parseFileLanguage(filename);
  const lines = content ? content.split('\n').length : 0;
  const size = stats ? stats.size : content ? Buffer.byteLength(content, 'utf8') : 0;
  
  const metadata = {
    filename: path.basename(filename),
    path: filename,
    extension: path.extname(filename),
    language,
    lines,
    size,
    isEmpty: lines <= 1 && (!content || content.trim().length === 0)
  };
  
  if (content && language) {
    metadata.imports = parseImports(content, language);
    metadata.functions = parseFunctions(content, language);
    metadata.complexity = calculateComplexity(content, language);
    metadata.complexityWeight = LANGUAGE_COMPLEXITY[language] || 1.0;
  }
  
  // Special handling for configuration files
  if (filename.endsWith('package.json')) {
    metadata.packageInfo = parsePackageJson(content);
  } else if (filename.endsWith('requirements.txt')) {
    metadata.dependencies = parseRequirementsTxt(content);
  } else if (filename.endsWith('Cargo.toml')) {
    metadata.cargoInfo = parseCargoToml(content);
  }
  
  return metadata;
};

/**
 * Get language statistics from file list
 */
const getLanguageStats = (files) => {
  const stats = {};
  let totalLines = 0;
  
  files.forEach(file => {
    if (file.language && !file.isEmpty) {
      if (!stats[file.language]) {
        stats[file.language] = {
          files: 0,
          lines: 0,
          size: 0
        };
      }
      
      stats[file.language].files++;
      stats[file.language].lines += file.lines || 0;
      stats[file.language].size += file.size || 0;
      totalLines += file.lines || 0;
    }
  });
  
  // Calculate percentages
  Object.keys(stats).forEach(lang => {
    stats[lang].percentage = totalLines > 0 ? 
      (stats[lang].lines / totalLines * 100).toFixed(1) : 0;
  });
  
  return stats;
};

module.exports = {
  LANGUAGE_MAP,
  LANGUAGE_COMPLEXITY,
  parseFileLanguage,
  parseImports,
  parseFunctions,
  calculateComplexity,
  parsePackageJson,
  parseRequirementsTxt,
  parseCargoToml,
  parseFileMetadata,
  getLanguageStats,
  removeCommentsAndStrings
};