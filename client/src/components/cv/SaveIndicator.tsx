/**
 * Save Indicator Component
 * Shows auto-save status in the UI
 */

import { useTranslation } from 'react-i18next'
import { Check, Loader2, CloudOff } from '@/components/ui/icons'
import { useCVStore } from '@/stores/cvStore'
import { datumSprak } from '@/lib/datumsprak'

export function SaveIndicator() {
  const { t, i18n } = useTranslation()
  const { saveStatus, lastSavedAt, hasUnsavedChanges, pendingCount, forsokSparaIgen } = useCVStore()
  
  const formatTime = (date: Date | null) => {
    if (!date) return ''
    return date.toLocaleTimeString(datumSprak(i18n.language), { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }
  
  // Don't show anything if idle and no unsaved changes
  if (saveStatus === 'idle' && !hasUnsavedChanges && pendingCount === 0) {
    return (
      <div role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
        <Check className="w-4 h-4" aria-hidden="true" />
        <span>{t('cv.saveIndicator.allSaved', 'Allt sparat')}</span>
      </div>
    )
  }
  
  if (saveStatus === 'saving') {
    return (
      <div role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        <span>{t('cv.saveIndicator.saving', 'Sparar...')}</span>
      </div>
    )
  }
  
  // RD26 (rollspelet 2026-09-27): felet stod som "Offline" även när nätet
  // fungerade och servern sa nej, och det fanns inget att trycka på. Nu säger
  // raden vad som hänt, att texten är kvar, och erbjuder Försök igen.
  if (saveStatus === 'error' || pendingCount > 0) {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false
    return (
      <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-red-700 dark:text-red-300">
        <CloudOff className="w-4 h-4" aria-hidden="true" />
        <span>
          {offline
            ? t('cv.saveIndicator.utanNat', 'Inte sparat — du verkar sakna internet. Det du skrev är kvar och sparas när du är uppkopplad igen.')
            : t('skrivfel.spara', 'Det gick inte att spara. Det du skrev är kvar.')}
        </span>
        {!offline && forsokSparaIgen && (
          <button
            type="button"
            onClick={forsokSparaIgen}
            className="min-h-11 rounded-lg border border-red-300 dark:border-red-700 px-3 text-sm font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]"
          >
            {t('skrivfel.forsokIgen', 'Försök igen')}
          </button>
        )}
      </div>
    )
  }
  
  if (saveStatus === 'saved' && lastSavedAt) {
    return (
      <div role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
        <Check className="w-4 h-4" aria-hidden="true" />
        <span>{t('cv.saveIndicator.savedAt', { defaultValue: 'Sparad {{time}}', time: formatTime(lastSavedAt) })}</span>
      </div>
    )
  }
  
  if (hasUnsavedChanges) {
    return (
      <div role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span>{t('cv.saveIndicator.unsaved', 'Osparat')}</span>
      </div>
    )
  }
  
  return null
}
