/**
 * Knowledge Base - Full implementation with all features
 */

import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { useLocation } from 'react-router-dom'
import { Sparkles, Rocket, BookOpen, Route, Wrench, Flame, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, LoadingState } from '@/components/ui'
import { useArticles, useBookmarks } from '@/hooks/knowledge-base/useArticles'
import { useEnergyLevel } from '@/hooks/useEnergyLevel'

// Lazy load tab components for better performance
const ForYouTab = lazy(() => import('@/components/knowledge-base/tabs/ForYouTab'))
const GettingStartedTab = lazy(() => import('@/components/knowledge-base/tabs/GettingStartedTab'))
const TopicsTab = lazy(() => import('@/components/knowledge-base/tabs/TopicsTab'))
const QuickHelpTab = lazy(() => import('@/components/knowledge-base/tabs/QuickHelpTab'))
const MyJourneyTab = lazy(() => import('@/components/knowledge-base/tabs/MyJourneyTab'))
const ToolsTab = lazy(() => import('@/components/knowledge-base/tabs/ToolsTab'))
const TrendingTab = lazy(() => import('@/components/knowledge-base/tabs/TrendingTab'))

const tabs = [
  { id: 'for-you', label: 'För dig', hash: '', icon: Sparkles },
  { id: 'getting-started', label: 'Komma igång', hash: '#getting-started', icon: Rocket },
  { id: 'topics', label: 'Ämnen', hash: '#topics', icon: BookOpen },
  { id: 'quick-help', label: 'Snabbhjälp', hash: '#quick-help', icon: AlertCircle },
  { id: 'my-journey', label: 'Min resa', hash: '#my-journey', icon: Route },
  { id: 'tools', label: 'Verktyg', hash: '#tools', icon: Wrench },
  { id: 'trending', label: 'Trendar', hash: '#trending', icon: Flame },
] as const

type TabId = typeof tabs[number]['id']

// Mock user profile - in real app, this comes from auth context
const mockUserProfile = {
  name: 'Maria',
  interests: ['cv', 'intervju', 'kundservice'],
  completedArticles: ['welcome', 'first-cv'],
  streak: 3,
  weeklyGoal: 5,
  weeklyProgress: 3,
}

function TabLoader() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <LoadingState title="Laddar innehåll..." />
    </div>
  )
}

export default function KnowledgeBase() {
  const location = useLocation()
  const [energyLevel, setEnergyLevel] = useEnergyLevel()
  const { data: articles, isLoading: articlesLoading } = useArticles()
  const { data: bookmarks = [] } = useBookmarks()
  
  // Get initial tab from URL hash
  const getTabFromHash = useCallback((): TabId => {
    const hash = location.hash.replace('#', '')
    const matchedTab = tabs.find(t => t.id === hash)
    return matchedTab ? matchedTab.id : 'for-you'
  }, [location.hash])
  
  // Local state for active tab
  const [activeTabId, setActiveTabId] = useState<TabId>(getTabFromHash)
  
  // Sync with URL hash when it changes
  useEffect(() => {
    const newTabId = getTabFromHash()
    if (newTabId !== activeTabId) {
      setActiveTabId(newTabId)
    }
  }, [location.hash, getTabFromHash, activeTabId])
  
  const handleTabClick = (tab: typeof tabs[number]) => {
    if (tab.id === activeTabId) return
    
    // Update URL hash
    window.location.hash = tab.hash
    setActiveTabId(tab.id)
  }
  
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0]
  
  // Render content based on active tab
  const renderContent = () => {
    if (articlesLoading) {
      return <TabLoader />
    }
    
    if (!articles) {
      return (
        <Card className="p-6 text-center">
          <p className="text-slate-500">Kunde inte ladda artiklar</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-violet-600 hover:underline mt-2"
          >
            Försök igen
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
            <h2 className="text-xl font-bold mb-4">Välkommen</h2>
            <p className="text-slate-600">Välj en flik ovan för att utforska kunskapsbanken.</p>
          </Card>
        )
    }
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Kunskapsbank</h1>
        <p className="text-slate-600 mt-2 max-w-2xl">
          Artiklar, guider och verktyg för din jobbsökarresa. 
          Oavsett om du är nybörjare eller erfaren hittar du något som hjälper dig framåt.
        </p>
        
        {/* Energy indicator */}
        <div className={cn(
          "inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-sm font-medium",
          energyLevel === 'low' && "bg-sky-100 text-sky-800",
          energyLevel === 'medium' && "bg-amber-100 text-amber-800",
          energyLevel === 'high' && "bg-rose-100 text-rose-800",
        )}>
          <span>Din energinivå:</span>
          <span className="capitalize">
            {energyLevel === 'low' ? 'Låg' : energyLevel === 'medium' ? 'Medel' : 'Hög'}
          </span>
          <span className="opacity-70">
            {energyLevel === 'low' && '• Korta artiklar rekommenderas'}
            {energyLevel === 'medium' && '• Balanserat innehåll'}
            {energyLevel === 'high' && '• Perfekt för djupgående läsning'}
          </span>
        </div>
      </div>
      
      {/* Tab navigation */}
      <div className="mb-8 border-b border-slate-200">
        <nav className="flex gap-1 overflow-x-auto scrollbar-hide" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTabId === tab.id
            
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap bg-transparent",
                  isActive
                    ? "border-violet-600 text-violet-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
      
      {/* Tab content */}
      <div className="min-h-[400px]">
        {renderContent()}
      </div>
    </div>
  )
}
