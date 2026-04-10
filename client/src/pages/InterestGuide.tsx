/**
 * Interest Guide Page - Main entry point with tab navigation
 */
import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import { LoadingState } from '@/components/ui'
import { interestGuideTabDefs } from '@/data/interestGuideTabs'
import { HelpButton } from '@/components/HelpButton'
import { helpContent } from '@/data/helpContent'

// Lazy load tab components
const TestTab = lazy(() => import('./interest-guide/TestTab'))
const ResultsTab = lazy(() => import('./interest-guide/ResultsTab'))
const OccupationsTab = lazy(() => import('./interest-guide/OccupationsTab'))
const ExploreTab = lazy(() => import('./interest-guide/ExploreTab'))
const HistoryTab = lazy(() => import('./interest-guide/HistoryTab'))

function TabLoading() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-center py-12 bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950">
      <LoadingState title={t('common.loading')} size="lg" />
    </div>
  )
}

export default function InterestGuide() {
  const { t } = useTranslation()

  // Build tabs with translated labels
  const interestGuideTabs = interestGuideTabDefs.map((tab) => ({
    ...tab,
    label: t(tab.labelKey),
  }))

  return (
    <>
      <PageLayout
        title={t('interestGuide.title')}
        subtitle={t('interestGuide.discover')}
        tabs={interestGuideTabs}
        tabVariant="glass"
      >
        <Suspense fallback={<TabLoading />}>
          <Routes>
            <Route index element={<TestTab />} />
            <Route path="results" element={<ResultsTab />} />
            <Route path="occupations" element={<OccupationsTab />} />
            <Route path="explore" element={<ExploreTab />} />
            <Route path="history" element={<HistoryTab />} />
            <Route path="*" element={<Navigate to="/interest-guide" replace />} />
          </Routes>
        </Suspense>
      </PageLayout>
      <HelpButton content={helpContent.interestGuide} />
    </>
  )
}
