import React from 'react';
import { logError } from '../utils/errorHandling';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    logError(error, `ErrorBoundary${this.props.context ? ` (${this.props.context})` : ''}`);
    
    this.setState({
      error,
      errorInfo,
      hasError: true
    });

    // Report error to external service if configured
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default fallback UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p className="error-boundary-message">
              {this.props.userMessage || 
               'An unexpected error occurred. You can try refreshing the page or contact support if the problem persists.'}
            </p>
            
            {this.props.showDetails && this.state.error && (
              <details className="error-boundary-details">
                <summary>Error Details</summary>
                <div className="error-boundary-stack">
                  <strong>Error:</strong> {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
                      <br />
                      <strong>Component Stack:</strong>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="error-boundary-actions">
              {this.props.allowRetry !== false && this.state.retryCount < 3 && (
                <button 
                  onClick={this.handleRetry}
                  className="error-boundary-button retry-button"
                >
                  Try Again
                </button>
              )}
              <button 
                onClick={this.handleReload}
                className="error-boundary-button reload-button"
              >
                Reload Page
              </button>
            </div>

            {this.state.retryCount >= 3 && (
              <p className="error-boundary-retry-limit">
                Maximum retry attempts reached. Please reload the page.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Add CSS styles
const errorBoundaryStyles = `
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 20px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  margin: 20px;
}

.error-boundary-content {
  text-align: center;
  max-width: 500px;
}

.error-boundary-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-boundary h2 {
  color: #dc3545;
  margin-bottom: 12px;
  font-size: 24px;
}

.error-boundary-message {
  color: #6c757d;
  margin-bottom: 20px;
  line-height: 1.5;
}

.error-boundary-details {
  text-align: left;
  margin: 20px 0;
  padding: 12px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.error-boundary-details summary {
  cursor: pointer;
  font-weight: bold;
  margin-bottom: 8px;
}

.error-boundary-stack {
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.error-boundary-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.error-boundary-button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.retry-button {
  background-color: #007bff;
  color: white;
}

.retry-button:hover {
  background-color: #0056b3;
}

.reload-button {
  background-color: #6c757d;
  color: white;
}

.reload-button:hover {
  background-color: #545b62;
}

.error-boundary-retry-limit {
  color: #dc3545;
  font-size: 14px;
  margin-top: 12px;
  font-style: italic;
}
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('error-boundary-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'error-boundary-styles';
  styleElement.textContent = errorBoundaryStyles;
  document.head.appendChild(styleElement);
}