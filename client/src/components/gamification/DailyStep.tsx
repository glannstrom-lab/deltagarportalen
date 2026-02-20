import { useState, useEffect } from 'react'
import { Check, Sparkles, Target, BookOpen, FileText, Briefcase, Heart } from 'lucide-react'

interface DailyTask {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  duration: string
  category: 'cv' | 'application' | 'wellbeing' | 'learning'
  action: () => void
}

interface DailyStepProps {
  onTaskComplete?: (taskId: string) => void
  completedTasks?: string[]
}

const taskSuggestions: DailyTask[] = [
  {
    id: 'add-skill',
    title: 'Lägg till en färdighet',
    description: 'Vad är du bra på? Allt räknas!',
    icon: <Target className="w-5 h-5" />,
    duration: '2 min',
    category: 'cv',
    action: () => window.location.href = '/cv-builder'
  },
  {
    id: 'update-contact',
    title: 'Uppdatera kontaktuppgifter',
    description: 'Se till att arbetsgivare kan nå dig',
    icon: <FileText className="w-5 h-5" />,
    duration: '3 min',
    category: 'cv',
    action: () => window.location.href = '/cv-builder'
  },
  {
    id: 'read-article',
    title: 'Läs en artikel',
    description: 'Lär dig något nytt om jobbsökande',
    icon: <BookOpen className="w-5 h-5" />,
    duration: '5 min',
    category: 'learning',
    action: () => window.location.href = '/knowledge'
  },
  {
    id: 'save-job',
    title: 'Spara ett intressant jobb',
    description: 'Hitta något som väcker din nyfikenhet',
    icon: <Briefcase className="w-5 h-5" />,
    duration: '5 min',
    category: 'application',
    action: () => window.location.href = '/jobs'
  },
  {
    id: 'write-strength',
    title: 'Skriv ner en styrka',
    description: 'Vad är du stolt över?',
    icon: <Sparkles className="w-5 h-5" />,
    duration: '3 min',
    category: 'wellbeing',
    action: () => window.location.href = '/cv-builder'
  },
  {
    id: 'check-wellbeing',
    title: 'Registrera ditt mående',
    description: 'Hur mår du idag?',
    icon: <Heart className="w-5 h-5" />,
    duration: '1 min',
    category: 'wellbeing',
    action: () => {} // Handled by parent
  }
]

export function DailyStep({ onTaskComplete, completedTasks = [] }: DailyStepProps) {
  const [selectedTask, setSelectedTask] = useState<DailyTask | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)

  // Välj en slumpmässig uppgift vid första render
  useEffect(() => {
    if (!selectedTask) {
      const incompleteTasks = taskSuggestions.filter(t => !completedTasks.includes(t.id))
      const tasks = incompleteTasks.length > 0 ? incompleteTasks : taskSuggestions
      const randomTask = tasks[Math.floor(Math.random() * tasks.length)]
      setSelectedTask(randomTask)
    }
  }, [completedTasks, selectedTask])

  const handleComplete = () => {
    if (selectedTask) {
      setShowCelebration(true)
      onTaskComplete?.(selectedTask.id)
      
      // Välj ny uppgift efter 2 sekunder
      setTimeout(() => {
        setShowCelebration(false)
        const incompleteTasks = taskSuggestions.filter(t => !completedTasks.includes(t.id) && t.id !== selectedTask.id)
        const tasks = incompleteTasks.length > 0 ? incompleteTasks : taskSuggestions
        const randomTask = tasks[Math.floor(Math.random() * tasks.length)]
        setSelectedTask(randomTask)
      }, 2000)
    }
  }

  const handleNewTask = () => {
    const incompleteTasks = taskSuggestions.filter(t => !completedTasks.includes(t.id) && t.id !== selectedTask?.id)
    const tasks = incompleteTasks.length > 0 ? incompleteTasks : taskSuggestions
    const randomTask = tasks[Math.floor(Math.random() * tasks.length)]
    setSelectedTask(randomTask)
  }

  if (!selectedTask) return null

  const categoryColors = {
    cv: 'bg-blue-50 border-blue-200 text-blue-700',
    application: 'bg-teal-50 border-teal-200 text-teal-700',
    wellbeing: 'bg-rose-50 border-rose-200 text-rose-700',
    learning: 'bg-amber-50 border-amber-200 text-amber-700'
  }

  const categoryLabels = {
    cv: 'CV',
    application: 'Jobbsök',
    wellbeing: 'Välmående',
    learning: 'Lärande'
  }

  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Dagens lilla steg
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Ett litet steg i taget tar dig framåt
          </p>
        </div>
        <button
          onClick={handleNewTask}
          className="text-sm text-slate-400 hover:text-slate-600 underline"
          aria-label="Föreslå en annan uppgift"
        >
          Annan uppgift
        </button>
      </div>

      {showCelebration ? (
        <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
          <div className="text-5xl mb-3">🎉</div>
          <p className="text-lg font-semibold text-teal-700">
            Bra jobbat! Du tog ett steg idag!
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Varje litet steg räknas
          </p>
        </div>
      ) : (
        <div className={`rounded-xl border-2 p-4 transition-all hover:shadow-md ${categoryColors[selectedTask.category]}`}>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              {selectedTask.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium px-2 py-0.5 bg-white rounded-full">
                  {categoryLabels[selectedTask.category]}
                </span>
                <span className="text-xs opacity-75">
                  ~{selectedTask.duration}
                </span>
              </div>
              <h4 className="font-semibold text-lg mb-1">
                {selectedTask.title}
              </h4>
              <p className="text-sm opacity-90 mb-4">
                {selectedTask.description}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleComplete}
                  className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-lg border-2 border-current transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Jag har gjort det!
                </button>
                <button
                  onClick={selectedTask.action}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Starta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {completedTasks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            Du har gjort <span className="font-semibold text-teal-600">{completedTasks.length}</span> steg denna vecka. Bra jobbat! 🌟
          </p>
        </div>
      )}
    </div>
  )
}
