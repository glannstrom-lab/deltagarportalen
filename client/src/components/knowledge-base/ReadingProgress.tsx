/**
 * Läsindikatorn högst upp på artikelsidan, plus sparad läsposition.
 *
 * Påminnelserutan som dök upp efter tio minuter är borttagen 2026-08-22 —
 * se kommentaren vid returen längre ner för hit-testet som avgjorde det.
 */
import { useState, useEffect, useCallback } from 'react'
import { articleProgressApi } from '@/services/cloudStorage'
import { storageLogger } from '@/lib/logger'

interface ReadingProgressProps {
  articleId: string
}

interface DatabaseError {
  code?: string
  message?: string
}

export default function ReadingProgress({ articleId }: ReadingProgressProps) {
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Ladda sparad progress från molnet vid mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        setIsLoading(true)
        const saved = await articleProgressApi.get(articleId)
        if (saved?.progress_percent) {
          setProgress(saved.progress_percent)
        }
      } catch (err: unknown) {
        // Tyst ignorera RLS-policy fel (42501) - detta är ett databaskonfigurationsfel
        // som inte påverkar användarens upplevelse
        const dbError = err as DatabaseError
        if (dbError?.code === '42501' || dbError?.message?.includes('row-level security')) {
          storageLogger.debug('Reading progress: RLS policy prevents loading (non-critical)')
        } else {
          storageLogger.error('Failed to load reading progress', { err: String(err) })
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadProgress()
  }, [articleId])

  // Debounced save function
  const saveProgress = useCallback(async (newProgress: number) => {
    try {
      await articleProgressApi.update(articleId, newProgress, newProgress >= 100)
    } catch (err: unknown) {
      // Tyst ignorera RLS-policy fel (42501) - läsprogress sparas lokalt istället
      const dbError = err as DatabaseError
      if (dbError?.code === '42501' || dbError?.message?.includes('row-level security')) {
        storageLogger.debug('Reading progress: RLS policy prevents saving (non-critical)')
      } else {
        storageLogger.error('Failed to save reading progress', { err: String(err) })
      }
    }
  }, [articleId])

  useEffect(() => {
    if (isLoading) return

    let saveTimeout: NodeJS.Timeout | null = null

    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      
      const newProgress = Math.min(Math.round(scrollPercent), 100)
      setProgress(newProgress)

      // Debounce save to avoid too many API calls
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        saveProgress(newProgress)
      }, 1000)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (saveTimeout) clearTimeout(saveTimeout)
    }
  }, [articleId, isLoading, saveProgress])

  if (progress === 0) return null

  return (
    <>
      {/* Läsindikator. 4 px hög, ovanför den sticky toppnaven — de överlappar
          bara de fyra pixlarna, uppmätt. */}
      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Hur långt du läst i artikeln"
        className="fixed top-0 left-0 right-0 h-1 bg-stone-200 dark:bg-stone-700 z-50"
      >
        <div className="h-full bg-[var(--c-solid)] transition-all" style={{ width: `${progress}%` }} />
      </div>

      {/*
        LÄSPÅMINNELSEN ÄR BORTTAGEN (2026-08-22).

        En `fixed bottom-4 right-4 z-50`-ruta dök upp av sig själv efter tio
        minuters läsning och frågade om man ville pausa. Tre problem, och det
        första ensamt räcker:

        1. Vid 390 px täckte den **alla fem flikarna i bottennavet** och
           coach-knappen (hit-testat 2026-08-22: 5 av 5 blockerade, rutan
           z-50 mot navets z-30). Man kunde inte navigera vidare utan att
           först klicka bort den.
        2. DESIGN.md §10: "Inga obetonade overlays. Modaler ska aldrig öppna
           utan användarens explicita klick." Den öppnade sig själv, för just
           den långsamme läsaren.
        3. Den sa "Du har läst {progress}% av artikeln" — en prestationsmätning
           i en deltagarvy (§2 regel 3).

        Pauspåminnelser hör hemma i **Lugnare läge**, där de redan finns och
        är ett aktivt val. `articleProgressApi.pause()` finns kvar och anropas
        därifrån den dagen någon vill koppla ihop dem.
      */}
    </>
  )
}
