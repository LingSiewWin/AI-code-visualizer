import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move3D, 
  Eye, 
  EyeOff,
  Maximize,
  Settings,
  Camera
} from 'lucide-react';

const ThreeScene = ({ 
  repositoryData, 
  onNodeSelect, 
  selectedNode, 
  isPlaying = true,
  showConnections = true,
  animationSpeed = 1.0
}) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const nodesRef = useRef([]);
  const connectionsRef = useRef([]);
  const animationRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const raycasterRef = useRef(new THREE.Raycaster());
  
  const [isAnimating, setIsAnimating] = useState(isPlaying);
  const [showWireframe, setShowWireframe] = useState(false);
  const [cameraMode, setCameraMode] = useState('orbit'); // orbit, follow, free
  const [showStats, setShowStats] = useState(false);
  const [sceneStats, setSceneStats] = useState({ nodes: 0, connections: 0, fps: 60 });

  // Color schemes for different file types
  const colorSchemes = {
    core: { color: 0xff6b6b, emissive: 0x441111 },
    ai: { color: 0x4ecdc4, emissive: 0x114444 },
    data: { color: 0x45b7d1, emissive: 0x112244 },
    api: { color: 0x96ceb4, emissive: 0x223322 },
    test: { color: 0xfeca57, emissive: 0x443311 },
    docs: { color: 0xdda0dd, emissive: 0x332233 },
    config: { color: 0xff9ff3, emissive: 0x441144 },
    default: { color: 0xffffff, emissive: 0x222222 }
  };

  // Initialize Three.js scene
  const initScene = useCallback(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    scene.fog = new THREE.Fog(0x0a0a0f, 10, 50);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75, 
      mountRef.current.clientWidth / mountRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.set(12, 8, 12);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // Clear existing renderer
    if (mountRef.current.children.length > 0) {
      mountRef.current.removeChild(mountRef.current.children[0]);
    }
    mountRef.current.appendChild(renderer.domElement);

    // Advanced lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(15, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    // Rim light for dramatic effect
    const rimLight = new THREE.DirectionalLight(0x4ecdc4, 0.3);
    rimLight.position.set(-10, 5, -10);
    scene.add(rimLight);

    // Point lights for dynamic lighting
    const pointLight1 = new THREE.PointLight(0xff6b6b, 0.5, 20);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x4ecdc4, 0.5, 20);
    pointLight2.position.set(-5, 5, -5);
    scene.add(pointLight2);

    // Store references
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    return { scene, camera, renderer };
  }, []);

  // Create node geometry with advanced materials
  const createNode = useCallback((file, position, index) => {
    const complexity = Math.max(file.complexity || 50, 20);
    const size = 0.2 + (complexity * 0.008);
    
    // Create geometry based on file type
    let geometry;
    switch (file.type) {
      case 'core':
        geometry = new THREE.OctahedronGeometry(size, 2);
        break;
      case 'ai':
        geometry = new THREE.IcosahedronGeometry(size, 1);
        break;
      case 'data':
        geometry = new THREE.BoxGeometry(size * 1.5, size * 1.5, size * 1.5);
        break;
      case 'api':
        geometry = new THREE.CylinderGeometry(size, size, size * 2, 8);
        break;
      case 'test':
        geometry = new THREE.TetrahedronGeometry(size * 1.2, 0);
        break;
      default:
        geometry = new THREE.SphereGeometry(size, 16, 16);
    }

    const colors = colorSchemes[file.type] || colorSchemes.default;
    
    // Advanced material with multiple techniques
    const material = new THREE.MeshPhysicalMaterial({
      color: colors.color,
      emissive: colors.emissive,
      emissiveIntensity: 0.2,
      metalness: 0.3,
      roughness: 0.4,
      transmission: 0.1,
      thickness: 0.5,
      clearcoat: 0.3,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.9
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Store metadata
    mesh.userData = { 
      file, 
      index, 
      originalPosition: position.clone(),
      originalScale: mesh.scale.clone(),
      pulsePhase: Math.random() * Math.PI * 2,
      rotationSpeed: 0.01 + Math.random() * 0.02
    };

    return mesh;
  }, []);

  // Create connections between nodes
  const createConnections = useCallback((nodes, files) => {
    const connections = [];
    
    files.forEach((file, index) => {
      if (file.connections && file.connections > 0) {
        const sourceNode = nodes[index];
        const connectionCount = Math.min(file.connections, 5);
        
        for (let i = 0; i < connectionCount; i++) {
          const targetIndex = (index + i + 1) % files.length;
          const targetNode = nodes[targetIndex];
          
          if (targetNode && sourceNode) {
            // Create curved connection
            const curve = new THREE.CatmullRomCurve3([
              sourceNode.position.clone(),
              new THREE.Vector3(
                (sourceNode.position.x + targetNode.position.x) / 2,
                (sourceNode.position.y + targetNode.position.y) / 2 + 1,
                (sourceNode.position.z + targetNode.position.z) / 2
              ),
              targetNode.position.clone()
            ]);
            
            const points = curve.getPoints(50);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            
            // Animated line material
            const material = new THREE.ShaderMaterial({
              uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(0x4ecdc4) },
                opacity: { value: 0.6 }
              },
              vertexShader: `
                attribute float position;
                uniform float time;
                varying float vAlpha;
                
                void main() {
                  vAlpha = sin(position * 10.0 + time) * 0.5 + 0.5;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              `,
              fragmentShader: `
                uniform vec3 color;
                uniform float opacity;
                varying float vAlpha;
                
                void main() {
                  gl_FragColor = vec4(color, opacity * vAlpha);
                }
              `,
              transparent: true,
              blending: THREE.AdditiveBlending
            });
            
            const line = new THREE.Line(geometry, material);
            line.userData = { sourceIndex: index, targetIndex, material };
            connections.push(line);
          }
        }
      }
    });
    
    return connections;
  }, []);

  // Generate node positions using force-directed layout
  const generateNodePositions = useCallback((files) => {
    const positions = [];
    const nodeCount = files.length;
    
    if (nodeCount <= 1) {
      positions.push(new THREE.Vector3(0, 0, 0));
      return positions;
    }

    // Create initial positions in a sphere
    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / nodeCount);
      const theta = Math.sqrt(nodeCount * Math.PI) * phi;
      
      const radius = 5 + Math.random() * 2;
      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * (Math.random() - 0.5) * 2;
      const z = radius * Math.sin(theta) * Math.sin(phi);
      
      positions.push(new THREE.Vector3(x, y, z));
    }

    // Apply force-directed positioning for better layout
    for (let iteration = 0; iteration < 50; iteration++) {
      const forces = positions.map(() => new THREE.Vector3(0, 0, 0));
      
      // Repulsion forces
      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          const distance = positions[i].distanceTo(positions[j]);
          if (distance > 0) {
            const force = Math.min(2.0 / (distance * distance), 0.1);
            const direction = new THREE.Vector3()
              .subVectors(positions[i], positions[j])
              .normalize()
              .multiplyScalar(force);
            
            forces[i].add(direction);
            forces[j].sub(direction);
          }
        }
      }
      
      // Apply forces
      for (let i = 0; i < nodeCount; i++) {
        positions[i].add(forces[i]);
      }
    }
    
    return positions;
  }, []);

  // Build the complete 3D scene
  const buildScene = useCallback(() => {
    if (!sceneRef.current || !repositoryData?.files) return;

    const scene = sceneRef.current;
    
    // Clear existing nodes and connections
    nodesRef.current.forEach(node => scene.remove(node));
    connectionsRef.current.forEach(connection => scene.remove(connection));
    nodesRef.current = [];
    connectionsRef.current = [];

    const files = repositoryData.files;
    const positions = generateNodePositions(files);
    
    // Create nodes
    files.forEach((file, index) => {
      const position = positions[index] || new THREE.Vector3(0, 0, 0);
      const node = createNode(file, position, index);
      scene.add(node);
      nodesRef.current.push(node);
    });

    // Create connections
    if (showConnections) {
      const connections = createConnections(nodesRef.current, files);
      connections.forEach(connection => {
        scene.add(connection);
        connectionsRef.current.push(connection);
      });
    }

    // Update stats
    setSceneStats({
      nodes: nodesRef.current.length,
      connections: connectionsRef.current.length,
      fps: 60
    });
  }, [repositoryData, showConnections, createNode, createConnections, generateNodePositions]);

  // Animation loop with advanced effects
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    const time = Date.now() * 0.001;
    
    // Animate nodes
    nodesRef.current.forEach((node, index) => {
      if (isAnimating) {
        // Rotation animation
        node.rotation.y += node.userData.rotationSpeed * animationSpeed;
        node.rotation.x += node.userData.rotationSpeed * 0.5 * animationSpeed;
        
        // Floating animation
        const floatOffset = Math.sin(time + node.userData.pulsePhase) * 0.1;
        node.position.y = node.userData.originalPosition.y + floatOffset;
        
        // Pulsing scale animation
        const pulseScale = 1 + Math.sin(time * 2 + node.userData.pulsePhase) * 0.1;
        node.scale.setScalar(pulseScale);
        
        // Highlight selected node
        if (selectedNode && selectedNode.index === index) {
          const highlightScale = 1.3 + Math.sin(time * 4) * 0.2;
          node.scale.setScalar(highlightScale);
          node.material.emissiveIntensity = 0.5 + Math.sin(time * 6) * 0.3;
        } else {
          node.material.emissiveIntensity = 0.2;
        }
      }
    });

    // Animate connections
    connectionsRef.current.forEach(connection => {
      if (connection.userData.material && connection.userData.material.uniforms) {
        connection.userData.material.uniforms.time.value = time;
      }
    });

    // Camera animations based on mode
    if (cameraMode === 'orbit' && isAnimating) {
      const radius = 15;
      cameraRef.current.position.x = Math.cos(time * 0.1) * radius;
      cameraRef.current.position.z = Math.sin(time * 0.1) * radius;
      cameraRef.current.lookAt(0, 0, 0);
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    animationRef.current = requestAnimationFrame(animate);
  }, [isAnimating, selectedNode, cameraMode, animationSpeed]);

  // Handle mouse interactions
  const handleMouseMove = useCallback((event) => {
    if (!mountRef.current) return;
    
    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }, []);

  const handleClick = useCallback((event) => {
    if (!cameraRef.current || !sceneRef.current) return;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(nodesRef.current);
    
    if (intersects.length > 0) {
      const clickedNode = intersects[0].object;
      onNodeSelect?.(clickedNode.userData);
      
      // Visual feedback
      clickedNode.material.emissiveIntensity = 1.0;
      setTimeout(() => {
        if (clickedNode.material) {
          clickedNode.material.emissiveIntensity = 0.2;
        }
      }, 300);
    }
  }, [onNodeSelect]);

  // Control functions
  const toggleAnimation = () => setIsAnimating(!isAnimating);
  const resetCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(12, 8, 12);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  const zoomIn = () => {
    if (cameraRef.current) {
      cameraRef.current.position.multiplyScalar(0.9);
    }
  };

  const zoomOut = () => {
    if (cameraRef.current) {
      cameraRef.current.position.multiplyScalar(1.1);
    }
  };

  // Initialize scene
  useEffect(() => {
    initScene();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initScene]);

  // Build scene when data changes
  useEffect(() => {
    buildScene();
  }, [buildScene]);

  // Start animation loop
  useEffect(() => {
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden border border-gray-700">
      {/* 3D Canvas */}
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-pointer"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />
      
      {/* Control Panel */}
      <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm rounded-lg border border-gray-700/50 p-2">
        <div className="flex flex-col space-y-2">
          <button
            onClick={toggleAnimation}
            className="p-2 rounded hover:bg-gray-700/50 transition-colors duration-200"
            title={isAnimating ? 'Pause Animation' : 'Play Animation'}
          >
            {isAnimating ? (
              <Pause className="w-5 h-5 text-cyan-400" />
            ) : (
              <Play className="w-5 h-5 text-cyan-400" />
            )}
          </button>
          
          <button
            onClick={resetCamera}
            className="p-2 rounded hover:bg-gray-700/50 transition-colors duration-200"
            title="Reset Camera"
          >
            <RotateCcw className="w-5 h-5 text-gray-300" />
          </button>
          
          <button
            onClick={zoomIn}
            className="p-2 rounded hover:bg-gray-700/50 transition-colors duration-200"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5 text-gray-300" />
          </button>
          
          <button
            onClick={zoomOut}
            className="p-2 rounded hover:bg-gray-700/50 transition-colors duration-200"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5 text-gray-300" />
          </button>
          
          <button
            onClick={() => setShowWireframe(!showWireframe)}
            className="p-2 rounded hover:bg-gray-700/50 transition-colors duration-200"
            title="Toggle Wireframe"
          >
            {showWireframe ? (
              <EyeOff className="w-5 h-5 text-gray-300" />
            ) : (
              <Eye className="w-5 h-5 text-gray-300" />
            )}
          </button>
        </div>
      </div>
      
      {/* Stats Panel */}
      {showStats && (
        <div className="absolute bottom-4 left-4 bg-black/20 backdrop-blur-sm rounded-lg border border-gray-700/50 p-3">
          <div className="text-sm text-gray-300 space-y-1">
            <div>Nodes: {sceneStats.nodes}</div>
            <div>Connections: {sceneStats.connections}</div>
            <div>Mode: {cameraMode}</div>
          </div>
        </div>
      )}
      
      {/* Loading Overlay */}
      {!repositoryData && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center text-gray-400">
            <Move3D className="w-16 h-16 mx-auto mb-4 animate-spin" />
            <p>Initializing 3D Scene...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeScene;