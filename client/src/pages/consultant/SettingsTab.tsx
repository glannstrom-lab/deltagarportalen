/**
 * SettingsTab - Consultant Settings and Preferences
 * Notification settings, team management, and preferences
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Settings,
  Bell,
  Clock,
  Globe,
  Shield,
  Palette,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Save,
  Loader2,
  CheckCircle,
  Download,
} from '@/components/ui/icons'
import { supabase } from '@/lib/supabase'
import { notifications as toast } from '@/lib/toast'
import { consultantService } from '@/services/consultantService'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { ProgramSelector } from '@/components/settings/ProgramSelector'
import { OrganisationSektion } from '@/components/consultant/OrganisationSektion'
import { cn } from '@/lib/utils'

interface NotificationSetting {
  id: string
  label: string
  description: string
  enabled: boolean
  channel: 'email' | 'push' | 'both'
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
        enabled ? 'bg-[var(--c-solid)]' : 'bg-stone-300 dark:bg-stone-600'
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
          <Icon className="w-5 h-5 text-stone-500 dark:text-stone-400" />
        </div>
        <div>
          <p className="font-medium text-stone-900 dark:text-stone-100">{label}</p>
          {description && (
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
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
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  // KS7: en misslyckad hämtning fick tidigare bara ett console.error — sidan
  // renderade oförändrat med defaultinställningarna, som om allt var klart.
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [exporting, setExporting] = useState(false)
  // KK5: samma avvägning som ReportDraftDialogs "Ta med orosanteckningar" —
  // kategorin "Oro" är konsulentens interna riskbedömning, inte något som
  // ska hamna i en nedladdad fil per default.
  const [includeConcern, setIncludeConcern] = useState(false)

  const getDefaultNotifications = (): NotificationSetting[] => [
    {
      id: 'new_participant',
      label: t('consultant.settings.newParticipantAssigned'),
      description: t('consultant.settings.whenAssigned'),
      enabled: true,
      channel: 'both',
    },
    {
      id: 'participant_inactive',
      label: t('consultant.settings.participantInactive'),
      description: t('consultant.settings.notLoggedIn'),
      enabled: true,
      channel: 'email',
    },
    {
      id: 'goal_deadline',
      label: t('consultant.settings.goalDeadline'),
      description: t('consultant.settings.deadlineWithinDays'),
      enabled: true,
      channel: 'both',
    },
    {
      id: 'new_message',
      label: t('consultant.settings.newMessageReceived'),
      description: t('consultant.settings.messageFromParticipant'),
      enabled: true,
      channel: 'push',
    },
    {
      id: 'cv_updated',
      label: t('consultant.settings.cvUpdated'),
      description: t('consultant.settings.participantUpdatedCv'),
      enabled: false,
      channel: 'email',
    },
    {
      id: 'meeting_reminder',
      label: t('consultant.settings.meetingReminder'),
      description: t('consultant.settings.reminderBeforeMeeting'),
      enabled: true,
      channel: 'both',
    },
  ]

  const defaultNotifications = getDefaultNotifications()

  const [notifications, setNotifications] = useState<NotificationSetting[]>(defaultNotifications)

  const [preferences, setPreferences] = useState({
    defaultView: 'grid' as 'grid' | 'list',
    language: 'sv' as 'sv' | 'en',
    timezone: 'Europe/Stockholm',
    weekStart: 'monday' as 'monday' | 'sunday',
    autoRefresh: true,
    showInactiveWarning: 7,
  })


  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      setLoadError(null)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch settings from database
      // KS7: `error` saknades tidigare här helt — ett trasigt anrop gav
      // `settingsData: undefined` som tolkades som "ingen sparad rad ännu"
      // och sidan visade tyst defaultinställningarna som om de var laddade.
      const { data: settingsData, error: fetchError } = await supabase
        .from('consultant_settings')
        .select('*')
        .eq('consultant_id', user.id)
        .maybeSingle() // .single() gav 406 för konsulenter utan sparad settings-rad

      if (fetchError) throw fetchError

      if (settingsData) {
        // Apply saved notifications
        if (settingsData.notifications) {
          const savedNotifs = settingsData.notifications as Record<string, { enabled?: boolean; channel?: string } | undefined>
          setNotifications(defaultNotifications.map(n => ({
            ...n,
            enabled: savedNotifs[n.id]?.enabled ?? n.enabled,
            channel: savedNotifs[n.id]?.channel ?? n.channel,
          })))
        }

        // Apply saved preferences
        if (settingsData.preferences) {
          const savedPrefs = settingsData.preferences as Record<string, unknown>
          setPreferences(prev => ({
            ...prev,
            ...savedPrefs,
          }))
        }
      }

    } catch (error) {
      console.error('Error loading settings:', error)
      setLoadError('Inställningarna kunde inte hämtas. Kontrollera anslutningen och försök igen.')
    } finally {
      setLoading(false)
    }
  }

  const updateNotification = (id: string, field: keyof NotificationSetting, value: NotificationSetting[keyof NotificationSetting]) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, [field]: value } : n
    ))
    setHasChanges(true)
    setSaved(false)
  }

  const updatePreference = (key: string, value: unknown) => {
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

  // GDPR-export: laddar ner konsulentens egen yrkesdata som JSON.
  // Deltagardata ingår bara i form av konsulentens egna anteckningar/mål —
  // det är konsulentens behandlingsunderlag, inte deltagarens profildata.
  //
  // KK5 (2026-09-06): exporten tog tidigare med HELA historiken, inklusive
  // deltagare som brutit kopplingen — journalens fritext (kategorin "Oro")
  // om namngivna personer följde med okrypterat till en lokal fil. Fixen
  // ändrar bara EXPORTENS omfattning, inte åtkomstmodellen:
  //  - `consultant_journal`/`consultant_goals` är redan RLS-begränsade till
  //    aktiva relationer sedan KS2 (verifierat mot pg_policies 2026-09-06);
  //    filtreringen här är avsiktligt dubbel (defense in depth) och kostar
  //    ingenting eftersom RLS redan gjort jobbet.
  //  - `consultant_meetings`, `consultant_messages` och
  //    `consultant_placements` saknar motsvarande RLS-spärr (KS8 höll SELECT
  //    på meddelanden oförändrad med flit — historiska trådar ska fortsatt
  //    gå att LÄSA i UI:t). Den här exporten drar en snävare gräns än
  //    läsrätten: bara nuvarande caseload paketeras i filen.
  //  - `consultant_settings`, `consultant_goal_templates` och
  //    `consultant_job_collections` är inte knutna till en enskild
  //    deltagarrelation (inget `participant_id`) och lämnas orörda.
  const handleExportData = async () => {
    setExporting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [activeParticipantIds, settings, goals, journal, meetings, messages, templates, collections, placements] = await Promise.all([
        consultantService.getActiveParticipantIds(user.id),
        supabase.from('consultant_settings').select('*').eq('consultant_id', user.id).maybeSingle(),
        supabase.from('consultant_goals').select('*').eq('consultant_id', user.id),
        supabase.from('consultant_journal').select('*').eq('consultant_id', user.id),
        supabase.from('consultant_meetings').select('*').eq('consultant_id', user.id),
        supabase.from('consultant_messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
        supabase.from('consultant_goal_templates').select('*').eq('consultant_id', user.id),
        supabase.from('consultant_job_collections').select('*').eq('consultant_id', user.id),
        supabase.from('consultant_placements').select('*').eq('consultant_id', user.id),
      ])

      const isActiveParticipant = (participantId: string | null | undefined) =>
        !!participantId && activeParticipantIds.has(participantId)

      // "Oro" är konsulentens interna riskbedömning — samma undantag som
      // ReportDraftDialog redan gör för AI-rapportutkast, upprepat här.
      const journalEntries = (journal.data ?? []).filter(
        (entry: { participant_id: string; category: string }) =>
          isActiveParticipant(entry.participant_id) && (includeConcern || entry.category !== 'CONCERN')
      )
      const activeGoals = (goals.data ?? []).filter(
        (goal: { participant_id: string }) => isActiveParticipant(goal.participant_id)
      )
      const activeMeetings = (meetings.data ?? []).filter(
        (meeting: { participant_id: string }) => isActiveParticipant(meeting.participant_id)
      )
      const activeMessages = (messages.data ?? []).filter(
        (message: { sender_id: string; receiver_id: string }) =>
          isActiveParticipant(message.sender_id === user.id ? message.receiver_id : message.sender_id)
      )
      const activePlacements = (placements.data ?? []).filter(
        (placement: { participant_id: string }) => isActiveParticipant(placement.participant_id)
      )

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        consultantId: user.id,
        exportScope: 'Endast deltagare med en aktiv koppling. Avslutade relationer ingår inte.',
        settings: settings.data ?? null,
        goals: activeGoals,
        journal: journalEntries,
        meetings: activeMeetings,
        messages: activeMessages,
        goalTemplates: templates.data ?? [],
        jobCollections: collections.data ?? [],
        placements: activePlacements,
      }

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `jobin-konsulentdata-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success(t('consultant.settings.exportDone'))
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error(t('consultant.settings.exportError'))
    } finally {
      setExporting(false)
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

  // KS7: eget felläge — annars visas defaultinställningarna som om de vore
  // laddade, och ett sparat-men-osynkat val kan skriva över en riktig rad.
  if (loadError) {
    return (
      <Card className="p-8">
        <ErrorState
          title="Inställningarna kunde inte hämtas"
          message={loadError}
          onRetry={loadSettings}
        />
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Save Banner */}
      {(hasChanges || saved) && (
        <Card className={cn(
          'p-4 sticky top-4 z-10',
          saved
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
        )}>
          <div className="flex items-center justify-between">
            {saved ? (
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <CheckCircle className="w-5 h-5" />
                <p className="font-medium">{t('consultant.settings.saved')}</p>
              </div>
            ) : (
              <>
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  {t('consultant.settings.unsavedChanges')}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={handleReset}>
                    {t('consultant.settings.undo')}
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('consultant.settings.saving')}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {t('consultant.settings.save')}
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Project / Program */}
      <ProgramSelector />

      {/* Notification Settings */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 rounded-xl">
            <Bell className="w-6 h-6 text-[var(--c-solid)] dark:text-[var(--c-solid)]" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">
              {t('consultant.settings.notificationsTitle')}
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {t('consultant.settings.notificationsDesc')}
            </p>
          </div>
        </div>

        {/* KV7: inställningarna sparas i consultant_settings.notifications,
            men ingen cron/edge-funktion läser kolumnen — se grep-underlaget
            i roadmapen (client/vercel.json har bara jobb-bevakningens cron,
            supabase/functions har ingen träff på consultant_settings). Samma
            ärliga märkning som Team-sektionen redan använder nedanför. */}
        <p className="text-xs text-stone-500 dark:text-stone-400 -mt-2 mb-4">
          Kommande — de här aviseringarna skickas inte ännu. Dina val sparas, men levereras inte förrän funktionen är byggd.
        </p>

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
                <p className="text-sm text-stone-500 dark:text-stone-400">
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
                  <option value="email">{t('consultant.settings.email')}</option>
                  <option value="push">{t('consultant.settings.push')}</option>
                  <option value="both">{t('consultant.settings.both')}</option>
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
              {t('consultant.settings.preferences')}
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {t('consultant.settings.preferencesDesc')}
            </p>
          </div>
        </div>

        <div>
          <SettingRow
            icon={Palette}
            label={t('consultant.settings.defaultParticipantView')}
            description={t('consultant.settings.chooseDefaultView')}
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
              <option value="grid">{t('consultant.settings.grid')}</option>
              <option value="list">{t('consultant.settings.list')}</option>
            </select>
          </SettingRow>

          <SettingRow
            icon={Globe}
            label={t('consultant.settings.language')}
            description={t('consultant.settings.chooseLanguage')}
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
              <option value="sv">{t('consultant.settings.swedish')}</option>
              <option value="en">{t('consultant.settings.english')}</option>
            </select>
          </SettingRow>

          <SettingRow
            icon={Clock}
            label={t('consultant.settings.timezone')}
            description={t('consultant.settings.usedForMeetings')}
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
            label={t('consultant.settings.weekStart')}
            description={t('consultant.settings.affectsCalendar')}
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
              <option value="monday">{t('consultant.settings.monday')}</option>
              <option value="sunday">{t('consultant.settings.sunday')}</option>
            </select>
          </SettingRow>

          <SettingRow
            icon={AlertTriangle}
            label={t('consultant.settings.inactivityWarning')}
            description={t('consultant.settings.daysBeforeInactive')}
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
              <option value={5}>{t('consultant.settings.daysCount', { count: 5 })}</option>
              <option value={7}>{t('consultant.settings.daysCount', { count: 7 })}</option>
              <option value={14}>{t('consultant.settings.daysCount', { count: 14 })}</option>
            </select>
          </SettingRow>
        </div>
      </Card>

      {/* Organisation (KM2) — ersatte den hårdkodade tomma teamlistan 2026-09-11 */}
      <OrganisationSektion />

      {/* Data & Privacy */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-rose-100 dark:bg-rose-900/40 rounded-xl">
            <Shield className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">
              {t('consultant.settings.dataPrivacy')}
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {t('consultant.settings.dataPrivacyDesc')}
            </p>
          </div>
        </div>

        {/* Åtkomstlogg-knappen togs bort 2026-06-11: audit_logs har admin-only
            SELECT-RLS, så en konsulent kan aldrig läsa loggen härifrån. */}
        <div className="space-y-3">
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="w-full flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors disabled:opacity-60"
          >
            <span className="font-medium text-stone-900 dark:text-stone-100">
              {t('consultant.settings.exportAllData')}
            </span>
            {exporting
              ? <Loader2 className="w-5 h-5 text-stone-400 animate-spin" aria-hidden="true" />
              : <Download className="w-5 h-5 text-stone-400 dark:text-stone-500" aria-hidden="true" />}
          </button>
          <p className="text-xs text-stone-500 dark:text-stone-400 px-1">
            {t(
              'consultant.settings.exportScopeNote',
              'Omfattar bara deltagare du fortfarande handleder. Avslutade relationer ingår inte.'
            )}
          </p>
          <label className="flex items-center gap-2 px-1 cursor-pointer">
            <input
              type="checkbox"
              checked={includeConcern}
              onChange={e => setIncludeConcern(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 accent-stone-700"
            />
            <span className="text-sm text-stone-700 dark:text-stone-300">
              {t('consultant.settings.exportIncludeConcern', 'Ta med orosanteckningar')}
            </span>
          </label>
          {!includeConcern && (
            <p className="text-xs text-stone-500 dark:text-stone-400 px-1">
              {t(
                'consultant.settings.exportIncludeConcernNote',
                'Orosanteckningar (kategori "Oro") är interna och tas inte med i exporten om du inte aktivt väljer det.'
              )}
            </p>
          )}
          <button
            onClick={() => navigate('/privacy')}
            className="w-full flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
          >
            <span className="font-medium text-stone-900 dark:text-stone-100">
              {t('consultant.settings.privacyPolicy')}
            </span>
            <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" aria-hidden="true" />
          </button>
        </div>
      </Card>
    </div>
  )
}
