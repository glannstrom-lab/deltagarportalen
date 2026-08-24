/**
 * "Dina förutsättningar" — hur användaren själv beskrev vad som fungerar i
 * arbete. Åtta självskattningsfrågor, sex domäner.
 *
 * Granskad 2026-08-21. Tre saker var fel, och de förstärkte varandra:
 *
 * 1. **Skalan.** `calculateUserProfile` gav `normalizedValue * 5`, alltså 0 för
 *    lägsta svar och **2,5 för ett mittensvar**. Talet renderades rått som
 *    "2.5/5". Skalan är rättad i `interestGuideData.ts` (nu 1–5).
 * 2. **Trösklarna.** `< 3` klassades som "Utmanande – anpassningar
 *    rekommenderas" i **rött**. Kombinerat med skalfelet betydde det att den
 *    som svarade mitt på skalan fick rött ljus på sin kognition. Tre verkliga
 *    användare i prod har kognitiv/koncentration/sensorisk lagrade som exakt
 *    2,5 — de har alltså sett det.
 * 3. **Språket.** "Utmanande", "Stark förutsättning", "ICF-bedömning" och ett
 *    rött/gult/grönt trafikljus är omdömen om personen. Målgruppen är
 *    långtidsarbetslösa med fysiska och psykiska utmaningar. En jobbportal
 *    ska inte betygsätta någons hjärna.
 *
 * Vad som gäller nu: avsnittet refererar användarens egna svar och kopplar dem
 * till anpassningar att prata vidare om. Ingen färgskala, inga omdömen, inget
 * ICF-namn i gränssnittet. Anpassningsförslagen visas för alla domäner där
 * användaren angett att något är svårare — som förslag, inte recept.
 */
import { type ICFScores, type ProfileCoverage } from '@/services/interestGuideData'
import { useIcfAnpassningar } from '@/services/useIntresseguideInnehall'
import { Brain, MessageCircle, Focus, Hand, Ear, Zap } from '@/components/ui/icons'

interface ICFSectionProps {
  scores: ICFScores
  /** Hur många frågor varje domän vilar på. Utan svar visas inget tal. */
  coverage?: ProfileCoverage['icf']
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
  kognitiv: 'Att tänka, planera och komma ihåg',
  kommunikation: 'Att prata, lyssna och samarbeta',
  koncentration: 'Att fokusera och hålla uppmärksamheten',
  motorik: 'Rörlighet och stadiga händer',
  sensorisk: 'Ljud, ljus och andra sinnesintryck',
  energi: 'Ork och uthållighet',
}

/**
 * Vad användaren svarade, i klartext. Beskriver svaret — inte personen.
 * Skalan är densamma som i frågan (1–5), så texten går att spåra tillbaka.
 */
function svarstext(score: number): string {
  if (score >= 4.5) return 'Du svarade att det här fungerar mycket bra för dig'
  if (score >= 3.5) return 'Du svarade att det här fungerar bra för dig'
  if (score >= 2.5) return 'Du svarade att det här fungerar delvis'
  if (score >= 1.5) return 'Du svarade att det här är svårare för dig'
  return 'Du svarade att det här är svårt för dig'
}

export function ICFSection({ scores, coverage }: ICFSectionProps) {
  const icfAdaptations = useIcfAnpassningar()
  const entries = Object.entries(scores) as [keyof ICFScores, number][]

  return (
    <div className="space-y-4">
      {entries.map(([key, score]) => {
        const Icon = icfIcons[key]
        const name = icfNames[key]
        const adaptation = icfAdaptations[key]
        // Ingen täckning = ingen fråga besvarad i den domänen. Visa inget tal.
        const harUnderlag = coverage ? coverage[key] > 0 : true

        return (
          <div
            key={key}
            className="p-4 rounded-xl border border-[var(--c-accent)] bg-[var(--c-bg)]"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-white/60 dark:bg-white/10">
                <Icon className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center flex-wrap gap-1">
                  <span className="font-semibold text-sm text-stone-800 dark:text-stone-100">{name}</span>
                  {harUnderlag && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/70 dark:bg-white/10 font-medium text-stone-700 dark:text-stone-300 tabular-nums">
                      {score} av 5
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5 text-stone-700 dark:text-stone-300">
                  {harUnderlag ? svarstext(score) : 'Du har inte svarat på den här delen än'}
                </p>
                {harUnderlag && (
                  <div className="h-2 bg-white/60 dark:bg-white/10 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-[var(--c-solid)] rounded-full transition-all duration-500"
                      style={{ width: `${(score / 5) * 100}%` }}
                      aria-hidden="true"
                    />
                  </div>
                )}
              </div>
            </div>

            {harUnderlag && score < 3.5 && adaptation && (
              <div className="mt-3 pt-3 border-t border-[var(--c-accent)]">
                {/* "Rekommenderade anpassningar" lät som ett recept från någon
                    med mandat att skriva ut det. Det här är uppslag att ta med
                    till sin konsulent. */}
                <p className="text-sm font-medium mb-2 text-stone-800 dark:text-stone-100">
                  Sånt som brukar hjälpa — värt att prata om
                </p>
                <ul className="text-sm space-y-1 text-stone-700 dark:text-stone-300">
                  {adaptation.adaptations.slice(0, 2).map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-xs mt-1" aria-hidden="true">•</span>
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
