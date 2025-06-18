// File type mappings and colors
export const FILE_TYPES = {
    // Frontend
    'jsx': { color: '#61DAFB', category: 'frontend', icon: '⚛️' },
    'tsx': { color: '#3178C6', category: 'frontend', icon: '🔷' },
    'js': { color: '#F7DF1E', category: 'frontend', icon: '📜' },
    'ts': { color: '#3178C6', category: 'frontend', icon: '🔷' },
    'vue': { color: '#4FC08D', category: 'frontend', icon: '💚' },
    'svelte': { color: '#FF3E00', category: 'frontend', icon: '🔥' },
    'html': { color: '#E34F26', category: 'frontend', icon: '🌐' },
    'css': { color: '#1572B6', category: 'frontend', icon: '🎨' },
    'scss': { color: '#CF649A', category: 'frontend', icon: '🎨' },
    'sass': { color: '#CF649A', category: 'frontend', icon: '🎨' },
    'less': { color: '#1D365D', category: 'frontend', icon: '🎨' },
    
    // Backend
    'py': { color: '#3776AB', category: 'backend', icon: '🐍' },
    'java': { color: '#ED8B00', category: 'backend', icon: '☕' },
    'cpp': { color: '#00599C', category: 'backend', icon: '⚡' },
    'c': { color: '#A8B9CC', category: 'backend', icon: '🔧' },
    'cs': { color: '#239120', category: 'backend', icon: '🔷' },
    'go': { color: '#00ADD8', category: 'backend', icon: '🐹' },
    'rust': { color: '#CE422B', category: 'backend', icon: '🦀' },
    'php': { color: '#777BB4', category: 'backend', icon: '🐘' },
    'rb': { color: '#CC342D', category: 'backend', icon: '💎' },
    'swift': { color: '#FA7343', category: 'backend', icon: '🦉' },
    'kt': { color: '#7F52FF', category: 'backend', icon: '🔮' },
    'scala': { color: '#DC322F', category: 'backend', icon: '🎯' },
    
    // Data & Config
    'json': { color: '#FF6B6B', category: 'config', icon: '📦' },
    'yaml': { color: '#CB171E', category: 'config', icon: '⚙️' },
    'yml': { color: '#CB171E', category: 'config', icon: '⚙️' },
    'xml': { color: '#FF6600', category: 'config', icon: '📄' },
    'toml': { color: '#9C4221', category: 'config', icon: '🔧' },
    'ini': { color: '#6B6B6B', category: 'config', icon: '⚙️' },
    'env': { color: '#4CAF50', category: 'config', icon: '🌱' },
    
    // Database
    'sql': { color: '#336791', category: 'database', icon: '🗄️' },
    'db': { color: '#003B57', category: 'database', icon: '💾' },
    'sqlite': { color: '#003B57', category: 'database', icon: '💾' },
    
    // Documentation
    'md': { color: '#083FA1', category: 'docs', icon: '📝' },
    'mdx': { color: '#1B1F24', category: 'docs', icon: '📝' },
    'txt': { color: '#808080', category: 'docs', icon: '📄' },
    'rst': { color: '#3776AB', category: 'docs', icon: '📄' },
    
    // Build & Tools
    'dockerfile': { color: '#2496ED', category: 'build', icon: '🐳' },
    'makefile': { color: '#427819', category: 'build', icon: '🔨' },
    'gradle': { color: '#02303A', category: 'build', icon: '🐘' },
    'maven': { color: '#C71A36', category: 'build', icon: '📦' },
    'webpack': { color: '#8DD6F9', category: 'build', icon: '📦' },
    'rollup': { color: '#EC4A3F', category: 'build', icon: '📦' },
    'vite': { color: '#646CFF', category: 'build', icon: '⚡' },
    
    // Default
    'default': { color: '#6B7280', category: 'other', icon: '📄' }
  };
  
  // Node size ranges for different visualization modes
  export const NODE_SIZES = {
    FILE: {
      MIN: 1,
      MAX: 8,
      DEFAULT: 3
    },
    DIRECTORY: {
      MIN: 5,
      MAX: 20,
      DEFAULT: 10
    },
    DEPENDENCY: {
      MIN: 2,
      MAX: 12,
      DEFAULT: 5
    }
  };
  
  // Camera positions and controls
  export const CAMERA_SETTINGS = {
    POSITION: {
      x: 0,
      y: 0,
      z: 50
    },
    FOV: 75,
    NEAR: 0.1,
    FAR: 1000,
    CONTROLS: {
      enableDamping: true,
      dampingFactor: 0.05,
      enableZoom: true,
      enableRotate: true,
      enablePan: true,
      maxDistance: 200,
      minDistance: 10
    }
  };
  
  // Scene settings
  export const SCENE_SETTINGS = {
    BACKGROUND_COLOR: 0x0f0f0f,
    FOG: {
      color: 0x0f0f0f,
      near: 50,
      far: 300
    },
    LIGHTS: {
      AMBIENT: {
        color: 0x404040,
        intensity: 0.4
      },
      DIRECTIONAL: {
        color: 0xffffff,
        intensity: 0.8,
        position: { x: 10, y: 10, z: 5 }
      },
      POINT: {
        color: 0x61dafb,
        intensity: 0.6,
        position: { x: 0, y: 0, z: 0 }
      }
    }
  };
  
  // Animation settings
  export const ANIMATION_SETTINGS = {
    DURATION: {
      SHORT: 300,
      MEDIUM: 600,
      LONG: 1000
    },
    EASING: {
      EASE_IN: 'easeIn',
      EASE_OUT: 'easeOut',
      EASE_IN_OUT: 'easeInOut',
      BOUNCE: 'bounce'
    },
    ROTATION_SPEED: 0.01,
    HOVER_SCALE: 1.2,
    SELECTION_SCALE: 1.5
  };
  
  // Complexity thresholds
  export const COMPLEXITY_THRESHOLDS = {
    CYCLOMATIC: {
      LOW: 5,
      MEDIUM: 10,
      HIGH: 20,
      VERY_HIGH: 30
    },
    LINES_OF_CODE: {
      SMALL: 50,
      MEDIUM: 200,
      LARGE: 500,
      VERY_LARGE: 1000
    },
    COGNITIVE: {
      LOW: 8,
      MEDIUM: 15,
      HIGH: 25,
      VERY_HIGH: 40
    }
  };
  
  // Color schemes for different visualization modes
  export const COLOR_SCHEMES = {
    COMPLEXITY: {
      LOW: '#4ADE80',      // Green
      MEDIUM: '#FBBF24',   // Yellow
      HIGH: '#FB923C',     // Orange
      CRITICAL: '#EF4444'  // Red
    },
    ACTIVITY: {
      INACTIVE: '#6B7280',  // Gray
      LOW: '#10B981',       // Emerald
      MEDIUM: '#3B82F6',    // Blue
      HIGH: '#8B5CF6',      // Purple
      VERY_HIGH: '#EC4899'  // Pink
    },
    DEPENDENCIES: {
      ISOLATED: '#6B7280',     // Gray
      CONNECTED: '#10B981',    // Green
      HUB: '#F59E0B',         // Amber
      CRITICAL: '#EF4444'     // Red
    }
  };
  
  // API endpoints and limits
  export const API_SETTINGS = {
    GITHUB: {
      BASE_URL: 'https://api.github.com',
      RATE_LIMIT: 5000,
      TIMEOUT: 30000
    },
    OPENAI: {
      MODEL: 'gpt-4',
      MAX_TOKENS: 2000,
      TEMPERATURE: 0.7
    },
    CACHE: {
      TTL: 3600000, // 1 hour in milliseconds
      MAX_SIZE: 100
    }
  };
  
  // Supported file extensions for analysis
  export const SUPPORTED_EXTENSIONS = [
    'js', 'jsx', 'ts', 'tsx', 'vue', 'svelte',
    'py', 'java', 'cpp', 'c', 'cs', 'go', 'rust',
    'php', 'rb', 'swift', 'kt', 'scala',
    'html', 'css', 'scss', 'sass', 'less',
    'json', 'yaml', 'yml', 'xml', 'toml',
    'md', 'mdx', 'txt', 'sql'
  ];
  
  // GitHub API specific constants
  export const GITHUB_CONSTANTS = {
    MAX_FILE_SIZE: 1048576, // 1MB in bytes
    MAX_FILES_PER_REQUEST: 100,
    TREE_RECURSION_LIMIT: 10,
    SUPPORTED_HOSTS: ['github.com', 'raw.githubusercontent.com']
  };
  
  // Error messages
  export const ERROR_MESSAGES = {
    NETWORK: 'Network error occurred. Please check your connection.',
    GITHUB_API: 'GitHub API error. Please check the repository URL and try again.',
    INVALID_REPO: 'Invalid repository URL. Please provide a valid GitHub repository.',
    FILE_TOO_LARGE: 'File is too large to analyze.',
    UNSUPPORTED_FILE: 'File type not supported for analysis.',
    RATE_LIMIT: 'API rate limit exceeded. Please try again later.',
    PARSING_ERROR: 'Error parsing code. The file may be corrupted or invalid.',
    AI_SERVICE_ERROR: 'AI analysis service unavailable. Please try again later.'
  };
  
  // Success messages
  export const SUCCESS_MESSAGES = {
    REPO_LOADED: 'Repository loaded successfully!',
    ANALYSIS_COMPLETE: 'Code analysis completed!',
    VISUALIZATION_READY: 'Visualization is ready!',
    INSIGHTS_GENERATED: 'AI insights generated successfully!'
  };
  
  // Layout configurations
  export const LAYOUT_CONFIGS = {
    FORCE_DIRECTED: {
      strength: -300,
      distance: 30,
      iterations: 100
    },
    CIRCULAR: {
      radius: 20,
      startAngle: 0,
      endAngle: Math.PI * 2
    },
    HIERARCHICAL: {
      nodeDistance: 100,
      levelHeight: 80,
      direction: 'TB' // Top-Bottom
    },
    CLUSTER: {
      padding: 5,
      minRadius: 10,
      maxRadius: 50
    }
  };
  
  // Performance settings
  export const PERFORMANCE_SETTINGS = {
    MAX_NODES: 1000,
    MAX_EDGES: 2000,
    RENDER_DISTANCE: 100,
    LOD_THRESHOLD: 50, // Level of Detail threshold
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 16 // ~60fps
  };
  
  // Export all constants as default
  export default {
    FILE_TYPES,
    NODE_SIZES,
    CAMERA_SETTINGS,
    SCENE_SETTINGS,
    ANIMATION_SETTINGS,
    COMPLEXITY_THRESHOLDS,
    COLOR_SCHEMES,
    API_SETTINGS,
    SUPPORTED_EXTENSIONS,
    GITHUB_CONSTANTS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    LAYOUT_CONFIGS,
    PERFORMANCE_SETTINGS
  };