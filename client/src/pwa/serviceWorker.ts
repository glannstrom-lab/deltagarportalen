/**
 * Service Worker for PWA functionality
 * Offline support, caching, and background sync
 */

const CACHE_NAME = 'deltagarportal-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
]

// Installera service worker
self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Aktivera service worker
self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Intercepta fetch-anrop
self.addEventListener('fetch', (event: any) => {
  const { request } = event

  // API-anrop - network first, fallback to cache
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Spara i cache för offline
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone)
          })
          return response
        })
        .catch(() => {
          return caches.match(request)
        })
    )
    return
  }

  // Statiska resurser - cache first, fallback to network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached
      }
      return fetch(request)
        .then((response) => {
          // Spara i cache
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone)
          })
          return response
        })
        .catch(() => {
          // Offline fallback för HTML-sidor
          if (request.destination === 'document') {
            return caches.match('/index.html')
          }
          return new Response('Offline', { status: 503 })
        })
    })
  )
})

// Background sync för offline-formulär
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncFormData())
  }
})

// Push-notiser
self.addEventListener('push', (event: any) => {
  const data = event.data?.json() || {}
  
  const options = {
    body: data.body || 'Ny påminnelse från Deltagarportalen',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    tag: data.tag || 'reminder',
    requireInteraction: true,
    actions: data.actions || [
      { action: 'open', title: 'Öppna' },
      { action: 'dismiss', title: 'Ignorera' }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Deltagarportalen', options)
  )
})

// Klick på notis
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close()

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      self.clients.openWindow('/dashboard')
    )
  }
})

// Synka formulärdata som sparats offline
async function syncFormData(): Promise<void> {
  const db = await openDB('form-sync', 1)
  const tx = db.transaction('pending-forms', 'readonly')
  const store = tx.objectStore('pending-forms')
  const pendingForms = await store.getAll()

  for (const form of pendingForms) {
    try {
      const response = await fetch(form.url, {
        method: form.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form.data)
      })

      if (response.ok) {
        // Ta bort från pending
        const deleteTx = db.transaction('pending-forms', 'readwrite')
        await deleteTx.objectStore('pending-forms').delete(form.id)
      }
    } catch (error) {
      console.error('Kunde inte synka formulär:', error)
    }
  }
}

// Hjälpfunktion för IndexedDB
function openDB(name: string, version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('pending-forms')) {
        db.createObjectStore('pending-forms', { keyPath: 'id' })
      }
    }
  })
}

export {}
