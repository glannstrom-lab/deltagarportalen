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
import './i18n/config' // Initiera i18n
import './index.css'
import './styles/mobile.css'
import { swLogger } from './lib/logger'

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

// Registrera Service Worker för offline-stöd
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        swLogger.debug('Registrerad:', registration.scope)
      })
      .catch(error => {
        swLogger.debug('Registrering misslyckades:', error)
      })
  })
}

// Initialize app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          <ThemeProvider>
            <FontProvider>
              <MobileOptimizer />
              <App />
              <UpdateNotification />
            </FontProvider>
          </ThemeProvider>
        </HashRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
