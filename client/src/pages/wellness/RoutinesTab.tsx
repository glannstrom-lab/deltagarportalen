/**
 * Routines Tab - Build sustainable daily routines
 *
 * 2026-10-09: fliken sparade ingenting — allt låg i useState och försvann vid
 * omladdning, en av standardrutinerna stod förbockad som klar, och
 * timerknappen räknade sekunder som aldrig visades. Nu sparas rutinerna i
 * webbläsaren (per konto), bockarna gäller bara i dag och nollas nästa dag,
 * och timerknappen är borttagen. Molnsparning kräver en ny tabell (migration
 * mot prod = Mikaels ja) — tills dess säger sidan att listan sparas på den
 * här enheten.
 */
import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, Reorder, MotionConfig } from 'framer-motion'
import {
  CalendarDays, Clock, Sun, Moon, Coffee, Briefcase,
  Plus, Trash2, CheckCircle2, GripVertical
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { formatLocalDate } from '@/services/aktivitetSchema'
import {
  type IkonId, type SparadRutin, type Sparat,
  VARDAGAR, ALLA_DAGAR, lasRutiner, rutinNyckel, sparaRutiner,
} from './rutinLagring'

const IKONER: Record<IkonId, React.ElementType> = { sun: Sun, briefcase: Briefcase, coffee: Coffee, moon: Moon, calendar: CalendarDays }

const SUGGESTIONS = [
  { titleKey: 'wellness.routines.suggestions.morningStretch', time: '07:30', icon: Sun, descKey: 'wellness.routines.suggestions.morningStretchDesc' },
  { titleKey: 'wellness.routines.suggestions.lunchWalk', time: '12:00', icon: Coffee, descKey: 'wellness.routines.suggestions.lunchWalkDesc' },
  { titleKey: 'wellness.routines.suggestions.weeklyReview', time: '18:00', icon: CalendarDays, descKey: 'wellness.routines.suggestions.weeklyReviewDesc' },
]

const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

export default function RoutinesTab() {
  const { t } = useTranslation()
  const uid = useAuthStore((s) => s.profile?.id)
  const nyckel = rutinNyckel(uid)
  const idag = formatLocalDate(new Date())

  // Build translated days of week
  const daysOfWeek = useMemo(() => dayKeys.map(k => t(`wellness.routines.days.${k}`)), [t])

  const [sparat, setSparat] = useState<Sparat>(() => lasRutiner(nyckel, idag))
  const [lastNyckel, setLastNyckel] = useState(nyckel)
  if (lastNyckel !== nyckel) {
    // Profilen laddades efter första renderingen — läs rätt kontos lista.
    setLastNyckel(nyckel)
    setSparat(lasRutiner(nyckel, idag))
  }

  useEffect(() => {
    sparaRutiner(nyckel, sparat)
  }, [nyckel, sparat])

  const routines = sparat.rutiner.map((r) => ({
    ...r,
    title: r.title ?? t(r.titleKey ?? ''),
    completed: sparat.klara.datum === idag && sparat.klara.ids.includes(r.id),
  }))

  const [isAdding, setIsAdding] = useState(false)
  const [newRoutine, setNewRoutine] = useState({ title: '', time: '09:00' })

  const toggleRoutine = (id: string) => {
    setSparat((prev) => {
      const ids = prev.klara.datum === idag ? prev.klara.ids : []
      return { ...prev, klara: { datum: idag, ids: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id] } }
    })
  }

  const addRoutine = () => {
    if (!newRoutine.title.trim()) return
    const routine: SparadRutin = {
      id: Date.now().toString(),
      title: newRoutine.title.trim(),
      time: newRoutine.time,
      ikon: 'briefcase',
      days: VARDAGAR,
    }
    setSparat((prev) => ({ ...prev, rutiner: [...prev.rutiner, routine] }))
    setNewRoutine({ title: '', time: '09:00' })
    setIsAdding(false)
  }

  const deleteRoutine = (id: string) => {
    setSparat((prev) => ({
      rutiner: prev.rutiner.filter((r) => r.id !== id),
      klara: { ...prev.klara, ids: prev.klara.ids.filter((x) => x !== id) },
    }))
  }

  const sorteraOm = (ny: typeof routines) => {
    setSparat((prev) => ({
      ...prev,
      rutiner: ny
        .map((r) => prev.rutiner.find((p) => p.id === r.id))
        .filter((r): r is SparadRutin => !!r),
    }))
  }

  const completedToday = routines.filter(r => r.completed).length
  const completionPercentage = routines.length ? Math.round((completedToday / routines.length) * 100) : 0

  return (
    <MotionConfig reducedMotion="user">
    <div className="space-y-6">
      {/* Dagens läge — EN rad och en stapel (designpasset 2026-10-09).
          Här stod tidigare två kort: "1/4 · Andel 25 %" (samma tal två gånger)
          och "Bästa serie 12 dagar i rad" — ett hårdkodat tal som inte mätte
          något, och en streak-räknare som DESIGN.md §1 förbjuder. Raderna
          hade likaså påhittade serier (5/8/3/12). Lägg inte tillbaka dem. */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {t('wellness.routines.todayLine', '{{klara}} av {{totalt}} rutiner klara i dag', { klara: completedToday, totalt: routines.length })}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-300">{completionPercentage}%</span>
        </div>
        <div className="h-3 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden" aria-hidden="true">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-[var(--c-solid)]"
          />
        </div>
      </div>

      {/* Weekly Calendar */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('wellness.routines.weekOverview')}</h3>
        <div className="grid grid-cols-7 gap-2">
          {daysOfWeek.map((day, index) => (
            <div key={day} className="text-center">
              <div className={`p-3 rounded-xl border-2 ${
                index < 5
                  ? 'border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30'
                  : 'border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700'
              }`}>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{day}</span>
                <div className="mt-2 flex justify-center gap-0.5" aria-hidden="true">
                  {routines.filter(r => r.days.includes(ALLA_DAGAR[index])).map((r) => (
                    <div key={r.id} className="w-1.5 h-1.5 rounded-full bg-[var(--c-solid)]/80 dark:bg-[var(--c-solid)]" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Routines List with Reordering */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('wellness.routines.yourRoutines')}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300">{t('wellness.routines.savedOnDevice', 'Sparas på den här enheten. Bockarna börjar om varje dag.')}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-1" aria-hidden="true" />
            {t('wellness.routines.add')}
          </Button>
        </div>

        <Reorder.Group
          axis="y"
          values={routines}
          onReorder={sorteraOm}
          className="space-y-3"
        >
          {routines.map((routine) => {
            const Icon = IKONER[routine.ikon]

            return (
              <Reorder.Item
                key={routine.id}
                value={routine}
              >
                <motion.div
                  layout
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-grab active:cursor-grabbing',
                    routine.completed
                      ? 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50'
                      : 'bg-white dark:bg-stone-700 border-stone-200 dark:border-stone-600 hover:border-[var(--c-accent)] dark:hover:border-[var(--c-solid)]'
                  )}
                >
                  <GripVertical className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" aria-hidden="true" />

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleRoutine(routine.id)}
                    aria-pressed={routine.completed}
                    aria-label={t('wellness.routines.markDone', 'Klar i dag: {{namn}}', { namn: routine.title })}
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0',
                      routine.completed ? 'bg-[var(--c-solid)] dark:bg-[var(--c-solid)]' : 'bg-stone-100 dark:bg-stone-600 hover:bg-stone-200 dark:hover:bg-stone-500'
                    )}
                  >
                    <CheckCircle2 className={cn('w-5 h-5', routine.completed ? 'text-white' : 'text-gray-600 dark:text-gray-300')} aria-hidden="true" />
                  </motion.button>

                  <div className="w-8 h-8 rounded-lg bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[var(--c-text)] dark:text-[var(--c-text)]" aria-hidden="true" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className={cn('font-medium', routine.completed ? 'text-[var(--c-text)] dark:text-[var(--c-text)] line-through' : 'text-gray-800 dark:text-gray-100')}>
                      {routine.title}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mt-1">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      {routine.time}
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => deleteRoutine(routine.id)}
                    aria-label={t('wellness.routines.remove', 'Ta bort {{namn}}', { namn: routine.title })}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </motion.button>
                </motion.div>
              </Reorder.Item>
            )
          })}
        </Reorder.Group>

        {/* Add new routine form */}
        {isAdding && (
          <div className="mt-4 p-4 bg-stone-50 dark:bg-stone-700 rounded-xl border border-stone-200 dark:border-stone-600">
            <div className="flex gap-3">
              <input
                type="text"
                aria-label={t('wellness.routines.routineNamePlaceholder')}
                value={newRoutine.title}
                onChange={(e) => setNewRoutine(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t('wellness.routines.routineNamePlaceholder')}
                className="flex-1 px-3 py-2 rounded-lg border bg-white dark:bg-stone-600 border-stone-200 dark:border-stone-500 focus:border-[var(--c-solid)] dark:focus:border-[var(--c-solid)]/60 focus:ring-2 focus:ring-[var(--c-accent)] dark:focus:ring-[var(--c-solid)] text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <input
                type="time"
                aria-label={t('wellness.routines.timeLabel')}
                value={newRoutine.time}
                onChange={(e) => setNewRoutine(prev => ({ ...prev, time: e.target.value }))}
                className="px-3 py-2 rounded-lg border bg-white dark:bg-stone-600 border-stone-200 dark:border-stone-500 text-gray-800 dark:text-gray-100"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={addRoutine}>{t('common.save')}</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>{t('common.cancel')}</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Suggested Routines - Templates */}
      <Card className="p-6 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('wellness.routines.suggestedRoutines')}</h3>
        <div className="space-y-2">
          {SUGGESTIONS.map((suggestion) => {
            const title = t(suggestion.titleKey)
            const desc = t(suggestion.descKey)
            const Icon = suggestion.icon
            return (
              <motion.button
                key={suggestion.titleKey}
                whileHover={{ x: 4 }}
                onClick={() => {
                  setNewRoutine({ title, time: suggestion.time })
                  setIsAdding(true)
                }}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-[var(--c-accent)] dark:border-[var(--c-solid)] hover:border-[var(--c-solid)]/60 dark:hover:border-[var(--c-solid)] hover:bg-white dark:hover:bg-stone-800 transition-all text-left"
              >
                <Icon className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)] flex-shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 dark:text-gray-100">{title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{suggestion.time} • {desc}</p>
                </div>
                <Plus className="w-4 h-4 text-[var(--c-text)] dark:text-[var(--c-text)] flex-shrink-0" aria-hidden="true" />
              </motion.button>
            )
          })}
        </div>
      </Card>

      {/* "Rutinmallar" (morgon/kväll) är borttagna 2026-10-09: korten såg
          klickbara ut (cursor-pointer, hover) men hade ingen onClick alls. */}
    </div>
    </MotionConfig>
  )
}
