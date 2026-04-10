/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * Prevents the entire app from crashing and shows a user-friendly error message
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from '@/components/ui/icons';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to an error tracking service
    if (import.meta.env.PROD) {
      // Example: sendToErrorTracking(error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Något gick fel
            </h1>
            
            <p className="text-slate-600 mb-6">
              Vi ber om ursäkt, men något oväntat händer. 
              Du kan försöka ladda om sidan eller gå tillbaka till startsidan.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="bg-slate-100 rounded-xl p-4 mb-6 text-left overflow-auto">
                <p className="text-sm font-mono text-red-600 mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="text-xs text-slate-600 overflow-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Ladda om sidan
              </button>
              
              <Link
                to="/"
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                <Home className="w-4 h-4" />
                Till startsidan
              </Link>
            </div>

            <p className="text-xs text-slate-600 mt-6">
              Om problemet kvarstår, kontakta support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  return React.useCallback((error: Error) => {
    console.error('Error caught by useErrorHandler:', error);
    // You could also send this to an error tracking service
  }, []);
}

// Smaller error fallback for section-level error boundaries
export function SectionErrorFallback({ 
  error, 
  reset 
}: { 
  error: Error; 
  reset: () => void;
}) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 my-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-red-800 mb-1">
            Kunde inte ladda innehåll
          </h3>
          <p className="text-sm text-red-600 mb-3">
            Det gick inte att visa detta avsnitt. Försök igen.
          </p>
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 bg-white text-red-700 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Försök igen
          </button>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;
