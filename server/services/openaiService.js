const OpenAI = require('openai');
const logger = require('../utils/logger');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.models = {
      gpt4: 'gpt-4-turbo-preview',
      gpt35: 'gpt-3.5-turbo',
      embedding: 'text-embedding-3-small'
    };
  }

  /**
   * Analyze code structure and provide insights
   * @param {Object} codeData - Parsed code data
   * @returns {Promise<Object>} AI analysis results
   */
  async analyzeCodeStructure(codeData) {
    try {
      const prompt = this.buildCodeAnalysisPrompt(codeData);
      
      const response = await this.client.chat.completions.create({
        model: this.models.gpt4,
        messages: [
          {
            role: 'system',
            content: 'You are an expert code analyzer. Provide detailed insights about code structure, patterns, and potential improvements.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      logger.info('Code analysis completed successfully');
      
      return {
        success: true,
        data: {
          insights: analysis.insights || [],
          patterns: analysis.patterns || [],
          recommendations: analysis.recommendations || [],
          complexity: analysis.complexity || 'medium',
          maintainability: analysis.maintainability || 'good',
          technical_debt: analysis.technical_debt || 'low',
          architecture_score: analysis.architecture_score || 7.5
        }
      };
    } catch (error) {
      logger.error('OpenAI code analysis failed:', error);
      return {
        success: false,
        error: 'Failed to analyze code structure',
        details: error.message
      };
    }
  }

  /**
   * Generate code quality metrics and suggestions
   * @param {Object} fileData - Individual file data
   * @returns {Promise<Object>} Quality analysis
   */
  async analyzeCodeQuality(fileData) {
    try {
      const prompt = `
        Analyze this code file for quality metrics:
        
        File: ${fileData.name}
        Language: ${fileData.language}
        Lines of Code: ${fileData.linesOfCode}
        
        Code:
        ${fileData.content.substring(0, 3000)}...
        
        Provide a JSON response with:
        - quality_score (0-10)
        - issues (array of issues found)
        - suggestions (array of improvement suggestions)
        - complexity_rating (low/medium/high)
        - readability_score (0-10)
      `;

      const response = await this.client.chat.completions.create({
        model: this.models.gpt35,
        messages: [
          {
            role: 'system',
            content: 'You are a code quality analyzer. Focus on readability, maintainability, and best practices.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        data: analysis
      };
    } catch (error) {
      logger.error('Code quality analysis failed:', error);
      return {
        success: false,
        error: 'Failed to analyze code quality'
      };
    }
  }

  /**
   * Generate repository summary and overview
   * @param {Object} repoData - Repository metadata
   * @returns {Promise<Object>} Repository summary
   */
  async generateRepositorySummary(repoData) {
    try {
      const prompt = `
        Generate a comprehensive summary for this repository:
        
        Repository: ${repoData.name}
        Description: ${repoData.description}
        Language: ${repoData.language}
        Stars: ${repoData.stars}
        Forks: ${repoData.forks}
        Files: ${repoData.fileCount}
        Total Lines: ${repoData.totalLines}
        
        File Structure:
        ${JSON.stringify(repoData.structure, null, 2)}
        
        Provide a JSON response with:
        - summary (brief overview)
        - purpose (what the project does)
        - architecture_type (monolith/microservices/library/etc)
        - tech_stack (array of technologies used)
        - complexity_level (beginner/intermediate/advanced)
        - estimated_development_time (hours)
        - key_features (array of main features)
      `;

      const response = await this.client.chat.completions.create({
        model: this.models.gpt4,
        messages: [
          {
            role: 'system',
            content: 'You are a software architect analyzing repository structure and purpose.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      });

      const summary = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        data: summary
      };
    } catch (error) {
      logger.error('Repository summary generation failed:', error);
      return {
        success: false,
        error: 'Failed to generate repository summary'
      };
    }
  }

  /**
   * Suggest architectural improvements
   * @param {Object} analysisData - Code analysis data
   * @returns {Promise<Object>} Architecture suggestions
   */
  async suggestArchitecturalImprovements(analysisData) {
    try {
      const prompt = `
        Based on this code analysis, suggest architectural improvements:
        
        Current Metrics:
        - Complexity: ${analysisData.complexity}
        - Maintainability: ${analysisData.maintainability}
        - Technical Debt: ${analysisData.technicalDebt}
        - File Count: ${analysisData.fileCount}
        - Dependencies: ${analysisData.dependencies?.length || 0}
        
        Issues Found:
        ${JSON.stringify(analysisData.issues, null, 2)}
        
        Provide JSON response with:
        - priority_improvements (array with priority, description, impact)
        - architectural_patterns (suggested patterns to implement)
        - refactoring_opportunities (specific refactoring suggestions)
        - performance_optimizations (performance improvement suggestions)
        - security_considerations (security improvements)
      `;

      const response = await this.client.chat.completions.create({
        model: this.models.gpt4,
        messages: [
          {
            role: 'system',
            content: 'You are a senior software architect providing improvement recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const suggestions = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        data: suggestions
      };
    } catch (error) {
      logger.error('Architectural suggestions failed:', error);
      return {
        success: false,
        error: 'Failed to generate architectural suggestions'
      };
    }
  }

  /**
   * Generate code embeddings for similarity analysis
   * @param {string} codeText - Code text to embed
   * @returns {Promise<Array>} Embedding vector
   */
  async generateCodeEmbedding(codeText) {
    try {
      const response = await this.client.embeddings.create({
        model: this.models.embedding,
        input: codeText.substring(0, 8000), // Limit input size
      });

      return {
        success: true,
        data: response.data[0].embedding
      };
    } catch (error) {
      logger.error('Code embedding generation failed:', error);
      return {
        success: false,
        error: 'Failed to generate code embedding'
      };
    }
  }

  /**
   * Build comprehensive code analysis prompt
   * @param {Object} codeData - Code data to analyze
   * @returns {string} Formatted prompt
   */
  buildCodeAnalysisPrompt(codeData) {
    return `
      Analyze this codebase and provide comprehensive insights:
      
      Repository Information:
      - Name: ${codeData.name}
      - Language: ${codeData.primaryLanguage}
      - Total Files: ${codeData.fileCount}
      - Total Lines: ${codeData.totalLines}
      - Dependencies: ${codeData.dependencies?.length || 0}
      
      File Structure:
      ${JSON.stringify(codeData.structure, null, 2)}
      
      Code Metrics:
      - Cyclomatic Complexity: ${codeData.complexity}
      - Duplication Rate: ${codeData.duplicationRate}%
      - Test Coverage: ${codeData.testCoverage}%
      
      Key Files Analysis:
      ${codeData.keyFiles?.map(file => `
        File: ${file.name}
        Lines: ${file.lines}
        Functions: ${file.functions}
        Classes: ${file.classes}
      `).join('\n')}
      
      Please provide a JSON response with:
      {
        "insights": [
          {
            "category": "architecture|performance|maintainability|security",
            "title": "Insight title",
            "description": "Detailed description",
            "severity": "low|medium|high",
            "impact": "Impact description"
          }
        ],
        "patterns": [
          {
            "name": "Pattern name",
            "description": "Pattern description",
            "usage": "How it's used in the codebase",
            "recommendation": "Recommendation for improvement"
          }
        ],
        "recommendations": [
          {
            "priority": "high|medium|low",
            "category": "Category",
            "title": "Recommendation title",
            "description": "Detailed recommendation",
            "effort": "low|medium|high",
            "impact": "Expected impact"
          }
        ],
        "complexity": "low|medium|high",
        "maintainability": "poor|fair|good|excellent",
        "technical_debt": "low|medium|high",
        "architecture_score": 0-10
      }
    `;
  }

  /**
   * Check if OpenAI service is available
   * @returns {Promise<boolean>} Service availability
   */
  async isAvailable() {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      logger.error('OpenAI service unavailable:', error);
      return false;
    }
  }

  /**
   * Get usage statistics
   * @returns {Object} Usage stats
   */
  getUsageStats() {
    // This would typically connect to OpenAI's usage API
    // For now, return placeholder data
    return {
      tokensUsed: 0,
      requestsToday: 0,
      costToday: 0,
      rateLimitRemaining: 1000
    };
  }
}

module.exports = new OpenAIService();