/**
 * JobTracker Page - Main entry with tabs
 * 2 tabs: Ansökningar, Analys
 */
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { PageLayout } from '@/components/layout/index'
import { jobTrackerTabs } from '../data/jobTrackerTabs'

// Tab components
import ApplicationsTab from './job-tracker/ApplicationsTab'
import AnalyticsTab from './job-tracker/AnalyticsTab'

export default function JobTrackerPage() {
  const location = useLocation()
  
  // Get current tab label for title
  const currentTab = jobTrackerTabs.find(tab => 
    location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')
  )
  
  const pageTitle = currentTab?.label || 'Ansökningar'
  const pageDescription = currentTab?.description || 'Håll koll på dina jobbansökningar'

  return (
    <PageLayout
      title={pageTitle}
      description={pageDescription}
      customTabs={jobTrackerTabs}
      tabVariant="glass"
      showTabs={true}
      className="space-y-6"
    >
      <Routes>
        <Route path="/" element={<ApplicationsTab />} />
        <Route path="/analytics" element={<AnalyticsTab />} />
        <Route path="*" element={<Navigate to="/job-tracker" replace />} />
      </Routes>
    </PageLayout>
  )
}
