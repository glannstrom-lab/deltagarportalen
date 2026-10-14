/**
 * Yrkena matchningen lämnat bort på grund av en belastningskrock — med skälet.
 *
 * Har användaren angett stora besvär med något (t.ex. ljud och ljus) visas
 * inte yrken där just det är centralt (se `Belastning` i interestGuideData.ts).
 * En lista som tyst blir kortare ser ut som att guiden inte hittade fler, så
 * vyn säger hur många som utelämnats och varför. Listan ligger bakom en
 * <details> — den är en redovisning, inte en ny rekommendation.
 */
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { EyeOff } from '@/components/ui/icons'
import {
  uteslutnaYrken,
  belastningNamn,
  type Occupation,
  type UserProfile,
} from '@/services/interestGuideData'

interface Props {
  profile: UserProfile
  filterUniversity?: boolean | null
  /** Den översatta yrkeslistan (useYrken), så namnen följer språket. */
  yrken: Occupation[]
}

export function UteslutnaYrken({ profile, filterUniversity, yrken }: Props) {
  const { t } = useTranslation()
  const uteslutna = useMemo(
    () => uteslutnaYrken(profile, filterUniversity, yrken),
    [profile, filterUniversity, yrken]
  )

  if (uteslutna.length === 0) return null

  return (
    <details className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 text-sm">
      <summary className="cursor-pointer font-medium text-stone-800 dark:text-stone-100 flex items-start gap-2">
        <EyeOff className="w-4 h-4 mt-0.5 shrink-0 text-stone-600 dark:text-stone-300" aria-hidden="true" />
        <span>{t('interestGuide.uteslutna.summary', { count: uteslutna.length })}</span>
      </summary>
      <p className="mt-3 text-stone-700 dark:text-stone-300">{t('interestGuide.uteslutna.lead')}</p>
      <ul className="mt-2 space-y-1 text-stone-700 dark:text-stone-300 list-disc pl-5">
        {uteslutna.map(({ occupation, krockar }) => (
          <li key={occupation.id}>
            {t('interestGuide.uteslutna.rad', {
              yrke: occupation.name,
              omrade: krockar
                .map(k => t(belastningNamn[k.belastning][0], belastningNamn[k.belastning][1]))
                .join(t('interestGuide.match.and', ' och ')),
            })}
          </li>
        ))}
      </ul>
    </details>
  )
}
