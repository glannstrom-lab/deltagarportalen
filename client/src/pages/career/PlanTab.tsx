/**
 * Plan Tab - Career plan with SMART goals and visual timeline
 */
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Target, MapPin, Flag, Calendar, CheckCircle, Clock,
  Sparkles, ChevronRight, Plus, Award, TrendingUp, AlertCircle,
  Zap, X
} from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Milestone {
  id: string
  title: string
  timeframe: string
  targetDate?: string
  completed: boolean
  steps: string[]
  progress?: number
}

export default function PlanTab() {
  const { t, i18n } = useTranslation()
  const [currentSituation, setCurrentSituation] = useState('')
  const [goal, setGoal] = useState('')
  const [hasPlan, setHasPlan] = useState(false)
  const [showSMARTHelper, setShowSMARTHelper] = useState(false)
  const [completedMilestones, setCompletedMilestones] = useState<Set<string>>(new Set())

  // Translated mock milestones with dates and progress
  const initialMilestones = useMemo(() => [
    {
      id: '1',
      title: i18n.language === 'en' ? 'Update CV and LinkedIn' : 'Uppdatera CV och LinkedIn',
      timeframe: i18n.language === 'en' ? 'Month 1-2' : 'Månad 1-2',
      targetDate: '2026-05-01',
      completed: true,
      progress: 100,
      steps: i18n.language === 'en'
        ? ['Add recent experiences', 'Optimize keywords', 'Update profile picture']
        : ['Lägg till senaste erfarenheter', 'Optimera nyckelord', 'Uppdatera profilbild']
    },
    {
      id: '2',
      title: i18n.language === 'en' ? 'Identify target companies' : 'Identifiera målföretag',
      timeframe: i18n.language === 'en' ? 'Month 2-3' : 'Månad 2-3',
      targetDate: '2026-06-15',
      completed: false,
      progress: 60,
      steps: i18n.language === 'en'
        ? ['List 10 dream employers', 'Follow them on LinkedIn', 'Contact people within the companies']
        : ['Lista 10 drömarbetsgivare', 'Följ dem på LinkedIn', 'Kontakta personer inom företagen']
    },
    {
      id: '3',
      title: i18n.language === 'en' ? 'Send applications' : 'Skicka ansökningar',
      timeframe: i18n.language === 'en' ? 'Month 3-6' : 'Månad 3-6',
      targetDate: '2026-09-01',
      completed: false,
      progress: 0,
      steps: i18n.language === 'en'
        ? ['Tailor CV for each role', 'Write cover letters', 'Follow up applications']
        : ['Skräddarsy CV för varje roll', 'Skriv personliga brev', 'Följa upp ansökningar']
    },
  ], [i18n.language])

  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones)

  const generatePlan = () => {
    if (!currentSituation.trim() || !goal.trim()) return
    setHasPlan(true)
  }

  const toggleMilestone = (id: string) => {
    setMilestones(prev => prev.map(m =>
      m.id === id ? { ...m, completed: !m.completed, progress: !m.completed ? 100 : 0 } : m
    ))
  }

  const updateMilestoneProgress = (id: string, progress: number) => {
    setMilestones(prev => prev.map(m =>
      m.id === id ? { ...m, progress: Math.min(100, Math.max(0, progress)) } : m
    ))
  }

  const completedCount = milestones.filter(m => m.completed).length
  const totalProgress = Math.round(milestones.reduce((sum, m) => sum + (m.progress || 0), 0) / milestones.length)

  if (!hasPlan) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">{t('career.plan.createCareerPlan')}</h3>
            <p className="text-slate-600 mt-2">
              {t('career.plan.describeWhere')}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                {t('career.plan.whereAreYou')}
              </label>
              <textarea
                value={currentSituation}
                onChange={(e) => setCurrentSituation(e.target.value)}
                placeholder={t('career.plan.currentPlaceholder')}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-y"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Flag className="w-4 h-4 text-emerald-500" />
                {t('career.plan.whereWantToGo')}
              </label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder={t('career.plan.goalPlaceholder')}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-y"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={generatePlan}
                disabled={!currentSituation.trim() || !goal.trim()}
                className="w-full flex-1"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {t('career.plan.generatePlan')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSMARTHelper(!showSMARTHelper)}
                title="SMART goals helper"
              >
                <Zap className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {showSMARTHelper && (
          <Card className="p-6 bg-amber-50 border-2 border-amber-200">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 mb-2">SMART-mål hjälpare</h4>
                <p className="text-sm text-amber-800 mb-3">
                  Se till att ditt mål är Specifikt, Mätbart, Uppnåeligt, Relevant och Tidsbundet:
                </p>
                <ul className="space-y-2 text-sm text-amber-700">
                  <li><strong>S</strong> - Specifikt: Vad exakt vill du uppnå?</li>
                  <li><strong>M</strong> - Mätbart: Hur vet du när du har nått målet?</li>
                  <li><strong>A</strong> - Uppnåeligt: Är det realistiskt under din timeframe?</li>
                  <li><strong>R</strong> - Relevant: Matchar det dina värden och ambitioner?</li>
                  <li><strong>T</strong> - Tidsbundet: Har du en tidsram i åtanke?</li>
                </ul>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h4 className="font-semibold text-slate-800 mb-4">{t('career.plan.whyCareerPlan')}</h4>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              {t('career.plan.reason1')}
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              {t('career.plan.reason2')}
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              {t('career.plan.reason3')}
            </li>
          </ul>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Plan Overview */}
      <Card className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">{t('career.plan.yourCareerPlan')}</h3>
            <p className="text-slate-600"><strong>Från:</strong> {currentSituation}</p>
            <p className="text-slate-600"><strong>Till:</strong> {goal}</p>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-slate-800">Övergripande framsteg</span>
            </div>
            <span className="text-2xl font-bold text-emerald-600">{totalProgress}%</span>
          </div>
          <div className="h-3 bg-white rounded-full overflow-hidden border border-emerald-200">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
          <p className="text-xs text-emerald-700 mt-2">
            {completedCount} av {milestones.length} milstolpar slutförda
          </p>
        </div>

        {/* Timeline */}
        <div className="mb-6">
          <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Tidslinje för karriärplan
          </h4>

          <div className="relative pl-6">
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="mb-6 relative">
                {/* Timeline dot */}
                <div className="absolute -left-8 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white"
                  style={{
                    borderColor: milestone.completed ? '#10b981' : '#e2e8f0',
                    backgroundColor: milestone.completed ? '#d1fae5' : '#f8fafc'
                  }}
                >
                  {milestone.completed ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                  )}
                </div>

                {/* Connector line */}
                {index < milestones.length - 1 && (
                  <div
                    className="absolute -left-7 top-7 w-0.5 h-20 transition-colors"
                    style={{
                      backgroundColor: milestone.completed ? '#d1fae5' : '#e2e8f0'
                    }}
                  />
                )}

                {/* Milestone card */}
                <div
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all',
                    milestone.completed
                      ? 'bg-green-50 border-emerald-300'
                      : 'bg-white border-slate-200 hover:border-indigo-300'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h4 className={cn(
                        'font-semibold',
                        milestone.completed ? 'text-emerald-700 line-through' : 'text-slate-800'
                      )}>
                        {milestone.title}
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs">
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <Clock className="w-3 h-3" />
                          {milestone.timeframe}
                        </span>
                        {milestone.targetDate && (
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <Calendar className="w-3 h-3" />
                            {new Date(milestone.targetDate).toLocaleDateString('sv-SE')}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleMilestone(milestone.id)}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium transition-colors flex-shrink-0',
                        milestone.completed
                          ? 'bg-emerald-200 text-emerald-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      )}
                    >
                      {milestone.completed ? '✓ Klar' : 'Gågång'}
                    </button>
                  </div>

                  {/* Progress bar */}
                  {!milestone.completed && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600">Framsteg</span>
                        <span className="text-xs font-semibold text-indigo-600">{milestone.progress || 0}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={milestone.progress || 0}
                        onChange={(e) => updateMilestoneProgress(milestone.id, parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                  )}

                  {/* Steps */}
                  <ul className="space-y-2">
                    {milestone.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="text-sm text-slate-600 flex items-center gap-2">
                        <div className={cn(
                          'w-1.5 h-1.5 rounded-full flex-shrink-0',
                          milestone.completed ? 'bg-emerald-400' : 'bg-slate-400'
                        )} />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => setHasPlan(false)}
        >
          <Plus className="w-4 h-4 mr-1" />
          {t('career.plan.updatePlan')}
        </Button>
      </Card>
    </div>
  )
}
