import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, Flag, Calendar, Target, Sparkles, RefreshCw, CheckCircle, Clock, Download, BookMarked, AlertCircle, TrendingUp, CheckSquare, Zap, Send } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui'
import { callAI } from '@/services/aiApi'

interface Milestone {
  id: string
  title: string
  month: number
  status: 'planerad' | 'pågår' | 'slutförd'
  tasks: Task[]
  metrics: string
}

interface Task {
  id: string
  description: string
  completed: boolean
  dueDate: string
}

export default function CareerPlan() {
  const { t, i18n } = useTranslation()
  const [nuvarande, setNuvarande] = useState('')
  const [mal, setMal] = useState('')
  const [tidsram, setTidsram] = useState('6 månader')
  const [hinder, setHinder] = useState('')
  const [plan, setPlan] = useState<Milestone[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())
  const [showCheckIns, setShowCheckIns] = useState(false)

  const skapaPlan = async () => {
    if (!nuvarande.trim() || !mal.trim()) return

    setIsLoading(true)
    try {
      const data = await callAI<{ plan: string }>('karriarplan', { nuvarande, mal, tidsram, hinder })
      setPlan(parsePlan((data as { plan?: string }).plan || ''))
    } catch (error) {
      setPlan(generateFallbackPlan(tidsram))
    } finally {
      setIsLoading(false)
    }
  }

  const generateFallbackPlan = (timeframe: string): Milestone[] => {
    const months = timeframe.includes('3') ? 3 : timeframe.includes('12') ? 12 : 6
    return [
      {
        id: '1',
        title: t('careerPlan.fallback.milestone1.title'),
        month: 1,
        status: 'planerad',
        tasks: [
          { id: '1-1', description: t('careerPlan.fallback.milestone1.task1'), completed: false, dueDate: t('careerPlan.fallback.week', { week: 1 }) },
          { id: '1-2', description: t('careerPlan.fallback.milestone1.task2'), completed: false, dueDate: t('careerPlan.fallback.week', { week: 2 }) },
          { id: '1-3', description: t('careerPlan.fallback.milestone1.task3'), completed: false, dueDate: t('careerPlan.fallback.week', { week: 2 }) }
        ],
        metrics: t('careerPlan.fallback.milestone1.metrics')
      },
      {
        id: '2',
        title: t('careerPlan.fallback.milestone2.title'),
        month: Math.ceil(months / 2),
        status: 'planerad',
        tasks: [
          { id: '2-1', description: t('careerPlan.fallback.milestone2.task1'), completed: false, dueDate: t('careerPlan.fallback.weekRange', { start: 3, end: Math.ceil(months / 2) * 2 }) },
          { id: '2-2', description: t('careerPlan.fallback.milestone2.task2'), completed: false, dueDate: t('careerPlan.fallback.weekRange', { start: 3, end: Math.ceil(months / 2) * 2 }) },
          { id: '2-3', description: t('careerPlan.fallback.milestone2.task3'), completed: false, dueDate: t('careerPlan.fallback.everyThursday') }
        ],
        metrics: t('careerPlan.fallback.milestone2.metrics')
      },
      {
        id: '3',
        title: t('careerPlan.fallback.milestone3.title'),
        month: months,
        status: 'planerad',
        tasks: [
          { id: '3-1', description: t('careerPlan.fallback.milestone3.task1'), completed: false, dueDate: t('careerPlan.fallback.week', { week: Math.ceil(months / 2) + 1 }) },
          { id: '3-2', description: t('careerPlan.fallback.milestone3.task2'), completed: false, dueDate: t('careerPlan.fallback.week', { week: Math.ceil(months / 2) + 2 }) },
          { id: '3-3', description: t('careerPlan.fallback.milestone3.task3'), completed: false, dueDate: t('careerPlan.fallback.week', { week: months * 4 }) }
        ],
        metrics: t('careerPlan.fallback.milestone3.metrics')
      }
    ]
  }

  const parsePlan = (text: string): Milestone[] => {
    return generateFallbackPlan(tidsram)
  }

  const toggleTask = (taskId: string) => {
    const newCompleted = new Set(completedTasks)
    if (newCompleted.has(taskId)) {
      newCompleted.delete(taskId)
    } else {
      newCompleted.add(taskId)
    }
    setCompletedTasks(newCompleted)
  }

  const downloadPlan = () => {
    if (!plan) return

    const dateLocale = i18n.language === 'sv' ? 'sv-SE' : 'en-US'
    const statusLabel = (status: string) => {
      if (status === 'planerad') return t('careerPlan.status.planned')
      if (status === 'pågår') return t('careerPlan.status.inProgress')
      return t('careerPlan.status.completed')
    }

    const content = `${t('careerPlan.download.title')}
${t('careerPlan.download.created')}: ${new Date().toLocaleDateString(dateLocale)}
${t('careerPlan.download.timeframe')}: ${tidsram}

${t('careerPlan.download.currentPosition')}:
${nuvarande}

${t('careerPlan.download.targetPosition')}:
${mal}

${t('careerPlan.download.obstacles')}:
${hinder || t('careerPlan.download.noneSpecified')}

--- ${t('careerPlan.download.milestonesSection')} ---

${plan.map((milestone, idx) => `
${t('careerPlan.download.milestone')} ${idx + 1}: ${milestone.title}
${t('careerPlan.download.monthLabel')}: ${milestone.month}
${t('careerPlan.download.statusLabel')}: ${statusLabel(milestone.status)}

${t('careerPlan.download.tasks')}:
${milestone.tasks.map(task => `  ☐ ${task.description} (${task.dueDate})`).join('\n')}

${t('careerPlan.result.successMetrics')}: ${milestone.metrics}
`).join('\n')}

--- ${t('careerPlan.download.checkupSchedule')} ---
- ${t('careerPlan.download.weeklyCheckup')}
- ${t('careerPlan.download.monthlyCheckup')}
- ${t('careerPlan.download.quarterlyCheckup')}`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${t('careerPlan.download.filename')}-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
  }

  const progressPercent = plan ? (completedTasks.size / plan.reduce((sum, m) => sum + m.tasks.length, 0)) * 100 : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900 dark:to-brand-900 mb-2">
          <MapPin className="w-7 h-7 text-brand-900 dark:text-brand-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('careerPlan.title')}</h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {t('careerPlan.description')}
        </p>
      </div>

      {/* Input Form */}
      {!plan && (
        <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                {t('careerPlan.whereAreYou')}
              </label>
              <textarea
                value={nuvarande}
                onChange={(e) => setNuvarande(e.target.value)}
                placeholder={t('careerPlan.whereAreYouPlaceholder')}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 focus:border-brand-700 dark:focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 outline-none resize-y text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Flag className="w-4 h-4 text-brand-700 dark:text-brand-400" />
                {t('careerPlan.whereToGo')}
              </label>
              <textarea
                value={mal}
                onChange={(e) => setMal(e.target.value)}
                placeholder={t('careerPlan.whereToGoPlaceholder')}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 focus:border-brand-700 dark:focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 outline-none resize-y text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  {t('careerPlan.timeline')}
                </label>
                <select
                  value={tidsram}
                  onChange={(e) => setTidsram(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 focus:border-brand-700 dark:focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 outline-none text-gray-800 dark:text-gray-100"
                >
                  <option value="3 månader">{t('careerPlan.timeframes.3months')}</option>
                  <option value="6 månader">{t('careerPlan.timeframes.6months')}</option>
                  <option value="12 månader">{t('careerPlan.timeframes.12months')}</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Target className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  {t('careerPlan.obstacles')}
                </label>
                <input
                  type="text"
                  value={hinder}
                  onChange={(e) => setHinder(e.target.value)}
                  placeholder={t('careerPlan.obstaclesPlaceholder')}
                  className="w-full px-4 py-3 rounded-lg border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 focus:border-brand-700 dark:focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>

            <Button
              onClick={skapaPlan}
              disabled={!nuvarande.trim() || !mal.trim() || isLoading}
              className="w-full bg-gradient-to-r from-brand-700 to-brand-900 dark:from-brand-900 dark:to-brand-900"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  {t('careerPlan.createPlan')}
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Timeline Visualization */}
      {plan && (
        <>
          {/* Plan Header */}
          <Card className="p-6 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-900/30 border-brand-200 dark:border-brand-900">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-brand-900 dark:text-brand-400" />
                {t('careerPlan.result.title')}
              </h2>
              <Button variant="outline" size="sm" onClick={downloadPlan}>
                <Download className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress Overview */}
            <div className="bg-white dark:bg-stone-800 p-4 rounded-lg border border-brand-100 dark:border-brand-900 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('careerPlan.result.progress')}</span>
                <span className="text-sm font-bold text-brand-900 dark:text-brand-400">{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full h-3 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-700 to-brand-900 dark:from-brand-400 dark:to-brand-700 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Milestones Timeline */}
          <div className="space-y-4">
            {plan.map((milestone, idx) => (
              <Card key={milestone.id} className="p-6 border-l-4 border-l-brand-700 dark:border-l-brand-400 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{milestone.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                      <Clock className="w-4 h-4" />
                      {t('careerPlan.result.month', { month: milestone.month })}
                    </p>
                  </div>
                  <span className="text-sm px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-900 dark:text-brand-300 font-medium">
                    {milestone.status === 'planerad' ? t('careerPlan.status.planned') : milestone.status === 'pågår' ? t('careerPlan.status.inProgress') : t('careerPlan.status.completed')}
                  </span>
                </div>

                {/* Tasks */}
                <div className="space-y-2 mb-4">
                  {milestone.tasks.map((task) => (
                    <label
                      key={task.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={completedTasks.has(task.id)}
                        onChange={() => toggleTask(task.id)}
                        className="mt-1 w-5 h-5 rounded border-stone-300 dark:border-stone-600 text-brand-900 dark:text-brand-400 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className={`text-sm ${completedTasks.has(task.id) ? 'line-through text-gray-500 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                          {task.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{task.dueDate}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Metrics */}
                <div className="bg-brand-50 dark:bg-brand-900/30 p-3 rounded-lg border border-brand-100 dark:border-brand-900">
                  <p className="text-sm text-brand-900 dark:text-brand-200 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <strong>{t('careerPlan.result.successMetrics')}:</strong> {milestone.metrics}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {/* Check-in Prompts */}
          <Card className="p-6 bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-900">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-brand-900 dark:text-brand-400" />
              {t('careerPlan.checkIns.title')}
            </h3>

            <div className="space-y-3">
              <div className="bg-white dark:bg-stone-800 p-4 rounded-lg border border-brand-100 dark:border-brand-900">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">{t('careerPlan.checkIns.weekly.title')}</p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 ml-4 list-disc">
                  <li>{t('careerPlan.checkIns.weekly.q1')}</li>
                  <li>{t('careerPlan.checkIns.weekly.q2')}</li>
                  <li>{t('careerPlan.checkIns.weekly.q3')}</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-stone-800 p-4 rounded-lg border border-brand-100 dark:border-brand-900">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">{t('careerPlan.checkIns.monthly.title')}</p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 ml-4 list-disc">
                  <li>{t('careerPlan.checkIns.monthly.q1')}</li>
                  <li>{t('careerPlan.checkIns.monthly.q2')}</li>
                  <li>{t('careerPlan.checkIns.monthly.q3')}</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* SMART Goals */}
          <Card className="p-6 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              {t('careerPlan.smart.title')}
            </h3>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p><strong>S</strong>{t('careerPlan.smart.specific')}</p>
              <p><strong>M</strong>{t('careerPlan.smart.measurable')}</p>
              <p><strong>A</strong>{t('careerPlan.smart.attainable', { timeframe: tidsram })}</p>
              <p><strong>R</strong>{t('careerPlan.smart.relevant')}</p>
              <p><strong>T</strong>{t('careerPlan.smart.timeBound', { timeframe: tidsram })}</p>
            </div>
          </Card>

          {/* Action Button */}
          <div className="flex gap-3">
            <Button onClick={() => setPlan(null)} variant="outline" className="flex-1">
              {t('careerPlan.actions.createNew')}
            </Button>
            <Button className="flex-1 bg-gradient-to-r from-brand-700 to-brand-900 dark:from-brand-900 dark:to-brand-900">
              <Send className="w-4 h-4 mr-2" />
              {t('careerPlan.actions.shareByEmail')}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
