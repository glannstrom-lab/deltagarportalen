import { Search, Brain, Activity, Sparkles, Clock, CheckCircle2, ArrowRight, UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface IntroScreenProps {
  onStart: () => void
  onContinue?: () => void
  hasSavedProgress: boolean
}

const sections = [
  {
    icon: Search,
    name: 'Arbetsintressen',
    description: 'Vilka typer av arbete tilltalar dig?',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    questions: 6,
  },
  {
    icon: Brain,
    name: 'Personlighet',
    description: 'Hur skulle du beskriva dig själv?',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    questions: 10,
  },
  {
    icon: UserCircle,
    name: 'Intresseområden',
    description: 'Vad tycker du är intressant?',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    questions: 10,
  },
  {
    icon: Activity,
    name: 'Dina förutsättningar',
    description: 'Hur upplever du dina kapaciteter?',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    questions: 8,
  },
]

export function IntroScreen({ onStart, onContinue, hasSavedProgress }: IntroScreenProps) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200 mb-5">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Intresseguide
        </h1>
        <p className="text-gray-500">
          Upptäck vilka yrken som passar just din profil
        </p>
      </div>

      {/* What's included */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          Detta får du
        </h2>
        
        <div className="space-y-3">
          {[
            'Personlig RIASEC-profil med yrkestyper som matchar',
            'Big Five-analys av din personlighet',
            'ICF-bedömning av dina funktionsförutsättningar',
            'Matchning med 80+ yrken och anpassningsförslag',
          ].map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sections preview */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">4 delar att besvara</h2>
        
        <div className="space-y-3">
          {sections.map((section, index) => {
            const Icon = section.icon
            return (
              <div 
                key={section.name}
                className="flex items-center gap-4 p-3 rounded-xl bg-gray-50"
              >
                <div className={`w-10 h-10 rounded-xl ${section.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${section.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 text-sm">{section.name}</h3>
                  <p className="text-xs text-gray-500">{section.description}</p>
                </div>
                <span className="text-xs text-gray-400">{section.questions} frågor</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Info bar */}
      <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mb-8">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>~10 minuter</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" />
          <span>34 frågor totalt</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        {hasSavedProgress && onContinue ? (
          <>
            <Button
              onClick={onContinue}
              size="lg"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-6 text-base rounded-xl shadow-lg shadow-green-200"
            >
              Fortsätt där du slutade
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              onClick={onStart}
              variant="outline"
              size="lg"
              className="w-full py-6 text-base rounded-xl"
            >
              Börja om från början
            </Button>
          </>
        ) : (
          <Button
            onClick={onStart}
            size="lg"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6 text-base rounded-xl shadow-lg shadow-indigo-200"
          >
            Starta Intresseguiden
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>

      {/* Footer note */}
      <p className="text-xs text-center text-gray-400 mt-6">
        Dina svar sparas automatiskt så du kan pausa och fortsätta när du vill.
      </p>
    </div>
  )
}
