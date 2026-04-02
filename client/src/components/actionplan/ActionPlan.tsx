/**
 * Action Plan - Strukturerade vägar till målet
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Target, Calendar, CheckCircle2, Clock, ChevronRight } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface Plan {
  id: string
  name: string
  duration: string
  description: string
  weeklyGoals: { week: number; goal: string; completed: boolean }[]
}

const plans: Plan[] = [
  {
    id: 'fast',
    name: 'Snabb väg',
    duration: '3 månader',
    description: 'Intensivt jobbsökande för dig som vill ha jobb snabbt',
    weeklyGoals: [
      { week: 1, goal: 'Färdigställ CV och LinkedIn', completed: true },
      { week: 2, goal: 'Sök 10 jobb', completed: true },
      { week: 3, goal: 'Nätverka med 5 kontakter', completed: false },
    ]
  },
  {
    id: 'balanced',
    name: 'Balanserad väg',
    duration: '6 månader',
    description: 'Hållbart tempo med tid för personlig utveckling',
    weeklyGoals: [
      { week: 1, goal: 'Skapa CV', completed: true },
      { week: 2, goal: 'Sök 5 jobb', completed: false },
      { week: 3, goal: 'Gå en webbkurs', completed: false },
    ]
  }
]

export function ActionPlan() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [activeWeek, setActiveWeek] = useState(2)

  if (selectedPlan) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-slate-200">
        <button onClick={() => setSelectedPlan(null)} className="text-sm text-slate-500 mb-4">← Tillbaka</button>
        <h2 className="text-xl font-bold mb-2">{selectedPlan.name}</h2>
        <p className="text-slate-500 mb-6">{selectedPlan.description}</p>

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Progress</span>
            <span className="font-medium">Vecka {activeWeek} av 12</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(activeWeek / 12) * 100}%` }} className="h-full bg-violet-500 rounded-full" />
          </div>
        </div>

        <div className="space-y-3">
          {selectedPlan.weeklyGoals.map((goal, i) => (
            <div key={i} className={cn(
              "p-4 rounded-xl border flex items-center gap-3",
              goal.completed ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
            )}>
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center",
                goal.completed ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-slate-300'
              )}>
                {goal.completed && <CheckCircle2 size={14} />}
              </div>
              <span className={cn("flex-1", goal.completed && 'line-through text-slate-400')}>{goal.goal}</span>
              <span className="text-xs text-slate-400">Vecka {goal.week}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200">
      <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
        <Target className="text-violet-500" size={24} />
        Välj din väg
      </h2>
      <p className="text-slate-500 mb-6">Strukturerade planer för att nå ditt mål</p>

      <div className="space-y-4">
        {plans.map(plan => (
          <div key={plan.id} onClick={() => setSelectedPlan(plan)} className="p-4 border border-slate-200 rounded-xl hover:border-violet-300 cursor-pointer transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{plan.name}</h3>
              <span className="text-xs px-2 py-1 bg-slate-100 rounded-full">{plan.duration}</span>
            </div>
            <p className="text-sm text-slate-500">{plan.description}</p>
            <div className="flex items-center gap-1 text-violet-600 text-sm mt-3">
              <span>Välj denna väg</span>
              <ChevronRight size={16} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ActionPlan
