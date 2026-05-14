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
const AnalyticsTab = lazy(() => import('./consultant/AnalyticsTab').then(m => ({ default: m.AnalyticsTab })))
const CommunicationTab = lazy(() => import('./consultant/CommunicationTab').then(m => ({ default: m.CommunicationTab })))
const ResourcesTab = lazy(() => import('./consultant/ResourcesTab').then(m => ({ default: m.ResourcesTab })))
const SettingsTab = lazy(() => import('./consultant/SettingsTab').then(m => ({ default: m.SettingsTab })))
const ParticipantDetailPage = lazy(() => import('./consultant/ParticipantDetailPage').then(m => ({ default: m.ParticipantDetailPage })))
const AICoachAssistant = lazy(() => import('@/components/consultant/AICoachAssistant').then(m => ({ default: m.AICoachAssistant })))

export default function Consultant() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-stone-50 dark:from-stone-900 dark:to-stone-950">
      <PageLayout
        title={t('consultant.title', 'Konsultportal')}
        subtitle={t('consultant.subtitle', 'Hantera och följ upp dina deltagare')}
        tabs={consultantTabs}
        tabVariant="glass"
      >
        <Suspense fallback={<LoadingState />}>
          <Routes>
            <Route index element={<OverviewTab />} />
            <Route path="participants" element={<ParticipantsTab />} />
            <Route path="participants/:participantId" element={<ParticipantDetailPage />} />
            <Route path="analytics" element={<AnalyticsTab />} />
            <Route path="communication" element={<CommunicationTab />} />
            <Route path="resources" element={<ResourcesTab />} />
            <Route path="settings" element={<SettingsTab />} />
          </Routes>
        </Suspense>
      </PageLayout>

      {/* AI Coach Assistant - Floating on all consultant pages */}
      <Suspense fallback={null}>
        <AICoachAssistant context="overview" />
      </Suspense>
    </div>
  )
}
