import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Briefcase,
  FileText,
  Heart,
  Target,
  BookText,
  Compass,
  GraduationCap,
  MessageSquare,
  CalendarDays,
  Users,
  RefreshCw,
} from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { useOversiktHubSummary } from '@/hooks/useOversiktHubSummary'
import { useOnboardedHubsTracking } from '@/hooks/useOnboardedHubsTracking'
import { careerGoalLabel } from '@/utils/careerGoalLabel'
import { streakDays } from '@/utils/streakDays'
import { Sparkline } from '@/components/widgets/Sparkline'

/**
 * Översikt — polish round 3 (senior UI review, 6 prioritized changes).
 *
 * Typographic scale: 12 / 14 / 18 / 24 / 32 (förslag 2)
 * Hero: greeting + date-disc on right (förslag 3)
 * KPI cards: sparkline for mood (förslag 1)
 * Hubs: metadata subtitle from real data (förslag 4)
 * Activity feed: time-grouped (Idag / Denna vecka / Äldre) (förslag 5)
 * Stagger fade-in animations + card hover lift (förslag 6)
 */

const HUB_ID = 'oversikt' as const

const SWEDISH_MONTHS = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
] as const

const SWEDISH_DAYS = [
  'söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag',
] as const

const SWEDISH_DAYS_SHORT = [
  'sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör',
] as const

function formatExactDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  const sameYear = d.getFullYear() === today.getFullYear()
  return sameYear
    ? `${d.getDate()} ${SWEDISH_MONTHS[d.getMonth()]}`
    : `${d.getDate()} ${SWEDISH_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function formatHeroDate(d: Date): string {
  return `${SWEDISH_DAYS[d.getDay()]}, ${d.getDate()} ${SWEDISH_MONTHS[d.getMonth()]}`
}

function isSameDay(a: string | Date | null | undefined, b: Date): boolean {
  if (!a) return false
  const d = typeof a === 'string' ? new Date(a) : a
  return d.getFullYear() === b.getFullYear() && d.getMonth() === b.getMonth() && d.getDate() === b.getDate()
}

function daysSince(iso: string): number {
  const then = new Date(iso)
  const now = new Date()
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24))
}

function relativeWhen(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = daysSince(iso)
  if (d <= 0) return 'Idag'
  if (d === 1) return 'I går'
  if (d < 7) return `${d} dagar sen`
  if (d < 14) return '1 vecka sen'
  if (d < 30) return `${Math.floor(d / 7)} veckor sen`
  return formatExactDate(iso)
}

interface NextStepCandidate {
  heading: string
  body: string
  ctaLabel: string
  ctaHref: string
}

// Animation variants — staggered fade-up per section (förslag 6)
const sectionVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
}

export default function HubOverview() {
  const { t } = useTranslation()
  useOnboardedHubsTracking(HUB_ID)
  const { data: summary } = useOversiktHubSummary()

  const firstName = summary?.profile?.full_name?.trim().split(/\s+/)[0] ?? null
  const today = new Date()

  // ---------- Status (3 KPIer) ----------
  const cvStatus = useMemo(() => {
    const cv = summary?.jobsok?.cv
    if (!cv) return { value: 'Inget CV', meta: 'Kom igång när du är redo', isEmpty: true }
    return {
      value: 'Uppdaterat',
      meta: `Senast ${formatExactDate(cv.updated_at)}`,
      isEmpty: false,
    }
  }, [summary?.jobsok?.cv])

  const applicationsStatus = useMemo(() => {
    const total = summary?.jobsok?.applicationStats?.total ?? 0
    if (total === 0) return { value: 'Inga än', meta: 'Börja när du är redo', isEmpty: true }
    return { value: `${total} aktiva`, meta: 'Bra att du är på gång', isEmpty: false }
  }, [summary?.jobsok?.applicationStats])

  // Mood KPI: sparkline + qualitative label (förslag 1)
  const moodLogs = summary?.minVardag?.recentMoodLogs ?? []
  const moodValues = useMemo(() => {
    // Sort ascending by date and extract mood_level for sparkline
    return [...moodLogs]
      .sort((a, b) => a.log_date.localeCompare(b.log_date))
      .map((l) => l.mood_level)
  }, [moodLogs])

  const moodStatus = useMemo(() => {
    const latest = moodLogs[0]
    if (!latest) return { value: 'Inte loggat', meta: 'Logga om du vill', isEmpty: true }
    if (isSameDay(latest.log_date, today)) {
      return { value: 'Loggat idag', meta: 'Bra rutin du har', isEmpty: false }
    }
    return {
      value: `Senast ${formatExactDate(latest.log_date)}`,
      meta: 'Logga om du vill',
      isEmpty: false,
    }
  }, [moodLogs, today])

  // ---------- Nästa steg (rotating candidate list) ----------
  const nextStepCandidates = useMemo<NextStepCandidate[]>(() => {
    if (!summary) return []
    const candidates: NextStepCandidate[] = []
    if (cvStatus.isEmpty) {
      candidates.push({
        heading: 'Vill du börja med ditt CV idag?',
        body: 'Ett CV gör att du kan söka jobb när du hittar något du gillar. Vi guidar dig steg för steg.',
        ctaLabel: 'Öppna CV →',
        ctaHref: '/cv',
      })
    }
    if (applicationsStatus.isEmpty) {
      candidates.push({
        heading: 'Vill du börja titta på jobb idag?',
        body: 'Vi hjälper dig hitta jobb som matchar din profil. Du behöver inte ansöka — bara titta.',
        ctaLabel: 'Öppna Söka jobb →',
        ctaHref: '/jobb',
      })
    }
    if (!summary.karriar?.careerGoals?.shortTerm) {
      candidates.push({
        heading: 'Vad vill du på sikt?',
        body: 'Sätt ett karriärmål — det hjälper oss föreslå jobb som matchar.',
        ctaLabel: 'Öppna Karriär →',
        ctaHref: '/karriar',
      })
    }
    if (moodStatus.isEmpty) {
      candidates.push({
        heading: 'Hur mår du idag?',
        body: 'Logga ditt mående med ett klick — när du vill.',
        ctaLabel: 'Öppna Hälsa →',
        ctaHref: '/wellness',
      })
    }
    candidates.push({
      heading: 'Fortsätt med dina mål',
      body: 'Du är på god väg. Kolla din karriärplan eller ta nästa steg i din hub.',
      ctaLabel: 'Öppna Karriär →',
      ctaHref: '/karriar',
    })
    candidates.push({
      heading: 'Reflektera över din vecka',
      body: 'Skriv några rader i dagboken — när du vill.',
      ctaLabel: 'Öppna Dagbok →',
      ctaHref: '/diary',
    })
    return candidates
  }, [summary, cvStatus.isEmpty, applicationsStatus.isEmpty, moodStatus.isEmpty])

  const [stepIndex, setStepIndex] = useState(0)
  const nextStep = nextStepCandidates[stepIndex % Math.max(nextStepCandidates.length, 1)] ?? null
  const canRotate = nextStepCandidates.length > 1

  // ---------- Hub metadata (förslag 4) ----------
  const hubMeta = useMemo(() => {
    const apps = summary?.jobsok?.applicationStats?.total ?? 0
    const goals = summary?.karriar?.careerGoals?.shortTerm ? 1 : 0
    const articles = summary?.resurser?.recentArticles?.length ?? 0
    const streak = streakDays(moodLogs)
    return {
      jobb: apps > 0 ? `${apps} aktiva ansökningar` : 'Hitta nya jobb',
      karriar: goals > 0 ? '1 aktivt mål' : 'Sätt en riktning',
      resurser: articles > 0 ? `${articles} senaste artiklar` : 'Bläddra biblioteket',
      'min-vardag': streak > 0 ? `${streak} dagar i rad` : 'Logga ditt mående',
    }
  }, [summary, moodLogs])

  // ---------- Activity feed grouped by time (förslag 5) ----------
  type ActivityItem = {
    key: string
    icon: typeof Heart
    domain: 'action' | 'activity' | 'wellbeing' | 'info'
    label: React.ReactNode
    iso: string
    href?: string
  }

  const activity = useMemo(() => {
    const items: ActivityItem[] = []
    const cv = summary?.jobsok?.cv
    if (cv) {
      items.push({
        key: 'cv-' + cv.id, icon: FileText, domain: 'action',
        label: 'Du uppdaterade ditt CV', iso: cv.updated_at, href: '/cv',
      })
    }
    const mood = moodLogs[0]
    if (mood) {
      items.push({
        key: 'mood-' + mood.log_date, icon: Heart, domain: 'wellbeing',
        label: 'Du loggade ditt mående', iso: mood.log_date, href: '/wellness',
      })
    }
    const latestDiary = summary?.minVardag?.latestDiaryEntry
    if (latestDiary) {
      items.push({
        key: 'diary-' + latestDiary.id, icon: BookText, domain: 'wellbeing',
        label: 'Du skrev i dagboken', iso: latestDiary.created_at, href: '/diary',
      })
    }
    const goalLabelText = careerGoalLabel(summary?.karriar?.careerGoals?.shortTerm)
    const goalUpdatedAt = summary?.karriar?.careerGoals?.updatedAt
    if (goalLabelText && goalUpdatedAt) {
      items.push({
        key: 'goal-' + goalUpdatedAt, icon: Target, domain: 'info',
        label: <>Du satte ett karriärmål: <strong>{goalLabelText}</strong></>,
        iso: goalUpdatedAt, href: '/karriar',
      })
    }
    const aiSession = summary?.resurser?.aiTeamSessions?.[0]
    if (aiSession) {
      items.push({
        key: 'ai-' + aiSession.agent_id, icon: MessageSquare, domain: 'info',
        label: 'Du startade ett samtal med AI-team', iso: aiSession.updated_at, href: '/ai-team',
      })
    }
    const apps = summary?.jobsok?.applicationStats?.total ?? 0
    if (apps > 0) {
      items.push({
        key: 'apps', icon: Briefcase, domain: 'activity',
        label: `Du har ${apps} aktiva ansökningar`, iso: new Date().toISOString(), href: '/jobb',
      })
    }
    const upcoming = summary?.minVardag?.upcomingEvents ?? []
    const nextMeeting = upcoming.find((e) => e.type === 'meeting' || e.type === 'consultant') ?? upcoming[0]
    if (nextMeeting) {
      items.push({
        key: 'meeting-' + nextMeeting.id, icon: CalendarDays, domain: 'wellbeing',
        label: <>Nästa möte: <strong>{nextMeeting.title}</strong></>,
        iso: nextMeeting.date, href: '/calendar',
      })
    }
    const consultant = summary?.minVardag?.consultant
    if (consultant?.full_name) {
      items.push({
        key: 'consultant-' + consultant.id, icon: Users, domain: 'wellbeing',
        label: <>Din konsulent: <strong>{consultant.full_name}</strong></>,
        iso: new Date().toISOString(), href: '/my-consultant',
      })
    }
    return items.sort((a, b) => new Date(b.iso).getTime() - new Date(a.iso).getTime())
  }, [summary, moodLogs])

  const groupedActivity = useMemo(() => {
    const today: ActivityItem[] = []
    const week: ActivityItem[] = []
    const older: ActivityItem[] = []
    for (const item of activity) {
      const d = daysSince(item.iso)
      if (d <= 0) today.push(item)
      else if (d < 7) week.push(item)
      else older.push(item)
    }
    return { today, week, older }
  }, [activity])

  return (
    <PageLayout
      title={t('nav.hubs.oversikt', 'Översikt')}
      subtitle={t('hubs.oversikt.subtitle', 'Din samlade vy — det viktigaste från alla hubbar')}
      domain="action"
      showTabs={false}
      contentClassName="space-y-10"
    >
      {/* 1. Hero — vänster: hälsning, höger: datum-disc (förslag 3) */}
      <motion.header
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between gap-6"
        aria-labelledby="hero-greeting"
      >
        <div>
          <h2
            id="hero-greeting"
            className="text-[32px] font-bold text-[var(--stone-900)] leading-tight tracking-tight m-0"
          >
            {firstName ? `Hej ${firstName}` : 'Välkommen tillbaka'}
          </h2>
          <p className="text-[14px] text-[var(--stone-600)] mt-1.5">
            <time dateTime={today.toISOString().slice(0, 10)}>{formatHeroDate(today)}</time>
          </p>
        </div>

        {/* Datum-disc — förslag 3 */}
        <div
          aria-hidden="true"
          className="hidden md:flex flex-col items-center justify-center w-[72px] h-[72px] rounded-full bg-[var(--c-bg)] border-2 border-[var(--c-accent)] flex-shrink-0"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--c-text)] leading-none">
            {SWEDISH_DAYS_SHORT[today.getDay()]}
          </span>
          <span className="text-[24px] font-bold text-[var(--c-text)] leading-none mt-1">
            {today.getDate()}
          </span>
        </div>
      </motion.header>

      {/* 2. En idé för idag */}
      {nextStep && (
        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          transition={{ duration: 0.35, delay: 0.05 }}
          aria-labelledby="nextstep-heading"
          className="bg-[var(--c-bg)] border border-[var(--c-accent)] rounded-[16px] p-[24px_28px] flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--c-text)] mb-1.5">
              En idé för idag
            </p>
            <h3
              id="nextstep-heading"
              className="text-[24px] font-semibold text-[var(--stone-900)] tracking-tight m-0 mb-1.5 leading-snug"
            >
              {nextStep.heading}
            </h3>
            <p className="text-[14px] text-[var(--stone-600)] leading-[1.5] max-w-[540px] m-0">
              {nextStep.body}
            </p>
            <p className="text-[12px] text-[var(--stone-500)] mt-2.5 m-0">
              — Förslag baserat på vad du gjort senast.{' '}
              {canRotate && (
                <button
                  type="button"
                  onClick={() => setStepIndex((i) => i + 1)}
                  className="underline text-[var(--c-text)] hover:text-[var(--c-solid)]"
                >
                  Visa annat förslag
                </button>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {canRotate && (
              <button
                type="button"
                onClick={() => setStepIndex((i) => i + 1)}
                aria-label="Visa annat förslag"
                title="Visa annat förslag"
                className="md:inline-flex hidden items-center justify-center w-10 h-10 rounded-[10px] bg-white/60 hover:bg-white border border-[var(--c-accent)] text-[var(--c-text)] transition-colors"
              >
                <RefreshCw size={16} />
              </button>
            )}
            <Link
              to={nextStep.ctaHref}
              className="inline-flex items-center gap-2 bg-white border border-[var(--c-solid)] text-[var(--c-text)] px-5 py-3 rounded-[10px] text-[14px] font-semibold no-underline hover:bg-[var(--c-bg)] whitespace-nowrap transition-colors"
            >
              {nextStep.ctaLabel}
            </Link>
          </div>
        </motion.section>
      )}

      {/* 3. Status-rad — Mood har sparkline (förslag 1) */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ duration: 0.35, delay: 0.1 }}
        aria-label="Min status"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <StatusCard
          domain="action"
          icon={FileText}
          label="CV"
          value={cvStatus.value}
          meta={cvStatus.meta}
        />
        <StatusCard
          domain="activity"
          icon={Briefcase}
          label="Ansökningar"
          value={applicationsStatus.value}
          meta={applicationsStatus.meta}
        />
        <StatusCard
          domain="wellbeing"
          icon={Heart}
          label="Mående"
          value={moodStatus.value}
          meta={moodStatus.meta}
          visualization={
            moodValues.length >= 2 ? (
              <Sparkline values={moodValues} width={120} height={28} showEndpoint />
            ) : undefined
          }
        />
      </motion.section>

      {/* 4. Senaste aktivitet — grupperad efter tid (förslag 5) */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ duration: 0.35, delay: 0.15 }}
        aria-labelledby="activity-heading"
      >
        <SectionHeading
          id="activity-heading"
          title="Senaste aktivitet"
          rightLink={activity.length > 0 ? { to: '/oversikt/historik', label: 'Visa allt →' } : undefined}
        />
        <div className="bg-[var(--surface)] border border-[var(--stone-200)] rounded-[14px] py-2">
          {activity.length === 0 ? (
            <div className="px-5 py-7 text-center">
              <p className="text-[14px] text-[var(--stone-700)] font-medium m-0 mb-1">
                Här samlas din historik
              </p>
              <p className="text-[12px] text-[var(--stone-500)] m-0">
                När du gör något i appen dyker det upp här.
              </p>
            </div>
          ) : (
            <ul className="list-none m-0 p-0">
              <ActivityGroup label="Idag" items={groupedActivity.today} />
              <ActivityGroup label="Denna vecka" items={groupedActivity.week} />
              <ActivityGroup label="Äldre" items={groupedActivity.older} />
            </ul>
          )}
        </div>
      </motion.section>

      {/* 5. Hubs — med metadata (förslag 4) */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ duration: 0.35, delay: 0.2 }}
        aria-labelledby="hubs-heading"
      >
        <SectionHeading id="hubs-heading" title="Hubs" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <HubCard to="/jobb" domain="activity" icon={Briefcase} title="Söka jobb" meta={hubMeta.jobb} />
          <HubCard to="/karriar" domain="info" icon={Compass} title="Karriär" meta={hubMeta.karriar} />
          <HubCard to="/resurser" domain="info" icon={GraduationCap} title="Resurser" meta={hubMeta.resurser} />
          <HubCard to="/min-vardag" domain="wellbeing" icon={Heart} title="Min Vardag" meta={hubMeta['min-vardag']} />
        </div>
      </motion.section>
    </PageLayout>
  )
}

// ============================================================
// Subkomponenter
// ============================================================

type Domain = 'action' | 'activity' | 'wellbeing' | 'info'

function domainBgClass(d: Domain): string {
  switch (d) {
    case 'action': return 'bg-[var(--action-bg)] text-[var(--action-text)]'
    case 'activity': return 'bg-[var(--activity-bg)] text-[var(--activity-text)]'
    case 'wellbeing': return 'bg-[var(--wellbeing-bg)] text-[var(--wellbeing-text)]'
    case 'info': return 'bg-[var(--info-bg)] text-[var(--info-text)]'
  }
}

interface ActivityRowItem {
  key: string
  icon: typeof Heart
  domain: Domain
  label: React.ReactNode
  iso: string
  href?: string
}

function ActivityGroup({ label, items }: { label: string; items: ActivityRowItem[] }) {
  if (items.length === 0) return null
  return (
    <>
      <li className="px-5 pt-2.5 pb-1.5">
        <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--stone-500)]">
          {label}
        </span>
      </li>
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
              <ActivityRowContent item={item} />
            </Link>
          ) : (
            <div className="flex items-center gap-3.5 px-5 py-3.5">
              <ActivityRowContent item={item} />
            </div>
          )}
        </li>
      ))}
    </>
  )
}

function ActivityRowContent({ item }: { item: ActivityRowItem }) {
  return (
    <>
      <span
        aria-hidden="true"
        className={['w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0', domainBgClass(item.domain)].join(' ')}
      >
        <item.icon size={14} />
      </span>
      <span className="flex-1 text-[14px] text-[var(--stone-800)]">{item.label}</span>
      <time className="text-[12px] text-[var(--stone-600)] flex-shrink-0" dateTime={item.iso.slice(0, 10)}>
        {relativeWhen(item.iso)}
      </time>
    </>
  )
}

function StatusCard({
  domain,
  icon: Icon,
  label,
  value,
  meta,
  visualization,
}: {
  domain: Domain
  icon: typeof Heart
  label: string
  value: string
  meta: string
  visualization?: React.ReactNode
}) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.15 }}
      className="bg-[var(--surface)] border border-[var(--stone-200)] rounded-[14px] p-[18px_20px] shadow-sm hover:border-[var(--c-accent)] hover:shadow-md transition-[border-color,box-shadow]"
      data-domain={domain}
    >
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className={['w-9 h-9 rounded-[8px] flex items-center justify-center', domainBgClass(domain)].join(' ')}
          >
            <Icon size={18} strokeWidth={2.25} />
          </span>
          <span className="text-[14px] font-semibold text-[var(--stone-700)]">{label}</span>
        </div>
        {visualization && (
          <div data-domain={domain} className="flex-shrink-0">
            {visualization}
          </div>
        )}
      </div>
      <p className="text-[24px] font-bold text-[var(--stone-900)] leading-tight tracking-tight m-0">
        {value}
      </p>
      <p className="text-[12px] text-[var(--stone-600)] mt-1 m-0">{meta}</p>
    </motion.div>
  )
}

function HubCard({
  to,
  domain,
  icon: Icon,
  title,
  meta,
}: {
  to: string
  domain: Domain
  icon: typeof Heart
  title: string
  meta: string
}) {
  return (
    <Link to={to} className="block no-underline">
      <motion.div
        whileHover={{ y: -2, scale: 1.02 }}
        transition={{ duration: 0.15 }}
        className="bg-[var(--surface)] border border-[var(--stone-200)] rounded-[14px] p-[20px_22px] hover:border-[var(--c-solid)] hover:shadow-md transition-[border-color,box-shadow]"
        data-domain={domain}
      >
        <span
          aria-hidden="true"
          className={['inline-flex w-10 h-10 rounded-[10px] items-center justify-center mb-3', domainBgClass(domain)].join(' ')}
        >
          <Icon size={20} strokeWidth={2} />
        </span>
        <p className="text-[14px] font-bold text-[var(--stone-900)] m-0 mb-1">{title}</p>
        <p className="text-[12px] text-[var(--stone-600)] m-0 leading-snug">{meta}</p>
        <p aria-hidden="true" className="text-[12px] text-[var(--stone-400)] mt-3.5 text-right m-0">→</p>
      </motion.div>
    </Link>
  )
}

function SectionHeading({
  id,
  title,
  rightLink,
}: {
  id: string
  title: string
  rightLink?: { to: string; label: string }
}) {
  return (
    <div className="flex items-center gap-2.5 mb-3.5">
      <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-[var(--c-solid)] flex-shrink-0" />
      <h3 id={id} className="text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--c-text)] m-0">
        {title}
      </h3>
      <div className="flex-1 h-px bg-[var(--c-accent)] opacity-60" />
      {rightLink && (
        <Link
          to={rightLink.to}
          className="text-[12px] font-semibold text-[var(--c-text)] hover:text-[var(--c-solid)] no-underline"
        >
          {rightLink.label}
        </Link>
      )}
    </div>
  )
}
