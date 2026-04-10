/**
 * Culture Tab - Company culture matching
 */
import { useState, useEffect } from 'react'
import { Building2, Heart, CheckCircle, Circle, Sparkles, TrendingUp, AlertCircle } from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface CultureValue {
  id: string
  label: string
  description: string
  category: 'work-life' | 'growth' | 'environment' | 'leadership'
}

const CULTURE_VALUES: CultureValue[] = [
  // Work-life balance
  { id: 'remote', label: 'Distansarbete', description: 'Möjlighet att jobba hemifrån', category: 'work-life' },
  { id: 'flexible-hours', label: 'Flexibla tider', description: 'Själv bestämma arbetstider', category: 'work-life' },
  { id: 'vacation', label: 'Generös semester', description: 'Mer än lagstadgad semester', category: 'work-life' },
  { id: 'parental', label: 'Föräldravänligt', description: 'Stöd för föräldrar', category: 'work-life' },

  // Growth
  { id: 'learning', label: 'Lärande', description: 'Budget för utbildning', category: 'growth' },
  { id: 'career-path', label: 'Karriärvägar', description: 'Tydliga utvecklingsmöjligheter', category: 'growth' },
  { id: 'mentoring', label: 'Mentorskap', description: 'Strukturerat mentorprogram', category: 'growth' },
  { id: 'internal-mobility', label: 'Intern rörlighet', description: 'Byta roll inom företaget', category: 'growth' },

  // Environment
  { id: 'diversity', label: 'Mångfald', description: 'Fokus på inkludering', category: 'environment' },
  { id: 'sustainability', label: 'Hållbarhet', description: 'Miljöfokus', category: 'environment' },
  { id: 'social', label: 'Socialt', description: 'Teamaktiviteter och events', category: 'environment' },
  { id: 'modern-office', label: 'Modern arbetsplats', description: 'Fräsch kontorsmiljö', category: 'environment' },

  // Leadership
  { id: 'flat', label: 'Platt organisation', description: 'Lite hierarki', category: 'leadership' },
  { id: 'autonomy', label: 'Självständighet', description: 'Frihet i arbetet', category: 'leadership' },
  { id: 'transparent', label: 'Transparens', description: 'Öppen kommunikation', category: 'leadership' },
  { id: 'feedback', label: 'Feedbackkultur', description: 'Regelbunden återkoppling', category: 'leadership' },
]

const CATEGORIES = {
  'work-life': { label: 'Balans', color: 'blue' },
  'growth': { label: 'Utveckling', color: 'emerald' },
  'environment': { label: 'Miljö', color: 'amber' },
  'leadership': { label: 'Ledarskap', color: 'teal' },
}

export function CultureTab() {
  const [selectedValues, setSelectedValues] = useState<string[]>([])
  const [showResults, setShowResults] = useState(false)

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('culture-preferences')
    if (saved) {
      setSelectedValues(JSON.parse(saved))
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('culture-preferences', JSON.stringify(selectedValues))
  }, [selectedValues])

  const toggleValue = (id: string) => {
    setSelectedValues(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    )
  }

  const getTopPriorities = () => {
    const categoryCount: Record<string, number> = {}
    selectedValues.forEach(id => {
      const value = CULTURE_VALUES.find(v => v.id === id)
      if (value) {
        categoryCount[value.category] = (categoryCount[value.category] || 0) + 1
      }
    })
    return Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([cat]) => CATEGORIES[cat as keyof typeof CATEGORIES].label)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-rose-50 to-pink-50 border-rose-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
            <Heart className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Kulturpreferenser</h2>
            <p className="text-slate-600 mt-1">
              Välj vad som är viktigt för dig i en arbetsplats.
              Detta hjälper dig hitta företag som passar din stil.
            </p>
          </div>
        </div>
      </Card>

      {/* Selection count */}
      {selectedValues.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-teal-50 rounded-xl border border-teal-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <span className="font-medium text-teal-900">
              {selectedValues.length} värderingar valda
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowResults(!showResults)}
          >
            {showResults ? 'Dölj analys' : 'Visa analys'}
          </Button>
        </div>
      )}

      {/* Analysis */}
      {showResults && selectedValues.length > 0 && (
        <Card className="border-teal-200">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            Din profil
          </h3>
          <p className="text-slate-600 mb-4">
            Baserat på dina val prioriterar du främst: <strong>{getTopPriorities().join(' och ')}</strong>
          </p>

          <div className="p-4 bg-teal-50 rounded-xl">
            <p className="text-sm text-teal-800">
              <strong>Tips vid jobbsökning:</strong>
            </p>
            <ul className="text-sm text-teal-700 mt-2 space-y-1">
              <li>• Fråga om dessa aspekter på intervjun</li>
              <li>• Kolla företagets recensioner på Glassdoor</li>
              <li>• Leta efter ledtrådar i jobbannonsen</li>
              <li>• Prata med anställda på LinkedIn</li>
            </ul>
          </div>
        </Card>
      )}

      {/* Values by category */}
      {Object.entries(CATEGORIES).map(([categoryKey, category]) => (
        <Card key={categoryKey}>
          <h3 className="font-semibold text-slate-900 mb-4">{category.label}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CULTURE_VALUES.filter(v => v.category === categoryKey).map((value) => {
              const isSelected = selectedValues.includes(value.id)
              return (
                <button
                  key={value.id}
                  onClick={() => toggleValue(value.id)}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border transition-all text-left",
                    isSelected
                      ? "bg-teal-50 border-teal-300 ring-2 ring-teal-200"
                      : "bg-slate-50 border-slate-100 hover:border-slate-200"
                  )}
                >
                  {isSelected ? (
                    <CheckCircle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={cn(
                      "font-medium",
                      isSelected ? "text-teal-900" : "text-slate-800"
                    )}>
                      {value.label}
                    </p>
                    <p className={cn(
                      "text-sm",
                      isSelected ? "text-teal-600" : "text-slate-700"
                    )}>
                      {value.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      ))}

      {/* Red flags */}
      <Card className="bg-amber-50 border-amber-100">
        <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          Varningssignaler att se upp för
        </h3>
        <ul className="space-y-2 text-sm text-amber-800">
          <li>• "Vi är som en familj" - kan betyda dåliga gränser</li>
          <li>• "Högt tempo" - kan betyda övertid</li>
          <li>• Hög personalomsättning på LinkedIn</li>
          <li>• Dåliga recensioner på Glassdoor</li>
          <li>• Vaga svar om kultur på intervjun</li>
        </ul>
      </Card>

      {/* Reset */}
      {selectedValues.length > 0 && (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => setSelectedValues([])}
          >
            Återställ val
          </Button>
        </div>
      )}
    </div>
  )
}

export default CultureTab
