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

/**
 * A31 (docs/review-2026-08-09/sakerhet-gdpr.md #10): deltagarens CV, personliga
 * brev och annat verktygsinnehåll skrivs på flera ställen direkt till
 * `localStorage` (utanför `safeStorage`s `dp_`-prefix) — som molnsync-fallback
 * eller som utkast. `signOut()` nollade tidigare bara zustand-state; de här
 * nycklarna blev kvar på disk. Målgruppen sitter ofta på delade datorer
 * (bibliotek, jobbcentrum), så det är ett normalfall, inte ett kantfall.
 *
 * Detta är en EXPLICIT ALLOWLIST av nycklar att rensa — inte `localStorage.clear()`.
 * Språkval, temaval och cookie-samtycke ska överleva utloggning; de är inte
 * persondata. Håll listan i synk med grep-svepet i CLAUDE.md-uppdraget A31
 * (`grep -rn "localStorage" client/src`) när nya innehållsbärande nycklar
 * tillkommer.
 */
export const USER_SCOPED_STORAGE_KEYS: readonly string[] = [
  // stores/authStore.ts zustand-persist ('partialize' skriver { profile, isAuthenticated }
  // hit på VARJE state-ändring). Profilen innehåller namn, telefon, bio, ort,
  // önskade yrken m.m. — trots kommentaren "only non-sensitive state" i koden.
  // signOut() nollar profile i state EFTER ett lyckat Supabase-anrop, vilket
  // skriver om denna nyckel med profile:null — men om anropet kastar innan dess
  // (catch-grenen) hade nyckeln annars blivit kvar med hela profilen. Rensas
  // därför explicit här också, innan Supabase-anropet ens görs.
  'auth-storage',
  // CV (services/cloudStorage.ts, components/cv/MyCVs.tsx, hooks/useCVAutoSave.ts)
  'cv-edit-version',
  'cv-draft',
  'cv-last-saved',
  'cv-data',
  'default_cv_id',
  // Personligt brev (hooks/useAutoSave.ts nyckel satt av CoverLetterWrite.tsx)
  'cover-letter-write-draft',
  // Spontanansökan (lib/spontaneousFocusDraft.ts)
  'spontaneous-focus-draft',
  // Jobbsökning / ansökningar
  'job-applications-crm',
  'platsbanken_saved_jobs',
  'platsbanken_saved_searches',
  // Intresseguide
  'interest-guide-share',
  'interest-result',
  // Wellness / dagbok / kalender
  'wellness_data',
  'dailyTaskDate',
  'dailyTaskIndex',
  'dailyTaskCompleted',
  'energy-level',
  'calendar_events',
  'calendar_goals',
  'calendar_mood_entries',
  'content-calendar',
  // Personligt varumärke
  'brand-audit-answers',
  'portfolio-items',
  'elevator-pitches',
  'visibility-progress',
  // Övriga verktygssvar/checklistor med deltagarinnehåll
  'article_bookmarks',
  'article-bookmarks',
  'article_checklists',
  'integration-checklist',
  'negotiationChecklist',
  'culture-preferences',
  'dashboard_preferences',
  'user_preferences',
] as const

/**
 * Rensar allt deltagarinnehåll ur localStorage vid utloggning. Anropas från
 * `authStore.signOut()` — portalens enda logout-väg (Sidebar + TopBar går
 * båda via `useAuthStore().signOut()`). Rör INTE `dp_`-prefixade nycklar
 * (redan hanterade av `safeStorage`), språkval, temaval eller cookie-samtycke.
 */
export function clearUserScopedStorage(): void {
  for (const key of USER_SCOPED_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key)
    } catch {
      // localStorage kan vara otillgängligt (privat läge) — best effort
    }
  }
}
