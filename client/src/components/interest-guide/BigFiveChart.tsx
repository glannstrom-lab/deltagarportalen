import { useTranslation } from 'react-i18next'
import { type BigFiveScores } from '@/services/interestGuideData'
import { useBigFiveNamn } from '@/services/useIntresseguideInnehall'

interface BigFiveChartProps {
  scores: BigFiveScores
}

/**
 * Fem staplar, en per drag.
 *
 * Designpasset 2026-10-09: staplarna var röda under 40, gula till 70 och
 * gröna över — ett trafikljus som läste som ett betyg ("låg extraversion" i
 * rött). Draget har ingen rätt riktning, och sidan har en hubbfärg. Nu har
 * alla staplar samma färg. Beskrivningsraden under varje stapel står i
 * "Förstå dina personlighetsdrag" i ResultsView, och nivåordet ("hög",
 * "medel", "låg") i skärmläsartexten var hårdkodad svenska — nu via t().
 */
export function BigFiveChart({ scores }: BigFiveChartProps) {
  const { t } = useTranslation()
  const bigFiveNames = useBigFiveNamn()
  const entries = Object.entries(scores) as [keyof BigFiveScores, number][]

  return (
    <div className="space-y-3" role="list" aria-label={t('interestGuide.charts.bigFiveAria', 'Big Five personlighetsdrag')}>
      {entries.map(([key, score]) => {
        const info = bigFiveNames[key]
        const niva = score >= 70
          ? t('interestGuide.charts.levelHigh', 'hög')
          : score >= 40
            ? t('interestGuide.charts.levelMedium', 'medel')
            : t('interestGuide.charts.levelLow', 'låg')

        return (
          <div key={key} role="listitem">
            <div className="flex justify-between items-center mb-1">
              <span id={`bigfive-label-${key}`} className="text-sm font-medium text-stone-800 dark:text-stone-100">
                {info.name}
              </span>
              <span className="text-sm tabular-nums text-stone-700 dark:text-stone-300" aria-hidden="true">
                {score}%
              </span>
            </div>
            <div
              className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-labelledby={`bigfive-label-${key}`}
              aria-valuetext={t('interestGuide.charts.bigFiveValue', '{{namn}}: {{score}} procent, {{niva}} nivå', { namn: info.name, score, niva })}
            >
              <div
                className="h-full bg-[var(--c-solid)] rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${score}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
