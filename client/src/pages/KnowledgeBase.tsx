/**
 * Knowledge Base - Main Page with Tab Navigation
 * Complete rewrite with new tab structure and features
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Sparkles,
  Rocket,
  BookOpen,
  Route,
  Wrench,
  Flame,
  AlertCircle,
} from 'lucide-react'
import { useArticles, useBookmarks } from '@/hooks/knowledge-base/useArticles'
import { useEnergyLevel } from '@/hooks/useEnergyLevel'
import { cn } from '@/lib/utils'
import { Card, LoadingState } from '@/components/ui'
import {
  ForYouTab,
  GettingStartedTab,
  TopicsTab,
  QuickHelpTab,
  MyJourneyTab,
  ToolsTab,
  TrendingTab,
} from '@/components/knowledge-base'

// Tab definitions
const tabs = [
  {
    id: 'for-you',
    label: 'För dig',
    path: '/dashboard/knowledge-base',
    icon: Sparkles,
    description: 'Personligt anpassat innehåll',
  },
  {
    id: 'getting-started',
    label: 'Komma igång',
    path: '/dashboard/knowledge-base/getting-started',
    icon: Rocket,
    description: 'Snabbstart för nya användare',
  },
  {
    id: 'topics',
    label: 'Ämnen',
    path: '/dashboard/knowledge-base/topics',
    icon: BookOpen,
    description: 'Bläddra alla kategorier',
  },
  {
    id: 'quick-help',
    label: 'Snabbhjälp',
    path: '/dashboard/knowledge-base/quick-help',
    icon: AlertCircle,
    description: 'Akuta situationer',
  },
  {
    id: 'my-journey',
    label: 'Min resa',
    path: '/dashboard/knowledge-base/my-journey',
    icon: Route,
    description: 'Din progress och sparade',
  },
  {
    id: 'tools',
    label: 'Verktyg',
    path: '/dashboard/knowledge-base/tools',
    icon: Wrench,
    description: 'Mallar och checklistor',
  },
  {
    id: 'trending',
    label: 'Trendar',
    path: '/dashboard/knowledge-base/trending',
    icon: Flame,
    description: 'Populärt just nu',
  },
]

// Mock user profile - in real app, this comes from auth context
const mockUserProfile = {
  name: 'Maria',
  interests: ['cv', 'intervju', 'kundservice'],
  completedArticles: ['welcome', 'first-cv'],
  streak: 3,
  weeklyGoal: 5,
  weeklyProgress: 3,
}

export default function KnowledgeBase() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { data: articles, isLoading } = useArticles()
  const { data: bookmarks = [] } = useBookmarks()
  const [energyLevel] = useEnergyLevel()
  
  // Determine active tab from URL
  const currentPath = window.location.pathname
  const activeTab = tabs.find(t => currentPath.startsWith(t.path)) || tabs[0]
  
  const handleTabClick = (tab: typeof tabs[0]) => {
    navigate(tab.path)
  }
  
  const handleArticleClick = (articleId: string) => {
    navigate(`/knowledge-base/article/${articleId}`)
  }
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <LoadingState title="Laddar kunskapsbanken..." />
      </div>
    )
  }
  
  if (!articles) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <p className="text-slate-500">Kunde inte ladda artiklar</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-teal-600 hover:underline mt-2"
          >
            Försök igen
          </button>
        </Card>
      </div>
    )
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
      <div className="mb-8">
        <div className="border-b border-slate-200">
          <nav className="flex gap-1 overflow-x-auto scrollbar-hide" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab.id === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    isActive
                      ? "border-violet-600 text-violet-600"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={cn(
                    "w-4 h-4",
                    isActive ? "text-violet-600" : "text-slate-400"
                  )} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
        
        {/* Tab description */}
        <p className="text-sm text-slate-500 mt-3">
          {activeTab.description}
        </p>
      </div>
      
      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab.id === 'for-you' && (
          <ForYouTab userProfile={mockUserProfile} />
        )}
        
        {activeTab.id === 'getting-started' && (
          <GettingStartedTab
            articles={articles}
            completedArticles={mockUserProfile.completedArticles}
            onArticleClick={handleArticleClick}
          />
        )}
        
        {activeTab.id === 'topics' && (
          <TopicsTab
            articles={articles}
            categories={[]}
            onArticleClick={handleArticleClick}
          />
        )}
        
        {activeTab.id === 'quick-help' && (
          <QuickHelpTab
            articles={articles}
            onArticleClick={handleArticleClick}
          />
        )}
        
        {activeTab.id === 'my-journey' && (
          <MyJourneyTab
            articles={articles}
            bookmarks={bookmarks}
            completedArticles={mockUserProfile.completedArticles}
            streak={mockUserProfile.streak}
            weeklyGoal={mockUserProfile.weeklyGoal}
            weeklyProgress={mockUserProfile.weeklyProgress}
          />
        )}
        
        {activeTab.id === 'tools' && (
          <ToolsTab />
        )}
        
        {activeTab.id === 'trending' && (
          <TrendingTab articles={articles} />
        )}
      </div>
    </div>
  )
}
