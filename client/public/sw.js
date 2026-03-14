/**
 * Service Worker for Deltagarportalen
 * Version 2 - Force update
 */

const CACHE_NAME = 'deltagarportal-v2'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
  '/jobin-logga.png'
]

// Installera service worker
self.addEventListener('install', (event) => {
  console.log('[SW v2] Installerar...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW v2] Cachar statiska resurser')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('[SW v2] Skip waiting')
        return self.skipWaiting()
      })
      .catch(err => console.error('[SW v2] Installationsfel:', err))
  )
})

// Aktivera service worker
self.addEventListener('activate', (event) => {
  console.log('[SW v2] Aktiverar...')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW v2] Raderar gammal cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('[SW v2] Claiming clients')
        return self.clients.claim()
      })
  )
})

// Hantera fetch-requests - NETWORK FIRST for all requests
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Strunta i Supabase-requests
  if (url.hostname.includes('supabase')) {
    return
  }
  
  // Strunta i API-requests
  if (url.pathname.startsWith('/api')) {
    return
  }
  
  // Alltid network-first för att få senaste versionen
  event.respondWith(
    fetch(request)
      .then(response => {
        // Uppdatera cache med ny version
        if (response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return response
      })
      .catch(() => {
        // Fallback till cache vid offline
        return caches.match(request)
          .then(cached => {
            if (cached) {
              console.log('[SW v2] Serving from cache:', request.url)
              return cached
            }
            return caches.match('/index.html')
          })
      })
  )
})

// Lyssna på meddelanden från klienten
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
