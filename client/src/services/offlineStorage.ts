/**
 * Offline Storage Service using IndexedDB
 * Provides persistent storage for career module data when offline
 */

const DB_NAME = 'deltagarportal-offline'
const DB_VERSION = 1

interface CachedData<T> {
  key: string
  data: T
  timestamp: number
  expiresAt: number
}

// Store names for different data types
const STORES = {
  careerPlan: 'career-plan',
  skillsAnalysis: 'skills-analysis',
  networkContacts: 'network-contacts',
  milestones: 'milestones',
  metadata: 'metadata'
} as const

type StoreName = typeof STORES[keyof typeof STORES]

class OfflineStorage {
  private db: IDBDatabase | null = null
  private isInitialized = false

  async init(): Promise<void> {
    if (this.isInitialized && this.db) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        this.isInitialized = true
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create stores if they don't exist
        Object.values(STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'key' })
          }
        })
      }
    })
  }

  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init()
    }
    return this.db!
  }

  async set<T>(storeName: StoreName, key: string, data: T, ttlMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const db = await this.ensureDb()
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)

      const entry: CachedData<T> = {
        key,
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttlMs
      }

      return new Promise((resolve, reject) => {
        const request = store.put(entry)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error(`Failed to store ${key} in ${storeName}:`, error)
    }
  }

  async get<T>(storeName: StoreName, key: string): Promise<T | null> {
    try {
      const db = await this.ensureDb()
      const transaction = db.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)

      return new Promise((resolve, reject) => {
        const request = store.get(key)
        request.onsuccess = () => {
          const entry = request.result as CachedData<T> | undefined
          if (!entry) {
            resolve(null)
            return
          }

          // Check if expired
          if (Date.now() > entry.expiresAt) {
            this.delete(storeName, key).catch(console.error)
            resolve(null)
            return
          }

          resolve(entry.data)
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error(`Failed to get ${key} from ${storeName}:`, error)
      return null
    }
  }

  async getAll<T>(storeName: StoreName): Promise<T[]> {
    try {
      const db = await this.ensureDb()
      const transaction = db.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)

      return new Promise((resolve, reject) => {
        const request = store.getAll()
        request.onsuccess = () => {
          const entries = request.result as CachedData<T>[]
          const now = Date.now()
          const validEntries = entries
            .filter(entry => now <= entry.expiresAt)
            .map(entry => entry.data)
          resolve(validEntries)
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error(`Failed to get all from ${storeName}:`, error)
      return []
    }
  }

  async delete(storeName: StoreName, key: string): Promise<void> {
    try {
      const db = await this.ensureDb()
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)

      return new Promise((resolve, reject) => {
        const request = store.delete(key)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error(`Failed to delete ${key} from ${storeName}:`, error)
    }
  }

  async clear(storeName: StoreName): Promise<void> {
    try {
      const db = await this.ensureDb()
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)

      return new Promise((resolve, reject) => {
        const request = store.clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error(`Failed to clear ${storeName}:`, error)
    }
  }

  // Check if we're online
  isOnline(): boolean {
    return navigator.onLine
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage()

// Career-specific helpers
export const careerOfflineCache = {
  async cacheCareerPlan(plan: any): Promise<void> {
    if (!plan) return
    await offlineStorage.set(STORES.careerPlan, 'active', plan, 7 * 24 * 60 * 60 * 1000) // 7 days
  },

  async getCachedCareerPlan(): Promise<any | null> {
    return offlineStorage.get(STORES.careerPlan, 'active')
  },

  async cacheSkillsAnalysis(analysis: any): Promise<void> {
    if (!analysis) return
    await offlineStorage.set(STORES.skillsAnalysis, analysis.id || 'latest', analysis, 7 * 24 * 60 * 60 * 1000)
  },

  async getCachedSkillsAnalysis(): Promise<any | null> {
    return offlineStorage.get(STORES.skillsAnalysis, 'latest')
  },

  async cacheNetworkContacts(contacts: any[]): Promise<void> {
    await offlineStorage.set(STORES.networkContacts, 'all', contacts, 24 * 60 * 60 * 1000) // 24 hours
  },

  async getCachedNetworkContacts(): Promise<any[]> {
    return await offlineStorage.get(STORES.networkContacts, 'all') || []
  },

  async cacheMilestones(milestones: any[]): Promise<void> {
    await offlineStorage.set(STORES.milestones, 'all', milestones, 7 * 24 * 60 * 60 * 1000)
  },

  async getCachedMilestones(): Promise<any[]> {
    return await offlineStorage.get(STORES.milestones, 'all') || []
  },

  // Set last sync timestamp
  async setLastSync(): Promise<void> {
    await offlineStorage.set(STORES.metadata, 'lastSync', Date.now(), 365 * 24 * 60 * 60 * 1000)
  },

  async getLastSync(): Promise<number | null> {
    return offlineStorage.get(STORES.metadata, 'lastSync')
  }
}

export default offlineStorage
