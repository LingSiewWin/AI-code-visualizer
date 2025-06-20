/**
 * End-to-End User Flow Tests
 * Tests complete user journeys through the AI Code Visualizer application
 */

const { test, expect } = require('@playwright/test');

// Test configuration
const TEST_CONFIG = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  retries: 2,
  // Test repositories (using public repos for testing)
  testRepos: {
    small: 'octocat/Hello-World',
    medium: 'facebook/react',
    large: 'microsoft/vscode'
  }
};

// Page selectors
const SELECTORS = {
  // Navigation
  navbar: '[data-testid="navbar"]',
  logo: '[data-testid="logo"]',
  
  // Repository Input
  repoInput: '[data-testid="repository-input"]',
  repoInputField: '[data-testid="repo-url-input"]',
  analyzeButton: '[data-testid="analyze-button"]',
  
  // Loading states
  loadingSpinner: '[data-testid="loading-spinner"]',
  loadingMessage: '[data-testid="loading-message"]',
  
  // Visualization
  threeScene: '[data-testid="three-scene"]',
  sceneCanvas: '[data-testid="scene-canvas"]',
  
  // Analysis Panel
  analysisPanel: '[data-testid="analysis-panel"]',
  analysisTab: '[data-testid="analysis-tab"]',
  insightsTab: '[data-testid="insights-tab"]',
  
  // File Explorer
  fileExplorer: '[data-testid="file-explorer"]',
  fileTreeItem: '[data-testid="file-tree-item"]',
  folderToggle: '[data-testid="folder-toggle"]',
  
  // Code Metrics
  metricsPanel: '[data-testid="metrics-panel"]',
  complexityChart: '[data-testid="complexity-chart"]',
  dependencyGraph: '[data-testid="dependency-graph"]',
  
  // Insights Panel
  insightsPanel: '[data-testid="insights-panel"]',
  aiInsights: '[data-testid="ai-insights"]',
  recommendations: '[data-testid="recommendations"]',
  
  // Controls
  viewModeToggle: '[data-testid="view-mode-toggle"]',
  zoomControls: '[data-testid="zoom-controls"]',
  resetView: '[data-testid="reset-view"]',
  
  // Error states
  errorMessage: '[data-testid="error-message"]',
  retryButton: '[data-testid="retry-button"]'
};

test.describe('AI Code Visualizer - User Flow Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Navigate to the application
    await page.goto(TEST_CONFIG.baseURL);
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Initial Page Load', () => {
    
    test('should load the application correctly', async ({ page }) => {
      // Check that the navbar is visible
      await expect(page.locator(SELECTORS.navbar)).toBeVisible();
      
      // Check that the logo is present
      await expect(page.locator(SELECTORS.logo)).toBeVisible();
      
      // Check that the repository input is visible
      await expect(page.locator(SELECTORS.repoInput)).toBeVisible();
      
      // Check that the analyze button is disabled initially
      await expect(page.locator(SELECTORS.analyzeButton)).toBeDisabled();
    });

    test('should have correct page title', async ({ page }) => {
      await expect(page).toHaveTitle(/AI Code Visualizer/);
    });

    test('should display welcome message or instructions', async ({ page }) => {
      // Check for welcome text or instructions
      const welcomeText = page.locator('text=Enter a GitHub repository URL');
      await expect(welcomeText).toBeVisible();
    });
  });

  test.describe('Repository Input Flow', () => {
    
    test('should enable analyze button when valid repo URL is entered', async ({ page }) => {
      // Enter a valid repository URL
      await page.fill(SELECTORS.repoInputField, `https://github.com/${TEST_CONFIG.testRepos.small}`);
      
      // Check that the analyze button is now enabled
      await expect(page.locator(SELECTORS.analyzeButton)).toBeEnabled();
    });

    test('should show validation error for invalid URL', async ({ page }) => {
      // Enter an invalid repository URL
      await page.fill(SELECTORS.repoInputField, 'invalid-url');
      
      // Try to click analyze button
      await page.click(SELECTORS.analyzeButton);
      
      // Check for error message
      await expect(page.locator(SELECTORS.errorMessage)).toBeVisible();
    });

    test('should handle non-existent repository gracefully', async ({ page }) => {
      // Enter a non-existent repository URL
      await page.fill(SELECTORS.repoInputField, 'https://github.com/nonexistent/repository');
      await page.click(SELECTORS.analyzeButton);
      
      // Wait for error message
      await expect(page.locator(SELECTORS.errorMessage)).toBeVisible({ timeout: 10000 });
      
      // Check that retry button is available
      await expect(page.locator(SELECTORS.retryButton)).toBeVisible();
    });
  });

  test.describe('Analysis Flow - Small Repository', () => {
    
    test('should complete full analysis flow for small repository', async ({ page }) => {
      // Enter repository URL
      await page.fill(SELECTORS.repoInputField, `https://github.com/${TEST_CONFIG.testRepos.small}`);
      await page.click(SELECTORS.analyzeButton);
      
      // Check loading state
      await expect(page.locator(SELECTORS.loadingSpinner)).toBeVisible();
      await expect(page.locator(SELECTORS.loadingMessage)).toBeVisible();
      
      // Wait for analysis to complete
      await page.waitForSelector(SELECTORS.threeScene, { timeout: TEST_CONFIG.timeout });
      
      // Check that visualization is loaded
      await expect(page.locator(SELECTORS.sceneCanvas)).toBeVisible();
      
      // Check that analysis panel is visible
      await expect(page.locator(SELECTORS.analysisPanel)).toBeVisible();
      
      // Check that file explorer is populated
      await expect(page.locator(SELECTORS.fileExplorer)).toBeVisible();
      await expect(page.locator(SELECTORS.fileTreeItem).first()).toBeVisible();
    });

    test('should show correct metrics for analyzed repository', async ({ page }) => {
      // Perform analysis
      await page.fill(SELECTORS.repoInputField, `https://github.com/${TEST_CONFIG.testRepos.small}`);
      await page.click(SELECTORS.analyzeButton);
      
      // Wait for analysis to complete
      await page.waitForSelector(SELECTORS.metricsPanel, { timeout: TEST_CONFIG.timeout });
      
      // Check that metrics are displayed
      await expect(page.locator(SELECTORS.complexityChart)).toBeVisible();
      
      // Check for specific metrics
      const metricsText = await page.locator(SELECTORS.metricsPanel).textContent();
      expect(metricsText).toContain('Files');
      expect(metricsText).toContain('Lines of Code');
    });
  });

  test.describe('Visualization Interaction', () => {
    
    test('should allow 3D scene interaction', async ({ page }) => {
      // Complete analysis first
      await page.fill(SELECTORS.repoInputField, `https://github.com/${TEST_CONFIG.testRepos.small}`);
      await page.click(SELECTORS.analyzeButton);
      await page.waitForSelector(SELECTORS.sceneCanvas, { timeout: TEST_CONFIG.timeout });
      
      // Test canvas interaction (mouse events)
      const canvas = page.locator(SELECTORS.sceneCanvas);
      
      // Test mouse wheel zoom
      await canvas.hover();
      await page.mouse.wheel(0, -100);
      
      // Test mouse drag rotation
      await canvas.hover();
      await page.mouse.down();
      await page.mouse.move(100, 100);
      await page.mouse.up();
      
      // Canvas should still be visible and interactive
      await expect(canvas).toBeVisible();
    });

    test('should respond to view controls', async ({ page }) => {
      // Complete analysis first
      await page.fill(SELECTORS.repoInputField, `https://github.com/${TEST_CONFIG.testRepos.small}`);
      await page.click(SELECTORS.analyzeButton);
      await page.waitForSelector(SELECTORS.zoomControls, { timeout: TEST_CONFIG.timeout });
      
      // Test zoom controls
      await page.click(`${SELECTORS.zoomControls} [data-action="zoom-in"]`);
      await page.click(`${SELECTORS.zoomControls} [data-action="zoom-out"]`);
      
      // Test reset view
      await page.click(SELECTORS.resetView);
      
      // Scene should remain functional
      await expect(page.locator(SELECTORS.sceneCanvas)).toBeVisible();
    });

    test('should toggle between different view modes', async ({ page }) => {
      // Complete analysis first
      await page.fill(SELECTORS.repoInputField, `https://github.com/${TEST_CONFIG.testRepos.small}`);
      await page.click(SELECTORS.analyzeButton);
      await page.waitForSelector(SELECTORS.viewModeToggle, { timeout: TEST_CONFIG.timeout });
      
      // Test view mode toggles
      const viewModeButton = page.locator(SELECTORS.viewModeToggle);
      await viewModeButton.click();
      
      // Wait for view change animation
      await page.waitForTimeout(1000);
      
      // Scene should still be visible
      await expect(page.locator(SELECTORS.sceneCanvas)).toBeVisible();
    });
  });

  test.describe('File Explorer Interaction', () => {
    
    test('should expand and collapse folders', async ({ page }) => {
      // Complete analysis first
      await page.fill(SELECTORS.repoInputField, `https://github.com/${TEST_CONFIG.testRepos.small}`);
      await page.click(SELECTORS.analyzeButton);
      await page.waitForSelector(SELECTORS.fileExplorer, { timeout: TEST_CONFIG.timeout });
      
      // Find a folder and expand it
      const folderToggle = page.locator(SELECTORS.folderToggle).first();
      if (await folderToggle.isVisible()) {
        await folderToggle.click();
        
        // Wait for expansion animation
        await page.waitForTimeout(500);
        
        // Collapse it back
        await folderToggle.click();
      }
    });

    test('should highlight selected files in visualization', async ({ page }) => {
      // Complete analysis first
      await page.fill(SELECTORS.repoInputField, `https://github.com/${TEST_CONFIG.testRepos.small}`);
      await page.click(SELECTORS.analyzeButton);
      await page.waitForSelector(SELECTORS.fileExplorer, { timeout: TEST_CONFIG.timeout });
      
      // Click on a file
      const fileItem = page.locator(SELECTORS.fileTreeItem).first();
      await fileItem.click();
      
      // File should be highlighted/selected
      await expect(fileItem).toHaveClass(/selected|active/);
    });
  });

  test.describe('Analysis Panel Navigation', () => {
    
    test('should switch between analysis tabs', async ({ page }) => {
      // Complete analysis first
      await page.fill(SELECTORS.repoInputField, `https://github.com/${TEST_CONFIG.testRepos.small}`);
      await page.click(SELECTORS.analyzeButton);
      await page.waitForSelector(SELECTORS.analysisPanel, { timeout: TEST_CONFIG.timeout });
      
      // Switch to insights tab
      await page.click(SELECTORS.insightsTab);
      await expect(page.locator(SELECTORS.insightsPanel)).toBeVisible();
      
      // Switch back to analysis tab
      await page.click(SELECTORS.analysisTab);
      await expect(page.locator(SELECTORS.metricsPanel)).toBeVisible();
    });

    test('should display AI insights when available', async ({ page }) => {
      // Complete analysis first
      await page.fill(SELECTORS.repoInputField, `https://github.com/${TEST_CONFIG.testRepos.small}`);
      await page.click(SELECTORS.analyzeButton);
      await page.waitForSelector(SELECTORS.analysisPanel, { timeout: TEST_CONFIG.timeout });
      
      // Navigate to insights tab
      await page.click(SELECTORS.insightsTab);
      
      // Wait for AI insights to load
      await page.waitForSelector(SELECTORS.aiInsights, { timeout: 15000 });
      
      // Check that insights content is present
      await expect(page.locator(SELECTORS.aiInsights)).toBeVisible();
      await expect(page.locator(SELECTORS.recommendations)).toBeVisible();
    });
  });

  test.describe('Error Handling and Recovery', () => {
    
    test('should handle network errors gracefully', async ({ page }) => {
      // Block network requests to simulate network error
      await page.route('**/api/**', route => route.abort());
      
      // Try to analyze repository
      await page.fill(SELECTORS.repoInputField, `https://github.com/${TEST_CONFIG.testRepos.small}`);
      await page.click(SELECTORS.analyzeButton);
      
      // Should show error message
      await expect(page.locator(SELECTORS.errorMessage)).toBeVisible({ timeout: 10000 });
      
      // Should show retry button
      await expect(page.locator(SELECTORS.retryButton)).toBeVisible();
    });

    test('should recover from errors using retry button', async ({ page }) => {
      // Block network requests initially
      let blockRequests = true;
      await page.route('**/api/**', route => {
        if (blockRequests) {
          route.abort();
        } else {
          route.continue();
        }
      });
      
      // Try to analyze repository (will fail)
      await page.fill(SELECTORS.repoInputField, `https://github.com/${TEST_CONFIG.testRepos.small}`);
      await page.click(SELECTORS.analyzeButton);
      
      // Wait for error
      await expect(page.locator(SELECTORS.errorMessage)).toBeVisible({ timeout: 10000 });
      
      // Unblock requests
      blockRequests = false;
      
      // Click retry
      await page.click(SELECTORS.retryButton);
      
      // Should eventually succeed
      await expect(page.locator(SELECTORS.threeScene)).toBeVisible({ timeout: TEST_CONFIG.timeout });
    });
  });

  test.describe('Performance and Responsiveness', () => {
    
    test('should be responsive on different screen sizes', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      
      // Check that key elements are still visible
      await expect(page.locator(SELECTORS.navbar)).toBeVisible();
      await expect(page.locator(SELECTORS.repoInput)).toBeVisible();
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      
      // Check layout adaptation
      await expect(page.locator(SELECTORS.navbar)).toBeVisible();
      await expect(page.locator(SELECTORS.repoInput)).toBeVisible();
    });

    test('should handle large repository analysis', async ({ page }) => {
      // Increase timeout for large repository
      test.setTimeout(60000);
      
      // Analyze a larger repository
      await page.fill(SELECTORS.repoInputField, `https://github.com/${TEST_CONFIG.testRepos.medium}`);
      await page.click(SELECTORS.analyzeButton);
      
      // Should show loading state
      await expect(page.locator(SELECTORS.loadingSpinner)).toBeVisible();
      
      // Should eventually complete (with longer timeout)
      await expect(page.locator(SELECTORS.threeScene)).toBeVisible({ timeout: 45000 });
      
      // Should have populated file explorer
      await expect(page.locator(SELECTORS.fileTreeItem)).toHaveCount.greaterThan(10);
    });
  });

  test.describe('Accessibility', () => {
    
    test('should be keyboard navigable', async ({ page }) => {
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to focus on input field
      await page.keyboard.type(`https://github.com/${TEST_CONFIG.testRepos.small}`);
      
      // Should be able to trigger analysis with Enter
      await page.keyboard.press('Enter');
      
      // Should show loading state
      await expect(page.locator(SELECTORS.loadingSpinner)).toBeVisible();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      // Check for ARIA labels on key interactive elements
      await expect(page.locator(SELECTORS.repoInputField)).toHaveAttribute('aria-label');
      await expect(page.locator(SELECTORS.analyzeButton)).toHaveAttribute('aria-label');
    });
  });

  test.describe('Data Persistence', () => {
    
    test('should maintain analysis state during navigation', async ({ page }) => {
      // Complete analysis
      await page.fill(SELECTORS.repoInputField, `https://github.com/${TEST_CONFIG.testRepos.small}`);
      await page.click(SELECTORS.analyzeButton);
      await page.waitForSelector(SELECTORS.threeScene, { timeout: TEST_CONFIG.timeout });
      
      // Switch between tabs
      await page.click(SELECTORS.insightsTab);
      await page.click(SELECTORS.analysisTab);
      
      // Visualization should still be present
      await expect(page.locator(SELECTORS.sceneCanvas)).toBeVisible();
      
      // File explorer should still be populated
      await expect(page.locator(SELECTORS.fileTreeItem)).toHaveCount.greaterThan(0);
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Take screenshot on failure
    if (testInfo.status !== testInfo.expectedStatus) {
      await page.screenshot({ 
        path: `test-results/${testInfo.title.replace(/\s+/g, '-')}-failure.png`,
        fullPage: true 
      });
    }
    
    // Clean up any ongoing requests
    await page.close();
  });
});

// Helper functions for common test operations
class TestHelpers {
  
  static async waitForAnalysisComplete(page, timeout = TEST_CONFIG.timeout) {
    await page.waitForSelector(SELECTORS.threeScene, { timeout });
    await page.waitForSelector(SELECTORS.analysisPanel, { timeout });
    await page.waitForLoadState('networkidle');
  }
  
  static async performBasicAnalysis(page, repoUrl) {
    await page.fill(SELECTORS.repoInputField, repoUrl);
    await page.click(SELECTORS.analyzeButton);
    await this.waitForAnalysisComplete(page);
  }
  
  static async checkVisualizationLoaded(page) {
    await expect(page.locator(SELECTORS.sceneCanvas)).toBeVisible();
    await expect(page.locator(SELECTORS.fileExplorer)).toBeVisible();
    await expect(page.locator(SELECTORS.metricsPanel)).toBeVisible();
  }
  
  static async simulateNetworkError(page) {
    await page.route('**/api/**', route => route.abort());
  }
  
  static async clearNetworkMock(page) {
    await page.unroute('**/api/**');
  }
}

module.exports = { TestHelpers, SELECTORS, TEST_CONFIG };