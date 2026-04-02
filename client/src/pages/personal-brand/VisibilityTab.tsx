/**
 * Visibility Tab - Increase your digital presence
 * Features: Strategy tracking, content calendar, progress sync
 */
import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Eye,
  Linkedin,
  Globe,
  MessageSquare,
  TrendingUp,
  CheckCircle,
  ExternalLink,
  Lightbulb,
  Calendar,
  Plus,
  Play,
  Pause,
  SkipForward,
  Clock,
  Target,
  Loader2,
  RefreshCw,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  Save
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { personalBrandApi, type VisibilityProgressItem, type ContentCalendarItem } from '@/services/cloudStorage'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addDays, startOfWeek, isToday, isSameDay, parseISO } from 'date-fns'
import { sv } from 'date-fns/locale'

interface VisibilityStrategy {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  impact: 'low' | 'medium' | 'high'
  timePerWeek: string
  category: 'content' | 'engagement' | 'networking' | 'platform'
}

const VISIBILITY_STRATEGIES: VisibilityStrategy[] = [
  {
    id: 'linkedin-engage',
    title: 'Engagera dig på LinkedIn',
    description: 'Kommentera och gilla andras inlägg regelbundet. Det ökar din synlighet i flödet.',
    difficulty: 'easy',
    impact: 'medium',
    timePerWeek: '15 min/dag',
    category: 'engagement'
  },
  {
    id: 'share-articles',
    title: 'Dela branschartiklar',
    description: 'Dela intressanta artiklar med en egen reflektion. Visar att du håller dig uppdaterad.',
    difficulty: 'easy',
    impact: 'medium',
    timePerWeek: '30 min/vecka',
    category: 'content'
  },
  {
    id: 'write-posts',
    title: 'Skriv egna inlägg',
    description: 'Dela dina erfarenheter, insikter eller lärdomar. Positionerar dig som expert.',
    difficulty: 'medium',
    impact: 'high',
    timePerWeek: '1-2 tim/vecka',
    category: 'content'
  },
  {
    id: 'join-groups',
    title: 'Delta i LinkedIn-grupper',
    description: 'Gå med i relevanta grupper och delta aktivt i diskussioner.',
    difficulty: 'easy',
    impact: 'low',
    timePerWeek: '30 min/vecka',
    category: 'engagement'
  },
  {
    id: 'speak-events',
    title: 'Tala på event/meetups',
    description: 'Presentera på branschevent eller meetups. Stor synlighet och nätverkande.',
    difficulty: 'hard',
    impact: 'high',
    timePerWeek: 'Varierar',
    category: 'networking'
  },
  {
    id: 'write-articles',
    title: 'Skriv LinkedIn-artiklar',
    description: 'Längre artiklar indexeras i Google och visar djup expertis.',
    difficulty: 'hard',
    impact: 'high',
    timePerWeek: '2-4 tim/månad',
    category: 'content'
  },
  {
    id: 'podcast-guest',
    title: 'Gästa poddar',
    description: 'Kontakta relevanta poddar och erbjud dig som gäst i ditt expertområde.',
    difficulty: 'hard',
    impact: 'high',
    timePerWeek: 'Varierar',
    category: 'networking'
  },
  {
    id: 'personal-website',
    title: 'Skapa egen hemsida',
    description: 'En enkel portfoliosida eller blogg som du kontrollerar helt själv.',
    difficulty: 'medium',
    impact: 'medium',
    timePerWeek: 'Engångs + underhåll',
    category: 'platform'
  },
]

const CONTENT_IDEAS = [
  'Dela ett misstag du lärt dig av',
  'Berätta om ett projekt du är stolt över',
  'Förklara något komplext på ett enkelt sätt',
  'Ge tips till din yngre själv',
  'Kommentera en branschtrend',
  'Gratulera en kollega publikt',
  'Dela en bok eller resurs du gillar',
  'Ställ en fråga till ditt nätverk',
  'Berätta om din karriärresa',
  'Ge din syn på en aktuell nyhet',
  'Dela en "behind the scenes" från ditt arbete',
  'Tacka någon som hjälpt dig',
]

const CATEGORIES = {
  content: { label: 'Innehåll', color: 'violet' },
  engagement: { label: 'Engagemang', color: 'blue' },
  networking: { label: 'Nätverkande', color: 'emerald' },
  platform: { label: 'Plattform', color: 'amber' }
}

export default function VisibilityTab() {
  const [progress, setProgress] = useState<VisibilityProgressItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [contentIdea, setContentIdea] = useState(CONTENT_IDEAS[Math.floor(Math.random() * CONTENT_IDEAS.length)])

  // Content calendar state
  const [calendarItems, setCalendarItems] = useState<ContentCalendarItem[]>([])
  const [showCalendarForm, setShowCalendarForm] = useState(false)
  const [calendarForm, setCalendarForm] = useState({
    title: '',
    content: '',
    platform: 'linkedin' as ContentCalendarItem['platform'],
    scheduled_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'draft' as ContentCalendarItem['status']
  })

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [progressData, calendarData] = await Promise.all([
        personalBrandApi.getVisibilityProgress(),
        personalBrandApi.getContentCalendar()
      ])
      setProgress(progressData)
      setCalendarItems(calendarData)
    } finally {
      setIsLoading(false)
    }
  }

  const updateStrategyStatus = async (strategyId: string, status: VisibilityProgressItem['status']) => {
    const item: VisibilityProgressItem = {
      strategy_id: strategyId,
      status,
      started_at: status === 'in_progress' ? new Date().toISOString() : undefined,
      completed_at: status === 'completed' ? new Date().toISOString() : undefined
    }
    await personalBrandApi.updateVisibilityProgress(item)
    await loadData()
  }

  const getStrategyProgress = (strategyId: string) => {
    return progress.find(p => p.strategy_id === strategyId)?.status || 'not_started'
  }

  const filteredStrategies = selectedCategory
    ? VISIBILITY_STRATEGIES.filter(s => s.category === selectedCategory)
    : VISIBILITY_STRATEGIES

  const completedCount = progress.filter(p => p.status === 'completed').length
  const inProgressCount = progress.filter(p => p.status === 'in_progress').length

  const refreshIdea = () => {
    let newIdea = contentIdea
    while (newIdea === contentIdea) {
      newIdea = CONTENT_IDEAS[Math.floor(Math.random() * CONTENT_IDEAS.length)]
    }
    setContentIdea(newIdea)
  }

  const saveCalendarItem = async () => {
    if (!calendarForm.title.trim()) return

    await personalBrandApi.addContentItem({
      ...calendarForm,
      tags: []
    })

    setShowCalendarForm(false)
    setCalendarForm({
      title: '',
      content: '',
      platform: 'linkedin',
      scheduled_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'draft'
    })
    await loadData()
  }

  const deleteCalendarItem = async (id: string) => {
    if (!confirm('Ta bort detta inlägg?')) return
    await personalBrandApi.deleteContentItem(id)
    await loadData()
  }

  // Generate week view for calendar
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-12"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" aria-hidden="true" />
        <span className="sr-only">Laddar synlighetsöversikt...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center shrink-0">
            <Eye className="w-6 h-6 text-cyan-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">Öka din synlighet</h2>
            <p className="text-slate-600 mt-1">
              Strategier för att bli mer synlig för rekryterare och potentiella arbetsgivare.
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-cyan-600">{completedCount}/{VISIBILITY_STRATEGIES.length}</p>
            <p className="text-xs text-slate-500">strategier klara</p>
          </div>
        </div>
      </Card>

      {/* Content idea generator */}
      <Card className="border-violet-200 bg-gradient-to-br from-violet-50/50 to-purple-50/50">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-violet-900">Idé för nästa inlägg</p>
            <p className="text-violet-700 mt-1 text-lg">{contentIdea}</p>
            <div className="flex gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-violet-600"
                onClick={refreshIdea}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Ny idé
              </Button>
              <Link to="/linkedin-optimizer">
                <Button variant="ghost" size="sm" className="text-violet-600">
                  <Edit2 className="w-4 h-4 mr-1" />
                  Skapa inlägg
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Mini content calendar */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-600" />
            Innehållskalender
          </h3>
          <Button size="sm" variant="outline" onClick={() => setShowCalendarForm(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Planera inlägg
          </Button>
        </div>

        {/* Week view */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map((day) => {
            const dayItems = calendarItems.filter(item =>
              isSameDay(parseISO(item.scheduled_date), day)
            )
            const isCurrentDay = isToday(day)

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "p-2 rounded-lg border min-h-[80px]",
                  isCurrentDay ? "border-cyan-300 bg-cyan-50" : "border-slate-200"
                )}
              >
                <p className={cn(
                  "text-xs font-medium mb-1",
                  isCurrentDay ? "text-cyan-700" : "text-slate-500"
                )}>
                  {format(day, 'EEE d', { locale: sv })}
                </p>
                {dayItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "text-xs p-1 rounded mb-1 truncate",
                      item.platform === 'linkedin' && "bg-blue-100 text-blue-700",
                      item.platform === 'twitter' && "bg-sky-100 text-sky-700",
                      item.platform === 'blog' && "bg-violet-100 text-violet-700",
                      item.platform === 'other' && "bg-slate-100 text-slate-700"
                    )}
                    title={item.title}
                  >
                    {item.title}
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {/* Calendar form */}
        <AnimatePresence>
          {showCalendarForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-slate-100 pt-4 mt-4"
            >
              <div className="space-y-3">
                <input
                  type="text"
                  value={calendarForm.title}
                  onChange={(e) => setCalendarForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="Vad ska du posta?"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={calendarForm.platform}
                    onChange={(e) => setCalendarForm(prev => ({ ...prev, platform: e.target.value as ContentCalendarItem['platform'] }))}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">Twitter/X</option>
                    <option value="blog">Blogg</option>
                    <option value="other">Annat</option>
                  </select>
                  <input
                    type="date"
                    value={calendarForm.scheduled_date}
                    onChange={(e) => setCalendarForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveCalendarItem} disabled={!calendarForm.title.trim()}>
                    <Save className="w-4 h-4 mr-1" />
                    Spara
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowCalendarForm(false)}>
                    Avbryt
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            !selectedCategory ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          Alla ({VISIBILITY_STRATEGIES.length})
        </button>
        {Object.entries(CATEGORIES).map(([key, cat]) => {
          const count = VISIBILITY_STRATEGIES.filter(s => s.category === key).length
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                selectedCategory === key
                  ? cn(
                    cat.color === 'violet' && "bg-violet-600 text-white",
                    cat.color === 'blue' && "bg-blue-600 text-white",
                    cat.color === 'emerald' && "bg-emerald-600 text-white",
                    cat.color === 'amber' && "bg-amber-600 text-white"
                  )
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {cat.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Strategies list */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-600" />
          Strategier för synlighet
        </h3>

        <div className="space-y-3">
          {filteredStrategies.map((strategy) => {
            const status = getStrategyProgress(strategy.id)

            return (
              <div
                key={strategy.id}
                className={cn(
                  "p-4 rounded-xl border transition-all",
                  status === 'completed' && "bg-emerald-50 border-emerald-200",
                  status === 'in_progress' && "bg-blue-50 border-blue-200",
                  status === 'skipped' && "opacity-50",
                  status === 'not_started' && "border-slate-100 hover:border-slate-200"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-slate-900">{strategy.title}</h4>
                      {status === 'completed' && (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      )}
                      {status === 'in_progress' && (
                        <Play className="w-4 h-4 text-blue-600 fill-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{strategy.description}</p>

                    <div className="flex items-center gap-4 mt-3">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        strategy.difficulty === 'easy' && "bg-emerald-100 text-emerald-700",
                        strategy.difficulty === 'medium' && "bg-amber-100 text-amber-700",
                        strategy.difficulty === 'hard' && "bg-rose-100 text-rose-700"
                      )}>
                        {strategy.difficulty === 'easy' ? 'Lätt' : strategy.difficulty === 'medium' ? 'Medel' : 'Avancerat'}
                      </span>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        strategy.impact === 'low' && "bg-slate-100 text-slate-600",
                        strategy.impact === 'medium' && "bg-blue-100 text-blue-700",
                        strategy.impact === 'high' && "bg-violet-100 text-violet-700"
                      )}>
                        {strategy.impact === 'low' ? 'Låg' : strategy.impact === 'medium' ? 'Medel' : 'Hög'} påverkan
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {strategy.timePerWeek}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1 ml-4">
                    {status === 'not_started' && (
                      <>
                        <button
                          onClick={() => updateStrategyStatus(strategy.id, 'in_progress')}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Starta"
                        >
                          <Play className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => updateStrategyStatus(strategy.id, 'skipped')}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Hoppa över"
                        >
                          <SkipForward className="w-4 h-4 text-slate-400" />
                        </button>
                      </>
                    )}
                    {status === 'in_progress' && (
                      <>
                        <button
                          onClick={() => updateStrategyStatus(strategy.id, 'completed')}
                          className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                          title="Markera som klar"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        </button>
                        <button
                          onClick={() => updateStrategyStatus(strategy.id, 'not_started')}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Pausa"
                        >
                          <Pause className="w-4 h-4 text-slate-400" />
                        </button>
                      </>
                    )}
                    {status === 'completed' && (
                      <button
                        onClick={() => updateStrategyStatus(strategy.id, 'not_started')}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Återställ"
                      >
                        <RefreshCw className="w-4 h-4 text-slate-400" />
                      </button>
                    )}
                    {status === 'skipped' && (
                      <button
                        onClick={() => updateStrategyStatus(strategy.id, 'not_started')}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Återställ"
                      >
                        <RefreshCw className="w-4 h-4 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* LinkedIn Quick Wins */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Linkedin className="w-5 h-5 text-blue-600" />
          LinkedIn Quick Wins
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { title: 'Rubrik med keywords', desc: 'Inkludera jobbtitlar du söker' },
            { title: 'Aktivera "Open to Work"', desc: 'Kan vara synligt endast för rekryterare' },
            { title: 'Be om rekommendationer', desc: 'Från chefer och kollegor' },
            { title: 'Aktivera Creator Mode', desc: 'Om du planerar dela innehåll regelbundet' }
          ].map((tip, idx) => (
            <div key={idx} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 text-sm">{tip.title}</p>
                <p className="text-xs text-blue-700">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <Link
            to="/linkedin-optimizer"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Öppna LinkedIn-optimeraren
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </Card>

      {/* Weekly plan */}
      <Card className="bg-emerald-50 border-emerald-100">
        <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          Veckoprogramförslag (30 min/dag)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {[
            { day: 'Måndag', task: 'Engagera på 10 inlägg' },
            { day: 'Tisdag', task: 'Dela en artikel' },
            { day: 'Onsdag', task: 'Kommentera i grupper' },
            { day: 'Torsdag', task: 'Skriv eget inlägg' },
            { day: 'Fredag', task: 'Skicka 3 kontaktförfrågningar' }
          ].map(({ day, task }) => (
            <div key={day} className="p-3 bg-white rounded-lg border border-emerald-100">
              <p className="font-medium text-emerald-800 text-sm">{day}</p>
              <p className="text-xs text-emerald-600 mt-1">{task}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
