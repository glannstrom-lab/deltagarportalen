/**
 * AIX24 + AIX29: språkstöd på AI-teamets sida. Två hopfällda verktyg under
 * chatten. Visas inte alls när organisationen stängt av AI (samma hook som
 * AITeamVerktyg) — de skulle annars vara klickbara utan verkan, och servern
 * nekar ändå.
 */

import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { useOrgAiSparr } from '@/hooks/useOrgAiSparr'
import { ForklaraBrev } from './ForklaraBrev'
import { GorDetMindre } from './GorDetMindre'

export function SprakStod() {
  const { t } = useTranslation()
  const rubrikId = useId()
  const orgSparr = useOrgAiSparr()
  if (orgSparr) return null

  const ruta = 'rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-700/50 dark:bg-stone-800/50'
  const sammanfattning = 'cursor-pointer text-sm font-semibold text-stone-800 dark:text-stone-200'

  return (
    <section aria-labelledby={rubrikId} className="mt-6 space-y-3">
      <h2 id={rubrikId} className="text-sm font-semibold text-stone-700 dark:text-stone-300">
        {t('sprakStod.rubrik', 'Hjälp med brev och stora uppgifter')}
      </h2>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <details className={ruta}>
          <summary className={sammanfattning}>{t('sprakStod.brev.rubrik', 'Jag fick ett brev jag inte förstår')}</summary>
          <div className="mt-3"><ForklaraBrev /></div>
        </details>
        <details className={ruta}>
          <summary className={sammanfattning}>{t('sprakStod.mindre.rubrik', 'Något känns för stort att börja med')}</summary>
          <div className="mt-3"><GorDetMindre /></div>
        </details>
      </div>
    </section>
  )
}

export default SprakStod
