import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Github, 
  Star, 
  Menu, 
  X, 
  Zap, 
  Users, 
  BookOpen, 
  Settings,
  Moon,
  Sun,
  Globe
} from 'lucide-react';

const Navbar = ({ onThemeToggle, isDarkMode = true }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [starCount, setStarCount] = useState(2847);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Visualizer', href: '#visualizer', icon: Brain },
    { name: 'Features', href: '#features', icon: Zap },
    { name: 'Community', href: '#community', icon: Users },
    { name: 'Docs', href: '#docs', icon: BookOpen },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-slate-900/80 backdrop-blur-md border-b border-gray-700/50' 
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Brain className="w-8 h-8 text-cyan-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                CodeViz AI
              </span>
              <span className="text-xs text-gray-400 -mt-1">v2.0 Beta</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-2 text-gray-300 hover:text-cyan-400 transition-colors duration-200 group"
                >
                  <Icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-medium">{item.name}</span>
                </a>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* GitHub Star Button */}
            <a
              href="https://github.com/yourusername/ai-code-visualizer"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center space-x-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 transition-all duration-200 hover:scale-105"
            >
              <Github className="w-4 h-4 text-white" />
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">{starCount.toLocaleString()}</span>
            </a>

            {/* Theme Toggle */}
            <button
              onClick={onThemeToggle}
              className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 transition-all duration-200 hover:scale-105"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-blue-400" />
              )}
            </button>

            {/* Settings */}
            <button className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 transition-all duration-200 hover:scale-105">
              <Settings className="w-5 h-5 text-gray-300 hover:text-cyan-400 transition-colors duration-200" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 transition-all duration-200"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-b border-gray-700/50">
            <div className="px-6 py-4 space-y-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-3 text-gray-300 hover:text-cyan-400 transition-colors duration-200 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </a>
                );
              })}
              
              {/* Mobile GitHub Link */}
              <a
                href="https://github.com/yourusername/ai-code-visualizer"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 text-gray-300 hover:text-cyan-400 transition-colors duration-200 py-2 border-t border-gray-700 pt-4"
              >
                <Github className="w-5 h-5" />
                <span className="font-medium">Star on GitHub</span>
                <div className="flex items-center space-x-1 ml-auto">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm">{starCount.toLocaleString()}</span>
                </div>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-b border-cyan-500/20">
        <div className="container mx-auto px-6 py-2">
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-medium">AI System Online</span>
            </div>
            <div className="w-px h-4 bg-gray-600"></div>
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400">12,847 repositories analyzed today</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;