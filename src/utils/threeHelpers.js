import * as THREE from 'three';
import { 
  NODE_SIZES, 
  SCENE_SETTINGS, 
  ANIMATION_SETTINGS,
  LAYOUT_CONFIGS,
  COLOR_SCHEMES
} from './constants.js';
import { getFileTypeInfo, getComplexityLevel, getComplexityColor } from './helpers.js';

/**
 * Create a basic geometry based on node type
 * @param {string} type - Node type ('file', 'directory', 'dependency')
 * @param {number} size - Node size
 * @returns {THREE.Geometry} - Three.js geometry
 */
export const createNodeGeometry = (type = 'file', size = NODE_SIZES.FILE.DEFAULT) => {
  switch (type) {
    case 'directory':
      return new THREE.BoxGeometry(size, size, size);
    case 'dependency':
      return new THREE.OctahedronGeometry(size);
    case 'file':
    default:
      return new THREE.SphereGeometry(size, 16, 12);
  }
};

/**
 * Create a material based on file type or complexity
 * @param {object} options - Material options
 * @returns {THREE.Material} - Three.js material
 */
export const createNodeMaterial = (options = {}) => {
  const {
    color = 0x61dafb,
    opacity = 1,
    transparent = false,
    emissive = 0x000000,
    emissiveIntensity = 0.1,
    roughness = 0.4,
    metalness = 0.2,
    wireframe = false
  } = options;

  return new THREE.MeshStandardMaterial({
    color,
    opacity,
    transparent,
    emissive,
    emissiveIntensity,
    roughness,
    metalness,
    wireframe
  });
};

/**
 * Create a node mesh for a file
 * @param {object} fileInfo - File information
 * @param {object} options - Mesh options
 * @returns {THREE.Mesh} - Three.js mesh
 */
export const createFileMesh = (fileInfo, options = {}) => {
  const { 
    visualizationMode = 'fileType',
    size = NODE_SIZES.FILE.DEFAULT,
    position = { x: 0, y: 0, z: 0 }
  } = options;

  const typeInfo = getFileTypeInfo(fileInfo.name);
  let color = typeInfo.color;
  
  // Adjust color based on visualization mode
  if (visualizationMode === 'complexity' && fileInfo.complexity) {
    const level = getComplexityLevel(fileInfo.complexity);
    color = getComplexityColor(level);
  }

  const geometry = createNodeGeometry('file', size);
  const material = createNodeMaterial({ 
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.8
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position.x, position.y, position.z);
  
  // Store file information for interaction
  mesh.userData = {
    type: 'file',
    fileInfo,
    originalColor: color,
    originalScale: { x: 1, y: 1, z: 1 }
  };

  return mesh;
};

/**
 * Create a node mesh for a directory
 * @param {object} dirInfo - Directory information
 * @param {object} options - Mesh options
 * @returns {THREE.Mesh} - Three.js mesh
 */
export const createDirectoryMesh = (dirInfo, options = {}) => {
  const { 
    size = NODE_SIZES.DIRECTORY.DEFAULT,
    position = { x: 0, y: 0, z: 0 },
    color = '#4A90E2'
  } = options;

  const geometry = createNodeGeometry('directory', size);
  const material = createNodeMaterial({ 
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.7,
    wireframe: true
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position.x, position.y, position.z);
  
  mesh.userData = {
    type: 'directory',
    dirInfo,
    originalColor: color,
    originalScale: { x: 1, y: 1, z: 1 }
  };

  return mesh;
};

/**
 * Create a connection line between two nodes
 * @param {THREE.Vector3} start - Start position
 * @param {THREE.Vector3} end - End position
 * @param {object} options - Line options
 * @returns {THREE.Line} - Three.js line
 */
export const createConnectionLine = (start, end, options = {}) => {
  const {
    color = 0x666666,
    opacity = 0.3,
    linewidth = 1,
    dashed = false
  } = options;

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array([
    start.x, start.y, start.z,
    end.x, end.y, end.z
  ]);
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity,
    linewidth
  });

  if (dashed) {
    material.linecap = 'round';
    material.linejoin = 'round';
    material.dashSize = 2;
    material.gapSize = 1;
  }

  const line = new THREE.Line(geometry, material);
  line.userData = { type: 'connection' };
  
  return line;
};

/**
 * Create curved connection between nodes
 * @param {THREE.Vector3} start - Start position
 * @param {THREE.Vector3} end - End position
 * @param {object} options - Curve options
 * @returns {THREE.Line} - Three.js curved line
 */
export const createCurvedConnection = (start, end, options = {}) => {
  const {
    color = 0x666666,
    opacity = 0.3,
    segments = 20,
    height = 5
  } = options;

  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  midpoint.y += height;

  const curve = new THREE.QuadraticBezierCurve3(start, midpoint, end);
  const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(segments));

  const material = new THREE.LineBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity
  });

  const line = new THREE.Line(geometry, material);
  line.userData = { type: 'curved_connection' };
  
  return line;
};

/**
 * Apply force-directed layout to nodes
 * @param {Array} nodes - Array of node objects with mesh and connections
 * @param {object} config - Layout configuration
 * @returns {Array} - Updated node positions
 */
export const applyForceDirectedLayout = (nodes, config = LAYOUT_CONFIGS.FORCE_DIRECTED) => {
  const { strength, distance, iterations } = config;
  
  for (let i = 0; i < iterations; i++) {
    // Apply repulsion forces
    for (let j = 0; j < nodes.length; j++) {
      for (let k = j + 1; k < nodes.length; k++) {
        const nodeA = nodes[j];
        const nodeB = nodes[k];
        
        const dx = nodeB.mesh.position.x - nodeA.mesh.position.x;
        const dy = nodeB.mesh.position.y - nodeA.mesh.position.y;
        const dz = nodeB.mesh.position.z - nodeA.mesh.position.z;
        
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (dist > 0) {
          const force = strength / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          const fz = (dz / dist) * force;
          
          nodeA.mesh.position.x -= fx;
          nodeA.mesh.position.y -= fy;
          nodeA.mesh.position.z -= fz;
          
          nodeB.mesh.position.x += fx;
          nodeB.mesh.position.y += fy;
          nodeB.mesh.position.z += fz;
        }
      }
    }
    
    // Apply attraction forces for connected nodes
    nodes.forEach(node => {
      if (node.connections) {
        node.connections.forEach(targetId => {
          const target = nodes.find(n => n.id === targetId);
          if (target) {
            const dx = target.mesh.position.x - node.mesh.position.x;
            const dy = target.mesh.position.y - node.mesh.position.y;
            const dz = target.mesh.position.z - node.mesh.position.z;
            
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (dist > distance) {
              const force = (dist - distance) * 0.1;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;
              const fz = (dz / dist) * force;
              
              node.mesh.position.x += fx;
              node.mesh.position.y += fy;
              node.mesh.position.z += fz;
              
              target.mesh.position.x -= fx;
              target.mesh.position.y -= fy;
              target.mesh.position.z -= fz;
            }
          }
        });
      }
    });
  }
  
  return nodes;
};

/**
 * Apply circular layout to nodes
 * @param {Array} nodes - Array of node meshes
 * @param {object} config - Layout configuration
 * @returns {Array} - Updated node positions
 */
export const applyCircularLayout = (nodes, config = LAYOUT_CONFIGS.CIRCULAR) => {
  const { radius, startAngle, endAngle } = config;
  const angleStep = (endAngle - startAngle) / Math.max(1, nodes.length - 1);
  
  nodes.forEach((node, index) => {
    const angle = startAngle + (angleStep * index);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    if (node.mesh) {
      node.mesh.position.set(x, 0, z);
    }
  });
  
  return nodes;
};

/**
 * Apply hierarchical layout to nodes
 * @param {Array} nodes - Array of node objects
 * @param {object} config - Layout configuration
 * @returns {Array} - Updated node positions
 */
export const applyHierarchicalLayout = (nodes, config = LAYOUT_CONFIGS.HIERARCHICAL) => {
  const { nodeDistance, levelHeight } = config;
  
  // Group nodes by level (based on file depth)
  const levels = {};
  nodes.forEach(node => {
    const level = node.level || 0;
    if (!levels[level]) levels[level] = [];
    levels[level].push(node);
  });
  
  // Position nodes level by level
  Object.keys(levels).forEach(level => {
    const levelNodes = levels[level];
    const levelY = -level * levelHeight;
    
    levelNodes.forEach((node, index) => {
      const x = (index - (levelNodes.length - 1) / 2) * nodeDistance;
      if (node.mesh) {
        node.mesh.position.set(x, levelY, 0);
      }
    });
  });
  
  return nodes;
};

/**
 * Create particle system for background effects
 * @param {object} options - Particle system options
 * @returns {THREE.Points} - Three.js points system
 */
export const createParticleSystem = (options = {}) => {
  const {
    count = 1000,
    size = 1,
    color = 0x444444,
    range = 200
  } = options;

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * range;     // x
    positions[i + 1] = (Math.random() - 0.5) * range; // y
    positions[i + 2] = (Math.random() - 0.5) * range; // z
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: new THREE.Color(color),
    size,
    transparent: true,
    opacity: 0.3
  });

  return new THREE.Points(geometry, material);
};

/**
 * Animate node hover effect
 * @param {THREE.Mesh} mesh - Node mesh
 * @param {boolean} hover - Whether hovering
 * @param {number} duration - Animation duration in ms
 */
export const animateNodeHover = (mesh, hover = true, duration = ANIMATION_SETTINGS.DURATION.SHORT) => {
  if (!mesh || !mesh.userData) return;

  const targetScale = hover ? ANIMATION_SETTINGS.HOVER_SCALE : 1;
  const startScale = mesh.scale.x;
  const startTime = performance.now();

  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out animation
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentScale = startScale + (targetScale - startScale) * easeProgress;
    
    mesh.scale.set(currentScale, currentScale, currentScale);
    
    // Update material properties
    if (hover) {
      mesh.material.emissiveIntensity = 0.3;
      mesh.material.opacity = 1;
    } else {
      mesh.material.emissiveIntensity = 0.1;
      mesh.material.opacity = mesh.userData.type === 'file' ? 0.8 : 0.7;
    }
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  requestAnimationFrame(animate);
};

/**
 * Animate node selection
 * @param {THREE.Mesh} mesh - Node mesh
 * @param {boolean} selected - Whether selected
 */
export const animateNodeSelection = (mesh, selected = true) => {
  if (!mesh || !mesh.userData) return;

  if (selected) {
    mesh.scale.set(
      ANIMATION_SETTINGS.SELECTION_SCALE,
      ANIMATION_SETTINGS.SELECTION_SCALE,
      ANIMATION_SETTINGS.SELECTION_SCALE
    );
    mesh.material.emissive.setHex(0x222222);
    mesh.material.emissiveIntensity = 0.5;
  } else {
    mesh.scale.set(1, 1, 1);
    mesh.material.emissive.setHex(0x000000);
    mesh.material.emissiveIntensity = 0.1;
  }
};

/**
 * Create text sprite for labels
 * @param {string} text - Text to display
 * @param {object} options - Text options
 * @returns {THREE.Sprite} - Text sprite
 */
export const createTextSprite = (text, options = {}) => {
  const {
    fontSize = 16,
    fontFamily = 'Arial',
    color = '#ffffff',
    backgroundColor = 'rgba(0,0,0,0.5)',
    padding = 4
  } = options;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  // Set font and measure text
  context.font = `${fontSize}px ${fontFamily}`;
  const textWidth = context.measureText(text).width;
  const textHeight = fontSize;
  
  // Set canvas size
  canvas.width = textWidth + padding * 2;
  canvas.height = textHeight + padding * 2;
  
  // Draw background
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw text
  context.fillStyle = color;
  context.font = `${fontSize}px ${fontFamily}`;
  context.fillText(text, padding, fontSize + padding / 2);
  
  // Create texture and sprite
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  
  // Scale sprite appropriately
  const scale = 0.5;
  sprite.scale.set(canvas.width * scale * 0.01, canvas.height * scale * 0.01, 1);
  
  return sprite;
};

/**
 * Update scene lighting based on visualization mode
 * @param {THREE.Scene} scene - Three.js scene
 * @param {string} mode - Visualization mode
 */
export const updateSceneLighting = (scene, mode = 'default') => {
  // Remove existing lights
  const lights = scene.children.filter(child => child.isLight);
  lights.forEach(light => scene.remove(light));
  
  const lightConfig = SCENE_SETTINGS.LIGHTS;
  
  // Add ambient light
  const ambientLight = new THREE.AmbientLight(
    lightConfig.AMBIENT.color,
    lightConfig.AMBIENT.intensity
  );
  scene.add(ambientLight);
  
  // Add directional light
  const directionalLight = new THREE.DirectionalLight(
    lightConfig.DIRECTIONAL.color,
    lightConfig.DIRECTIONAL.intensity
  );
  directionalLight.position.set(
    lightConfig.DIRECTIONAL.position.x,
    lightConfig.DIRECTIONAL.position.y,
    lightConfig.DIRECTIONAL.position.z
  );
  scene.add(directionalLight);
  
  // Add point light for complexity mode
  if (mode === 'complexity') {
    const pointLight = new THREE.PointLight(
      lightConfig.POINT.color,
      lightConfig.POINT.intensity,
      100
    );
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);
  }
};

/**
 * Calculate optimal camera position for nodes
 * @param {Array} nodes - Array of node meshes
 * @returns {THREE.Vector3} - Optimal camera position
 */
export const calculateOptimalCameraPosition = (nodes) => {
  if (!nodes || nodes.length === 0) {
    return new THREE.Vector3(0, 0, 50);
  }
  
  // Calculate bounding box
  const box = new THREE.Box3();
  nodes.forEach(node => {
    if (node.mesh) {
      box.expandByObject(node.mesh);
    }
  });
  
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  
  // Position camera to fit all nodes
  const distance = maxDim * 2;
  return new THREE.Vector3(center.x, center.y, center.z + distance);
};

/**
 * Dispose of Three.js resources
 * @param {*} object - Three.js object to dispose
 */
export const disposeObject = (object) => {
  if (!object) return;
  
  if (object.geometry) {
    object.geometry.dispose();
  }
  
  if (object.material) {
    if (Array.isArray(object.material)) {
      object.material.forEach(material => {
        if (material.map) material.map.dispose();
        if (material.normalMap) material.normalMap.dispose();
        if (material.roughnessMap) material.roughnessMap.dispose();
        material.dispose();
      });
    } else {
      if (object.material.map) object.material.map.dispose();
      if (object.material.normalMap) object.material.normalMap.dispose();
      if (object.material.roughnessMap) object.material.roughnessMap.dispose();
      object.material.dispose();
    }
  }
  
  if (object.children) {
    object.children.forEach(child => disposeObject(child));
  }
};

// Export all functions as default
export default {
  createNodeGeometry,
  createNodeMaterial,
  createFileMesh,
  createDirectoryMesh,
  createConnectionLine,
  createCurvedConnection,
  applyForceDirectedLayout,
  applyCircularLayout,
  applyHierarchicalLayout,
  createParticleSystem,
  animateNodeHover,
  animateNodeSelection,
  createTextSprite,
  updateSceneLighting,
  calculateOptimalCameraPosition,
  disposeObject