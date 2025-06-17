/**
 * Color Schemes - Comprehensive color definitions for the AI Code Visualizer
 * Includes programming language colors, UI themes, and visualization palettes
 */

/**
 * Programming Language Colors
 * Based on GitHub's language color scheme with enhancements
 */
export const LANGUAGE_COLORS = {
    // JavaScript ecosystem
    javascript: '#f1e05a',
    js: '#f1e05a',
    typescript: '#3178c6',
    ts: '#3178c6',
    jsx: '#61dafb',
    tsx: '#61dafb',
    vue: '#41b883',
    svelte: '#ff3e00',
    angular: '#dd0031',
    react: '#61dafb',
    node: '#68a063',
    nodejs: '#68a063',
    
    // Web technologies
    html: '#e34c26',
    css: '#1572b6',
    scss: '#c6538c',
    sass: '#c6538c',
    less: '#1d365d',
    stylus: '#ff6347',
    
    // Python ecosystem
    python: '#3776ab',
    py: '#3776ab',
    django: '#092e20',
    flask: '#000000',
    
    // Java ecosystem
    java: '#ed8b00',
    kotlin: '#7f52ff',
    scala: '#c22d40',
    groovy: '#4298b8',
    
    // C/C++ family
    c: '#555555',
    'c++': '#00599c',
    cpp: '#00599c',
    cxx: '#00599c',
    'c#': '#512bd4',
    csharp: '#512bd4',
    
    // Mobile development
    swift: '#fa7343',
    objectivec: '#438eff',
    'objective-c': '#438eff',
    dart: '#00b4ab',
    flutter: '#02569b',
    
    // System languages
    rust: '#dea584',
    go: '#00add8',
    golang: '#00add8',
    zig: '#ec915c',
    
    // Functional languages
    haskell: '#5e5086',
    ocaml: '#3be133',
    fsharp: '#b845fc',
    'f#': '#b845fc',
    erlang: '#b83998',
    elixir: '#6e4a7e',
    clojure: '#db5855',
    
    // Ruby ecosystem
    ruby: '#701516',
    rb: '#701516',
    rails: '#cc0000',
    
    // PHP ecosystem
    php: '#4f5d95',
    laravel: '#ff2d20',
    symfony: '#000000',
    
    // Database languages
    sql: '#e38c00',
    mysql: '#00758f',
    postgresql: '#336791',
    sqlite: '#003b57',
    
    // Shell scripting
    shell: '#89e051',
    bash: '#89e051',
    zsh: '#89e051',
    fish: '#89e051',
    powershell: '#012456',
    
    // Data & config
    json: '#292929',
    xml: '#0060ac',
    yaml: '#cb171e',
    yml: '#cb171e',
    toml: '#9c4221',
    ini: '#d1dae3',
    
    // Documentation
    markdown: '#083fa1',
    md: '#083fa1',
    rst: '#141414',
    tex: '#3d6117',
    latex: '#3d6117',
    
    // Other languages
    lua: '#000080',
    perl: '#0298c3',
    r: '#198ce7',
    julia: '#a270ba',
    matlab: '#e16737',
    mathematica: '#dd1100',
    
    // Fallback
    unknown: '#858585',
    other: '#858585'
  };
  
  /**
   * File Type Colors
   * Colors for different file categories and types
   */
  export const FILE_TYPE_COLORS = {
    // Source code
    source: '#4caf50',
    component: '#2196f3',
    service: '#ff9800',
    utility: '#9c27b0',
    helper: '#795548',
    
    // Configuration
    config: '#607d8b',
    environment: '#8bc34a',
    build: '#ff5722',
    
    // Documentation
    documentation: '#03a9f4',
    readme: '#03a9f4',
    changelog: '#673ab7',
    
    // Testing
    test: '#f44336',
    spec: '#e91e63',
    mock: '#ffc107',
    
    // Assets
    image: '#4caf50',
    video: '#9c27b0',
    audio: '#ff9800',
    font: '#795548',
    
    // Data
    data: '#607d8b',
    schema: '#3f51b5',
    migration: '#009688',
    
    // Build & deployment
    docker: '#2496ed',
    kubernetes: '#326ce5',
    terraform: '#623ce4',
    
    // Default
    default: '#9e9e9e'
  };
  
  /**
   * UI Theme Colors
   * Main application theme colors
   */
  export const UI_THEMES = {
    dark: {
      primary: '#1976d2',
      secondary: '#dc004e',
      accent: '#00bcd4',
      background: '#121212',
      surface: '#1e1e1e',
      card: '#2d2d2d',
      text: {
        primary: '#ffffff',
        secondary: '#b3b3b3',
        disabled: '#666666'
      },
      border: '#333333',
      shadow: 'rgba(0, 0, 0, 0.3)',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3'
    },
    
    light: {
      primary: '#1976d2',
      secondary: '#dc004e',
      accent: '#00bcd4',
      background: '#ffffff',
      surface: '#f5f5f5',
      card: '#ffffff',
      text: {
        primary: '#212121',
        secondary: '#757575',
        disabled: '#bdbdbd'
      },
      border: '#e0e0e0',
      shadow: 'rgba(0, 0, 0, 0.1)',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3'
    },
    
    cyberpunk: {
      primary: '#00ffff',
      secondary: '#ff00ff',
      accent: '#ffff00',
      background: '#0a0a0a',
      surface: '#1a1a2e',
      card: '#16213e',
      text: {
        primary: '#00ffff',
        secondary: '#ff00ff',
        disabled: '#666666'
      },
      border: '#0f3460',
      shadow: 'rgba(0, 255, 255, 0.2)',
      success: '#00ff00',
      warning: '#ffff00',
      error: '#ff0040',
      info: '#00ffff'
    }
  };
  
  /**
   * Visualization Color Palettes
   * Color schemes for charts, graphs, and 3D visualizations
   */
  export const VISUALIZATION_PALETTES = {
    // Categorical palettes
    categorical: {
      primary: [
        '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
        '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
      ],
      
      pastel: [
        '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
        '#c49c94', '#f7b6d3', '#c7c7c7', '#dbdb8d', '#9edae5'
      ],
      
      vibrant: [
        '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
        '#1abc9c', '#e67e22', '#95a5a6', '#f1c40f', '#34495e'
      ],
      
      neon: [
        '#ff0080', '#00ff80', '#8000ff', '#ff8000', '#0080ff',
        '#80ff00', '#ff0040', '#40ff00', '#0040ff', '#ff4000'
      ]
    },
    
    // Sequential palettes
    sequential: {
      blues: [
        '#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6',
        '#4292c6', '#2171b5', '#08519c', '#08306b'
      ],
      
      greens: [
        '#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476',
        '#41ab5d', '#238b45', '#006d2c', '#00441b'
      ],
      
      reds: [
        '#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a',
        '#ef3b2c', '#cb181d', '#a50f15', '#67000d'
      ],
      
      purples: [
        '#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8',
        '#807dba', '#6a51a3', '#54278f', '#3f007d'
      ]
    },
    
    // Diverging palettes
    diverging: {
      redBlue: [
        '#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7',
        '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'
      ],
      
      redYellowBlue: [
        '#a50026', '#d73027', '#f46d43', '#fdae61', '#fee090',
        '#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'
      ],
      
      greenPurple: [
        '#40004b', '#762a83', '#9970ab', '#c2a5cf', '#e7d4e8',
        '#d9f0d3', '#a6dba0', '#5aae61', '#1b7837', '#00441b'
      ]
    }
  };
  
  /**
   * Complexity Color Mapping
   * Colors for representing code complexity levels
   */
  export const COMPLEXITY_COLORS = {
    veryLow: '#2e7d32',    // Dark green
    low: '#66bb6a',       // Light green
    moderate: '#ffa726',   // Orange
    high: '#ef5350',      // Red
    veryHigh: '#c62828',  // Dark red
    extreme: '#8e24aa'    // Purple
  };
  
  /**
   * Dependency Relationship Colors
   * Colors for different types of dependencies
   */
  export const DEPENDENCY_COLORS = {
    internal: '#2196f3',     // Blue
    external: '#ff9800',     // Orange
    devDependency: '#9c27b0', // Purple
    peerDependency: '#4caf50', // Green
    optional: '#607d8b',     // Blue grey
    circular: '#f44336'      // Red
  };
  
  /**
   * Status Colors
   * Colors for various status indicators
   */
  export const STATUS_COLORS = {
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
    pending: '#9e9e9e',
    loading: '#00bcd4',
    disabled: '#bdbdbd'
  };
  
  /**
   * Get color by language
   * @param {string} language - Programming language
   * @returns {string} Hex color code
   */
  export const getLanguageColor = (language) => {
    if (!language) return LANGUAGE_COLORS.unknown;
    return LANGUAGE_COLORS[language.toLowerCase()] || LANGUAGE_COLORS.unknown;
  };
  
  /**
   * Get color by file type
   * @param {string} type - File type
   * @returns {string} Hex color code
   */
  export const getFileTypeColor = (type) => {
    if (!type) return FILE_TYPE_COLORS.default;
    return FILE_TYPE_COLORS[type.toLowerCase()] || FILE_TYPE_COLORS.default;
  };
  
  /**
   * Get complexity color
   * @param {number} complexity - Complexity score
   * @returns {string} Hex color code
   */
  export const getComplexityColor = (complexity) => {
    if (complexity <= 5) return COMPLEXITY_COLORS.veryLow;
    if (complexity <= 10) return COMPLEXITY_COLORS.low;
    if (complexity <= 15) return COMPLEXITY_COLORS.moderate;
    if (complexity <= 25) return COMPLEXITY_COLORS.high;
    if (complexity <= 40) return COMPLEXITY_COLORS.veryHigh;
    return COMPLEXITY_COLORS.extreme;
  };
  
  /**
   * Get dependency color
   * @param {string} type - Dependency type
   * @returns {string} Hex color code
   */
  export const getDependencyColor = (type) => {
    return DEPENDENCY_COLORS[type] || DEPENDENCY_COLORS.internal;
  };
  
  /**
   * Get status color
   * @param {string} status - Status type
   * @returns {string} Hex color code
   */
  export const getStatusColor = (status) => {
    return STATUS_COLORS[status] || STATUS_COLORS.info;
  };
  
  /**
   * Generate color palette
   * @param {string} type - Palette type ('categorical', 'sequential', 'diverging')
   * @param {string} scheme - Color scheme name
   * @param {number} count - Number of colors needed
   * @returns {Array} Array of color hex codes
   */
  export const generateColorPalette = (type, scheme, count = 10) => {
    const palette = VISUALIZATION_PALETTES[type]?.[scheme];
    if (!palette) return VISUALIZATION_PALETTES.categorical.primary.slice(0, count);
    
    if (palette.length >= count) {
      return palette.slice(0, count);
    }
    
    // Interpolate colors if we need more than available
    return interpolateColors(palette, count);
  };
  
  /**
   * Interpolate between colors to create more colors
   * @param {Array} colors - Base colors
   * @param {number} count - Desired number of colors
   * @returns {Array} Interpolated colors
   */
  const interpolateColors = (colors, count) => {
    if (colors.length >= count) return colors.slice(0, count);
    
    const result = [];
    const step = (colors.length - 1) / (count - 1);
    
    for (let i = 0; i < count; i++) {
      const index = i * step;
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const ratio = index - lower;
      
      if (lower === upper) {
        result.push(colors[lower]);
      } else {
        result.push(interpolateColor(colors[lower], colors[upper], ratio));
      }
    }
    
    return result;
  };
  
  /**
   * Interpolate between two colors
   * @param {string} color1 - First color (hex)
   * @param {string} color2 - Second color (hex)
   * @param {number} ratio - Interpolation ratio (0-1)
   * @returns {string} Interpolated color (hex)
   */
  const interpolateColor = (color1, color2, ratio) => {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  /**
   * Convert hex color to RGB
   * @param {string} hex - Hex color code
   * @returns {Object} RGB color object
   */
  export const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  /**
   * Convert RGB to hex color
   * @param {number} r - Red value (0-255)
   * @param {number} g - Green value (0-255)
   * @param {number} b - Blue value (0-255)
   * @returns {string} Hex color code
   */
  export const rgbToHex = (r, g, b) => {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  /**
   * Convert hex color to HSL
   * @param {string} hex - Hex color code
   * @returns {Object} HSL color object
   */
  export const hexToHsl = (hex) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;
    
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const sum = max + min;
    
    let h = 0;
    const l = sum / 2;
    const s = diff === 0 ? 0 : l < 0.5 ? diff / sum : diff / (2 - sum);
    
    if (diff !== 0) {
      switch (max) {
        case r: h = (g - b) / diff + (g < b ? 6 : 0); break;
        case g: h = (b - r) / diff + 2; break;
        case b: h = (r - g) / diff + 4; break;
      }
      h /= 6;
    }
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };
  
  /**
   * Adjust color brightness
   * @param {string} hex - Hex color code
   * @param {number} amount - Brightness adjustment (-100 to 100)
   * @returns {string} Adjusted hex color
   */
  export const adjustBrightness = (hex, amount) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    
    const adjust = (value) => {
      const adjusted = value + (amount * 255 / 100);
      return Math.max(0, Math.min(255, Math.round(adjusted)));
    };
    
    return rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b));
  };
  
  /**
   * Get contrasting text color (black or white)
   * @param {string} hex - Background hex color
   * @returns {string} Contrasting text color
   */
  export const getContrastingTextColor = (hex) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return '#000000';
    
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };
  
  /**
   * Create color scale for data visualization
   * @param {Array} data - Data values
   * @param {Array} colors - Color palette
   * @returns {Function} Color scale function
   */
  export const createColorScale = (data, colors) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    
    return (value) => {
      if (range === 0) return colors[0];
      const normalized = (value - min) / range;
      const index = Math.floor(normalized * (colors.length - 1));
      return colors[Math.max(0, Math.min(colors.length - 1, index))];
    };
  };
  
  export default {
    LANGUAGE_COLORS,
    FILE_TYPE_COLORS,
    UI_THEMES,
    VISUALIZATION_PALETTES,
    COMPLEXITY_COLORS,
    DEPENDENCY_COLORS,
    STATUS_COLORS,
    getLanguageColor,
    getFileTypeColor,
    getComplexityColor,
    getDependencyColor,
    getStatusColor,
    generateColorPalette,
    hexToRgb,
    rgbToHex,
    hexToHsl,
    adjustBrightness,
    getContrastingTextColor,
    createColorScale
  };