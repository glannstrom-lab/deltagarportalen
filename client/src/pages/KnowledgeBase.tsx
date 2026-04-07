/**
 * Knowledge Base - Full implementation with query-based tab routing
 */

import { useState, useEffect, useCallback, Suspense, lazy, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sparkles, Rocket, BookOpen, Route, Wrench, AlertCircle } from '@/components/ui/icons'
import { Card, LoadingState } from '@/components/ui'
import { useArticles, useBookmarks } from '@/hooks/knowledge-base/useArticles'
import { useAuthStore } from '@/stores/authStore'
import { PageLayout, PageTabs } from '@/components/layout/index'

// Lazy load tab components for better performance
const ForYouTab = lazy(() => import('@/components/knowledge-base/tabs/ForYouTab'))
const GettingStartedTab = lazy(() => import('@/components/knowledge-base/tabs/GettingStartedTab'))
const TopicsTab = lazy(() => import('@/components/knowledge-base/tabs/TopicsTab'))
const QuickHelpTab = lazy(() => import('@/components/knowledge-base/tabs/QuickHelpTab'))
const MyJourneyTab = lazy(() => import('@/components/knowledge-base/tabs/MyJourneyTab'))
const ToolsTab = lazy(() => import('@/components/knowledge-base/tabs/ToolsTab'))

// Tab definitions with i18n keys
const tabDefs = [
  { id: 'for-you', labelKey: 'knowledgeBase.tabs.forYou', path: '/knowledge-base', icon: Sparkles },
  { id: 'getting-started', labelKey: 'knowledgeBase.tabs.gettingStarted', path: '/knowledge-base?tab=getting-started', icon: Rocket },
  { id: 'topics', labelKey: 'knowledgeBase.tabs.topics', path: '/knowledge-base?tab=topics', icon: BookOpen },
  { id: 'quick-help', labelKey: 'knowledgeBase.tabs.quickHelp', path: '/knowledge-base?tab=quick-help', icon: AlertCircle },
  { id: 'my-journey', labelKey: 'knowledgeBase.tabs.myJourney', path: '/knowledge-base?tab=my-journey', icon: Route },
  { id: 'tools', labelKey: 'knowledgeBase.tabs.tools', path: '/knowledge-base?tab=tools', icon: Wrench },
] as const

type TabId = typeof tabDefs[number]['id']


function TabLoader({ message }: { message?: string }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <LoadingState title={message || 'Loading...'} />
    </div>
  )
}

export default function KnowledgeBase() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useAuthStore()
  const { data: articles, isLoading: articlesLoading } = useArticles()
  const { data: bookmarks = [] } = useBookmarks()

  // Get user's first name from profile
  const userName = profile?.first_name || t('knowledgeBase.defaultUser')

  // Build tabs with translated labels
  const tabs = useMemo(() => tabDefs.map((tab) => ({
    ...tab,
    label: t(tab.labelKey),
  })), [t])

  // Get tab from URL query param (e.g., ?tab=topics)
  const getTabFromQuery = useCallback((): TabId => {
    const params = new URLSearchParams(location.search)
    const tabParam = params.get('tab')
    if (!tabParam) return 'for-you'
    // Find tab by matching the id with the tab param
    const matchedTab = tabDefs.find(t => t.id === tabParam)
    return matchedTab ? matchedTab.id : 'for-you'
  }, [location.search])
  
  // Local state for active tab
  const [activeTabId, setActiveTabId] = useState<TabId>(getTabFromQuery)
  
  // Sync with URL query param when it changes
  useEffect(() => {
    const newTabId = getTabFromQuery()
    if (newTabId !== activeTabId) {
      setActiveTabId(newTabId)
    }
  }, [location.search, getTabFromQuery, activeTabId])
  
  // Note: Tab navigation is handled by PageTabs via Link components
  // This function is kept for potential programmatic navigation
  const handleTabClick = (tab: typeof tabDefs[number]) => {
    if (tab.id === activeTabId) return

    // Update URL query param
    const params = new URLSearchParams(location.search)
    if (tab.id !== 'for-you') {
      params.set('tab', tab.id)
    } else {
      params.delete('tab')
    }

    navigate({
      pathname: location.pathname,
      search: params.toString(),
    }, { replace: true })

    setActiveTabId(tab.id)
  }

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0]
  
  // Render content based on active tab
  const renderContent = () => {
    if (articlesLoading) {
      return <TabLoader message={t('knowledgeBase.loadingContent')} />
    }

    if (!articles) {
      return (
        <Card className="p-6 text-center">
          <p className="text-slate-500">{t('knowledgeBase.couldNotLoad')}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-violet-600 hover:underline mt-2"
          >
            {t('knowledgeBase.tryAgain')}
          </button>
        </Card>
      )
    }
    
    switch (activeTabId) {
      case 'for-you':
        return (
          <Suspense fallback={<TabLoader />}>
            <ForYouTab
              articles={articles}
              userName={userName}
            />
          </Suspense>
        )
      case 'getting-started':
        return (
          <Suspense fallback={<TabLoader />}>
            <GettingStartedTab />
          </Suspense>
        )
      case 'topics':
        return (
          <Suspense fallback={<TabLoader />}>
            <TopicsTab
              articles={articles}
            />
          </Suspense>
        )
      case 'quick-help':
        return (
          <Suspense fallback={<TabLoader />}>
            <QuickHelpTab articles={articles} />
          </Suspense>
        )
      case 'my-journey':
        return (
          <Suspense fallback={<TabLoader />}>
            <MyJourneyTab />
          </Suspense>
        )
      case 'tools':
        return (
          <Suspense fallback={<TabLoader />}>
            <ToolsTab />
          </Suspense>
        )
      default:
        return (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">{t('knowledgeBase.welcome')}</h2>
            <p className="text-slate-600">{t('knowledgeBase.selectTab')}</p>
          </Card>
        )
    }
  }
  
  return (
    <PageLayout
      title={t('knowledgeBase.title')}
      description={t('knowledgeBase.description')}
      showTabs={false}
    >
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
          {t('knowledgeBase.intro')}
        </p>
      </div>
      
      {/* Tab navigation - using consistent PageTabs component */}
      <div className="mb-6 sm:mb-8">
        <PageTabs tabs={tabs} variant="glass" />
      </div>

      {/* Tab content */}
      <div className="min-h-[300px] sm:min-h-[400px]">
        {renderContent()}
      </div>
    </PageLayout>
  )
}
