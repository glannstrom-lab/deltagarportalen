/**
 * Service worker för Jobin — O2 (2026-08-25).
 *
 * Filen var fram till i dag en 26-raders stubbe vars enda uppgift var att
 * avregistrera sig själv och tömma alla cachar. Den skrevs för att laga en
 * trasig cache, och biverkningen var att portalen inte gick att installera.
 *
 * Den här versionen är versionsstyrd: `CACHE_VERSION` ingår i cache-namnet, och
 * `activate` raderar varje cache som inte hör till den aktuella versionen. Det
 * är den mekaniken som gör att det gamla nödskriptet inte behövs.
 *
 * **Höj CACHE_VERSION när precache-listan ändras.** Hashade filer under
 * /assets/ behöver ingen höjning — deras filnamn är versionen.
 *
 * Strategier:
 *   navigering (HTML)  → nätet först, cachad index.html sedan, offline.html sist
 *   /assets/*          → cache först (filnamnen är innehållshashade)
 *   ikoner, manifest   → cache först
 *   allt annat         → hanteras inte alls (går rakt till nätet)
 *
 * Vi rör aldrig API-anrop. Supabase, Arbetsförmedlingens API:er och /api/* är
 * korsdomän eller föränderliga; ett cachat svar där vore ett påhittat värde.
 */

const CACHE_VERSION = 'v1'
const CACHE_NAME = `jobin-${CACHE_VERSION}`
const OFFLINE_URL = '/offline.html'

/** Det minsta som måste finnas för att sidan ska kunna visa något offline. */
const PRECACHE = [
  '/',
  OFFLINE_URL,
  '/manifest.json',
  '/favicon-64.png',
  '/apple-touch-icon.png',
  '/pwa-192.png',
  '/pwa-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // addAll är allt-eller-inget: en enda 404 gör hela installationen
      // misslyckad och användaren står utan worker. Lägg därför till en och en
      // och låt det som saknas saknas.
      Promise.all(
        PRECACHE.map((url) =>
          cache.add(url).catch(() => {
            console.warn('[sw] kunde inte förcacha', url)
          })
        )
      )
    )
  )
  // Ingen skipWaiting: en ny worker tar över först när alla flikar stängts.
  // Att byta ut tillgångar mitt i en session är precis det som ger
  // "Loading chunk failed" — felet index.html har en overlay för.
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith('jobin-') && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  )
})

/** Sidan kan be en väntande worker att ta över direkt (t.ex. efter en uppdatering). */
self.addEventListener('message', (event) => {
  if (event.data === 'sw:aktivera-nu') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Bara GET, bara samma origin. Allt annat passerar orört.
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // API-svar cachas aldrig.
  if (url.pathname.startsWith('/api/')) return

  // Navigering: nätet först. Portalen använder HashRouter, så varje rutt är
  // samma dokument — därför räcker det att falla tillbaka på '/'.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const kopia = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put('/', kopia))
          return response
        })
        .catch(() =>
          caches
            .match('/')
            .then((cachad) => cachad || caches.match(OFFLINE_URL))
            .then((svar) => svar || Response.error())
        )
    )
    return
  }

  // Hashade tillgångar och ikoner: cache först.
  const arStatisk =
    url.pathname.startsWith('/assets/') ||
    /\.(?:css|js|png|jpe?g|gif|svg|ico|webp|woff2?)$/.test(url.pathname)

  if (!arStatisk) return

  event.respondWith(
    caches.match(request).then((cachad) => {
      if (cachad) return cachad
      return fetch(request)
        .then((response) => {
          // Bara lyckade svar från vår egen origin sparas. En opaque respons
          // eller en 404 som cachas blir ett fel som överlever omladdningar.
          if (response.ok && response.type === 'basic') {
            const kopia = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, kopia))
          }
          return response
        })
        .catch(() => cachad || Response.error())
    })
  )
})
