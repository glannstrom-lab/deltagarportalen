/**
 * Hook for auto-saving CV data.
 *
 * Strategi: server (debounced) är primär persistens. Som lokal fallback för
 * tab-refresh och offline-redigering används sessionStorage — INTE localStorage.
 *
 * Skälet är GDPR/säkerhet: målgruppen använder ofta delade datorer (bibliotek,
 * AF-besökerdatorer) där localStorage överlever inloggningar och läcker
 * föregående användares CV (namn, jobbhistorik, kontaktuppgifter) till nästa.
 * sessionStorage är tab-isolerad och rensas när fliken stängs — inget
 * cross-user-läckage.
 *
 * Ändrat 2026-05-09 (säkerhetsrevision, HIGH-2026-05-002).
 */

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cvApi } from '@/services/cvApi'
import { userApi } from '@/services/userApi'
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
  /** Sant om en annan flik sparat samma CV efter att den här fliken senast sparade. */
  hasRemoteChanges: boolean
}

/**
 * BroadcastChannel-namn för cross-tab CV-save-events. Varje gång en flik
 * sparat ett CV broadcastar den `{ savedAt: number }` så andra flikar vet
 * att deras lokala state nu är inaktuell.
 */
const CV_BROADCAST_CHANNEL = 'cv-autosave-sync'

interface CVBroadcastMessage {
  type: 'saved'
  savedAt: number
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
  const [hasRemoteChanges, setHasRemoteChanges] = useState(false)
  const pendingQueue = useRef<CVData[]>([])
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingData = useRef<CVData | null>(null)  // senaste data som väntar på server-flush
  const isFirstRender = useRef(true)
  const lastSavedData = useRef<CVData | null>(null)
  const lastTrackedTime = useRef<number>(0)
  const ownLastSaveAt = useRef<number>(0)
  const broadcastChannel = useRef<BroadcastChannel | null>(null)
  
  // Server mutation with retry
  const { mutate: saveToServer } = useMutation({
    mutationFn: cvApi.updateCV,
    onSuccess: () => {
      markSaved()
      queryClient.invalidateQueries({ queryKey: ['cv'] })
      setPendingCount(0)
      // Rensa session-draft eftersom server är synkad. Vi sparar bara en
      // boolean-flagga ("användaren har CV") i localStorage — INGEN PII.
      try { sessionStorage.removeItem('cv-draft') } catch { /* ignore */ }
      const savedAt = Date.now()
      try { localStorage.setItem('cv-last-saved', savedAt.toString()) } catch { /* ignore */ }
      ownLastSaveAt.current = savedAt
      lastSavedData.current = currentData
      // Broadcast till andra flikar så de vet att deras state är gammalt.
      try {
        broadcastChannel.current?.postMessage({ type: 'saved', savedAt } as CVBroadcastMessage)
      } catch { /* ignore */ }

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
        // Boolean-flagga (NOT PII) som dashboard/onboarding läser för att veta
        // om användaren har ett CV. Tidigare lagrade vi hela CV:t här — det var
        // GDPR-läckan. '1' räcker för truthiness-kontroller.
        try { localStorage.setItem('cv-data', '1') } catch { /* ignore */ }
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

  // Cross-tab sync: lyssna på BroadcastChannel. Om en annan flik sparat
  // efter vår senaste egna save, markera som hasRemoteChanges så CVBuilder
  // kan visa varning. ownLastSaveAt skyddar mot egen-eko från postMessage.
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel(CV_BROADCAST_CHANNEL)
    broadcastChannel.current = channel
    channel.onmessage = (event: MessageEvent<CVBroadcastMessage>) => {
      if (event.data?.type !== 'saved') return
      if (!event.data.savedAt) return
      // Eget save-event från egen flik — ignorera (BroadcastChannel skickar
      // INTE till sig själv enligt spec, men dubbelkolla för säkerhets skull).
      if (event.data.savedAt === ownLastSaveAt.current) return
      // Annan flik har sparat efter vår senaste — vi är inaktuella.
      if (event.data.savedAt > ownLastSaveAt.current) {
        setHasRemoteChanges(true)
      }
    }
    return () => {
      channel.close()
      broadcastChannel.current = null
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

  // Sista utvägen: spara draft till sessionStorage vid sidstängning så draft kan
  // återställas i samma flik (efter F5/krasch). sessionStorage är tab-isolerad
  // och rensas automatiskt när fliken stängs — ingen cross-user-läcka på
  // delade datorer. Detta är fallback för fall där visibilitychange inte hann
  // skicka till server.
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      try {
        sessionStorage.setItem('cv-draft', JSON.stringify({
          ...currentData,
          _timestamp: Date.now(),
        }))
      } catch {
        // sessionStorage may be unavailable
      }
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

    // Save to sessionStorage immediately (fallback om server-sync failar).
    // sessionStorage är tab-isolerad så ingen risk att läcka PII till nästa
    // användare på delade datorer.
    try {
      sessionStorage.setItem('cv-draft', JSON.stringify({
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
    hasRemoteChanges,
  }
}

/**
 * Hook to restore draft from sessionStorage. Migrerar/rensar bort eventuell
 * gammal localStorage-draft (kvar från före 2026-05-09 GDPR-fixen).
 */
export function useCVDraft() {
  const { setHasDraft } = useCVStore()

  const restoreDraft = (): CVData | null => {
    // Rensa bort gammal localStorage-draft om någon klient fortfarande har det
    // kvar från en tidigare version. Detta är säkerhetsmigreringen.
    try { localStorage.removeItem('cv-draft') } catch { /* ignore */ }
    try { localStorage.removeItem('cv-data') } catch { /* ignore */ }

    try {
      const draft = sessionStorage.getItem('cv-draft')
      if (!draft) return null

      const parsed = JSON.parse(draft)
      const { _timestamp, ...data } = parsed

      // Check if draft is newer than 7 days
      const age = Date.now() - (_timestamp || 0)
      if (age > 7 * 24 * 60 * 60 * 1000) {
        sessionStorage.removeItem('cv-draft')
        return null
      }

      // Check if draft is newer than last server save
      const lastSaved = localStorage.getItem('cv-last-saved')
      if (lastSaved) {
        const lastSavedTime = parseInt(lastSaved)
        if (lastSavedTime > (_timestamp || 0)) {
          sessionStorage.removeItem('cv-draft')
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
    try { sessionStorage.removeItem('cv-draft') } catch { /* ignore */ }
    try { localStorage.removeItem('cv-draft') } catch { /* ignore */ }
    try { localStorage.removeItem('cv-last-saved') } catch { /* ignore */ }
    setHasDraft(false)
  }

  return { restoreDraft, clearDraft }
}
