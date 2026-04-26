/**
 * SettingsSections - Notifikations- och synlighetsinställningar
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bell, Mail, Phone, MessageSquare, Globe,
  Lock, Eye, EyeOff, Users, Building2, Loader2
} from '@/components/ui/icons'
import {
  notificationSettingsApi,
  visibilitySettingsApi,
  type NotificationSettings,
  type VisibilitySettings
} from '@/services/profileEnhancementsApi'
import { cn } from '@/lib/utils'

// ============================================
// NOTIFICATION SETTINGS
// ============================================

interface NotificationSettingsProps {
  className?: string
}

export function NotificationSettingsSection({ className }: NotificationSettingsProps) {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await notificationSettingsApi.get()
      setSettings(data || {
        email_job_matches: true,
        email_application_updates: true,
        email_weekly_summary: true,
        email_tips_and_resources: false,
        email_consultant_messages: true,
        push_enabled: false,
        push_job_matches: true,
        push_deadlines: true,
        push_achievements: true,
        inapp_enabled: true,
        inapp_job_matches: true,
        inapp_tips: true,
        digest_frequency: 'daily'
      } as NotificationSettings)
    } catch (err) {
      console.error('Error loading notification settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = async (key: keyof NotificationSettings, value: boolean | string) => {
    if (!settings) return

    const updated = { ...settings, [key]: value }
    setSettings(updated)

    setSaving(true)
    try {
      await notificationSettingsApi.update({ [key]: value })
    } catch (err) {
      console.error('Error saving notification settings:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-brand-900 animate-spin" />
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className={cn('space-y-6', className)}>
      {/* Email notifications */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-4 h-4 text-brand-900" />
          <h4 className="font-medium text-stone-800 dark:text-stone-200">{t('profile.settings.emailNotifications')}</h4>
        </div>
        <div className="space-y-2">
          {[
            { key: 'email_job_matches', labelKey: 'profile.settings.notifications.jobMatches', descKey: 'profile.settings.notifications.jobMatchesDesc' },
            { key: 'email_application_updates', labelKey: 'profile.settings.notifications.applicationUpdates', descKey: 'profile.settings.notifications.applicationUpdatesDesc' },
            { key: 'email_weekly_summary', labelKey: 'profile.settings.notifications.weeklySummary', descKey: 'profile.settings.notifications.weeklySummaryDesc' },
            { key: 'email_tips_and_resources', labelKey: 'profile.settings.notifications.tipsAndResources', descKey: 'profile.settings.notifications.tipsAndResourcesDesc' },
            { key: 'email_consultant_messages', labelKey: 'profile.settings.notifications.consultantMessages', descKey: 'profile.settings.notifications.consultantMessagesDesc' },
          ].map(item => (
            <label key={item.key} className="flex items-center justify-between p-3 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 cursor-pointer hover:border-brand-300 dark:hover:border-brand-900/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{t(item.labelKey)}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{t(item.descKey)}</p>
              </div>
              <input
                type="checkbox"
                checked={settings[item.key as keyof NotificationSettings] as boolean}
                onChange={(e) => handleChange(item.key as keyof NotificationSettings, e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-brand-900 focus:ring-brand-900"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Push notifications */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Phone className="w-4 h-4 text-brand-900" />
          <h4 className="font-medium text-stone-800 dark:text-stone-200">{t('profile.settings.pushNotifications')}</h4>
        </div>
        <div className="space-y-2">
          <label className="flex items-center justify-between p-3 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 cursor-pointer hover:border-brand-300 dark:hover:border-brand-900/50 transition-colors">
            <div>
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{t('profile.settings.enablePush')}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">{t('profile.settings.enablePushDesc')}</p>
            </div>
            <input
              type="checkbox"
              checked={settings.push_enabled}
              onChange={(e) => handleChange('push_enabled', e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-brand-900 focus:ring-brand-900"
            />
          </label>
          {settings.push_enabled && (
            <div className="ml-4 space-y-2">
              {[
                { key: 'push_job_matches', labelKey: 'profile.settings.notifications.jobMatches' },
                { key: 'push_deadlines', labelKey: 'profile.settings.notifications.deadlines' },
                { key: 'push_achievements', labelKey: 'profile.settings.notifications.achievements' },
              ].map(item => (
                <label key={item.key} className="flex items-center justify-between p-2 bg-stone-50 dark:bg-stone-700/50 rounded-lg cursor-pointer">
                  <span className="text-sm text-stone-700 dark:text-stone-300">{t(item.labelKey)}</span>
                  <input
                    type="checkbox"
                    checked={settings[item.key as keyof NotificationSettings] as boolean}
                    onChange={(e) => handleChange(item.key as keyof NotificationSettings, e.target.checked)}
                    className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-brand-900 focus:ring-brand-900"
                  />
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Frequency */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-brand-900" />
          <h4 className="font-medium text-stone-800 dark:text-stone-200">{t('profile.settings.frequency')}</h4>
        </div>
        <select
          value={settings.digest_frequency}
          onChange={(e) => handleChange('digest_frequency', e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-300"
        >
          <option value="realtime">{t('profile.settings.frequencyOptions.realtime')}</option>
          <option value="daily">{t('profile.settings.frequencyOptions.daily')}</option>
          <option value="weekly">{t('profile.settings.frequencyOptions.weekly')}</option>
          <option value="never">{t('profile.settings.frequencyOptions.never')}</option>
        </select>
      </div>

      {saving && (
        <div className="flex items-center gap-2 text-xs text-brand-900 dark:text-brand-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          {t('common.saving')}
        </div>
      )}
    </div>
  )
}

// ============================================
// VISIBILITY SETTINGS
// ============================================

interface VisibilitySettingsProps {
  className?: string
}

export function VisibilitySettingsSection({ className }: VisibilitySettingsProps) {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<VisibilitySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await visibilitySettingsApi.get()
      setSettings(data || {
        profile_visible_to: 'consultant',
        show_email: false,
        show_phone: false,
        show_location: true,
        show_full_name: true,
        show_photo: true,
        show_summary: true,
        show_skills: true,
        show_experience: true,
        show_education: true,
        show_documents: false,
        show_interests: true,
        show_goals: false,
        show_activity: false,
        share_with_consultant: true,
        consultant_can_edit: false,
        visible_to_employers: false,
        searchable_profile: false
      } as VisibilitySettings)
    } catch (err) {
      console.error('Error loading visibility settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = async (key: keyof VisibilitySettings, value: boolean | string) => {
    if (!settings) return

    const updated = { ...settings, [key]: value }
    setSettings(updated)

    setSaving(true)
    try {
      await visibilitySettingsApi.update({ [key]: value })
    } catch (err) {
      console.error('Error saving visibility settings:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-brand-900 animate-spin" />
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className={cn('space-y-6', className)}>
      {/* Profile visibility level */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-brand-900" />
          <h4 className="font-medium text-stone-800 dark:text-stone-200">{t('profile.settings.whoCanSeeProfile')}</h4>
        </div>
        <div className="space-y-2">
          {[
            { value: 'private', labelKey: 'profile.settings.visibility.private', descKey: 'profile.settings.visibility.privateDesc', icon: Lock },
            { value: 'consultant', labelKey: 'profile.settings.visibility.consultant', descKey: 'profile.settings.visibility.consultantDesc', icon: Users },
            { value: 'public', labelKey: 'profile.settings.visibility.public', descKey: 'profile.settings.visibility.publicDesc', icon: Globe },
          ].map(item => (
            <label
              key={item.value}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                settings.profile_visible_to === item.value
                  ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-300 dark:border-brand-900/50'
                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-brand-300 dark:hover:border-brand-900/50'
              )}
            >
              <input
                type="radio"
                name="visibility"
                value={item.value}
                checked={settings.profile_visible_to === item.value}
                onChange={(e) => handleChange('profile_visible_to', e.target.value)}
                className="w-4 h-4 border-stone-300 dark:border-stone-600 text-brand-900 focus:ring-brand-900"
              />
              <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
                <item.icon className="w-4 h-4 text-stone-600 dark:text-stone-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{t(item.labelKey)}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{t(item.descKey)}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Section visibility */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-brand-900" />
          <h4 className="font-medium text-stone-800 dark:text-stone-200">{t('profile.settings.showHideSections')}</h4>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'show_full_name', labelKey: 'profile.settings.sections.fullName' },
            { key: 'show_photo', labelKey: 'profile.settings.sections.photo' },
            { key: 'show_email', labelKey: 'profile.settings.sections.email' },
            { key: 'show_phone', labelKey: 'profile.settings.sections.phone' },
            { key: 'show_location', labelKey: 'profile.settings.sections.location' },
            { key: 'show_summary', labelKey: 'profile.settings.sections.summary' },
            { key: 'show_skills', labelKey: 'profile.settings.sections.skills' },
            { key: 'show_experience', labelKey: 'profile.settings.sections.experience' },
            { key: 'show_education', labelKey: 'profile.settings.sections.education' },
            { key: 'show_documents', labelKey: 'profile.settings.sections.documents' },
            { key: 'show_interests', labelKey: 'profile.settings.sections.interests' },
            { key: 'show_goals', labelKey: 'profile.settings.sections.goals' },
          ].map(item => (
            <label key={item.key} className="flex items-center gap-2 p-2 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 cursor-pointer hover:border-brand-300 dark:hover:border-brand-900/50 transition-colors">
              <input
                type="checkbox"
                checked={settings[item.key as keyof VisibilitySettings] as boolean}
                onChange={(e) => handleChange(item.key as keyof VisibilitySettings, e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-brand-900 focus:ring-brand-900"
              />
              <span className="text-sm text-stone-700 dark:text-stone-300">{t(item.labelKey)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Job search visibility */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-brand-900" />
          <h4 className="font-medium text-stone-800 dark:text-stone-200">{t('profile.settings.jobSearch')}</h4>
        </div>
        <div className="space-y-2">
          <label className="flex items-center justify-between p-3 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 cursor-pointer hover:border-brand-300 dark:hover:border-brand-900/50 transition-colors">
            <div>
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{t('profile.settings.visibleToEmployers')}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">{t('profile.settings.visibleToEmployersDesc')}</p>
            </div>
            <input
              type="checkbox"
              checked={settings.visible_to_employers}
              onChange={(e) => handleChange('visible_to_employers', e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-brand-900 focus:ring-brand-900"
            />
          </label>
          <label className="flex items-center justify-between p-3 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 cursor-pointer hover:border-brand-300 dark:hover:border-brand-900/50 transition-colors">
            <div>
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{t('profile.settings.searchableProfile')}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">{t('profile.settings.searchableProfileDesc')}</p>
            </div>
            <input
              type="checkbox"
              checked={settings.searchable_profile}
              onChange={(e) => handleChange('searchable_profile', e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-brand-900 focus:ring-brand-900"
            />
          </label>
        </div>
      </div>

      {saving && (
        <div className="flex items-center gap-2 text-xs text-brand-900 dark:text-brand-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          {t('common.saving')}
        </div>
      )}
    </div>
  )
}
