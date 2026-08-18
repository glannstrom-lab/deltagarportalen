/**
 * Lugnare läge — fokusläget flyttat dit man kan hitta det. (2026-08-18)
 *
 * ── Varför ────────────────────────────────────────────────────────────────
 *
 * Fokusläget är byggt, genomtänkt och riktat till precis den del av målgruppen
 * som behöver det mest: `.focus-mode` döljer chrome, guiderna visar ett steg i
 * taget, rörelse dämpas. Enda vägen in var en **ikon i toppnaven** utan text —
 * en fyrkant med hörn, som inte säger vad den gör. Granskningen 18 augusti
 * hittade det tre gånger oberoende: sidan har ingen ingång för dagen som är
 * dålig, och det som skulle vara ingången är osynligt.
 *
 * Panelen ligger i rådgivarkolumnen, under rådgivarna, hopfälld som default.
 * Den lånar deras form med flit: en fällbar sektion med rubrik och chevron är
 * ett mönster användaren redan lärt sig på den ytan.
 *
 * ── Vad den INTE gör ──────────────────────────────────────────────────────
 *
 * Den beskriver bara det inställningarna faktiskt gör. Fokusläget döljer chrome
 * och visar ett steg i taget — det står så. Pauspåminnelsen läses av
 * `BreakReminder` och ingen annan — det står så. Inga löften om "lugn" i
 * allmänhet, ingen påhittad effekt. Toppnavens ikon finns kvar; den här panelen
 * är en förklarad väg in, inte en ersättning.
 *
 * Renderas där rådgivarkolumnen finns, alltså inte på de sex sidor som saknar
 * rådgivarinnehåll (de fyra hubbarna, /nätverk, /help). Skälet är att kolumnen
 * inte ska återuppstå tom på just de sidorna — se `harRadgivarinnehall` i
 * Layout.tsx. På dem är toppnavens ikon fortfarande vägen in.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useSettingsStore } from '@/stores/settingsStore'
import { useFocusMode } from '@/components/FocusModeProvider'

/** En växel med etikett, förklaring och tillstånd. */
function Vaxel({
  id,
  rubrik,
  beskrivning,
  pa,
  vidVal,
}: {
  id: string
  rubrik: string
  beskrivning: string
  pa: boolean
  vidVal: () => void
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="min-w-0 flex-1">
        <label
          htmlFor={id}
          className="block text-[12.5px] font-medium text-stone-900 dark:text-stone-100"
        >
          {rubrik}
        </label>
        <span className="block text-[11.5px] leading-snug text-stone-500 dark:text-stone-400">
          {beskrivning}
        </span>
      </span>
      {/*
        En riktig checkbox, inte en div med role="switch". Skälet: den får
        tangentbord, tillstånd och skärmläsarnamn gratis, och `aria-checked`
        kan inte glida ur synk med det visuella. Utseendet är en ren
        CSS-omslagning av samma element.
      */}
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={pa}
        onClick={vidVal}
        className={cn(
          'relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] focus-visible:ring-offset-2',
          pa ? 'bg-[var(--c-solid)]' : 'bg-stone-300 dark:bg-stone-600'
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
            pa ? 'translate-x-[18px]' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  )
}

export default function LugnarePanel() {
  const { t } = useTranslation()
  const [utfalld, setUtfalld] = useState(false)
  const { isFocusModeEnabled, toggleFocusMode } = useFocusMode()
  const calmMode = useSettingsStore((s) => s.calmMode)
  const toggleCalmMode = useSettingsStore((s) => s.toggleCalmMode)

  return (
    <section className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden">
      <button
        type="button"
        onClick={() => setUtfalld((v) => !v)}
        aria-expanded={utfalld}
        className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--c-solid)]"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-semibold text-stone-900 dark:text-stone-100">
            {t('lugnare.rubrik', 'Lugnare läge')}
          </span>
          <span className="block text-[11.5px] text-stone-500 dark:text-stone-400 truncate">
            {isFocusModeEnabled
              ? t('lugnare.underPa', 'Fokusläget är på')
              : t('lugnare.underAv', 'Mindre på skärmen, ett steg i taget')}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn('w-4 h-4 text-stone-400 shrink-0 transition-transform', utfalld && 'rotate-180')}
        />
      </button>

      {utfalld && (
        <div className="px-3.5 pb-3.5 space-y-3.5">
          <Vaxel
            id="lugnare-fokus"
            rubrik={t('lugnare.fokus', 'Fokusläge')}
            beskrivning={t(
              'lugnare.fokusBeskrivning',
              'Döljer menyer och extra innehåll, och delar upp sidorna i ett steg i taget.'
            )}
            pa={isFocusModeEnabled}
            vidVal={toggleFocusMode}
          />

          <Vaxel
            id="lugnare-pauser"
            rubrik={t('lugnare.pauser', 'Påminn om pauser')}
            beskrivning={t(
              'lugnare.pauserBeskrivning',
              'En vänlig påminnelse när du varit inne en längre stund.'
            )}
            pa={calmMode}
            vidVal={toggleCalmMode}
          />

          <p className="m-0 text-[11.5px] leading-snug text-stone-500 dark:text-stone-400">
            {t(
              'lugnare.fotnot',
              'Valen sparas på ditt konto och följer med till nästa gång du loggar in.'
            )}
          </p>

          <Link
            to="/settings"
            className="inline-block text-[12px] font-medium text-[var(--c-text)] dark:text-[var(--c-solid)] no-underline hover:underline"
          >
            {t('lugnare.merInstallningar', 'Fler inställningar')} <span aria-hidden="true">→</span>
          </Link>
        </div>
      )}
    </section>
  )
}
