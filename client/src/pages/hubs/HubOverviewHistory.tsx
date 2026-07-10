import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import {
  Briefcase,
  FileText,
  Heart,
  Target,
  BookText,
  MessageSquare,
  CalendarDays,
  Users,
  ArrowLeft,
} from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { useOversiktHubSummary } from '@/hooks/useOversiktHubSummary'
import { careerGoalLabel } from '@/utils/careerGoalLabel'
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageFocusShell } from '@/components/focus/shell/PageFocusShell'

/**
 * Översikt-historik — full lista över aktiviteter (ingen 5-cap som på Översikt).
 * Reachable via "Visa allt →" från Översiktens aktivitetsfeed (förslag 17).
 */

const SWEDISH_MONTHS = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
] as const

function formatExactDate(iso: string | null | undefined, t: TFunction): string {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  const month = t(`hubs.months.${d.getMonth()}`, SWEDISH_MONTHS[d.getMonth()])
  const sameYear = d.getFullYear() === today.getFullYear()
  return sameYear
    ? `${d.getDate()} ${month}`
    : `${d.getDate()} ${month} ${d.getFullYear()}`
}

function relativeWhen(iso: string | null | undefined, t: TFunction): string {
  if (!iso) return ''
  const then = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - then.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return t('hubs.relativeTime.today', 'Idag')
  if (diffDays === 1) return t('hubs.relativeTime.yesterday', 'I går')
  if (diffDays < 7) return t('hubs.relativeTime.daysAgo', { defaultValue: '{{count}} dagar sen', count: diffDays })
  if (diffDays < 14) return t('hubs.relativeTime.oneWeekAgo', '1 vecka sen')
  if (diffDays < 30) return t('hubs.relativeTime.weeksAgo', { defaultValue: '{{count}} veckor sen', count: Math.floor(diffDays / 7) })
  return formatExactDate(iso, t)
}

type Domain = 'action' | 'activity' | 'wellbeing' | 'info'

function domainBgClass(d: Domain): string {
  switch (d) {
    case 'action': return 'bg-[var(--action-bg)] text-[var(--action-text)]'
    case 'activity': return 'bg-[var(--activity-bg)] text-[var(--activity-text)]'
    case 'wellbeing': return 'bg-[var(--wellbeing-bg)] text-[var(--wellbeing-text)]'
    case 'info': return 'bg-[var(--info-bg)] text-[var(--info-text)]'
  }
}

export default function HubOverviewHistory() {
  const { t } = useTranslation()
  const { isFocusMode, toggleFocusMode } = useFocusMode()

  if (isFocusMode) {
    return (
      <PageFocusShell
        title={t('hubOverviewHistory.title', 'Aktivitet')}
        icon={CalendarDays}
        domain="action"
      >
        <HubHistoryFocus onExit={toggleFocusMode} />
      </PageFocusShell>
    )
  }

  return <HubOverviewHistoryInner />
}

function HubHistoryFocus({ onExit }: { onExit: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="max-w-lg mx-auto text-center space-y-6 pt-8">
      <div className="w-16 h-16 rounded-full bg-[var(--c-accent)]/40 flex items-center justify-center mx-auto">
        <CalendarDays className="w-8 h-8 text-[var(--c-solid)]" />
      </div>
      <p className="text-stone-600 dark:text-stone-300">
        {t(
          'focus.hubHistory.intro',
          'Historik är en stor lista. I fokusläge tittar vi på den i normalvyn för bättre översikt.'
        )}
      </p>
      <button
        onClick={onExit}
        className="w-full py-4 rounded-xl bg-[var(--c-solid)] text-white font-semibold text-lg"
      >
        {t('focus.hubHistory.openNormal', 'Visa i normalläge')}
      </button>
    </div>
  )
}

function HubOverviewHistoryInner() {
  const { t } = useTranslation()
  const { data: summary } = useOversiktHubSummary()

  const items = useMemo(() => {
    type Item = {
      key: string
      icon: typeof Heart
      domain: Domain
      label: React.ReactNode
      iso: string
      href?: string
    }
    const result: Item[] = []

    const cv = summary?.jobsok?.cv
    if (cv) {
      result.push({
        key: 'cv-' + cv.id,
        icon: FileText,
        domain: 'action',
        label: t('hubOverviewHistory.updatedCv', 'Du uppdaterade ditt CV'),
        iso: cv.updated_at,
        href: '/cv',
      })
    }
    const moodLogs = summary?.minVardag?.recentMoodLogs ?? []
    moodLogs.forEach((m, i) => {
      result.push({
        key: 'mood-' + m.log_date + '-' + i,
        icon: Heart,
        domain: 'wellbeing',
        label: t('hubOverviewHistory.loggedMood', 'Du loggade ditt mående'),
        iso: m.log_date,
        href: '/wellness',
      })
    })
    const latestDiary = summary?.minVardag?.latestDiaryEntry
    if (latestDiary) {
      result.push({
        key: 'diary-' + latestDiary.id,
        icon: BookText,
        domain: 'wellbeing',
        label: t('hubOverviewHistory.wroteDiary', 'Du skrev i dagboken'),
        iso: latestDiary.created_at,
        href: '/diary',
      })
    }
    const goalLabelText = careerGoalLabel(summary?.karriar?.careerGoals?.shortTerm)
    const goalUpdatedAt = summary?.karriar?.careerGoals?.updatedAt
    if (goalLabelText && goalUpdatedAt) {
      result.push({
        key: 'goal-' + goalUpdatedAt,
        icon: Target,
        domain: 'info',
        label: <>{t('hubOverviewHistory.setCareerGoalPrefix', 'Du satte ett karriärmål:')} <strong>{goalLabelText}</strong></>,
        iso: goalUpdatedAt,
        href: '/karriar',
      })
    }
    const aiSessions = summary?.resurser?.aiTeamSessions ?? []
    aiSessions.forEach((s, i) => {
      result.push({
        key: 'ai-' + s.agent_id + '-' + i,
        icon: MessageSquare,
        domain: 'info',
        label: t('hubOverviewHistory.startedAiChat', 'Du startade ett samtal med AI-team'),
        iso: s.updated_at,
        href: '/ai-team',
      })
    })
    const apps = summary?.jobsok?.applicationStats?.total ?? 0
    if (apps > 0) {
      result.push({
        key: 'apps',
        icon: Briefcase,
        domain: 'activity',
        label: t('hubOverviewHistory.activeApplications', { defaultValue: 'Du har {{count}} aktiva ansökningar', count: apps }),
        iso: new Date().toISOString(),
        href: '/jobb',
      })
    }
    const upcoming = summary?.minVardag?.upcomingEvents ?? []
    upcoming.forEach((e) => {
      result.push({
        key: 'event-' + e.id,
        icon: CalendarDays,
        domain: 'wellbeing',
        label: <>{t('hubOverviewHistory.meetingPrefix', 'Möte:')} <strong>{e.title}</strong></>,
        iso: e.date,
        href: '/calendar',
      })
    })
    const consultant = summary?.minVardag?.consultant
    if (consultant?.full_name) {
      result.push({
        key: 'consultant-' + consultant.id,
        icon: Users,
        domain: 'wellbeing',
        label: <>{t('hubOverviewHistory.consultantPrefix', 'Din konsulent:')} <strong>{consultant.full_name}</strong></>,
        iso: new Date().toISOString(),
        href: '/my-consultant',
      })
    }

    return result.sort((a, b) => new Date(b.iso).getTime() - new Date(a.iso).getTime())
  }, [summary, t])

  return (
    <PageLayout
      title={t('hubs.oversikt.history.title', 'Historik')}
      subtitle={t('hubs.oversikt.history.subtitle', 'Hela din aktivitet i portalen')}
      domain="action"
      showTabs={false}
      actions={
        <Link
          to="/oversikt"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] text-[13px] text-[var(--stone-600)] hover:bg-[var(--stone-100)] no-underline"
        >
          <ArrowLeft size={14} />
          {t('hubOverviewHistory.backToOverview', 'Tillbaka till Översikten')}
        </Link>
      }
    >
      <div className="bg-[var(--surface)] border border-[var(--stone-200)] rounded-[14px] py-2">
        {items.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-[14px] text-[var(--stone-700)] font-medium m-0 mb-1">
              {t('hubOverviewHistory.emptyTitle', 'Här samlas din historik')}
            </p>
            <p className="text-[12px] text-[var(--stone-500)] m-0">
              {t('hubOverviewHistory.emptyBody', 'När du gör något i appen dyker det upp här.')}
            </p>
          </div>
        ) : (
          <ul className="list-none m-0 p-0">
            {items.map((item, i) => (
              <li
                key={item.key}
                className={i < items.length - 1 ? 'border-b border-[var(--stone-100)]' : ''}
              >
                {item.href ? (
                  <Link
                    to={item.href}
                    className="flex items-center gap-3.5 px-5 py-3.5 no-underline hover:bg-[var(--stone-50)] transition-colors"
                  >
                    <span
                      aria-hidden="true"
                      className={['w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0', domainBgClass(item.domain)].join(' ')}
                    >
                      <item.icon size={14} />
                    </span>
                    <span className="flex-1 text-[14px] text-[var(--stone-800)]">{item.label}</span>
                    <time className="text-[12px] text-[var(--stone-600)] flex-shrink-0" dateTime={item.iso.slice(0, 10)}>
                      {relativeWhen(item.iso, t)}
                    </time>
                  </Link>
                ) : (
                  <div className="flex items-center gap-3.5 px-5 py-3.5">
                    <span
                      aria-hidden="true"
                      className={['w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0', domainBgClass(item.domain)].join(' ')}
                    >
                      <item.icon size={14} />
                    </span>
                    <span className="flex-1 text-[14px] text-[var(--stone-800)]">{item.label}</span>
                    <time className="text-[12px] text-[var(--stone-600)] flex-shrink-0" dateTime={item.iso.slice(0, 10)}>
                      {relativeWhen(item.iso, t)}
                    </time>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* DESIGN.md §7 — kontextualiserade förslag när nästan tomt (< 3 items).
          Hjälper en ny användare att hitta nästa steg istället för en stor blank yta. */}
      {items.length < 3 && (
        <section aria-labelledby="suggestions-heading" className="mt-6 sm:mt-8">
          <h2
            id="suggestions-heading"
            className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--stone-600)] mb-3 px-1"
          >
            {t('hubOverviewHistory.suggestionsHeading', 'Här är 3 saker du kan utforska')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              to="/jobb"
              className="block p-4 bg-[var(--surface)] border border-[var(--stone-200)] rounded-[12px] hover:border-[var(--activity-solid)] hover:shadow-sm transition-all no-underline"
            >
              <div className="w-9 h-9 rounded-lg bg-[var(--activity-bg)] flex items-center justify-center mb-3">
                <Briefcase size={18} className="text-[var(--activity-text)]" />
              </div>
              <h3 className="text-[14px] font-bold text-[var(--stone-900)] m-0">{t('hubOverviewHistory.suggestJobTitle', 'Sök ditt första jobb')}</h3>
              <p className="text-[12px] text-[var(--stone-600)] mt-1 m-0">{t('hubOverviewHistory.suggestJobDesc', 'Hitta jobb från Platsbanken som matchar dig.')}</p>
            </Link>
            <Link
              to="/karriar"
              className="block p-4 bg-[var(--surface)] border border-[var(--stone-200)] rounded-[12px] hover:border-[var(--coaching-solid)] hover:shadow-sm transition-all no-underline"
            >
              <div className="w-9 h-9 rounded-lg bg-[var(--coaching-bg)] flex items-center justify-center mb-3">
                <Target size={18} className="text-[var(--coaching-text)]" />
              </div>
              <h3 className="text-[14px] font-bold text-[var(--stone-900)] m-0">{t('hubOverviewHistory.suggestGoalTitle', 'Sätt ett karriärmål')}</h3>
              <p className="text-[12px] text-[var(--stone-600)] mt-1 m-0">{t('hubOverviewHistory.suggestGoalDesc', 'Beskriv var du vill — vi hjälper dig dit.')}</p>
            </Link>
            <Link
              to="/min-vardag"
              className="block p-4 bg-[var(--surface)] border border-[var(--stone-200)] rounded-[12px] hover:border-[var(--wellbeing-solid)] hover:shadow-sm transition-all no-underline"
            >
              <div className="w-9 h-9 rounded-lg bg-[var(--wellbeing-bg)] flex items-center justify-center mb-3">
                <Heart size={18} className="text-[var(--wellbeing-text)]" />
              </div>
              <h3 className="text-[14px] font-bold text-[var(--stone-900)] m-0">{t('hubOverviewHistory.suggestMoodTitle', 'Logga ditt mående')}</h3>
              <p className="text-[12px] text-[var(--stone-600)] mt-1 m-0">{t('hubOverviewHistory.suggestMoodDesc', 'Liten check-in — bara för dig.')}</p>
            </Link>
          </div>
        </section>
      )}
    </PageLayout>
  )
}
