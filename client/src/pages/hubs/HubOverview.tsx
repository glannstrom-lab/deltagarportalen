import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { datumSprak } from '@/lib/datumsprak'
import type { TFunction } from 'i18next'
import { motion } from 'framer-motion'
import {
  Briefcase,
  Heart,
  Compass,
  LayoutDashboard,
  BookOpen,
  CalendarDays,
} from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { useOversiktHubSummary } from '@/hooks/useOversiktHubSummary'
import { useOnboardedHubsTracking } from '@/hooks/useOnboardedHubsTracking'
import { useFocusMode } from '@/components/FocusModeProvider'
import { FocusHubWizard } from '@/components/focus/pages/FocusHubWizard'
import OversiktPanel, { type PanelTillstand } from './OversiktPanel'
import { oversiktBilder } from './oversiktBilder'
import RollGenvag from './RollGenvag'
import { FokusVaxel } from '@/components/focus/shell/FokusVaxel'

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

/**
 * Tidsanpassad hälsning enligt DESIGN.md §2.
 * 06–09 = "God morgon", 18–22 = "God kväll", övrigt = "Hej".
 */
function timeOfDayGreeting(now: Date, t: TFunction): string {
  const h = now.getHours()
  if (h >= 6 && h < 10) return t('hubOverview.goodMorning', 'God morgon')
  if (h >= 18 && h < 23) return t('hubOverview.goodEvening', 'God kväll')
  return t('hubOverview.hello', 'Hej')
}

const heroVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
}

export default function HubOverview() {
  const { t } = useTranslation()
  const { leaveWizard } = useFocusMode()

  return (
    <FokusVaxel
      title={t('hubOverview.title', 'Översikt')}
      icon={LayoutDashboard}
      domain="action"
      guide={<FocusHubWizard
          onExit={leaveWizard}
          pageKey="hubOverview"
          question={t('focus.hubOverview.question', 'Vad vill du fokusera på idag?')}
          tools={[
            { id: 'jobs', path: '/job-search', label: t('nav.jobSearch', 'Söka jobb'), icon: Briefcase },
            { id: 'career', path: '/career', label: t('nav.career', 'Karriär'), icon: Compass },
            { id: 'resources', path: '/knowledge-base', label: t('nav.knowledgeBase', 'Kunskapsbas'), icon: BookOpen },
            { id: 'wellbeing', path: '/wellness', label: t('nav.wellness', 'Mående'), icon: Heart },
          ]}
        />}
    >
      <HubOverviewInner />
    </FokusVaxel>
  )
}

function HubOverviewInner() {
  const { t, i18n } = useTranslation()
  useOnboardedHubsTracking(HUB_ID)
  /**
   * `isLoading` och `isError` användes inte fram till 2026-08-18 — bara `data`
   * plockades ut. Följden var att sidan renderade sina tomtexter ("Du har inte
   * börjat söka jobb än") medan svaret fortfarande var på väg, och likadant
   * när det aldrig kom. Se PanelTillstand i OversiktPanel.tsx.
   */
  const { data: summary, isLoading, isError, refetch } = useOversiktHubSummary()
  /**
   * `!summary` räknas som laddning, inte som "klart".
   *
   * Skälet är en lucka i React Query: alla fem hubbfrågorna har
   * `enabled: !!userId`, och en avstängd fråga är `pending` men inte
   * `fetching` — alltså är `isLoading` **false** medan autentiseringen
   * fortfarande löser sig. Uppmätt 2026-08-18 (fördröjda REST-svar): exakt en
   * mätpunkt hann visa "Du har inte börjat söka jobb än" utan att någon siffra
   * fanns, just i det fönstret. Utan data vet panelen ingenting, och då ska den
   * inte påstå något.
   */
  const tillstand: PanelTillstand = isError ? 'fel' : isLoading || !summary ? 'laddar' : 'klart'

  const firstName = summary?.profile?.full_name?.trim().split(/\s+/)[0] ?? null
  const profileImageUrl = summary?.profile?.profile_image_url ?? null
  const initials = firstName ? firstName[0].toUpperCase() : null
  const today = new Date()

  return (
    <PageLayout
      title={t('nav.hubs.oversikt', 'Översikt')}
      subtitle={t('hubs.oversikt.subtitle', 'Din samlade vy — det viktigaste från alla hubbar')}
      domain="action"
      showHeader={false}
      showTabs={false}
      contentClassName="space-y-6"
    >
      {/* 0. Konsulent/admin: vägen till arbetsytan.
          Renderar null för vanliga deltagare. Ligger först eftersom den som
          har en annan roll ska se det innan hen börjar läsa deltagarvyn — och
          eftersom den enda andra vägen dit på desktop är kommandopaletten,
          som man måste veta finns. Se RollGenvag.tsx. */}
      <RollGenvag />

      {/* 1. Hälsningen — komprimerad 2026-08-17 (steg 3).
          Hjälten var ~250 px hög med illustration, datumdisc och frågan
          "Vad vill du göra idag?". Frågan besvaras numera av nästa-steg-kortet
          direkt under, så den upprepade sig. Personaliseringen är kvar —
          DESIGN.md §1 punkt 4 säger att vi använder namnet där vi har det.

          Datumet står som en mening i gemener ("torsdag 10 september"), inte i
          versal monospace: det såg ut som terminalutdata, inte som en lugn
          vän. På smala skärmar radbryts det under namnet i stället för att
          trycka ihop rubriken till två rader. */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={heroVariants}
        transition={{ duration: 0.25 }}
        aria-labelledby="hero-greeting"
        className="flex flex-wrap items-center gap-x-3 gap-y-1"
      >
        {profileImageUrl ? (
          <img
            src={profileImageUrl}
            alt=""
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <span
            aria-hidden="true"
            className="w-10 h-10 rounded-full bg-[var(--c-bg)] text-[var(--c-text)] grid place-items-center text-[15px] font-semibold shrink-0"
          >
            {initials ?? '·'}
          </span>
        )}
        <h1 id="hero-greeting" className="text-[24px] sm:text-[28px] font-semibold tracking-tight m-0">
          {timeOfDayGreeting(today, t)}
          {firstName ? ` ${firstName}` : ''}
        </h1>
        <span className="basis-full sm:basis-auto sm:ml-auto pl-[52px] sm:pl-0 text-[15px] text-stone-500 dark:text-stone-400">
          {today.toLocaleDateString(datumSprak(i18n.language), { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </motion.section>

      {/* 2. Innehållet i tre nivåer (2026-09-10): ett nästa steg, det som är
          igång, och allt i portalen. Varje tal kommer ur useOversiktHubSummary
          — inget är påhittat, och det som saknas visas som en invit, aldrig
          som en nolla (ROADMAP B31). Se OversiktPanel.tsx. */}
      <OversiktPanel summary={summary} tillstand={tillstand} vidForsokIgen={refetch} />

      {/* 3. Väg in till hela historiken (G9, 2026-07-27).
          `/oversikt/historik` var routad men olänkad — sidan gick bara att nå
          via direktlänk. Medvetet lågmäld: en textlänk, ingen poängställning
          och inget "0 av N" (DESIGN.md §1 — inga prestationsmätningar).
          Vänsterställd sedan 2026-09-10; centrerad flöt den i tomrummet. */}
      <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-stone-500 dark:text-stone-400">
        {/* Stiltest 2026-09-10: kikaren = överblick över det som gjorts. Dekorativ. */}
        <img src={oversiktBilder().kikare} alt="" aria-hidden="true" loading="lazy" className="mr-1 h-11 w-11 object-contain" />
        <Link
          to="/oversikt/historik"
          className="inline-flex items-center gap-1.5 font-medium text-[var(--c-text)] dark:text-[var(--c-solid)] no-underline hover:underline underline-offset-2"
        >
          <CalendarDays size={15} aria-hidden="true" />
          {t('hubOverview.seeHistory', 'Se allt du har gjort')}
          <span aria-hidden="true">→</span>
        </Link>
        <span aria-hidden="true" className="hidden sm:inline">·</span>
        <span>{t('hubOverview.historyLead', 'Din historik i portalen, vecka för vecka.')}</span>
      </p>
    </PageLayout>
  )
}

// ============================================================
// Subkomponenter
// ============================================================

