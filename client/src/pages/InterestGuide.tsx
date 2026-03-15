/**
 * Interest Guide Page - Main entry point with tab navigation
 */
import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { PageLayout } from '@/components/layout/index'
import { LoadingState } from '@/components/ui'
import { interestGuideTabs } from '@/data/interestGuideTabs'

// Lazy load tab components
const TestTab = lazy(() => import('./interest-guide/TestTab'))
const ResultsTab = lazy(() => import('./interest-guide/ResultsTab'))
const OccupationsTab = lazy(() => import('./interest-guide/OccupationsTab'))
const ExploreTab = lazy(() => import('./interest-guide/ExploreTab'))
const HistoryTab = lazy(() => import('./interest-guide/HistoryTab'))

function TabLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingState title="Laddar..." size="lg" />
    </div>
  )
}

export default function InterestGuide() {
  return (
    <PageLayout
      title="Intresseguide"
      subtitle="Upptäck yrken som passar dig genom att besvara frågor om dina intressen och personlighet"
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
  )
}
