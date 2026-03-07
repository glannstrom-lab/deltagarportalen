/**
 * Service Worker for Deltagarportalen
 * 
 * Features:
 * - Precache critical assets
 * - Runtime caching for API calls
 * - Offline fallback
 * - Cache strategies for different asset types
 */

const CACHE_VERSION = 'v1'
const STATIC_CACHE = `static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`
const IMAGE_CACHE = `images-${CACHE_VERSION}`

// Assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Add critical CSS and JS files
  // These will be added dynamically by the build process
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
              // Delete old versioned caches
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

  // Handle different types of requests
  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request))
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticRequest(request))
  } else if (isPageRequest(request)) {
    event.respondWith(handlePageRequest(request))
  } else {
    event.respondWith(handleDynamicRequest(request))
  }
})

/**
 * Check if request is for an image
 */
function isImageRequest(request) {
  return request.destination === 'image'
}

/**
 * Check if request is for a static asset (JS, CSS, fonts)
 */
function isStaticAsset(request) {
  return ['script', 'style', 'font'].includes(request.destination)
}

/**
 * Check if request is for a page/document
 */
function isPageRequest(request) {
  return request.mode === 'navigate' || request.destination === 'document'
}

/**
 * Handle image requests with Cache First strategy
 */
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE)
  
  // Try cache first
  const cached = await cache.match(request)
  if (cached) {
    return cached
  }
  
  try {
    // Fetch from network
    const response = await fetch(request)
    
    // Cache successful responses
    if (response.status === 200) {
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.error('[SW] Image fetch failed:', error)
    // Return a placeholder or error response
    return new Response('Image not available', { status: 404 })
  }
}

/**
 * Handle static assets with Cache First strategy
 */
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

/**
 * Handle page requests with Network First strategy
 * Falls back to cached index.html for SPA routing
 */
async function handlePageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed, trying cache')
    
    // Fall back to cache
    const cache = await caches.open(STATIC_CACHE)
    const cached = await cache.match(request)
    
    if (cached) {
      return cached
    }
    
    // Fall back to index.html for SPA routes
    const indexHtml = await cache.match('/index.html')
    if (indexHtml) {
      return indexHtml
    }
    
    // Complete failure
    return new Response('Offline and no cache available', { 
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain',
      }),
    })
  }
}

/**
 * Handle dynamic/API requests with Stale While Revalidate strategy
 */
async function handleDynamicRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  
  const cached = await cache.match(request)
  
  const networkFetch = fetch(request)
    .then((response) => {
      if (response.status === 200) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch((error) => {
      console.error('[SW] Dynamic fetch failed:', error)
      throw error
    })
  
  // Return cached immediately, or wait for network
  return cached || networkFetch
}

/**
 * Background sync for offline form submissions
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncFormSubmissions())
  }
})

async function syncFormSubmissions() {
  // Get queued submissions from IndexedDB
  // Retry sending them
  console.log('[SW] Syncing form submissions...')
}

/**
 * Push notification handling
 */
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: data.data,
    actions: data.actions || [],
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

/**
 * Notification click handling
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const url = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

/**
 * Message handling from main thread
 */
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting()
  }
})

console.log('[SW] Service Worker loaded')
