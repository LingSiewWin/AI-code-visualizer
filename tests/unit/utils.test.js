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
      const animation = animateNodeScale(node, targetScale);
      expect(animation).toBeDefined();
    });
  });

  describe('Node updates', () => {
    it('should update node position', () => {
      const node = { position: { set: vi.fn() } };
      const position = { x: 1, y: 2, z: 3 };
      updateNodePosition(node, position);
      expect(node.position.set).toHaveBeenCalledWith(1, 2, 3);
    });

    it('should update node color', () => {
      const node = { material: { color: { set: vi.fn() } } };
      const color = '#ff0000';
      updateNodeColor(node, color);
      expect(node.material.color.set).toHaveBeenCalled();
    });

    it('should update node scale', () => {
      const node = { scale: { set: vi.fn() } };
      const scale = { x: 2, y: 2, z: 2 };
      updateNodeScale(node, scale);
      expect(node.scale.set).toHaveBeenCalledWith(2, 2, 2);
    });
  });

  describe('Calculations', () => {
    it('should calculate node positions', () => {
      const data = { depth: 2, index: 1, total: 5 };
      const position = calculateNodePosition(data);
      expect(position).toHaveProperty('x');
      expect(position).toHaveProperty('y');
      expect(position).toHaveProperty('z');
    });

    it('should calculate node sizes', () => {
      const data = { size: 1000, complexity: 5 };
      const size = calculateNodeSize(data);
      expect(typeof size).toBe('number');
      expect(size).toBeGreaterThan(0);
    });

    it('should calculate node colors', () => {
      const data = { language: 'javascript', complexity: 3 };
      const color = calculateNodeColor(data);
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  describe('Particle system', () => {
    it('should create particle system', () => {
      const config = { count: 100, size: 0.1 };
      const particles = createParticleSystem(config);
      expect(particles).toBeDefined();
    });

    it('should update particle system', () => {
      const particles = { geometry: { attributes: { position: { needsUpdate: false } } } };
      const deltaTime = 0.016;
      updateParticleSystem(particles, deltaTime);
      expect(particles.geometry.attributes.position.needsUpdate).toBe(true);
    });
  });

  describe('Geometry and materials', () => {
    it('should create geometries', () => {
      const geometry = createGeometry('box', { width: 1, height: 1, depth: 1 });
      expect(geometry).toBeDefined();
    });

    it('should create materials', () => {
      const material = createMaterial('basic', { color: 0xff0000 });
      expect(material).toBeDefined();
    });

    it('should create meshes', () => {
      const geometry = { dispose: vi.fn() };
      const material = { dispose: vi.fn() };
      const mesh = createMesh(geometry, material);
      expect(mesh).toBeDefined();
    });

    it('should dispose meshes properly', () => {
      const mesh = {
        geometry: { dispose: vi.fn() },
        material: { dispose: vi.fn() },
        parent: { remove: vi.fn() }
      };
      disposeMesh(mesh);
      expect(mesh.geometry.dispose).toHaveBeenCalled();
      expect(mesh.material.dispose).toHaveBeenCalled();
    });
  });

  describe('Scene optimization', () => {
    it('should optimize scene', () => {
      const scene = {
        traverse: vi.fn((callback) => {
          // Simulate traversing scene objects
          callback({ type: 'Mesh', visible: true });
        })
      };
      optimizeScene(scene);
      expect(scene.traverse).toHaveBeenCalled();
    });

    it('should calculate bounding box', () => {
      const objects = [
        { position: { x: 0, y: 0, z: 0 } },
        { position: { x: 10, y: 10, z: 10 } }
      ];
      const bbox = calculateBoundingBox(objects);
      expect(bbox).toHaveProperty('min');
      expect(bbox).toHaveProperty('max');
    });
  });

  describe('Raycasting', () => {
    it('should get intersections', () => {
      const mouse = { x: 0, y: 0 };
      const camera = {};
      const objects = [];
      const intersections = getIntersections(mouse, camera, objects);
      expect(Array.isArray(intersections)).toBe(true);
    });

    it('should convert screen to world coordinates', () => {
      const screenPos = { x: 100, y: 100 };
      const camera = {};
      const worldPos = screenToWorld(screenPos, camera);
      expect(worldPos).toHaveProperty('x');
      expect(worldPos).toHaveProperty('y');
      expect(worldPos).toHaveProperty('z');
    });

    it('should convert world to screen coordinates', () => {
      const worldPos = { x: 1, y: 1, z: 1 };
      const camera = {};
      const renderer = { domElement: { width: 800, height: 600 } };
      const screenPos = worldToScreen(worldPos, camera, renderer);
      expect(screenPos).toHaveProperty('x');
      expect(screenPos).toHaveProperty('y');
    });
  });

  describe('Camera controls', () => {
    it('should add orbit controls', () => {
      const camera = {};
      const domElement = document.createElement('canvas');
      const controls = addOrbitControls(camera, domElement);
      expect(controls).toBeDefined();
    });

    it('should reset camera', () => {
      const camera = {
        position: { set: vi.fn() },
        lookAt: vi.fn()
      };
      resetCamera(camera);
      expect(camera.position.set).toHaveBeenCalled();
      expect(camera.lookAt).toHaveBeenCalled();
    });

    it('should focus on object', () => {
      const camera = {
        position: { copy: vi.fn() },
        lookAt: vi.fn()
      };
      const object = { position: { x: 1, y: 1, z: 1 } };
      focusOnObject(camera, object);
      expect(camera.lookAt).toHaveBeenCalled();
    });
  });

  describe('Visual effects', () => {
    it('should create wireframe', () => {
      const geometry = {};
      const wireframe = createWireframe(geometry);
      expect(wireframe).toBeDefined();
    });

    it('should create glow effect', () => {
      const object = {};
      const glow = createGlow(object);
      expect(glow).toBeDefined();
    });

    it('should add post processing', () => {
      const renderer = {};
      const scene = {};
      const camera = {};
      const composer = addPostProcessing(renderer, scene, camera);
      expect(composer).toBeDefined();
    });
  });

  describe('Import/Export', () => {
    it('should export scene', () => {
      const scene = {};
      const exported = exportScene(scene);
      expect(exported).toBeDefined();
      expect(typeof exported).toBe('string');
    });

    it('should import scene', () => {
      const sceneData = '{"objects":[]}';
      const scene = importScene(sceneData);
      expect(scene).toBeDefined();
    });
  });
});

describe('Color Schemes', () => {
  describe('Color constants', () => {
    it('should have default colors', () => {
      expect(DEFAULT_COLORS).toBeDefined();
      expect(typeof DEFAULT_COLORS).toBe('object');
    });

    it('should have language colors', () => {
      expect(LANGUAGE_COLORS).toBeDefined();
      expect(LANGUAGE_COLORS.javascript).toMatch(/^#[0-9a-f]{6}$/i);
      expect(LANGUAGE_COLORS.python).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should have complexity colors', () => {
      expect(COMPLEXITY_COLORS).toBeDefined();
      expect(COMPLEXITY_COLORS.low).toMatch(/^#[0-9a-f]{6}$/i);
      expect(COMPLEXITY_COLORS.medium).toMatch(/^#[0-9a-f]{6}$/i);
      expect(COMPLEXITY_COLORS.high).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should have theme colors', () => {
      expect(THEME_COLORS).toBeDefined();
      expect(THEME_COLORS.light).toBeDefined();
      expect(THEME_COLORS.dark).toBeDefined();
    });
  });

  describe('Color getter functions', () => {
    it('should get color by language', () => {
      const color = getColorByLanguage('javascript');
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should get color by complexity', () => {
      const color = getColorByComplexity(5);
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should get color by type', () => {
      const color = getColorByType('file');
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should get color by depth', () => {
      const color = getColorByDepth(3);
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should get color by size', () => {
      const color = getColorBySize(1000);
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  describe('Color manipulation', () => {
    it('should interpolate colors', () => {
      const color1 = '#ff0000';
      const color2 = '#0000ff';
      const interpolated = interpolateColor(color1, color2, 0.5);
      expect(interpolated).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should generate color palettes', () => {
      const palette = generateColorPalette(5);
      expect(Array.isArray(palette)).toBe(true);
      expect(palette).toHaveLength(5);
      palette.forEach(color => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('should adjust color brightness', () => {
      const original = '#808080';
      const brighter = adjustColorBrightness(original, 0.2);
      const darker = adjustColorBrightness(original, -0.2);
      
      expect(brighter).toMatch(/^#[0-9a-f]{6}$/i);
      expect(darker).toMatch(/^#[0-9a-f]{6}$/i);
      expect(brighter).not.toBe(original);
      expect(darker).not.toBe(original);
    });

    it('should get random colors', () => {
      const color = getRandomColor();
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should create gradients', () => {
      const gradient = createGradient(['#ff0000', '#00ff00', '#0000ff']);
      expect(gradient).toBeDefined();
      expect(typeof gradient).toBe('function');
      
      const color = gradient(0.5);
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  describe('Theme handling', () => {
    it('should apply themes', () => {
      const element = document.createElement('div');
      applyTheme(element, 'dark');
      expect(element.dataset.theme).toBe('dark');
    });
  });

  describe('Color validation and conversion', () => {
    it('should validate colors', () => {
      expect(validateColor('#ff0000')).toBe(true);
      expect(validateColor('#FFF')).toBe(true);
      expect(validateColor('rgb(255, 0, 0)')).toBe(true);
      expect(validateColor('invalid')).toBe(false);
    });

    it('should convert colors to hex', () => {
      expect(colorToHex('rgb(255, 0, 0)')).toBe('#ff0000');
      expect(colorToHex('#ff0000')).toBe('#ff0000');
    });

    it('should convert colors to RGB', () => {
      const rgb = colorToRgb('#ff0000');
      expect(rgb).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should convert colors to HSL', () => {
      const hsl = colorToHsl('#ff0000');
      expect(hsl).toHaveProperty('h');
      expect(hsl).toHaveProperty('s');
      expect(hsl).toHaveProperty('l');
    });
  });
});

describe('Data Transformers', () => {
  describe('Data transformation', () => {
    it('should transform repository data', () => {
      const repoData = {
        name: 'test-repo',
        description: 'Test repository',
        language: 'JavaScript',
        stars: 100,
        forks: 20
      };
      
      const transformed = transformRepositoryData(repoData);
      expect(transformed).toBeDefined();
      expect(transformed.name).toBe('test-repo');
    });

    it('should transform file data', () => {
      const fileData = {
        name: 'index.js',
        path: '/src/index.js',
        size: 1024,
        content: 'console.log("Hello");'
      };
      
      const transformed = transformFileData(fileData);
      expect(transformed).toBeDefined();
      expect(transformed.name).toBe('index.js');
    });

    it('should transform analysis data', () => {
      const analysisData = {
        complexity: 5,
        maintainability: 8,
        testCoverage: 75,
        dependencies: ['lodash', 'react']
      };
      
      const transformed = transformAnalysisData(analysisData);
      expect(transformed).toBeDefined();
      expect(transformed.complexity).toBe(5);
    });

    it('should transform metrics data', () => {
      const metricsData = {
        linesOfCode: 1000,
        functions: 50,
        classes: 10,
        files: 25
      };
      
      const transformed = transformMetricsData(metricsData);
      expect(transformed).toBeDefined();
      expect(transformed.linesOfCode).toBe(1000);
    });

    it('should transform visualization data', () => {
      const vizData = {
        nodes: [{ id: 1, name: 'node1' }],
        edges: [{ source: 1, target: 2 }]
      };
      
      const transformed = transformVisualizationData(vizData);
      expect(transformed).toBeDefined();
      expect(transformed.nodes).toHaveLength(1);
    });
  });

  describe('Data operations', () => {
    it('should normalize data', () => {
      const data = [1, 2, 3, 4, 5];
      const normalized = normalizeData(data);
      expect(normalized.every(val => val >= 0 && val <= 1)).toBe(true);
    });

    it('should aggregate data', () => {
      const data = [
        { category: 'A', value: 10 },
        { category: 'A', value: 20 },
        { category: 'B', value: 15 }
      ];
      
      const aggregated = aggregateData(data, 'category', 'sum');
      expect(aggregated.A).toBe(30);
      expect(aggregated.B).toBe(15);
    });

    it('should filter data', () => {
      const data = [
        { name: 'file1.js', size: 100 },
        { name: 'file2.js', size: 200 },
        { name: 'file3.css', size: 50 }
      ];
      
      const filtered = filterData(data, item => item.size > 75);
      expect(filtered).toHaveLength(2);
    });

    it('should sort data', () => {
      const data = [
        { name: 'c', value: 3 },
        { name: 'a', value: 1 },
        { name: 'b', value: 2 }
      ];
      
      const sorted = sortData(data, 'value');
      expect(sorted[0].name).toBe('a');
      expect(sorted[2].name).toBe('c');
    });

    it('should group data', () => {
      const data = [
        { type: 'js', name: 'file1' },
        { type: 'js', name: 'file2' },
        { type: 'css', name: 'file3' }
      ];
      
      const grouped = groupData(data, 'type');
      expect(grouped.js).toHaveLength(2);
      expect(grouped.css).toHaveLength(1);
    });

    it('should flatten data', () => {
      const data = {
        level1: {
          level2: {
            value: 'test'
          }
        }
      };
      
      const flattened = flattenData(data);
      expect(flattened['level1.level2.value']).toBe('test');
    });

    it('should restructure data', () => {
      const data = [
        ['name', 'age'],
        ['John', 30],
        ['Jane', 25]
      ];
      
      const restructured = restructureData(data);
      expect(restructured).toHaveLength(2);
      expect(restructured[0].name).toBe('John');
      expect(restructured[0].age).toBe(30);
    });
  });

  describe('Data validation and cleaning', () => {
    it('should validate data', () => {
      const validData = { name: 'test', value: 42 };
      const invalidData = { name: '', value: null };
      
      expect(validateData(validData)).toBe(true);
      expect(validateData(invalidData)).toBe(false);
    });

    it('should clean data', () => {
      const dirtyData = {
        name: '  Test  ',
        value: null,
        empty: '',
        undefined: undefined
      };
      
      const cleaned = cleanData(dirtyData);
      expect(cleaned.name).toBe('Test');
      expect(cleaned).not.toHaveProperty('value');
      expect(cleaned).not.toHaveProperty('empty');
      expect(cleaned).not.toHaveProperty('undefined');
    });
  });

  describe('Specialized processors', () => {
    it('should process code metrics', () => {
      const code = `
        function test() {
          if (true) {
            return 'hello';
          }
        }
      `;
      
      const metrics = processCodeMetrics(code);
      expect(metrics).toHaveProperty('lines');
      expect(metrics).toHaveProperty('functions');
      expect(metrics).toHaveProperty('complexity');
    });

    it('should process complexity data', () => {
      const complexityData = {
        cyclomatic: 5,
        cognitive: 8,
        halstead: { difficulty: 3, effort: 100 }
      };
      
      const processed = processComplexityData(complexityData);
      expect(processed).toHaveProperty('overall');
      expect(processed).toHaveProperty('details');
    });

    it('should process dependency data', () => {
      const dependencies = [
        { name: 'react', version: '^18.0.0', type: 'production' },
        { name: 'jest', version: '^29.0.0', type: 'development' }
      ];
      
      const processed = processDependencyData(dependencies);
      expect(processed).toHaveProperty('production');
      expect(processed).toHaveProperty('development');
    });

    it('should process git data', () => {
      const gitData = {
        commits: [
          { hash: 'abc123', message: 'Initial commit', date: '2023-01-01' },
          { hash: 'def456', message: 'Add feature', date: '2023-01-02' }
        ],
        branches: ['main', 'develop'],
        contributors: ['user1', 'user2']
      };
      
      const processed = processGitData(gitData);
      expect(processed).toHaveProperty('commitCount');
      expect(processed).toHaveProperty('branchCount');
      expect(processed).toHaveProperty('contributorCount');
    });

    it('should process AI insights', () => {
      const insights = [
        { type: 'suggestion', message: 'Consider refactoring this function', confidence: 0.8 },
        { type: 'warning', message: 'Potential memory leak', confidence: 0.9 }
      ];
      
      const processed = processAIInsights(insights);
      expect(processed).toHaveProperty('suggestions');
      expect(processed).toHaveProperty('warnings');
      expect(processed).toHaveProperty('averageConfidence');
    });
  });

  describe('Statistics and summary', () => {
    it('should calculate statistics', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const stats = calculateStatistics(data);
      
      expect(stats).toHaveProperty('mean');
      expect(stats).toHaveProperty('median');
      expect(stats).toHaveProperty('mode');
      expect(stats).toHaveProperty('standardDeviation');
      expect(stats.mean).toBe(5.5);
    });

    it('should generate summary', () => {
      const data = {
        files: 100,
        lines: 10000,
        functions: 500,
        complexity: 3.5
      };
      
      const summary = generateSummary(data);
      expect(summary).toHaveProperty('fileCount');
      expect(summary).toHaveProperty('averageComplexity');
      expect(summary).toHaveProperty('recommendations');
    });
  });

  describe('Formatting functions', () => {
    it('should format for visualization', () => {
      const data = {
        nodes: [{ id: 1, name: 'test' }],
        edges: [{ source: 1, target: 2 }]
      };
      
      const formatted = formatForVisualization(data);
      expect(formatted).toHaveProperty('nodes');
      expect(formatted).toHaveProperty('links');
    });

    it('should format for export', () => {
      const data = { test: 'value' };
      const csvFormatted = formatForExport(data, 'csv');
      const jsonFormatted = formatForExport(data, 'json');
      
      expect(typeof csvFormatted).toBe('string');
      expect(typeof jsonFormatted).toBe('string');
    });
  });

  describe('Parsing functions', () => {
    it('should parse CSV', () => {
      const csvData = 'name,age\nJohn,30\nJane,25';
      const parsed = parseCSV(csvData);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('John');
    });

    it('should parse JSON', () => {
      const jsonData = '{"name": "test", "value": 42}';
      const parsed = parseJSON(jsonData);
      
      expect(parsed.name).toBe('test');
      expect(parsed.value).toBe(42);
    });

    it('should parse XML', () => {
      const xmlData = '<root><item name="test" value="42"/></root>';
      const parsed = parseXML(xmlData);
      
      expect(parsed).toBeDefined();
    });
  });

  describe('Conversion and serialization', () => {
    it('should convert to different formats', () => {
      const data = [{ name: 'test', value: 42 }];
      
      const csv = convertToFormat(data, 'csv');
      const json = convertToFormat(data, 'json');
      const xml = convertToFormat(data, 'xml');
      
      expect(typeof csv).toBe('string');
      expect(typeof json).toBe('string');
      expect(typeof xml).toBe('string');
    });

    it('should serialize and deserialize data', () => {
      const data = { test: 'value', number: 42 };
      
      const serialized = serializeData(data);
      const deserialized = deserializeData(serialized);
      
      expect(typeof serialized).toBe('string');
      expect(deserialized).toEqual(data);
    });
  });
});

describe('Error handling', () => {
  it('should handle invalid inputs gracefully', () => {
    expect(() => formatFileSize('invalid')).not.toThrow();
    expect(() => formatDate('invalid')).not.toThrow();
    expect(() => getLanguageFromExtension(null)).not.toThrow();
    expect(() => calculateComplexity(null)).not.toThrow();
  });

  it('should handle edge cases', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(truncateString('', 10)).toBe('');
    expect(unique([])).toEqual([]);
    expect(chunk([], 2)).toEqual([]);
  });

  it('should handle null and undefined values', () => {
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
    expect(deepClone(null)).toBe(null);
    expect(deepClone(undefined)).toBe(undefined);
  });
});

describe('Performance', () => {
  it('should handle large datasets efficiently', () => {
    const largeArray = Array.from({ length: 10000 }, (_, i) => ({ id: i, value: Math.random() }));
    
    const start = performance.now();
    const sorted = sortBy(largeArray, 'value');
    const end = performance.now();
    
    expect(sorted).toHaveLength(10000);
    expect(end - start).toBeLessThan(100); // Should complete in under 100ms
  });

  it('should debounce function calls efficiently', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);
    
    // Call function multiple times rapidly
    for (let i = 0; i < 100; i++) {
      debouncedFn();
    }
    
    expect(fn).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    
    vi.useRealTimers();
  });
});NodePosition(node, targetPosition);
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