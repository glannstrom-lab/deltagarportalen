/**
 * Knowledge Base - Full implementation with query-based tab routing
 */

import { useState, useEffect, useCallback, Suspense, lazy, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sparkles, Rocket, BookOpen, Route, Wrench, Flame, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, LoadingState } from '@/components/ui'
import { useArticles, useBookmarks } from '@/hooks/knowledge-base/useArticles'
import { useEnergyLevel } from '@/hooks/useEnergyLevel'
import { PageLayout, PageTabs } from '@/components/layout/index'

// Lazy load tab components for better performance
const ForYouTab = lazy(() => import('@/components/knowledge-base/tabs/ForYouTab'))
const GettingStartedTab = lazy(() => import('@/components/knowledge-base/tabs/GettingStartedTab'))
const TopicsTab = lazy(() => import('@/components/knowledge-base/tabs/TopicsTab'))
const QuickHelpTab = lazy(() => import('@/components/knowledge-base/tabs/QuickHelpTab'))
const MyJourneyTab = lazy(() => import('@/components/knowledge-base/tabs/MyJourneyTab'))
const ToolsTab = lazy(() => import('@/components/knowledge-base/tabs/ToolsTab'))
const TrendingTab = lazy(() => import('@/components/knowledge-base/tabs/TrendingTab'))

// Tab definitions with i18n keys
const tabDefs = [
  { id: 'for-you', labelKey: 'knowledgeBase.tabs.forYou', path: '/knowledge-base', icon: Sparkles },
  { id: 'getting-started', labelKey: 'knowledgeBase.tabs.gettingStarted', path: '/knowledge-base?tab=getting-started', icon: Rocket },
  { id: 'topics', labelKey: 'knowledgeBase.tabs.topics', path: '/knowledge-base?tab=topics', icon: BookOpen },
  { id: 'quick-help', labelKey: 'knowledgeBase.tabs.quickHelp', path: '/knowledge-base?tab=quick-help', icon: AlertCircle },
  { id: 'my-journey', labelKey: 'knowledgeBase.tabs.myJourney', path: '/knowledge-base?tab=my-journey', icon: Route },
  { id: 'tools', labelKey: 'knowledgeBase.tabs.tools', path: '/knowledge-base?tab=tools', icon: Wrench },
  { id: 'trending', labelKey: 'knowledgeBase.tabs.trending', path: '/knowledge-base?tab=trending', icon: Flame },
] as const

type TabId = typeof tabDefs[number]['id']

// Mock user profile - in real app, this comes from auth context
const mockUserProfile = {
  name: 'Maria',
  interests: ['cv', 'intervju', 'kundservice'],
  completedArticles: ['welcome', 'first-cv'],
  streak: 3,
  weeklyGoal: 5,
  weeklyProgress: 3,
}

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
  const [energyLevel, setEnergyLevel] = useEnergyLevel()
  const { data: articles, isLoading: articlesLoading } = useArticles()
  const { data: bookmarks = [] } = useBookmarks()

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
              userProfile={mockUserProfile}
              energyLevel={energyLevel}
            />
          </Suspense>
        )
      case 'getting-started':
        return (
          <Suspense fallback={<TabLoader />}>
            <GettingStartedTab
              articles={articles}
              completedArticles={mockUserProfile.completedArticles}
            />
          </Suspense>
        )
      case 'topics':
        return (
          <Suspense fallback={<TabLoader />}>
            <TopicsTab
              articles={articles}
              categories={[]}
              energyLevel={energyLevel}
              onEnergyLevelChange={setEnergyLevel}
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
            <MyJourneyTab
              articles={articles}
              bookmarks={bookmarks}
              completedArticles={mockUserProfile.completedArticles}
              streak={mockUserProfile.streak}
              weeklyGoal={mockUserProfile.weeklyGoal}
              weeklyProgress={mockUserProfile.weeklyProgress}
            />
          </Suspense>
        )
      case 'tools':
        return (
          <Suspense fallback={<TabLoader />}>
            <ToolsTab />
          </Suspense>
        )
      case 'trending':
        return (
          <Suspense fallback={<TabLoader />}>
            <TrendingTab articles={articles} />
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

        {/* Energy indicator */}
        <div className={cn(
          "inline-flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium",
          energyLevel === 'low' && "bg-sky-100 text-sky-800",
          energyLevel === 'medium' && "bg-amber-100 text-amber-800",
          energyLevel === 'high' && "bg-rose-100 text-rose-800",
        )}>
          <span>{t('knowledgeBase.energyLevel')}:</span>
          <span className="capitalize">
            {energyLevel === 'low' ? t('knowledgeBase.energyLow') : energyLevel === 'medium' ? t('knowledgeBase.energyMedium') : t('knowledgeBase.energyHigh')}
          </span>
          <span className="hidden sm:inline opacity-70">
            {energyLevel === 'low' && `• ${t('knowledgeBase.energyLowTip')}`}
            {energyLevel === 'medium' && `• ${t('knowledgeBase.energyMediumTip')}`}
            {energyLevel === 'high' && `• ${t('knowledgeBase.energyHighTip')}`}
          </span>
        </div>
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
