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
  const { t } = useTranslation()
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
        title: 'Förberedelse & Positionering',
        month: 1,
        status: 'planerad',
        tasks: [
          { id: '1-1', description: 'Uppdatera CV och LinkedIn-profil', completed: false, dueDate: 'Vecka 1' },
          { id: '1-2', description: 'Identifiera 15-20 målföretag', completed: false, dueDate: 'Vecka 2' },
          { id: '1-3', description: 'Skapa personlig varumärkesöversikt', completed: false, dueDate: 'Vecka 2' }
        ],
        metrics: '3 slutförda förberedelser'
      },
      {
        id: '2',
        title: 'Aktiv jobbsökning & Nätverkande',
        month: Math.ceil(months / 2),
        status: 'planerad',
        tasks: [
          { id: '2-1', description: 'Skicka 5-10 ansökningar per vecka', completed: false, dueDate: `Vecka 3-${Math.ceil(months / 2) * 2}` },
          { id: '2-2', description: 'Nätverka med 2-3 ny kontakter per vecka', completed: false, dueDate: `Vecka 3-${Math.ceil(months / 2) * 2}` },
          { id: '2-3', description: 'Öva intervjufrågor varje vecka', completed: false, dueDate: 'Varje torsdag' }
        ],
        metrics: '50+ ansökningar, 10+ nätverksmöten'
      },
      {
        id: '3',
        title: 'Intervjuer & Förhandlingar',
        month: months,
        status: 'planerad',
        tasks: [
          { id: '3-1', description: 'Följa upp ansökningar aktivt', completed: false, dueDate: `Vecka ${Math.ceil(months / 2) + 1}` },
          { id: '3-2', description: 'Gå på minst 3-5 intervjuer', completed: false, dueDate: `Vecka ${Math.ceil(months / 2) + 2}` },
          { id: '3-3', description: 'Förhandla om erbjudanden och villkor', completed: false, dueDate: `Vecka ${months * 4}` }
        ],
        metrics: 'Minst ett jobberbjudande'
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

    const content = `KARRIÄRPLAN
Skapad: ${new Date().toLocaleDateString('sv-SE')}
Tidsram: ${tidsram}

NUVARANDE POSITION:
${nuvarande}

MÅLPOSITION:
${mal}

HINDER ATT ÖVERVINNA:
${hinder || 'Ingen angiven'}

--- MILSTOLPAR OCH ÅTGÄRDER ---

${plan.map((milestone, idx) => `
MILSTOLPE ${idx + 1}: ${milestone.title}
Månad: ${milestone.month}
Status: ${milestone.status}

Uppgifter:
${milestone.tasks.map(t => `  ☐ ${t.description} (${t.dueDate})`).join('\n')}

Framgångsmått: ${milestone.metrics}
`).join('\n')}

--- CHECKUP-SCHMA ---
- Veckovis: Granskning av ansökningar och nätverkande
- Månatlig: Framstegsgranskning och plansjustering
- Kvartal: Djup analys av karriärutveckling`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `karriarplan-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
  }

  const progressPercent = plan ? (completedTasks.size / plan.reduce((sum, m) => sum + m.tasks.length, 0)) * 100 : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 mb-2">
          <MapPin className="w-7 h-7 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">{t('careerPlan.title')}</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          {t('careerPlan.description')}
        </p>
      </div>

      {/* Input Form */}
      {!plan && (
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <MapPin className="w-4 h-4 text-slate-600" />
                {t('careerPlan.whereAreYou')}
              </label>
              <textarea
                value={nuvarande}
                onChange={(e) => setNuvarande(e.target.value)}
                placeholder={t('careerPlan.whereAreYouPlaceholder')}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-y"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Flag className="w-4 h-4 text-emerald-500" />
                {t('careerPlan.whereToGo')}
              </label>
              <textarea
                value={mal}
                onChange={(e) => setMal(e.target.value)}
                placeholder={t('careerPlan.whereToGoPlaceholder')}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-y"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 text-slate-600" />
                  {t('careerPlan.timeline')}
                </label>
                <select
                  value={tidsram}
                  onChange={(e) => setTidsram(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                >
                  <option value="3 månader">{t('careerPlan.timeframes.3months')}</option>
                  <option value="6 månader">{t('careerPlan.timeframes.6months')}</option>
                  <option value="12 månader">{t('careerPlan.timeframes.12months')}</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Target className="w-4 h-4 text-slate-600" />
                  {t('careerPlan.obstacles')}
                </label>
                <input
                  type="text"
                  value={hinder}
                  onChange={(e) => setHinder(e.target.value)}
                  placeholder={t('careerPlan.obstaclesPlaceholder')}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                />
              </div>
            </div>

            <Button
              onClick={skapaPlan}
              disabled={!nuvarande.trim() || !mal.trim() || isLoading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600"
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
          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
                {t('careerPlan.result.title')}
              </h2>
              <Button variant="outline" size="sm" onClick={downloadPlan}>
                <Download className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress Overview */}
            <div className="bg-white p-4 rounded-lg border border-emerald-100 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">Framsteg genom planen</span>
                <span className="text-sm font-bold text-emerald-600">{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Milestones Timeline */}
          <div className="space-y-4">
            {plan.map((milestone, idx) => (
              <Card key={milestone.id} className="p-6 border-l-4 border-l-emerald-500">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{milestone.title}</h3>
                    <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                      <Clock className="w-4 h-4" />
                      Månad {milestone.month}
                    </p>
                  </div>
                  <span className="text-sm px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                    {milestone.status === 'planerad' ? '📋 Planerad' : milestone.status === 'pågår' ? '⏳ Pågår' : '✓ Slutförd'}
                  </span>
                </div>

                {/* Tasks */}
                <div className="space-y-2 mb-4">
                  {milestone.tasks.map((task) => (
                    <label
                      key={task.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={completedTasks.has(task.id)}
                        onChange={() => toggleTask(task.id)}
                        className="mt-1 w-5 h-5 rounded border-slate-300 text-emerald-600 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className={`text-sm ${completedTasks.has(task.id) ? 'line-through text-slate-600' : 'text-slate-700'}`}>
                          {task.description}
                        </p>
                        <p className="text-xs text-slate-700 mt-1">{task.dueDate}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Metrics */}
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                  <p className="text-sm text-emerald-800 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <strong>Framgångsmått:</strong> {milestone.metrics}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {/* Check-in Prompts */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Regelbundna checkup-tillfällen
            </h3>

            <div className="space-y-3">
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <p className="text-sm font-medium text-slate-800 mb-2">📅 Veckovis checkup</p>
                <ul className="text-sm text-slate-600 space-y-1 ml-4 list-disc">
                  <li>Hur många ansökningar skickade du denna vecka?</li>
                  <li>Vilka nätverkskontakter gjorde du?</li>
                  <li>Vilka hinder stötte du på?</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <p className="text-sm font-medium text-slate-800 mb-2">📊 Månatlig review</p>
                <ul className="text-sm text-slate-600 space-y-1 ml-4 list-disc">
                  <li>Granskar du dina milstolpar?</li>
                  <li>Behöver du justera din strategi?</li>
                  <li>Vilka nya färdigheter utvecklade du?</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* SMART Goals */}
          <Card className="p-6 bg-purple-50 border-purple-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-purple-600" />
              SMART-mål för din plan
            </h3>
            <div className="space-y-2 text-sm text-slate-700">
              <p><strong>S</strong>pecifik: Exakta jobbroller och företag identifierade</p>
              <p><strong>M</strong>easurable: 50+ ansökningar, 10+ nätverksmöten</p>
              <p><strong>A</strong>ttainable: Realistisk tidsplan över {tidsram}</p>
              <p><strong>R</strong>elevant: Målposition överensstämmer med dina framtidsdrömmar</p>
              <p><strong>T</strong>id-begränsad: Klar deadline på {tidsram}</p>
            </div>
          </Card>

          {/* Action Button */}
          <div className="flex gap-3">
            <Button onClick={() => setPlan(null)} variant="outline" className="flex-1">
              Skapa ny plan
            </Button>
            <Button className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600">
              <Send className="w-4 h-4 mr-2" />
              Dela plan via e-post
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
