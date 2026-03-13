/**
 * Dashboard Page - Main entry with tabs
 * 2 tabs: Översikt, Mina Quests
 */
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { PageLayout } from '@/components/layout/index'
import { dashboardTabs } from '@/data/dashboardTabs'

// Tab components
import OverviewTab from './dashboard/OverviewTab'
import QuestsTab from './dashboard/QuestsTab'

export default function DashboardPage() {
  const location = useLocation()
  
  // Get current tab label for title
  const currentTab = dashboardTabs.find(tab => 
    location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')
  )
  
  const pageTitle = currentTab?.label || 'Översikt'
  const pageDescription = currentTab?.description || 'Din personliga översikt'

  return (
    <PageLayout
      title={pageTitle}
      description={pageDescription}
      customTabs={dashboardTabs}
      showTabs={true}
      className="space-y-6"
    >
      <Routes>
        <Route path="/" element={<OverviewTab />} />
        <Route path="/quests" element={<QuestsTab />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageLayout>
  )
}
