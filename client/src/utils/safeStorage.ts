/**
 * Safe LocalStorage wrapper with XSS protection and error handling
 * Sanitizes all data going in and out of localStorage
 */

import { sanitizeInput, safeJsonStringify } from './security'

class SafeStorage {
  private prefix = 'dp_'

  /**
   * Set an item in localStorage with sanitization
   */
  setItem(key: string, value: unknown): boolean {
    try {
      const sanitizedKey = this.sanitizeKey(key)
      let sanitizedValue: string

      if (typeof value === 'string') {
        // Sanitize string values
        sanitizedValue = sanitizeInput(value)
      } else {
        // For objects, use safe JSON stringify
        sanitizedValue = safeJsonStringify(value)
      }

      localStorage.setItem(this.prefix + sanitizedKey, sanitizedValue)
      return true
    } catch (error) {
      console.error('SafeStorage setItem error:', error)
      return false
    }
  }

  /**
   * Get an item from localStorage
   */
  getItem<T = string>(key: string, defaultValue?: T): T | null {
    try {
      const sanitizedKey = this.sanitizeKey(key)
      const item = localStorage.getItem(this.prefix + sanitizedKey)

      if (item === null) {
        return defaultValue ?? null
      }

      // Try to parse as JSON first
      try {
        return JSON.parse(item) as T
      } catch {
        // Return as string if not valid JSON
        return item as unknown as T
      }
    } catch (error) {
      console.error('SafeStorage getItem error:', error)
      return defaultValue ?? null
    }
  }

  /**
   * Remove an item from localStorage
   */
  removeItem(key: string): boolean {
    try {
      const sanitizedKey = this.sanitizeKey(key)
      localStorage.removeItem(this.prefix + sanitizedKey)
      return true
    } catch (error) {
      console.error('SafeStorage removeItem error:', error)
      return false
    }
  }

  /**
   * Clear all items with our prefix
   */
  clear(): boolean {
    try {
      const keysToRemove: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key))
      return true
    } catch (error) {
      console.error('SafeStorage clear error:', error)
      return false
    }
  }

  /**
   * Clear all items except those matching the given keys
   */
  clearExcept(keepKeys: string[]): boolean {
    try {
      const keysToRemove: string[] = []
      const prefixedKeepKeys = keepKeys.map(k => this.prefix + this.sanitizeKey(k))
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.prefix) && !prefixedKeepKeys.includes(key)) {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key))
      return true
    } catch (error) {
      console.error('SafeStorage clearExcept error:', error)
      return false
    }
  }

  /**
   * Check if a key exists
   */
  has(key: string): boolean {
    return this.getItem(key) !== null
  }

  /**
   * Get all keys with our prefix
   */
  keys(): string[] {
    const keys: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(this.prefix)) {
        keys.push(key.slice(this.prefix.length))
      }
    }

    return keys
  }

  /**
   * Sanitize storage key
   */
  private sanitizeKey(key: string): string {
    // Remove any characters that could be used for injection
    return key.replace(/[^a-zA-Z0-9_-]/g, '_')
  }
}

// Export singleton instance
export const safeStorage = new SafeStorage()

// Convenience exports
export const safeLocalStorage = {
  getItem: safeStorage.getItem.bind(safeStorage),
  setItem: safeStorage.setItem.bind(safeStorage),
  removeItem: safeStorage.removeItem.bind(safeStorage),
  clear: safeStorage.clear.bind(safeStorage),
}
