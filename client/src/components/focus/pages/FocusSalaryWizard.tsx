/**
 * FocusSalaryWizard — NPF-anpassad lönekoll.
 *
 * Guiden frågade tidigare efter roll och stad som fritext och avslutade med
 * "öppna lönesidan i normalläge för att se en uppskattning". Svaren skickades
 * ingenstans, och normalvyn har inget fritextfält att skriva in dem i — två
 * frågor utan resultat, i det läge som finns för den som orkar minst.
 *
 * Nu väljer man i samma tre listor som kalkylatorn använder, valen delas med
 * normalvyn (tillståndet bor i `pages/Salary.tsx`), och sista steget visar
 * själva siffran. Ett val per skärm, enligt kontraktet i PageFocusShell.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Wallet, MapPin, TrendingUp, Smile } from '@/components/ui/icons'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'
import { cn } from '@/lib/utils'
import { YRKESOMRADEN, LONEREGIONER, ERFARENHETSNIVAER, beraknaLonespann } from '@/data/lonedata'
import { beraknaNetto } from '@/lib/skatt'
import type { Loneval } from '@/pages/Salary'

interface Props {
  val: Loneval
  onValChange: (val: Loneval) => void
  onExit: () => void
}

export function FocusSalaryWizard({ val, onValChange, onExit }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    { id: 'role', icon: Wallet, title: t('focus.salary.roleTitle') },
    { id: 'city', icon: MapPin, title: t('focus.salary.cityTitle') },
    { id: 'experience', icon: TrendingUp, title: t('focus.salary.experienceTitle') },
    { id: 'done', icon: Smile, title: t('focus.salary.doneTitle') },
  ] as const

  const current = STEPS[step]
  const lonespann = beraknaLonespann(val.yrke, val.region, val.erfarenhet)
  const netto = lonespann ? beraknaNetto(lonespann.median) : null

  const valjknapp = (aktiv: boolean) =>
    cn(
      'w-full text-left px-4 py-3 rounded-xl border text-lg min-h-[48px] transition-colors',
      aktiv
        ? 'bg-[var(--c-solid)] text-white border-[var(--c-solid)]'
        : 'bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 border-stone-200 dark:border-stone-700',
    )

  const kanGaVidare =
    current.id === 'role' ? Boolean(val.yrke)
      : current.id === 'city' ? Boolean(val.region)
      : current.id === 'experience' ? Boolean(val.erfarenhet)
      : true

  return (
    <FocusWizardFrame
      steps={STEPS}
      current={step}
      onNext={async () => {
        if (current.id === 'done') {
          onExit()
          return
        }
        setStep((s) => s + 1)
      }}
      onBack={() => setStep((s) => Math.max(s - 1, 0))}
      onExit={onExit}
      canNext={kanGaVidare}
    >
      {current.id === 'role' && (
        <ul className="space-y-2">
          {YRKESOMRADEN.map((y) => (
            <li key={y.nyckel}>
              <button
                type="button"
                aria-pressed={val.yrke === y.namn}
                onClick={() => onValChange({ ...val, yrke: y.namn })}
                className={valjknapp(val.yrke === y.namn)}
              >
                {t(`salary.data.occupations.${y.nyckel}`, y.namn)}
              </button>
            </li>
          ))}
        </ul>
      )}

      {current.id === 'city' && (
        <ul className="space-y-2">
          {LONEREGIONER.map((r) => (
            <li key={r.nyckel}>
              <button
                type="button"
                aria-pressed={val.region === r.namn}
                onClick={() => onValChange({ ...val, region: r.namn })}
                className={valjknapp(val.region === r.namn)}
              >
                {t(`salary.data.regions.${r.nyckel}`, r.namn)}
              </button>
            </li>
          ))}
        </ul>
      )}

      {current.id === 'experience' && (
        <ul className="space-y-2">
          {ERFARENHETSNIVAER.map((e) => (
            <li key={e.nyckel}>
              <button
                type="button"
                aria-pressed={val.erfarenhet === e.namn}
                onClick={() => onValChange({ ...val, erfarenhet: e.namn })}
                className={valjknapp(val.erfarenhet === e.namn)}
              >
                {t(`salary.data.experience.${e.nyckel}`, e.namn)}
              </button>
            </li>
          ))}
        </ul>
      )}

      {current.id === 'done' && (
        <div className="space-y-4" role="status" aria-live="polite">
          {lonespann && netto ? (
            <>
              <p className="text-stone-700 dark:text-stone-200">
                {t('focus.salary.resultIntro', {
                  role: t(`salary.data.occupations.${YRKESOMRADEN.find(y => y.namn === val.yrke)?.nyckel ?? ''}`, val.yrke),
                  city: t(`salary.data.regions.${LONEREGIONER.find(r => r.namn === val.region)?.nyckel ?? ''}`, val.region),
                })}
              </p>
              <p className="text-3xl font-bold text-[var(--c-text)] dark:text-[var(--c-text)]">
                {lonespann.median.toLocaleString('sv-SE')} kr
                <span className="block text-base font-normal text-stone-600 dark:text-stone-300">
                  {t('focus.salary.perMonthBeforeTax')}
                </span>
              </p>
              <p className="text-stone-700 dark:text-stone-200">
                {t('focus.salary.netLine', { amount: netto.nettoManad.toLocaleString('sv-SE') })}
              </p>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                {t('salary.calculator.estimateNotice')}
              </p>
            </>
          ) : (
            <p className="text-stone-700 dark:text-stone-200">{t('focus.salary.missingChoice')}</p>
          )}
        </div>
      )}
    </FocusWizardFrame>
  )
}

export default FocusSalaryWizard
