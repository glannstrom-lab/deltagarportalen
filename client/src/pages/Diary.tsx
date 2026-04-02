/**
 * Diary Page - Personal journal, mood tracking, goals, and gratitude
 * All data saved automatically to cloud (Supabase)
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  BookHeart, Smile, Target, Heart, BarChart3,
  Sparkles, TrendingUp, Calendar, Award
} from '@/components/ui/icons'
import { PageLayout } from '@/components/layout/index'
import { JournalTab, MoodTab, GoalsTab, GratitudeTab, DailyTask } from '@/components/diary'
import { HelpButton } from '@/components/HelpButton'
import { helpContent } from '@/data/helpContent'
import { useDiaryStreaks, useMoodLogs, useWeeklyGoals, useGratitude } from '@/hooks/useDiary'
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
  onTabChange
}: {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}) {
  return (
    <div className={cn(
      "flex gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto scrollbar-hide",
      // Full-bleed on mobile for horizontal scroll
      "-mx-4 px-4 sm:mx-0 sm:px-1"
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
              "min-h-[44px]", // Touch-friendly height
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
  )
}

function QuickStats() {
  const { currentStreak, totalEntries } = useDiaryStreaks()
  const { stats: moodStats, todayMood } = useMoodLogs()
  const { completedCount, totalCount } = useWeeklyGoals()
  const { hasLoggedToday: hasGratitude } = useGratitude()

  // Calculate completeness for today
  const todayTasks = [
    !!todayMood,
    hasGratitude,
    // Could add more daily checks here
  ]
  const todayProgress = todayTasks.filter(Boolean).length
  const todayTotal = todayTasks.length

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Card className="p-3 sm:p-4 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100">
        <div className="flex items-center gap-1.5 sm:gap-2 text-violet-600 mb-1">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">Streak</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl sm:text-2xl font-bold text-violet-700">{currentStreak}</span>
          <span className="text-violet-500">🔥</span>
        </div>
        <p className="text-[10px] sm:text-xs text-violet-500 mt-1">dagar i rad</p>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 mb-1">
          <Smile className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">Snitthumör</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl sm:text-2xl font-bold text-slate-900">
            {moodStats.averageMood > 0 ? moodStats.averageMood.toFixed(1) : '-'}
          </span>
          <span className="text-slate-500">/5</span>
        </div>
        <p className="text-[10px] sm:text-xs text-slate-400 mt-1">senaste 30 dagarna</p>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 mb-1">
          <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">Veckans mål</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl sm:text-2xl font-bold text-slate-900">{completedCount}</span>
          <span className="text-slate-500">/ {totalCount}</span>
        </div>
        <p className="text-[10px] sm:text-xs text-slate-400 mt-1">avklarade</p>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 mb-1">
          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">Idag</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl sm:text-2xl font-bold text-slate-900">{todayProgress}</span>
          <span className="text-slate-500">/ {todayTotal}</span>
        </div>
        <p className="text-[10px] sm:text-xs text-slate-400 mt-1">loggningar</p>
      </Card>
    </div>
  )
}

function AchievementBanner() {
  const { currentStreak, longestStreak, totalEntries, totalWords } = useDiaryStreaks()

  // Determine achievement to show
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
    <Card className={cn("p-4 bg-gradient-to-r border-2", achievement.color)}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">
          {achievement.emoji}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-slate-900">{achievement.title}</h3>
          </div>
          <p className="text-sm text-slate-600">{achievement.description}</p>
        </div>
      </div>
    </Card>
  )
}

export default function Diary() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

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
      <div className="space-y-4 sm:space-y-6">
        {/* Achievement Banner (shown when relevant) */}
        <AchievementBanner />

        {/* Quick Stats */}
        <QuickStats />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Main Area */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Tab Navigation */}
            <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

            {/* Tab Content */}
            <div className="min-h-[400px] sm:min-h-[500px]">
              {renderTabContent()}
            </div>
          </div>

          {/* Sidebar - hidden on mobile, shown as bottom section on tablet+ */}
          <div className="space-y-4">
            {/* Daily Task */}
            <DailyTask />

            {/* Tips Card - Hidden on small mobile */}
            <Card className="hidden sm:block p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-800 mb-1 text-sm sm:text-base">Tips</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {activeTab === 'journal' && 'Skriv regelbundet för att bygga en vana. Även några få meningar räcker!'}
                    {activeTab === 'mood' && 'Logga ditt humör vid samma tid varje dag för mer exakta mönster.'}
                    {activeTab === 'goals' && 'Sätt upp 3-5 mål per vecka. Kvalitet före kvantitet!'}
                    {activeTab === 'gratitude' && 'Försök hitta nya saker att vara tacksam för varje dag.'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Quick Links - Hidden on mobile */}
            <Card className="hidden md:block p-3 sm:p-4">
              <h3 className="font-semibold text-slate-800 mb-2 sm:mb-3 text-sm sm:text-base">Genvägar</h3>
              <div className="space-y-1 sm:space-y-2">
                <button
                  onClick={() => handleTabChange('journal')}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-violet-50 text-sm text-slate-600 hover:text-violet-700 transition-colors flex items-center gap-2 min-h-[44px]"
                >
                  <BookHeart className="w-4 h-4 flex-shrink-0" />
                  Skriv i dagboken
                </button>
                <button
                  onClick={() => handleTabChange('mood')}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-amber-50 text-sm text-slate-600 hover:text-amber-700 transition-colors flex items-center gap-2 min-h-[44px]"
                >
                  <Smile className="w-4 h-4 flex-shrink-0" />
                  Logga humör
                </button>
                <button
                  onClick={() => handleTabChange('gratitude')}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-rose-50 text-sm text-slate-600 hover:text-rose-700 transition-colors flex items-center gap-2 min-h-[44px]"
                >
                  <Heart className="w-4 h-4 flex-shrink-0" />
                  Tacksamhet
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
      </WellnessConsentGate>
      <HelpButton content={helpContent.diary} />
    </PageLayout>
  )
}
