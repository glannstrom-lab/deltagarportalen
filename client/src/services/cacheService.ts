/**
 * Caching Service för API-anrop
 * Förbättrar prestanda och minskar belastning på Edge Functions
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl: number; // Time to live i millisekunder
  maxEntries?: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minuter default
  maxEntries: 100,
};

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Hämta data från cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Kolla om cachen har gått ut
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Spara data i cache
   */
  set<T>(key: string, data: T, customTtl?: number): void {
    // Rensa gamla entries om vi närmar oss max
    if (this.cache.size >= (this.config.maxEntries || 100)) {
      this.cleanup();
    }

    const ttl = customTtl || this.config.ttl;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };
    
    this.cache.set(key, entry);
  }

  /**
   * Rensa utgångna entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
    
    // Om fortfarande för många, ta bort äldsta
    if (this.cache.size >= (this.config.maxEntries || 100)) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = Math.floor(this.cache.size * 0.2); // Ta bort 20%
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(sortedEntries[i][0]);
      }
    }
  }

  /**
   * Rensa hela cachen
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Ta bort specifik nyckel
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Hämta eller hämta data med cache
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    config?: Partial<CacheConfig>
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      console.log(`[Cache] Hittade cache för: ${key}`);
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, config?.ttl);
    return data;
  }

  /**
   * Statistik över cachen
   */
  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // TODO: Implementera tracking
    };
  }
}

// Singleton-instanser för olika typer av data
export const jobCache = new CacheService({ ttl: 2 * 60 * 1000 }); // 2 minuter för jobb
export const taxonomyCache = new CacheService({ ttl: 60 * 60 * 1000 }); // 1 timme för taxonomi
export const trendsCache = new CacheService({ ttl: 30 * 60 * 1000 }); // 30 minuter för trender
export const defaultCache = new CacheService();

export default CacheService;
