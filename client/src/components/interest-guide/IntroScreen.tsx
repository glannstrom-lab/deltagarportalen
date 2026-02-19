import { Search, Brain, BarChart3, Target, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface IntroScreenProps {
  onStart: () => void
  onContinue?: () => void
  hasSavedProgress: boolean
}

const features = [
  {
    icon: Search,
    title: 'RIASEC',
    description: 'Upptäck din Holland-kod och vilka yrkestyper som passar dig',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Brain,
    title: 'Big Five',
    description: 'Förstå din personlighet och hur den påverkar yrkesval',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: BarChart3,
    title: 'ICF & Fysiska krav',
    description: 'Identifiera dina förutsättningar och vilka anpassningar som kan hjälpa',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Target,
    title: 'Personliga matchningar',
    description: 'Få rekommendationer med yrken som passar just din profil',
    color: 'from-amber-500 to-orange-500',
  },
]

export function IntroScreen({ onStart, onContinue, hasSavedProgress }: IntroScreenProps) {
  return (
    <div className="max-w-3xl mx-auto text-center transition-all duration-500">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl mb-6">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Intresseguide
        </h1>
        <p className="text-xl text-gray-500">
          Hitta yrken som passar dig
        </p>
      </div>

      {/* Intro text */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 mb-8">
        <p className="text-gray-700 leading-relaxed">
          Välkommen till vår omfattande intresseguide! Genom att svara på{' '}
          <strong className="text-indigo-700">40 optimerade frågor</strong> om dina intressen, 
          personlighet och förutsättningar hjälper vi dig att hitta yrken som passar just dig. 
          Testet bygger på vetenskapliga modeller som RIASEC, Big Five och ICF.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <div
              key={feature.title}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg mb-3`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-500">{feature.description}</p>
            </div>
          )
        })}
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={onStart}
          size="lg"
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-10 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
        >
          Starta guiden
        </Button>
        
        {hasSavedProgress && onContinue && (
          <Button
            onClick={onContinue}
            variant="outline"
            size="lg"
            className="border-green-500 text-green-700 hover:bg-green-50 px-10 py-6 text-lg rounded-xl"
          >
            Fortsätt där du slutade
          </Button>
        )}
      </div>

      {/* Info */}
      <p className="text-sm text-gray-400 mt-6">
        Tar cirka 10-15 minuter att slutföra. Dina svar sparas automatiskt.
      </p>
    </div>
  )
}
