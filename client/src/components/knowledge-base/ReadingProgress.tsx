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
  const [showReminder, setShowReminder] = useState(false)
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
          storageLogger.error('Failed to load reading progress:', err)
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
        storageLogger.error('Failed to save reading progress:', err)
      }
    }
  }, [articleId])

  useEffect(() => {
    if (isLoading) return

    let reminderTimeout: NodeJS.Timeout | null = null
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

      // Show reminder after 10 minutes
      if (scrollPercent < 100 && scrollPercent > 0) {
        if (reminderTimeout) clearTimeout(reminderTimeout)
        reminderTimeout = setTimeout(() => setShowReminder(true), 10 * 60 * 1000)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (reminderTimeout) clearTimeout(reminderTimeout)
      if (saveTimeout) clearTimeout(saveTimeout)
    }
  }, [articleId, isLoading, saveProgress])

  const handlePause = async () => {
    setShowReminder(false)
    try {
      await articleProgressApi.pause(articleId)
    } catch (err: unknown) {
      // Tyst ignorera RLS-policy fel
      const dbError = err as DatabaseError
      if (dbError?.code === '42501' || dbError?.message?.includes('row-level security')) {
        storageLogger.debug('Reading progress: RLS policy prevents pause save (non-critical)')
      } else {
        storageLogger.error('Failed to save pause state:', err)
      }
    }
  }

  if (progress === 0) return null

  return (
    <>
      {/* Fixed progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-200 z-50">
        <div 
          className="h-full bg-teal-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Reading reminder */}
      {showReminder && progress < 100 && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-50 animate-slide-up">
          <p className="text-sm text-slate-700 mb-2">
            Du har läst {progress}% av artikeln. Vill du ta en paus eller fortsätta?
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowReminder(false)}
              className="px-3 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700"
            >
              Fortsätt läsa
            </button>
            <button 
              onClick={handlePause}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200"
            >
              Pausa
            </button>
          </div>
        </div>
      )}
    </>
  )
}
