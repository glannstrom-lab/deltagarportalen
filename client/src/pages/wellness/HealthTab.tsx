/**
 * Health Tab - Main Wellness Content
 * Mood logging prominently at top, activities and tips below
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Heart, Brain, Sun, Moon, Activity, Coffee,
  Sparkles, CheckCircle, PenLine, Quote, Loader2, Check
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { moodApi, wellnessDataApi, type MoodType } from '@/services/cloudStorage'
import { cn } from '@/lib/utils'

interface WellnessTip {
  id: string
  category: 'mental' | 'physical' | 'sleep' | 'social'
  title: string
  description: string
  icon: React.ElementType
  color: string
}

interface DailyActivity {
  id: string
  title: string
  completed: boolean
  icon: React.ElementType
}

// Mood option definitions (labels will be translated in component)
const moodOptionDefs: { value: MoodType; icon: string; labelKey: string; color: string; bgColor: string }[] = [
  { value: 'great', icon: '😄', labelKey: 'wellness.health.moods.great', color: 'text-[var(--c-text)] dark:text-[var(--c-text)]', bgColor: 'bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 hover:bg-[var(--c-accent)]/60 dark:hover:bg-[var(--c-bg)]/50 border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50' },
  { value: 'good', icon: '🙂', labelKey: 'wellness.health.moods.good', color: 'text-[var(--c-text)] dark:text-blue-400', bgColor: 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 hover:bg-blue-200 dark:hover:bg-blue-900/50 border-[var(--c-accent)] dark:border-[var(--c-accent)]/50' },
  { value: 'okay', icon: '😐', labelKey: 'wellness.health.moods.okay', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 border-amber-200 dark:border-amber-800' },
  { value: 'bad', icon: '😔', labelKey: 'wellness.health.moods.bad', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 border-orange-200 dark:border-orange-800' },
  { value: 'terrible', icon: '😢', labelKey: 'wellness.health.moods.terrible', color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-200 dark:hover:bg-rose-900/50 border-rose-200 dark:border-rose-800' },
]

// Wellness tip definitions (titles/descriptions will be translated in component)
const wellnessTipDefs: { id: string; category: WellnessTip['category']; titleKey: string; descKey: string; icon: React.ElementType; color: string }[] = [
  { id: '1', category: 'mental', titleKey: 'wellness.health.tips.mindfulness.title', descKey: 'wellness.health.tips.mindfulness.description', icon: Brain, color: 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-solid)]' },
  { id: '2', category: 'physical', titleKey: 'wellness.health.tips.exercise.title', descKey: 'wellness.health.tips.exercise.description', icon: Activity, color: 'bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-text)]' },
  { id: '3', category: 'sleep', titleKey: 'wellness.health.tips.sleep.title', descKey: 'wellness.health.tips.sleep.description', icon: Moon, color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' },
  { id: '4', category: 'social', titleKey: 'wellness.health.tips.social.title', descKey: 'wellness.health.tips.social.description', icon: Coffee, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
]

// Activity definitions (titles will be translated in component)
const activityDefs: { id: string; titleKey: string; icon: React.ElementType }[] = [
  { id: '1', titleKey: 'wellness.health.activities.walk', icon: Activity },
  { id: '2', titleKey: 'wellness.health.activities.meditation', icon: Brain },
  { id: '3', titleKey: 'wellness.health.activities.positiveThings', icon: Sun },
  { id: '4', titleKey: 'wellness.health.activities.contactFriend', icon: Coffee },
]

// Quote definitions (will be translated in component)
const quoteDefs = [
  { textKey: 'wellness.health.quotes.quote1.text', authorKey: 'wellness.health.quotes.quote1.author' },
  { textKey: 'wellness.health.quotes.quote2.text', authorKey: 'wellness.health.quotes.quote2.author' },
  { textKey: 'wellness.health.quotes.quote3.text', authorKey: 'wellness.health.quotes.quote3.author' },
]

export default function HealthTab() {
  const { t } = useTranslation()
  const [currentMood, setCurrentMood] = useState<MoodType | null>(null)
  const [moodNote, setMoodNote] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [isSavingMood, setIsSavingMood] = useState(false)
  const [moodSaved, setMoodSaved] = useState(false)
  const [moodStreak, setMoodStreak] = useState(0)

  // Build translated options
  const moodOptions = useMemo(() => moodOptionDefs.map(m => ({
    ...m,
    label: t(m.labelKey)
  })), [t])

  const wellnessTips = useMemo(() => wellnessTipDefs.map(tip => ({
    ...tip,
    title: t(tip.titleKey),
    description: t(tip.descKey)
  })), [t])

  const initialActivities: DailyActivity[] = useMemo(() => activityDefs.map(a => ({
    id: a.id,
    title: t(a.titleKey),
    completed: false,
    icon: a.icon
  })), [t])

  const quote = useMemo(() => {
    const idx = Math.floor(Math.random() * quoteDefs.length)
    return {
      text: t(quoteDefs[idx].textKey),
      author: t(quoteDefs[idx].authorKey)
    }
  }, [t])

  const [activities, setActivities] = useState<DailyActivity[]>(() => initialActivities)
  const [reflection, setReflection] = useState('')
  const [savedReflections, setSavedReflections] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)

      // Load mood data
      const [todaysMood, streak, wellnessData] = await Promise.all([
        moodApi.getTodaysMood(),
        moodApi.getStreak(),
        wellnessDataApi.get()
      ])

      if (todaysMood) {
        setCurrentMood(todaysMood.mood)
        setMoodNote(todaysMood.note || '')
        setMoodSaved(true)
      }
      setMoodStreak(streak)

      if (wellnessData) {
        if (wellnessData.activities) {
          setActivities(prev => prev.map(a => ({
            ...a,
            completed: wellnessData.activities?.[a.id] || false
          })))
        }
        if (wellnessData.reflections) {
          setSavedReflections(wellnessData.reflections)
        }
      }
    } catch (error) {
      console.error('Failed to load wellness data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleMoodSelect = async (mood: MoodType) => {
    setCurrentMood(mood)
    setIsSavingMood(true)

    try {
      const success = await moodApi.logMood(mood, moodNote || undefined)
      if (success) {
        setMoodSaved(true)
        // Refresh streak
        const newStreak = await moodApi.getStreak()
        setMoodStreak(newStreak)
      }
    } catch (error) {
      console.error('Failed to save mood:', error)
    } finally {
      setIsSavingMood(false)
    }
  }

  const handleSaveMoodNote = async () => {
    if (!currentMood) return
    setIsSavingMood(true)

    try {
      await moodApi.logMood(currentMood, moodNote || undefined)
      setShowNoteInput(false)
    } catch (error) {
      console.error('Failed to save mood note:', error)
    } finally {
      setIsSavingMood(false)
    }
  }

  const toggleActivity = async (id: string) => {
    const newActivities = activities.map(a =>
      a.id === id ? { ...a, completed: !a.completed } : a
    )
    setActivities(newActivities)

    try {
      await wellnessDataApi.save({
        activities: newActivities.reduce((acc, a) => ({ ...acc, [a.id]: a.completed }), {}),
        reflections: savedReflections
      })
    } catch (error) {
      console.error('Failed to save activity:', error)
    }
  }

  const saveReflection = async () => {
    if (!reflection.trim()) return

    setIsSaving(true)
    try {
      const newReflections = [...savedReflections, reflection]
      await wellnessDataApi.save({
        activities: activities.reduce((acc, a) => ({ ...acc, [a.id]: a.completed }), {}),
        reflections: newReflections
      })
      setSavedReflections(newReflections)
      setReflection('')
    } catch (error) {
      console.error('Failed to save reflection:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--c-text)] dark:text-[var(--c-text)]" />
      </div>
    )
  }

  const completedCount = activities.filter(a => a.completed).length
  const selectedMoodOption = moodOptions.find(m => m.value === currentMood)

  return (
    <div className="space-y-6">
      {/* Mood Logging - Prominent at top */}
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-[var(--c-bg)] to-[var(--c-bg)] dark:from-[var(--c-bg)]/30 dark:to-[var(--c-bg)]/30 border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--c-text)] dark:text-[var(--c-text)]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100">{t('wellness.health.howAreYou')}</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                {moodSaved ? t('wellness.health.moodLoggedToday') : t('wellness.health.logMoodToTrack')}
              </p>
            </div>
          </div>
          {moodStreak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-full w-fit">
              <span className="text-base sm:text-lg">🔥</span>
              <span className="text-xs sm:text-sm font-bold text-orange-700 dark:text-orange-400">{moodStreak} {t('wellness.health.days')}</span>
            </div>
          )}
        </div>

        {/* Mood Selection */}
        <div className="grid grid-cols-5 gap-2 sm:flex sm:flex-wrap sm:gap-3 mb-4">
          {moodOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleMoodSelect(option.value)}
              disabled={isSavingMood}
              className={cn(
                "flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-4 py-2 sm:py-3 rounded-xl border-2 transition-all duration-200",
                currentMood === option.value
                  ? `${option.bgColor} border-current ring-2 ring-offset-2 dark:ring-offset-stone-900 ${option.color.replace('text-', 'ring-')}`
                  : "bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500"
              )}
            >
              <span className="text-2xl sm:text-3xl">{option.icon}</span>
              <span className={cn(
                "text-[10px] sm:text-xs font-medium text-center",
                currentMood === option.value ? option.color : "text-gray-600 dark:text-gray-300"
              )}>
                {option.label}
              </span>
              {currentMood === option.value && moodSaved && (
                <Check className="w-4 h-4 text-[var(--c-solid)] dark:text-[var(--c-text)] absolute -top-1 -right-1" />
              )}
            </button>
          ))}
        </div>

        {/* Mood saved confirmation */}
        {moodSaved && selectedMoodOption && (
          <div className={cn(
            "flex items-center justify-between p-3 rounded-lg",
            selectedMoodOption.bgColor.split(' ')[0]
          )}>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[var(--c-solid)] dark:text-[var(--c-text)]" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {t('wellness.health.moodLogged')} {selectedMoodOption.label}
              </span>
            </div>
            {!showNoteInput && (
              <button
                onClick={() => setShowNoteInput(true)}
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 underline"
              >
                {t('wellness.health.addNote')}
              </button>
            )}
          </div>
        )}

        {/* Optional note */}
        {showNoteInput && (
          <div className="mt-3">
            <textarea
              value={moodNote}
              onChange={(e) => setMoodNote(e.target.value)}
              placeholder={t('wellness.health.notePlaceholder')}
              className="w-full p-3 rounded-lg border bg-white dark:bg-stone-700 border-stone-200 dark:border-stone-600 focus:border-[var(--c-solid)] dark:focus:border-[var(--c-solid)]/60 focus:ring-2 focus:ring-[var(--c-accent)] dark:focus:ring-[var(--c-solid)] resize-none text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              rows={2}
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNoteInput(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                onClick={handleSaveMoodNote}
                disabled={isSavingMood}
              >
                {isSavingMood ? <Loader2 className="w-4 h-4 animate-spin" /> : t('wellness.health.saveNote')}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Daily Quote */}
      <Card className="p-5 bg-gradient-to-br from-[var(--c-bg)] to-[var(--c-bg)] dark:from-[var(--c-bg)]/30 dark:to-[var(--c-bg)]/30 border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50">
        <div className="flex items-start gap-4">
          <Quote className="w-6 h-6 text-[var(--c-solid)] dark:text-[var(--c-solid)] flex-shrink-0" />
          <div>
            <p className="text-base font-medium text-[var(--c-text)] dark:text-[var(--c-text)] italic">
              "{quote.text}"
            </p>
            <p className="text-sm text-[var(--c-text)] dark:text-[var(--c-text)] mt-1">— {quote.author}</p>
          </div>
        </div>
      </Card>

      {/* Daily Activities */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('wellness.health.dailyActivities')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('wellness.health.xOfYCompleted', { completed: completedCount, total: activities.length })}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" />
          </div>
        </div>

        <div className="space-y-2">
          {activities.map((activity) => {
            const Icon = activity.icon
            return (
              <button
                key={activity.id}
                onClick={() => toggleActivity(activity.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                  activity.completed
                    ? "bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50"
                    : "bg-white dark:bg-stone-700 border-stone-200 dark:border-stone-600 hover:border-[var(--c-accent)] dark:hover:border-[var(--c-solid)]"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center",
                  activity.completed ? "bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40" : "bg-stone-100 dark:bg-stone-600"
                )}>
                  {activity.completed ? (
                    <CheckCircle className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" />
                  ) : (
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  )}
                </div>
                <span className={cn(
                  "flex-1 text-left font-medium text-sm",
                  activity.completed ? "text-[var(--c-text)] dark:text-[var(--c-text)] line-through" : "text-gray-700 dark:text-gray-200"
                )}>
                  {activity.title}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Wellness Tips */}
      <div className="grid gap-3 md:grid-cols-2">
        {wellnessTips.map((tip) => {
          const Icon = tip.icon
          return (
            <Card key={tip.id} className="p-4 hover:shadow-md transition-shadow bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
              <div className="flex items-start gap-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", tip.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-0.5">{tip.title}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{tip.description}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Reflection */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-3 mb-4">
          <PenLine className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('wellness.health.dailyReflection')}</h3>
        </div>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder={t('wellness.health.reflectionPlaceholder')}
          className="w-full h-24 p-4 rounded-xl border bg-white dark:bg-stone-700 border-stone-200 dark:border-stone-600 focus:border-[var(--c-solid)] dark:focus:border-[var(--c-solid)]/60 focus:ring-2 focus:ring-[var(--c-accent)] dark:focus:ring-[var(--c-solid)] resize-none text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
        <div className="flex justify-end mt-3">
          <Button
            onClick={saveReflection}
            disabled={!reflection.trim() || isSaving}
            size="sm"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('wellness.health.saveReflection')}
          </Button>
        </div>

        {savedReflections.length > 0 && (
          <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t('wellness.health.previousReflections')}</p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {savedReflections.slice(-3).reverse().map((r, i) => (
                <div key={i} className="p-3 bg-stone-50 dark:bg-stone-700 rounded-lg text-sm text-gray-600 dark:text-gray-300">
                  {r}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
