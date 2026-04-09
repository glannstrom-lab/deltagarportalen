import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { MobileOptimizer } from './components/MobileOptimizer'
import { FontProvider } from './components/FontProvider'
import { UpdateNotification } from './components/UpdateNotification'
import { ThemeProvider } from './contexts/ThemeContext'
import { ConfirmDialogProvider } from './components/ui/ConfirmDialog'
import { initSentry } from './lib/sentry'
import './i18n/config'
import './index.css'
import './styles/mobile.css'
import { swLogger } from './lib/logger'

// Initialize Sentry error monitoring
initSentry()

// Global error handler for chunk load errors
window.addEventListener('error', (event) => {
  const message = event.error?.message?.toLowerCase() || event.message?.toLowerCase() || ''

  if (
    message.includes('chunk') ||
    message.includes('dynamically imported module') ||
    message.includes('loading chunk') ||
    message.includes('failed to fetch dynamically')
  ) {
    swLogger.warn('ChunkLoadError detected:', event.error)
    event.preventDefault()

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
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Clear any remaining service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister()
    })
  })
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name))
    })
  }
}

// Initialize app
const rootElement = document.getElementById('root')

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement)
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
}
