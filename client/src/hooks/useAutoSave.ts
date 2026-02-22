import { useState, useEffect, useCallback, useRef } from 'react'

interface UseAutoSaveOptions<T> {
  key: string
  data: T
  debounceMs?: number
  onRestore?: (data: T) => void
  enabled?: boolean
}

interface UseAutoSaveReturn<T> {
  lastSaved: Date | null
  isSaving: boolean
  hasRestoredData: boolean
  restoredData: T | null
  clearSavedData: () => void
  restoreData: () => void
}

export function useAutoSave<T extends Record<string, unknown>>({
  key,
  data,
  debounceMs = 2000,
  onRestore,
  enabled = true
}: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasRestoredData, setHasRestoredData] = useState(false)
  const [restoredData, setRestoredData] = useState<T | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasRestoredRef = useRef(false)
  const storageKey = `autosave-${key}`

  // Ladda sparad data vid mount - ENDAST EN GÅNG
  useEffect(() => {
    if (!enabled || hasRestoredRef.current) return

    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved) as T & { _timestamp: number }
        delete (parsed as Record<string, unknown>)._timestamp
        setRestoredData(parsed as T)
        setHasRestoredData(true)
        hasRestoredRef.current = true
        onRestore?.(parsed as T)
      }
    } catch (error) {
      console.error('Fel vid laddning av autosave:', error)
    }
  }, []) // Tom dependency array - körs endast vid mount

  // Spara data med debounce
  useEffect(() => {
    if (!enabled) return

    // Rensa tidigare timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Sätt ny timeout för att spara
    timeoutRef.current = setTimeout(() => {
      setIsSaving(true)
      
      try {
        const dataToSave = {
          ...data,
          _timestamp: Date.now()
        }
        localStorage.setItem(storageKey, JSON.stringify(dataToSave))
        setLastSaved(new Date())
      } catch (error) {
        console.error('Fel vid autosave:', error)
      } finally {
        setIsSaving(false)
      }
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, debounceMs, enabled, storageKey])

  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
      setRestoredData(null)
      setHasRestoredData(false)
      hasRestoredRef.current = false
      setLastSaved(null)
    } catch (error) {
      console.error('Fel vid rensning av autosave:', error)
    }
  }, [storageKey])

  const restoreData = useCallback(() => {
    if (restoredData) {
      onRestore?.(restoredData)
    }
  }, [restoredData, onRestore])

  return {
    lastSaved,
    isSaving,
    hasRestoredData,
    restoredData,
    clearSavedData,
    restoreData
  }
}

export default useAutoSave
