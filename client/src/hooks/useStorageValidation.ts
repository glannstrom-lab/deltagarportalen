/**
 * Hook for validating localStorage data on app startup
 * Cleans up any corrupted data automatically
 */

import { useEffect, useRef } from 'react'
import { validatedStorage } from '@/lib/validatedStorage'

/**
 * Validates all localStorage data on first mount
 * Should be called once in the root App component
 */
export function useStorageValidation() {
  const hasValidated = useRef(false)

  useEffect(() => {
    // Only run once on mount
    if (hasValidated.current) return
    hasValidated.current = true

    try {
      const { valid, invalid } = validatedStorage.validateAll()

      if (process.env.NODE_ENV === 'development') {
        if (valid.length > 0) {
          console.log('[Storage] Valid entries:', valid)
        }
        if (invalid.length > 0) {
          console.warn('[Storage] Removed invalid entries:', invalid)
        }
      }
    } catch (error) {
      console.error('[Storage] Validation error:', error)
    }
  }, [])
}

export default useStorageValidation
