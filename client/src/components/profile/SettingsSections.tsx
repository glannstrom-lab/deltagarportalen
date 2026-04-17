/**
 * SettingsSections - Notifikations- och synlighetsinställningar
 */

import { useState, useEffect } from 'react'
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
        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className={cn('space-y-6', className)}>
      {/* Email notifications */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-4 h-4 text-teal-500" />
          <h4 className="font-medium text-stone-800 dark:text-stone-200">E-postnotiser</h4>
        </div>
        <div className="space-y-2">
          {[
            { key: 'email_job_matches', label: 'Jobbmatchningar', desc: 'Nya jobb som matchar din profil' },
            { key: 'email_application_updates', label: 'Ansökningsuppdateringar', desc: 'Status på dina ansökningar' },
            { key: 'email_weekly_summary', label: 'Veckosummering', desc: 'Sammanfattning av din aktivitet' },
            { key: 'email_tips_and_resources', label: 'Tips & resurser', desc: 'Användbara tips för jobbsökare' },
            { key: 'email_consultant_messages', label: 'Meddelanden från konsulent', desc: 'När din konsulent skickar meddelanden' },
          ].map(item => (
            <label key={item.key} className="flex items-center justify-between p-3 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 cursor-pointer hover:border-teal-300 dark:hover:border-teal-700 transition-colors">
              <div>
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{item.label}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{item.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={settings[item.key as keyof NotificationSettings] as boolean}
                onChange={(e) => handleChange(item.key as keyof NotificationSettings, e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-teal-500 focus:ring-teal-500"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Push notifications */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Phone className="w-4 h-4 text-teal-500" />
          <h4 className="font-medium text-stone-800 dark:text-stone-200">Push-notiser</h4>
        </div>
        <div className="space-y-2">
          <label className="flex items-center justify-between p-3 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 cursor-pointer hover:border-teal-300 dark:hover:border-teal-700 transition-colors">
            <div>
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200">Aktivera push-notiser</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Få notiser direkt på enheten</p>
            </div>
            <input
              type="checkbox"
              checked={settings.push_enabled}
              onChange={(e) => handleChange('push_enabled', e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-teal-500 focus:ring-teal-500"
            />
          </label>
          {settings.push_enabled && (
            <div className="ml-4 space-y-2">
              {[
                { key: 'push_job_matches', label: 'Jobbmatchningar' },
                { key: 'push_deadlines', label: 'Deadlines' },
                { key: 'push_achievements', label: 'Prestationer' },
              ].map(item => (
                <label key={item.key} className="flex items-center justify-between p-2 bg-stone-50 dark:bg-stone-700/50 rounded-lg cursor-pointer">
                  <span className="text-sm text-stone-700 dark:text-stone-300">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={settings[item.key as keyof NotificationSettings] as boolean}
                    onChange={(e) => handleChange(item.key as keyof NotificationSettings, e.target.checked)}
                    className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-teal-500 focus:ring-teal-500"
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
          <Bell className="w-4 h-4 text-teal-500" />
          <h4 className="font-medium text-stone-800 dark:text-stone-200">Frekvens</h4>
        </div>
        <select
          value={settings.digest_frequency}
          onChange={(e) => handleChange('digest_frequency', e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
        >
          <option value="realtime">Direkt</option>
          <option value="daily">Daglig sammanfattning</option>
          <option value="weekly">Veckosummering</option>
          <option value="never">Aldrig</option>
        </select>
      </div>

      {saving && (
        <div className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          Sparar...
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
        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className={cn('space-y-6', className)}>
      {/* Profile visibility level */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-teal-500" />
          <h4 className="font-medium text-stone-800 dark:text-stone-200">Vem kan se din profil?</h4>
        </div>
        <div className="space-y-2">
          {[
            { value: 'private', label: 'Endast jag', desc: 'Din profil är helt privat', icon: Lock },
            { value: 'consultant', label: 'Konsulenter', desc: 'Synlig för din arbetskonsulent', icon: Users },
            { value: 'public', label: 'Alla', desc: 'Synlig för arbetsgivare och rekryterare', icon: Globe },
          ].map(item => (
            <label
              key={item.value}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                settings.profile_visible_to === item.value
                  ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700'
                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-teal-300 dark:hover:border-teal-700'
              )}
            >
              <input
                type="radio"
                name="visibility"
                value={item.value}
                checked={settings.profile_visible_to === item.value}
                onChange={(e) => handleChange('profile_visible_to', e.target.value)}
                className="w-4 h-4 border-stone-300 dark:border-stone-600 text-teal-500 focus:ring-teal-500"
              />
              <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
                <item.icon className="w-4 h-4 text-stone-600 dark:text-stone-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{item.label}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Section visibility */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-teal-500" />
          <h4 className="font-medium text-stone-800 dark:text-stone-200">Visa/dölj sektioner</h4>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'show_full_name', label: 'Fullständigt namn' },
            { key: 'show_photo', label: 'Profilbild' },
            { key: 'show_email', label: 'E-post' },
            { key: 'show_phone', label: 'Telefon' },
            { key: 'show_location', label: 'Ort' },
            { key: 'show_summary', label: 'Sammanfattning' },
            { key: 'show_skills', label: 'Kompetenser' },
            { key: 'show_experience', label: 'Erfarenhet' },
            { key: 'show_education', label: 'Utbildning' },
            { key: 'show_documents', label: 'Dokument' },
            { key: 'show_interests', label: 'Intressen' },
            { key: 'show_goals', label: 'Mål' },
          ].map(item => (
            <label key={item.key} className="flex items-center gap-2 p-2 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 cursor-pointer hover:border-teal-300 dark:hover:border-teal-700 transition-colors">
              <input
                type="checkbox"
                checked={settings[item.key as keyof VisibilitySettings] as boolean}
                onChange={(e) => handleChange(item.key as keyof VisibilitySettings, e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-teal-500 focus:ring-teal-500"
              />
              <span className="text-sm text-stone-700 dark:text-stone-300">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Job search visibility */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-teal-500" />
          <h4 className="font-medium text-stone-800 dark:text-stone-200">Jobbsökning</h4>
        </div>
        <div className="space-y-2">
          <label className="flex items-center justify-between p-3 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 cursor-pointer hover:border-teal-300 dark:hover:border-teal-700 transition-colors">
            <div>
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200">Synlig för arbetsgivare</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Arbetsgivare kan hitta din profil</p>
            </div>
            <input
              type="checkbox"
              checked={settings.visible_to_employers}
              onChange={(e) => handleChange('visible_to_employers', e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-teal-500 focus:ring-teal-500"
            />
          </label>
          <label className="flex items-center justify-between p-3 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 cursor-pointer hover:border-teal-300 dark:hover:border-teal-700 transition-colors">
            <div>
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200">Sökbar profil</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Din profil kan hittas via sökning</p>
            </div>
            <input
              type="checkbox"
              checked={settings.searchable_profile}
              onChange={(e) => handleChange('searchable_profile', e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-teal-500 focus:ring-teal-500"
            />
          </label>
        </div>
      </div>

      {saving && (
        <div className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          Sparar...
        </div>
      )}
    </div>
  )
}
