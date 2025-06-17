import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  File, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Code, 
  FileText, 
  Image, 
  Settings, 
  Database, 
  Archive,
  Globe,
  Lock,
  GitBranch,
  Package,
  Terminal,
  FileCode,
  Palette,
  Coffee
} from 'lucide-react';

const FileExplorer = ({ 
  fileTree = [], 
  onFileSelect, 
  selectedFile, 
  isLoading = false,
  maxHeight = '600px'
}) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // File type icon mapping
  const getFileIcon = (fileName, isDirectory) => {
    if (isDirectory) return null; // Handled separately

    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconProps = { className: "w-4 h-4 flex-shrink-0" };

    const iconMap = {
      // Code files
      js: <FileCode {...iconProps} className="w-4 h-4 flex-shrink-0 text-yellow-500" />,
      jsx: <FileCode {...iconProps} className="w-4 h-4 flex-shrink-0 text-blue-400" />,
      ts: <FileCode {...iconProps} className="w-4 h-4 flex-shrink-0 text-blue-600" />,
      tsx: <FileCode {...iconProps} className="w-4 h-4 flex-shrink-0 text-blue-400" />,
      py: <FileCode {...iconProps} className="w-4 h-4 flex-shrink-0 text-green-500" />,
      java: <Coffee {...iconProps} className="w-4 h-4 flex-shrink-0 text-orange-600" />,
      cpp: <FileCode {...iconProps} className="w-4 h-4 flex-shrink-0 text-blue-700" />,
      c: <FileCode {...iconProps} className="w-4 h-4 flex-shrink-0 text-blue-700" />,
      cs: <FileCode {...iconProps} className="w-4 h-4 flex-shrink-0 text-purple-600" />,
      php: <FileCode {...iconProps} className="w-4 h-4 flex-shrink-0 text-purple-500" />,
      rb: <FileCode {...iconProps} className="w-4 h-4 flex-shrink-0 text-red-600" />,
      go: <FileCode {...iconProps} className="w-4 h-4 flex-shrink-0 text-cyan-500" />,
      rs: <FileCode {...iconProps} className="w-4 h-4 flex-shrink-0 text-orange-700" />,
      
      // Web files
      html: <Globe {...iconProps} className="w-4 h-4 flex-shrink-0 text-orange-500" />,
      htm: <Globe {...iconProps} className="w-4 h-4 flex-shrink-0 text-orange-500" />,
      css: <Palette {...iconProps} className="w-4 h-4 flex-shrink-0 text-blue-500" />,
      scss: <Palette {...iconProps} className="w-4 h-4 flex-shrink-0 text-pink-500" />,
      sass: <Palette {...iconProps} className="w-4 h-4 flex-shrink-0 text-pink-500" />,
      less: <Palette {...iconProps} className="w-4 h-4 flex-shrink-0 text-blue-600" />,
      
      // Config files
      json: <Settings {...iconProps} className="w-4 h-4 flex-shrink-0 text-yellow-600" />,
      xml: <Settings {...iconProps} className="w-4 h-4 flex-shrink-0 text-orange-600" />,
      yml: <Settings {...iconProps} className="w-4 h-4 flex-shrink-0 text-red-500" />,
      yaml: <Settings {...iconProps} className="w-4 h-4 flex-shrink-0 text-red-500" />,
      toml: <Settings {...iconProps} className="w-4 h-4 flex-shrink-0 text-gray-500" />,
      ini: <Settings {...iconProps} className="w-4 h-4 flex-shrink-0 text-gray-500" />,
      conf: <Settings {...iconProps} className="w-4 h-4 flex-shrink-0 text-gray-500" />,
      env: <Settings {...iconProps} className="w-4 h-4 flex-shrink-0 text-green-600" />,
      
      // Package managers
      'package.json': <Package {...iconProps} className="w-4 h-4 flex-shrink-0 text-red-500" />,
      'package-lock.json': <Lock {...iconProps} className="w-4 h-4 flex-shrink-0 text-red-600" />,
      'yarn.lock': <Lock {...iconProps} className="w-4 h-4 flex-shrink-0 text-blue-600" />,
      'composer.json': <Package {...iconProps} className="w-4 h-4 flex-shrink-0 text-orange-500" />,
      'requirements.txt': <Package {...iconProps} className="w-4 h-4 flex-shrink-0 text-green-500" />,
      'Cargo.toml': <Package {...iconProps} className="w-4 h-4 flex-shrink-0 text-orange-700" />,
      'go.mod': <Package {...iconProps} className="w-4 h-4 flex-shrink-0 text-cyan-500" />,
      
      // Documentation
      md: <FileText {...iconProps} className="w-4 h-4 flex-shrink-0 text-blue-300" />,
      txt: <FileText {...iconProps} className="w-4 h-4 flex-shrink-0 text-gray-400" />,
      rtf: <FileText {...iconProps} className="w-4 h-4 flex-shrink-0 text-blue-400" />,
      pdf: <FileText {...iconProps} className="w-4 h-4 flex-shrink-0 text-red-500" />,
      
      // Images
      png: <Image {...iconProps} className="w-4 h-4 flex-shrink-0 text-green-500" />,
      jpg: <Image {...iconProps} className="w-4 h-4 flex-shrink-0 text-green-500" />,
      jpeg: <Image {...iconProps} className="w-4 h-4 flex-shrink-0 text-green-500" />,
      gif: <Image {...iconProps} className="w-4 h-4 flex-shrink-0 text-purple-500" />,
      svg: <Image {...iconProps} className="w-4 h-4 flex-shrink-0 text-orange-500" />,
      webp: <Image {...iconProps} className="w-4 h-4 flex-shrink-0 text-blue-500" />,
      ico: <Image {...iconProps} className="w-4 h-4 flex-shrink-0 text-yellow-500" />,
      
      // Database
      sql: <Database {...iconProps} className="w-4 h-4 flex-shrink-0 text-blue-600" />,
      db: <Database {...iconProps} className="w-4 h-4 flex-shrink-0 text-green-600" />,
      sqlite: <Database {...iconProps} className="w-4 h-4 flex-shrink-0 text-blue-500" />,
      
      // Archives
      zip: <Archive {...iconProps} className="w-4 h-4 flex-shrink-0 text-yellow-600" />,
      rar: <Archive {...iconProps} className="w-4 h-4 flex-shrink-0 text-red-600" />,
      '7z': <Archive {...iconProps} className="w-4 h-4 flex-shrink-0 text-orange-600" />,
      tar: <Archive {...iconProps} className="w-4 h-4 flex-shrink-0 text-brown-600" />,
      gz: <Archive {...iconProps} className="w-4 h-4 flex-shrink-0 text-gray-600" />,
      
      // Shell/Scripts
      sh: <Terminal {...iconProps} className="w-4 h-4 flex-shrink-0 text-green-400" />,
      bash: <Terminal {...iconProps} className="w-4 h-4 flex-shrink-0 text-green-400" />,
      zsh: <Terminal {...iconProps} className="w-4 h-4 flex-shrink-0 text-blue-400" />,
      ps1: <Terminal {...iconProps} className="w-4 h-4 flex-shrink-0 text-blue-500" />,
      bat: <Terminal {...iconProps} className="w-4 h-4 flex-shrink-0 text-gray-500" />,
      cmd: <Terminal {...iconProps} className="w-4 h-4 flex-shrink-0 text-gray-500" />
    };

    // Check for exact filename matches first
    if (iconMap[fileName]) return iconMap[fileName];
    
    // Then check extension
    return iconMap[extension] || <File {...iconProps} className="w-4 h-4 flex-shrink-0 text-gray-400" />;
  };

  // Toggle folder expansion
  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  // Filter files based on search query
  const filterTree = (nodes, query) => {
    if (!query) return nodes;
    
    return nodes.reduce((acc, node) => {
      if (node.type === 'directory') {
        const filteredChildren = filterTree(node.children || [], query);
        if (filteredChildren.length > 0 || node.name.toLowerCase().includes(query.toLowerCase())) {
          acc.push({
            ...node,
            children: filteredChildren
          });
        }
      } else if (node.name.toLowerCase().includes(query.toLowerCase())) {
        acc.push(node);
      }
      return acc;
    }, []);
  };

  const filteredTree = useMemo(() => filterTree(fileTree, searchQuery), [fileTree, searchQuery]);

  // Render tree node
  const renderNode = (node, level = 0, parentPath = '') => {
    const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
    const isExpanded = expandedFolders.has(currentPath);
    const isSelected = selectedFile === currentPath;
    const isDirectory = node.type === 'directory';

    return (
      <div key={currentPath} className="select-none">
        <div
          className={`flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer rounded transition-colors ${
            isSelected ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => {
            if (isDirectory) {
              toggleFolder(currentPath);
            } else {
              onFileSelect?.(currentPath, node);
            }
          }}
        >
          {isDirectory && (
            <div className="mr-1">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </div>
          )}
          
          <div className="mr-2">
            {isDirectory ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-400" />
              ) : (
                <Folder className="w-4 h-4 text-blue-500" />
              )
            ) : (
              getFileIcon(node.name, false)
            )}
          </div>
          
          <span className="text-sm truncate flex-1" title={node.name}>
            {node.name}
          </span>
          
          {node.size && !isDirectory && (
            <span className="text-xs text-gray-500 ml-2">
              {formatFileSize(node.size)}
            </span>
          )}
        </div>
        
        {isDirectory && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, level + 1, currentPath))}
          </div>
        )}
      </div>
    );
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded flex-1"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Folder className="w-5 h-5 mr-2 text-blue-400" />
            File Explorer
          </h3>
          <span className="text-sm text-gray-400">
            {fileTree.length} items
          </span>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* File Tree */}
      <div 
        className="p-2 overflow-y-auto"
        style={{ maxHeight }}
      >
        {filteredTree.length > 0 ? (
          <div className="space-y-0.5">
            {filteredTree.map(node => renderNode(node))}
          </div>
        ) : searchQuery ? (
          <div className="text-center py-8 text-gray-500">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No files found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No files to display</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {searchQuery && (
        <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-400">
          Showing {filteredTree.length} result{filteredTree.length !== 1 ? 's' : ''} for "{searchQuery}"
        </div>
      )}
    </div>
  );
};

export default FileExplorer;