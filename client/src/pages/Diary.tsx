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
const TAB_DEFS = [
  { id: 'journal', labelKey: 'diary.tabs.journal', icon: BookHeart, color: 'teal' },
  { id: 'mood', labelKey: 'diary.tabs.mood', icon: Smile, color: 'amber' },
  { id: 'goals', labelKey: 'diary.tabs.goals', icon: Target, color: 'blue' },
  { id: 'gratitude', labelKey: 'diary.tabs.gratitude', icon: Heart, color: 'rose' },
] as const

type TabId = typeof TAB_DEFS[number]['id']

function TabNavigation({
  activeTab,
  onTabChange,
  streak
}: {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  streak: number
}) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-between gap-4">
      <div className={cn(
        "flex gap-1 p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl overflow-x-auto scrollbar-hide flex-1",
      )}>
        {TAB_DEFS.map((tab) => {
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
                  ? "bg-white dark:bg-stone-800 text-gray-800 dark:text-gray-100 shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-stone-700/50"
              )}
            >
              <Icon className={cn(
                "w-4 h-4 flex-shrink-0",
                isActive && tab.color === 'teal' && "text-teal-600 dark:text-teal-400",
                isActive && tab.color === 'amber' && "text-amber-600 dark:text-amber-400",
                isActive && tab.color === 'blue' && "text-blue-600 dark:text-blue-400",
                isActive && tab.color === 'rose' && "text-rose-600 dark:text-rose-400"
              )} />
              <span className="hidden xs:inline sm:inline">{t(tab.labelKey)}</span>
            </button>
          )
        })}
      </div>

      {/* Compact streak indicator */}
      {streak > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 rounded-xl border border-orange-100 dark:border-orange-800">
          <Flame className="w-4 h-4 text-orange-500 dark:text-orange-400" />
          <span className="font-bold text-orange-600 dark:text-orange-400">{streak}</span>
          <span className="text-xs text-orange-500 dark:text-orange-400 hidden sm:inline">{t('diary.streak.days')}</span>
        </div>
      )}
    </div>
  )
}

function AchievementBanner() {
  const { t } = useTranslation()
  const { currentStreak, longestStreak, totalEntries, totalWords } = useDiaryStreaks()

  // Only show for significant achievements
  let achievement = null

  if (currentStreak >= 7) {
    achievement = {
      emoji: '🔥',
      title: t('diary.achievements.weekStreak.title'),
      description: t('diary.achievements.weekStreak.description', { count: currentStreak }),
      color: 'from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 border-orange-200 dark:border-orange-800'
    }
  } else if (totalEntries >= 10 && totalEntries < 11) {
    achievement = {
      emoji: '📚',
      title: t('diary.achievements.tenEntries.title'),
      description: t('diary.achievements.tenEntries.description'),
      color: 'from-sky-50 to-sky-100 dark:from-sky-900/30 dark:to-sky-800/30 border-sky-200 dark:border-sky-800'
    }
  } else if (totalWords >= 1000 && totalWords < 1100) {
    achievement = {
      emoji: '✍️',
      title: t('diary.achievements.thousandWords.title'),
      description: t('diary.achievements.thousandWords.description'),
      color: 'from-sky-50 to-teal-50 dark:from-sky-900/30 dark:to-teal-900/30 border-sky-200 dark:border-sky-800'
    }
  } else if (longestStreak >= 14) {
    achievement = {
      emoji: '🏆',
      title: t('diary.achievements.twoWeekRecord.title'),
      description: t('diary.achievements.twoWeekRecord.description', { count: longestStreak }),
      color: 'from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-yellow-200 dark:border-yellow-800'
    }
  }

  if (!achievement) return null

  return (
    <Card className={cn("p-4 bg-gradient-to-r border", achievement.color)}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white dark:bg-stone-700 rounded-lg flex items-center justify-center text-xl shadow-sm flex-shrink-0">
          {achievement.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{achievement.title}</h3>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{achievement.description}</p>
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
    if (tab && TAB_DEFS.some(t => t.id === tab)) {
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
    if (tab && TAB_DEFS.some(t => t.id === tab) && tab !== activeTab) {
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
