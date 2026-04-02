/**
 * Cognitive Training Tab - Exercise memory and concentration
 */
import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Brain, Clock, Target, RotateCcw, CheckCircle2, AlertCircle,
  ChevronRight, Trophy, Sparkles, Flame, Star
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

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

// Memory Card Game component
function MemoryCardGame({ onComplete }: { onComplete: () => void }) {
  const [cards, setCards] = useState<{ id: number; number: number; flipped: boolean; matched: boolean }[]>([])
  const [moves, setMoves] = useState(0)
  const [matched, setMatched] = useState(0)
  const [firstCard, setFirstCard] = useState<number | null>(null)

  useEffect(() => {
    const numbers = [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6]
    const shuffled = numbers.sort(() => Math.random() - 0.5)
    setCards(shuffled.map((num, idx) => ({ id: idx, number: num, flipped: false, matched: false })))
  }, [])

  const toggleCard = (id: number) => {
    if (cards[id].flipped || cards[id].matched || firstCard === id) return

    const newCards = [...cards]
    newCards[id].flipped = true

    if (firstCard === null) {
      setFirstCard(id)
      setCards(newCards)
      return
    }

    setMoves(m => m + 1)

    if (cards[firstCard].number === newCards[id].number) {
      newCards[firstCard].matched = true
      newCards[id].matched = true
      setMatched(m => m + 1)
      setFirstCard(null)
      setCards(newCards)
    } else {
      setTimeout(() => {
        newCards[firstCard].flipped = false
        newCards[id].flipped = false
        setCards(newCards)
        setFirstCard(null)
      }, 600)
    }
  }

  if (matched === 6) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
        <h4 className="text-xl font-bold text-slate-800 mb-2">Grattis!</h4>
        <p className="text-slate-600 mb-4">Du matchade alla par på {moves} försök</p>
        <Button onClick={onComplete} className="w-full">Avsluta övning</Button>
      </motion.div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {cards.map((card, idx) => (
          <motion.button
            key={card.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleCard(idx)}
            className={cn(
              'aspect-square rounded-lg font-bold text-lg transition-all',
              card.matched ? 'bg-green-100 text-green-700' :
              card.flipped ? 'bg-indigo-500 text-white' : 'bg-slate-200 hover:bg-slate-300'
            )}
          >
            {card.flipped || card.matched ? card.number : '?'}
          </motion.button>
        ))}
      </div>
      <p className="text-sm text-slate-600">Försök: {moves} | Matchade: {matched}/6</p>
    </div>
  )
}

// Number Sequence Game component
function NumberSequenceGame({ onComplete }: { onComplete: () => void }) {
  const [sequence, setSequence] = useState<number[]>([])
  const [playerSequence, setPlayerSequence] = useState<number[]>([])
  const [round, setRound] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    startRound()
  }, [])

  const startRound = () => {
    const newNum = Math.floor(Math.random() * 9) + 1
    const newSequence = [...sequence, newNum]
    setSequence(newSequence)
    setPlayerSequence([])
    playSequence(newSequence)
  }

  const playSequence = async (seq: number[]) => {
    setIsPlaying(true)
    for (const num of seq) {
      await new Promise(resolve => setTimeout(resolve, 400))
    }
    setIsPlaying(false)
  }

  const handleNumberClick = (num: number) => {
    if (isPlaying) return
    const newPlayerSeq = [...playerSequence, num]
    setPlayerSequence(newPlayerSeq)

    if (newPlayerSeq[newPlayerSeq.length - 1] !== sequence[newPlayerSeq.length - 1]) {
      setTimeout(() => {
        onComplete()
      }, 500)
      return
    }

    if (newPlayerSeq.length === sequence.length) {
      setRound(r => r + 1)
      setTimeout(() => startRound(), 1000)
    }
  }

  return (
    <div>
      <div className="text-center mb-4">
        <p className="text-sm text-slate-600">Omgång {round}</p>
        <p className="text-2xl font-bold text-indigo-600 mb-4">Sekvens: {sequence.join(' → ')}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <motion.button
            key={num}
            whileHover={{ scale: isPlaying ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNumberClick(num)}
            disabled={isPlaying}
            className={cn(
              'aspect-square rounded-lg font-bold text-lg transition-all disabled:opacity-50',
              playerSequence.includes(num) ? 'bg-green-100 text-green-700' : 'bg-slate-200 hover:bg-slate-300'
            )}
          >
            {num}
          </motion.button>
        ))}
      </div>
      {playerSequence.length > 0 && (
        <p className="text-sm text-slate-600">Din sekvens: {playerSequence.join(' → ')}</p>
      )}
    </div>
  )
}

export default function CognitiveTab() {
  const { t } = useTranslation()
  const [activeExercise, setActiveExercise] = useState<string | null>(null)
  const [completedExercises, setCompletedExercises] = useState<string[]>([])
  const [streak, setStreak] = useState(3)
  const [currentGameType, setCurrentGameType] = useState<'memory' | 'sequence' | null>(null)

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

  const startExercise = (id: string, gameType?: 'memory' | 'sequence') => {
    setActiveExercise(id)
    if (gameType) {
      setCurrentGameType(gameType)
    }
  }

  const completeExercise = (id: string) => {
    setCompletedExercises(prev => [...new Set([...prev, id])])
    setStreak(s => s + 1)
    setActiveExercise(null)
    setCurrentGameType(null)
  }

  const getCategoryProgress = (category: string) => {
    const categoryExercises = exercises.filter(e => e.category === category)
    const completed = categoryExercises.filter(e => completedExercises.includes(e.id)).length
    return { total: categoryExercises.length, completed, percentage: (completed / categoryExercises.length) * 100 }
  }

  return (
    <div className="space-y-6">
      {/* Streak Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-400 to-red-400 rounded-xl p-6 text-white shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Träningsserie</p>
            <h2 className="text-3xl font-bold mt-1">{streak} dagar</h2>
            <p className="text-sm opacity-75 mt-1">Fortsätt så här för att nå nya höjder!</p>
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Flame className="w-12 h-12" />
          </motion.div>
        </div>
      </motion.div>

      {/* Progress Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{t('wellness.cognitive.title')}</h3>
            <p className="text-slate-500">{t('wellness.cognitive.description')}</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full">
            <Star className="w-5 h-5 text-purple-600" />
            <span className="font-bold text-purple-600">{completedExercises.length} {completedExercises.length === 1 ? 'färdig' : 'färdiga'}</span>
          </div>
        </div>

        {/* Category progress */}
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(categoryConfig).map(([key, config]) => {
            const progress = getCategoryProgress(key)
            const Icon = config.icon
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all"
              >
                <Icon className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">{config.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{progress.completed}/{progress.total}</p>
                <div className="h-2 bg-slate-200 rounded-full mt-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percentage}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-indigo-500"
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </Card>

      {/* Active Exercise with Interactive Games */}
      {activeExercise && (
        <Card className="p-6 border-2 border-indigo-500">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800">
              {exercises.find(e => e.id === activeExercise)?.title}
            </h3>
            <button
              onClick={() => {
                setActiveExercise(null)
                setCurrentGameType(null)
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-slate-50 rounded-xl p-6">
            {currentGameType === 'memory' ? (
              <MemoryCardGame onComplete={() => completeExercise(activeExercise)} />
            ) : currentGameType === 'sequence' ? (
              <NumberSequenceGame onComplete={() => completeExercise(activeExercise)} />
            ) : (
              <div className="text-center">
                <Clock className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                <p className="text-lg font-semibold text-slate-800 mb-2">{exercises.find(e => e.id === activeExercise)?.title}</p>
                <p className="text-slate-600 mb-6">{exercises.find(e => e.id === activeExercise)?.description}</p>
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
            )}
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

            // Determine if this exercise has a mini-game
            const hasGame = ['1', '4'].includes(exercise.id)
            const gameType = exercise.id === '1' ? 'memory' : exercise.id === '4' ? 'sequence' : null

            return (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border-2 transition-all',
                  isCompleted
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-slate-200 hover:border-indigo-300'
                )}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                  isCompleted ? 'bg-green-100' : 'bg-indigo-100'
                )}>
                  {isCompleted ? (
                    <motion.div animate={{ scale: [1, 1.2, 1] }}>
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </motion.div>
                  ) : (
                    <CategoryIcon className="w-6 h-6 text-indigo-600" />
                  )}
                </div>

                <div className="flex-1">
                  <h4 className={cn(
                    'font-semibold',
                    isCompleted ? 'text-green-700 line-through' : 'text-slate-800'
                  )}>
                    {exercise.title}
                  </h4>
                  <p className="text-sm text-slate-600">{exercise.description}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={cn('text-xs px-2 py-1 rounded-full', difficulty.bg, difficulty.color)}>
                      {difficulty.label}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {exercise.duration} {t('wellness.cognitive.min')}
                    </span>
                    {hasGame && (
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                        🎮 Spel
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={isCompleted ? "ghost" : "default"}
                  disabled={isCompleted}
                  onClick={() => startExercise(exercise.id, gameType as any)}
                >
                  {isCompleted ? t('wellness.cognitive.completed') : t('wellness.cognitive.start')}
                  {!isCompleted && <ChevronRight className="w-4 h-4 ml-1" />}
                </Button>
              </motion.div>
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
