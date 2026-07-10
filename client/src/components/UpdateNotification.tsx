/**
 * Update Notification Component
 *
 * Visar en offline-indikator när nätverket försvinner.
 * (Uppdaterings-toasten togs bort 2026-07-10 (C2): den byggde på en
 * service worker som appen samtidigt avregistrerade — flödet kunde
 * aldrig trigga. Offline-läget behöver ingen SW.)
 */

import { X } from '@/components/ui/icons'
import { useState, useEffect } from 'react'

export function UpdateNotification() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const goOffline = () => {
      setIsOffline(true)
      setIsDismissed(false)
    }
    const goOnline = () => setIsOffline(false)

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!isOffline || isDismissed) return null

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-stone-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-4"
    >
      <span className="text-sm">
        Du är offline. Vissa funktioner kan vara begränsade.
      </span>
      <button
        onClick={() => setIsDismissed(true)}
        className="p-1 hover:bg-stone-700 rounded"
        aria-label="Stäng"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default UpdateNotification
