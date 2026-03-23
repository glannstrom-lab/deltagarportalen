/**
 * Dashboard Page - Main overview with tabs
 * Now uses PageLayout for consistent design
 */
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Zap, Users, Lightbulb, BookOpen } from 'lucide-react'
import { ConsultantRequestBanner } from '@/components/consultant/ConsultantRequestBanner'
import OverviewTab from './dashboard/tabs/OverviewTab'
import ActivityTab from './dashboard/tabs/ActivityTab'
import CommunityTab from './dashboard/tabs/CommunityTab'
import InsightsTab from './dashboard/tabs/InsightsTab'
import LearningTab from './dashboard/tabs/LearningTab'
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
      case 'community':
        return data?.notifications?.unread || 0
      case 'insights':
        return data?.insights?.newRecommendations || 0
      case 'learning':
        return data?.learning?.newLessons || 0
      default:
        return 0
    }
  }

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
      id: 'community',
      label: t('dashboard.tabs.community'),
      path: '/community',
      icon: Users,
      badge: getTabBadge('community'),
    },
    {
      id: 'insights',
      label: t('dashboard.tabs.insights'),
      path: '/insights',
      icon: Lightbulb,
      badge: getTabBadge('insights'),
    },
    {
      id: 'learning',
      label: t('dashboard.tabs.learning'),
      path: '/learning',
      icon: BookOpen,
      badge: getTabBadge('learning'),
    },
  ]

  const currentTab = location.pathname

  // Bestäm vilken tab som är aktiv baserat på pathname
  const getActiveTabId = () => {
    switch (location.pathname) {
      case '/activity': return 'activity'
      case '/community': return 'community'
      case '/insights': return 'insights'
      case '/learning': return 'learning'
      default: return 'overview'
    }
  }

  const renderContent = () => {
    const activeTab = getActiveTabId()
    switch (activeTab) {
      case 'activity': return <ActivityTab />
      case 'community': return <CommunityTab />
      case 'insights': return <InsightsTab />
      case 'learning': return <LearningTab />
      default: return <OverviewTab />
    }
  }

  // Ändra tabVariant för att testa: 'minimal' | 'pills' | 'floating' | 'underline' | 'glass'
  return (
    <PageLayout
      title={t('dashboard.title')}
      description={t('dashboard.description')}
      customTabs={tabs}
      tabVariant="glass"
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
