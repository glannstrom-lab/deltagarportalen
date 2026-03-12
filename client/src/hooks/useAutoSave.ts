/**
 * Improved Auto Save Hook
 * Förbättrad auto-save med recovery, retry-logik och status-indikering
 */

import { useState, useEffect, useRef, useCallback } from 'react'

interface AutoSaveOptions<T> {
  key: string
  saveFn: (data: T) => Promise<void>
  validateFn?: (data: T) => { valid: boolean; error?: string }
  onError?: (error: Error) => void
  onSuccess?: () => void
  debounceMs?: number
  maxRetries?: number
}

interface AutoSaveState {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved: Date | null
  error: string | null
  retryCount: number
}

export function useAutoSave<T>(
  data: T,
  options: AutoSaveOptions<T>
) {
  const {
    key,
    saveFn,
    validateFn,
    onError,
    onSuccess,
    debounceMs = 3000,
    maxRetries = 3
  } = options

  const [state, setState] = useState<AutoSaveState>({
    status: 'idle',
    lastSaved: null,
    error: null,
    retryCount: 0
  })

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingDataRef = useRef<T | null>(null)
  const hasRestoredRef = useRef(false)

  // Spara till localStorage för recovery
  const saveToLocalStorage = useCallback((dataToSave: T) => {
    try {
      localStorage.setItem(`${key}-pending`, JSON.stringify({
        data: dataToSave,
        timestamp: Date.now()
      }))
    } catch (e) {
      console.warn('Kunde inte spara till localStorage:', e)
    }
  }, [key])

  // Hämta från localStorage vid återställning
  const restoreFromLocalStorage = useCallback((): { data: T; timestamp: number } | null => {
    try {
      const stored = localStorage.getItem(`${key}-pending`)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.warn('Kunde inte läsa från localStorage:', e)
    }
    return null
  }, [key])

  // Rensa localStorage
  const clearLocalStorage = useCallback(() => {
    try {
      localStorage.removeItem(`${key}-pending`)
    } catch (e) {
      console.warn('Kunde inte rensa localStorage:', e)
    }
  }, [key])

  // Återställ vid mount
  useEffect(() => {
    if (hasRestoredRef.current) return
    
    const restored = restoreFromLocalStorage()
    if (restored) {
      const hoursSince = (Date.now() - restored.timestamp) / (1000 * 60 * 60)
      // Varna användaren om osparad data om det är inom 24 timmar
      if (hoursSince < 24) {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: `Hittade osparad data från ${Math.round(hoursSince * 10) / 10} timmar sedan. Klicka på Återställ för att hämta den.`,
          lastSaved: new Date(restored.timestamp)
        }))
      } else {
        // Rensa gammal data
        clearLocalStorage()
      }
    }
    
    hasRestoredRef.current = true
  }, [restoreFromLocalStorage, clearLocalStorage])

  // Cleanup vid unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Retry-funktion
  const retry = useCallback(async () => {
    if (pendingDataRef.current && state.retryCount < maxRetries) {
      setState(prev => ({
        ...prev,
        status: 'saving',
        retryCount: prev.retryCount + 1
      }))
      
      try {
        await saveFn(pendingDataRef.current)
        clearLocalStorage()
        setState({
          status: 'saved',
          lastSaved: new Date(),
          error: null,
          retryCount: 0
        })
        onSuccess?.()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Osparat - försöker igen...'
        setState(prev => ({
          ...prev,
          status: 'error',
          error: errorMessage
        }))
        onError?.(error instanceof Error ? error : new Error(String(error)))
      }
    }
  }, [saveFn, clearLocalStorage, onSuccess, onError, state.retryCount, maxRetries])

  // Huvudsparningslogik
  useEffect(() => {
    // Validera data om validator finns
    if (validateFn) {
      const validation = validateFn(data)
      if (!validation.valid) {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: validation.error || 'Ogiltig data'
        }))
        return
      }
    }

    // Rensa tidigare timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Spara till localStorage för recovery
    saveToLocalStorage(data)
    pendingDataRef.current = data

    // Sätt ny timeout
    setState(prev => ({ ...prev, status: 'saving' }))
    
    timeoutRef.current = setTimeout(async () => {
      try {
        await saveFn(data)
        clearLocalStorage()
        setState({
          status: 'saved',
          lastSaved: new Date(),
          error: null,
          retryCount: 0
        })
        onSuccess?.()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Kunde inte spara'
        setState({
          status: 'error',
          lastSaved: null,
          error: errorMessage,
          retryCount: 0
        })
        onError?.(error instanceof Error ? error : new Error(String(error)))
      }
    }, debounceMs)
  }, [data, saveFn, validateFn, debounceMs, saveToLocalStorage, clearLocalStorage, onSuccess, onError])

  // Manuell sparning
  const saveImmediately = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setState(prev => ({ ...prev, status: 'saving' }))

    try {
      await saveFn(data)
      clearLocalStorage()
      setState({
        status: 'saved',
        lastSaved: new Date(),
        error: null,
        retryCount: 0
      })
      onSuccess?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Kunde inte spara'
      setState({
        status: 'error',
        lastSaved: null,
        error: errorMessage,
        retryCount: 0
      })
      onError?.(error instanceof Error ? error : new Error(String(error)))
    }
  }, [data, saveFn, clearLocalStorage, onSuccess, onError])

  // Återställ från localStorage
  const restoreData = useCallback((): T | null => {
    const restored = restoreFromLocalStorage()
    if (restored) {
      clearLocalStorage()
      setState({
        status: 'idle',
        lastSaved: null,
        error: null,
        retryCount: 0
      })
      return restored.data
    }
    return null
  }, [restoreFromLocalStorage, clearLocalStorage])

  return {
    ...state,
    retry,
    saveImmediately,
    restoreData,
    isSaving: state.status === 'saving',
    isSaved: state.status === 'saved',
    hasError: state.status === 'error'
  }
}

export default useAutoSave
