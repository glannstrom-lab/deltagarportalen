/**
 * Tester för CacheService (TTL-cache med LRU-trim).
 * Verifierar get/set, expiry, getOrFetch, cleanup, hit-rate tracking.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import CacheService from './cacheService'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('CacheService.get + set', () => {
  it('returnerar null för okänd nyckel', () => {
    const c = new CacheService()
    expect(c.get('missing')).toBeNull()
  })

  it('returnerar sparad data', () => {
    const c = new CacheService()
    c.set('a', { value: 42 })
    expect(c.get<{ value: number }>('a')).toEqual({ value: 42 })
  })

  it('respekterar default-TTL och tar bort utgångna entries vid get', () => {
    const c = new CacheService({ ttl: 1000 })
    c.set('k', 'v')
    expect(c.get('k')).toBe('v')

    vi.advanceTimersByTime(1001)
    expect(c.get('k')).toBeNull()
  })

  it('respekterar custom TTL i set()', () => {
    const c = new CacheService({ ttl: 10_000 })
    c.set('short', 'data', 500)

    vi.advanceTimersByTime(501)
    expect(c.get('short')).toBeNull()
  })
})

describe('CacheService.invalidate + clear', () => {
  it('invalidate tar bort en specifik nyckel', () => {
    const c = new CacheService()
    c.set('a', 1)
    c.set('b', 2)
    c.invalidate('a')
    expect(c.get('a')).toBeNull()
    expect(c.get('b')).toBe(2)
  })

  it('clear tar bort alla entries', () => {
    const c = new CacheService()
    c.set('a', 1)
    c.set('b', 2)
    c.clear()
    expect(c.get('a')).toBeNull()
    expect(c.get('b')).toBeNull()
    expect(c.getStats().size).toBe(0)
  })
})

describe('CacheService.cleanup + maxEntries', () => {
  it('cleanup tar bort utgångna entries', () => {
    const c = new CacheService({ ttl: 1000 })
    c.set('expired', 1)
    vi.advanceTimersByTime(1001)
    c.set('fresh', 2)

    c.cleanup()
    expect(c.getStats().size).toBe(1)
  })

  it('triggar LRU-trim när maxEntries uppnås', () => {
    const c = new CacheService({ ttl: 60_000, maxEntries: 5 })

    // Fyll cachen till maxEntries
    for (let i = 0; i < 5; i++) {
      c.set(`k${i}`, i)
      vi.advanceTimersByTime(10)  // Olika timestamps så LRU kan sortera
    }

    // En till — triggar cleanup() som tar bort 20% äldsta
    c.set('k5', 5)

    // Förväntat: ~80% behålls (4 av 5 äldsta + den nya = 5 totalt? eller mindre)
    // Implementation tar bort floor(size * 0.2) = floor(5*0.2) = 1
    // Sedan läggs k5 till = 5 totalt
    expect(c.getStats().size).toBeLessThanOrEqual(5)
  })
})

describe('CacheService.getOrFetch', () => {
  it('hämtar via fetcher vid miss och cachar resultat', async () => {
    const c = new CacheService()
    const fetcher = vi.fn().mockResolvedValue('fresh')

    const result = await c.getOrFetch('k', fetcher)
    expect(result).toBe('fresh')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('returnerar cachad data utan att kalla fetcher vid hit', async () => {
    const c = new CacheService()
    c.set('k', 'cached')
    const fetcher = vi.fn().mockResolvedValue('fresh')

    const result = await c.getOrFetch('k', fetcher)
    expect(result).toBe('cached')
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('respekterar custom TTL via config', async () => {
    const c = new CacheService({ ttl: 60_000 })
    const fetcher = vi.fn().mockResolvedValue('data')

    await c.getOrFetch('k', fetcher, { ttl: 100 })

    vi.advanceTimersByTime(101)
    expect(c.get('k')).toBeNull()
  })
})

describe('CacheService hit-rate tracking', () => {
  it('börjar med 0 hits och 0 misses', () => {
    const c = new CacheService()
    expect(c.getStats()).toMatchObject({ hits: 0, misses: 0, hitRate: 0 })
  })

  it('räknar miss för okänd nyckel', () => {
    const c = new CacheService()
    c.get('missing')
    c.get('missing')
    expect(c.getStats()).toMatchObject({ hits: 0, misses: 2, hitRate: 0 })
  })

  it('räknar hit för existerande nyckel', () => {
    const c = new CacheService()
    c.set('k', 'v')
    c.get('k')
    c.get('k')
    expect(c.getStats()).toMatchObject({ hits: 2, misses: 0, hitRate: 1 })
  })

  it('beräknar hit-rate korrekt vid blandning', () => {
    const c = new CacheService()
    c.set('k', 'v')
    c.get('k')         // hit
    c.get('missing')   // miss
    c.get('k')         // hit
    c.get('missing2')  // miss

    // 2 hits + 2 misses = 50% hit rate
    expect(c.getStats().hitRate).toBe(0.5)
  })

  it('räknar utgångna entries som miss (inte hit)', () => {
    const c = new CacheService({ ttl: 1000 })
    c.set('k', 'v')
    vi.advanceTimersByTime(1001)
    c.get('k')  // expired = miss
    expect(c.getStats()).toMatchObject({ hits: 0, misses: 1, hitRate: 0 })
  })

  it('resetStats nollställer counters utan att rensa data', () => {
    const c = new CacheService()
    c.set('k', 'v')
    c.get('k')
    c.get('missing')

    c.resetStats()
    expect(c.getStats()).toMatchObject({ hits: 0, misses: 0, hitRate: 0 })
    // Datan finns kvar
    expect(c.get('k')).toBe('v')
  })
})
