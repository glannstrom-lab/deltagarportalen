/**
 * JobTracker Page - Main entry with 5 tabs
 * Sök jobb, Sparade, Ansökningar, Bevakningar, Matchningar
 */
import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { PageLayout } from '@/components/layout/index'
import { LoadingState } from '@/components/ui'
import { jobTrackerTabs } from '../data/jobTrackerTabs'

// Lazy load tab components
const SearchTab = lazy(() => import('./job-tracker/SearchTab'))
const SavedJobsTab = lazy(() => import('./job-tracker/SavedJobsTab'))
const ApplicationsTab = lazy(() => import('./job-tracker/ApplicationsTab'))
const AlertsTab = lazy(() => import('./job-tracker/AlertsTab'))
const MatchesTab = lazy(() => import('./job-tracker/MatchesTab'))

function TabLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingState title="Laddar..." size="lg" />
    </div>
  )
}

export default function JobTrackerPage() {
  return (
    <PageLayout
      title="Sök jobb"
      subtitle="Hitta, spara och spåra jobbansökningar"
      tabs={jobTrackerTabs}
      tabVariant="glass"
    >
      <Suspense fallback={<TabLoading />}>
        <Routes>
          <Route index element={<SearchTab />} />
          <Route path="saved" element={<SavedJobsTab />} />
          <Route path="applications" element={<ApplicationsTab />} />
          <Route path="alerts" element={<AlertsTab />} />
          <Route path="matches" element={<MatchesTab />} />
          <Route path="analytics" element={<Navigate to="/job-tracker" replace />} />
          <Route path="*" element={<Navigate to="/job-tracker" replace />} />
        </Routes>
      </Suspense>
    </PageLayout>
  )
}
