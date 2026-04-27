/**
 * Hook for auto-saving CV data
 * Two-tier strategy: localStorage (immediate) + server (debounced)
 */

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cvApi, userApi } from '@/services/supabaseApi'
import { useCVStore } from '@/stores/cvStore'
import type { CVData } from '@/services/supabaseApi'
import { useAchievementTracker } from './useAchievementTracker'

interface UseCVAutoSaveReturn {
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  lastSavedAt: Date | null
  hasUnsavedChanges: boolean
  triggerSave: (data: CVData) => void
  pendingCount: number
  isOnline: boolean
}

/**
 * Debounce-fönster: kompromiss mellan API-spam och dataförlust-risk.
 * 800ms = ungefär ett tangenttryck-paus, ger ~2.5x snabbare server-sync än
 * tidigare 2000ms vilket minskar fönstret där lokala ändringar inte nått molnet.
 */
const SAVE_DEBOUNCE_MS = 800

export function useCVAutoSave(currentData: CVData): UseCVAutoSaveReturn {
  const queryClient = useQueryClient()
  const { markSaving, markSaved, markError, markUnsaved, setPendingCount, lastSavedAt, saveStatus, hasUnsavedChanges, pendingCount } = useCVStore()
  const { trackCVUpdate } = useAchievementTracker()

  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const pendingQueue = useRef<CVData[]>([])
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingData = useRef<CVData | null>(null)  // senaste data som väntar på server-flush
  const isFirstRender = useRef(true)
  const lastSavedData = useRef<CVData | null>(null)
  const lastTrackedTime = useRef<number>(0)
  
  // Server mutation with retry
  const { mutate: saveToServer } = useMutation({
    mutationFn: cvApi.updateCV,
    onSuccess: () => {
      markSaved()
      queryClient.invalidateQueries({ queryKey: ['cv'] })
      setPendingCount(0)
      localStorage.removeItem('cv-draft')
      localStorage.setItem('cv-last-saved', Date.now().toString())
      lastSavedData.current = currentData

      // Track CV update achievement (throttled to once per 30 seconds)
      const now = Date.now()
      if (now - lastTrackedTime.current > 30000) {
        lastTrackedTime.current = now
        trackCVUpdate()
      }

      // Mark CV onboarding step as complete in cloud (if CV has meaningful content)
      if (currentData?.firstName || currentData?.workExperience?.length || currentData?.skills?.length) {
        userApi.updateOnboardingStep('cv', true).catch(err => {
          console.error('Error updating onboarding progress:', err)
        })
        localStorage.setItem('cv-data', JSON.stringify(currentData))
      }
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('CV auto-save failed:', errorMessage)
      markError()
      if (currentData) {
        pendingQueue.current.push(currentData)
        setPendingCount(pendingQueue.current.length)
      }
    },
    retry: (failureCount, error: unknown) => {
      const errorWithStatus = error as { status?: number }
      if (errorWithStatus?.status && errorWithStatus.status >= 400 && errorWithStatus.status < 500) return false
      return failureCount < 3
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  })
  
  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])
  
  // Flush pending server-save tidigare vid tab-switch / minimize.
  // visibilitychange triggas innan beforeunload — och är reliable på iOS Safari
  // där beforeunload ofta inte hinner köra. Om vi har pending data, skicka
  // den NU istället för att vänta på debounce-timeouten.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return
      if (!pendingData.current) return
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
        debounceTimer.current = null
      }
      if (isOnline) {
        markSaving()
        saveToServer(pendingData.current)
        pendingData.current = null
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isOnline, markSaving, saveToServer])

  // Sista utvägen: spara till localStorage vid sidstängning så draft kan återställas.
  // Detta är fallback för fall där visibilitychange inte hann skicka till server.
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      try {
        localStorage.setItem('cv-draft', JSON.stringify({
          ...currentData,
          _timestamp: Date.now(),
        }))
      } catch { }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [currentData])
  
  // Debounced save function that takes data as parameter
  const triggerSave = (dataToSave: CVData) => {
    // Skip first render (initial load)
    if (isFirstRender.current) {
      isFirstRender.current = false
      lastSavedData.current = dataToSave
      return
    }

    markUnsaved()
    pendingData.current = dataToSave  // Spara referens så visibilitychange kan flusha

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Save to localStorage immediately (fallback om server-sync failar)
    try {
      localStorage.setItem('cv-draft', JSON.stringify({
        ...dataToSave,
        _timestamp: Date.now(),
      }))
    } catch { }

    // Debounced server save (800ms, kortare än tidigare 2000ms)
    debounceTimer.current = setTimeout(() => {
      pendingData.current = null  // Server tar över — inget att flusha längre
      if (!isOnline) {
        pendingQueue.current.push(dataToSave)
        setPendingCount(pendingQueue.current.length)
        markError()
        return
      }

      markSaving()
      saveToServer(dataToSave)
    }, SAVE_DEBOUNCE_MS)
  }
  
  return {
    saveStatus,
    lastSavedAt,
    hasUnsavedChanges,
    triggerSave,
    pendingCount,
    isOnline,
  }
}

/**
 * Hook to restore draft from localStorage
 */
export function useCVDraft() {
  const { setHasDraft } = useCVStore()
  
  const restoreDraft = (): CVData | null => {
    try {
      const draft = localStorage.getItem('cv-draft')
      if (!draft) return null
      
      const parsed = JSON.parse(draft)
      const { _timestamp, ...data } = parsed
      
      // Check if draft is newer than 7 days
      const age = Date.now() - (_timestamp || 0)
      if (age > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem('cv-draft')
        return null
      }
      
      // Check if draft is newer than last server save
      const lastSaved = localStorage.getItem('cv-last-saved')
      if (lastSaved) {
        const lastSavedTime = parseInt(lastSaved)
        if (lastSavedTime > (_timestamp || 0)) {
          localStorage.removeItem('cv-draft')
          return null
        }
      }
      
      setHasDraft(true)
      return data as CVData
    } catch {
      return null
    }
  }
  
  const clearDraft = () => {
    localStorage.removeItem('cv-draft')
    localStorage.removeItem('cv-last-saved')
    setHasDraft(false)
  }
  
  return { restoreDraft, clearDraft }
}
