import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Search, Github, Zap, Brain, Code, GitBranch, Star, Eye } from 'lucide-react';

const AICodeVisualizer = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  // Mock data for demonstration
  const mockRepoData = {
    name: "neural-vision-ai",
    description: "Advanced AI-powered computer vision framework",
    stars: 12847,
    forks: 2341,
    language: "Python",
    files: [
      { name: "src/neural_core.py", complexity: 85, connections: 12, type: "core" },
      { name: "src/vision_models.py", complexity: 92, connections: 8, type: "ai" },
      { name: "src/data_processing.py", complexity: 67, connections: 15, type: "data" },
      { name: "src/api_server.py", complexity: 45, connections: 6, type: "api" },
      { name: "tests/test_neural.py", complexity: 34, connections: 4, type: "test" },
      { name: "docs/architecture.md", complexity: 12, connections: 2, type: "docs" },
      { name: "config/model_config.yaml", complexity: 8, connections: 7, type: "config" }
    ],
    aiInsights: [
      "High complexity in neural core - consider refactoring",
      "Excellent test coverage in vision models",
      "API layer could benefit from caching",
      "Strong architectural patterns detected"
    ]
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    
    const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(800, 600);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    if (mountRef.current.children.length === 0) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create nodes representing files
    const nodes = [];
    const connections = [];
    
    if (analysisResults) {
      analysisResults.files.forEach((file, index) => {
        const geometry = new THREE.SphereGeometry(0.3 + file.complexity * 0.01, 32, 32);
        
        let color;
        switch (file.type) {
          case 'core': color = 0xff6b6b; break;
          case 'ai': color = 0x4ecdc4; break;
          case 'data': color = 0x45b7d1; break;
          case 'api': color = 0x96ceb4; break;
          case 'test': color = 0xfeca57; break;
          case 'docs': color = 0xdda0dd; break;
          case 'config': color = 0xff9ff3; break;
          default: color = 0xffffff;
        }
        
        const material = new THREE.MeshLambertMaterial({ 
          color,
          emissive: color,
          emissiveIntensity: 0.1
        });
        
        const sphere = new THREE.Mesh(geometry, material);
        
        // Position nodes in a 3D space
        const angle = (index / analysisResults.files.length) * Math.PI * 2;
        const radius = 3;
        sphere.position.x = Math.cos(angle) * radius;
        sphere.position.y = (Math.random() - 0.5) * 2;
        sphere.position.z = Math.sin(angle) * radius;
        
        sphere.userData = { file, index };
        scene.add(sphere);
        nodes.push(sphere);
        
        // Create connections
        if (file.connections > 0) {
          for (let i = 0; i < Math.min(file.connections, 3); i++) {
            const targetIndex = (index + i + 1) % analysisResults.files.length;
            const targetNode = nodes[targetIndex];
            
            if (targetNode) {
              const points = [sphere.position, targetNode.position];
              const geometry = new THREE.BufferGeometry().setFromPoints(points);
              const material = new THREE.LineBasicMaterial({ 
                color: 0x444444,
                opacity: 0.6,
                transparent: true
              });
              const line = new THREE.Line(geometry, material);
              scene.add(line);
              connections.push(line);
            }
          }
        }
      });
    }

    // Animation loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      // Rotate the entire scene
      if (nodes.length > 0) {
        nodes.forEach((node, index) => {
          node.rotation.y += 0.01;
          node.position.y += Math.sin(Date.now() * 0.001 + index) * 0.001;
        });
      }
      
      renderer.render(scene, camera);
    };

    camera.position.z = 8;
    camera.position.y = 2;
    camera.lookAt(0, 0, 0);
    
    sceneRef.current = { scene, camera, renderer, nodes, connections };
    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [analysisResults]);

  const analyzeRepository = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setAnalysisResults(mockRepoData);
    setIsAnalyzing(false);
  };

  const getTypeColor = (type) => {
    const colors = {
      core: 'bg-red-500',
      ai: 'bg-teal-500',
      data: 'bg-blue-500',
      api: 'bg-green-500',
      test: 'bg-yellow-500',
      docs: 'bg-purple-500',
      config: 'bg-pink-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Brain className="w-12 h-12 text-cyan-400 mr-4" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              AI Code Visualizer
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Harness the power of AI to understand, visualize, and optimize your codebase in stunning 3D
          </p>
        </div>

        {/* Input Section */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1">
                <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Enter GitHub repository URL..."
                  className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                />
              </div>
              <button
                onClick={analyzeRepository}
                disabled={isAnalyzing}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Zap className="w-5 h-5" />
                <span>{isAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 3D Visualization */}
          <div className="lg:col-span-2">
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center">
                  <Code className="w-6 h-6 mr-2 text-cyan-400" />
                  3D Code Structure
                </h2>
                {isAnalyzing && (
                  <div className="flex items-center space-x-2 text-cyan-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                    <span className="text-sm">AI Processing...</span>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <div 
                  ref={mountRef} 
                  className="w-full h-96 bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden border border-gray-700"
                />
                
                {!analysisResults && !isAnalyzing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                    <div className="text-center">
                      <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">Enter a repository URL to begin analysis</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="space-y-6">
            {/* Repository Info */}
            {analysisResults && (
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <h3 className="text-xl font-bold mb-4 text-cyan-400">Repository Info</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-white">{analysisResults.name}</h4>
                    <p className="text-gray-300 text-sm">{analysisResults.description}</p>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-400" />
                      <span>{analysisResults.stars.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center">
                      <GitBranch className="w-4 h-4 mr-1 text-green-400" />
                      <span>{analysisResults.forks.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* File Legend */}
            {analysisResults && (
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <h3 className="text-xl font-bold mb-4 text-purple-400">File Types</h3>
                <div className="space-y-2">
                  {['core', 'ai', 'data', 'api', 'test', 'docs', 'config'].map(type => (
                    <div key={type} className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getTypeColor(type)}`}></div>
                      <span className="text-sm capitalize text-gray-300">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Insights */}
            {analysisResults && (
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <h3 className="text-xl font-bold mb-4 text-green-400">AI Insights</h3>
                <div className="space-y-3">
                  {analysisResults.aiInsights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Eye className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                      <p className="text-sm text-gray-300">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICodeVisualizer;