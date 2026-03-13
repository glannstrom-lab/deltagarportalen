/**
 * Plan Tab - Career plan (existing CareerPlan content)
 */
import { useState } from 'react'
import { 
  Target, MapPin, Flag, Calendar, CheckCircle, Clock,
  Sparkles, ChevronRight, Plus
} from 'lucide-react'
import { Card, Button } from '@/components/ui'

interface Milestone {
  id: string
  title: string
  timeframe: string
  completed: boolean
  steps: string[]
}

export default function PlanTab() {
  const [currentSituation, setCurrentSituation] = useState('')
  const [goal, setGoal] = useState('')
  const [hasPlan, setHasPlan] = useState(false)
  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      id: '1',
      title: 'Uppdatera CV och LinkedIn',
      timeframe: 'Månad 1-2',
      completed: true,
      steps: ['Lägg till senaste erfarenheter', 'Optimera nyckelord', 'Uppdatera profilbild']
    },
    {
      id: '2',
      title: 'Identifiera målföretag',
      timeframe: 'Månad 2-3',
      completed: false,
      steps: ['Lista 10 drömarbetsgivare', 'Följ dem på LinkedIn', 'Kontakta personer inom företagen']
    },
    {
      id: '3',
      title: 'Skicka ansökningar',
      timeframe: 'Månad 3-6',
      completed: false,
      steps: ['Skräddarsy CV för varje roll', 'Skriv personliga brev', 'Följa upp ansökningar']
    },
  ])

  const generatePlan = () => {
    if (!currentSituation.trim() || !goal.trim()) return
    setHasPlan(true)
  }

  const toggleMilestone = (id: string) => {
    setMilestones(prev => prev.map(m => 
      m.id === id ? { ...m, completed: !m.completed } : m
    ))
  }

  if (!hasPlan) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Skapa din karriärplan</h3>
            <p className="text-slate-600 mt-2">
              Beskvar du är nu och vart du vill komma, så hjälper vi dig att skapa en strukturerad plan.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                Var är du nu?
              </label>
              <textarea
                value={currentSituation}
                onChange={(e) => setCurrentSituation(e.target.value)}
                placeholder="Beskriv din nuvarande situation (t.ex. 'Arbetar som butikssäljare, vill byta till kontorsjobb')"
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-y"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Flag className="w-4 h-4 text-emerald-500" />
                Vart vill du?
              </label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Beskriv ditt mål (t.ex. 'Bli projektledare inom IT med fokus på agila metoder')"
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-y"
              />
            </div>

            <Button 
              onClick={generatePlan}
              disabled={!currentSituation.trim() || !goal.trim()}
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generera karriärplan
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="font-semibold text-slate-800 mb-4">Varför en karriärplan?</h4>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              Ger struktur och riktning i ditt jobbsökande
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              Hjälper dig att bryta ner stora mål till hanterbara steg
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              Gör det lättare att följa upp och justera kursen
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
            <h3 className="text-lg font-bold text-slate-800">Din karriärplan</h3>
            <p className="text-slate-600">Från: {currentSituation}</p>
            <p className="text-slate-600">Till: {goal}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Framsteg</span>
            <span className="text-sm font-bold text-emerald-600">
              {milestones.filter(m => m.completed).length} av {milestones.length} delmål
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
              style={{ width: `${(milestones.filter(m => m.completed).length / milestones.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <div
              key={milestone.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                milestone.completed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleMilestone(milestone.id)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    milestone.completed
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {milestone.completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </button>

                <div className="flex-1">
                  <h4 className={`font-semibold ${
                    milestone.completed ? 'text-green-700 line-through' : 'text-slate-800'
                  }`}>
                    {milestone.title}
                  </h4>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    {milestone.timeframe}
                  </p>

                  <ul className="mt-3 space-y-1">
                    {milestone.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="text-sm text-slate-600 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button 
          variant="outline" 
          className="w-full mt-4"
          onClick={() => setHasPlan(false)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Uppdatera plan
        </Button>
      </Card>
    </div>
  )
}
