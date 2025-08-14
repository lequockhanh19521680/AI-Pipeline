import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  errorId: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  // Mock error logging service call
  private async logErrorToService(error: Error, errorInfo: any, errorId: string) {
    try {
      // Simulate error logging to monitoring service like Sentry
      const errorData = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: 'anonymous', // In real app, would get from auth
      };

      // In a real implementation, this would be an API call to Sentry or similar
      console.info('🔍 Error logged to monitoring service:', errorData);
      
      // Simulate API call
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // });
      
    } catch (loggingError) {
      console.error('Failed to log error to service:', loggingError);
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    const errorId = this.state.errorId || `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log error to mock monitoring service
    this.logErrorToService(error, errorInfo, errorId);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleCopyDetails = async () => {
    try {
      const errorDetails = {
        errorId: this.state.errorId,
        message: this.state.error?.message,
        stack: this.state.error?.stack,
        componentStack: this.state.errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      const detailsText = `Error Report\n\nError ID: ${errorDetails.errorId}\nMessage: ${errorDetails.message}\nTimestamp: ${errorDetails.timestamp}\nURL: ${errorDetails.url}\n\nStack Trace:\n${errorDetails.stack}\n\nComponent Stack:\n${errorDetails.componentStack}`;
      
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(detailsText);
        alert('Error details copied to clipboard!');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = detailsText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Error details copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to copy error details:', error);
      alert('Failed to copy error details to clipboard');
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-red-600"></i>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Something went wrong
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  An unexpected error occurred
                </p>
                {this.state.errorId && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Error ID: {this.state.errorId}
                  </p>
                )}
              </div>
            </div>

            {this.state.error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                <p className="text-sm text-red-800 dark:text-red-200 font-mono">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex space-x-3 mb-4">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Reload Page
              </button>
            </div>

            {/* Copy Details Button */}
            <button
              onClick={this.handleCopyDetails}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              📋 Copy Error Details
            </button>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-4">
                <summary className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                  Error details (development)
                </summary>
                <pre className="mt-2 text-xs text-gray-500 dark:text-gray-400 overflow-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;