/**
 * ProfileHeader - Clean minimal design
 * Simple header with avatar, name, and progress
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Cloud, CloudOff, Loader2, Download, Upload, ChevronDown, Camera
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useProfileStore } from '@/stores/profileStore'
import { ProfileImageUpload } from './ProfileImageUpload'
import { cvIntegrationApi, profileExportApi } from '@/services/profileEnhancementsApi'
import { notifications, TOAST_MESSAGES } from '@/lib/toast'

export function ProfileHeader() {
  const { t } = useTranslation()
  const {
    profile,
    completion,
    cloudSyncing,
    cloudSynced,
    updateProfileImage,
    loadProfile
  } = useProfileStore()

  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const handleImportFromCV = async () => {
    setImporting(true)
    const toastId = notifications.loading(TOAST_MESSAGES.IMPORTING)

    try {
      const result = await cvIntegrationApi.importToProfile()
      notifications.dismiss(toastId)

      if (result.imported.length > 0) {
        notifications.success(t('profile.header.importedFields', { fields: result.imported.join(', ') }))
        await loadProfile()
      } else {
        notifications.info(t('profile.header.noFieldsToImport'))
      }
    } catch (err) {
      console.error('Error importing from CV:', err)
      notifications.dismiss(toastId)
      notifications.error(TOAST_MESSAGES.IMPORT_ERROR)
    } finally {
      setImporting(false)
      setShowActions(false)
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
      notifications.error(t('profile.header.exportError'))
    } finally {
      setExporting(false)
      setShowActions(false)
    }
  }

  return (
    <header className="mb-6">
      {/* Main header content */}
      <div className="flex items-start gap-4 sm:gap-5">
        {/* Avatar */}
        <ProfileImageUpload
          currentImage={profile?.profile_image_url}
          onImageChange={updateProfileImage}
          size="lg"
        />

        {/* Info */}
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 truncate">
                {profile?.first_name || t('profile.header.welcome')} {profile?.last_name}
              </h1>
              <p className="text-sm text-stone-500 dark:text-stone-400 truncate">{profile?.email}</p>
            </div>

            {/* Sync status & actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Sync indicator */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs">
                {cloudSyncing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-400" />
                ) : cloudSynced ? (
                  <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <CloudOff className="w-3.5 h-3.5 text-amber-500" />
                )}
              </div>

              {/* Actions dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                >
                  <span className="hidden sm:inline">Åtgärder</span>
                  <ChevronDown className={cn('w-4 h-4 transition-transform', showActions && 'rotate-180')} />
                </button>

                {showActions && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 shadow-lg z-20 py-1">
                      <button
                        onClick={handleImportFromCV}
                        disabled={importing}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" />
                        {importing ? 'Importerar...' : 'Importera från CV'}
                      </button>
                      <button
                        onClick={handleExportPDF}
                        disabled={exporting}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" />
                        {exporting ? 'Exporterar...' : 'Ladda ner PDF'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-stone-600 dark:text-stone-400">
                Profilstatus
              </span>
              <span className={cn(
                'text-xs font-semibold',
                completion.percent >= 75 ? 'text-emerald-600 dark:text-emerald-400' :
                completion.percent >= 50 ? 'text-amber-600 dark:text-amber-400' :
                'text-stone-600 dark:text-stone-400'
              )}>
                {completion.percent}%
              </span>
            </div>

            <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  completion.percent >= 75 ? 'bg-emerald-500' :
                  completion.percent >= 50 ? 'bg-amber-500' :
                  'bg-teal-500'
                )}
                style={{ width: `${completion.percent}%` }}
              />
            </div>

            {/* Next step hint */}
            {completion.nextStep && completion.percent < 100 && (
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
                Nästa: <span className="text-teal-600 dark:text-teal-400 font-medium">{completion.nextStep.label}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
