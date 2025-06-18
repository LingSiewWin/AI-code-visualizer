import React from 'react';
import { 
  Loader2, 
  RefreshCw, 
  Brain, 
  Code, 
  GitBranch, 
  Zap,
  Database,
  Search,
  Download,
  Upload
} from 'lucide-react';

const LoadingSpinner = ({ 
  type = 'default',
  size = 'medium',
  color = '#3b82f6',
  message = '',
  overlay = false,
  className = '',
  showProgress = false,
  progress = 0
}) => {
  // Size configurations
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
    xlarge: 'w-12 h-12'
  };

  const containerSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl'
  };

  // Spinner variants
  const SpinnerVariants = {
    // Default rotating spinner
    default: () => (
      <Loader2 
        className={`${sizeClasses[size]} animate-spin`}
        style={{ color }}
      />
    ),

    // Refresh spinner
    refresh: () => (
      <RefreshCw 
        className={`${sizeClasses[size]} animate-spin`}
        style={{ color }}
      />
    ),

    // Pulsing dots
    dots: () => (
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`rounded-full ${size === 'small' ? 'w-1 h-1' : size === 'medium' ? 'w-2 h-2' : size === 'large' ? 'w-3 h-3' : 'w-4 h-4'}`}
            style={{ 
              backgroundColor: color,
              animation: `pulse 1.4s ease-in-out ${i * 0.16}s infinite both`
            }}
          />
        ))}
      </div>
    ),

    // Bouncing balls
    bounce: () => (
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`rounded-full ${size === 'small' ? 'w-2 h-2' : size === 'medium' ? 'w-3 h-3' : size === 'large' ? 'w-4 h-4' : 'w-5 h-5'}`}
            style={{ 
              backgroundColor: color,
              animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite both`
            }}
          />
        ))}
      </div>
    ),

    // Spinning ring
    ring: () => (
      <div 
        className={`${sizeClasses[size]} rounded-full border-2 border-gray-200 animate-spin`}
        style={{ borderTopColor: color }}
      />
    ),

    // Pulse ring
    pulse: () => (
      <div className="relative">
        <div 
          className={`${sizeClasses[size]} rounded-full opacity-75 animate-ping absolute`}
          style={{ backgroundColor: color }}
        />
        <div 
          className={`${sizeClasses[size]} rounded-full`}
          style={{ backgroundColor: color }}
        />
      </div>
    ),

    // Brain for AI processing
    brain: () => (
      <Brain 
        className={`${sizeClasses[size]} animate-pulse`}
        style={{ color }}
      />
    ),

    // Code analysis
    code: () => (
      <Code 
        className={`${sizeClasses[size]} animate-spin`}
        style={{ color }}
      />
    ),

    // Repository processing
    repository: () => (
      <GitBranch 
        className={`${sizeClasses[size]} animate-bounce`}
        style={{ color }}
      />
    ),

    // Performance analysis
    performance: () => (
      <Zap 
        className={`${sizeClasses[size]} animate-pulse`}
        style={{ color }}
      />
    ),

    // Data processing
    data: () => (
      <Database 
        className={`${sizeClasses[size]} animate-spin`}
        style={{ color }}
      />
    ),

    // Search/analysis
    search: () => (
      <Search 
        className={`${sizeClasses[size]} animate-ping`}
        style={{ color }}
      />
    ),

    // Download
    download: () => (
      <Download 
        className={`${sizeClasses[size]} animate-bounce`}
        style={{ color }}
      />
    ),

    // Upload
    upload: () => (
      <Upload 
        className={`${sizeClasses[size]} animate-bounce`}
        style={{ color }}
      />
    ),

    // Custom animated bars
    bars: () => (
      <div className="flex space-x-1 items-end">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`bg-current ${size === 'small' ? 'w-1' : size === 'medium' ? 'w-1.5' : size === 'large' ? 'w-2' : 'w-3'}`}
            style={{ 
              color,
              height: size === 'small' ? '8px' : size === 'medium' ? '12px' : size === 'large' ? '16px' : '20px',
              animation: `bars 1.2s ease-in-out ${i * 0.1}s infinite both`
            }}
          />
        ))}
      </div>
    ),

    // Circular progress
    circular: () => (
      <div className="relative">
        <svg 
          className={`${sizeClasses[size]} -rotate-90`}
          viewBox="0 0 36 36"
        >
          <path
            className="stroke-current text-gray-200"
            strokeWidth="3"
            fill="none"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="stroke-current animate-spin"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="75, 100"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            style={{ color }}
          />
        </svg>
      </div>
    )
  };

  const SpinnerComponent = SpinnerVariants[type] || SpinnerVariants.default;

  const spinnerContent = (
    <div className={`flex flex-col items-center justify-center space-y-3 ${containerSizes[size]} ${className}`}>
      <SpinnerComponent />
      
      {message && (
        <div className="text-gray-600 text-center max-w-xs">
          {message}
        </div>
      )}
      
      {showProgress && (
        <div className="w-full max-w-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ 
                width: `${progress}%`,
                backgroundColor: color 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 shadow-xl">
          {spinnerContent}
        </div>
      </div>
    );
  }

  return spinnerContent;
};

// Predefined spinner configurations for common use cases
export const AILoadingSpinner = (props) => (
  <LoadingSpinner 
    type="brain" 
    color="#8b5cf6" 
    message="Analyzing code with AI..."
    {...props} 
  />
);

export const RepositoryLoadingSpinner = (props) => (
  <LoadingSpinner 
    type="repository" 
    color="#10b981" 
    message="Fetching repository data..."
    {...props} 
  />
);

export const AnalysisLoadingSpinner = (props) => (
  <LoadingSpinner 
    type="code" 
    color="#3b82f6" 
    message="Running code analysis..."
    {...props} 
  />
);

export const DataLoadingSpinner = (props) => (
  <LoadingSpinner 
    type="data" 
    color="#f59e0b" 
    message="Processing data..."
    {...props} 
  />
);

export const SearchLoadingSpinner = (props) => (
  <LoadingSpinner 
    type="search" 
    color="#ef4444" 
    message="Searching repositories..."
    {...props} 
  />
);

// CSS animations (add to your global CSS or include in component)
const animations = `
@keyframes pulse {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
}

@keyframes bars {
  0%, 40%, 100% {
    transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1);
  }
}
`;

// Demo component to showcase all spinner types
export const LoadingSpinnerDemo = () => {
  const spinnerTypes = [
    'default', 'refresh', 'dots', 'bounce', 'ring', 'pulse',
    'brain', 'code', 'repository', 'performance', 'data',
    'search', 'download', 'upload', 'bars', 'circular'
  ];

  const sizes = ['small', 'medium', 'large', 'xlarge'];
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <style>{animations}</style>
      
      <div>
        <h2 className="text-2xl font-bold mb-6">Loading Spinner Showcase</h2>
        
        <div className="grid grid-cols-4 gap-6 mb-8">
          {spinnerTypes.map((type) => (
            <div key={type} className="bg-white p-6 rounded-lg shadow-sm border text-center">
              <h3 className="text-sm font-medium text-gray-700 mb-4 capitalize">{type}</h3>
              <LoadingSpinner type={type} size="large" />
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Size Variations</h3>
          <div className="flex items-center justify-around">
            {sizes.map((size) => (
              <div key={size} className="text-center">
                <div className="mb-2">
                  <LoadingSpinner type="default" size={size} />
                </div>
                <span className="text-sm text-gray-500 capitalize">{size}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Color Variations</h3>
          <div className="flex items-center justify-around">
            {colors.map((color) => (
              <div key={color} className="text-center">
                <div className="mb-2">
                  <LoadingSpinner type="ring" color={color} size="large" />
                </div>
                <span className="text-sm text-gray-500">{color}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">With Messages</h3>
          <div className="space-y-6">
            <LoadingSpinner 
              type="brain" 
              size="large" 
              color="#8b5cf6"
              message="AI is analyzing your codebase for insights and recommendations..."
            />
            <LoadingSpinner 
              type="bars" 
              size="large" 
              color="#10b981"
              message="Processing repository data..."
              showProgress={true}
              progress={65}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Predefined Spinners</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <AILoadingSpinner size="large" />
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <RepositoryLoadingSpinner size="large" />
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <AnalysisLoadingSpinner size="large" />
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <DataLoadingSpinner size="large" />
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <SearchLoadingSpinner size="large" />
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <LoadingSpinner 
                type="circular" 
                size="large" 
                color="#f59e0b"
                message="Custom loading..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;