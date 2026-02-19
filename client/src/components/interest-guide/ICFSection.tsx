import { icfAdaptations, type ICFScores } from '@/services/interestGuideData'
import { Brain, MessageCircle, Focus, Hand, Ear, Zap } from 'lucide-react'

interface ICFSectionProps {
  scores: ICFScores
}

const icfIcons: Record<string, typeof Brain> = {
  kognitiv: Brain,
  kommunikation: MessageCircle,
  koncentration: Focus,
  motorik: Hand,
  sensorisk: Ear,
  energi: Zap,
}

const icfNames: Record<string, string> = {
  kognitiv: 'Kognitiv funktion',
  kommunikation: 'Kommunikation',
  koncentration: 'Koncentration',
  motorik: 'Motorik',
  sensorisk: 'Sensorisk',
  energi: 'Energi',
}

export function ICFSection({ scores }: ICFSectionProps) {
  const entries = Object.entries(scores) as [keyof ICFScores, number][]

  return (
    <div className="space-y-4">
      {entries.map(([key, score]) => {
        const Icon = icfIcons[key]
        const name = icfNames[key]
        const adaptation = icfAdaptations[key]
        
        const getColor = (s: number) => {
          if (s >= 4) return 'text-green-600 bg-green-50 border-green-200'
          if (s >= 3) return 'text-amber-600 bg-amber-50 border-amber-200'
          return 'text-red-600 bg-red-50 border-red-200'
        }

        const getBarColor = (s: number) => {
          if (s >= 4) return 'from-green-500 to-emerald-500'
          if (s >= 3) return 'from-amber-500 to-yellow-500'
          return 'from-red-500 to-orange-500'
        }

        return (
          <div 
            key={key} 
            className={`p-4 rounded-xl border ${getColor(score)}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-white/50">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{name}</span>
                  <span className="text-sm font-medium">{score}/5</span>
                </div>
                <div className="h-2 bg-white/50 rounded-full mt-1 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getBarColor(score)} rounded-full transition-all duration-500`}
                    style={{ width: `${(score / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            
            {score < 3 && adaptation && (
              <div className="mt-3 pt-3 border-t border-current/20">
                <p className="text-sm font-medium mb-2">Rekommenderade anpassningar:</p>
                <ul className="text-sm space-y-1">
                  {adaptation.adaptations.slice(0, 2).map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-xs mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
