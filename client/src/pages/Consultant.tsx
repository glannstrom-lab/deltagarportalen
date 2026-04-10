/**
 * Consultant Page
 * Main page for consultant functionality with tab-based navigation
 */

import { Routes, Route } from 'react-router-dom'
import { PageLayout } from '@/components/layout/PageLayout'
import { consultantTabs } from '@/data/consultantTabs'
import { useTranslation } from 'react-i18next'

// Tab components
import { OverviewTab } from './consultant/OverviewTab'
import { ParticipantsTab } from './consultant/ParticipantsTab'
import { AnalyticsTab } from './consultant/AnalyticsTab'
import { CommunicationTab } from './consultant/CommunicationTab'
import { ResourcesTab } from './consultant/ResourcesTab'
import { SettingsTab } from './consultant/SettingsTab'
import { ParticipantDetailPage } from './consultant/ParticipantDetailPage'
import { AICoachAssistant } from '@/components/consultant/AICoachAssistant'

export default function Consultant() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950">
      <PageLayout
        title={t('consultant.title', 'Konsultportal')}
        subtitle={t('consultant.subtitle', 'Hantera och följ upp dina deltagare')}
        tabs={consultantTabs}
        tabVariant="glass"
      >
        <Routes>
          <Route index element={<OverviewTab />} />
          <Route path="participants" element={<ParticipantsTab />} />
          <Route path="participants/:participantId" element={<ParticipantDetailPage />} />
          <Route path="analytics" element={<AnalyticsTab />} />
          <Route path="communication" element={<CommunicationTab />} />
          <Route path="resources" element={<ResourcesTab />} />
          <Route path="settings" element={<SettingsTab />} />
        </Routes>
      </PageLayout>

      {/* AI Coach Assistant - Floating on all consultant pages */}
      <AICoachAssistant context="overview" />
    </div>
  )
}
