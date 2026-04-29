import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Briefcase,
  Heart,
  Compass,
  GraduationCap,
  User,
} from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { useOversiktHubSummary } from '@/hooks/useOversiktHubSummary'
import { useOnboardedHubsTracking } from '@/hooks/useOnboardedHubsTracking'
import { careerGoalLabel } from '@/utils/careerGoalLabel'
import { streakDays } from '@/utils/streakDays'

/**
 * Översikt — minimal launchpad.
 *
 * Layout (one section + one grid):
 *   1. Hero — page-tagg, "Hej Namn", datum-disc, frågan "Vad vill du göra idag?"
 *   2. 4 hub-kort i 2×2-grid med 4 distinkta domänfärger:
 *        - Hitta och söka jobb       (activity / persika)
 *        - Planera min karriär       (coaching / rosa)
 *        - Hantera resurser          (info / blå)
 *        - Hantera mina rutiner      (wellbeing / lavendel)
 *
 * Varje hub visar SENASTE AKTIVITET (inte metadata) — levande, inte museum.
 * KPIer + aktivitetsfeed flyttade till respektive hubsida.
 */

const HUB_ID = 'oversikt' as const

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null
  const then = new Date(iso)
  const now = new Date()
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24))
}

function relativeWhen(iso: string | null | undefined): string {
  const d = daysSince(iso)
  if (d == null) return ''
  if (d <= 0) return 'Idag'
  if (d === 1) return 'I går'
  if (d < 7) return `${d} dagar sen`
  if (d < 14) return '1 vecka sen'
  if (d < 30) return `${Math.floor(d / 7)} veckor sen`
  if (d < 365) return `${Math.floor(d / 30)} månader sen`
  return 'Längesen'
}

const heroVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
}

export default function HubOverview() {
  const { t } = useTranslation()
  useOnboardedHubsTracking(HUB_ID)
  const { data: summary } = useOversiktHubSummary()

  const firstName = summary?.profile?.full_name?.trim().split(/\s+/)[0] ?? null
  const profileImageUrl = summary?.profile?.profile_image_url ?? null
  const initials = (firstName?.[0] ?? 'M').toUpperCase()

  // ---------- Senaste aktivitet per hub ----------
  const hubActivity = useMemo(() => {
    type ActivityCell = { text: React.ReactNode; when: string } | null

    // Hitta och söka jobb — applications + cv updates
    let jobb: ActivityCell = null
    const apps = summary?.jobsok?.applicationStats?.total ?? 0
    if (apps > 0) {
      jobb = { text: <><strong>{apps} aktiva ansökningar</strong></>, when: '' }
    } else if (summary?.jobsok?.cv?.updated_at) {
      jobb = {
        text: <>Du uppdaterade ditt <strong>CV</strong></>,
        when: relativeWhen(summary.jobsok.cv.updated_at),
      }
    }

    // Planera min karriär — career goal
    let karriar: ActivityCell = null
    const goalLabel = careerGoalLabel(summary?.karriar?.careerGoals?.shortTerm)
    const goalUpdatedAt = summary?.karriar?.careerGoals?.updatedAt
    if (goalLabel && goalUpdatedAt) {
      karriar = {
        text: <>Du satte målet <strong>{goalLabel}</strong></>,
        when: relativeWhen(goalUpdatedAt),
      }
    } else if (summary?.karriar?.latestSkillsAnalysis?.created_at) {
      karriar = {
        text: <>Du gjorde en <strong>kompetensanalys</strong></>,
        when: relativeWhen(summary.karriar.latestSkillsAnalysis.created_at),
      }
    }

    // Hantera resurser — AI-team session, articles
    let resurser: ActivityCell = null
    const aiSession = summary?.resurser?.aiTeamSessions?.[0]
    const recentArticle = summary?.resurser?.recentArticles?.[0]
    if (aiSession) {
      resurser = {
        text: <>Senaste samtal med <strong>AI-team</strong></>,
        when: relativeWhen(aiSession.updated_at),
      }
    } else if (recentArticle) {
      resurser = {
        text: <>Du läste i <strong>kunskapsbanken</strong></>,
        when: relativeWhen(recentArticle.completed_at),
      }
    }

    // Hantera mina rutiner — mood log, diary, meeting
    let minVardag: ActivityCell = null
    const moodLogs = summary?.minVardag?.recentMoodLogs ?? []
    const streak = streakDays(moodLogs)
    const upcoming = summary?.minVardag?.upcomingEvents?.[0]
    if (upcoming) {
      minVardag = {
        text: <>Nästa möte: <strong>{upcoming.title}</strong></>,
        when: relativeWhen(upcoming.date),
      }
    } else if (streak > 0) {
      minVardag = {
        text: <><strong>{streak} dagar i rad</strong> loggade</>,
        when: relativeWhen(moodLogs[0]?.log_date),
      }
    } else if (summary?.minVardag?.latestDiaryEntry) {
      minVardag = {
        text: <>Du skrev i <strong>dagboken</strong></>,
        when: relativeWhen(summary.minVardag.latestDiaryEntry.created_at),
      }
    }

    return { jobb, karriar, resurser, minVardag }
  }, [summary])

  return (
    <PageLayout
      title={t('nav.hubs.oversikt', 'Översikt')}
      subtitle={t('hubs.oversikt.subtitle', 'Din samlade vy — det viktigaste från alla hubbar')}
      domain="action"
      showHeader={false}
      showTabs={false}
      contentClassName="space-y-7"
    >
      {/* 1. Hero — minimal launchpad */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={heroVariants}
        transition={{ duration: 0.35 }}
        className="bg-[var(--c-bg)] border border-[var(--c-accent)] rounded-[24px] p-[36px_40px] relative overflow-hidden"
        aria-labelledby="hero-greeting"
      >
        {/* Subtle radial decoration */}
        <div
          aria-hidden="true"
          className="absolute -top-[100px] -right-[100px] w-[320px] h-[320px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, var(--c-accent) 0%, transparent 70%)',
            opacity: 0.4,
          }}
        />

        <div className="flex items-start justify-between gap-6 relative">
          <div>
            <h1
              id="hero-greeting"
              className="text-[40px] font-bold text-[var(--stone-900)] leading-[1.05] tracking-tight m-0"
            >
              {firstName ? `Hej ${firstName}` : 'Välkommen tillbaka'}
            </h1>
            <p className="text-[22px] font-medium text-[var(--stone-700)] tracking-tight mt-3">
              Vad vill du göra idag?
            </p>
          </div>

          {/* Profil-block: avatar + besök profilen-länk */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <Link
              to="/profile"
              aria-label="Besök din profil"
              className="block w-[80px] h-[80px] rounded-full bg-white border-2 border-[var(--c-accent)] overflow-hidden shadow-sm transition-all hover:border-[var(--c-solid)] hover:shadow-md"
            >
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[var(--c-bg)]">
                  <span className="text-[28px] font-bold text-[var(--c-text)] tracking-tight">
                    {initials}
                  </span>
                </div>
              )}
            </Link>
            <Link
              to="/profile"
              className="text-[12px] font-semibold text-[var(--c-text)] hover:text-[var(--c-solid)] no-underline inline-flex items-center gap-1"
            >
              <User size={12} aria-hidden="true" />
              Besök din profil
            </Link>
          </div>
        </div>
      </motion.section>

      {/* 2. Hubs — 2×2-grid med distinkta domänfärger */}
      <section aria-label="Välj en hub" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HubCard
          to="/jobb"
          domain="activity"
          icon={Briefcase}
          title="Hitta och söka jobb"
          description="Matcha din profil, ansök och följ upp dina ansökningar."
          activity={hubActivity.jobb}
        />
        <HubCard
          to="/karriar"
          domain="coaching"
          icon={Compass}
          title="Planera min karriär"
          description="Sätt mål, kartlägg kompetens och bygg ditt personliga varumärke."
          activity={hubActivity.karriar}
        />
        <HubCard
          to="/resurser"
          domain="info"
          icon={GraduationCap}
          title="Hantera resurser"
          description="Dokument, kunskapsbank, AI-team och utskriftsmaterial."
          activity={hubActivity.resurser}
        />
        <HubCard
          to="/min-vardag"
          domain="wellbeing"
          icon={Heart}
          title="Mina vardagliga rutiner"
          description="Mående, dagbok, kalender och möten med din konsulent."
          activity={hubActivity.minVardag}
        />
      </section>
    </PageLayout>
  )
}

// ============================================================
// Subkomponenter
// ============================================================

type Domain = 'activity' | 'coaching' | 'info' | 'wellbeing'

function domainBg(d: Domain): string {
  switch (d) {
    case 'activity':  return 'var(--activity-bg)'
    case 'coaching':  return 'var(--coaching-bg)'
    case 'info':      return 'var(--info-bg)'
    case 'wellbeing': return 'var(--wellbeing-bg)'
  }
}

function domainText(d: Domain): string {
  switch (d) {
    case 'activity':  return 'var(--activity-text)'
    case 'coaching':  return 'var(--coaching-text)'
    case 'info':      return 'var(--info-text)'
    case 'wellbeing': return 'var(--wellbeing-text)'
  }
}

function domainSolid(d: Domain): string {
  switch (d) {
    case 'activity':  return 'var(--activity-solid)'
    case 'coaching':  return 'var(--coaching-solid)'
    case 'info':      return 'var(--info-solid)'
    case 'wellbeing': return 'var(--wellbeing-solid)'
  }
}

interface HubCardProps {
  to: string
  domain: Domain
  icon: typeof Heart
  title: string
  description: string
  activity: { text: React.ReactNode; when: string } | null
}

function HubCard({ to, domain, icon: Icon, title, description, activity }: HubCardProps) {
  return (
    <Link to={to} className="block no-underline">
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.15 }}
        className="bg-[var(--surface)] border border-[var(--stone-200)] rounded-[18px] p-[24px_28px] hover:shadow-md transition-[border-color,box-shadow] relative overflow-hidden flex flex-col gap-2.5 min-h-[200px]"
        style={{ ['--hub-solid' as string]: domainSolid(domain) }}
      >
        {/* 4px topp-accent i domänfärg */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: domainSolid(domain) }}
        />

        {/* Header: ikon + titel */}
        <div className="flex items-center gap-3.5 mb-1">
          <span
            aria-hidden="true"
            className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0"
            style={{ background: domainBg(domain), color: domainText(domain) }}
          >
            <Icon size={22} strokeWidth={2.25} />
          </span>
          <span className="text-[18px] font-bold text-[var(--stone-900)] tracking-tight leading-tight">
            {title}
          </span>
        </div>

        {/* Beskrivning — alignar med titel */}
        <p className="text-[14px] text-[var(--stone-600)] leading-[1.5] m-0 ml-[62px] -mt-1.5">
          {description}
        </p>

        {/* Aktivitet eller empty-state — botten av kortet */}
        {activity ? (
          <div className="mt-auto pt-3.5 border-t border-[var(--stone-100)] flex items-start justify-between gap-3">
            <span className="flex-1 min-w-0 inline-flex items-start gap-2">
              <span
                aria-hidden="true"
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[7px]"
                style={{ background: domainSolid(domain) }}
              />
              <span className="text-[13px] text-[var(--stone-700)] leading-[1.4]">
                {activity.text}
              </span>
            </span>
            {activity.when && (
              <span className="text-[12px] text-[var(--stone-500)] flex-shrink-0 mt-px">
                {activity.when}
              </span>
            )}
          </div>
        ) : (
          <div className="mt-auto pt-3.5 border-t border-[var(--stone-100)] text-[13px] text-[var(--stone-500)] italic">
            Inga händelser än — börja utforska
          </div>
        )}
      </motion.div>
    </Link>
  )
}
