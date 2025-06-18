/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';

// Import services
import * as githubAPI from '../src/services/githubAPI';
import * as aiAnalyzer from '../src/services/aiAnalyzer';
import * as codeParser from '../src/services/codeParser';
import * as complexityAnalyzer from '../src/services/complexityAnalyzer';
import * as dependencyMapper from '../src/services/dependencyMapper';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock console to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

describe('GitHub API Service', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('fetchRepositoryStructure', () => {
    const mockRepoData = {
      name: 'test-repo',
      full_name: 'user/test-repo',
      description: 'A test repository',
      language: 'JavaScript',
      stargazers_count: 100,
      forks_count: 25,
      open_issues_count: 5,
      default_branch: 'main',
    };

    const mockTreeData = {
      tree: [
        {
          path: 'src/App.js',
          type: 'blob',
          size: 1024,
          sha: 'abc123',
        },
        {
          path: 'src/components',
          type: 'tree',
          sha: 'def456',
        },
        {
          path: 'package.json',
          type: 'blob',
          size: 512,
          sha: 'ghi789',
        },
      ],
    };

    test('successfully fetches repository structure', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRepoData),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTreeData),
        });

      const result = await githubAPI.fetchRepositoryStructure('user/test-repo');

      expect(result).toEqual({
        repository: mockRepoData,
        fileStructure: mockTreeData.tree,
      });

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/user/test-repo',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/vnd.github.v3+json',
          }),
        })
      );
    });

    test('handles repository not found error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not Found' }),
      });

      await expect(githubAPI.fetchRepositoryStructure('user/nonexistent-repo'))
        .rejects.toThrow('Repository not found');
    });

    test('handles rate limit exceeded error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ message: 'API rate limit exceeded' }),
      });

      await expect(githubAPI.fetchRepositoryStructure('user/test-repo'))
        .rejects.toThrow('API rate limit exceeded');
    });

    test('includes authorization header when token is provided', async () => {
      const token = 'test-token';
      process.env.GITHUB_TOKEN = token;

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRepoData),
      });

      await githubAPI.fetchRepositoryStructure('user/test-repo');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `token ${token}`,
          }),
        })
      );

      delete process.env.GITHUB_TOKEN;
    });
  });

  describe('fetchFileContent', () => {
    const mockFileContent = {
      content: btoa('console.log("Hello, World!");'),
      encoding: 'base64',
      size: 25,
      sha: 'abc123',
    };

    test('successfully fetches and decodes file content', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFileContent),
      });

      const result = await githubAPI.fetchFileContent('user/test-repo', 'src/App.js');

      expect(result).toEqual({
        content: 'console.log("Hello, World!");',
        size: 25,
        sha: 'abc123',
      });
    });

    test('handles file not found error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not Found' }),
      });

      await expect(githubAPI.fetchFileContent('user/test-repo', 'nonexistent.js'))
        .rejects.toThrow('File not found');
    });

    test('handles large file content', async () => {
      const largeContent = 'x'.repeat(1024 * 1024); // 1MB of content
      const mockLargeFile = {
        content: btoa(largeContent),
        encoding: 'base64',
        size: largeContent.length,
        sha: 'large123',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLargeFile),
      });

      const result = await githubAPI.fetchFileContent('user/test-repo', 'large-file.js');

      expect(result.content).toBe(largeContent);
      expect(result.size).toBe(largeContent.length);
    });
  });

  describe('validateRepository', () => {
    test('validates correct repository URL format', () => {
      const validUrls = [
        'https://github.com/user/repo',
        'https://github.com/user/repo-name',
        'https://github.com/user/repo_name',
        'https://github.com/organization/project',
      ];

      validUrls.forEach(url => {
        expect(githubAPI.validateRepository(url)).toBe(true);
      });
    });

    test('rejects invalid repository URLs', () => {
      const invalidUrls = [
        'https://gitlab.com/user/repo',
        'https://github.com/user',
        'https://github.com/',
        'user/repo',
        'invalid-url',
        '',
        null,
        undefined,
      ];

      invalidUrls.forEach(url => {
        expect(githubAPI.validateRepository(url)).toBe(false);
      });
    });

    test('extracts owner and repo from URL', () => {
      const url = 'https://github.com/facebook/react';
      const result = githubAPI.extractRepoInfo(url);

      expect(result).toEqual({
        owner: 'facebook',
        repo: 'react',
      });
    });
  });
});

describe('AI Analyzer Service', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('analyzeCodeQuality', () => {
    const mockCode = `
      function calculateTotal(items) {
        let total = 0;
        for (let i = 0; i < items.length; i++) {
          total += items[i].price;
        }
        return total;
      }
    `;

    const mockAIResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            score: 8.5,
            issues: ['Consider using more descriptive variable names'],
            suggestions: ['Use array methods like reduce() for better readability'],
            complexity: 'Low',
            maintainability: 'High',
          }),
        },
      }],
    };

    test('successfully analyzes code quality', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAIResponse),
      });

      const result = await aiAnalyzer.analyzeCodeQuality(mockCode, 'javascript');

      expect(result).toEqual({
        score: 8.5,
        issues: ['Consider using more descriptive variable names'],
        suggestions: ['Use array methods like reduce() for better readability'],
        complexity: 'Low',
        maintainability: 'High',
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('openai'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Bearer'),
          }),
        })
      );
    });

    test('handles AI service error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' }),
      });

      await expect(aiAnalyzer.analyzeCodeQuality(mockCode, 'javascript'))
        .rejects.toThrow('AI analysis failed');
    });

    test('handles invalid JSON response', async () => {
      const invalidResponse = {
        choices: [{
          message: {
            content: 'Invalid JSON response',
          },
        }],
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidResponse),
      });

      await expect(aiAnalyzer.analyzeCodeQuality(mockCode, 'javascript'))
        .rejects.toThrow('Invalid AI response format');
    });
  });

  describe('generateInsights', () => {
    const mockAnalysisData = {
      files: [
        { name: 'App.js', complexity: 15, linesOfCode: 200 },
        { name: 'utils.js', complexity: 8, linesOfCode: 150 },
      ],
      dependencies: { total: 25, outdated: 3 },
      testCoverage: 75,
    };

    const mockInsightsResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            codeQuality: {
              score: 8.2,
              issues: ['High complexity in App.js'],
              suggestions: ['Consider breaking down large functions'],
            },
            security: {
              score: 7.5,
              vulnerabilities: ['Outdated dependencies detected'],
              recommendations: ['Update dependencies to latest versions'],
            },
            performance: {
              score: 9.0,
              bottlenecks: [],
              optimizations: ['Consider code splitting'],
            },
          }),
        },
      }],
    };

    test('successfully generates comprehensive insights', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockInsightsResponse),
      });

      const result = await aiAnalyzer.generateInsights(mockAnalysisData);

      expect(result).toHaveProperty('codeQuality');
      expect(result).toHaveProperty('security');
      expect(result).toHaveProperty('performance');
      expect(result.codeQuality.score).toBe(8.2);
      expect(result.security.vulnerabilities).toContain('Outdated dependencies detected');
    });

    test('handles empty analysis data', async () => {
      const result = await aiAnalyzer.generateInsights({});

      expect(result).toEqual({
        codeQuality: { score: 0, issues: [], suggestions: [] },
        security: { score: 0, vulnerabilities: [], recommendations: [] },
        performance: { score: 0, bottlenecks: [], optimizations: [] },
      });
    });
  });

  describe('suggestImprovements', () => {
    const mockFileContent = `
      function processData(data) {
        var result = [];
        for (var i = 0; i < data.length; i++) {
          if (data[i] != null) {
            result.push(data[i].toUpperCase());
          }
        }
        return result;
      }
    `;

    const mockSuggestionsResponse = {
      choices: [{
        message: {
          content: JSON.stringify([
            {
              type: 'modernization',
              line: 3,
              issue: 'Use let/const instead of var',
              suggestion: 'Replace var with const or let',
              priority: 'medium',
            },
            {
              type: 'performance',
              line: 4,
              issue: 'Consider using array methods',
              suggestion: 'Use filter() and map() for better readability',
              priority: 'low',
            },
          ]),
        },
      }],
    };

    test('successfully suggests code improvements', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuggestionsResponse),
      });

      const result = await aiAnalyzer.suggestImprovements(mockFileContent, 'javascript');

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('type', 'modernization');
      expect(result[0]).toHaveProperty('priority', 'medium');
      expect(result[1]).toHaveProperty('type', 'performance');
    });
  });
});

describe('Code Parser Service', () => {
  describe('parseJavaScript', () => {
    test('parses JavaScript code and extracts functions', () => {
      const code = `
        function add(a, b) {
          return a + b;
        }
        
        const multiply = (x, y) => x * y;
        
        class Calculator {
          divide(a, b) {
            return a / b;
          }
        }
      `;

      const result = codeParser.parseJavaScript(code);

      expect(result.functions).toHaveLength(3);
      expect(result.functions[0]).toMatchObject({
        name: 'add',
        type: 'function',
        parameters: ['a', 'b'],
      });
      expect(result.functions[1]).toMatchObject({
        name: 'multiply',
        type: 'arrow',
        parameters: ['x', 'y'],
      });
      expect(result.classes).toHaveLength(1);
      expect(result.classes[0].name).toBe('Calculator');
    });

    test('extracts imports and exports', () => {
      const code = `
        import React from 'react';
        import { useState, useEffect } from 'react';
        import * as utils from './utils';
        
        export default function Component() {
          return <div>Hello</div>;
        }
        
        export const helper = () => {};
      `;

      const result = codeParser.parseJavaScript(code);

      expect(result.imports).toHaveLength(3);
      expect(result.imports[0]).toMatchObject({
        source: 'react',
        type: 'default',
        name: 'React',
      });
      expect(result.exports).toHaveLength(2);
      expect(result.exports[0].type).toBe('default');
    });

    test('handles syntax errors gracefully', () => {
      const invalidCode = `
        function incomplete( {
          // missing closing bracket
      `;

      const result = codeParser.parseJavaScript(invalidCode);

      expect(result.error).toBeDefined();
      expect(result.functions).toHaveLength(0);
    });
  });

  describe('parseTypeScript', () => {
    test('parses TypeScript interfaces and types', () => {
      const code = `
        interface User {
          id: number;
          name: string;
          email?: string;
        }
        
        type Status = 'active' | 'inactive';
        
        function getUser(id: number): User {
          return { id, name: 'Test' };
        }
      `;

      const result = codeParser.parseTypeScript(code);

      expect(result.interfaces).toHaveLength(1);
      expect(result.interfaces[0]).toMatchObject({
        name: 'User',
        properties: expect.arrayContaining([
          expect.objectContaining({ name: 'id', type: 'number' }),
          expect.objectContaining({ name: 'name', type: 'string' }),
          expect.objectContaining({ name: 'email', type: 'string', optional: true }),
        ]),
      });
      expect(result.types).toHaveLength(1);
      expect(result.types[0].name).toBe('Status');
    });
  });

  describe('parseReact', () => {
    test('identifies React components and hooks', () => {
      const code = `
        import React, { useState, useEffect } from 'react';
        
        function MyComponent({ title }) {
          const [count, setCount] = useState(0);
          
          useEffect(() => {
            document.title = title;
          }, [title]);
          
          return <div>{count}</div>;
        }
        
        const MemoizedComponent = React.memo(MyComponent);
      `;

      const result = codeParser.parseReact(code);

      expect(result.components).toHaveLength(2);
      expect(result.components[0]).toMatchObject({
        name: 'MyComponent',
        type: 'functional',
        hooks: ['useState', 'useEffect'],
        props: ['title'],
      });
      expect(result.hooks).toContain('useState');
      expect(result.hooks).toContain('useEffect');
    });
  });

  describe('parsePackageJson', () => {
    test('extracts package information', () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        description: 'A test project',
        main: 'index.js',
        scripts: {
          start: 'node index.js',
          test: 'jest',
        },
        dependencies: {
          react: '^18.0.0',
          lodash: '^4.17.21',
        },
        devDependencies: {
          jest: '^29.0.0',
          eslint: '^8.0.0',
        },
      };

      const result = codeParser.parsePackageJson(packageJson);

      expect(result).toMatchObject({
        name: 'test-project',
        version: '1.0.0',
        description: 'A test project',
        mainFile: 'index.js',
        scripts: expect.objectContaining({
          start: 'node index.js',
          test: 'jest',
        }),
        dependencies: {
          production: expect.objectContaining({
            react: '^18.0.0',
            lodash: '^4.17.21',
          }),
          development: expect.objectContaining({
            jest: '^29.0.0',
            eslint: '^8.0.0',
          }),
          total: 4,
        },
      });
    });
  });
});

describe('Complexity Analyzer Service', () => {
  describe('calculateCyclomaticComplexity', () => {
    test('calculates complexity for simple function', () => {
      const code = `
        function simpleFunction(x) {
          return x + 1;
        }
      `;

      const complexity = complexityAnalyzer.calculateCyclomaticComplexity(code);
      expect(complexity).toBe(1); // Base complexity
    });

    test('calculates complexity with conditionals', () => {
      const code = `
        function complexFunction(x, y) {
          if (x > 0) {
            if (y > 0) {
              return x + y;
            } else {
              return x - y;
            }
          } else {
            return 0;
          }
        }
      `;

      const complexity = complexityAnalyzer.calculateCyclomaticComplexity(code);
      expect(complexity).toBe(4); // Base + 3 decision points
    });

    test('calculates complexity with loops', () => {
      const code = `
        function loopFunction(items) {
          let total = 0;
          for (let i = 0; i < items.length; i++) {
            if (items[i] > 0) {
              total += items[i];
            }
          }
          return total;
        }
      `;

      const complexity = complexityAnalyzer.calculateCyclomaticComplexity(code);
      expect(complexity).toBe(3); // Base + loop + condition
    });

    test('calculates complexity with switch statements', () => {
      const code = `
        function switchFunction(type) {
          switch (type) {
            case 'A':
              return 1;
            case 'B':
              return 2;
            case 'C':
              return 3;
            default:
              return 0;
          }
        }
      `;

      const complexity = complexityAnalyzer.calculateCyclomaticComplexity(code);
      expect(complexity).toBe(4); // Base + 3 cases (default doesn't count)
    });
  });

  describe('analyzeFileComplexity', () => {
    test('analyzes complexity of entire file', () => {
      const code = `
        function simple() {
          return 1;
        }
        
        function complex(x) {
          if (x > 0) {
            for (let i = 0; i < x; i++) {
              if (i % 2 === 0) {
                console.log(i);
              }
            }
          }
          return x;
        }
        
        class TestClass {
          method1() {
            return this.value || 0;
          }
          
          method2(condition) {
            return condition ? 'yes' : 'no';
          }
        }
      `;

      const result = complexityAnalyzer.analyzeFileComplexity(code);

      expect(result.totalComplexity).toBeGreaterThan(0);
      expect(result.averageComplexity).toBeGreaterThan(0);
      expect(result.functions).toHaveLength(4); // 2 functions + 2 methods
      expect(result.functions[0]).toMatchObject({
        name: 'simple',
        complexity: 1,
        linesOfCode: expect.any(Number),
      });
      expect(result.mostComplex.name).toBe('complex');
    });
  });

  describe('calculateMaintainabilityIndex', () => {
    test('calculates maintainability index', () => {
      const metrics = {
        linesOfCode: 100,
        cyclomaticComplexity: 10,
        halsteadVolume: 500,
      };

      const index = complexityAnalyzer.calculateMaintainabilityIndex(metrics);

      expect(index).toBeGreaterThan(0);
      expect(index).toBeLessThanOrEqual(100);
    });

    test('returns higher index for simpler code', () => {
      const simpleMetrics = {
        linesOfCode: 50,
        cyclomaticComplexity: 2,
        halsteadVolume: 100,
      };

      const complexMetrics = {
        linesOfCode: 200,
        cyclomaticComplexity: 20,
        halsteadVolume: 1000,
      };

      const simpleIndex = complexityAnalyzer.calculateMaintainabilityIndex(simpleMetrics);
      const complexIndex = complexityAnalyzer.calculateMaintainabilityIndex(complexMetrics);

      expect(simpleIndex).toBeGreaterThan(complexIndex);
    });
  });

  describe('identifyCodeSmells', () => {
    test('identifies long methods', () => {
      const longMethod = 'x'.repeat(1000); // Very long method
      const code = `function longMethod() { ${longMethod} }`;

      const smells = complexityAnalyzer.identifyCodeSmells(code);

      expect(smells).toContainEqual(
        expect.objectContaining({
          type: 'Long Method',
          severity: 'high',
        })
      );
    });

    test('identifies duplicate code', () => {
      const code = `
        function method1() {
          console.log('duplicate');
          console.log('duplicate');
          console.log('duplicate');
        }
        
        function method2() {
          console.log('duplicate');
          console.log('duplicate');
          console.log('duplicate');
        }
      `;

      const smells = complexityAnalyzer.identifyCodeSmells(code);

      expect(smells).toContainEqual(
        expect.objectContaining({
          type: 'Duplicate Code',
          severity: 'medium',
        })
      );
    });

    test('identifies magic numbers', () => {
      const code = `
        function calculate(value) {
          return value * 3.14159 + 42;
        }
      `;

      const smells = complexityAnalyzer.identifyCodeSmells(code);

      expect(smells).toContainEqual(
        expect.objectContaining({
          type: 'Magic Numbers',
          severity: 'low',
        })
      );
    });
  });
});

describe('Dependency Mapper Service', () => {
  describe('analyzeDependencies', () => {
    const mockPackageJson = {
      dependencies: {
        react: '^18.0.0',
        lodash: '^4.17.21',
        axios: '^1.0.0',
      },
      devDependencies: {
        jest: '^29.0.0',
        eslint: '^8.0.0',
        webpack: '^5.0.0',
      },
    };

    test('analyzes package.json dependencies', () => {
      const result = dependencyMapper.analyzeDependencies(mockPackageJson);

      expect(result.production).toHaveLength(3);
      expect(result.development).toHaveLength(3);
      expect(result.total).toBe(6);
      expect(result.production).toContainEqual(
        expect.objectContaining({
          name: 'react',
          version: '^18.0.0',
          type: 'production',
        })
      );
    });

    test('identifies security vulnerabilities', async () => {
      // Mock vulnerability database response
      const mockVulnerabilities = [
        {
          package: 'lodash',
          version: '4.17.20',
          severity: 'high',
          description: 'Prototype pollution vulnerability',
        },
      ];

      jest.spyOn(dependencyMapper, 'checkVulnerabilities')
        .mockResolvedValue(mockVulnerabilities);

      const result = await dependencyMapper.analyzeDependencies(mockPackageJson, {
        checkVulnerabilities: true,
      });

      expect(result.vulnerabilities).toHaveLength(1);
      expect(result.vulnerabilities[0]).toMatchObject({
        package: 'lodash',
        severity: 'high',
      });
    });
  });

  describe('mapImportGraph', () => {
    const mockFiles = [
      {
        path: 'src/App.js',
        content: `
          import React from 'react';
          import { Header } from './components/Header';
          import { Footer } from './components/Footer';
          import utils from './utils';
        `,
      },
      {
        path: 'src/components/Header.js',
        content: `
          import React from 'react';
          import { Logo } from './Logo';
        `,
      },
      {
        path: 'src/utils/index.js',
        content: `
          export const helper = () => {};
        `,
      },
    ];

    test('creates import dependency graph', () => {
      const graph = dependencyMapper.mapImportGraph(mockFiles);

      expect(graph.nodes).toContainEqual(
        expect.objectContaining({
          id: 'src/App.js',
          type: 'file',
        })
      );

      expect(graph.edges).toContainEqual(
        expect.objectContaining({
          source: 'src/App.js',
          target: 'src/components/Header',
          type: 'import',
        })
      );
    });

    test('identifies circular dependencies', () => {
      const circularFiles = [
        {
          path: 'src/A.js',
          content: `import B from './B';`,
        },
        {
          path: 'src/B.js',
          content: `import A from './A';`,
        },
      ];

      const graph = dependencyMapper.mapImportGraph(circularFiles);
      const cycles = dependencyMapper.findCircularDependencies(graph);

      expect(cycles).toHaveLength(1);
      expect(cycles[0]).toContain('src/A.js');
      expect(cycles[0]).toContain('src/B.js');
    });
  });

  describe('analyzeUnusedDependencies', () => {
    const mockPackageJson = {
      dependencies: {
        react: '^18.0.0',
        lodash: '^4.17.21',
        axios: '^1.0.0',
        'unused-package': '^1.0.0',
      },
    };

    const mockFiles = [
      {
        path: 'src/App.js',
        content: `
          import React from 'react';
          import _ from 'lodash';
          import axios from 'axios';
        `,
      },
    ];

    test('identifies unused dependencies', () => {
      const unused = dependencyMapper.analyzeUnusedDependencies(
        mockPackageJson,
        mockFiles
      );

      expect(unused).toContain('unused-package');
      expect(unused).not.toContain('react');
      expect(unused).not.toContain('lodash');
      expect(unused).not.toContain('axios');
    });
  });

  describe('generateDependencyTree', () => {
    test('creates hierarchical dependency tree', () => {
      const dependencies = [
        { name: 'react', version: '^18.0.0', dependencies: [] },
        { name: 'lodash', version: '^4.17.21', dependencies: [] },
        { name: 'axios', version: '^1.0.0', dependencies: ['follow-redirects'] },
      ];

      const tree = dependencyMapper.generateDependencyTree(dependencies);

      expect(tree.children).toHaveLength(3);
      expect(tree.children[2]).toMatchObject({
        name: 'axios',
        children: expect.arrayContaining([
          expect.objectContaining({ name: 'follow-redirects' }),
        ]),
      });
    });

    test('handles deeply nested dependencies', () => {
      const nestedDeps = [
        {
          name: 'parent',
          dependencies: [
            {
              name: 'child',
              dependencies: [
                { name: 'grandchild', dependencies: [] },
              ],
            },
          ],
        },
      ];

      const tree = dependencyMapper.generateDependencyTree(nestedDeps);

      expect(tree.children[0].children[0].children[0].name).toBe('grandchild');
    });
  });

  describe('performance optimization', () => {
    test('handles large dependency graphs efficiently', () => {
      const largeDependencyList = Array.from({ length: 1000 }, (_, i) => ({
        name: `package-${i}`,
        version: '1.0.0',
        dependencies: [],
      }));

      const startTime = performance.now();
      const tree = dependencyMapper.generateDependencyTree(largeDependencyList);
      const endTime = performance.now();

      expect(tree.children).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    test('memoizes dependency resolution', () => {
      const deps = [
        { name: 'react', version: '^18.0.0' },
        { name: 'react', version: '^18.0.0' }, // Duplicate
      ];

      const spy = jest.spyOn(dependencyMapper, 'resolveDependency');
      dependencyMapper.generateDependencyTree(deps);

      // Should only resolve each unique dependency once
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});

// Integration tests
describe('Service Integration', () => {
  test('full analysis pipeline', async () => {
    const mockRepoUrl = 'https://github.com/user/test-repo';
    
    // Mock GitHub API response
    const mockRepoData = {
      repository: { name: 'test-repo', language: 'JavaScript' },
      fileStructure: [
        { path: 'src/App.js', type: 'blob', size: 1024 },
        { path: 'package.json', type: 'blob', size: 512 },
      ],
    };

    const mockFileContent = `
      import React from 'react';
      
      function App() {
        const [count, setCount] = useState(0);
        
        if (count > 10) {
          return <div>Too many!</div>;
        }
        
        return <div>{count}</div>;
      }
    `;

    const mockPackageJson = {
      dependencies: { react: '^18.0.0' },
      devDependencies: { jest: '^29.0.0' },
    };

    // Mock service responses
    jest.spyOn(githubAPI, 'fetchRepositoryStructure')
      .mockResolvedValue(mockRepoData);
    jest.spyOn(githubAPI, 'fetchFileContent')
      .mockResolvedValueOnce({ content: mockFileContent })
      .mockResolvedValueOnce({ content: JSON.stringify(mockPackageJson) });

    // Perform full analysis
    const repoStructure = await githubAPI.fetchRepositoryStructure('user/test-repo');
    const fileContent = await githubAPI.fetchFileContent('user/test-repo', 'src/App.js');
    const packageContent = await githubAPI.fetchFileContent('user/test-repo', 'package.json');
    
    const parsedCode = codeParser.parseReact(fileContent.content);
    const complexity = complexityAnalyzer.analyzeFileComplexity(fileContent.content);
    const dependencies = dependencyMapper.analyzeDependencies(JSON.parse(packageContent.content));

    // Verify integration results
    expect(repoStructure.repository.name).toBe('test-repo');
    expect(parsedCode.components).toHaveLength(1);
    expect(parsedCode.components[0].name).toBe('App');
    expect(complexity.functions).toHaveLength(1);
    expect(dependencies.total).toBe(2);
  });

  test('error handling across services', async () => {
    // Test cascading error handling
    jest.spyOn(githubAPI, 'fetchRepositoryStructure')
      .mockRejectedValue(new Error('Repository not found'));

    try {
      await githubAPI.fetchRepositoryStructure('user/nonexistent-repo');
    } catch (error) {
      expect(error.message).toBe('Repository not found');
    }

    // Verify other services handle missing data gracefully
    const emptyAnalysis = complexityAnalyzer.analyzeFileComplexity('');
    expect(emptyAnalysis.totalComplexity).toBe(0);

    const emptyDeps = dependencyMapper.analyzeDependencies({});
    expect(emptyDeps.total).toBe(0);
  });
});