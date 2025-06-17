import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { threeHelpers } from '../utils/threeHelpers';
import { colorSchemes } from '../utils/colorSchemes';

export const useThreeScene = (containerRef, data = null) => {
  const [state, setState] = useState({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    isInitialized: false,
    isAnimating: false,
    selectedObject: null,
    hoveredObject: null
  });

  const animationRef = useRef();
  const mouseRef = useRef(new THREE.Vector2());
  const raycasterRef = useRef(new THREE.Raycaster());
  const objectsRef = useRef([]);
  const lightsRef = useRef([]);

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Initialize Three.js scene
  const initializeScene = useCallback(() => {
    if (!containerRef.current || state.isInitialized) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 50, 200);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      rect.width / rect.height,
      0.1,
      1000
    );
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(rect.width, rect.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    container.appendChild(renderer.domElement);

    // Controls setup (basic orbit controls implementation)
    const controls = {
      enabled: true,
      target: new THREE.Vector3(0, 0, 0),
      minDistance: 5,
      maxDistance: 100,
      enableDamping: true,
      dampingFactor: 0.05,
      autoRotate: false,
      autoRotateSpeed: 2.0
    };

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x4444ff, 0.3, 100);
    pointLight.position.set(-20, 20, -20);
    scene.add(pointLight);

    lightsRef.current = [ambientLight, directionalLight, pointLight];

    updateState({
      scene,
      camera,
      renderer,
      controls,
      isInitialized: true
    });

  }, [containerRef, state.isInitialized, updateState]);

  // Handle window resize
  const handleResize = useCallback(() => {
    if (!containerRef.current || !state.camera || !state.renderer) return;

    const rect = containerRef.current.getBoundingClientRect();
    
    state.camera.aspect = rect.width / rect.height;
    state.camera.updateProjectionMatrix();
    
    state.renderer.setSize(rect.width, rect.height);
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }, [containerRef, state.camera, state.renderer]);

  // Mouse interaction handlers
  const handleMouseMove = useCallback((event) => {
    if (!containerRef.current || !state.camera || !state.scene) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, state.camera);
    const intersects = raycasterRef.current.intersectObjects(objectsRef.current, true);

    if (intersects.length > 0) {
      const hoveredObject = intersects[0].object;
      if (hoveredObject !== state.hoveredObject) {
        // Reset previous hover
        if (state.hoveredObject && state.hoveredObject.material) {
          threeHelpers.resetObjectMaterial(state.hoveredObject);
        }
        
        // Apply hover effect
        threeHelpers.applyHoverEffect(hoveredObject);
        updateState({ hoveredObject });
        
        containerRef.current.style.cursor = 'pointer';
      }
    } else if (state.hoveredObject) {
      threeHelpers.resetObjectMaterial(state.hoveredObject);
      updateState({ hoveredObject: null });
      containerRef.current.style.cursor = 'default';
    }
  }, [containerRef, state.camera, state.scene, state.hoveredObject, updateState]);

  const handleMouseClick = useCallback((event) => {
    if (!state.hoveredObject) return;

    const selectedObject = state.hoveredObject;
    
    // Reset previous selection
    if (state.selectedObject) {
      threeHelpers.resetObjectMaterial(state.selectedObject);
    }
    
    // Apply selection effect
    threeHelpers.applySelectionEffect(selectedObject);
    updateState({ selectedObject });
    
    // Emit selection event with object data
    if (selectedObject.userData) {
      const customEvent = new CustomEvent('objectSelected', {
        detail: selectedObject.userData
      });
      containerRef.current?.dispatchEvent(customEvent);
    }
  }, [state.hoveredObject, state.selectedObject, containerRef, updateState]);

  // Animation loop
  const animate = useCallback(() => {
    if (!state.renderer || !state.scene || !state.camera) return;

    // Auto-rotate if enabled
    if (state.controls?.autoRotate) {
      const time = Date.now() * 0.001;
      state.camera.position.x = Math.cos(time * state.controls.autoRotateSpeed) * 30;
      state.camera.position.z = Math.sin(time * state.controls.autoRotateSpeed) * 30;
      state.camera.lookAt(state.controls.target);
    }

    // Animate objects
    objectsRef.current.forEach(obj => {
      if (obj.userData.animate) {
        threeHelpers.animateObject(obj);
      }
    });

    state.renderer.render(state.scene, state.camera);
    animationRef.current = requestAnimationFrame(animate);
  }, [state.renderer, state.scene, state.camera, state.controls]);

  // Start/stop animation
  const startAnimation = useCallback(() => {
    if (state.isAnimating) return;
    updateState({ isAnimating: true });
    animate();
  }, [state.isAnimating, animate, updateState]);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    updateState({ isAnimating: false });
  }, [updateState]);

  // Visualize repository data
  const visualizeData = useCallback((repositoryData) => {
    if (!state.scene || !repositoryData) return;

    // Clear existing objects
    objectsRef.current.forEach(obj => {
      state.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    objectsRef.current = [];

    // Create visualization based on data type
    if (repositoryData.fileStructure) {
      const objects = threeHelpers.createFileStructureVisualization(
        repositoryData.fileStructure,
        colorSchemes.getFileTypeColors()
      );
      objects.forEach(obj => {
        state.scene.add(obj);
        objectsRef.current.push(obj);
      });
    }

    if (repositoryData.dependencies) {
      const dependencyObjects = threeHelpers.createDependencyVisualization(
        repositoryData.dependencies,
        colorSchemes.getDependencyColors()
      );
      dependencyObjects.forEach(obj => {
        state.scene.add(obj);
        objectsRef.current.push(obj);
      });
    }

    if (repositoryData.complexity) {
      const complexityObjects = threeHelpers.createComplexityVisualization(
        repositoryData.complexity,
        colorSchemes.getComplexityColors()
      );
      complexityObjects.forEach(obj => {
        state.scene.add(obj);
        objectsRef.current.push(obj);
      });
    }

  }, [state.scene]);

  // Camera controls
  const focusOnObject = useCallback((objectId) => {
    const object = objectsRef.current.find(obj => obj.userData?.id === objectId);
    if (!object || !state.camera) return;

    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2;
    
    state.camera.position.copy(center);
    state.camera.position.z += distance;
    state.camera.lookAt(center);
  }, [state.camera]);

  const resetCamera = useCallback(() => {
    if (!state.camera || !state.controls) return;
    
    state.camera.position.set(20, 20, 20);
    state.camera.lookAt(state.controls.target);
  }, [state.camera, state.controls]);

  // Set visualization mode
  const setVisualizationMode = useCallback((mode) => {
    objectsRef.current.forEach(obj => {
      threeHelpers.applyVisualizationMode(obj, mode);
    });
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    stopAnimation();
    
    if (state.renderer && containerRef.current) {
      containerRef.current.removeChild(state.renderer.domElement);
      state.renderer.dispose();
    }
    
    objectsRef.current.forEach(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    
    updateState({
      scene: null,
      camera: null,
      renderer: null,
      controls: null,
      isInitialized: false,
      isAnimating: false,
      selectedObject: null,
      hoveredObject: null
    });
  }, [stopAnimation, state.renderer, containerRef, updateState]);

  // Initialize scene on mount
  useEffect(() => {
    initializeScene();
    return cleanup;
  }, [initializeScene, cleanup]);

  // Handle resize
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Add mouse event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleMouseClick);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', handleMouseClick);
    };
  }, [handleMouseMove, handleMouseClick]);

  // Start animation when initialized
  useEffect(() => {
    if (state.isInitialized && !state.isAnimating) {
      startAnimation();
    }
  }, [state.isInitialized, state.isAnimating, startAnimation]);

  // Visualize data when it changes
  useEffect(() => {
    if (data && state.isInitialized) {
      visualizeData(data);
    }
  }, [data, state.isInitialized, visualizeData]);

  return {
    // State
    ...state,
    
    // Actions
    visualizeData,
    focusOnObject,
    resetCamera,
    setVisualizationMode,
    startAnimation,
    stopAnimation,
    
    // Utility
    objectCount: objectsRef.current.length,
    isReady: state.isInitialized && !state.isAnimating
  };
};