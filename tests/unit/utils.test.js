import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';

// Import utility modules
import {
  SUPPORTED_LANGUAGES,
  FILE_EXTENSIONS,
  COLORS,
  API_ENDPOINTS,
  VISUALIZATION_MODES,
  COMPLEXITY_THRESHOLDS,
  ANIMATION_DURATION,
  MAX_FILE_SIZE,
  GITHUB_API_RATE_LIMIT
} from '../src/utils/constants.js';

import {
  formatFileSize,
  formatDate,
  formatNumber,
  truncateString,
  getFileExtension,
  getLanguageFromExtension,
  isValidUrl,
  isValidGitHubUrl,
  parseGitHubUrl,
  calculateComplexity,
  generateId,
  debounce,
  throttle,
  deepClone,
  mergeObjects,
  isEmpty,
  isObject,
  arrayToTree,
  treeToArray,
  sanitizeInput,
  validateEmail,
  validateGitHubRepo,
  sortBy,
  groupBy,
  unique,
  chunk,
  range,
  clamp,
  lerp,
  hexToRgb,
  rgbToHex,
  generateRandomColor,
  getContrastColor,
  lightenColor,
  darkenColor
} from '../src/utils/helpers.js';

import {
  createScene,
  createCamera,
  createRenderer,
  createLights,
  createFileNode,
  createFolderNode,
  createConnectionLine,
  animateNodePosition,
  animateNodeColor,
  animateNodeScale,
  updateNodePosition,
  updateNodeColor,
  updateNodeScale,
  calculateNodePosition,
  calculateNodeSize,
  calculateNodeColor,
  createParticleSystem,
  updateParticleSystem,
  createGeometry,
  createMaterial,
  createMesh,
  disposeMesh,
  disposeGeometry,
  disposeMaterial,
  optimizeScene,
  calculateBoundingBox,
  raycaster,
  getIntersections,
  screenToWorld,
  worldToScreen,
  addOrbitControls,
  updateOrbitControls,
  resetCamera,
  focusOnObject,
  createWireframe,
  createGlow,
  addPostProcessing,
  exportScene,
  importScene
} from '../src/utils/threeHelpers.js';

import {
  DEFAULT_COLORS,
  LANGUAGE_COLORS,
  COMPLEXITY_COLORS,
  DEPENDENCY_COLORS,
  THEME_COLORS,
  getColorByLanguage,
  getColorByComplexity,
  getColorByType,
  getColorByDepth,
  getColorBySize,
  interpolateColor,
  generateColorPalette,
  adjustColorBrightness,
  getRandomColor,
  createGradient,
  applyTheme,
  validateColor,
  colorToHex,
  colorToRgb,
  colorToHsl
} from '../src/utils/colorSchemes.js';

import {
  transformRepositoryData,
  transformFileData,
  transformAnalysisData,
  transformMetricsData,
  transformVisualizationData,
  normalizeData,
  aggregateData,
  filterData,
  sortData,
  groupData,
  flattenData,
  restructureData,
  validateData,
  cleanData,
  processCodeMetrics,
  processComplexityData,
  processDependencyData,
  processGitData,
  processAIInsights,
  calculateStatistics,
  generateSummary,
  formatForVisualization,
  formatForExport,
  parseCSV,
  parseJSON,
  parseXML,
  convertToFormat,
  serializeData,
  deserializeData
} from '../src/utils/dataTransformers.js';

// Mock Three.js for testing
vi.mock('three', () => ({
  Scene: vi.fn(() => ({
    add: vi.fn(),
    remove: vi.fn(),
    traverse: vi.fn(),
    dispose: vi.fn()
  })),
  PerspectiveCamera: vi.fn(() => ({
    position: { set: vi.fn() },
    lookAt: vi.fn(),
    updateProjectionMatrix: vi.fn()
  })),
  WebGLRenderer: vi.fn(() => ({
    setSize: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
    domElement: document.createElement('canvas')
  })),
  BoxGeometry: vi.fn(),
  SphereGeometry: vi.fn(),
  CylinderGeometry: vi.fn(),
  MeshBasicMaterial: vi.fn(),
  MeshLambertMaterial: vi.fn(),
  MeshPhongMaterial: vi.fn(),
  Mesh: vi.fn(() => ({
    position: { set: vi.fn(), copy: vi.fn() },
    scale: { set: vi.fn(), copy: vi.fn() },
    material: { color: { set: vi.fn() } },
    dispose: vi.fn()
  })),
  DirectionalLight: vi.fn(),
  AmbientLight: vi.fn(),
  PointLight: vi.fn(),
  Group: vi.fn(() => ({
    add: vi.fn(),
    remove: vi.fn(),
    position: { set: vi.fn() },
    scale: { set: vi.fn() }
  })),
  Vector3: vi.fn(() => ({
    set: vi.fn(),
    copy: vi.fn(),
    add: vi.fn(),
    sub: vi.fn(),
    multiplyScalar: vi.fn(),
    normalize: vi.fn(),
    length: vi.fn(() => 1),
    distanceTo: vi.fn(() => 1)
  })),
  Color: vi.fn(() => ({
    set: vi.fn(),
    setHex: vi.fn(),
    getHex: vi.fn(() => 0xffffff),
    r: 1,
    g: 1,
    b: 1
  })),
  Raycaster: vi.fn(() => ({
    setFromCamera: vi.fn(),
    intersectObjects: vi.fn(() => [])
  })),
  TWEEN: {
    Tween: vi.fn(() => ({
      to: vi.fn().mockReturnThis(),
      duration: vi.fn().mockReturnThis(),
      easing: vi.fn().mockReturnThis(),
      onUpdate: vi.fn().mockReturnThis(),
      onComplete: vi.fn().mockReturnThis(),
      start: vi.fn().mockReturnThis()
    })),
    update: vi.fn()
  }
}));

describe('Constants', () => {
  describe('SUPPORTED_LANGUAGES', () => {
    it('should contain common programming languages', () => {
      expect(SUPPORTED_LANGUAGES).toContain('javascript');
      expect(SUPPORTED_LANGUAGES).toContain('python');
      expect(SUPPORTED_LANGUAGES).toContain('java');
      expect(SUPPORTED_LANGUAGES).toContain('typescript');
    });

    it('should be an array', () => {
      expect(Array.isArray(SUPPORTED_LANGUAGES)).toBe(true);
    });
  });

  describe('FILE_EXTENSIONS', () => {
    it('should map extensions to languages', () => {
      expect(FILE_EXTENSIONS['.js']).toBe('javascript');
      expect(FILE_EXTENSIONS['.py']).toBe('python');
      expect(FILE_EXTENSIONS['.java']).toBe('java');
    });

    it('should be an object', () => {
      expect(typeof FILE_EXTENSIONS).toBe('object');
    });
  });

  describe('COLORS', () => {
    it('should contain valid color values', () => {
      expect(COLORS.PRIMARY).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(COLORS.SECONDARY).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe('API_ENDPOINTS', () => {
    it('should contain valid URLs', () => {
      expect(API_ENDPOINTS.GITHUB).toMatch(/^https?:\/\//);
      expect(API_ENDPOINTS.ANALYSIS).toMatch(/^\/api\//);
    });
  });

  describe('COMPLEXITY_THRESHOLDS', () => {
    it('should have numeric thresholds', () => {
      expect(typeof COMPLEXITY_THRESHOLDS.LOW).toBe('number');
      expect(typeof COMPLEXITY_THRESHOLDS.MEDIUM).toBe('number');
      expect(typeof COMPLEXITY_THRESHOLDS.HIGH).toBe('number');
    });

    it('should have ascending order', () => {
      expect(COMPLEXITY_THRESHOLDS.LOW).toBeLessThan(COMPLEXITY_THRESHOLDS.MEDIUM);
      expect(COMPLEXITY_THRESHOLDS.MEDIUM).toBeLessThan(COMPLEXITY_THRESHOLDS.HIGH);
    });
  });

  describe('ANIMATION_DURATION', () => {
    it('should be a positive number', () => {
      expect(typeof ANIMATION_DURATION).toBe('number');
      expect(ANIMATION_DURATION).toBeGreaterThan(0);
    });
  });

  describe('MAX_FILE_SIZE', () => {
    it('should be a positive number', () => {
      expect(typeof MAX_FILE_SIZE).toBe('number');
      expect(MAX_FILE_SIZE).toBeGreaterThan(0);
    });
  });

  describe('GITHUB_API_RATE_LIMIT', () => {
    it('should be a positive number', () => {
      expect(typeof GITHUB_API_RATE_LIMIT).toBe('number');
      expect(GITHUB_API_RATE_LIMIT).toBeGreaterThan(0);
    });
  });
});

describe('Helpers', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('should handle decimal places', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1572864)).toBe('1.5 MB');
    });

    it('should handle negative values', () => {
      expect(formatFileSize(-1024)).toBe('0 Bytes');
    });
  });

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2023-01-01T00:00:00Z');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('should handle string dates', () => {
      const formatted = formatDate('2023-01-01');
      expect(formatted).toBeDefined();
    });

    it('should handle invalid dates', () => {
      const formatted = formatDate('invalid');
      expect(formatted).toBe('Invalid Date');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('should handle decimals', () => {
      expect(formatNumber(1000.5)).toBe('1,000.5');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('truncateString', () => {
    it('should truncate long strings', () => {
      const longString = 'This is a very long string that needs to be truncated';
      expect(truncateString(longString, 20)).toBe('This is a very long...');
    });

    it('should not truncate short strings', () => {
      const shortString = 'Short string';
      expect(truncateString(shortString, 20)).toBe('Short string');
    });

    it('should handle empty strings', () => {
      expect(truncateString('', 10)).toBe('');
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extensions', () => {
      expect(getFileExtension('file.js')).toBe('.js');
      expect(getFileExtension('file.test.js')).toBe('.js');
      expect(getFileExtension('package.json')).toBe('.json');
    });

    it('should handle files without extensions', () => {
      expect(getFileExtension('README')).toBe('');
      expect(getFileExtension('Dockerfile')).toBe('');
    });

    it('should handle paths', () => {
      expect(getFileExtension('/path/to/file.js')).toBe('.js');
      expect(getFileExtension('./src/components/App.jsx')).toBe('.jsx');
    });
  });

  describe('getLanguageFromExtension', () => {
    it('should map extensions to languages', () => {
      expect(getLanguageFromExtension('.js')).toBe('javascript');
      expect(getLanguageFromExtension('.py')).toBe('python');
      expect(getLanguageFromExtension('.java')).toBe('java');
    });

    it('should handle unknown extensions', () => {
      expect(getLanguageFromExtension('.unknown')).toBe('text');
    });

    it('should handle empty extensions', () => {
      expect(getLanguageFromExtension('')).toBe('text');
    });
  });

  describe('isValidUrl', () => {
    it('should validate URLs', () => {
      expect(isValidUrl('https://github.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('ftp://files.example.com')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('github.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('isValidGitHubUrl', () => {
    it('should validate GitHub URLs', () => {
      expect(isValidGitHubUrl('https://github.com/user/repo')).toBe(true);
      expect(isValidGitHubUrl('https://github.com/user/repo.git')).toBe(true);
    });

    it('should reject non-GitHub URLs', () => {
      expect(isValidGitHubUrl('https://gitlab.com/user/repo')).toBe(false);
      expect(isValidGitHubUrl('https://example.com')).toBe(false);
    });
  });

  describe('parseGitHubUrl', () => {
    it('should parse GitHub URLs', () => {
      const result = parseGitHubUrl('https://github.com/user/repo');
      expect(result).toEqual({
        owner: 'user',
        repo: 'repo',
        branch: 'main'
      });
    });

    it('should handle branches', () => {
      const result = parseGitHubUrl('https://github.com/user/repo/tree/develop');
      expect(result.branch).toBe('develop');
    });

    it('should handle .git suffix', () => {
      const result = parseGitHubUrl('https://github.com/user/repo.git');
      expect(result.repo).toBe('repo');
    });
  });

  describe('calculateComplexity', () => {
    it('should calculate complexity metrics', () => {
      const code = `
        function example() {
          if (condition) {
            for (let i = 0; i < 10; i++) {
              console.log(i);
            }
          }
        }
      `;
      const complexity = calculateComplexity(code);
      expect(complexity).toBeGreaterThan(0);
      expect(typeof complexity).toBe('number');
    });

    it('should handle empty code', () => {
      expect(calculateComplexity('')).toBe(0);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });

    it('should generate IDs with specified length', () => {
      const id = generateId(10);
      expect(id.length).toBe(10);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce function calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should throttle function calls', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('deepClone', () => {
    it('should clone objects deeply', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = deepClone(obj);
      
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });

    it('should handle arrays', () => {
      const arr = [1, [2, 3], { a: 4 }];
      const cloned = deepClone(arr);
      
      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
      expect(cloned[1]).not.toBe(arr[1]);
    });

    it('should handle primitives', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('string')).toBe('string');
      expect(deepClone(null)).toBe(null);
    });
  });

  describe('mergeObjects', () => {
    it('should merge objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { c: 3, d: 4 };
      const merged = mergeObjects(obj1, obj2);
      
      expect(merged).toEqual({ a: 1, b: 2, c: 3, d: 4 });
    });

    it('should handle overlapping keys', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 3, c: 4 };
      const merged = mergeObjects(obj1, obj2);
      
      expect(merged.b).toBe(3);
    });

    it('should merge nested objects', () => {
      const obj1 = { a: { x: 1 } };
      const obj2 = { a: { y: 2 } };
      const merged = mergeObjects(obj1, obj2);
      
      expect(merged.a).toEqual({ x: 1, y: 2 });
    });
  });

  describe('isEmpty', () => {
    it('should detect empty values', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty('')).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
    });

    it('should detect non-empty values', () => {
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
      expect(isEmpty('string')).toBe(false);
      expect(isEmpty([1])).toBe(false);
      expect(isEmpty({ a: 1 })).toBe(false);
    });
  });

  describe('isObject', () => {
    it('should detect objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ a: 1 })).toBe(true);
      expect(isObject(new Date())).toBe(true);
    });

    it('should reject non-objects', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject([])).toBe(false);
      expect(isObject('string')).toBe(false);
      expect(isObject(42)).toBe(false);
    });
  });

  describe('arrayToTree', () => {
    it('should convert array to tree structure', () => {
      const array = [
        { id: 1, parentId: null, name: 'root' },
        { id: 2, parentId: 1, name: 'child1' },
        { id: 3, parentId: 1, name: 'child2' }
      ];
      
      const tree = arrayToTree(array);
      expect(tree).toHaveLength(1);
      expect(tree[0].children).toHaveLength(2);
    });
  });

  describe('treeToArray', () => {
    it('should convert tree to array', () => {
      const tree = [
        {
          id: 1,
          name: 'root',
          children: [
            { id: 2, name: 'child1' },
            { id: 3, name: 'child2' }
          ]
        }
      ];
      
      const array = treeToArray(tree);
      expect(array).toHaveLength(3);
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize HTML input', () => {
      const input = '<script>alert("xss")</script>Hello';
      const sanitized = sanitizeInput(input);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Hello');
    });
  });

  describe('validateEmail', () => {
    it('should validate email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
    });
  });

  describe('validateGitHubRepo', () => {
    it('should validate GitHub repository format', () => {
      expect(validateGitHubRepo('user/repo')).toBe(true);
      expect(validateGitHubRepo('organization/project-name')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(validateGitHubRepo('invalid')).toBe(false);
      expect(validateGitHubRepo('user/repo/extra')).toBe(false);
      expect(validateGitHubRepo('')).toBe(false);
    });
  });

  describe('Array utilities', () => {
    describe('sortBy', () => {
      it('should sort array by property', () => {
        const array = [{ name: 'b' }, { name: 'a' }, { name: 'c' }];
        const sorted = sortBy(array, 'name');
        expect(sorted.map(item => item.name)).toEqual(['a', 'b', 'c']);
      });
    });

    describe('groupBy', () => {
      it('should group array by property', () => {
        const array = [
          { type: 'js', name: 'file1' },
          { type: 'js', name: 'file2' },
          { type: 'css', name: 'file3' }
        ];
        const grouped = groupBy(array, 'type');
        expect(grouped.js).toHaveLength(2);
        expect(grouped.css).toHaveLength(1);
      });
    });

    describe('unique', () => {
      it('should remove duplicates', () => {
        const array = [1, 2, 2, 3, 3, 3];
        const uniqueArray = unique(array);
        expect(uniqueArray).toEqual([1, 2, 3]);
      });
    });

    describe('chunk', () => {
      it('should split array into chunks', () => {
        const array = [1, 2, 3, 4, 5, 6];
        const chunks = chunk(array, 2);
        expect(chunks).toEqual([[1, 2], [3, 4], [5, 6]]);
      });
    });

    describe('range', () => {
      it('should generate range of numbers', () => {
        expect(range(5)).toEqual([0, 1, 2, 3, 4]);
        expect(range(2, 5)).toEqual([2, 3, 4]);
        expect(range(0, 10, 2)).toEqual([0, 2, 4, 6, 8]);
      });
    });
  });

  describe('Math utilities', () => {
    describe('clamp', () => {
      it('should clamp values', () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-5, 0, 10)).toBe(0);
        expect(clamp(15, 0, 10)).toBe(10);
      });
    });

    describe('lerp', () => {
      it('should interpolate between values', () => {
        expect(lerp(0, 10, 0.5)).toBe(5);
        expect(lerp(0, 10, 0)).toBe(0);
        expect(lerp(0, 10, 1)).toBe(10);
      });
    });
  });

  describe('Color utilities', () => {
    describe('hexToRgb', () => {
      it('should convert hex to RGB', () => {
        expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
        expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
        expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
      });
    });

    describe('rgbToHex', () => {
      it('should convert RGB to hex', () => {
        expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
        expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
        expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
      });
    });

    describe('generateRandomColor', () => {
      it('should generate valid hex colors', () => {
        const color = generateRandomColor();
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    describe('getContrastColor', () => {
      it('should return contrasting colors', () => {
        expect(getContrastColor('#ffffff')).toBe('#000000');
        expect(getContrastColor('#000000')).toBe('#ffffff');
      });
    });
  });
});

describe('Three.js Helpers', () => {
  describe('Scene creation', () => {
    it('should create a scene', () => {
      const scene = createScene();
      expect(scene).toBeDefined();
      expect(THREE.Scene).toHaveBeenCalled();
    });

    it('should create a camera', () => {
      const camera = createCamera(800, 600);
      expect(camera).toBeDefined();
      expect(THREE.PerspectiveCamera).toHaveBeenCalled();
    });

    it('should create a renderer', () => {
      const canvas = document.createElement('canvas');
      const renderer = createRenderer(canvas);
      expect(renderer).toBeDefined();
      expect(THREE.WebGLRenderer).toHaveBeenCalled();
    });

    it('should create lights', () => {
      const lights = createLights();
      expect(lights).toBeDefined();
      expect(Array.isArray(lights)).toBe(true);
    });
  });

  describe('Node creation', () => {
    it('should create file nodes', () => {
      const fileData = { name: 'test.js', type: 'file', size: 1000 };
      const node = createFileNode(fileData);
      expect(node).toBeDefined();
    });

    it('should create folder nodes', () => {
      const folderData = { name: 'src', type: 'folder' };
      const node = createFolderNode(folderData);
      expect(node).toBeDefined();
    });

    it('should create connection lines', () => {
      const start = { x: 0, y: 0, z: 0 };
      const end = { x: 1, y: 1, z: 1 };
      const line = createConnectionLine(start, end);
      expect(line).toBeDefined();
    });
  });

  describe('Animations', () => {
    it('should animate node position', () => {
      const node = { position: { x: 0, y: 0, z: 0 } };
      const targetPosition = { x: 1, y: 1, z: 1 };
      const animation = animateNodePosition(node, targetPosition);
      expect(animation).toBeDefined();
    });

    it('should animate node color', () => {
      const node = { material: { color: { r: 1, g: 0, b: 0 } } };
      const targetColor = { r: 0, g: 1, b: 0 };
      const animation = animateNodeColor(node, targetColor);
      expect(animation).toBeDefined();
    });

    it('should animate node scale', () => {
      const node = { scale: { x: 1, y: 1, z: 1 } };
      const targetScale = { x: 2, y: 2, z: 2 };
      const animation = animate