/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

// Import components
import AICodeVisualizer from '../src/components/AICodeVisualizer';
import Navbar from '../src/components/Navbar';
import RepositoryInput from '../src/components/RepositoryInput';
import AnalysisPanel from '../src/components/AnalysisPanel';
import InsightsPanel from '../src/components/InsightsPanel';
import FileExplorer from '../src/components/FileExplorer';
import CodeMetrics from '../src/components/CodeMetrics';
import LoadingSpinner from '../src/components/LoadingSpinner';

// Mock Three.js
jest.mock('three', () => ({
  Scene: jest.fn(() => ({
    add: jest.fn(),
    remove: jest.fn(),
  })),
  WebGLRenderer: jest.fn(() => ({
    setSize: jest.fn(),
    render: jest.fn(),
    domElement: document.createElement('canvas'),
    dispose: jest.fn(),
  })),
  PerspectiveCamera: jest.fn(),
  BoxGeometry: jest.fn(),
  SphereGeometry: jest.fn(),
  MeshBasicMaterial: jest.fn(),
  Mesh: jest.fn(() => ({
    position: { set: jest.fn() },
    scale: { set: jest.fn() },
  })),
  Color: jest.fn(),
  Vector3: jest.fn(),
  OrbitControls: jest.fn(),
}));

// Mock hooks
jest.mock('../src/hooks/useRepositoryAnalysis', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    analysisData: null,
    isLoading: false,
    error: null,
    analyzeRepository: jest.fn(),
  })),
}));

jest.mock('../src/hooks/useThreeScene', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    sceneRef: { current: null },
    initializeScene: jest.fn(),
    updateVisualization: jest.fn(),
    cleanup: jest.fn(),
  })),
}));

jest.mock('../src/hooks/useGitHubAPI', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    repoData: null,
    isLoading: false,
    error: null,
    fetchRepository: jest.fn(),
  })),
}));

jest.mock('../src/hooks/useAIInsights', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    insights: null,
    isLoading: false,
    error: null,
    generateInsights: jest.fn(),
  })),
}));

// Mock services
jest.mock('../src/services/githubAPI', () => ({
  fetchRepositoryStructure: jest.fn(),
  fetchFileContent: jest.fn(),
  validateRepository: jest.fn(),
}));

describe('LoadingSpinner Component', () => {
  test('renders loading spinner with default message', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('renders loading spinner with custom message', () => {
    const customMessage = 'Analyzing repository...';
    render(<LoadingSpinner message={customMessage} />);
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  test('applies custom size class', () => {
    render(<LoadingSpinner size="large" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('loading-spinner-large');
  });
});

describe('Navbar Component', () => {
  const mockProps = {
    onThemeToggle: jest.fn(),
    isDarkMode: false,
    onSettingsClick: jest.fn(),
    onHelpClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders navbar with brand name', () => {
    render(<Navbar {...mockProps} />);
    expect(screen.getByText('AI Code Visualizer')).toBeInTheDocument();
  });

  test('calls theme toggle function when theme button is clicked', async () => {
    const user = userEvent.setup();
    render(<Navbar {...mockProps} />);
    
    const themeButton = screen.getByRole('button', { name: /theme/i });
    await user.click(themeButton);
    
    expect(mockProps.onThemeToggle).toHaveBeenCalledTimes(1);
  });

  test('displays correct theme icon based on dark mode state', () => {
    const { rerender } = render(<Navbar {...mockProps} />);
    expect(screen.getByLabelText(/light mode/i)).toBeInTheDocument();

    rerender(<Navbar {...mockProps} isDarkMode={true} />);
    expect(screen.getByLabelText(/dark mode/i)).toBeInTheDocument();
  });

  test('calls settings function when settings button is clicked', async () => {
    const user = userEvent.setup();
    render(<Navbar {...mockProps} />);
    
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsButton);
    
    expect(mockProps.onSettingsClick).toHaveBeenCalledTimes(1);
  });
});

describe('RepositoryInput Component', () => {
  const mockProps = {
    onSubmit: jest.fn(),
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders input field and submit button', () => {
    render(<RepositoryInput {...mockProps} />);
    
    expect(screen.getByPlaceholderText(/repository url/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyze/i })).toBeInTheDocument();
  });

  test('calls onSubmit with repository URL when form is submitted', async () => {
    const user = userEvent.setup();
    const testUrl = 'https://github.com/user/repo';
    
    render(<RepositoryInput {...mockProps} />);
    
    const input = screen.getByPlaceholderText(/repository url/i);
    const submitButton = screen.getByRole('button', { name: /analyze/i });
    
    await user.type(input, testUrl);
    await user.click(submitButton);
    
    expect(mockProps.onSubmit).toHaveBeenCalledWith(testUrl);
  });

  test('prevents submission with empty input', async () => {
    const user = userEvent.setup();
    render(<RepositoryInput {...mockProps} />);
    
    const submitButton = screen.getByRole('button', { name: /analyze/i });
    await user.click(submitButton);
    
    expect(mockProps.onSubmit).not.toHaveBeenCalled();
  });

  test('disables submit button when loading', () => {
    render(<RepositoryInput {...mockProps} isLoading={true} />);
    
    const submitButton = screen.getByRole('button', { name: /analyzing/i });
    expect(submitButton).toBeDisabled();
  });

  test('displays error message when error prop is provided', () => {
    const errorMessage = 'Repository not found';
    render(<RepositoryInput {...mockProps} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

describe('CodeMetrics Component', () => {
  const mockMetrics = {
    totalFiles: 150,
    linesOfCode: 12500,
    complexity: 75,
    dependencies: 25,
    testCoverage: 85,
    maintainabilityIndex: 70,
    technicalDebt: 15,
    codeSmells: 5,
  };

  test('renders all metric cards', () => {
    render(<CodeMetrics metrics={mockMetrics} />);
    
    expect(screen.getByText('Total Files')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Lines of Code')).toBeInTheDocument();
    expect(screen.getByText('12,500')).toBeInTheDocument();
    expect(screen.getByText('Complexity')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  test('renders loading state when metrics are null', () => {
    render(<CodeMetrics metrics={null} />);
    expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
  });

  test('applies correct color coding based on metric values', () => {
    render(<CodeMetrics metrics={mockMetrics} />);
    
    const complexityCard = screen.getByText('75').closest('.metric-card');
    expect(complexityCard).toHaveClass('metric-warning');
    
    const testCoverageCard = screen.getByText('85%').closest('.metric-card');
    expect(testCoverageCard).toHaveClass('metric-good');
  });

  test('formats large numbers correctly', () => {
    const largeMetrics = {
      ...mockMetrics,
      linesOfCode: 1234567,
    };
    
    render(<CodeMetrics metrics={largeMetrics} />);
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });
});

describe('FileExplorer Component', () => {
  const mockFileStructure = {
    name: 'root',
    type: 'directory',
    children: [
      {
        name: 'src',
        type: 'directory',
        children: [
          { name: 'App.js', type: 'file', size: 1024 },
          { name: 'index.js', type: 'file', size: 512 },
        ],
      },
      { name: 'README.md', type: 'file', size: 2048 },
    ],
  };

  const mockProps = {
    fileStructure: mockFileStructure,
    onFileSelect: jest.fn(),
    selectedFile: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders file tree structure', () => {
    render(<FileExplorer {...mockProps} />);
    
    expect(screen.getByText('src')).toBeInTheDocument();
    expect(screen.getByText('README.md')).toBeInTheDocument();
  });

  test('expands and collapses directories', async () => {
    const user = userEvent.setup();
    render(<FileExplorer {...mockProps} />);
    
    const srcFolder = screen.getByText('src');
    await user.click(srcFolder);
    
    expect(screen.getByText('App.js')).toBeInTheDocument();
    expect(screen.getByText('index.js')).toBeInTheDocument();
  });

  test('calls onFileSelect when file is clicked', async () => {
    const user = userEvent.setup();
    render(<FileExplorer {...mockProps} />);
    
    const readmeFile = screen.getByText('README.md');
    await user.click(readmeFile);
    
    expect(mockProps.onFileSelect).toHaveBeenCalledWith({
      name: 'README.md',
      type: 'file',
      size: 2048,
    });
  });

  test('highlights selected file', () => {
    const selectedFile = { name: 'README.md', type: 'file', size: 2048 };
    render(<FileExplorer {...mockProps} selectedFile={selectedFile} />);
    
    const readmeFile = screen.getByText('README.md');
    expect(readmeFile.closest('.file-item')).toHaveClass('selected');
  });

  test('displays loading state when file structure is null', () => {
    render(<FileExplorer {...mockProps} fileStructure={null} />);
    expect(screen.getByText('Loading file structure...')).toBeInTheDocument();
  });
});

describe('AnalysisPanel Component', () => {
  const mockAnalysisData = {
    summary: {
      totalFiles: 150,
      mainLanguage: 'JavaScript',
      frameworks: ['React', 'Node.js'],
      complexity: 'Medium',
    },
    files: [
      {
        name: 'App.js',
        complexity: 15,
        linesOfCode: 200,
        maintainabilityIndex: 75,
      },
      {
        name: 'server.js',
        complexity: 25,
        linesOfCode: 350,
        maintainabilityIndex: 60,
      },
    ],
    dependencies: {
      direct: 15,
      dev: 10,
      total: 25,
    },
  };

  const mockProps = {
    analysisData: mockAnalysisData,
    isLoading: false,
    onRefresh: jest.fn(),
  };

  test('renders analysis summary', () => {
    render(<AnalysisPanel {...mockProps} />);
    
    expect(screen.getByText('Analysis Summary')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  test('renders file analysis list', () => {
    render(<AnalysisPanel {...mockProps} />);
    
    expect(screen.getByText('App.js')).toBeInTheDocument();
    expect(screen.getByText('server.js')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('350')).toBeInTheDocument();
  });

  test('renders dependency information', () => {
    render(<AnalysisPanel {...mockProps} />);
    
    expect(screen.getByText('Dependencies')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument(); // direct
    expect(screen.getByText('10')).toBeInTheDocument(); // dev
    expect(screen.getByText('25')).toBeInTheDocument(); // total
  });

  test('shows loading state', () => {
    render(<AnalysisPanel {...mockProps} isLoading={true} analysisData={null} />);
    expect(screen.getByText('Analyzing repository...')).toBeInTheDocument();
  });

  test('calls onRefresh when refresh button is clicked', async () => {
    const user = userEvent.setup();
    render(<AnalysisPanel {...mockProps} />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);
    
    expect(mockProps.onRefresh).toHaveBeenCalledTimes(1);
  });
});

describe('InsightsPanel Component', () => {
  const mockInsights = {
    codeQuality: {
      score: 8.5,
      issues: [
        'High complexity in authentication module',
        'Duplicate code detected in utility functions',
      ],
      suggestions: [
        'Consider refactoring authentication logic',
        'Extract common utility functions',
      ],
    },
    security: {
      score: 7.2,
      vulnerabilities: [
        'Potential XSS vulnerability in user input handling',
      ],
      recommendations: [
        'Implement input sanitization',
        'Add CSRF protection',
      ],
    },
    performance: {
      score: 9.1,
      bottlenecks: [],
      optimizations: [
        'Consider lazy loading for large components',
      ],
    },
  };

  const mockProps = {
    insights: mockInsights,
    isLoading: false,
    onRegenerateInsights: jest.fn(),
  };

  test('renders insights sections', () => {
    render(<InsightsPanel {...mockProps} />);
    
    expect(screen.getByText('Code Quality')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
  });

  test('displays scores correctly', () => {
    render(<InsightsPanel {...mockProps} />);
    
    expect(screen.getByText('8.5/10')).toBeInTheDocument();
    expect(screen.getByText('7.2/10')).toBeInTheDocument();
    expect(screen.getByText('9.1/10')).toBeInTheDocument();
  });

  test('renders issues and suggestions', () => {
    render(<InsightsPanel {...mockProps} />);
    
    expect(screen.getByText('High complexity in authentication module')).toBeInTheDocument();
    expect(screen.getByText('Consider refactoring authentication logic')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    render(<InsightsPanel {...mockProps} isLoading={true} insights={null} />);
    expect(screen.getByText('Generating AI insights...')).toBeInTheDocument();
  });

  test('calls onRegenerateInsights when regenerate button is clicked', async () => {
    const user = userEvent.setup();
    render(<InsightsPanel {...mockProps} />);
    
    const regenerateButton = screen.getByRole('button', { name: /regenerate/i });
    await user.click(regenerateButton);
    
    expect(mockProps.onRegenerateInsights).toHaveBeenCalledTimes(1);
  });

  test('applies correct color coding for scores', () => {
    render(<InsightsPanel {...mockProps} />);
    
    const codeQualityScore = screen.getByText('8.5/10').closest('.score');
    expect(codeQualityScore).toHaveClass('score-good');
    
    const securityScore = screen.getByText('7.2/10').closest('.score');
    expect(securityScore).toHaveClass('score-warning');
  });
});

describe('AICodeVisualizer Integration', () => {
  const mockProps = {
    repositoryUrl: 'https://github.com/user/repo',
  };

  test('renders main components', () => {
    render(<AICodeVisualizer {...mockProps} />);
    
    // Check if main sections are rendered
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  test('handles repository analysis workflow', async () => {
    const user = userEvent.setup();
    render(<AICodeVisualizer />);
    
    // Should show repository input initially
    expect(screen.getByPlaceholderText(/repository url/i)).toBeInTheDocument();
  });
});

// Performance tests
describe('Component Performance', () => {
  test('FileExplorer handles large file structures efficiently', () => {
    const largeFileStructure = {
      name: 'root',
      type: 'directory',
      children: Array.from({ length: 1000 }, (_, i) => ({
        name: `file${i}.js`,
        type: 'file',
        size: 1024,
      })),
    };

    const renderStart = performance.now();
    render(<FileExplorer fileStructure={largeFileStructure} onFileSelect={jest.fn()} />);
    const renderEnd = performance.now();

    // Render should complete within reasonable time (< 100ms)
    expect(renderEnd - renderStart).toBeLessThan(100);
  });

  test('CodeMetrics renders quickly with complex data', () => {
    const complexMetrics = {
      totalFiles: 10000,
      linesOfCode: 1000000,
      complexity: 500,
      dependencies: 200,
      testCoverage: 85,
      maintainabilityIndex: 70,
      technicalDebt: 150,
      codeSmells: 50,
    };

    const renderStart = performance.now();
    render(<CodeMetrics metrics={complexMetrics} />);
    const renderEnd = performance.now();

    expect(renderEnd - renderStart).toBeLessThan(50);
  });
});

// Accessibility tests
describe('Component Accessibility', () => {
  test('LoadingSpinner has proper ARIA attributes', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  test('RepositoryInput has proper form labels', () => {
    render(<RepositoryInput onSubmit={jest.fn()} />);
    
    const input = screen.getByPlaceholderText(/repository url/i);
    expect(input).toHaveAttribute('aria-label');
    
    const submitButton = screen.getByRole('button', { name: /analyze/i });
    expect(submitButton).toBeInTheDocument();
  });

  test('FileExplorer supports keyboard navigation', async () => {
    const user = userEvent.setup();
    const mockFileStructure = {
      name: 'root',
      type: 'directory',
      children: [
        { name: 'file1.js', type: 'file', size: 1024 },
        { name: 'file2.js', type: 'file', size: 512 },
      ],
    };

    render(<FileExplorer fileStructure={mockFileStructure} onFileSelect={jest.fn()} />);
    
    const firstFile = screen.getByText('file1.js');
    expect(firstFile).toHaveAttribute('tabIndex');
    
    // Test keyboard navigation
    firstFile.focus();
    await user.keyboard('{Enter}');
    
    expect(firstFile.closest('.file-item')).toHaveClass('focused');
  });
});