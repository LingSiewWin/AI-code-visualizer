#!/usr/bin/env node

/**
 * AI Code Visualizer - Performance Analysis Tool
 * 
 * This script analyzes the performance of the AI Code Visualizer application
 * including bundle size, load times, memory usage, and rendering performance.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer');

// Configuration
const CONFIG = {
    buildDir: 'build',
    serverUrl: 'http://localhost:3000',
    reportFile: 'performance-report.json',
    thresholds: {
        bundleSizeMB: 5,
        loadTimeMs: 3000,
        fmpMs: 2000,
        memoryUsageMB: 100,
        fps: 30
    }
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Utility functions
const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatTime = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
};

// Performance analyzers
class PerformanceAnalyzer {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            bundleAnalysis: {},
            loadPerformance: {},
            runtimePerformance: {},
            memoryUsage: {},
            recommendations: []
        };
    }

    // Analyze bundle size and composition
    async analyzeBundleSize() {
        log('📦 Analyzing bundle size...', 'blue');
        
        try {
            const buildPath = path.join(process.cwd(), CONFIG.buildDir);
            
            if (!fs.existsSync(buildPath)) {
                log('❌ Build directory not found. Run npm run build first.', 'red');
                return;
            }

            const staticPath = path.join(buildPath, 'static');
            const jsFiles = this.getFilesInDir(path.join(staticPath, 'js'), '.js');
            const cssFiles = this.getFilesInDir(path.join(staticPath, 'css'), '.css');
            
            const bundleAnalysis = {
                totalSize: 0,
                jsSize: 0,
                cssSize: 0,
                files: {
                    js: [],
                    css: []
                }
            };

            // Analyze JS files
            jsFiles.forEach(file => {
                const stats = fs.statSync(file);
                const size = stats.size;
                bundleAnalysis.jsSize += size;
                bundleAnalysis.files.js.push({
                    name: path.basename(file),
                    size: size,
                    sizeFormatted: formatBytes(size)
                });
            });

            // Analyze CSS files
            cssFiles.forEach(file => {
                const stats = fs.statSync(file);
                const size = stats.size;
                bundleAnalysis.cssSize += size;
                bundleAnalysis.files.css.push({
                    name: path.basename(file),
                    size: size,
                    sizeFormatted: formatBytes(size)
                });
            });

            bundleAnalysis.totalSize = bundleAnalysis.jsSize + bundleAnalysis.cssSize;
            bundleAnalysis.totalSizeFormatted = formatBytes(bundleAnalysis.totalSize);
            bundleAnalysis.jsSizeFormatted = formatBytes(bundleAnalysis.jsSize);
            bundleAnalysis.cssSizeFormatted = formatBytes(bundleAnalysis.cssSize);

            this.results.bundleAnalysis = bundleAnalysis;

            // Check against thresholds
            const sizeMB = bundleAnalysis.totalSize / (1024 * 1024);
            if (sizeMB > CONFIG.thresholds.bundleSizeMB) {
                this.results.recommendations.push({
                    type: 'bundle-size',
                    severity: 'warning',
                    message: `Bundle size (${bundleAnalysis.totalSizeFormatted}) exceeds threshold (${CONFIG.thresholds.bundleSizeMB}MB)`
                });
            }

            log(`✅ Bundle analysis complete: ${bundleAnalysis.totalSizeFormatted}`, 'green');
        } catch (error) {
            log(`❌ Bundle analysis failed: ${error.message}`, 'red');
        }
    }

    // Analyze load performance using Puppeteer
    async analyzeLoadPerformance() {
        log('🚀 Analyzing load performance...', 'blue');
        
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await browser.newPage();
            
            // Enable performance monitoring
            await page.tracing.start({
                path: 'trace.json',
                screenshots: true
            });

            const startTime = Date.now();
            
            // Navigate to the application
            const response = await page.goto(CONFIG.serverUrl, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            const loadTime = Date.now() - startTime;

            // Get performance metrics
            const performanceMetrics = await page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                const paint = performance.getEntriesByType('paint');
                
                return {
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                    firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
                    firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
                    domInteractive: navigation.domInteractive - navigation.navigationStart,
                    responseTime: navigation.responseEnd - navigation.responseStart
                };
            });

            await page.tracing.stop();

            const loadPerformance = {
                statusCode: response.status(),
                loadTime,
                loadTimeFormatted: formatTime(loadTime),
                ...performanceMetrics,
                domContentLoadedFormatted: formatTime(performanceMetrics.domContentLoaded),
                firstPaintFormatted: formatTime(performanceMetrics.firstPaint),
                firstContentfulPaintFormatted: formatTime(performanceMetrics.firstContentfulPaint)
            };

            this.results.loadPerformance = loadPerformance;

            // Check thresholds
            if (loadTime > CONFIG.thresholds.loadTimeMs) {
                this.results.recommendations.push({
                    type: 'load-time',
                    severity: 'warning',
                    message: `Load time (${formatTime(loadTime)}) exceeds threshold (${formatTime(CONFIG.thresholds.loadTimeMs)})`
                });
            }

            if (performanceMetrics.firstContentfulPaint > CONFIG.thresholds.fmpMs) {
                this.results.recommendations.push({
                    type: 'fcp',
                    severity: 'warning',
                    message: `First Contentful Paint (${formatTime(performanceMetrics.firstContentfulPaint)}) exceeds threshold (${formatTime(CONFIG.thresholds.fmpMs)})`
                });
            }

            log(`✅ Load performance complete: ${formatTime(loadTime)}`, 'green');
        } catch (error) {
            log(`❌ Load performance analysis failed: ${error.message}`, 'red');
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    // Analyze runtime performance including 3D rendering
    async analyzeRuntimePerformance() {
        log('⚡ Analyzing runtime performance...', 'blue');
        
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl']
            });
            
            const page = await browser.newPage();
            await page.goto(CONFIG.serverUrl, { waitUntil: 'networkidle2' });

            // Wait for the 3D scene to load
            await page.waitForTimeout(2000);

            // Measure FPS and rendering performance
            const runtimeMetrics = await page.evaluate(() => {
                return new Promise((resolve) => {
                    let frameCount = 0;
                    const startTime = performance.now();
                    const duration = 5000; // 5 seconds

                    function countFrames() {
                        frameCount++;
                        if (performance.now() - startTime < duration) {
                            requestAnimationFrame(countFrames);
                        } else {
                            const fps = frameCount / (duration / 1000);
                            resolve({
                                fps: Math.round(fps),
                                frameCount,
                                duration,
                                memoryUsage: performance.memory ? {
                                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                                } : null
                            });
                        }
                    }
                    
                    requestAnimationFrame(countFrames);
                });
            });

            this.results.runtimePerformance = runtimeMetrics;

            if (runtimeMetrics.memoryUsage) {
                const memoryUsageMB = runtimeMetrics.memoryUsage.usedJSHeapSize / (1024 * 1024);
                this.results.memoryUsage = {
                    usedMemoryMB: Math.round(memoryUsageMB),
                    usedMemoryFormatted: formatBytes(runtimeMetrics.memoryUsage.usedJSHeapSize),
                    totalMemoryFormatted: formatBytes(runtimeMetrics.memoryUsage.totalJSHeapSize)
                };

                if (memoryUsageMB > CONFIG.thresholds.memoryUsageMB) {
                    this.results.recommendations.push({
                        type: 'memory',
                        severity: 'warning',
                        message: `Memory usage (${Math.round(memoryUsageMB)}MB) exceeds threshold (${CONFIG.thresholds.memoryUsageMB}MB)`
                    });
                }
            }

            if (runtimeMetrics.fps < CONFIG.thresholds.fps) {
                this.results.recommendations.push({
                    type: 'fps',
                    severity: 'warning',
                    message: `FPS (${runtimeMetrics.fps}) is below threshold (${CONFIG.thresholds.fps})`
                });
            }

            log(`✅ Runtime performance complete: ${runtimeMetrics.fps} FPS`, 'green');
        } catch (error) {
            log(`❌ Runtime performance analysis failed: ${error.message}`, 'red');
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    // Helper method to get files in directory
    getFilesInDir(dir, extension) {
        if (!fs.existsSync(dir)) return [];
        
        return fs.readdirSync(dir)
            .filter(file => file.endsWith(extension))
            .map(file => path.join(dir, file));
    }

    // Generate performance report
    generateReport() {
        log('📊 Generating performance report...', 'blue');
        
        // Write JSON report
        fs.writeFileSync(CONFIG.reportFile, JSON.stringify(this.results, null, 2));
        
        // Display console report
        this.displayConsoleReport();
        
        log(`✅ Report saved to ${CONFIG.reportFile}`, 'green');
    }

    // Display formatted console report
    displayConsoleReport() {
        console.log('\n' + '='.repeat(60));
        log('📊 PERFORMANCE ANALYSIS REPORT', 'cyan');
        console.log('='.repeat(60));
        
        // Bundle Analysis
        if (this.results.bundleAnalysis.totalSize) {
            log('\n📦 Bundle Analysis:', 'yellow');
            log(`   Total Size: ${this.results.bundleAnalysis.totalSizeFormatted}`);
            log(`   JavaScript: ${this.results.bundleAnalysis.jsSizeFormatted}`);
            log(`   CSS: ${this.results.bundleAnalysis.cssSizeFormatted}`);
        }

        // Load Performance
        if (this.results.loadPerformance.loadTime) {
            log('\n🚀 Load Performance:', 'yellow');
            log(`   Total Load Time: ${this.results.loadPerformance.loadTimeFormatted}`);
            log(`   First Paint: ${this.results.loadPerformance.firstPaintFormatted}`);
            log(`   First Contentful Paint: ${this.results.loadPerformance.firstContentfulPaintFormatted}`);
            log(`   DOM Content Loaded: ${this.results.loadPerformance.domContentLoadedFormatted}`);
        }

        // Runtime Performance
        if (this.results.runtimePerformance.fps) {
            log('\n⚡ Runtime Performance:', 'yellow');
            log(`   FPS: ${this.results.runtimePerformance.fps}`);
            log(`   Frame Count: ${this.results.runtimePerformance.frameCount}`);
        }

        // Memory Usage
        if (this.results.memoryUsage.usedMemoryMB) {
            log('\n💾 Memory Usage:', 'yellow');
            log(`   Used Memory: ${this.results.memoryUsage.usedMemoryFormatted}`);
            log(`   Total Memory: ${this.results.memoryUsage.totalMemoryFormatted}`);
        }

        // Recommendations
        if (this.results.recommendations.length > 0) {
            log('\n⚠️  Recommendations:', 'yellow');
            this.results.recommendations.forEach(rec => {
                const color = rec.severity === 'error' ? 'red' : rec.severity === 'warning' ? 'yellow' : 'blue';
                log(`   ${rec.type}: ${rec.message}`, color);
            });
        } else {
            log('\n✅ All performance metrics are within acceptable thresholds!', 'green');
        }

        console.log('\n' + '='.repeat(60) + '\n');
    }

    // Run all performance analyses
    async runAnalysis() {
        log('🔍 Starting performance analysis...', 'magenta');
        
        await this.analyzeBundleSize();
        await this.analyzeLoadPerformance();
        await this.analyzeRuntimePerformance();
        
        this.generateReport();
        
        log('🎉 Performance analysis complete!', 'green');
    }
}

// CLI handling
async function main() {
    const analyzer = new PerformanceAnalyzer();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
AI Code Visualizer Performance Analyzer

Usage: node analyze-performance.js [options]

Options:
  --help, -h          Show this help message
  --bundle-only       Only analyze bundle size
  --load-only         Only analyze load performance
  --runtime-only      Only analyze runtime performance
  --server-url <url>  Override server URL (default: ${CONFIG.serverUrl})
  --output <file>     Override output file (default: ${CONFIG.reportFile})

Examples:
  node analyze-performance.js
  node analyze-performance.js --bundle-only
  node analyze-performance.js --server-url http://localhost:3001
        `);
        return;
    }

    // Handle server URL override
    const serverUrlIndex = args.indexOf('--server-url');
    if (serverUrlIndex !== -1 && args[serverUrlIndex + 1]) {
        CONFIG.serverUrl = args[serverUrlIndex + 1];
    }

    // Handle output file override
    const outputIndex = args.indexOf('--output');
    if (outputIndex !== -1 && args[outputIndex + 1]) {
        CONFIG.reportFile = args[outputIndex + 1];
    }

    try {
        if (args.includes('--bundle-only')) {
            await analyzer.analyzeBundleSize();
        } else if (args.includes('--load-only')) {
            await analyzer.analyzeLoadPerformance();
        } else if (args.includes('--runtime-only')) {
            await analyzer.analyzeRuntimePerformance();
        } else {
            await analyzer.runAnalysis();
        }
    } catch (error) {
        log(`❌ Analysis failed: ${error.message}`, 'red');
        process.exit(1);
    }
}

// Check if puppeteer is installed
try {
    require.resolve('puppeteer');
} catch (error) {
    log('❌ Puppeteer is not installed. Please run: npm install puppeteer', 'red');
    process.exit(1);
}

// Run the analysis
if (require.main === module) {
    main().catch(error => {
        log(`❌ Unexpected error: ${error.message}`, 'red');
        process.exit(1);
    });
}

module.exports = PerformanceAnalyzer;