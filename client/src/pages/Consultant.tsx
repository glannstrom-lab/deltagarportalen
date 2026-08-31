/**
 * Consultant Page
 * Main page for consultant functionality with tab-based navigation
 */

import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { PageLayout } from '@/components/layout/PageLayout'
import { LoadingState } from '@/components/ui/LoadingState'
import { consultantTabs } from '@/data/consultantTabs'
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

export default function Consultant() {
  const { t } = useTranslation()

  return (
    <div className="bg-stone-50 dark:bg-stone-950">
      <PageLayout
        title={t('consultant.title', 'Konsultportal')}
        subtitle={t('consultant.subtitle', 'Hantera och följ upp dina deltagare')}
        tabs={consultantTabs}
        tabVariant="glass"
        domain="info"
      >
        <Suspense fallback={<LoadingState />}>
          <Routes>
            <Route index element={<OverviewTab />} />
            <Route path="participants" element={<ParticipantsTab />} />
            <Route path="participants/:participantId" element={<ParticipantDetailPage />} />
            <Route path="platser" element={<PlatserTab />} />
            <Route path="analytics" element={<AnalyticsTab />} />
            <Route path="communication" element={<CommunicationTab />} />
            <Route path="resources" element={<ResourcesTab />} />
            <Route path="settings" element={<SettingsTab />} />
          </Routes>
        </Suspense>
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
