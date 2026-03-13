/**
 * Cognitive Training Tab - Exercise memory and concentration
 */
import { useState, useEffect } from 'react'
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

const exercises: Exercise[] = [
  {
    id: '1',
    title: 'Namn-minne',
    description: 'Öva på att komma ihåg namn och ansikten',
    duration: 5,
    difficulty: 'easy',
    category: 'memory',
    completed: false,
  },
  {
    id: '2',
    title: 'Fokus-övning',
    description: 'Träna koncentration i 10 minuter utan avbrott',
    duration: 10,
    difficulty: 'medium',
    category: 'concentration',
    completed: false,
  },
  {
    id: '3',
    title: 'Prioriterings-träning',
    description: 'Sortera uppgifter efter vikt och brådska',
    duration: 15,
    difficulty: 'medium',
    category: 'problem-solving',
    completed: false,
  },
  {
    id: '4',
    title: 'Arbetsminne',
    description: 'Kom ihåg instruktioner medan du gör något annat',
    duration: 10,
    difficulty: 'hard',
    category: 'memory',
    completed: false,
  },
  {
    id: '5',
    title: 'Distraherad läsning',
    description: 'Läsa och förstå text med bakgrundsljud',
    duration: 15,
    difficulty: 'hard',
    category: 'concentration',
    completed: false,
  },
]

const difficultyConfig = {
  easy: { label: 'Lätt', color: 'text-green-600', bg: 'bg-green-100' },
  medium: { label: 'Medel', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  hard: { label: 'Svår', color: 'text-red-600', bg: 'bg-red-100' },
}

const categoryConfig = {
  memory: { label: 'Minne', icon: Brain },
  concentration: { label: 'Koncentration', icon: Target },
  'problem-solving': { label: 'Problemlösning', icon: Sparkles },
}

export default function CognitiveTab() {
  const [activeExercise, setActiveExercise] = useState<string | null>(null)
  const [completedExercises, setCompletedExercises] = useState<string[]>([])
  const [streak, setStreak] = useState(3)

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
            <h3 className="text-lg font-semibold text-slate-800">Kognitiv träning</h3>
            <p className="text-slate-500">Övningar för att stärka ditt minne och din koncentration</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full">
            <Trophy className="w-5 h-5 text-orange-600" />
            <span className="font-bold text-orange-600">{streak} dagar</span>
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
            <p className="text-slate-600 mb-4">Övning pågår...</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setActiveExercise(null)}>
                Pausa
              </Button>
              <Button onClick={() => completeExercise(activeExercise)}>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Klar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Exercises List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Tillgängliga övningar</h3>
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
                      {exercise.duration} min
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={isCompleted ? "ghost" : "default"}
                  disabled={isCompleted}
                  onClick={() => startExercise(exercise.id)}
                >
                  {isCompleted ? 'Avklarad' : 'Starta'}
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
            <h4 className="font-semibold text-slate-800 mb-2">Tips för kognitiv träning</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• Öva regelbundet - 10 minuter om dagen är bättre än en timme i veckan</li>
              <li>• Utmana dig själv, men inte så mycket att det blir frustrerande</li>
              <li>• Kombinera med fysisk aktivitet för bästa effekt</li>
              <li>• Sömn är avgörande för kognitiv återhämtning</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
