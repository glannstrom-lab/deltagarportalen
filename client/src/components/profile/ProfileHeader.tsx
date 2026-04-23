/**
 * ProfileHeader - Profile header with image, completion, and consultant overview
 */

import { useState } from 'react'
import {
  Cloud, CloudOff, Loader2, Download, Upload,
  AlertCircle, FileText, Users, Activity, ChevronDown, ChevronUp
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useProfileStore } from '@/stores/profileStore'
import { ProfileImageUpload } from './ProfileImageUpload'
import { cvIntegrationApi, profileExportApi } from '@/services/profileEnhancementsApi'
import { notifications, TOAST_MESSAGES } from '@/lib/toast'
import { POSITIVE_MESSAGES } from './constants'

export function ProfileHeader() {
  const {
    profile,
    preferences,
    completion,
    cloudSyncing,
    cloudSynced,
    updateProfileImage,
    loadProfile
  } = useProfileStore()

  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showConsultantView, setShowConsultantView] = useState(false)

  const handleImportFromCV = async () => {
    setImporting(true)
    const toastId = notifications.loading(TOAST_MESSAGES.IMPORTING)

    try {
      const result = await cvIntegrationApi.importToProfile()
      notifications.dismiss(toastId)

      if (result.imported.length > 0) {
        notifications.success(`Importerade: ${result.imported.join(', ')}`)
        await loadProfile()
      } else {
        notifications.info('Inga nya fält att importera från CV.')
      }
    } catch (err) {
      console.error('Error importing from CV:', err)
      notifications.dismiss(toastId)
      notifications.error(TOAST_MESSAGES.IMPORT_ERROR)
    } finally {
      setImporting(false)
    }
  }

  const handleExportPDF = async () => {
    setExporting(true)
    const toastId = notifications.loading(TOAST_MESSAGES.EXPORTING)

    try {
      const blob = await profileExportApi.toPDF()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `profil_${profile?.first_name}_${profile?.last_name}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      notifications.dismiss(toastId)
      notifications.success(TOAST_MESSAGES.EXPORT_SUCCESS)
    } catch (err) {
      console.error('Error exporting PDF:', err)
      notifications.dismiss(toastId)
      notifications.error('Kunde inte exportera PDF. Kontrollera att du har ett CV.')
    } finally {
      setExporting(false)
    }
  }

  // Get positive message based on completion
  const getPositiveMessage = () => {
    const percent = completion.percent
    if (percent >= 100) return POSITIVE_MESSAGES.COMPLETION[100]
    if (percent >= 75) return POSITIVE_MESSAGES.COMPLETION[75]
    if (percent >= 50) return POSITIVE_MESSAGES.COMPLETION[50]
    if (percent >= 25) return POSITIVE_MESSAGES.COMPLETION[25]
    return POSITIVE_MESSAGES.COMPLETION[0]
  }

  // Calculate consultant alerts
  const getAlerts = () => {
    const alerts: Array<{ type: 'error' | 'warning'; message: string }> = []

    if (!preferences.consultant_data?.cvStatus || preferences.consultant_data.cvStatus === 'missing') {
      alerts.push({ type: 'warning', message: 'CV är inte påbörjat ännu' })
    }

    if (preferences.consultant_data?.activityLevel?.applicationsSent === 0) {
      alerts.push({ type: 'warning', message: 'Inga ansökningar registrerade' })
    }

    if ((preferences.consultant_data?.workBarriers?.length || 0) > 2) {
      alerts.push({
        type: 'warning',
        message: `${preferences.consultant_data?.workBarriers?.length} stödområden identifierade`
      })
    }

    if (preferences.therapist_data?.followUpDate) {
      const followUp = new Date(preferences.therapist_data.followUpDate)
      if (followUp < new Date()) {
        alerts.push({ type: 'error', message: 'Försenad uppföljning' })
      }
    }

    return alerts
  }

  const alerts = getAlerts()

  return (
    <header className="bg-gradient-to-r from-teal-50 via-white to-sky-50 dark:from-teal-900/20 dark:via-stone-900 dark:to-sky-900/20 rounded-2xl border border-teal-200 dark:border-teal-800/50 mb-4 overflow-hidden">
      {/* Profile Info */}
      <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4">
        <ProfileImageUpload
          currentImage={profile?.profile_image_url}
          onImageChange={updateProfileImage}
          size="lg"
        />

        <div className="flex-1 min-w-0 text-center sm:text-left">
          <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100 truncate">
            {profile?.first_name || 'Välkommen!'} {profile?.last_name}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm truncate">{profile?.email}</p>

          {/* Positive message */}
          <p className="text-xs text-teal-600 dark:text-teal-400 mt-1 font-medium">
            {getPositiveMessage()}
          </p>
        </div>

        {/* Desktop: actions */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={handleImportFromCV}
            disabled={importing}
            className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 disabled:opacity-50 transition-colors"
            aria-busy={importing}
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            {importing ? 'Importerar...' : 'Importera CV'}
          </button>

          <span className="text-stone-300 dark:text-stone-600" aria-hidden="true">|</span>

          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 disabled:opacity-50 transition-colors"
            aria-busy={exporting}
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            {exporting ? 'Exporterar...' : 'Ladda ner PDF'}
          </button>

          <span className="text-stone-300 dark:text-stone-600" aria-hidden="true">|</span>

          {/* Sync status */}
          <div className="flex items-center gap-1.5">
            {cloudSyncing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-400" aria-hidden="true" />
                <span className="text-xs text-stone-500">Sparar...</span>
              </>
            ) : cloudSynced ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                <span className="text-xs text-emerald-600 dark:text-emerald-400">Sparat</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                <span className="text-xs text-amber-600">Ej sparat</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 sm:px-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-stone-600 dark:text-stone-400">
            Din profil
          </span>
          <span className={cn(
            'text-xs font-bold',
            completion.percent >= 75 ? 'text-emerald-600 dark:text-emerald-400' :
            completion.percent >= 50 ? 'text-amber-600 dark:text-amber-400' :
            'text-stone-600 dark:text-stone-400'
          )}>
            {completion.filled} av {completion.total} steg
          </span>
        </div>

        <div
          className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={completion.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Profilkomplettering: ${completion.percent}%`}
        >
          <div
            className={cn(
              'h-full transition-all duration-500 rounded-full',
              completion.percent >= 75 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
              completion.percent >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
              'bg-gradient-to-r from-teal-400 to-teal-500'
            )}
            style={{ width: `${completion.percent}%` }}
          />
        </div>

        {/* Next step suggestion */}
        {completion.nextStep && (
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
            Nästa steg: <span className="text-teal-600 dark:text-teal-400 font-medium">{completion.nextStep.label}</span>
          </p>
        )}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="px-4 sm:px-6 pb-4">
          <div className="flex flex-wrap gap-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                role="alert"
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                  alert.type === 'error'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                )}
              >
                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Consultant overview (collapsible) */}
      <div className="border-t border-teal-100 dark:border-teal-800/50">
        <button
          onClick={() => setShowConsultantView(!showConsultantView)}
          className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left hover:bg-white/50 dark:hover:bg-stone-800/30 transition-colors"
          aria-expanded={showConsultantView}
          aria-controls="consultant-overview"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300">
            <Users className="w-4 h-4 text-purple-500" aria-hidden="true" />
            Handledningsöversikt
          </span>
          {showConsultantView ? (
            <ChevronUp className="w-4 h-4 text-stone-400" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4 text-stone-400" aria-hidden="true" />
          )}
        </button>

        {showConsultantView && (
          <div
            id="consultant-overview"
            className="px-4 sm:px-6 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            <div className="bg-white dark:bg-stone-800 rounded-xl p-3 border border-stone-200 dark:border-stone-700">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-sky-500" aria-hidden="true" />
                <span className="text-xs text-stone-500 dark:text-stone-400">CV-status</span>
              </div>
              <p className="text-sm font-bold text-stone-800 dark:text-stone-100">
                {preferences.consultant_data?.cvStatus === 'complete' ? 'Komplett' :
                 preferences.consultant_data?.cvStatus === 'needs_update' ? 'Kan uppdateras' :
                 'Inte påbörjat'}
              </p>
            </div>

            <div className="bg-white dark:bg-stone-800 rounded-xl p-3 border border-stone-200 dark:border-stone-700">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-amber-500" aria-hidden="true" />
                <span className="text-xs text-stone-500 dark:text-stone-400">Ansökningar</span>
              </div>
              <p className="text-sm font-bold text-stone-800 dark:text-stone-100">
                {preferences.consultant_data?.activityLevel?.applicationsSent || 0}
              </p>
            </div>

            <div className="bg-white dark:bg-stone-800 rounded-xl p-3 border border-stone-200 dark:border-stone-700">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-teal-500" aria-hidden="true" />
                <span className="text-xs text-stone-500 dark:text-stone-400">Intervjuer</span>
              </div>
              <p className="text-sm font-bold text-stone-800 dark:text-stone-100">
                {preferences.consultant_data?.activityLevel?.interviews || 0}
              </p>
            </div>

            <div className="bg-white dark:bg-stone-800 rounded-xl p-3 border border-stone-200 dark:border-stone-700">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-purple-500" aria-hidden="true" />
                <span className="text-xs text-stone-500 dark:text-stone-400">Stödbehov</span>
              </div>
              <p className="text-sm font-bold text-stone-800 dark:text-stone-100">
                {preferences.consultant_data?.workBarriers?.length || 0}
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
