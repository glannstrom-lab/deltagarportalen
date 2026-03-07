/**
 * Update Notification Component
 * 
 * Shows a toast notification when a new app version is available
 */

import { useServiceWorker } from '@/hooks/useServiceWorker'
import { Button } from './ui'
import { RefreshCw, X } from 'lucide-react'
import { useState, useEffect } from 'react'

export function UpdateNotification() {
  const { updateAvailable, update, isOffline } = useServiceWorker()
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    if (updateAvailable && !isDismissed) {
      // Small delay to not interrupt user immediately
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [updateAvailable, isDismissed])

  const handleUpdate = () => {
    update()
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
  }

  const handleOfflineDismiss = () => {
    setIsVisible(false)
  }

  // Show offline notification
  if (isOffline && !isDismissed) {
    return (
      <div
        role="alert"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-4"
      >
        <span className="text-sm">
          Du är offline. Vissa funktioner kan vara begränsade.
        </span>
        <button
          onClick={handleOfflineDismiss}
          className="p-1 hover:bg-slate-700 rounded"
          aria-label="Stäng"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // Show update notification
  if (!isVisible) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-violet-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-4 animate-in slide-in-from-bottom-4"
    >
      <div className="flex items-center gap-2">
        <RefreshCw className="w-5 h-5" aria-hidden="true" />
        <span className="text-sm font-medium">
          En ny version är tillgänglig
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          onClick={handleUpdate}
          size="sm"
          className="bg-white text-violet-600 hover:bg-violet-50 h-8"
        >
          Uppdatera
        </Button>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-violet-700 rounded"
          aria-label="Stäng"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default UpdateNotification
