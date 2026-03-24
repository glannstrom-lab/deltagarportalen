/**
 * Dashboard Page - Main overview with simplified tabs
 * Reduced from 5 to 3 tabs for better cognitive load
 * Community → accessible via sidebar
 * Learning → accessible via Knowledge Base
 */
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Zap, Lightbulb } from 'lucide-react'
import { ConsultantRequestBanner } from '@/components/consultant/ConsultantRequestBanner'
import OverviewTab from './dashboard/tabs/OverviewTab'
import ActivityTab from './dashboard/tabs/ActivityTab'
import InsightsTab from './dashboard/tabs/InsightsTab'
import { useDashboardData } from '@/hooks/useDashboardData'
import { PageLayout } from '@/components/layout/index'
import type { Tab } from '@/components/layout/PageTabs'

export default function DashboardPage() {
  const location = useLocation()
  const { t } = useTranslation()
  const { data } = useDashboardData()

  // Beräkna badges baserat på data
  const getTabBadge = (tabId: string): number => {
    switch (tabId) {
      case 'activity':
        return data?.quests?.incomplete || 0
      case 'insights':
        return data?.insights?.newRecommendations || 0
      default:
        return 0
    }
  }

  // Simplified to 3 tabs for reduced cognitive load
  const tabs: Tab[] = [
    {
      id: 'overview',
      label: t('dashboard.tabs.overview'),
      path: '/',
      icon: LayoutDashboard,
    },
    {
      id: 'activity',
      label: t('dashboard.tabs.activity'),
      path: '/activity',
      icon: Zap,
      badge: getTabBadge('activity'),
    },
    {
      id: 'insights',
      label: t('dashboard.tabs.insights'),
      path: '/insights',
      icon: Lightbulb,
      badge: getTabBadge('insights'),
    },
  ]

  // Bestäm vilken tab som är aktiv baserat på pathname
  const getActiveTabId = () => {
    switch (location.pathname) {
      case '/activity': return 'activity'
      case '/insights': return 'insights'
      default: return 'overview'
    }
  }

  const renderContent = () => {
    const activeTab = getActiveTabId()
    switch (activeTab) {
      case 'activity': return <ActivityTab />
      case 'insights': return <InsightsTab />
      default: return <OverviewTab />
    }
  }

  return (
    <PageLayout
      title={t('dashboard.title')}
      description={t('dashboard.description')}
      customTabs={tabs}
      tabVariant="minimal"
      showTabs={true}
      className="space-y-6"
    >
      <ConsultantRequestBanner />
      <div className="animate-in fade-in duration-300">
        {renderContent()}
      </div>
    </PageLayout>
  )
}
