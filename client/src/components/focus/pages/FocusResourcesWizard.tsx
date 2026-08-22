/**
 * FocusResourcesWizard — NPF-anpassat val av vad man vill titta på.
 *
 * ## Vad som var fel (rättat 2026-08-22)
 *
 * Guiden lät användaren välja mellan **CV-mallar, Brevmallar, Checklistor och
 * Guider** och avslutade med "Öppna resurssidan i normalläge för att se
 * resurser i denna kategori". Ingen av de fyra kategorierna finns på
 * `/resources` — sidan har sparade CV-versioner, personliga brev, sparade jobb
 * och bokmärkta artiklar. Valet skickades dessutom ingenstans: `type` användes
 * bara för att aktivera Nästa-knappen, och efter avslutad guide låg man på
 * `?tab=all`, ofiltrerat.
 *
 * En guide som ber någon välja och sedan slänger valet är sämre än ingen
 * guide — särskilt för den målgrupp fokusläget finns till för.
 *
 * Nu motsvarar alternativen sidans faktiska flikar, och valet sätter `?tab=`
 * när guiden avslutas. De fyra språknycklarna `focus.resources.type*` fanns
 * inte i vare sig sv.json eller en.json, så en engelsk användare fick fyra
 * svenska alternativ i en i övrigt översatt ram; de är borta till förmån för
 * `resources.tabs.*`, som finns i båda filerna.
 *
 * Markeringen av valt alternativ var enbart en kantfärg — samma sorts
 * osynlighet som `SidRail`s `markering` infördes för att avskaffa. Nu är det
 * en `radiogroup` med `aria-checked`.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Bookmark, Smile, Check } from '@/components/ui/icons'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

/** Speglar flikarna i `pages/Resources.tsx`. Håll dem i takt. */
const AVSNITT = [
  { id: 'documents', nyckel: 'resources.tabs.documents' },
  { id: 'jobs', nyckel: 'resources.tabs.jobs' },
  { id: 'articles', nyckel: 'resources.tabs.articles' },
  { id: 'all', nyckel: 'resources.tabs.all' },
] as const

export function FocusResourcesWizard({ onExit }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [val, setVal] = useState<string | null>(null)

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    { id: 'type', icon: Bookmark, title: t('focus.resources.typeTitle', 'Vad vill du titta på?') },
    { id: 'done', icon: Smile, title: t('focus.resources.doneTitle', 'Bra val!') },
  ] as const

  const current = STEPS[step]
  const valdEtikett = val ? t(AVSNITT.find((a) => a.id === val)!.nyckel) : ''

  return (
    <FocusWizardFrame
      steps={STEPS}
      current={step}
      onNext={async () => {
        if (current.id === 'done') {
          // Valet ska faktiskt leda någonstans. Fliken sätts innan fokusläget
          // stängs, så normalvyn öppnar på rätt avsnitt.
          if (val) navigate(`/resources?tab=${val}`, { replace: true })
          onExit()
          return
        }
        setStep((s) => s + 1)
      }}
      onBack={() => setStep((s) => Math.max(s - 1, 0))}
      onExit={onExit}
      canNext={current.id === 'type' ? val != null : true}
    >
      {current.id === 'type' && (
        <div
          role="radiogroup"
          aria-label={t('focus.resources.typeTitle', 'Vad vill du titta på?')}
          className="space-y-2"
        >
          {AVSNITT.map((avsnitt) => {
            const vald = val === avsnitt.id
            return (
              <button
                key={avsnitt.id}
                type="button"
                role="radio"
                aria-checked={vald}
                onClick={() => setVal(avsnitt.id)}
                className={`w-full px-4 py-4 rounded-xl text-left border-2 flex items-center justify-between gap-3 ${
                  vald
                    ? 'border-[var(--c-solid)] bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20'
                    : 'border-stone-200 dark:border-stone-700'
                }`}
              >
                <span className="text-base text-stone-800 dark:text-stone-100">{t(avsnitt.nyckel)}</span>
                {/* Kantfärgen ensam är osynlig för en skärmläsare, och svag för
                    den som ser dåligt. En bock säger samma sak en gång till. */}
                {vald && <Check size={20} className="text-[var(--c-text)] flex-shrink-0" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      )}
      {current.id === 'done' && (
        <p className="text-stone-700 dark:text-stone-300">
          {t('focus.resources.doneText', 'Vi öppnar {{avsnitt}} åt dig när du lämnar fokusläget.', {
            avsnitt: valdEtikett,
          })}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusResourcesWizard
