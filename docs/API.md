# 🚀 AI Code Visualizer API Documentation

## Overview

The AI Code Visualizer API provides endpoints for analyzing GitHub repositories, generating 3D visualizations, and obtaining AI-powered insights about code structure and quality.

**Base URL:** `https://api.ai-code-visualizer.com/v1`

## Authentication

All API requests require authentication using either:

### 1. API Key (Recommended)
```http
Authorization: Bearer YOUR_API_KEY
```

### 2. GitHub Token
```http
X-GitHub-Token: YOUR_GITHUB_TOKEN
```

## Rate Limiting

- **Free Tier:** 100 requests per hour
- **Pro Tier:** 1,000 requests per hour
- **Enterprise:** 10,000 requests per hour

Rate limit headers are included in all responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Endpoints

### Repository Analysis

#### `POST /analyze/repository`

Analyze a GitHub repository and generate visualization data.

**Request Body:**
```json
{
  "repository": "owner/repo-name",
  "branch": "main",
  "includeTests": true,
  "analysisDepth": "deep",
  "visualizationType": "3d-tree"
}
```

**Parameters:**
- `repository` (string, required): GitHub repository in format `owner/repo`
- `branch` (string, optional): Branch to analyze (default: `main`)
- `includeTests` (boolean, optional): Include test files in analysis (default: `true`)
- `analysisDepth` (string, optional): Analysis depth (`shallow`, `medium`, `deep`) (default: `medium`)
- `visualizationType` (string, optional): Visualization type (`3d-tree`, `network`, `sunburst`) (default: `3d-tree`)

**Response:**
```json
{
  "success": true,
  "data": {
    "analysisId": "uuid-string",
    "repository": {
      "name": "repo-name",
      "owner": "owner",
      "url": "https://github.com/owner/repo-name",
      "branch": "main",
      "lastCommit": "2024-01-15T10:30:00Z"
    },
    "structure": {
      "totalFiles": 234,
      "totalLines": 45678,
      "languages": {
        "JavaScript": 65.4,
        "CSS": 20.3,
        "HTML": 14.3
      },
      "directories": [...],
      "files": [...]
    },
    "metrics": {
      "complexity": {
        "average": 2.4,
        "max": 15,
        "distribution": {...}
      },
      "maintainability": 78.5,
      "testCoverage": 85.2,
      "duplicateCode": 3.1
    },
    "visualization": {
      "nodes": [...],
      "edges": [...],
      "layout": "force-directed"
    }
  }
}
```

#### `GET /analyze/repository/{analysisId}`

Retrieve analysis results by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "analysisId": "uuid-string",
    "status": "completed",
    "createdAt": "2024-01-15T10:30:00Z",
    "completedAt": "2024-01-15T10:32:15Z",
    "result": {...}
  }
}
```

### AI Insights

#### `POST /ai/insights`

Generate AI-powered insights for a repository.

**Request Body:**
```json
{
  "analysisId": "uuid-string",
  "focusAreas": ["architecture", "performance", "security"],
  "detailLevel": "comprehensive"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "type": "architecture",
        "title": "Modular Architecture Pattern Detected",
        "description": "The codebase follows a well-structured modular pattern...",
        "severity": "info",
        "suggestions": [
          "Consider implementing dependency injection for better testability",
          "Extract common utilities to shared modules"
        ],
        "affectedFiles": ["src/components/", "src/services/"]
      }
    ],
    "summary": {
      "overallScore": 8.5,
      "strengths": [...],
      "improvements": [...],
      "recommendations": [...]
    }
  }
}
```

### Code Metrics

#### `GET /metrics/complexity/{analysisId}`

Get detailed complexity metrics for analyzed repository.

**Response:**
```json
{
  "success": true,
  "data": {
    "cyclomaticComplexity": {
      "average": 2.4,
      "median": 2.0,
      "max": 15,
      "files": [
        {
          "path": "src/components/ComplexComponent.js",
          "complexity": 15,
          "functions": [...]
        }
      ]
    },
    "halsteadMetrics": {...},
    "maintainabilityIndex": 78.5
  }
}
```

#### `GET /metrics/dependencies/{analysisId}`

Get dependency analysis and potential issues.

**Response:**
```json
{
  "success": true,
  "data": {
    "dependencies": {
      "production": 45,
      "development": 23,
      "peerDependencies": 3
    },
    "vulnerabilities": [
      {
        "package": "package-name",
        "version": "1.2.3",
        "severity": "high",
        "advisory": "..."
      }
    ],
    "outdated": [...],
    "duplicates": [...],
    "bundleSize": {
      "total": "2.4MB",
      "gzipped": "680KB"
    }
  }
}
```

### Visualization

#### `GET /visualization/3d/{analysisId}`

Get 3D visualization data for Three.js rendering.

**Query Parameters:**
- `layout` (string): Layout algorithm (`force-directed`, `circular`, `hierarchical`)
- `colorScheme` (string): Color scheme (`default`, `complexity`, `language`, `activity`)

**Response:**
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "src/components/App.js",
        "type": "file",
        "position": [10, 20, 30],
        "size": 15,
        "color": "#3B82F6",
        "metadata": {
          "lines": 245,
          "complexity": 3,
          "language": "JavaScript"
        }
      }
    ],
    "edges": [
      {
        "source": "src/components/App.js",
        "target": "src/components/Header.js",
        "type": "import",
        "weight": 1
      }
    ],
    "layout": {
      "algorithm": "force-directed",
      "bounds": {
        "min": [-100, -100, -100],
        "max": [100, 100, 100]
      }
    }
  }
}
```

### User Management

#### `GET /user/profile`

Get current user profile information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "username": "johndoe",
    "email": "john@example.com",
    "plan": "pro",
    "usage": {
      "requestsThisMonth": 450,
      "requestsLimit": 1000,
      "analysesThisMonth": 23
    }
  }
}
```

#### `GET /user/analyses`

Get user's analysis history.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 10, max: 100)
- `status` (string): Filter by status (`pending`, `completed`, `failed`)

**Response:**
```json
{
  "success": true,
  "data": {
    "analyses": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "pages": 5
    }
  }
}
```

## Error Handling

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": {
    "code": "REPOSITORY_NOT_FOUND",
    "message": "The specified repository could not be found or is not accessible",
    "details": {
      "repository": "owner/repo-name",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Request body or parameters are invalid |
| `UNAUTHORIZED` | 401 | API key is missing or invalid |
| `FORBIDDEN` | 403 | Access denied to the requested resource |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `REPOSITORY_NOT_FOUND` | 404 | GitHub repository not found or inaccessible |
| `ANALYSIS_FAILED` | 500 | Repository analysis failed |
| `INTERNAL_ERROR` | 500 | Internal server error |

## SDKs and Libraries

### JavaScript/Node.js
```bash
npm install @ai-code-visualizer/sdk
```

```javascript
import { AICodeVisualizer } from '@ai-code-visualizer/sdk';

const client = new AICodeVisualizer({
  apiKey: 'your-api-key'
});

const analysis = await client.analyzeRepository({
  repository: 'facebook/react',
  analysisDepth: 'deep'
});
```

### Python
```bash
pip install ai-code-visualizer
```

```python
from ai_code_visualizer import Client

client = Client(api_key='your-api-key')
analysis = client.analyze_repository(
    repository='facebook/react',
    analysis_depth='deep'
)
```

## Webhooks

Configure webhooks to receive real-time notifications about analysis completion.

### Webhook Events

- `analysis.completed` - Analysis finished successfully
- `analysis.failed` - Analysis failed
- `usage.limit_reached` - Usage limit reached

### Webhook Payload Example

```json
{
  "event": "analysis.completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "analysisId": "uuid-string",
    "repository": "owner/repo-name",
    "status": "completed",
    "url": "https://api.ai-code-visualizer.com/v1/analyze/repository/uuid-string"
  }
}
```

## Rate Limits and Quotas

### Free Tier
- 100 API requests per hour
- 10 repository analyses per month
- Basic visualization features

### Pro Tier ($19/month)
- 1,000 API requests per hour
- 100 repository analyses per month
- Advanced AI insights
- Priority support

### Enterprise (Custom pricing)
- 10,000+ API requests per hour
- Unlimited repository analyses
- Custom integrations
- Dedicated support

## Support

- **Documentation:** [https://docs.ai-code-visualizer.com](https://docs.ai-code-visualizer.com)
- **API Status:** [https://status.ai-code-visualizer.com](https://status.ai-code-visualizer.com)
- **Support Email:** [support@ai-code-visualizer.com](mailto:support@ai-code-visualizer.com)
- **Discord Community:** [https://discord.gg/ai-code-viz](https://discord.gg/ai-code-viz)