import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, Sparkles, ChevronRight, RefreshCw } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { userPreferencesApi } from '@/services/cloudStorage'

interface Task {
  id: string
  title: string
  description: string
  type: 'diary' | 'exercise' | 'cv' | 'jobsearch' | 'networking' | 'reflection'
  estimatedTime: string
  link: string
}

const dailyTasks: Task[] = [
  {
    id: 'diary-1',
    title: 'Skriv i dagboken',
    description: 'Reflektera över din dag och dina framsteg',
    type: 'diary',
    estimatedTime: '5 min',
    link: '/diary'
  },
  {
    id: 'exercise-1',
    title: 'Gör en övning',
    description: 'Utforska dina styrkor eller öva på intervjuteknik',
    type: 'exercise',
    estimatedTime: '15 min',
    link: '/exercises'
  },
  {
    id: 'cv-1',
    title: 'Uppdatera ditt CV',
    description: 'Lägg till en ny erfarenhet eller färdighet',
    type: 'cv',
    estimatedTime: '10 min',
    link: '/cv'
  },
  {
    id: 'jobsearch-1',
    title: 'Sök efter jobb',
    description: 'Utforska nya möjligheter som matchar din profil',
    type: 'jobsearch',
    estimatedTime: '15 min',
    link: '/job-search'
  },
  {
    id: 'networking-1',
    title: 'Nätverka',
    description: 'Kontakta någon i ditt nätverk eller utöka det',
    type: 'networking',
    estimatedTime: '10 min',
    link: '/career'
  },
  {
    id: 'reflection-1',
    title: 'Fundera över dina mål',
    description: 'Vad är viktigast för dig just nu?',
    type: 'reflection',
    estimatedTime: '5 min',
    link: '/exercises'
  }
]

const typeConfig = {
  diary: { color: 'bg-violet-100 text-violet-700 border-violet-200', icon: Sparkles },
  exercise: { color: 'bg-teal-100 text-teal-700 border-teal-200', icon: CheckCircle2 },
  cv: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle2 },
  jobsearch: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  networking: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: CheckCircle2 },
  reflection: { color: 'bg-rose-100 text-rose-700 border-rose-200', icon: Sparkles }
}

interface DailyTaskState {
  date: string
  taskIndex: number
  completed: boolean
}

export function DailyTask() {
  const [completed, setCompleted] = useState(false)
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  // Ladda sparad status från molnet
  useEffect(() => {
    const loadTaskState = async () => {
      try {
        setLoading(true)
        const today = new Date().toISOString().split('T')[0]
        
        // Försök ladda från molnet
        const prefs = await userPreferencesApi.get()
        const dailyTaskState = prefs?.daily_task_state as DailyTaskState | undefined
        
        if (dailyTaskState?.date === today) {
          setCurrentTaskIndex(dailyTaskState.taskIndex)
          setCompleted(dailyTaskState.completed)
        } else {
          // Ny dag - slumpa ny uppgift
          const newIndex = Math.floor(Math.random() * dailyTasks.length)
          setCurrentTaskIndex(newIndex)
          setCompleted(false)
          
          // Spara till molnet
          await saveTaskState(newIndex, false)
        }
      } catch (error) {
        console.error('Fel vid laddning av daglig uppgift:', error)
        // Fallback till localStorage
        loadFromLocalStorage()
      } finally {
        setLoading(false)
      }
    }

    loadTaskState()
  }, [])

  const loadFromLocalStorage = () => {
    const savedDate = localStorage.getItem('dailyTaskDate')
    const savedIndex = localStorage.getItem('dailyTaskIndex')
    const savedCompleted = localStorage.getItem('dailyTaskCompleted')
    const today = new Date().toISOString().split('T')[0]

    if (savedDate === today && savedIndex) {
      setCurrentTaskIndex(parseInt(savedIndex))
      setCompleted(savedCompleted === 'true')
    } else {
      const newIndex = Math.floor(Math.random() * dailyTasks.length)
      setCurrentTaskIndex(newIndex)
      setCompleted(false)
      localStorage.setItem('dailyTaskDate', today)
      localStorage.setItem('dailyTaskIndex', newIndex.toString())
      localStorage.setItem('dailyTaskCompleted', 'false')
    }
  }

  const saveTaskState = async (taskIndex: number, isCompleted: boolean) => {
    const today = new Date().toISOString().split('T')[0]
    const state: DailyTaskState = {
      date: today,
      taskIndex,
      completed: isCompleted
    }

    try {
      await userPreferencesApi.update({
        daily_task_state: state
      })
    } catch (error) {
      console.error('Fel vid sparande av daglig uppgift:', error)
      // Fallback till localStorage
      localStorage.setItem('dailyTaskDate', today)
      localStorage.setItem('dailyTaskIndex', taskIndex.toString())
      localStorage.setItem('dailyTaskCompleted', isCompleted.toString())
    }
  }

  const handleComplete = async () => {
    const newCompleted = !completed
    setCompleted(newCompleted)
    await saveTaskState(currentTaskIndex, newCompleted)
  }

  const handleRefresh = async () => {
    const newIndex = Math.floor(Math.random() * dailyTasks.length)
    setCurrentTaskIndex(newIndex)
    setCompleted(false)
    await saveTaskState(newIndex, false)
  }

  const currentTask = dailyTasks[currentTaskIndex]
  const config = typeConfig[currentTask.type]
  const Icon = completed ? CheckCircle2 : config.icon

  if (loading) {
    return (
      <div className="rounded-2xl border-2 border-slate-200 p-5 bg-white">
        <div className="animate-pulse flex space-x-4">
          <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'rounded-2xl border-2 p-5 transition-all',
      completed 
        ? 'bg-slate-50 border-slate-200 opacity-75' 
        : 'bg-white border-slate-200 hover:border-teal-300 shadow-sm'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
            completed ? 'bg-green-100 text-green-600' : config.color.split(' ')[0] + ' ' + config.color.split(' ')[1]
          )}>
            <Icon size={24} />
          </div>
          <div>
            <h3 className={cn(
              'font-semibold transition-all',
              completed ? 'text-slate-500 line-through' : 'text-slate-900'
            )}>
              Dagens uppgift
            </h3>
            {!completed && (
              <span className="text-xs text-slate-500">
                Tar cirka {currentTask.estimatedTime}
              </span>
            )}
          </div>
        </div>
        
        {!completed && (
          <button
            onClick={handleRefresh}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Få en annan uppgift"
          >
            <RefreshCw size={18} />
          </button>
        )}
      </div>

      {/* Task Content */}
      <div className="mb-4">
        <h4 className={cn(
          'font-medium mb-1 transition-all',
          completed ? 'text-slate-500 line-through' : 'text-slate-800'
        )}>
          {currentTask.title}
        </h4>
        <p className={cn(
          'text-sm transition-all',
          completed ? 'text-slate-400' : 'text-slate-600'
        )}>
          {currentTask.description}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleComplete}
          className={cn(
            'flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2',
            completed
              ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              : 'bg-teal-600 text-white hover:bg-teal-700'
          )}
        >
          {completed ? (
            <>
              <Circle size={18} />
              Markera som ej klar
            </>
          ) : (
            <>
              <CheckCircle2 size={18} />
              Markera som klar
            </>
          )}
        </button>
        
        <a
          href={currentTask.link}
          className={cn(
            'py-2.5 px-4 rounded-xl font-medium text-sm transition-all flex items-center gap-2',
            completed
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          )}
        >
          Gå till
          <ChevronRight size={16} />
        </a>
      </div>

      {/* Completion Message */}
      {completed && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-sm text-green-700 flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            Bra jobbat! Du är ett steg närmare ditt mål.
          </p>
        </div>
      )}
    </div>
  )
}
