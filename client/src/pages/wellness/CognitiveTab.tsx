/**
 * Cognitive Training Tab - Exercise memory and concentration
 */
import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Brain, Clock, Target, RotateCcw, CheckCircle2, AlertCircle,
  ChevronRight, Trophy, Sparkles
} from 'lucide-react'
import { Card, Button } from '@/components/ui'

interface Exercise {
  id: string
  title: string
  description: string
  duration: number
  difficulty: 'easy' | 'medium' | 'hard'
  category: 'memory' | 'concentration' | 'problem-solving'
  completed: boolean
}

// Exercise definitions with i18n keys
const exerciseDefs = [
  { id: '1', titleKey: 'wellness.cognitive.exercises.namememory.title', descKey: 'wellness.cognitive.exercises.namememory.description', duration: 5, difficulty: 'easy' as const, category: 'memory' as const },
  { id: '2', titleKey: 'wellness.cognitive.exercises.focus.title', descKey: 'wellness.cognitive.exercises.focus.description', duration: 10, difficulty: 'medium' as const, category: 'concentration' as const },
  { id: '3', titleKey: 'wellness.cognitive.exercises.prioritization.title', descKey: 'wellness.cognitive.exercises.prioritization.description', duration: 15, difficulty: 'medium' as const, category: 'problem-solving' as const },
  { id: '4', titleKey: 'wellness.cognitive.exercises.workingmemory.title', descKey: 'wellness.cognitive.exercises.workingmemory.description', duration: 10, difficulty: 'hard' as const, category: 'memory' as const },
  { id: '5', titleKey: 'wellness.cognitive.exercises.distractedreading.title', descKey: 'wellness.cognitive.exercises.distractedreading.description', duration: 15, difficulty: 'hard' as const, category: 'concentration' as const },
]

// Config definitions with i18n keys
const difficultyDefs = {
  easy: { labelKey: 'wellness.cognitive.difficulty.easy', color: 'text-green-600', bg: 'bg-green-100' },
  medium: { labelKey: 'wellness.cognitive.difficulty.medium', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  hard: { labelKey: 'wellness.cognitive.difficulty.hard', color: 'text-red-600', bg: 'bg-red-100' },
}

const categoryDefs = {
  memory: { labelKey: 'wellness.cognitive.categories.memory', icon: Brain },
  concentration: { labelKey: 'wellness.cognitive.categories.concentration', icon: Target },
  'problem-solving': { labelKey: 'wellness.cognitive.categories.problemSolving', icon: Sparkles },
}

export default function CognitiveTab() {
  const { t } = useTranslation()
  const [activeExercise, setActiveExercise] = useState<string | null>(null)
  const [completedExercises, setCompletedExercises] = useState<string[]>([])
  const [streak, setStreak] = useState(3)

  // Build translated exercises
  const exercises = useMemo(() => exerciseDefs.map(e => ({
    ...e,
    title: t(e.titleKey),
    description: t(e.descKey),
    completed: false
  })), [t])

  // Build translated configs
  const difficultyConfig = useMemo(() => {
    const result: Record<string, { label: string; color: string; bg: string }> = {}
    for (const [key, def] of Object.entries(difficultyDefs)) {
      result[key] = { label: t(def.labelKey), color: def.color, bg: def.bg }
    }
    return result
  }, [t])

  const categoryConfig = useMemo(() => {
    const result: Record<string, { label: string; icon: React.ElementType }> = {}
    for (const [key, def] of Object.entries(categoryDefs)) {
      result[key] = { label: t(def.labelKey), icon: def.icon }
    }
    return result
  }, [t])

  const startExercise = (id: string) => {
    setActiveExercise(id)
  }

  const completeExercise = (id: string) => {
    setCompletedExercises(prev => [...prev, id])
    setActiveExercise(null)
  }

  const getCategoryProgress = (category: string) => {
    const categoryExercises = exercises.filter(e => e.category === category)
    const completed = categoryExercises.filter(e => completedExercises.includes(e.id)).length
    return { total: categoryExercises.length, completed, percentage: (completed / categoryExercises.length) * 100 }
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{t('wellness.cognitive.title')}</h3>
            <p className="text-slate-500">{t('wellness.cognitive.description')}</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full">
            <Trophy className="w-5 h-5 text-orange-600" />
            <span className="font-bold text-orange-600">{streak} {t('wellness.cognitive.days')}</span>
          </div>
        </div>

        {/* Category progress */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {Object.entries(categoryConfig).map(([key, config]) => {
            const progress = getCategoryProgress(key)
            const Icon = config.icon
            return (
              <div key={key} className="text-center p-4 bg-slate-50 rounded-xl">
                <Icon className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">{config.label}</p>
                <p className="text-2xl font-bold text-slate-800">{progress.completed}/{progress.total}</p>
                <div className="h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Active Exercise */}
      {activeExercise && (
        <Card className="p-6 border-2 border-indigo-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">
              {exercises.find(e => e.id === activeExercise)?.title}
            </h3>
            <button 
              onClick={() => setActiveExercise(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-6 text-center">
            <Clock className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <p className="text-3xl font-bold text-slate-800 mb-2">10:00</p>
            <p className="text-slate-600 mb-4">{t('wellness.cognitive.exerciseInProgress')}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setActiveExercise(null)}>
                {t('wellness.cognitive.pause')}
              </Button>
              <Button onClick={() => completeExercise(activeExercise)}>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                {t('wellness.cognitive.done')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Exercises List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('wellness.cognitive.availableExercises')}</h3>
        <div className="space-y-3">
          {exercises.map((exercise) => {
            const difficulty = difficultyConfig[exercise.difficulty]
            const category = categoryConfig[exercise.category]
            const CategoryIcon = category.icon
            const isCompleted = completedExercises.includes(exercise.id)
            
            return (
              <div
                key={exercise.id}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  isCompleted
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isCompleted ? 'bg-green-100' : 'bg-indigo-100'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <CategoryIcon className="w-6 h-6 text-indigo-600" />
                  )}
                </div>

                <div className="flex-1">
                  <h4 className={`font-semibold ${isCompleted ? 'text-green-700 line-through' : 'text-slate-800'}`}>
                    {exercise.title}
                  </h4>
                  <p className="text-sm text-slate-600">{exercise.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${difficulty.bg} ${difficulty.color}`}>
                      {difficulty.label}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {exercise.duration} {t('wellness.cognitive.min')}
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={isCompleted ? "ghost" : "default"}
                  disabled={isCompleted}
                  onClick={() => startExercise(exercise.id)}
                >
                  {isCompleted ? t('wellness.cognitive.completed') : t('wellness.cognitive.start')}
                  {!isCompleted && <ChevronRight className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Tips */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">{t('wellness.cognitive.tips.title')}</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• {t('wellness.cognitive.tips.tip1')}</li>
              <li>• {t('wellness.cognitive.tips.tip2')}</li>
              <li>• {t('wellness.cognitive.tips.tip3')}</li>
              <li>• {t('wellness.cognitive.tips.tip4')}</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
