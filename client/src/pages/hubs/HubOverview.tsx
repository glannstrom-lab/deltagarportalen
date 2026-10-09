import { useTranslation } from 'react-i18next'
import {
  Briefcase,
  Heart,
  Compass,
  LayoutDashboard,
  BookOpen,
} from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { useOversiktHubSummary } from '@/hooks/useOversiktHubSummary'
import { useOnboardedHubsTracking } from '@/hooks/useOnboardedHubsTracking'
import { useFocusMode } from '@/components/FocusModeProvider'
import { FocusHubWizard } from '@/components/focus/pages/FocusHubWizard'
import OversiktPanel, { type PanelTillstand } from './OversiktPanel'
import Stad from './Stad'
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
  const { t } = useTranslation()
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

  return (
    <PageLayout
      title={t('nav.hubs.oversikt', 'Översikt')}
      subtitle={t('hubs.oversikt.subtitle', 'Din samlade vy — det viktigaste från alla hubbar')}
      domain="action"
      showHeader={false}
      showTabs={false}
      contentClassName="space-y-8"
    >
      {/* 0. Konsulent/admin: vägen till arbetsytan.
          Renderar null för vanliga deltagare. Ligger först eftersom den som
          har en annan roll ska se det innan hen börjar läsa deltagarvyn — och
          eftersom den enda andra vägen dit på desktop är kommandopaletten,
          som man måste veta finns. Se RollGenvag.tsx. */}
      <RollGenvag />

      {/* 1. Staden (spår JS, 2026-10-09) — hälsningen, platserna och Andreas
          med nästa steg. Ersätter hälsningsraden och nästa-steg-kortet, som
          sa samma sak som rådgivaren två gånger. */}
      <Stad summary={summary} tillstand={tillstand} fornamn={firstName} />

      {/* 2. Det som är igång, vägen hittills och platserna — varje tal ur
          useOversiktHubSummary, inget påhittat (ROADMAP B31). */}
      <OversiktPanel summary={summary} tillstand={tillstand} vidForsokIgen={refetch} />
    </PageLayout>
  )
}

// ============================================================
// Subkomponenter
// ============================================================

