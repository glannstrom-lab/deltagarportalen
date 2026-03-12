/**
 * Service Worker for Deltagarportalen
 * Fixed for hash-based routing
 */

const CACHE_VERSION = 'v2'
const STATIC_CACHE = `static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`
const IMAGE_CACHE = `images-${CACHE_VERSION}`

// Assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
]

// Install event - Precache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...')
  
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching assets')
        return cache.addAll(PRECACHE_ASSETS)
      })
      .then(() => {
        console.log('[SW] Precaching complete')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Precaching failed:', error)
      })
  )
})

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...')
  
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return (
                cacheName.startsWith('static-') && cacheName !== STATIC_CACHE
              ) || (
                cacheName.startsWith('dynamic-') && cacheName !== DYNAMIC_CACHE
              ) || (
                cacheName.startsWith('images-') && cacheName !== IMAGE_CACHE
              )
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      })
      .then(() => {
        console.log('[SW] Activation complete')
        return self.clients.claim()
      })
  )
})

// Fetch event - Handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip Supabase API calls (let them go directly)
  if (url.hostname.includes('supabase.co')) {
    return
  }

  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return
  }

  // IMPORTANT: For hash-based routing, always return index.html for navigation
  // This ensures the SPA handles the routing
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cached) => {
        // Return cached index.html immediately
        if (cached) {
          return cached
        }
        // Fallback to network
        return fetch('/index.html')
      })
    )
    return
  }

  // Handle different types of requests
  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request))
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticRequest(request))
  } else {
    // For other requests (API, etc.), use stale-while-revalidate
    event.respondWith(handleDynamicRequest(request))
  }
})

function isImageRequest(request) {
  return request.destination === 'image'
}

function isStaticAsset(request) {
  return ['script', 'style', 'font'].includes(request.destination)
}

async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE)
  const cached = await cache.match(request)
  
  if (cached) {
    return cached
  }
  
  try {
    const response = await fetch(request)
    if (response.status === 200) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.error('[SW] Image fetch failed:', error)
    return new Response('Image not available', { status: 404 })
  }
}

async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cached = await cache.match(request)
  
  if (cached) {
    return cached
  }
  
  try {
    const response = await fetch(request)
    if (response.status === 200) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error)
    throw error
  }
}

async function handleDynamicRequest(request) {
  // Skip requests that shouldn't be cached
  const url = new URL(request.url)
  if (url.pathname.includes('/api/') || url.hostname.includes('supabase.co')) {
    return fetch(request)
  }

  const cache = await caches.open(DYNAMIC_CACHE)
  const cached = await cache.match(request)
  
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.error('[SW] Dynamic fetch failed:', error)
    // Return cached version if available, otherwise throw
    if (cached) {
      return cached
    }
    throw error
  }
}

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-forms') {
    console.log('[SW] Background sync triggered')
    // Handle form sync here
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      })
    )
  }
})

console.log('[SW] Service Worker loaded')
