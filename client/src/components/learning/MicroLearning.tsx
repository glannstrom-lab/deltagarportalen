/**
 * MicroLearning - Mikro-learning i widgets
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, CheckCircle, Clock, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface Lesson {
  id: string
  title: string
  duration: string
  type: 'video' | 'article' | 'quiz'
  completed: boolean
}

const lessons: Lesson[] = [
  { id: '1', title: 'Intervjuteknik: De 3 vanligaste frågorna', duration: '3 min', type: 'video', completed: false },
  { id: '2', title: 'Hur du skriver ett CV som syns', duration: '5 min', type: 'article', completed: false },
  { id: '3', title: 'Nätverkande för introverter', duration: '4 min', type: 'video', completed: false },
]

export function MicroLearning() {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [completed, setCompleted] = useState<string[]>([])

  const markComplete = (id: string) => {
    setCompleted([...completed, id])
    setActiveLesson(null)
  }

  if (activeLesson) {
    return (
      <div className="p-4 bg-slate-50 rounded-xl">
        <button onClick={() => setActiveLesson(null)} className="text-sm text-slate-500 mb-3">← Tillbaka</button>
        <h3 className="font-semibold mb-3">{activeLesson.title}</h3>
        <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center mb-4">
          <button onClick={() => setIsPlaying(!isPlaying)} className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            {isPlaying ? <Pause size={32} className="text-white" /> : <Play size={32} className="text-white ml-1" />}
          </button>
        </div>
        <Button onClick={() => markComplete(activeLesson.id)} className="w-full">
          <CheckCircle size={16} className="mr-2" />
          Markera som klar (+10 XP)
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
        <BookOpen size={18} className="text-violet-500" />
        Dagens mikro-läxa
      </h3>
      {lessons.filter(l => !completed.includes(l.id)).slice(0, 1).map(lesson => (
        <div key={lesson.id} onClick={() => setActiveLesson(lesson)} className="p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <Play size={16} className="text-violet-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{lesson.title}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Clock size={10} /> {lesson.duration}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default MicroLearning
