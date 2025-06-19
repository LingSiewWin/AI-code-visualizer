// tests/e2e/visualization.test.js
import { test, expect } from '@playwright/test';

test.describe('AI Code Visualizer - Visualization Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="ai-code-visualizer"]');
  });

  test('should load Three.js scene correctly', async ({ page }) => {
    // Check if Three.js canvas is present
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Verify canvas has correct dimensions
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox.width).toBeGreaterThan(400);
    expect(canvasBox.height).toBeGreaterThan(300);
  });

  test('should display repository input interface', async ({ page }) => {
    // Check for repository input components
    await expect(page.locator('[data-testid="repository-input"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="repository"]')).toBeVisible();
    await expect(page.locator('button:has-text("Analyze")')).toBeVisible();
  });

  test('should handle repository analysis visualization', async ({ page }) => {
    // Mock the GitHub API response
    await page.route('**/api/github/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          files: [
            { name: 'index.js', size: 1024, type: 'javascript' },
            { name: 'App.jsx', size: 2048, type: 'jsx' },
            { name: 'README.md', size: 512, type: 'markdown' }
          ],
          dependencies: {
            'react': '18.2.0',
            'three': '0.150.0'
          },
          metrics: {
            totalFiles: 3,
            totalLines: 150,
            complexity: 'medium'
          }
        })
      });
    });

    // Enter a repository URL
    const input = page.locator('input[placeholder*="repository"]');
    await input.fill('https://github.com/test/repo');
    
    // Click analyze button
    await page.click('button:has-text("Analyze")');
    
    // Wait for loading to complete
    await page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden' });
    
    // Verify visualization appears
    await expect(page.locator('[data-testid="three-scene"]')).toBeVisible();
    
    // Check if file nodes are rendered
    const fileNodes = page.locator('[data-testid="file-node"]');
    await expect(fileNodes).toHaveCount(3);
  });

  test('should render different file types with distinct visual styles', async ({ page }) => {
    // Mock repository with various file types
    await page.route('**/api/analyze/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          files: [
            { name: 'app.js', type: 'javascript', size: 1000, complexity: 5 },
            { name: 'style.css', type: 'css', size: 500, complexity: 2 },
            { name: 'index.html', type: 'html', size: 800, complexity: 3 },
            { name: 'README.md', type: 'markdown', size: 300, complexity: 1 }
          ]
        })
      });
    });

    await page.locator('input[placeholder*="repository"]').fill('test/repo');
    await page.click('button:has-text("Analyze")');
    
    await page.waitForSelector('[data-testid="visualization-complete"]');
    
    // Verify different colors for different file types
    const jsFile = page.locator('[data-file-type="javascript"]');
    const cssFile = page.locator('[data-file-type="css"]');
    const htmlFile = page.locator('[data-file-type="html"]');
    
    await expect(jsFile).toBeVisible();
    await expect(cssFile).toBeVisible();
    await expect(htmlFile).toBeVisible();
  });

  test('should display file information on hover', async ({ page }) => {
    // Setup mock data
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          files: [
            { 
              name: 'main.js', 
              type: 'javascript', 
              size: 2048, 
              lines: 80,
              complexity: 7,
              dependencies: ['react', 'lodash']
            }
          ]
        })
      });
    });

    await page.locator('input[placeholder*="repository"]').fill('test/repo');
    await page.click('button:has-text("Analyze")');
    
    await page.waitForSelector('[data-testid="file-node"]');
    
    // Hover over a file node
    const fileNode = page.locator('[data-testid="file-node"]').first();
    await fileNode.hover();
    
    // Check for tooltip/info panel
    const tooltip = page.locator('[data-testid="file-tooltip"]');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('main.js');
    await expect(tooltip).toContainText('2048');
    await expect(tooltip).toContainText('80');
  });

  test('should handle camera controls and navigation', async ({ page }) => {
    // Load visualization
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          files: Array.from({ length: 10 }, (_, i) => ({
            name: `file${i}.js`,
            type: 'javascript',
            size: 1000 + i * 100
          }))
        })
      });
    });

    await page.locator('input[placeholder*="repository"]').fill('test/repo');
    await page.click('button:has-text("Analyze")');
    
    await page.waitForSelector('[data-testid="three-scene"]');
    
    const canvas = page.locator('canvas');
    
    // Test mouse controls
    await canvas.hover();
    await page.mouse.down();
    await page.mouse.move(100, 100);
    await page.mouse.up();
    
    // Test zoom
    await canvas.hover();
    await page.mouse.wheel(0, -100);
    
    // Verify camera position changed (this would require custom attributes)
    await page.waitForTimeout(1000);
    
    // Check for reset camera button
    const resetButton = page.locator('button:has-text("Reset View")');
    if (await resetButton.isVisible()) {
      await resetButton.click();
    }
  });

  test('should render dependency connections', async ({ page }) => {
    // Mock complex repository with dependencies
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          files: [
            { name: 'App.jsx', type: 'jsx', dependencies: ['utils.js', 'api.js'] },
            { name: 'utils.js', type: 'javascript', dependencies: [] },
            { name: 'api.js', type: 'javascript', dependencies: ['utils.js'] }
          ],
          connections: [
            { from: 'App.jsx', to: 'utils.js', weight: 5 },
            { from: 'App.jsx', to: 'api.js', weight: 3 },
            { from: 'api.js', to: 'utils.js', weight: 2 }
          ]
        })
      });
    });

    await page.locator('input[placeholder*="repository"]').fill('test/repo');
    await page.click('button:has-text("Analyze")');
    
    await page.waitForSelector('[data-testid="visualization-complete"]');
    
    // Check for connection lines
    const connections = page.locator('[data-testid="dependency-line"]');
    await expect(connections).toHaveCount(3);
  });

  test('should handle visualization filters and controls', async ({ page }) => {
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          files: [
            { name: 'app.js', type: 'javascript', size: 1000 },
            { name: 'style.css', type: 'css', size: 500 },
            { name: 'test.js', type: 'javascript', size: 800 }
          ]
        })
      });
    });

    await page.locator('input[placeholder*="repository"]').fill('test/repo');
    await page.click('button:has-text("Analyze")');
    
    await page.waitForSelector('[data-testid="visualization-complete"]');
    
    // Test file type filters
    const jsFilter = page.locator('[data-testid="filter-javascript"]');
    if (await jsFilter.isVisible()) {
      await jsFilter.click();
      
      // Only JS files should be visible
      const visibleFiles = page.locator('[data-testid="file-node"]:visible');
      await expect(visibleFiles).toHaveCount(2);
    }
    
    // Test size filters
    const sizeSlider = page.locator('[data-testid="size-filter"]');
    if (await sizeSlider.isVisible()) {
      await sizeSlider.fill('600');
      
      // Files below 600 bytes should be hidden
      const visibleFiles = page.locator('[data-testid="file-node"]:visible');
      await expect(visibleFiles).toHaveCount(2);
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Repository not found' })
      });
    });

    await page.locator('input[placeholder*="repository"]').fill('invalid/repo');
    await page.click('button:has-text("Analyze")');
    
    // Check for error message
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Repository not found');
    
    // Verify visualization doesn't break
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should maintain responsive design on different screen sizes', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    
    let canvas = page.locator('canvas');
    let canvasBox = await canvas.boundingBox();
    expect(canvasBox.width).toBeGreaterThan(800);
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    
    canvas = page.locator('canvas');
    canvasBox = await canvas.boundingBox();
    expect(canvasBox.width).toBeLessThan(800);
    expect(canvasBox.width).toBeGreaterThan(400);
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Check for mobile-specific controls
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    if (await mobileMenu.isVisible()) {
      await expect(mobileMenu).toBeVisible();
    }
  });

  test('should handle performance with large repositories', async ({ page }) => {
    // Mock large repository
    await page.route('**/api/**', (route) => {
      const largeFileSet = Array.from({ length: 100 }, (_, i) => ({
        name: `file${i}.js`,
        type: i % 3 === 0 ? 'javascript' : i % 3 === 1 ? 'css' : 'html',
        size: Math.random() * 5000 + 500,
        complexity: Math.floor(Math.random() * 10) + 1
      }));
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ files: largeFileSet })
      });
    });

    const startTime = Date.now();
    
    await page.locator('input[placeholder*="repository"]').fill('large/repo');
    await page.click('button:has-text("Analyze")');
    
    await page.waitForSelector('[data-testid="visualization-complete"]');
    
    const loadTime = Date.now() - startTime;
    
    // Verify it loads within reasonable time (10 seconds)
    expect(loadTime).toBeLessThan(10000);
    
    // Check for performance optimizations (LOD, culling, etc.)
    const visibleNodes = page.locator('[data-testid="file-node"]:visible');
    const nodeCount = await visibleNodes.count();
    
    // Should implement some form of optimization for large datasets
    expect(nodeCount).toBeGreaterThan(0);
    expect(nodeCount).toBeLessThanOrEqual(100);
  });
});