/**
 * Hook for auto-saving CV data
 * Two-tier strategy: localStorage (immediate) + server (debounced)
 */

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cvApi } from '@/services/supabaseApi'
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

export function useCVAutoSave(currentData: CVData): UseCVAutoSaveReturn {
  const queryClient = useQueryClient()
  const { markSaving, markSaved, markError, markUnsaved, setPendingCount, lastSavedAt, saveStatus, hasUnsavedChanges, pendingCount } = useCVStore()
  const { trackCVUpdate } = useAchievementTracker()

  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const pendingQueue = useRef<CVData[]>([])
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
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
    },
    onError: (error: any) => {
      console.error('CV auto-save failed:', error?.message || 'Unknown error')
      markError()
      if (currentData) {
        pendingQueue.current.push(currentData)
        setPendingCount(pendingQueue.current.length)
      }
    },
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) return false
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
  
  // Save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      // Save to localStorage
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
    
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    
    // Save to localStorage immediately
    try {
      localStorage.setItem('cv-draft', JSON.stringify({
        ...dataToSave,
        _timestamp: Date.now(),
      }))
    } catch { }
    
    // Debounced server save
    debounceTimer.current = setTimeout(() => {
      
      if (!isOnline) {
        pendingQueue.current.push(dataToSave)
        setPendingCount(pendingQueue.current.length)
        markError()
        return
      }
      
      markSaving()
      saveToServer(dataToSave)
    }, 2000)
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
