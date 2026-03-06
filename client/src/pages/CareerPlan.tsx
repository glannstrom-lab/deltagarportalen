import { useState } from 'react'
import { MapPin, Flag, Calendar, Target, Sparkles, RefreshCw, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function CareerPlan() {
  const [nuvarande, setNuvarande] = useState('')
  const [mal, setMal] = useState('')
  const [tidsram, setTidsram] = useState('6 månader')
  const [hinder, setHinder] = useState('')
  const [plan, setPlan] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const skapaPlan = async () => {
    if (!nuvarande.trim() || !mal.trim()) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/karriarplan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuvarande, mal, tidsram, hinder })
      })
      
      if (!response.ok) throw new Error('AI error')
      const data = await response.json()
      setPlan(data.plan)
    } catch (error) {
      setPlan(`DIN KARRIÄRPLAN\n\nNUVARANDE: ${nuvarande}\nMÅL: ${mal}\nTIDSPLAN: ${tidsram}\n\nVÄGEN FRAMÅT:\n\n1. DELMÅL (Månad 1-2)\n   • Uppdatera CV och LinkedIn\n   • Identifiera 10 målföretag\n   • Skapa ansökningsmallar\n\n2. DELMÅL (Månad 3-4)\n   • Skicka 5 ansökningar/vecka\n   • Nätverka med 2 nya kontakter/vecka\n   • Öva på intervjuer\n\n3. DELMÅL (Månad 5-6)\n   • Följa upp ansökningar\n   • Gå på intervjuer\n   • Förhandla erbjudanden`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 mb-2">
          <MapPin className="w-7 h-7 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Min Karriärplan</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Skapa en strukturerad plan från där du är nu till ditt karriärmål, med konkreta steg och tidslinje.
        </p>
      </div>

      {/* Input Form */}
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              Var är du nu?
            </label>
            <textarea
              value={nuvarande}
              onChange={(e) => setNuvarande(e.target.value)}
              placeholder="Beskriv din nuvarande situation (t.ex. 'Arbetar som butikssäljare, vill byta till kontorsjobb')"
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-y"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Flag className="w-4 h-4 text-emerald-500" />
              Vart vill du?
            </label>
            <textarea
              value={mal}
              onChange={(e) => setMal(e.target.value)}
              placeholder="Beskriv ditt mål (t.ex. 'Bli projektledare inom IT med fokus på agila metoder')"
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-y"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                Tidsplan
              </label>
              <select
                value={tidsram}
                onChange={(e) => setTidsram(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
              >
                <option value="3 månader">3 månader (Intensivt)</option>
                <option value="6 månader">6 månader (Rekommenderat)</option>
                <option value="12 månader">12 månader (Långsiktigt)</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Target className="w-4 h-4 text-slate-400" />
                Eventuella hinder
              </label>
              <input
                type="text"
                value={hinder}
                onChange={(e) => setHinder(e.target.value)}
                placeholder="(Valfritt) t.ex. 'Saknar erfarenhet inom...'"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
              />
            </div>
          </div>

          <Button
            onClick={skapaPlan}
            disabled={!nuvarande.trim() || !mal.trim() || isLoading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600"
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Skapa min karriärplan
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Timeline Visualization */}
      {plan && (
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
            Din personliga karriärplan
          </h2>
          
          <div className="bg-white p-6 rounded-lg border border-emerald-100">
            <pre className="whitespace-pre-wrap text-slate-700 font-sans leading-relaxed">
              {plan}
            </pre>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Tidsplan: {tidsram}</span>
            </div>
            <span>•</span>
            <div>Uppdatera planen månadsvis</div>
          </div>
        </Card>
      )}
    </div>
  )
}
