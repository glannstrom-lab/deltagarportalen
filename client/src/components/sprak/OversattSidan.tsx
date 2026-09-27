/**
 * OversattSidan — "Översätt sidan" som en del av språkvalet, också på mobil
 * (RD31, rollspelet 2026-09-27).
 *
 * Knappen fanns bara i toppnaven på dator (`hidden md:block` i TopBar.tsx).
 * En somalisktalande deltagare på mobil hade Svenska, Lätt svenska och English
 * att välja på — inte sitt eget språk. Här är samma maskinöversättning som en
 * enkel lista, utan egen meny, så att den kan ligga i språkmenyn och i
 * Inställningar.
 *
 * Två rader står alltid före listan, eftersom de avgör om översättningen går
 * att lita på:
 *   - maskinöversättning kan bli fel
 *   - myndigheters namn ska stå kvar på svenska (en översatt "Arbetsförmedlingen"
 *     går inte att googla och står inte på skylten — samma regel som
 *     SKYDDADE_NAMN i i18n/sprakparitet.test.ts)
 * och integritetsraden: det du skrivit skickas också till Google.
 */

import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Check } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { OVERSATT_SPRAK, oversattTill, valtOversattSprak, visaOriginal } from '@/services/sidoversattning'

interface Props {
  /** Stäng omgivande meny när ett val görs (sidan laddas om strax efter). */
  onVal?: () => void
  className?: string
}

export function OversattSidan({ onVal, className }: Props) {
  const { t } = useTranslation()
  const id = useId()
  const [oppen, setOppen] = useState(false)
  const [valt] = useState<string | null>(() => valtOversattSprak())
  const valtNamn = OVERSATT_SPRAK.find((s) => s.code === valt)?.name ?? null

  const valj = (code: string | null) => {
    onVal?.()
    if (code) oversattTill(code)
    else visaOriginal()
  }

  return (
    <div className={cn('space-y-2', className)}>
      <button
        type="button"
        onClick={() => setOppen((o) => !o)}
        aria-expanded={oppen}
        aria-controls={`${id}-lista`}
        className="flex w-full min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-stone-800 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]"
      >
        <Globe size={18} className="shrink-0 text-stone-500 dark:text-stone-400" aria-hidden="true" />
        <span>
          {valtNamn
            ? t('sidoversattning.valt', { defaultValue: 'Översatt till {{sprak}}', sprak: valtNamn })
            : t('sidoversattning.knapp', 'Översätt sidan till fler språk')}
        </span>
      </button>

      {oppen && (
        <div id={`${id}-lista`} className="space-y-2 px-1">
          <p className="text-sm text-stone-700 dark:text-stone-300">
            {t('sidoversattning.kanBliFel', 'Google översätter sidan med en maskin. Översättningen kan bli fel.')}
          </p>
          <p className="text-sm text-stone-700 dark:text-stone-300">
            {t('sidoversattning.myndighetsnamn', 'Namn på myndigheter, till exempel Arbetsförmedlingen och Försäkringskassan, ska stå kvar på svenska. Använd det svenska namnet när du söker på nätet eller ringer.')}
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-300">
            {t('language.translationPrivacy', 'När du översätter skickas sidans innehåll till Google — även det du själv har skrivit, till exempel ett dagboksinlägg du har öppet.')}
          </p>
          <ul className="grid grid-cols-2 gap-1" aria-label={t('sidoversattning.listEtikett', 'Välj språk för översättningen')}>
            <li className="col-span-2">
              <button
                type="button"
                onClick={() => valj(null)}
                aria-current={!valt ? 'true' : undefined}
                className="flex w-full min-h-11 items-center justify-between rounded-lg px-3 py-2 text-sm text-stone-800 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700/50"
              >
                {t('sidoversattning.original', 'Svenska (utan översättning)')}
                {!valt && <Check size={16} aria-hidden="true" />}
              </button>
            </li>
            {OVERSATT_SPRAK.map((s) => (
              <li key={s.code}>
                <button
                  type="button"
                  lang={s.code}
                  onClick={() => valj(s.code)}
                  aria-current={valt === s.code ? 'true' : undefined}
                  className="flex w-full min-h-11 items-center justify-between rounded-lg px-3 py-2 text-sm text-stone-800 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700/50"
                >
                  <span>{s.name}</span>
                  {valt === s.code && <Check size={16} aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
