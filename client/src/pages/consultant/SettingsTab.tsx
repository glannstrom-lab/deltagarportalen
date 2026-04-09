/**
 * SettingsTab - Consultant Settings and Preferences
 * Notification settings, team management, and preferences
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Settings,
  Bell,
  Mail,
  Users,
  Clock,
  Globe,
  Shield,
  Palette,
  Calendar,
  MessageSquare,
  AlertTriangle,
  Check,
  ChevronRight,
  Save,
  Loader2,
  CheckCircle,
} from '@/components/ui/icons'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { cn } from '@/lib/utils'

interface NotificationSetting {
  id: string
  label: string
  description: string
  enabled: boolean
  channel: 'email' | 'push' | 'both'
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'consultant' | 'admin'
  participantCount: number
}

// Toggle Switch Component
function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean
  onChange: (enabled: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={cn(
        'relative w-12 h-7 rounded-full transition-colors',
        enabled ? 'bg-violet-600' : 'bg-stone-300 dark:bg-stone-600'
      )}
    >
      <span
        className={cn(
          'absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
          enabled ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  )
}

// Setting Row Component
function SettingRow({
  icon: Icon,
  label,
  description,
  children,
}: {
  icon: React.ElementType
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-stone-100 dark:border-stone-800 last:border-0">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-lg mt-0.5">
          <Icon className="w-5 h-5 text-stone-600 dark:text-stone-600" />
        </div>
        <div>
          <p className="font-medium text-stone-900 dark:text-stone-100">{label}</p>
          {description && (
            <p className="text-sm text-stone-500 dark:text-stone-600 mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

export function SettingsTab() {
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const defaultNotifications: NotificationSetting[] = [
    {
      id: 'new_participant',
      label: 'Ny deltagare tilldelad',
      description: 'När en ny deltagare tilldelas dig',
      enabled: true,
      channel: 'both',
    },
    {
      id: 'participant_inactive',
      label: 'Inaktiv deltagare',
      description: 'När en deltagare inte loggat in på 7 dagar',
      enabled: true,
      channel: 'email',
    },
    {
      id: 'goal_deadline',
      label: 'Mål-deadline närmar sig',
      description: 'När ett mål har deadline inom 2 dagar',
      enabled: true,
      channel: 'both',
    },
    {
      id: 'new_message',
      label: 'Nytt meddelande',
      description: 'När du får ett meddelande från deltagare',
      enabled: true,
      channel: 'push',
    },
    {
      id: 'cv_updated',
      label: 'CV uppdaterat',
      description: 'När en deltagare uppdaterar sitt CV',
      enabled: false,
      channel: 'email',
    },
    {
      id: 'meeting_reminder',
      label: 'Mötespåminnelse',
      description: 'Påminnelse 1 timme före schemalagt möte',
      enabled: true,
      channel: 'both',
    },
  ]

  const [notifications, setNotifications] = useState<NotificationSetting[]>(defaultNotifications)

  const [preferences, setPreferences] = useState({
    defaultView: 'grid' as 'grid' | 'list',
    language: 'sv' as 'sv' | 'en',
    timezone: 'Europe/Stockholm',
    weekStart: 'monday' as 'monday' | 'sunday',
    autoRefresh: true,
    showInactiveWarning: 7,
  })

  // Team members state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch settings from database
      const { data: settingsData } = await supabase
        .from('consultant_settings')
        .select('*')
        .eq('consultant_id', user.id)
        .single()

      if (settingsData) {
        // Apply saved notifications
        if (settingsData.notifications) {
          const savedNotifs = settingsData.notifications as Record<string, any>
          setNotifications(defaultNotifications.map(n => ({
            ...n,
            enabled: savedNotifs[n.id]?.enabled ?? n.enabled,
            channel: savedNotifs[n.id]?.channel ?? n.channel,
          })))
        }

        // Apply saved preferences
        if (settingsData.preferences) {
          const savedPrefs = settingsData.preferences as Record<string, any>
          setPreferences(prev => ({
            ...prev,
            ...savedPrefs,
          }))
        }
      }

      // Fetch team members (mock for now, would come from organization table)
      setTeamMembers([
        { id: '1', name: 'Anna Andersson', email: 'anna@example.com', role: 'admin', participantCount: 0 },
        { id: '2', name: 'Erik Eriksson', email: 'erik@example.com', role: 'consultant', participantCount: 12 },
        { id: '3', name: 'Maria Nilsson', email: 'maria@example.com', role: 'consultant', participantCount: 8 },
      ])

    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateNotification = (id: string, field: keyof NotificationSetting, value: any) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, [field]: value } : n
    ))
    setHasChanges(true)
    setSaved(false)
  }

  const updatePreference = (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
    setSaved(false)

    // Apply language change immediately
    if (key === 'language') {
      i18n.changeLanguage(value)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Convert notifications to object format for storage
      const notificationsObj = notifications.reduce((acc, n) => ({
        ...acc,
        [n.id]: { enabled: n.enabled, channel: n.channel },
      }), {})

      // Upsert settings
      const { error } = await supabase
        .from('consultant_settings')
        .upsert({
          consultant_id: user.id,
          notifications: notificationsObj,
          preferences: preferences,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'consultant_id',
        })

      if (error) throw error

      setHasChanges(false)
      setSaved(true)

      // Hide success message after 3 seconds
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setNotifications(defaultNotifications)
    setPreferences({
      defaultView: 'grid',
      language: 'sv',
      timezone: 'Europe/Stockholm',
      weekStart: 'monday',
      autoRefresh: true,
      showInactiveWarning: 7,
    })
    setHasChanges(false)
  }

  if (loading) {
    return <LoadingState type="form" />
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Save Banner */}
      {(hasChanges || saved) && (
        <Card className={cn(
          'p-4 sticky top-4 z-10',
          saved
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
            : 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800'
        )}>
          <div className="flex items-center justify-between">
            {saved ? (
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <CheckCircle className="w-5 h-5" />
                <p className="font-medium">Inställningar sparade!</p>
              </div>
            ) : (
              <>
                <p className="font-medium text-violet-900 dark:text-violet-100">
                  Du har osparade ändringar
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={handleReset}>
                    Ångra
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sparar...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Spara
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Notification Settings */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-violet-100 dark:bg-violet-900/40 rounded-xl">
            <Bell className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">
              Notifikationer
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-600">
              Hantera hur och när du vill bli notifierad
            </p>
          </div>
        </div>

        <div className="space-y-1">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className="flex items-center justify-between py-4 border-b border-stone-100 dark:border-stone-800 last:border-0"
            >
              <div>
                <p className="font-medium text-stone-900 dark:text-stone-100">
                  {notification.label}
                </p>
                <p className="text-sm text-stone-500 dark:text-stone-600">
                  {notification.description}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={notification.channel}
                  onChange={e => updateNotification(notification.id, 'channel', e.target.value)}
                  disabled={!notification.enabled}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm',
                    'bg-stone-100 dark:bg-stone-800',
                    'border-0',
                    'text-stone-700 dark:text-stone-300',
                    !notification.enabled && 'opacity-50'
                  )}
                >
                  <option value="email">Email</option>
                  <option value="push">Push</option>
                  <option value="both">Båda</option>
                </select>
                <Toggle
                  enabled={notification.enabled}
                  onChange={enabled => updateNotification(notification.id, 'enabled', enabled)}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Preferences */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
            <Settings className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">
              Inställningar
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-600">
              Anpassa din konsultvy
            </p>
          </div>
        </div>

        <div>
          <SettingRow
            icon={Palette}
            label="Standardvy för deltagare"
            description="Välj hur deltagarlistan visas som standard"
          >
            <select
              value={preferences.defaultView}
              onChange={e => updatePreference('defaultView', e.target.value)}
              className={cn(
                'px-4 py-2 rounded-xl',
                'bg-stone-100 dark:bg-stone-800',
                'border-0',
                'text-stone-900 dark:text-stone-100'
              )}
            >
              <option value="grid">Rutnät</option>
              <option value="list">Lista</option>
            </select>
          </SettingRow>

          <SettingRow
            icon={Globe}
            label="Språk"
            description="Välj språk för gränssnittet"
          >
            <select
              value={preferences.language}
              onChange={e => updatePreference('language', e.target.value)}
              className={cn(
                'px-4 py-2 rounded-xl',
                'bg-stone-100 dark:bg-stone-800',
                'border-0',
                'text-stone-900 dark:text-stone-100'
              )}
            >
              <option value="sv">Svenska</option>
              <option value="en">English</option>
            </select>
          </SettingRow>

          <SettingRow
            icon={Clock}
            label="Tidszon"
            description="Används för mötesbokning och påminnelser"
          >
            <select
              value={preferences.timezone}
              onChange={e => updatePreference('timezone', e.target.value)}
              className={cn(
                'px-4 py-2 rounded-xl',
                'bg-stone-100 dark:bg-stone-800',
                'border-0',
                'text-stone-900 dark:text-stone-100'
              )}
            >
              <option value="Europe/Stockholm">Stockholm (CET)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="America/New_York">New York (EST)</option>
            </select>
          </SettingRow>

          <SettingRow
            icon={Calendar}
            label="Veckan börjar"
            description="Påverkar kalendervisning"
          >
            <select
              value={preferences.weekStart}
              onChange={e => updatePreference('weekStart', e.target.value)}
              className={cn(
                'px-4 py-2 rounded-xl',
                'bg-stone-100 dark:bg-stone-800',
                'border-0',
                'text-stone-900 dark:text-stone-100'
              )}
            >
              <option value="monday">Måndag</option>
              <option value="sunday">Söndag</option>
            </select>
          </SettingRow>

          <SettingRow
            icon={AlertTriangle}
            label="Inaktivitetsvarning"
            description="Dagar innan en deltagare markeras som inaktiv"
          >
            <select
              value={preferences.showInactiveWarning}
              onChange={e => updatePreference('showInactiveWarning', parseInt(e.target.value))}
              className={cn(
                'px-4 py-2 rounded-xl',
                'bg-stone-100 dark:bg-stone-800',
                'border-0',
                'text-stone-900 dark:text-stone-100'
              )}
            >
              <option value={5}>5 dagar</option>
              <option value={7}>7 dagar</option>
              <option value={14}>14 dagar</option>
            </select>
          </SettingRow>
        </div>
      </Card>

      {/* Team Section */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                Team
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-600">
                Kollegor och administratörer
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {teamMembers.map(member => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 font-medium">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-medium text-stone-900 dark:text-stone-100">
                    {member.name}
                  </p>
                  <p className="text-sm text-stone-500 dark:text-stone-600">
                    {member.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium',
                  member.role === 'admin'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300'
                )}>
                  {member.role === 'admin' ? 'Admin' : 'Konsulent'}
                </span>
                {member.participantCount > 0 && (
                  <span className="text-sm text-stone-500 dark:text-stone-600">
                    {member.participantCount} deltagare
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Data & Privacy */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-rose-100 dark:bg-rose-900/40 rounded-xl">
            <Shield className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">
              Data & Integritet
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-600">
              Hantera data och GDPR-relaterade inställningar
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors">
            <span className="font-medium text-stone-900 dark:text-stone-100">
              Exportera all data
            </span>
            <ChevronRight className="w-5 h-5 text-stone-600" />
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors">
            <span className="font-medium text-stone-900 dark:text-stone-100">
              Se åtkomstlogg
            </span>
            <ChevronRight className="w-5 h-5 text-stone-600" />
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors">
            <span className="font-medium text-stone-900 dark:text-stone-100">
              Integritetspolicy
            </span>
            <ChevronRight className="w-5 h-5 text-stone-600" />
          </button>
        </div>
      </Card>
    </div>
  )
}
