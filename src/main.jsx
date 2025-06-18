import React from 'react';
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import App from './App.jsx';
import './index.css';

// Global error handler for unhandled errors
const handleGlobalError = (error, errorInfo) => {
  console.error('Global error caught:', error);
  console.error('Error info:', errorInfo);
  
  // In production, you might want to send this to an error reporting service
  if (import.meta.env.PROD) {
    // Example: Send to error reporting service
    // errorReportingService.captureException(error, { extra: errorInfo });
  }
};

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="error-boundary-container">
      <div className="error-boundary-content">
        <div className="error-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        
        <h2>Oops! Something went wrong</h2>
        <p className="error-message">
          The AI Code Visualizer encountered an unexpected error.
        </p>
        
        <details className="error-details">
          <summary>Error Details</summary>
          <pre className="error-stack">
            {error.message}
            {import.meta.env.DEV && (
              <>
                <br /><br />
                {error.stack}
              </>
            )}
          </pre>
        </details>
        
        <div className="error-actions">
          <button 
            className="retry-button primary"
            onClick={resetErrorBoundary}
          >
            Try Again
          </button>
          <button 
            className="reload-button secondary"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
        
        <p className="error-help">
          If this problem persists, please{' '}
          <a 
            href="https://github.com/your-username/ai-code-visualizer/issues" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            report it on GitHub
          </a>
        </p>
      </div>
    </div>
  );
};

// Performance monitoring (optional)
const measurePerformance = () => {
  if (import.meta.env.DEV && 'performance' in window) {
    // Log performance metrics in development
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log('🚀 Performance Metrics:', {
          'DOM Content Loaded': `${perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart}ms`,
          'Page Load': `${perfData.loadEventEnd - perfData.loadEventStart}ms`,
          'Total Load Time': `${perfData.loadEventEnd - perfData.fetchStart}ms`
        });
      }, 0);
    });
  }
};

// Initialize performance monitoring
measurePerformance();

// Service Worker registration for PWA capabilities (optional)
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
    } catch (error) {
      console.log('Service Worker registration failed:', error);
    }
  }
};

// Initialize service worker in production
registerServiceWorker();

// Environment-specific setup
const setupEnvironment = () => {
  // Development-specific setup
  if (import.meta.env.DEV) {
    // Enable React DevTools profiler
    if (typeof window !== 'undefined') {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.onCommitFiberRoot = (id, root, priorityLevel) => {
        // Custom profiling logic can go here
      };
    }
  }

  // Production-specific setup
  if (import.meta.env.PROD) {
    // Disable console logs in production (optional)
    // console.log = () => {};
    // console.warn = () => {};
    
    // Enable production optimizations
    if ('requestIdleCallback' in window) {
      // Use idle time for non-critical tasks
      requestIdleCallback(() => {
        // Prefetch critical resources
        // preloadCriticalAssets();
      });
    }
  }
};

setupEnvironment();

// Get root element
const container = document.getElementById('root');

if (!container) {
  throw new Error(
    'Root element not found. Make sure you have a <div id="root"></div> in your HTML.'
  );
}

// Create root
const root = createRoot(container);

// Render application
root.render(
  <StrictMode>
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleGlobalError}
      onReset={() => {
        // Clear any cached data or reset app state
        if (typeof window !== 'undefined') {
          // Clear potential problematic cache
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => {
                if (name.includes('ai-code-visualizer')) {
                  caches.delete(name);
                }
              });
            });
          }
        }
      }}
    >
      <App />
    </ErrorBoundary>
  </StrictMode>
);

// Hot Module Replacement (HMR) support for development
if (import.meta.hot) {
  import.meta.hot.accept('./App.jsx', (newModule) => {
    if (newModule) {
      // Re-render the app with the new module
      root.render(
        <StrictMode>
          <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={handleGlobalError}
          >
            <newModule.default />
          </ErrorBoundary>
        </StrictMode>
      );
    }
  });
}

// Global keyboard shortcuts
document.addEventListener('keydown', (event) => {
  // Global shortcuts for power users
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'k': // Ctrl/Cmd + K - Focus search/input
        event.preventDefault();
        const searchInput = document.querySelector('input[type="text"], input[type="url"]');
        if (searchInput) {
          searchInput.focus();
        }
        break;
      
      case 'd': // Ctrl/Cmd + D - Toggle dark mode
        if (event.shiftKey) {
          event.preventDefault();
          // Dispatch custom event to toggle theme
          window.dispatchEvent(new CustomEvent('toggle-theme'));
        }
        break;
      
      case 'b': // Ctrl/Cmd + B - Toggle sidebar
        if (event.shiftKey) {
          event.preventDefault();
          window.dispatchEvent(new CustomEvent('toggle-sidebar'));
        }
        break;
    }
  }
  
  // Escape key to close modals/panels
  if (event.key === 'Escape') {
    window.dispatchEvent(new CustomEvent('escape-pressed'));
  }
});

// Accessibility improvements
document.addEventListener('DOMContentLoaded', () => {
  // Add focus-visible polyfill behavior for better keyboard navigation
  const focusVisibleElements = document.querySelectorAll('button, a, input, textarea, select');
  focusVisibleElements.forEach(element => {
    element.addEventListener('mousedown', () => {
      element.classList.add('mouse-focus');
    });
    
    element.addEventListener('keydown', () => {
      element.classList.remove('mouse-focus');
    });
  });
});

// Export for testing purposes
export { ErrorFallback };