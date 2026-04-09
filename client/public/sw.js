/**
 * Service Worker - Self-unregistering version
 * This version unregisters itself to fix caching issues
 */

// Immediately unregister this service worker
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Unregister this service worker
  self.registration.unregister()

  // Clear all caches
  event.waitUntil(
    caches.keys().then(names => {
      return Promise.all(names.map(name => caches.delete(name)))
    })
  )
})

// Don't intercept any fetches
self.addEventListener('fetch', () => {
  // Do nothing - let requests pass through normally
})
