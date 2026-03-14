/**
 * LearningTab - Mikro-learning och utbildning
 * Lär dig nya färdigheter för jobbsökande
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Play, Clock, CheckCircle2, Award, Star, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { cn } from '@/lib/utils'

// Mock lektioner
const lessons = [
  { id: '1', title: 'Intervjuteknik: De 3 vanligaste frågorna', duration: '3 min', type: 'video', completed: true, category: 'Intervju' },
  { id: '2', title: 'Hur du skriver ett CV som syns för ATS', duration: '5 min', type: 'article', completed: false, category: 'CV' },
  { id: '3', title: 'Nätverkande för introverter', duration: '4 min', type: 'video', completed: false, category: 'Nätverk' },
  { id: '4', title: 'Så hanterar du nervositet inför intervju', duration: '6 min', type: 'video', completed: false, category: 'Psykologi' },
  { id: '5', title: 'LinkedIn-optimering för jobbsökare', duration: '4 min', type: 'article', completed: false, category: 'Nätverk' },
]

const categories = ['Alla', 'CV', 'Intervju', 'Nätverk', 'Psykologi']

export default function LearningTab() {
  const [activeCategory, setActiveCategory] = useState('Alla')
  const [activeLesson, setActiveLesson] = useState<typeof lessons[0] | null>(null)
  const [completed, setCompleted] = useState<string[]>(['1'])

  const filteredLessons = activeCategory === 'Alla' 
    ? lessons 
    : lessons.filter(l => l.category === activeCategory)

  const markComplete = (id: string) => {
    setCompleted([...completed, id])
    setActiveLesson(null)
  }

  const progress = Math.round((completed.length / lessons.length) * 100)

  if (activeLesson) {
    return (
      <div className="space-y-6">
        <button onClick={() => setActiveLesson(null)} className="text-slate-500 hover:text-slate-700 flex items-center gap-1">
          ← Tillbaka till lektioner
        </button>
        
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="aspect-video bg-slate-800 flex items-center justify-center">
            <button className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
              <Play size={32} className="text-white ml-1" />
            </button>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-1 bg-violet-100 text-violet-700 rounded-full">{activeLesson.category}</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock size={12} /> {activeLesson.duration}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">{activeLesson.title}</h2>
            <p className="text-slate-600 mb-6">
              I denna lektion lär du dig de viktigaste strategierna för att lyckas. 
              Vi går igenom praktiska tips som du kan använda direkt.
            </p>
            <Button 
              onClick={() => markComplete(activeLesson.id)}
              className="w-full"
              disabled={completed.includes(activeLesson.id)}
            >
              {completed.includes(activeLesson.id) ? (
                <><CheckCircle2 size={18} className="mr-2" /> Avklarad (+10 XP)</>
              ) : (
                <><CheckCircle2 size={18} className="mr-2" /> Markera som klar (+10 XP)</>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="text-violet-500" size={28} />
          Lärande
        </h2>
        <p className="text-slate-500">Mikro-lektioner för att bli en starkare kandidat</p>
      </div>

      {/* Progress */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">Din progress</span>
          <span className="text-sm font-medium">{completed.length}/{lessons.length} lektioner</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Categories */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors",
              activeCategory === cat
                ? 'bg-violet-100 text-violet-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Lessons */}
      <div className="space-y-3">
        {filteredLessons.map((lesson, index) => (
          <motion.div
            key={lesson.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setActiveLesson(lesson)}
            className={cn(
              "bg-white p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4",
              completed.includes(lesson.id) 
                ? 'border-emerald-200 bg-emerald-50/30' 
                : 'border-slate-200 hover:border-violet-300'
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
              completed.includes(lesson.id) ? 'bg-emerald-100' : 'bg-violet-100'
            )}>
              {completed.includes(lesson.id) ? (
                <CheckCircle2 size={24} className="text-emerald-600" />
              ) : (
                <Play size={20} className="text-violet-600 ml-0.5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={cn("font-semibold", completed.includes(lesson.id) && 'text-slate-500')}>{lesson.title}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full">{lesson.category}</span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock size={12} /> {lesson.duration}
                </span>
              </div>
            </div>
            {completed.includes(lesson.id) && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <Award size={14} /> +10 XP
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
