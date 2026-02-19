import { bigFiveNames, type BigFiveScores } from '@/services/interestGuideData'

interface BigFiveChartProps {
  scores: BigFiveScores
}

export function BigFiveChart({ scores }: BigFiveChartProps) {
  const entries = Object.entries(scores) as [keyof BigFiveScores, number][]
  
  const getBarColor = (score: number) => {
    if (score >= 70) return 'from-green-500 to-emerald-500'
    if (score >= 40) return 'from-amber-500 to-yellow-500'
    return 'from-red-500 to-orange-500'
  }

  return (
    <div className="space-y-4">
      {entries.map(([key, score]) => {
        const info = bigFiveNames[key]
        const barColor = getBarColor(score)
        
        return (
          <div key={key} className="group">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-gray-700">{info.name}</span>
              <span className="text-sm font-semibold text-gray-900">{score}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-1000 ease-out group-hover:opacity-90`}
                style={{ width: `${score}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{info.description}</p>
          </div>
        )
      })}
    </div>
  )
}
