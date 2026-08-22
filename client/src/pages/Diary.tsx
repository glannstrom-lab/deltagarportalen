/**
 * Diary Page - Personal journal, mood tracking, goals, and gratitude
 * Simplified, clean interface focused on writing
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Award, Flame
} from '@/components/ui/icons'
import { PageLayout } from '@/components/layout/index'
import { RadgivarTips } from '@/components/radgivare/RadgivarPanel'
import { JournalTab, MoodTab, GoalsTab, GratitudeTab } from '@/components/diary'
import { useDiaryStreaks } from '@/hooks/useDiary'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui'
import { WellnessConsentGate } from '@/components/consent/WellnessConsentGate'
import { NotebookPen } from '@/components/ui/icons'
import { useFocusMode } from '@/components/FocusModeProvider'
import { FocusDiaryWizard } from '@/components/focus/pages/FocusDiaryWizard'
import { FokusVaxel } from '@/components/focus/shell/FokusVaxel'

// Tab configuration — flikarna själva flyttade in i sidoskenan (steg 5,
// 2026-08-17). Etiketterna kommer fortfarande härifrån.
const TAB_DEFS = [
  { id: 'journal', labelKey: 'diary.tabs.journal' },
  { id: 'mood', labelKey: 'diary.tabs.mood' },
  { id: 'goals', labelKey: 'diary.tabs.goals' },
  { id: 'gratitude', labelKey: 'diary.tabs.gratitude' },
] as const

type TabId = typeof TAB_DEFS[number]['id']

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
      color: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800'
    }
  } else if (totalEntries >= 10 && totalEntries < 11) {
    achievement = {
      emoji: '📚',
      title: t('diary.achievements.tenEntries.title'),
      description: t('diary.achievements.tenEntries.description'),
      color: 'bg-sky-50 dark:bg-sky-900/30 border-[var(--c-accent)] dark:border-[var(--c-accent)]/50'
    }
  } else if (totalWords >= 1000 && totalWords < 1100) {
    achievement = {
      emoji: '✍️',
      title: t('diary.achievements.thousandWords.title'),
      description: t('diary.achievements.thousandWords.description'),
      color: 'bg-sky-50 dark:bg-sky-900/30 border-[var(--c-accent)] dark:border-[var(--c-accent)]/50'
    }
  } else if (longestStreak >= 14) {
    achievement = {
      emoji: '🏆',
      title: t('diary.achievements.twoWeekRecord.title'),
      description: t('diary.achievements.twoWeekRecord.description', { count: longestStreak }),
      color: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800'
    }
  }

  if (!achievement) return null

  return (
    <Card className={cn("p-4 border", achievement.color)}>
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
  const { leaveWizard } = useFocusMode()

  return (
    <FokusVaxel
      title={t('diary.title', 'Dagbok')}
      icon={NotebookPen}
      domain="wellbeing"
      guide={<FocusDiaryWizard onExit={leaveWizard} />}
    >
      <DiaryInner />
    </FokusVaxel>
  )
}

function DiaryInner() {
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
      domain="wellbeing"
      className="sidbredd"
      sidoflikar={{
        poster: TAB_DEFS.map((tab) => ({ id: tab.id, etikett: t(tab.labelKey) })),
        aktiv: activeTab,
        vidVal: (id) => handleTabChange(id as TabId),
      }}
>
      <WellnessConsentGate>
      <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
        {/* Achievement Banner (only for significant milestones) */}
        <AchievementBanner />

        {/* Streak — flikarna ligger numera i sidoskenan (steg 5), den här
            badgen är inte en flik och blir kvar i innehållet. */}
        {currentStreak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 rounded-xl border border-[var(--c-accent)] w-fit">
            <Flame className="w-4 h-4 text-orange-500 dark:text-orange-400" aria-hidden="true" />
            <span className="font-bold text-orange-600 dark:text-orange-400">{currentStreak}</span>
            <span className="text-xs text-orange-500 dark:text-orange-400">{t('diary.streak.days')}</span>
          </div>
        )}

        <RadgivarTips pathname="/diary" index={0} />

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {renderTabContent()}
        </div>
      </div>
      </WellnessConsentGate>
    </PageLayout>
  )
}
