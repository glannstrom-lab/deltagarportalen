// Debug logging
const logDebug = (msg: string) => {
  if (typeof window !== 'undefined' && (window as any).__logDebug) {
    (window as any).__logDebug(msg)
  } else {
    console.log('[DEBUG]', msg)
  }
}

logDebug('3. main.tsx module starting')

import React from 'react'
logDebug('3a. React imported')

import ReactDOM from 'react-dom/client'
logDebug('3b. ReactDOM imported')

import { HashRouter } from 'react-router-dom'
logDebug('3c. HashRouter imported')

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
logDebug('3d. React Query imported')

import App from './App'
logDebug('3e. App imported')

import ErrorBoundary from './components/ErrorBoundary'
import { MobileOptimizer } from './components/MobileOptimizer'
import { FontProvider } from './components/FontProvider'
import { UpdateNotification } from './components/UpdateNotification'
import { ThemeProvider } from './contexts/ThemeContext'
import { ConfirmDialogProvider } from './components/ui/ConfirmDialog'
logDebug('3f. Components imported')

import { initSentry } from './lib/sentry'
logDebug('3g. Sentry imported')

import './i18n/config' // Initiera i18n
logDebug('3h. i18n imported')

import './index.css'
import './styles/mobile.css'
logDebug('3i. CSS imported')

import { swLogger } from './lib/logger'
logDebug('3j. Logger imported')

// Initialize Sentry error monitoring (before anything else)
logDebug('4. Initializing Sentry')
initSentry()
logDebug('4a. Sentry initialized')

// Global error handler for chunk load errors
// This catches errors that might slip past ErrorBoundary
window.addEventListener('error', (event) => {
  const message = event.error?.message?.toLowerCase() || event.message?.toLowerCase() || ''
  
  if (
    message.includes('chunk') ||
    message.includes('dynamically imported module') ||
    message.includes('loading chunk') ||
    message.includes('failed to fetch dynamically')
  ) {
    swLogger.warn('ChunkLoadError detected:', event.error)
    
    // Prevent default error handling
    event.preventDefault()
    
    // Show a user-friendly message and reload
    const shouldReload = confirm(
      'En ny version av appen är tillgänglig. Sidan behöver laddas om för att visa uppdateringarna.'
    )
    
    if (shouldReload) {
      window.location.reload()
    }
  }
})

// Handle unhandled promise rejections (for async chunk loading)
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message?.toLowerCase() || ''
  
  if (
    message.includes('chunk') ||
    message.includes('dynamically imported module') ||
    message.includes('loading chunk') ||
    message.includes('failed to fetch dynamically')
  ) {
    swLogger.warn('Chunk load rejection detected:', event.reason)
    
    event.preventDefault()
    
    // Auto-reload after a short delay
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }
})

// Create Query Client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
    mutations: {
      retry: 1,
    },
  },
})

// TEMPORARILY DISABLED: Service Worker was causing white screen issues
// Unregister all service workers to fix the problem
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister()
      swLogger.debug('Avregistrerade service worker:', registration.scope)
    })
  })
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name))
    })
  }
}

// Initialize app
logDebug('6. About to mount React')
const rootElement = document.getElementById('root')
logDebug('6a. Root element: ' + (rootElement ? 'found' : 'NOT FOUND'))

if (rootElement) {
  try {
    logDebug('6b. Creating React root')
    const root = ReactDOM.createRoot(rootElement)
    logDebug('6c. React root created, rendering...')
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <HashRouter>
              <ThemeProvider>
                <FontProvider>
                  <ConfirmDialogProvider>
                    <MobileOptimizer />
                    <App />
                    <UpdateNotification />
                  </ConfirmDialogProvider>
                </FontProvider>
              </ThemeProvider>
            </HashRouter>
          </QueryClientProvider>
        </ErrorBoundary>
      </React.StrictMode>,
    )
    logDebug('6d. React render() called')
  } catch (err) {
    logDebug('6e. RENDER ERROR: ' + (err as Error).message)
    console.error('React render error:', err)
  }
} else {
  logDebug('6f. CRITICAL: No root element found!')
}
