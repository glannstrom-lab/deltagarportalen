/**
 * Dashboard Page - Main overview with tabs
 * Now uses PageLayout for consistent design
 */
import { useLocation, Link } from 'react-router-dom'
import { useState } from 'react'
import { LayoutDashboard, Zap, Users, Lightbulb, BookOpen } from 'lucide-react'
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
      label: 'Översikt', 
      path: '/', 
      icon: LayoutDashboard 
    },
    { 
      id: 'activity', 
      label: 'Aktivitet', 
      path: '/activity', 
      icon: Zap,
      badge: getTabBadge('activity')
    },
    { 
      id: 'community', 
      label: 'Community', 
      path: '/community', 
      icon: Users,
      badge: getTabBadge('community')
    },
    { 
      id: 'insights', 
      label: 'Insikter', 
      path: '/insights', 
      icon: Lightbulb,
      badge: getTabBadge('insights')
    },
    { 
      id: 'learning', 
      label: 'Lärande', 
      path: '/learning', 
      icon: BookOpen,
      badge: getTabBadge('learning')
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

  return (
    <PageLayout
      title="Översikt"
      description="Din personliga dashboard och översikt"
      customTabs={tabs}
      showTabs={true}
      className="space-y-6"
    >
      <div className="animate-in fade-in duration-300">
        {renderContent()}
      </div>
    </PageLayout>
  )
}
