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
import './i18n/config'
import './index.css'
import './styles/mobile.css'
import { swLogger } from './lib/logger'

// E9 (2026-05-15): Lazy-load Sentry — den interna consent-gaten räddar
// runtime, men STATISK import drog ändå in hela @sentry/react SDK (~80KB)
// i index.js för alla användare. Med dynamisk import hamnar SDK:n i en
// egen chunk som bara laddas om consent finns.
const COOKIE_CONSENT_KEY = 'jobin_cookie_consent'
if (typeof window !== 'undefined' && localStorage.getItem(COOKIE_CONSENT_KEY) === 'true') {
  import('./lib/sentry').then(({ initSentry }) => initSentry())
    .catch(err => console.warn('[Sentry] Lazy-load failed:', err))
}

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

// SW-avregistrering sker i index.html (en gång, före app-laddning) —
// dubbletten här borttagen 2026-07-10 (C2)

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
