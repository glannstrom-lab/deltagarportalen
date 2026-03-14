/**
 * Service Worker för Deltagarportalen
 * Ger offline-stöd och snabbare laddning
 */

const CACHE_NAME = 'deltagarportal-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
  '/jobin-logga.png'
]

// Installera service worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installerar...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cachar statiska resurser')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[SW] Installationsfel:', err))
  )
})

// Aktivera service worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Aktiverar...')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Raderar gammal cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => self.clients.claim())
  )
})

// Hantera fetch-requests
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Strunta i Supabase-requests (de ska alltid gå till nätet)
  if (url.hostname.includes('supabase')) {
    return
  }
  
  // Strunta i API-requests
  if (url.pathname.startsWith('/api')) {
    return
  }
  
  // Network-first strategi för HTML-sidor
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cacha svaret för offline
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
          return response
        })
        .catch(() => {
          // Fallback till cache om offline
          return caches.match(request)
            .then(cached => cached || caches.match('/index.html'))
        })
    )
    return
  }
  
  // Cache-first för statiska resurser (CSS, JS, bilder)
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(
      caches.match(request)
        .then(cached => {
          if (cached) {
            // Uppdatera cache i bakgrunden
            fetch(request)
              .then(response => {
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(request, response))
              })
              .catch(() => {})
            return cached
          }
          
          return fetch(request)
            .then(response => {
              const clone = response.clone()
              caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
              return response
            })
        })
    )
    return
  }
  
  // Network-first för allt annat
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})

// Bakgrundssynkronisering
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-activities') {
    event.waitUntil(syncActivities())
  }
})

async function syncActivities() {
  // Här skulle vi synka påbörjade aktiviteter från IndexedDB
  console.log('[SW] Synkar aktiviteter...')
}

// Push-notiser
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  const data = event.data.json()
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/jobin-logga.png',
      badge: '/vite.svg',
      data: data.data,
      actions: data.actions || []
    })
  )
})

// Klick på notifikation
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  event.waitUntil(
    self.clients.openWindow(event.notification.data?.url || '/')
  )
})

// Meddelanden från main thread
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting()
  }
})

console.log('[SW] Service Worker laddad')
