/**
 * Ett bra nästa steg — Översiktens första kort.  (2026-09-10)
 *
 * Ett kort, en handling. Logiken bor i `nastaStegRegler.ts`; här slås texterna upp
 * och kortet ritas i Översiktens egen hubbfärg (mint via `data-domain="action"`
 * som PageLayout sätter). Inga gradients, ingen prestationsmätning, ingen
 * "Aktivera"-knapp — DESIGN.md §1 och §6.
 *
 * Kortet ritas bara i läget `klart`: under laddning vet vi inget om
 * användaren, och vid fel ska vi inte föreslå något som bygger på data vi
 * inte har. Samma regel som panelens rader (PanelTillstand).
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import type { OversiktSummary } from '@/hooks/useOversiktHubSummary'
import { datumSprak } from '@/lib/datumsprak'
import { valjNastaSteg, type Steg } from './nastaStegRegler'
import { manadsText } from './oversiktTid'
import { useOversiktBilder } from './oversiktBilder'
import type { PanelTillstand } from './OversiktPanel'

function texter(steg: Steg, t: TFunction, sprak: string) {
  const bas = `hubOverview.nasta.${steg.id}`
  const v = steg.varden
  const nar = manadsText(v.datum, t, sprak)
  const opts = { titel: v.titel ?? '', nar, count: v.dagar ?? 0 }
  const body =
    steg.id === 'event'
      ? t(v.idag ? `${bas}.bodyToday` : `${bas}.bodyTomorrow`, opts)
      : t(`${bas}.body`, opts)
  return {
    rubrik: t(`${bas}.title`, opts),
    body,
    knapp: t(`${bas}.cta`, opts),
    kort: t(`${bas}.short`, opts),
  }
}

export default function NastaSteg({
  summary,
  tillstand,
}: {
  summary: OversiktSummary | undefined
  tillstand: PanelTillstand
}) {
  const { t, i18n } = useTranslation()
  const bilder = useOversiktBilder()
  if (tillstand !== 'klart') return null
  const val = valjNastaSteg(summary)
  if (!val) return null

  const sprak = datumSprak(i18n.language)
  const p = texter(val.primar, t, sprak)

  /*
   * Scenen (stiltestet 2026-09-10) ligger som bakgrund i kortets högra del.
   * Prompten är skriven så att bildens vänstra tredjedel är lugn — här läggs
   * texten ändå på en egen yta i hubbens pastell, så att läsbarheten inte
   * beror på vad bildgeneratorn råkade lägga där. Ingen gradient (DESIGN.md
   * §6): övergången är en rak kant. Under `sm` visas bilden som ett band
   * ovanför texten i stället för bakom den.
   */
  return (
    <section
      aria-labelledby="nasta-steg-rubrik"
      data-testid="nasta-steg"
      className="relative overflow-hidden rounded-xl border border-[var(--c-accent)] bg-[var(--c-bg)]"
    >
      <img
        src={bilder.scen}
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
        className="block h-40 w-full object-cover object-[70%_40%] sm:absolute sm:inset-y-0 sm:right-0 sm:h-full sm:w-[52%] sm:object-right"
      />
      <div className="relative px-5 py-5 sm:px-6 sm:max-w-[54%] sm:bg-[var(--c-bg)]">
        <p className="m-0 mb-1.5 text-[12.5px] font-semibold uppercase tracking-[0.06em] text-[var(--c-text)]">
          {t('hubOverview.nasta.label', 'Ett bra nästa steg')}
        </p>
        <h2
          id="nasta-steg-rubrik"
          className="m-0 text-[19px] sm:text-[20px] font-semibold leading-snug text-stone-900 dark:text-stone-100 max-w-[36ch] text-balance"
        >
          {p.rubrik}
        </h2>
        <p className="m-0 mt-1.5 text-[15px] leading-relaxed text-stone-600 dark:text-stone-300 max-w-[60ch]">
          {p.body}
        </p>
        <Link
          to={val.primar.till}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-[var(--c-solid)] px-5 py-2.5 text-[15px] font-semibold text-[var(--c-on-solid)] no-underline transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
        >
          {p.knapp}
        </Link>

        {val.alternativ.length > 0 && (
          <div className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-1.5 border-t border-[var(--c-accent)] pt-3 text-[14px]">
            <span className="font-medium text-stone-700 dark:text-stone-300">
              {t('hubOverview.nasta.otherwise', 'Om du hellre vill:')}
            </span>
            {val.alternativ.map((alt) => (
              <Link
                key={alt.id}
                to={alt.till}
                className="font-medium text-[var(--c-text)] dark:text-[var(--c-solid)] no-underline hover:underline underline-offset-2"
              >
                {texter(alt, t, sprak).kort}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
