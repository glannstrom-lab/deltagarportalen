/**
 * Sentry Error Monitoring Configuration
 *
 * Setup instructions:
 * 1. Create a Sentry account at https://sentry.io
 * 2. Create a new React project
 * 3. Copy the DSN and add to environment variables:
 *    VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
 */

import * as Sentry from '@sentry/react';

// Only initialize in production or if explicitly enabled
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const IS_PRODUCTION = import.meta.env.PROD;
const ENABLE_SENTRY = SENTRY_DSN && (IS_PRODUCTION || import.meta.env.VITE_SENTRY_DEBUG === 'true');

/**
 * Initialize Sentry error monitoring
 * Call this in main.tsx before rendering the app
 */
export function initSentry(): void {
  if (!ENABLE_SENTRY) {
    console.log('[Sentry] Disabled - no DSN or not in production');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || 'unknown',

    // Performance monitoring
    tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0, // 10% in prod, 100% in dev

    // Session replay for debugging (optional, can be expensive)
    replaysSessionSampleRate: 0.01, // 1% of sessions
    replaysOnErrorSampleRate: 0.1, // 10% of sessions with errors

    // Filter out noisy errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'http://tt.telerik.com/',
      'atomicFindClose',

      // Network errors (usually user's connection)
      'Network Error',
      'NetworkError',
      'Failed to fetch',
      'Load failed',
      'ChunkLoadError',
      'Loading chunk',

      // User cancelled
      'AbortError',
      'The operation was aborted',

      // Browser quirks
      "Can't find variable: $",
      'ResizeObserver loop',
      'Non-Error promise rejection',
    ],

    // Don't send errors from these URLs
    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      /^moz-extension:\/\//i,

      // Third party scripts
      /google-analytics\.com/i,
      /googletagmanager\.com/i,
    ],

    // Add custom context
    beforeSend(event, hint) {
      // Filter out errors that are just noise
      const error = hint.originalException;

      if (error instanceof Error) {
        // Ignore chunk load errors (handled by app)
        if (error.message.includes('chunk') || error.message.includes('Loading')) {
          return null;
        }
      }

      // Sanitize potentially sensitive data
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }

      return event;
    },
  });

  console.log('[Sentry] Initialized successfully');
}

/**
 * Capture a custom error with context
 */
export function captureError(
  error: Error | string,
  context?: Record<string, unknown>
): void {
  if (!ENABLE_SENTRY) {
    console.error('[Error]', error, context);
    return;
  }

  if (typeof error === 'string') {
    Sentry.captureMessage(error, {
      level: 'error',
      extra: context,
    });
  } else {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}

/**
 * Set user context for error tracking
 * Call this after user logs in
 */
export function setUser(user: {
  id: string;
  email?: string;
  role?: string;
} | null): void {
  if (!ENABLE_SENTRY) return;

  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      // Don't include PII like names
    });

    Sentry.setTag('user_role', user.role || 'unknown');
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string = 'app',
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, unknown>
): void {
  if (!ENABLE_SENTRY) return;

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * React Error Boundary wrapper from Sentry
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * HOC to wrap components with error boundary
 */
export const withErrorBoundary = Sentry.withErrorBoundary;

export default {
  initSentry,
  captureError,
  setUser,
  addBreadcrumb,
  SentryErrorBoundary,
  withErrorBoundary,
};
