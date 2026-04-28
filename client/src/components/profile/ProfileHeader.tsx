/**
 * ProfileHeader - Enhanced clean design
 * Avatar, name, progress with actionable next step, quick actions
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Cloud, CloudOff, Loader2, Download, Upload, ChevronRight
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
    loadProfile,
    setActiveTab
  } = useProfileStore()

  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)

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
    }
  }

  // Navigate to next step
  const handleNextStep = () => {
    if (completion.nextStep?.tab) {
      setActiveTab(completion.nextStep.tab)
    }
  }

  return (
    <header className="mb-6">
      {/* Main header content */}
      <div className="flex items-start gap-4 sm:gap-5">
        {/* Avatar with camera overlay */}
        <ProfileImageUpload
          currentImage={profile?.profile_image_url}
          onImageChange={updateProfileImage}
          size="lg"
        />

        {/* Info */}
        <div className="flex-1 min-w-0 pt-1">
          {/* Name row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 truncate">
                {profile?.first_name || t('profile.header.welcome')} {profile?.last_name}
              </h1>
              <p className="text-sm text-stone-500 dark:text-stone-400 truncate">{profile?.email}</p>
            </div>

            {/* Sync status */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500">
              {cloudSyncing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sparar...</span>
                </>
              ) : cloudSynced ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Sparad</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400">Ej sparad</span>
                </>
              )}
            </div>
          </div>

          {/* Progress section */}
          <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                Profilstatus
              </span>
              <span className={cn(
                'text-sm font-bold',
                completion.percent >= 75 ? 'text-emerald-600 dark:text-emerald-400' :
                completion.percent >= 50 ? 'text-amber-600 dark:text-amber-400' :
                'text-[var(--c-text)] dark:text-[var(--c-solid)]'
              )}>
                {completion.percent}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden mb-3">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  completion.percent >= 75 ? 'bg-emerald-500' :
                  completion.percent >= 50 ? 'bg-amber-500' :
                  'bg-[var(--c-solid)]'
                )}
                style={{ width: `${completion.percent}%` }}
                role="progressbar"
                aria-valuenow={completion.percent}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>

            {/* Next step button */}
            {completion.nextStep && completion.percent < 100 && (
              <button
                onClick={handleNextStep}
                className="w-full flex items-center justify-between p-2 -mx-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700/50 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/50 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-[var(--c-solid)]" />
                  </span>
                  <span className="text-sm text-stone-600 dark:text-stone-400">
                    Nästa steg: <span className="text-[var(--c-text)] dark:text-[var(--c-solid)] font-medium">{completion.nextStep.label}</span>
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[var(--c-solid)] group-hover:translate-x-0.5 transition-all" />
              </button>
            )}

            {completion.percent === 100 && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="font-medium">Profilen är komplett!</span>
              </div>
            )}
          </div>

          {/* Quick actions row */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleImportFromCV}
              disabled={importing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {importing ? 'Importerar...' : 'Importera CV'}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {exporting ? 'Exporterar...' : 'Ladda ner PDF'}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
