/**
 * Loading State Components
 * Ger tydlig feedback vid laddning av data
 */

import React from 'react';

interface LoadingStateProps {
  message?: string;
  submessage?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  retryCount?: number;
  maxRetries?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Laddar...',
  submessage,
  size = 'md',
  fullScreen = false,
  retryCount,
  maxRetries,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-white/90 backdrop-blur-sm z-50'
    : 'flex flex-col items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner */}
        <div
          className={`
            ${sizeClasses[size]}
            border-gray-200 border-t-primary-600
            rounded-full animate-spin
          `}
        />

        {/* Meddelande */}
        <div className="text-center space-y-2">
          <p className="text-gray-700 font-medium">{message}</p>
          
          {submessage && (
            <p className="text-gray-500 text-sm">{submessage}</p>
          )}

          {/* Retry-indikator */}
          {retryCount !== undefined && maxRetries !== undefined && retryCount > 0 && (
            <p className="text-amber-600 text-sm">
              Försök {retryCount}/{maxRetries}...
            </p>
          )}
        </div>

        {/* Progress bar för fullskärm */}
        {fullScreen && (
          <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary-600 animate-pulse w-1/2" />
          </div>
        )}
      </div>
    </div>
  );
};

interface SkeletonProps {
  rows?: number;
  className?: string;
}

export const SkeletonList: React.FC<SkeletonProps> = ({ rows = 3, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="bg-gray-200 rounded-lg h-20 animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
      <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse" />
      </div>
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onCancel?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Något gick fel',
  message,
  onRetry,
  onCancel,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {/* Ikon */}
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      {/* Text */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>

      {/* Knappar */}
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Försök igen
          </button>
        )}
        
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Avbryt
          </button>
        )}
      </div>
    </div>
  );
};

export default LoadingState;
