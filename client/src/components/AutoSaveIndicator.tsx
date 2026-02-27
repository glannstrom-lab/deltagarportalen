import { useState } from 'react'
import { Check, Save, AlertCircle, RotateCcw } from 'lucide-react'

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'

interface AutoSaveIndicatorProps {
  status: SaveStatus
  lastSaved?: Date | null
  hasRestoredData?: boolean
  onRestore?: () => void
  compact?: boolean
}

export function AutoSaveIndicator({
  status,
  lastSaved,
  hasRestoredData,
  onRestore,
  compact = false
}: AutoSaveIndicatorProps) {
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)

  const formatLastSaved = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return 'Just nu'
    if (diffMins < 60) return `${diffMins} min sedan`
    if (diffHours < 24) return `${diffHours} tim sedan`
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div 
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
            status === 'saved' 
              ? 'bg-green-50 text-green-700' 
              : status === 'saving'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-slate-50 text-slate-500'
          }`}
          aria-live="polite"
        >
          {status === 'saving' ? (
            <>
              <Save className="w-3 h-3 animate-pulse" />
              <span>Sparar...</span>
            </>
          ) : status === 'saved' ? (
            <>
              <Check className="w-3 h-3" />
              <span>Sparat</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3" />
              <span>Ej sparat</span>
            </>
          )}
        </div>
        
        {hasRestoredData && onRestore && (
          <button
            onClick={() => setShowRestoreConfirm(true)}
            className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1"
            aria-label="Återställ tidigare sparad data"
          >
            <RotateCcw className="w-3 h-3" />
            Återställ
          </button>
        )}

        {showRestoreConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-4 max-w-sm mx-4">
              <p className="text-sm text-slate-700 mb-3">
                Vill du återställa till senast sparad version?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (onRestore) onRestore()
                    setShowRestoreConfirm(false)
                  }}
                  className="flex-1 px-3 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700"
                >
                  Ja, återställ
                </button>
                <button
                  onClick={() => setShowRestoreConfirm(false)}
                  className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200"
                >
                  Avbryt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Full version
  return (
    <div 
      className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
      aria-live="polite"
    >
      <div className={`p-2 rounded-full ${
        status === 'saved' 
          ? 'bg-green-100 text-green-600' 
          : status === 'saving'
          ? 'bg-amber-100 text-amber-600'
          : 'bg-red-100 text-red-600'
      }`}>
        {status === 'saving' ? (
          <Save className="w-4 h-4 animate-pulse" />
        ) : status === 'saved' ? (
          <Check className="w-4 h-4" />
        ) : (
          <AlertCircle className="w-4 h-4" />
        )}
      </div>
      
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-700">
          {status === 'saving' && 'Sparar ändringar...'}
          {status === 'saved' && 'Allt sparat automatiskt'}
          {status === 'unsaved' && 'Ej sparat'}
          {status === 'error' && 'Kunde inte spara'}
        </p>
        {lastSaved && status === 'saved' && (
          <p className="text-xs text-slate-500">
            Senast sparad: {formatLastSaved(lastSaved)}
          </p>
        )}
      </div>

      {hasRestoredData && onRestore && (
        <button
          onClick={() => setShowRestoreConfirm(true)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Återställ
        </button>
      )}
    </div>
  )
}

// Enkel ikon-variant för minimala gränssnitt
export function AutoSaveIcon({ status }: { status: SaveStatus }) {
  return (
    <span 
      className={`inline-flex ${
        status === 'saved' 
          ? 'text-green-500' 
          : status === 'saving'
          ? 'text-amber-500 animate-pulse'
          : 'text-red-500'
      }`}
      aria-label={
        status === 'saved' ? 'Sparat' : 
        status === 'saving' ? 'Sparar...' : 
        'Ej sparat'
      }
    >
      {status === 'saved' ? (
        <Check className="w-4 h-4" />
      ) : status === 'saving' ? (
        <Save className="w-4 h-4" />
      ) : (
        <AlertCircle className="w-4 h-4" />
      )}
    </span>
  )
}

export default AutoSaveIndicator
