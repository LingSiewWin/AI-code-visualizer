// tests/integration/api.test.js
import request from 'supertest';
import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.GITHUB_TOKEN = 'test-token';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Import server after setting env vars
let app;
let server;

// Mock external services
jest.mock('../../server/services/githubService.js', () => ({
  fetchRepositoryStructure: jest.fn(),
  fetchFileContent: jest.fn(),
  validateRepository: jest.fn()
}));

jest.mock('../../server/services/openaiService.js', () => ({
  analyzeCode: jest.fn(),
  generateInsights: jest.fn()
}));

jest.mock('../../server/services/codeAnalysisService.js', () => ({
  analyzeComplexity: jest.fn(),
  calculateMetrics: jest.fn(),
  generateDependencyGraph: jest.fn()
}));

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Dynamic import to ensure mocks are set up first
    const serverModule = await import('../../server/server.js');
    app = serverModule.default || serverModule.app;
    
    // Start test server
    server = app.listen(0); // Use random port
  });

  afterAll(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GitHub API Integration', () => {
    test('GET /api/github/repository/:owner/:repo should return repository structure', async () => {
      const mockStructure = {
        name: 'test-repo',
        owner: 'test-owner',
        files: [
          { path: 'src/index.js', type: 'file', size: 1024 },
          { path: 'package.json', type: 'file', size: 512 }
        ],
        directories: ['src', 'tests'],
        totalFiles: 2,
        totalSize: 1536
      };

      const { fetchRepositoryStructure } = await import('../../server/services/githubService.js');
      fetchRepositoryStructure.mockResolvedValue(mockStructure);

      const response = await request(app)
        .get('/api/github/repository/test-owner/test-repo')
        .expect(200);

      expect(response.body).toEqual(mockStructure);
      expect(fetchRepositoryStructure).toHaveBeenCalledWith('test-owner', 'test-repo');
    });

    test('GET /api/github/file-content should return file content', async () => {
      const mockContent = {
        content: 'console.log("Hello World");',
        encoding: 'utf-8',
        size: 26,
        path: 'src/index.js'
      };

      const { fetchFileContent } = await import('../../server/services/githubService.js');
      fetchFileContent.mockResolvedValue(mockContent);

      const response = await request(app)
        .get('/api/github/file-content')
        .query({
          owner: 'test-owner',
          repo: 'test-repo',
          path: 'src/index.js'
        })
        .expect(200);

      expect(response.body).toEqual(mockContent);
      expect(fetchFileContent).toHaveBeenCalledWith('test-owner', 'test-repo', 'src/index.js');
    });

    test('GET /api/github/repository with invalid repo should return 404', async () => {
      const { fetchRepositoryStructure } = await import('../../server/services/githubService.js');
      fetchRepositoryStructure.mockRejectedValue(new Error('Repository not found'));

      const response = await request(app)
        .get('/api/github/repository/invalid/repo')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Repository not found');
    });
  });

  describe('Analysis API Integration', () => {
    test('POST /api/analyze/repository should perform full analysis', async () => {
      const mockAnalysisResult = {
        repository: {
          name: 'test-repo',
          owner: 'test-owner',
          language: 'JavaScript',
          size: 2048
        },
        metrics: {
          totalFiles: 5,
          linesOfCode: 1200,
          complexity: 8.5,
          maintainabilityIndex: 75
        },
        dependencies: {
          direct: ['react', 'express'],
          devDependencies: ['jest', 'eslint'],
          graph: {
            nodes: [
              { id: 'react', type: 'dependency' },
              { id: 'express', type: 'dependency' }
            ],
            edges: []
          }
        },
        insights: [
          'High test coverage detected',
          'Complex functions identified in auth.js'
        ]
      };

      // Mock all required services
      const { fetchRepositoryStructure } = await import('../../server/services/githubService.js');
      const { analyzeComplexity, calculateMetrics, generateDependencyGraph } = await import('../../server/services/codeAnalysisService.js');
      const { generateInsights } = await import('../../server/services/openaiService.js');

      fetchRepositoryStructure.mockResolvedValue(mockAnalysisResult.repository);
      calculateMetrics.mockResolvedValue(mockAnalysisResult.metrics);
      generateDependencyGraph.mockResolvedValue(mockAnalysisResult.dependencies);
      generateInsights.mockResolvedValue(mockAnalysisResult.insights);

      const response = await request(app)
        .post('/api/analyze/repository')
        .send({
          owner: 'test-owner',
          repo: 'test-repo',
          includeInsights: true
        })
        .expect(200);

      expect(response.body).toMatchObject({
        repository: expect.objectContaining({
          name: 'test-repo',
          owner: 'test-owner'
        }),
        metrics: expect.objectContaining({
          totalFiles: expect.any(Number),
          linesOfCode: expect.any(Number)
        }),
        dependencies: expect.objectContaining({
          direct: expect.any(Array),
          graph: expect.any(Object)
        })
      });
    });

    test('POST /api/analyze/complexity should return complexity analysis', async () => {
      const mockComplexityResult = {
        files: [
          {
            path: 'src/index.js',
            complexity: 5,
            functions: [
              { name: 'main', complexity: 3, loc: 25 },
              { name: 'helper', complexity: 2, loc: 10 }
            ]
          }
        ],
        averageComplexity: 3.5,
        highComplexityFiles: [],
        recommendations: ['Consider refactoring main function']
      };

      const { analyzeComplexity } = await import('../../server/services/codeAnalysisService.js');
      analyzeComplexity.mockResolvedValue(mockComplexityResult);

      const response = await request(app)
        .post('/api/analyze/complexity')
        .send({
          owner: 'test-owner',
          repo: 'test-repo',
          files: ['src/index.js']
        })
        .expect(200);

      expect(response.body).toEqual(mockComplexityResult);
      expect(analyzeComplexity).toHaveBeenCalledWith('test-owner', 'test-repo', ['src/index.js']);
    });
  });

  describe('AI Integration', () => {
    test('POST /api/ai/insights should generate AI insights', async () => {
      const mockInsights = {
        summary: 'This is a well-structured React application',
        recommendations: [
          'Consider adding more unit tests',
          'Some functions could be simplified'
        ],
        codeQuality: {
          score: 8.5,
          areas: ['testing', 'documentation', 'complexity']
        },
        architecture: {
          patterns: ['MVC', 'Component-based'],
          strengths: ['Clear separation of concerns'],
          weaknesses: ['Lack of error boundaries']
        }
      };

      const { generateInsights } = await import('../../server/services/openaiService.js');
      generateInsights.mockResolvedValue(mockInsights);

      const response = await request(app)
        .post('/api/ai/insights')
        .send({
          codeStructure: {
            files: ['src/App.js', 'src/components/Header.js'],
            metrics: { loc: 500, complexity: 6 }
          }
        })
        .expect(200);

      expect(response.body).toEqual(mockInsights);
      expect(generateInsights).toHaveBeenCalled();
    });

    test('POST /api/ai/code-review should provide code review', async () => {
      const mockReview = {
        overallScore: 7.5,
        issues: [
          {
            file: 'src/utils/helpers.js',
            line: 25,
            severity: 'warning',
            message: 'Consider using const instead of let',
            suggestion: 'const result = ...'
          }
        ],
        suggestions: [
          'Add JSDoc comments to functions',
          'Consider implementing error handling'
        ],
        positives: [
          'Good use of modern JavaScript features',
          'Clean code structure'
        ]
      };

      const { analyzeCode } = await import('../../server/services/openaiService.js');
      analyzeCode.mockResolvedValue(mockReview);

      const response = await request(app)
        .post('/api/ai/code-review')
        .send({
          files: [
            {
              path: 'src/utils/helpers.js',
              content: 'function helper() { let x = 1; return x; }'
            }
          ]
        })
        .expect(200);

      expect(response.body).toEqual(mockReview);
      expect(analyzeCode).toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle rate limiting', async () => {
      // Simulate rate limit exceeded
      const response = await request(app)
        .get('/api/github/repository/test/repo')
        .set('X-Forwarded-For', '192.168.1.1')
        .expect(429);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Too many requests');
    });

    test('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/analyze/repository')
        .send({
          // Missing required fields
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Validation failed');
    });

    test('should handle server errors gracefully', async () => {
      const { fetchRepositoryStructure } = await import('../../server/services/githubService.js');
      fetchRepositoryStructure.mockRejectedValue(new Error('Internal server error'));

      const response = await request(app)
        .get('/api/github/repository/test/repo')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('Authentication Integration', () => {
    test('should require authentication for protected routes', async () => {
      const response = await request(app)
        .post('/api/ai/insights')
        .send({
          codeStructure: { files: [] }
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Authentication required');
    });

    test('should accept valid API key', async () => {
      const mockInsights = { summary: 'Test insights' };
      const { generateInsights } = await import('../../server/services/openaiService.js');
      generateInsights.mockResolvedValue(mockInsights);

      const response = await request(app)
        .post('/api/ai/insights')
        .set('Authorization', 'Bearer valid-api-key')
        .send({
          codeStructure: { files: [] }
        })
        .expect(200);

      expect(response.body).toEqual(mockInsights);
    });
  });

  describe('Caching Integration', () => {
    test('should cache repository analysis results', async () => {
      const mockResult = { cached: true, data: 'test' };
      const { fetchRepositoryStructure } = await import('../../server/services/githubService.js');
      fetchRepositoryStructure.mockResolvedValue(mockResult);

      // First request
      await request(app)
        .get('/api/github/repository/test/repo')
        .expect(200);

      // Second request should use cache
      const response = await request(app)
        .get('/api/github/repository/test/repo')
        .expect(200);

      // Service should only be called once due to caching
      expect(fetchRepositoryStructure).toHaveBeenCalledTimes(1);
    });
  });
});