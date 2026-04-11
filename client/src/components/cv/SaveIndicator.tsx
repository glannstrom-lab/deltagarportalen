/**
 * Save Indicator Component
 * Shows auto-save status in the UI
 */

import { Check, Loader2, AlertCircle, CloudOff } from '@/components/ui/icons'
import { useCVStore } from '@/stores/cvStore'

export function SaveIndicator() {
  const { saveStatus, lastSavedAt, hasUnsavedChanges, pendingCount } = useCVStore()
  
  const formatTime = (date: Date | null) => {
    if (!date) return ''
    return date.toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }
  
  // Don't show anything if idle and no unsaved changes
  if (saveStatus === 'idle' && !hasUnsavedChanges && pendingCount === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-stone-600">
        <Check className="w-4 h-4" />
        <span className="hidden sm:inline">Allt sparat</span>
      </div>
    )
  }
  
  if (saveStatus === 'saving') {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="hidden sm:inline">Sparar...</span>
      </div>
    )
  }
  
  if (saveStatus === 'error' || pendingCount > 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600" title="Försöker spara igen...">
        <CloudOff className="w-4 h-4" />
        <span className="hidden sm:inline">Offline</span>
      </div>
    )
  }
  
  if (saveStatus === 'saved' && lastSavedAt) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Check className="w-4 h-4" />
        <span className="hidden sm:inline">Sparad {formatTime(lastSavedAt)}</span>
      </div>
    )
  }
  
  if (hasUnsavedChanges) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-600">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="hidden sm:inline">Osparat</span>
      </div>
    )
  }
  
  return null
}
