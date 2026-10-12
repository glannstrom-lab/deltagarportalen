/**
 * Consultant Page
 * Main page for consultant functionality with tab-based navigation
 */

import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { PageLayout } from '@/components/layout/PageLayout'
import { LoadingState } from '@/components/ui/LoadingState'
import { handlaggareFarOppna } from '@/data/consultantTabs'
import { flikSokvag, MOBIL_FLIKRAD_DOLJ_BOTTENNAV, MOBIL_FLIKRAD_DOLJ_HANDLAGGARE } from './consultantFlikar'
import { useKonsulentFlikar } from './useKonsulentFlikar'
import { useTranslation } from 'react-i18next'

// E8 (2026-05-15): Lazy-loada tabbar så bara aktiv tab dras in.
// Tidigare eager-importerades alla 7 → Consultant-chunken blev 227 KB.
// Nu får varje tab sin egen chunk, laddas just-in-time vid navigering.
const OverviewTab = lazy(() => import('./consultant/OverviewTab').then(m => ({ default: m.OverviewTab })))
const ParticipantsTab = lazy(() => import('./consultant/ParticipantsTab').then(m => ({ default: m.ParticipantsTab })))
const PlatserTab = lazy(() => import('./consultant/PlatserTab').then(m => ({ default: m.PlatserTab })))
const AnalyticsTab = lazy(() => import('./consultant/AnalyticsTab').then(m => ({ default: m.AnalyticsTab })))
const CommunicationTab = lazy(() => import('./consultant/CommunicationTab').then(m => ({ default: m.CommunicationTab })))
const ResourcesTab = lazy(() => import('./consultant/ResourcesTab').then(m => ({ default: m.ResourcesTab })))
const SettingsTab = lazy(() => import('./consultant/SettingsTab').then(m => ({ default: m.SettingsTab })))
const ParticipantDetailPage = lazy(() => import('./consultant/ParticipantDetailPage').then(m => ({ default: m.ParticipantDetailPage })))
// RK36 (rollspelet 2026-09-27): närvaro för ett helt pass, nås från Dagens pass i Min dag.
const GruppnarvaroPage = lazy(() => import('./consultant/GruppnarvaroPage').then(m => ({ default: m.GruppnarvaroPage })))

export default function Consultant() {
  const { t } = useTranslation()
  const location = useLocation()
  const [sok] = useSearchParams()
  const { enbartHandlaggare, laddar, flikar } = useKonsulentFlikar()
  const dit = location.pathname.replace(/\/+$/, '') === '/consultant' ? flikSokvag(sok.get('tab')) : null
  // KSL15: handläggaren når inte deltagar-/platsvyerna (hon har ingen läsrätt där) —
  // en direktlänk dit går till Översikt i stället för en tom vy.
  // Rollerna okända: en sökväg som är dold för en handläggare renderas inte (och
  // vi omdirigerar inte heller — en vanlig konsulent ska vara kvar på sin sida).
  const dolpTillRollerna = laddar && !handlaggareFarOppna(location.pathname)
  if (enbartHandlaggare && !handlaggareFarOppna(location.pathname)) return <Navigate to="/consultant" replace />
  if (dit && !laddar && (!enbartHandlaggare || handlaggareFarOppna(dit))) return <Navigate to={dit} replace />

  return (
    // Omtaget "Kvarter" (2026-10-11): kontorstonen för hela konsulentvyn —
    // Papper och Bläck, och --c-* pekar på Gran i stället för hubbfärgen (tokens.css).
    <div data-ton="kontor" className="bg-j-papper text-j-blak">
      <PageLayout
        title={t('consultant.title', 'Arbetsyta')}
        subtitle={t('consultant.subtitle', 'Dina deltagare och din dag')}
        tabs={flikar}
        tabVariant="glass"
        domain="info"
        className={enbartHandlaggare ? MOBIL_FLIKRAD_DOLJ_HANDLAGGARE : MOBIL_FLIKRAD_DOLJ_BOTTENNAV}
      >
        {dolpTillRollerna ? <LoadingState /> : <Suspense fallback={<LoadingState />}>
          <Routes>
            <Route index element={<OverviewTab />} />
            <Route path="participants" element={<ParticipantsTab />} />
            <Route path="participants/:participantId" element={<ParticipantDetailPage />} />
            <Route path="pass/grupp" element={<GruppnarvaroPage />} />
            <Route path="platser" element={<PlatserTab />} />
            <Route path="analytics" element={<AnalyticsTab />} />
            <Route path="communication" element={<CommunicationTab />} />
            <Route path="resources" element={<ResourcesTab />} />
            <Route path="settings" element={<SettingsTab />} />
          </Routes>
        </Suspense>}
      </PageLayout>

      {/*
        AR3 (2026-08-17): den flytande "AI Coach Assistant" är borttagen.

        Den anropade varken AI eller databasen — komponentens egen kommentar
        löd "Mock AI responses" — och visade fyra påhittade deltagare som
        insikter till en riktig konsulent: "Maria Lindberg har inte loggat in
        på 12 dagar" som röd högprioritetsvarning, plus tre till med
        uppdiktade CV-poäng och jobbmatchningar. Konsulenten har 31 verkliga
        deltagare; ingen av de fyra är en av dem.

        Fyndet var märkt "åtgärda idag" den 4 augusti och stod orört i tretton
        dagar. Att bygga funktionen på riktigt är ett eget beslut och en helt
        annan storlek — se ROADMAP G19 (kontaktregistret), som är det som
        faktiskt saknas för att en sådan här yta ska kunna säga något sant.
      */}
    </div>
  )
}
