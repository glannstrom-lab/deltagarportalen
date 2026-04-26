/**
 * Data Sharing Settings Component
 * Allows participants to control what their consultant can see
 * Manages sharing permissions for health and wellness data
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Loader2, AlertCircle, Share2, Lock } from '@/components/ui/icons'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface DataSharingPreferences {
  share_health_data_with_consultant: boolean
  share_wellness_data_with_consultant: boolean
}

/**
 * Settings component for participants to control data sharing with their consultant
 */
export function DataSharingSettings() {
  const { t } = useTranslation()
  const { profile } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [preferences, setPreferences] = useState<DataSharingPreferences>({
    share_health_data_with_consultant: false,
    share_wellness_data_with_consultant: false,
  })
  const [consultantName, setConsultantName] = useState<string | null>(null)

  // Load current preferences and consultant info
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setIsLoading(true)
        setSaveError(null)

        // Get current sharing preferences
        const { data: sharingData, error: sharingError } = await supabase
          .from('participant_data_sharing')
          .select('share_health_data_with_consultant, share_wellness_data_with_consultant')
          .eq('participant_id', profile?.id)
          .single()

        if (sharingError && sharingError.code !== 'PGRST116') {
          // PGRST116 = row not found, which is fine
          console.error('Error loading sharing preferences:', sharingError)
        }

        if (sharingData) {
          setPreferences({
            share_health_data_with_consultant: sharingData.share_health_data_with_consultant || false,
            share_wellness_data_with_consultant: sharingData.share_wellness_data_with_consultant || false,
          })
        }

        // Get consultant info if assigned
        if (profile?.consultant_id) {
          const { data: consultantData, error: consultantError } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', profile.consultant_id)
            .single()

          if (!consultantError && consultantData) {
            const fullName = [consultantData.first_name, consultantData.last_name]
              .filter(Boolean)
              .join(' ')
            setConsultantName(fullName || 'Din konsulent')
          }
        }
      } catch (error) {
        console.error('Error loading data sharing settings:', error)
        setSaveError(t('datasharing.loadError') || 'Kunde inte hämta dina inställningar')
      } finally {
        setIsLoading(false)
      }
    }

    if (profile?.id) {
      loadPreferences()
    }
  }, [profile?.id, profile?.consultant_id, t])

  // Handle toggle changes
  const handleToggle = (field: keyof DataSharingPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  // Save preferences
  const handleSave = async () => {
    try {
      setIsSaving(true)
      setSaveError(null)
      setSaveSuccess(false)

      if (!profile?.id) {
        throw new Error('Inte inloggad')
      }

      // Upsert (insert or update) the sharing preferences
      const { error } = await supabase
        .from('participant_data_sharing')
        .upsert({
          participant_id: profile.id,
          share_health_data_with_consultant: preferences.share_health_data_with_consultant,
          share_wellness_data_with_consultant: preferences.share_wellness_data_with_consultant,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'participant_id',
        })

      if (error) {
        throw error
      }

      setSaveSuccess(true)
      // Clear success message after 3 seconds
      const timer = setTimeout(() => setSaveSuccess(false), 3000)
      return () => clearTimeout(timer)
    } catch (error) {
      console.error('Error saving data sharing preferences:', error)
      setSaveError(
        error instanceof Error ? error.message : (t('datasharing.saveError') || 'Kunde inte spara inställningar')
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
        <span className="ml-2 text-sm text-slate-600">{t('common.loading') || 'Laddar...'}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          {t('datasharing.title') || 'Datadelning'}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-600">
          {t('datasharing.description') || 'Styr vad din konsulent kan se'}
        </p>
      </div>

      {/* No Consultant Message */}
      {!profile?.consultant_id && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-100 text-sm">
              {t('datasharing.noConsultant') || 'Ingen konsulent tilldelad'}
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {t('datasharing.noConsultantDesc') || 'Du har ingen tilldelad konsulent än. Dessa inställningar gäller när en konsulent tilldelades dig.'}
            </p>
          </div>
        </div>
      )}

      {/* Consultant Name Display */}
      {consultantName && (
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-lg">
          <p className="text-sm text-indigo-900 dark:text-indigo-100">
            <strong>{t('datasharing.consultantLabel') || 'Din konsulent:'}</strong> {consultantName}
          </p>
        </div>
      )}

      {/* Sharing Options */}
      <div className="space-y-4">
        {/* Health Data Sharing */}
        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-slate-900 dark:text-slate-100">
                  {t('datasharing.health.title') || 'Dela hälsodata'}
                </h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-600 mb-3">
                {t('datasharing.health.description') || 'Tillåt din konsulent att se din ICF-data (kognitiv, motor, sensorisk, etc.)'}
              </p>
              {preferences.share_health_data_with_consultant && (
                <div className="text-xs text-amber-700 dark:text-amber-300 p-2 bg-amber-50 dark:bg-amber-900/20 rounded flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{t('datasharing.warningShared') || 'Din konsulent kan nu se denna data'}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => handleToggle('share_health_data_with_consultant')}
              className={cn(
                "w-12 h-7 rounded-full flex items-center px-1 transition-colors flex-shrink-0",
                preferences.share_health_data_with_consultant
                  ? 'bg-brand-700 justify-end'
                  : 'bg-slate-300 dark:bg-slate-600 justify-start'
              )}
              title={preferences.share_health_data_with_consultant ? 'Aktiverad' : 'Inaktiverad'}
            >
              <div className="w-5 h-5 bg-white rounded-full shadow" />
            </button>
          </div>
        </div>

        {/* Wellness Data Sharing */}
        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-slate-900 dark:text-slate-100">
                  {t('datasharing.wellness.title') || 'Dela väl mål data'}
                </h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-600 mb-3">
                {t('datasharing.wellness.description') || 'Tillåt din konsulent att se din dagbok, humör och väl mål information'}
              </p>
              {preferences.share_wellness_data_with_consultant && (
                <div className="text-xs text-amber-700 dark:text-amber-300 p-2 bg-amber-50 dark:bg-amber-900/20 rounded flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{t('datasharing.warningShared') || 'Din konsulent kan nu se denna data'}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => handleToggle('share_wellness_data_with_consultant')}
              className={cn(
                "w-12 h-7 rounded-full flex items-center px-1 transition-colors flex-shrink-0",
                preferences.share_wellness_data_with_consultant
                  ? 'bg-brand-700 justify-end'
                  : 'bg-slate-300 dark:bg-slate-600 justify-start'
              )}
              title={preferences.share_wellness_data_with_consultant ? 'Aktiverad' : 'Inaktiverad'}
            >
              <div className="w-5 h-5 bg-white rounded-full shadow" />
            </button>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
        <div className="flex gap-2 items-start">
          <Lock className="w-5 h-5 text-slate-600 dark:text-slate-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm mb-1">
              {t('datasharing.privacy') || 'Dina data är säkra'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-600">
              {t('datasharing.privacyDesc') || 'All datadelning är helt valfri och kan dras tillbaka när som helst. Din data krypteras och överförs säkert.'}
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {saveError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg flex gap-2 items-start">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700 dark:text-red-300">{saveError}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {saveSuccess && (
        <div className="p-4 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-900/50 rounded-lg">
          <p className="text-sm text-brand-900 dark:text-brand-300">
            {t('datasharing.savedSuccess') || 'Dina inställningar sparades!'}
          </p>
        </div>
      )}

      {/* Save Button */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "px-6 py-2.5 font-medium rounded-lg transition-colors",
            "bg-indigo-600 text-white hover:bg-indigo-700",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center gap-2"
          )}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
          {isSaving ? (t('common.loading') || 'Sparar...') : (t('common.save') || 'Spara inställningar')}
        </button>
      </div>

      {/* Privacy Policy Link */}
      <p className="text-xs text-slate-600 dark:text-slate-600">
        {t('datasharing.privacyPolicy') || 'Läs vår'} {' '}
        <Link to="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">
          {t('datasharing.privacyPolicyLink') || 'integritetspolicy'}
        </Link>
        {t('datasharing.privacyPolicyEnd') || ' för mer information om hur vi behandlar dina data.'}
      </p>
    </div>
  )
}

export default DataSharingSettings
