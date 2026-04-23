/**
 * Auto Save Hook
 * Auto-save till localStorage med recovery och restore
 */

import { useState, useEffect, useRef, useCallback } from 'react'

interface AutoSaveOptions<T> {
  key: string
  data: T
  onRestore?: (data: T) => void
  debounceMs?: number
}

export function useAutoSave<T>(options: AutoSaveOptions<T>) {
  const { key, data, onRestore, debounceMs = 1000 } = options

  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasRestoredData, setHasRestoredData] = useState(false)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasRestoredRef = useRef(false)
  const isFirstRenderRef = useRef(true)

  // Spara till localStorage
  const saveToLocalStorage = useCallback((dataToSave: T) => {
    try {
      localStorage.setItem(key, JSON.stringify({
        data: dataToSave,
        timestamp: Date.now()
      }))
      setLastSaved(new Date())
    } catch (e) {
      console.warn('Kunde inte spara till localStorage:', e)
    }
  }, [key])

  // Hämta från localStorage
  const getFromLocalStorage = useCallback((): { data: T; timestamp: number } | null => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.warn('Kunde inte läsa från localStorage:', e)
    }
    return null
  }, [key])

  // Rensa localStorage
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(key)
      setLastSaved(null)
      setHasRestoredData(false)
    } catch (e) {
      console.warn('Kunde inte rensa localStorage:', e)
    }
  }, [key])

  // Återställ vid mount
  useEffect(() => {
    if (hasRestoredRef.current) return
    hasRestoredRef.current = true

    const restored = getFromLocalStorage()
    if (restored && onRestore) {
      const hoursSince = (Date.now() - restored.timestamp) / (1000 * 60 * 60)
      // Återställ om data är yngre än 24 timmar
      if (hoursSince < 24) {
        onRestore(restored.data)
        setLastSaved(new Date(restored.timestamp))
        setHasRestoredData(true)
      } else {
        // Rensa gammal data
        clearSavedData()
      }
    }
  }, [getFromLocalStorage, onRestore, clearSavedData])

  // Cleanup vid unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Auto-save med debounce
  useEffect(() => {
    // Hoppa över första renderingen för att undvika att skriva över återställd data
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }

    // Rensa tidigare timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setIsSaving(true)

    timeoutRef.current = setTimeout(() => {
      saveToLocalStorage(data)
      setIsSaving(false)
    }, debounceMs)
  }, [data, debounceMs, saveToLocalStorage])

  return {
    lastSaved,
    isSaving,
    hasRestoredData,
    clearSavedData
  }
}

export default useAutoSave
