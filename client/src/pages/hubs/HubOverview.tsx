import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Briefcase,
  FileText,
  Heart,
  Target,
  BookText,
  Compass,
  GraduationCap,
  MessageSquare,
} from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { useOversiktHubSummary } from '@/hooks/useOversiktHubSummary'
import { useOnboardedHubsTracking } from '@/hooks/useOnboardedHubsTracking'
import { careerGoalLabel } from '@/utils/careerGoalLabel'

/**
 * Översikt — clean rebuild (oversikt-sketch-v2.html).
 *
 * Five blocks:
 *   1. Hero — varm hälsning + datum
 *   2. En idé för idag — EN konkret CTA baserad på state (AI-transparens)
 *   3. Status-rad — 3 KPIer (CV, Ansökningar, Mående) med kvalitativ framing
 *   4. Senaste aktivitet — kronologisk feed (max 5)
 *   5. Hubs — 4 länkkort till de andra hubsen
 *
 * Data från useOversiktHubSummary (triggar 4 sibling-loaders parallellt).
 * Inga widgets, ingen layout-persistence, ingen Anpassa-vy. Statisk sida.
 */

const HUB_ID = 'oversikt' as const

const TODAY = () => new Date()

function formatSwedishDate(d: Date): string {
  const days = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag']
  const months = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december']
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`
}

function isSameDay(a: string | Date | null | undefined, b: Date): boolean {
  if (!a) return false
  const d = typeof a === 'string' ? new Date(a) : a
  return d.getFullYear() === b.getFullYear() && d.getMonth() === b.getMonth() && d.getDate() === b.getDate()
}

function relativeWhen(iso: string | null | undefined): string {
  if (!iso) return ''
  const then = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - then.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'Idag'
  if (diffDays === 1) return 'I går'
  if (diffDays < 7) return `${diffDays} dagar sen`
  if (diffDays < 14) return '1 vecka sen'
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} veckor sen`
  return `${Math.floor(diffDays / 30)} månader sen`
}

export default function HubOverview() {
  const { t } = useTranslation()
  useOnboardedHubsTracking(HUB_ID)
  const { data: summary } = useOversiktHubSummary()

  const firstName = summary?.profile?.full_name?.trim().split(/\s+/)[0] ?? null
  const today = TODAY()

  // ---------- Status (3 KPIer) ----------
  const cvStatus = useMemo(() => {
    const cv = summary?.jobsok?.cv
    if (!cv) return { value: 'Inget CV', meta: 'Kom igång när du är redo', isEmpty: true }
    return {
      value: 'Uppdaterat',
      meta: `Senast ${new Date(cv.updated_at).toLocaleDateString('sv-SE')}`,
      isEmpty: false,
    }
  }, [summary?.jobsok?.cv])

  const applicationsStatus = useMemo(() => {
    const total = summary?.jobsok?.applicationStats?.total ?? 0
    if (total === 0) return { value: 'Inga än', meta: 'Börja när du är redo', isEmpty: true }
    return {
      value: `${total} aktiva`,
      meta: 'Bra att du är på gång',
      isEmpty: false,
    }
  }, [summary?.jobsok?.applicationStats])

  const moodStatus = useMemo(() => {
    const recent = summary?.minVardag?.recentMoodLogs ?? []
    const latest = recent[0]
    if (!latest) return { value: 'Inte loggat', meta: 'Logga om du vill', isEmpty: true }
    if (isSameDay(latest.log_date, today)) {
      return { value: 'Loggat idag', meta: 'Bra rutin du har', isEmpty: false }
    }
    return {
      value: 'Senast ' + new Date(latest.log_date).toLocaleDateString('sv-SE'),
      meta: 'Logga när du vill',
      isEmpty: false,
    }
  }, [summary?.minVardag?.recentMoodLogs, today])

  // ---------- Nästa steg (deterministisk: första saknad/svag punkt) ----------
  const nextStep = useMemo(() => {
    if (!summary) return null
    if (cvStatus.isEmpty) {
      return {
        heading: 'Vill du börja med ditt CV idag?',
        body: 'Ett CV gör att du kan söka jobb när du hittar något du gillar. Vi guidar dig steg för steg.',
        ctaLabel: 'Öppna CV →',
        ctaHref: '/cv',
      }
    }
    if (applicationsStatus.isEmpty) {
      return {
        heading: 'Vill du börja titta på jobb idag?',
        body: 'Vi hjälper dig hitta jobb som matchar din profil. Du behöver inte ansöka — bara titta.',
        ctaLabel: 'Öppna Söka jobb →',
        ctaHref: '/jobb',
      }
    }
    if (!summary.karriar?.careerGoals?.shortTerm) {
      return {
        heading: 'Vad vill du på sikt?',
        body: 'Sätt ett karriärmål — det hjälper oss föreslå jobb som matchar.',
        ctaLabel: 'Öppna Karriär →',
        ctaHref: '/karriar',
      }
    }
    if (moodStatus.isEmpty) {
      return {
        heading: 'Hur mår du idag?',
        body: 'Logga ditt mående med ett klick — när du vill.',
        ctaLabel: 'Öppna Hälsa →',
        ctaHref: '/wellness',
      }
    }
    return {
      heading: 'Fortsätt med dina mål',
      body: 'Du är på god väg. Kolla din karriärplan eller ta nästa steg i din hub.',
      ctaLabel: 'Öppna Karriär →',
      ctaHref: '/karriar',
    }
  }, [summary, cvStatus.isEmpty, applicationsStatus.isEmpty, moodStatus.isEmpty])

  // ---------- Aktivitetsfeed (kronologisk, max 5 senaste händelser) ----------
  const activity = useMemo(() => {
    const items: Array<{
      key: string
      icon: typeof Heart
      domain: 'action' | 'activity' | 'wellbeing' | 'info'
      label: React.ReactNode
      iso: string
    }> = []
    const cv = summary?.jobsok?.cv
    if (cv) {
      items.push({
        key: 'cv-' + cv.id,
        icon: FileText,
        domain: 'action',
        label: 'Du uppdaterade ditt CV',
        iso: cv.updated_at,
      })
    }
    const mood = summary?.minVardag?.recentMoodLogs?.[0]
    if (mood) {
      items.push({
        key: 'mood-' + mood.log_date,
        icon: Heart,
        domain: 'wellbeing',
        label: 'Du loggade ditt mående',
        iso: mood.log_date,
      })
    }
    const latestDiary = summary?.minVardag?.latestDiaryEntry
    if (latestDiary) {
      items.push({
        key: 'diary-' + latestDiary.id,
        icon: BookText,
        domain: 'wellbeing',
        label: 'Du skrev i dagboken',
        iso: latestDiary.created_at,
      })
    }
    const goalLabel = careerGoalLabel(summary?.karriar?.careerGoals?.shortTerm)
    const goalUpdatedAt = summary?.karriar?.careerGoals?.updatedAt
    if (goalLabel && goalUpdatedAt) {
      items.push({
        key: 'goal-' + goalUpdatedAt,
        icon: Target,
        domain: 'info',
        label: <>Du satte ett karriärmål: <strong>{goalLabel}</strong></>,
        iso: goalUpdatedAt,
      })
    }
    const aiSession = summary?.resurser?.aiTeamSessions?.[0]
    if (aiSession) {
      items.push({
        key: 'ai-' + aiSession.agent_id,
        icon: MessageSquare,
        domain: 'info',
        label: 'Du startade ett samtal med AI-team',
        iso: aiSession.updated_at,
      })
    }
    const apps = summary?.jobsok?.applicationStats?.total ?? 0
    if (apps > 0) {
      items.push({
        key: 'apps',
        icon: Briefcase,
        domain: 'activity',
        label: `Du har ${apps} aktiva ansökningar`,
        iso: new Date().toISOString(),
      })
    }
    return items.sort((a, b) => new Date(b.iso).getTime() - new Date(a.iso).getTime()).slice(0, 5)
  }, [summary])

  return (
    <PageLayout
      title={t('nav.hubs.oversikt', 'Översikt')}
      subtitle={t('hubs.oversikt.subtitle', 'Din samlade vy — det viktigaste från alla hubbar')}
      domain="action"
      showTabs={false}
    >
      {/* 1. Hero */}
      <section aria-labelledby="hero-greeting">
        <h2 id="hero-greeting" className="text-[30px] font-bold text-[var(--stone-900)] leading-tight tracking-tight m-0">
          {firstName ? `Hej ${firstName}` : 'Välkommen tillbaka'}
        </h2>
        <p className="text-[14px] text-[var(--stone-600)] mt-1.5">
          <time dateTime={today.toISOString().slice(0, 10)}>{formatSwedishDate(today)}</time>
          <span className="mx-2">·</span>
          Bra att du är här idag.
        </p>
      </section>

      {/* 2. En idé för idag */}
      {nextStep && (
        <section
          aria-labelledby="nextstep-heading"
          className="bg-[var(--c-bg)] border border-[var(--c-accent)] rounded-[16px] p-[24px_28px] flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--c-text)] mb-1.5">
              En idé för idag
            </p>
            <h3 id="nextstep-heading" className="text-[20px] font-semibold text-[var(--stone-900)] tracking-tight m-0 mb-1.5">
              {nextStep.heading}
            </h3>
            <p className="text-[14px] text-[var(--stone-600)] leading-[1.5] max-w-[540px] m-0">
              {nextStep.body}
            </p>
            <p className="text-[11px] italic text-[var(--stone-500)] mt-2.5">
              Förslag baserat på vad du gjort senast — du kan be om ett annat.
            </p>
          </div>
          <Link
            to={nextStep.ctaHref}
            className="inline-flex items-center gap-2 bg-[var(--c-solid)] text-white px-5 py-3 rounded-[10px] text-[14px] font-semibold no-underline hover:opacity-90 whitespace-nowrap flex-shrink-0"
          >
            {nextStep.ctaLabel}
          </Link>
        </section>
      )}

      {/* 3. Status-rad */}
      <section aria-label="Min status" className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        />
      </section>

      {/* 4. Senaste aktivitet */}
      <section aria-labelledby="activity-heading">
        <SectionHeading id="activity-heading" title="Senaste aktivitet" hint="vad du gjort" />
        <div className="bg-[var(--surface)] border border-[var(--stone-200)] rounded-[14px] py-2">
          {activity.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <p className="text-[14px] text-[var(--stone-700)] font-medium m-0 mb-1">Här samlas din historik</p>
              <p className="text-[12px] text-[var(--stone-500)] m-0">När du gör något i appen dyker det upp här.</p>
            </div>
          ) : (
            <ul className="list-none m-0 p-0">
              {activity.map((item, i) => (
                <li
                  key={item.key}
                  className={[
                    'flex items-center gap-3.5 px-5 py-3',
                    i < activity.length - 1 ? 'border-b border-[var(--stone-100)]' : '',
                  ].join(' ')}
                >
                  <span
                    aria-hidden="true"
                    className={[
                      'w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0',
                      domainBgClass(item.domain),
                    ].join(' ')}
                  >
                    <item.icon size={14} />
                  </span>
                  <span className="flex-1 text-[14px] text-[var(--stone-800)]">
                    {item.label}
                  </span>
                  <time className="text-[12px] text-[var(--stone-600)] flex-shrink-0" dateTime={item.iso.slice(0, 10)}>
                    {relativeWhen(item.iso)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 5. Hubs */}
      <section aria-labelledby="hubs-heading">
        <SectionHeading id="hubs-heading" title="Hubs" hint="var du jobbar" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <HubCard to="/jobb" domain="activity" icon={Briefcase} title="Söka jobb" meta="Hitta, ansök och spara jobb" />
          <HubCard to="/karriar" domain="info" icon={Compass} title="Karriär" meta="Mål, kompetens och brand" />
          <HubCard to="/resurser" domain="info" icon={GraduationCap} title="Resurser" meta="Dokument, kunskap och AI-team" />
          <HubCard to="/min-vardag" domain="wellbeing" icon={Heart} title="Min Vardag" meta="Hälsa, dagbok och din konsulent" />
        </div>
      </section>
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

function StatusCard({
  domain,
  icon: Icon,
  label,
  value,
  meta,
}: {
  domain: Domain
  icon: typeof Heart
  label: string
  value: string
  meta: string
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--stone-200)] rounded-[14px] p-[18px_20px] shadow-sm transition-[border-color,box-shadow,transform] duration-150 hover:border-[var(--c-accent)] hover:shadow-md hover:-translate-y-px">
      <div className="flex items-center gap-2.5 mb-3.5">
        <span
          aria-hidden="true"
          className={['w-8 h-8 rounded-[8px] flex items-center justify-center', domainBgClass(domain)].join(' ')}
        >
          <Icon size={16} />
        </span>
        <span className="text-[13px] font-semibold text-[var(--stone-700)]">{label}</span>
      </div>
      <p className="text-[22px] font-bold text-[var(--stone-900)] leading-tight tracking-tight m-0">
        {value}
      </p>
      <p className="text-[12px] text-[var(--stone-600)] mt-1 m-0">{meta}</p>
    </div>
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
    <Link
      to={to}
      className="block bg-[var(--surface)] border border-[var(--stone-200)] rounded-[14px] p-[18px_20px] no-underline transition-[border-color,box-shadow,transform] duration-150 hover:border-[var(--c-accent)] hover:shadow-md hover:-translate-y-px"
    >
      <span
        aria-hidden="true"
        className={['inline-flex w-9 h-9 rounded-[10px] items-center justify-center mb-3', domainBgClass(domain)].join(' ')}
      >
        <Icon size={18} />
      </span>
      <p className="text-[15px] font-bold text-[var(--stone-900)] m-0 mb-1">{title}</p>
      <p className="text-[12px] text-[var(--stone-600)] m-0 leading-snug">{meta}</p>
      <p aria-hidden="true" className="text-[13px] text-[var(--stone-400)] mt-3.5 text-right m-0">→</p>
    </Link>
  )
}

function SectionHeading({ id, title, hint }: { id: string; title: string; hint?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3.5">
      <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-[var(--c-solid)] flex-shrink-0" />
      <h3 id={id} className="text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--c-text)] m-0">
        {title}
      </h3>
      <div className="flex-1 h-px bg-[var(--c-accent)] opacity-60" />
      {hint && <span className="text-[12px] text-[var(--stone-500)]">{hint}</span>}
    </div>
  )
}
