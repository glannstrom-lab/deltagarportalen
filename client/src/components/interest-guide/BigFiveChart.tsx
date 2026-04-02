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
    <div className="space-y-4" role="list" aria-label="Big Five personlighetsdrag">
      {entries.map(([key, score]) => {
        const info = bigFiveNames[key]
        const barColor = getBarColor(score)
        const levelLabel = score >= 70 ? 'hög' : score >= 40 ? 'medel' : 'låg'

        return (
          <div key={key} className="group" role="listitem">
            <div className="flex justify-between items-center mb-1">
              <span id={`bigfive-label-${key}`} className="font-medium text-gray-700">
                {info.name}
              </span>
              <span className="text-sm font-semibold text-gray-900" aria-hidden="true">
                {score}%
              </span>
            </div>
            <div
              className="h-3 bg-gray-200 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-labelledby={`bigfive-label-${key}`}
              aria-valuetext={`${info.name}: ${score} procent, ${levelLabel} nivå`}
            >
              <div
                className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-1000 ease-out group-hover:opacity-90`}
                style={{ width: `${score}%` }}
                aria-hidden="true"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1" id={`bigfive-desc-${key}`}>
              {info.description}
            </p>
          </div>
        )
      })}
    </div>
  )
}
