// tests/integration/analysis.test.js
import { jest } from '@jest/globals';

// Mock external dependencies
jest.mock('../../server/services/githubService.js');
jest.mock('../../server/services/openaiService.js');
jest.mock('../../server/services/cachingService.js');

// Import services after mocking
const { analyzeComplexity, calculateMetrics, generateDependencyGraph } = await import('../../server/services/codeAnalysisService.js');
const { fetchRepositoryStructure, fetchFileContent } = await import('../../server/services/githubService.js');
const { generateInsights, analyzeCode } = await import('../../server/services/openaiService.js');
const { get: cacheGet, set: cacheSet } = await import('../../server/services/cachingService.js');

describe('Analysis Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Repository Analysis Pipeline', () => {
    test('should perform complete repository analysis workflow', async () => {
      // Mock repository structure
      const mockRepo = {
        name: 'test-project',
        owner: 'developer',
        files: [
          { path: 'src/index.js', type: 'file', size: 1500, language: 'JavaScript' },
          { path: 'src/components/App.jsx', type: 'file', size: 2300, language: 'JavaScript' },
          { path: 'src/utils/helpers.js', type: 'file', size: 800, language: 'JavaScript' },
          { path: 'package.json', type: 'file', size: 650, language: 'JSON' },
          { path: 'README.md', type: 'file', size: 1200, language: 'Markdown' }
        ],
        totalFiles: 5,
        totalSize: 6450,
        languages: { JavaScript: 4600, JSON: 650, Markdown: 1200 },
        branches: ['main', 'develop'],
        lastCommit: '2024-01-15T10:30:00Z'
      };

      // Mock file contents
      const mockFileContents = {
        'src/index.js': `
          import React from 'react';
          import ReactDOM from 'react-dom';
          import App from './components/App';

          function renderApp() {
            const root = document.getElementById('root');
            if (root) {
              ReactDOM.render(<App />, root);
            }
          }

          renderApp();
        `,
        'src/components/App.jsx': `
          import React, { useState, useEffect } from 'react';
          import { fetchData } from '../utils/helpers';

          function App() {
            const [data, setData] = useState(null);
            const [loading, setLoading] = useState(true);
            const [error, setError] = useState(null);

            useEffect(() => {
              async function loadData() {
                try {
                  setLoading(true);
                  const result = await fetchData();
                  setData(result);
                } catch (err) {
                  setError(err.message);
                } finally {
                  setLoading(false);
                }
              }
              loadData();
            }, []);

            if (loading) return <div>Loading...</div>;
            if (error) return <div>Error: {error}</div>;
            
            return (
              <div className="app">
                <h1>Data Viewer</h1>
                <pre>{JSON.stringify(data, null, 2)}</pre>
              </div>
            );
          }

          export default App;
        `,
        'src/utils/helpers.js': `
          export async function fetchData() {
            const response = await fetch('/api/data');
            if (!response.ok) {
              throw new Error('Failed to fetch data');
            }
            return response.json();
          }

          export function formatDate(date) {
            return new Date(date).toLocaleDateString();
          }

          export const debounce = (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
              const later = () => {
                clearTimeout(timeout);
                func(...args);
              };
              clearTimeout(timeout);
              timeout = setTimeout(later, wait);
            };
          };
        `,
        'package.json': `{
          "name": "test-project",
          "version": "1.0.0",
          "dependencies": {
            "react": "^18.2.0",
            "react-dom": "^18.2.0"
          },
          "devDependencies": {
            "jest": "^29.0.0",
            "@testing-library/react": "^13.0.0"
          }
        }`
      };

      // Setup mocks
      fetchRepositoryStructure.mockResolvedValue(mockRepo);
      fetchFileContent.mockImplementation((owner, repo, path) => {
        return Promise.resolve({
          content: mockFileContents[path] || '',
          encoding: 'utf-8',
          size: mockFileContents[path]?.length || 0,
          path
        });
      });

      cacheGet.mockResolvedValue(null); // No cache hit
      cacheSet.mockResolvedValue(true);

      // Mock AI insights
      const mockInsights = {
        summary: 'Well-structured React application with proper error handling',
        recommendations: [
          'Consider adding PropTypes for better type checking',
          'Add loading states for better UX',
          'Implement error boundaries'
        ],
        codeQuality: {
          score: 8.2,
          areas: ['testing', 'documentation', 'accessibility']
        },
        architecture: {
          patterns: ['React Hooks', 'Component composition'],
          strengths: ['Clean separation of concerns', 'Proper error handling'],
          weaknesses: ['Missing test coverage', 'No accessibility features']
        }
      };

      generateInsights.mockResolvedValue(mockInsights);

      // Execute analysis pipeline
      const analysisResult = await performCompleteAnalysis('developer', 'test-project');

      // Verify repository structure was fetched
      expect(fetchRepositoryStructure).toHaveBeenCalledWith('developer', 'test-project');

      // Verify file contents were fetched for JavaScript files
      expect(fetchFileContent).toHaveBeenCalledWith('developer', 'test-project', 'src/index.js');
      expect(fetchFileContent).toHaveBeenCalledWith('developer', 'test-project', 'src/components/App.jsx');
      expect(fetchFileContent).toHaveBeenCalledWith('developer', 'test-project', 'src/utils/helpers.js');

      // Verify analysis results structure
      expect(analysisResult).toHaveProperty('repository');
      expect(analysisResult).toHaveProperty('metrics');
      expect(analysisResult).toHaveProperty('complexity');
      expect(analysisResult).toHaveProperty('dependencies');
      expect(analysisResult).toHaveProperty('insights');

      // Verify specific analysis results
      expect(analysisResult.repository).toMatchObject({
        name: 'test-project',
        owner: 'developer',
        totalFiles: 5
      });

      expect(analysisResult.metrics).toMatchObject({
        linesOfCode: expect.any(Number),
        totalFiles: 5,
        languages: expect.objectContaining({
          JavaScript: expect.any(Number)
        })
      });

      expect(analysisResult.insights).toEqual(mockInsights);
    });

    test('should handle complex dependency analysis', async () => {
      const mockPackageJson = {
        dependencies: {
          'react': '^18.2.0',
          'react-dom': '^18.2.0',
          'lodash': '^4.17.21',
          'axios': '^1.0.0',
          'moment': '^2.29.0'
        },
        devDependencies: {
          'jest': '^29.0.0',
          'webpack': '^5.70.0',
          'babel-loader': '^8.2.0',
          '@testing-library/react': '^13.0.0'
        }
      };

      const mockFiles = [
        {
          path: 'src/components/DataTable.jsx',
          content: `
            import React from 'react';
            import _ from 'lodash';
            import axios from 'axios';
            import moment from 'moment';
            
            export default function DataTable({ data }) {
              const sortedData = _.sortBy(data, 'date');
              
              const fetchMore = async () => {
                const response = await axios.get('/api/more-data');
                return response.data;
              };
              
              return (
                <table>
                  {sortedData.map(item => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{moment(item.date).format('MM/DD/YYYY')}</td>
                    </tr>
                  ))}
                </table>
              );
            }
          `
        }
      ];

      fetchFileContent.mockImplementation((owner, repo, path) => {
        if (path === 'package.json') {
          return Promise.resolve({
            content: JSON.stringify(mockPackageJson, null, 2),
            path: 'package.json'
          });
        }
        const file = mockFiles.find(f => f.path === path);
        return Promise.resolve({
          content: file?.content || '',
          path
        });
      });

      const dependencyResult = await generateDependencyGraph('test-owner', 'test-repo', ['src/components/DataTable.jsx']);

      expect(dependencyResult).toHaveProperty('graph');
      expect(dependencyResult).toHaveProperty('dependencies');
      expect(dependencyResult).toHaveProperty('devDependencies');
      
      // Should detect React, lodash, axios, moment as dependencies
      expect(dependencyResult.dependencies.direct).toContain('react');
      expect(dependencyResult.dependencies.direct).toContain('lodash');
      expect(dependencyResult.dependencies.direct).toContain('axios');
      expect(dependencyResult.dependencies.direct).toContain('moment');

      // Should create dependency graph
      expect(dependencyResult.graph.nodes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'react', type: 'dependency' }),
          expect.objectContaining({ id: 'lodash', type: 'dependency' }),
          expect.objectContaining({ id: 'axios', type: 'dependency' }),
          expect.objectContaining({ id: 'moment', type: 'dependency' })
        ])
      );
    });

    test('should calculate accurate complexity metrics', async () => {
      const complexCodeExample = `
        function complexFunction(data, options = {}) {
          if (!data || !Array.isArray(data)) {
            throw new Error('Invalid data provided');
          }
          
          const { sortBy, filterBy, limit = 10 } = options;
          let result = [...data];
          
          // Multiple nested conditions
          if (filterBy) {
            result = result.filter(item => {
              if (typeof filterBy === 'string') {
                return item.category === filterBy;
              } else if (typeof filterBy === 'object') {
                for (const [key, value] of Object.entries(filterBy)) {
                  if (Array.isArray(value)) {
                    if (!value.includes(item[key])) {
                      return false;
                    }
                  } else {
                    if (item[key] !== value) {
                      return false;
                    }
                  }
                }
                return true;
              }
              return true;
            });
          }
          
          // Sorting logic
          if (sortBy) {
            result = result.sort((a, b) => {
              const aVal = a[sortBy];
              const bVal = b[sortBy];
              
              if (typeof aVal === 'string' && typeof bVal === 'string') {
                return aVal.localeCompare(bVal);
              } else if (typeof aVal === 'number' && typeof bVal === 'number') {
                return aVal - bVal;
              } else {
                return String(aVal).localeCompare(String(bVal));
              }
            });
          }
          
          return result.slice(0, limit);
        }
        
        function simpleFunction(x, y) {
          return x + y;
        }
        
        class DataProcessor {
          constructor(config) {
            this.config = config;
            this.cache = new Map();
          }
          
          process(data) {
            const cacheKey = JSON.stringify(data);
            if (this.cache.has(cacheKey)) {
              return this.cache.get(cacheKey);
            }
            
            const result = this.config.transform ? 
              this.config.transform(data) : 
              data;
            
            this.cache.set(cacheKey, result);
            return result;
          }
        }
      `;

      const mockFiles = [
        {
          path: 'src/utils/processor.js',
          content: complexCodeExample
        }
      ];

      fetchFileContent.mockImplementation((owner, repo, path) => {
        const file = mockFiles.find(f => f.path === path);
        return Promise.resolve({
          content: file?.content || '',
          path
        });
      });

      const complexityResult = await analyzeComplexity('test-owner', 'test-repo', ['src/utils/processor.js']);

      expect(complexityResult).toHaveProperty('files');
      expect(complexityResult).toHaveProperty('averageComplexity');
      expect(complexityResult).toHaveProperty('highComplexityFiles');
      expect(complexityResult).toHaveProperty('recommendations');

      // Should identify high complexity in complexFunction
      const processorFile = complexityResult.files.find(f => f.path === 'src/utils/processor.js');
      expect(processorFile).toBeDefined();
      expect(processorFile.functions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'complexFunction',
            complexity: expect.any(Number)
          }),
          expect.objectContaining({
            name: 'simpleFunction',
            complexity: expect.any(Number)
          })
        ])
      );

      // Complex function should have higher complexity than simple function
      const complexFunc = processorFile.functions.find(f => f.name === 'complexFunction');
      const simpleFunc = processorFile.functions.find(f => f.name === 'simpleFunction');
      expect(complexFunc.complexity).toBeGreaterThan(simpleFunc.complexity);
    });
  });

  describe('Analysis Error Handling', () => {
    test('should handle GitHub API errors gracefully', async () => {
      fetchRepositoryStructure.mockRejectedValue(new Error('API rate limit exceeded'));

      await expect(
        performCompleteAnalysis('test-owner', 'nonexistent-repo')
      ).rejects.toThrow('API rate limit exceeded');

      expect(fetchRepositoryStructure).toHaveBeenCalledWith('test-owner', 'nonexistent-repo');
    });

    test('should handle malformed file content', async () => {
      const invalidJson = '{ invalid json content }';
      
      fetchFileContent.mockResolvedValue({
        content: invalidJson,
        path: 'package.json'
      });

      const result = await generateDependencyGraph('test-owner', 'test-repo', ['package.json']);

      // Should gracefully handle parse errors
      expect(result).toHaveProperty('dependencies');
      expect(result).toHaveProperty('parseErrors');
      expect(result.parseErrors).toContain('package.json');
    });

    test('should handle AI service failures', async () => {
      const mockRepo = {
        name: 'test-repo',
        files: [{ path: 'src/index.js', type: 'file' }]
      };

      fetchRepositoryStructure.mockResolvedValue(mockRepo);
      fetchFileContent.mockResolvedValue({ content: 'console.log("test");', path: 'src/index.js' });
      
      // Mock AI service failure
      generateInsights.mockRejectedValue(new Error('OpenAI API unavailable'));

      const result = await performCompleteAnalysis('test-owner', 'test-repo');

      // Should still return analysis without AI insights
      expect(result).toHaveProperty('repository');
      expect(result).toHaveProperty('metrics');
      expect(result.insights).toBeNull();
      expect(result.errors).toContain('AI insights unavailable');
    });
  });

  describe('Performance and Caching', () => {
    test('should use cached results when available', async () => {
      const cachedResult = {
        repository: { name: 'cached-repo' },
        metrics: { totalFiles: 10 },
        timestamp: Date.now()
      };

      cacheGet.mockResolvedValue(cachedResult);

      const result = await performCompleteAnalysis('test-owner', 'cached-repo');

      expect(result).toEqual(cachedResult);
      expect(fetchRepositoryStructure).not.toHaveBeenCalled();
      expect(cacheGet).toHaveBeenCalledWith('analysis:test-owner:cached-repo');
    });

    test('should cache new analysis results', async () => {
      const mockRepo = {
        name: 'new-repo',
        files: [{ path: 'src/index.js', type: 'file', size: 1000 }]
      };

      const mockAnalysisResult = {
        repository: mockRepo,
        metrics: { totalFiles: 1, linesOfCode: 50 },
        complexity: { averageComplexity: 2.5 },
        dependencies: { direct: [], devDependencies: [] },
        insights: null
      };

      cacheGet.mockResolvedValue(null); // No cache hit
      fetchRepositoryStructure.mockResolvedValue(mockRepo);
      fetchFileContent.mockResolvedValue({
        content: 'console.log("Hello World");',
        path: 'src/index.js'
      });

      const result = await performCompleteAnalysis('test-owner', 'new-repo');

      expect(cacheSet).toHaveBeenCalledWith(
        'analysis:test-owner:new-repo',
        expect.objectContaining({
          repository: expect.any(Object),
          metrics: expect.any(Object)
        }),
        expect.any(Number) // TTL
      );
    });

    test('should handle large repository analysis efficiently', async () => {
      // Mock large repository with 100+ files
      const largeRepo = {
        name: 'large-repo',
        files: Array.from({ length: 150 }, (_, i) => ({
          path: `src/component${i}.js`,
          type: 'file',
          size: Math.floor(Math.random() * 5000) + 500,
          language: 'JavaScript'
        })),
        totalFiles: 150,
        totalSize: 500000
      };

      fetchRepositoryStructure.mockResolvedValue(largeRepo);
      fetchFileContent.mockImplementation((owner, repo, path) => {
        return Promise.resolve({
          content: `// Component ${path}\nfunction Component() { return null; }`,
          path,
          size: 100
        });
      });

      const startTime = Date.now();
      const result = await performCompleteAnalysis('test-owner', 'large-repo');
      const endTime = Date.now();

      // Should complete within reasonable time (less than 30 seconds for mock)
      expect(endTime - startTime).toBeLessThan(30000);

      // Should handle all files
      expect(result.repository.totalFiles).toBe(150);
      expect(result.metrics.totalFiles).toBe(150);

      // Should not fetch content for all files (should be selective)
      expect(fetchFileContent.mock.calls.length).toBeLessThan(150);
    });
  });

  describe('Multi-language Analysis', () => {
    test('should analyze polyglot repositories correctly', async () => {
      const polyglotRepo = {
        name: 'polyglot-project',
        files: [
          { path: 'src/frontend/App.jsx', type: 'file', language: 'JavaScript' },
          { path: 'src/backend/main.py', type: 'file', language: 'Python' },
          { path: 'src/backend/models.py', type: 'file', language: 'Python' },
          { path: 'src/mobile/MainActivity.java', type: 'file', language: 'Java' },
          { path: 'src/shared/types.ts', type: 'file', language: 'TypeScript' },
          { path: 'docker-compose.yml', type: 'file', language: 'YAML' },
          { path: 'Dockerfile', type: 'file', language: 'Dockerfile' }
        ],
        languages: {
          JavaScript: 2500,
          Python: 4000,
          Java: 1800,
          TypeScript: 1200,
          YAML: 300,
          Dockerfile: 150
        }
      };

      const mockFileContents = {
        'src/frontend/App.jsx': `
          import React from 'react';
          export default function App() {
            return <div>Hello World</div>;
          }
        `,
        'src/backend/main.py': `
          from fastapi import FastAPI
          from models import User
          
          app = FastAPI()
          
          @app.get("/users")
          def get_users():
              return User.get_all()
        `,
        'src/backend/models.py': `
          from sqlalchemy import Column, Integer, String
          from database import Base
          
          class User(Base):
              __tablename__ = 'users'
              id = Column(Integer, primary_key=True)
              name = Column(String(50))
              
              @classmethod
              def get_all(cls):
                  return cls.query.all()
        `,
        'src/mobile/MainActivity.java': `
          package com.example.app;
          
          import android.app.Activity;
          import android.os.Bundle;
          
          public class MainActivity extends Activity {
              @Override
              protected void onCreate(Bundle savedInstanceState) {
                  super.onCreate(savedInstanceState);
                  setContentView(R.layout.activity_main);
              }
          }
        `,
        'src/shared/types.ts': `
          export interface User {
            id: number;
            name: string;
            email?: string;
          }
          
          export type UserRole = 'admin' | 'user' | 'guest';
        `
      };

      fetchRepositoryStructure.mockResolvedValue(polyglotRepo);
      fetchFileContent.mockImplementation((owner, repo, path) => {
        return Promise.resolve({
          content: mockFileContents[path] || '',
          path,
          language: polyglotRepo.files.find(f => f.path === path)?.language
        });
      });

      const result = await performCompleteAnalysis('test-owner', 'polyglot-project');

      // Should analyze all languages
      expect(result.metrics.languages).toMatchObject({
        JavaScript: expect.any(Number),
        Python: expect.any(Number),
        Java: expect.any(Number),
        TypeScript: expect.any(Number)
      });

      // Should detect cross-language dependencies
      expect(result.dependencies).toHaveProperty('crossLanguage');
      expect(result.dependencies.crossLanguage).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            from: 'src/frontend/App.jsx',
            to: 'src/shared/types.ts',
            type: 'import'
          })
        ])
      );

      // Should provide language-specific insights
      expect(result.insights.languages).toEqual(
        expect.objectContaining({
          JavaScript: expect.any(Array),
          Python: expect.any(Array),
          Java: expect.any(Array),
          TypeScript: expect.any(Array)
        })
      );
    });
  });

  describe('Real-time Analysis Updates', () => {
    test('should handle incremental analysis updates', async () => {
      const initialRepo = {
        name: 'evolving-repo',
        files: [
          { path: 'src/index.js', type: 'file', lastModified: '2024-01-01T00:00:00Z' }
        ]
      };

      const updatedRepo = {
        name: 'evolving-repo',
        files: [
          { path: 'src/index.js', type: 'file', lastModified: '2024-01-01T00:00:00Z' },
          { path: 'src/newComponent.js', type: 'file', lastModified: '2024-01-02T00:00:00Z' }
        ]
      };

      // First analysis
      fetchRepositoryStructure.mockResolvedValueOnce(initialRepo);
      fetchFileContent.mockResolvedValue({
        content: 'console.log("initial");',
        path: 'src/index.js'
      });

      const firstResult = await performCompleteAnalysis('test-owner', 'evolving-repo');
      expect(firstResult.repository.files).toHaveLength(1);

      // Second analysis with updates
      fetchRepositoryStructure.mockResolvedValueOnce(updatedRepo);
      fetchFileContent.mockImplementation((owner, repo, path) => {
        const contents = {
          'src/index.js': 'console.log("updated");',
          'src/newComponent.js': 'function NewComponent() { return null; }'
        };
        return Promise.resolve({
          content: contents[path] || '',
          path
        });
      });

      const secondResult = await performIncrementalAnalysis('test-owner', 'evolving-repo', firstResult);
      
      expect(secondResult.repository.files).toHaveLength(2);
      expect(secondResult.changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'added',
            path: 'src/newComponent.js'
          })
        ])
      );
    });
  });
});

// Helper functions used in tests
async function performCompleteAnalysis(owner, repo) {
  try {
    // Check cache first
    const cacheKey = `analysis:${owner}:${repo}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch repository structure
    const repository = await fetchRepositoryStructure(owner, repo);
    
    // Calculate basic metrics
    const metrics = await calculateMetrics(repository);
    
    // Analyze complexity for code files
    const codeFiles = repository.files
      .filter(file => /\.(js|jsx|ts|tsx|py|java|cpp|c|cs)$/i.test(file.path))
      .slice(0, 50); // Limit for performance
    
    const complexity = codeFiles.length > 0 ? 
      await analyzeComplexity(owner, repo, codeFiles.map(f => f.path)) : 
      { files: [], averageComplexity: 0, recommendations: [] };
    
    // Generate dependency graph
    const dependencies = await generateDependencyGraph(owner, repo, codeFiles.map(f => f.path));
    
    // Generate AI insights (optional)
    let insights = null;
    let errors = [];
    
    try {
      const analysisData = {
        repository,
        metrics,
        complexity,
        dependencies
      };
      insights = await generateInsights(analysisData);
    } catch (error) {
      errors.push('AI insights unavailable');
      insights = null;
    }

    const result = {
      repository,
      metrics,
      complexity,
      dependencies,
      insights,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: Date.now()
    };

    // Cache the result
    await cacheSet(cacheKey, result, 3600); // 1 hour TTL

    return result;
  } catch (error) {
    throw error;
  }
}

async function performIncrementalAnalysis(owner, repo, previousResult) {
  const newRepository = await fetchRepositoryStructure(owner, repo);
  
  // Compare with previous analysis
  const changes = detectChanges(previousResult.repository, newRepository);
  
  // Only re-analyze changed files
  const changedFiles = changes
    .filter(change => change.type === 'modified' || change.type === 'added')
    .map(change => change.path);
  
  let updatedMetrics = previousResult.metrics;
  let updatedComplexity = previousResult.complexity;
  
  if (changedFiles.length > 0) {
    updatedMetrics = await calculateMetrics(newRepository);
    updatedComplexity = await analyzeComplexity(owner, repo, changedFiles);
  }
  
  return {
    ...previousResult,
    repository: newRepository,
    metrics: updatedMetrics,
    complexity: updatedComplexity,
    changes,
    timestamp: Date.now()
  };
}

function detectChanges(oldRepo, newRepo) {
  const changes = [];
  const oldFiles = new Map(oldRepo.files.map(f => [f.path, f]));
  const newFiles = new Map(newRepo.files.map(f => [f.path, f]));
  
  // Detect added files
  for (const [path, file] of newFiles) {
    if (!oldFiles.has(path)) {
      changes.push({ type: 'added', path, file });
    }
  }
  
  // Detect removed files
  for (const [path, file] of oldFiles) {
    if (!newFiles.has(path)) {
      changes.push({ type: 'removed', path, file });
    }
  }
  
  // Detect modified files
  for (const [path, newFile] of newFiles) {
    const oldFile = oldFiles.get(path);
    if (oldFile && oldFile.lastModified !== newFile.lastModified) {
      changes.push({ type: 'modified', path, file: newFile, previousFile: oldFile });
    }
  }
  
  return changes;
}