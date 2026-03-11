/**
 * Hook for auto-saving CV data
 * Two-tier strategy: localStorage (immediate) + server (debounced)
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cvApi } from '@/services/supabaseApi'
import { useCVStore } from '@/stores/cvStore'
import type { CVData } from '@/services/supabaseApi'

interface UseCVAutoSaveReturn {
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  lastSavedAt: Date | null
  hasUnsavedChanges: boolean
  triggerSave: () => void
  pendingCount: number
  isOnline: boolean
}

export function useCVAutoSave(data: CVData): UseCVAutoSaveReturn {
  const queryClient = useQueryClient()
  const { markSaving, markSaved, markError, markUnsaved, setPendingCount, lastSavedAt, saveStatus, hasUnsavedChanges, pendingCount } = useCVStore()
  
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const pendingQueue = useRef<CVData[]>([])
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Track online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Try to flush queue when back online
      if (pendingQueue.current.length > 0) {
        flushQueue()
      }
    }
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  // Server mutation with retry
  const { mutate: saveToServer } = useMutation({
    mutationFn: cvApi.updateCV,
    onSuccess: () => {
      markSaved()
      queryClient.invalidateQueries({ queryKey: ['cv'] })
      setPendingCount(0)
      // Clear localStorage draft on successful save
      localStorage.removeItem('cv-draft')
      localStorage.setItem('cv-last-saved', Date.now().toString())
    },
    onError: (error: any) => {
      console.error('Auto-save failed:', error)
      markError()
      // Add to pending queue for retry
      if (data) {
        pendingQueue.current.push(data)
        setPendingCount(pendingQueue.current.length)
      }
    },
    onSettled: () => {
      // Queue is processed
    },
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.status >= 400 && error?.status < 500) return false
      return failureCount < 3
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  })
  
  // Flush pending queue
  const flushQueue = useCallback(() => {
    if (pendingQueue.current.length === 0) return
    
    // Get most recent data
    const latest = pendingQueue.current[pendingQueue.current.length - 1]
    pendingQueue.current = []
    setPendingCount(0)
    saveToServer(latest)
  }, [saveToServer, setPendingCount])
  
  // Immediate localStorage save
  const saveToLocalStorage = useCallback((cvData: CVData) => {
    try {
      localStorage.setItem('cv-draft', JSON.stringify({
        ...cvData,
        _timestamp: Date.now(),
      }))
    } catch (e) {
      console.error('Failed to save to localStorage:', e)
    }
  }, [])
  
  // Debounced server save
  const triggerSave = useCallback(() => {
    markUnsaved()
    
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    
    // Save to localStorage immediately
    saveToLocalStorage(data)
    
    // Debounced server save
    debounceTimer.current = setTimeout(() => {
      if (!isOnline) {
        // Queue for later if offline
        pendingQueue.current.push(data)
        setPendingCount(pendingQueue.current.length)
        markError()
        return
      }
      
      markSaving()
      saveToServer(data)
    }, 2000) // 2 second debounce
  }, [data, isOnline, markSaving, markUnsaved, saveToLocalStorage, saveToServer])
  
  // Auto-save when data changes
  useEffect(() => {
    triggerSave()
    
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [data, triggerSave])
  
  // Save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      
      // Try to sync to server if possible
      if (data && isOnline && saveStatus === 'saving') {
        // Use sendBeacon for reliable delivery
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
        navigator.sendBeacon?.('/api/cv', blob)
      }
      
      // Ensure localStorage is saved
      saveToLocalStorage(data)
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [data, isOnline, saveStatus, saveToLocalStorage])
  
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
 * Only returns draft if it contains meaningful unsaved data
 */
export function useCVDraft() {
  const { setHasDraft } = useCVStore()
  
  const restoreDraft = useCallback((): CVData | null => {
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
        // If server save happened after draft was created, draft is stale
        if (lastSavedTime > (_timestamp || 0)) {
          localStorage.removeItem('cv-draft')
          return null
        }
      }
      
      // Check if draft has meaningful content (not just empty fields)
      const hasContent = Object.entries(data).some(([key, value]) => {
        // Skip metadata fields
        if (key.startsWith('_')) return false
        
        if (typeof value === 'string') return value.trim().length > 0
        if (Array.isArray(value)) return value.length > 0
        return value != null
      })
      
      if (!hasContent) {
        localStorage.removeItem('cv-draft')
        return null
      }
      
      setHasDraft(true)
      return data as CVData
    } catch {
      return null
    }
  }, [setHasDraft])
  
  const clearDraft = useCallback(() => {
    localStorage.removeItem('cv-draft')
    localStorage.removeItem('cv-last-saved')
    setHasDraft(false)
  }, [setHasDraft])
  
  return { restoreDraft, clearDraft }
}
