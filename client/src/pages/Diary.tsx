/**
 * Diary Page - Personal journal, mood tracking, goals, and gratitude
 * Simplified, clean interface focused on writing
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  BookHeart, Smile, Target, Heart, Award, Flame
} from '@/components/ui/icons'
import { PageLayout } from '@/components/layout/index'
import { JournalTab, MoodTab, GoalsTab, GratitudeTab } from '@/components/diary'
import { HelpButton } from '@/components/HelpButton'
import { helpContent } from '@/data/helpContent'
import { useDiaryStreaks } from '@/hooks/useDiary'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui'
import { WellnessConsentGate } from '@/components/consent/WellnessConsentGate'

// Tab configuration
const TABS = [
  { id: 'journal', label: 'Dagbok', icon: BookHeart, color: 'violet' },
  { id: 'mood', label: 'Humör', icon: Smile, color: 'amber' },
  { id: 'goals', label: 'Mål', icon: Target, color: 'blue' },
  { id: 'gratitude', label: 'Tacksamhet', icon: Heart, color: 'rose' },
] as const

type TabId = typeof TABS[number]['id']

function TabNavigation({
  activeTab,
  onTabChange,
  streak
}: {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  streak: number
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className={cn(
        "flex gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto scrollbar-hide flex-1",
      )}>
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-lg",
                "font-medium text-xs sm:text-sm transition-all whitespace-nowrap",
                "min-h-[44px]",
                isActive
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              )}
            >
              <Icon className={cn(
                "w-4 h-4 flex-shrink-0",
                isActive && tab.color === 'violet' && "text-violet-600",
                isActive && tab.color === 'amber' && "text-amber-600",
                isActive && tab.color === 'blue' && "text-blue-600",
                isActive && tab.color === 'rose' && "text-rose-600"
              )} />
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Compact streak indicator */}
      {streak > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="font-bold text-orange-600">{streak}</span>
          <span className="text-xs text-orange-500 hidden sm:inline">dagar</span>
        </div>
      )}
    </div>
  )
}

function AchievementBanner() {
  const { currentStreak, longestStreak, totalEntries, totalWords } = useDiaryStreaks()

  // Only show for significant achievements
  let achievement = null

  if (currentStreak >= 7) {
    achievement = {
      emoji: '🔥',
      title: 'En veckas streak!',
      description: `Du har skrivit ${currentStreak} dagar i rad!`,
      color: 'from-orange-50 to-amber-50 border-orange-200'
    }
  } else if (totalEntries >= 10 && totalEntries < 11) {
    achievement = {
      emoji: '📚',
      title: '10 inlägg!',
      description: 'Du har skrivit 10 dagboksinlägg!',
      color: 'from-blue-50 to-indigo-50 border-blue-200'
    }
  } else if (totalWords >= 1000 && totalWords < 1100) {
    achievement = {
      emoji: '✍️',
      title: '1000 ord!',
      description: 'Du har skrivit över 1000 ord totalt!',
      color: 'from-purple-50 to-violet-50 border-purple-200'
    }
  } else if (longestStreak >= 14) {
    achievement = {
      emoji: '🏆',
      title: 'Två veckors rekord!',
      description: `Ditt längsta streak: ${longestStreak} dagar!`,
      color: 'from-yellow-50 to-amber-50 border-yellow-200'
    }
  }

  if (!achievement) return null

  return (
    <Card className={cn("p-4 bg-gradient-to-r border", achievement.color)}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl shadow-sm flex-shrink-0">
          {achievement.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <h3 className="font-semibold text-slate-900 text-sm">{achievement.title}</h3>
          </div>
          <p className="text-xs text-slate-600 truncate">{achievement.description}</p>
        </div>
      </div>
    </Card>
  )
}

export default function Diary() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { currentStreak } = useDiaryStreaks()

  // Get initial tab from URL or default to 'journal'
  const getInitialTab = (): TabId => {
    const params = new URLSearchParams(location.search)
    const tab = params.get('tab') as TabId
    if (tab && TABS.some(t => t.id === tab)) {
      return tab
    }
    return 'journal'
  }

  const [activeTab, setActiveTab] = useState<TabId>(getInitialTab())

  // Update URL when tab changes
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
    navigate(`/diary?tab=${tab}`, { replace: true })
  }

  // Sync with URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tab = params.get('tab') as TabId
    if (tab && TABS.some(t => t.id === tab) && tab !== activeTab) {
      setActiveTab(tab)
    }
  }, [location.search])

  const renderTabContent = () => {
    switch (activeTab) {
      case 'journal':
        return <JournalTab />
      case 'mood':
        return <MoodTab />
      case 'goals':
        return <GoalsTab />
      case 'gratitude':
        return <GratitudeTab />
      default:
        return <JournalTab />
    }
  }

  return (
    <PageLayout
      title={t('diary.title')}
      description={t('diary.description')}
      showTabs={false}
    >
      <WellnessConsentGate>
      <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
        {/* Achievement Banner (only for significant milestones) */}
        <AchievementBanner />

        {/* Tab Navigation with streak */}
        <TabNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          streak={currentStreak}
        />

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {renderTabContent()}
        </div>
      </div>
      </WellnessConsentGate>
      <HelpButton content={helpContent.diary} />
    </PageLayout>
  )
}
