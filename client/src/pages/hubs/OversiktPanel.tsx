/**
 * Översiktens innehåll i tre nivåer.  (2026-09-10, beslut Mikael)
 *
 *   1. Ett bra nästa steg   — ETT förslag, härlett ur egen data (`NastaSteg`)
 *   2. Det som är igång     — upp till tre kort med riktigt innehåll (`Pagar`)
 *   3. Allt i portalen      — de fyra kategorierna, kompakta (här nedan)
 *
 * Före 2026-09-10 fanns bara nivå 3: sexton likadana rader i fyra kolumner,
 * där "1 väntar på svar" vägde lika mycket som "Nätverk: lägg till en
 * kontakt". Sidan tog inte ställning till något, och det närmaste ett förslag
 * kom var rådgivarens allmänna text i sidokolumnen. Skärmbilder och motivering
 * i designförslaget som ledde till beslutet (artifakten "Översikt med
 * riktning").
 *
 * Kategorierna (nivå 3) ersatte i sin tur instrumentpanelen från 17 augusti
 * (Förslag A, 2026-08-18). Reglerna som styrde dem gäller fortfarande, i alla
 * tre nivåerna:
 *
 * 1. **Ingen siffra utan underlag** (ROADMAP B31). En rad utan data visar en
 *    INVIT — aldrig `0`, aldrig ett tankstreck, aldrig ett påhittat exempel.
 * 2. **Laddning och fel är inte tomhet.** Innan svaret är inne får ingen rad
 *    påstå något om användaren. Se `PanelTillstand`. Nivå 1 och 2 ritas inte
 *    alls förrän läget är `klart`.
 * 3. **Inga prestationsmätningar** (DESIGN.md §1). Talen beskriver vad som
 *    FINNS, aldrig hur väl man presterar. Ingen rad blir röd för ett lågt tal.
 *    Därför är också "för länge sedan" borta: en tidsangivelse i förebrående
 *    form hjälper ingen att öppna sitt CV. Nu står "i maj" eller "maj 2025".
 * 4. **En kategori = en hubbfärg** via `data-domain`, aldrig en hårdkodad
 *    hub-token (`lint:design`). Fyra pasteller bredvid varandra är Översiktens
 *    uttryckliga undantag i DESIGN.md §4.
 *
 * Typografin gick upp ett steg i samma ändring (radrubrik 13 → 14,5 px,
 * underrad 11,5 → 13 px) och monospace-stämplarna försvann. Målgruppen är den
 * som helst behöver större text, inte mindre.
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { OversiktSummary } from '@/hooks/useOversiktHubSummary'
import { datumSprak } from '@/lib/datumsprak'
import Pagar from './Pagar'
import Lyktstig from './Lyktstig'
import { Foremal } from '@/components/varld/Foremal'
import { platsForDomain, scenSrc, scenFokus } from '@/data/varld'
import { useVarld } from '@/hooks/useVarld'
import { cn } from '@/lib/utils'

export type { PanelTillstand, Kategori } from './oversiktKategorier'
import { byggKategorier, uppdragsplats, type PanelTillstand } from './oversiktKategorier'

export default function OversiktPanel({
  summary,
  tillstand = 'klart',
  vidForsokIgen,
}: {
  summary: OversiktSummary | undefined
  tillstand?: PanelTillstand
  vidForsokIgen?: () => void
}) {
  const { t, i18n } = useTranslation()
  const { tid, stil } = useVarld()
  const laddar = tillstand === 'laddar'
  const fel = tillstand === 'fel'
  const kategorier = byggKategorier(summary, t, tillstand, datumSprak(i18n.language))
  const uppdrag = tillstand === 'klart' ? uppdragsplats(summary) : null

  return (
    <div className="space-y-7" aria-busy={laddar || undefined}>
      {/* WCAG 4.1.3: talen byts ut när svaret kommer. Utan en levande region
          hände det tyst för den som inte ser skärmen. */}
      <p role="status" aria-live="polite" className="sr-only">
        {laddar
          ? t('hubOverview.panel.statusLoading', 'Hämtar din översikt.')
          : fel
            ? t('hubOverview.panel.statusError', 'Översikten kunde inte hämtas.')
            : t('hubOverview.panel.statusReady', 'Översikten är uppdaterad.')}
      </p>

      {fel && (
        <section className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-3.5">
          <p className="m-0 text-[0.9375rem] text-stone-700 dark:text-stone-200">
            {t(
              'hubOverview.panel.errorBody',
              'Vi kunde inte hämta dina uppgifter just nu. Det är portalen som strular — inget du har gjort.'
            )}
          </p>
          {vidForsokIgen && (
            <button
              type="button"
              onClick={vidForsokIgen}
              className="mt-2.5 rounded-lg bg-[var(--c-solid)] px-3.5 py-2 text-[0.875rem] font-medium text-[var(--c-on-solid)] transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] focus-visible:ring-offset-2"
            >
              {t('hubOverview.panel.retry', 'Försök igen')}
            </button>
          )}
        </section>
      )}

      {/* Spår JS (2026-10-09): nästa steg är rådgivarens replik i staden
          (Stad.tsx). Här står det som är igång och vägen hittills, sida vid
          sida, och sedan platserna. */}
      <div className="grid gap-5 lg:grid-cols-2 items-start">
        <Pagar summary={summary} tillstand={tillstand} />
        <Lyktstig summary={summary} tillstand={tillstand} />
      </div>

      {/* Platserna i staden — en per hubb, med platsens scen. */}
      <section aria-labelledby="hubbar-rubrik">
        <div className="mb-3.5 flex items-center gap-3.5">
          <Foremal namn="karta" storlek="md" />
          <h2 id="hubbar-rubrik" className="m-0 text-[1.25rem] font-bold tracking-tight text-stone-900 dark:text-stone-50">
            {t('hubOverview.hubsHeading', 'Platserna i staden')}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kategorier.map((kat) => {
            const plats = platsForDomain(kat.domain)
            const arUppdrag = !laddar && !fel && uppdrag === plats.id
            return (
            <section
              key={kat.id}
              data-domain={kat.domain}
              aria-labelledby={`kat-${kat.id}`}
              className={cn(
                'group/kort flex min-w-0 flex-col overflow-hidden rounded-[22px] bg-white dark:bg-stone-900 ring-1 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-22px_rgba(28,25,23,0.55)]',
                arUppdrag ? 'ring-2 ring-[var(--c-solid)]' : 'ring-stone-200/80 dark:ring-stone-700'
              )}
            >
              <Link to={kat.till} tabIndex={-1} aria-hidden="true" className="relative block aspect-[16/9] overflow-hidden bg-[var(--c-bg)]">
                <img
                  src={scenSrc(plats.id, tid, stil)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  style={{ objectPosition: scenFokus(plats.id, tid, stil) }}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover/kort:scale-[1.04]"
                />
                <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-stone-900/85 backdrop-blur pl-1 pr-2.5 py-0.5 text-[0.75rem] font-semibold text-stone-800 dark:text-stone-100">
                  <Foremal namn={plats.foremal} storlek="xs" className="!w-6 !h-6 rounded-full" />
                  {t(plats.namnNyckel, plats.namnSv)}
                </span>
                {arUppdrag && (
                  <span className="absolute right-2.5 top-2.5 grid place-items-center w-8 h-8 rounded-full bg-[var(--c-solid)] text-[var(--c-on-solid)] font-bold shadow-lg varld-uppdrag">
                    !
                  </span>
                )}
              </Link>
              <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-1">
                <h3
                  id={`kat-${kat.id}`}
                  className="m-0 min-w-0 flex-1 truncate text-[1.0625rem] font-bold tracking-tight text-stone-900 dark:text-stone-100"
                >
                  {kat.namn}
                </h3>
                <Link
                  to={kat.till}
                  aria-label={t('hubOverview.panel.allIn', { defaultValue: 'Allt i {{namn}}', namn: kat.namn })}
                  className="shrink-0 text-[0.8125rem] font-semibold text-[var(--c-text)] dark:text-[var(--c-solid)] no-underline hover:underline underline-offset-2"
                >
                  {t('hubOverview.panel.allShort', 'Allt')} <span aria-hidden="true">→</span>
                </Link>
              </div>

              <ul className="m-0 list-none p-0 pb-2">
                {kat.rader.map((r) => (
                  <li key={r.till}>
                    <Link
                      to={r.till}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-[var(--c-bg)] dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--c-solid)] no-underline"
                    >
                      <span className="min-w-0 flex-1">
                        <span
                          className={
                            r.harData
                              ? 'block truncate text-[0.90625rem] font-semibold text-stone-900 dark:text-stone-100'
                              : 'block truncate text-[0.90625rem] font-medium text-stone-600 dark:text-stone-400'
                          }
                        >
                          {r.titel}
                        </span>
                        <span className="block truncate text-[0.8125rem] leading-snug text-stone-500 dark:text-stone-400">
                          {r.under}
                        </span>
                      </span>
                      {/* B31: ett tal bara när det finns ett — underraden bär beskedet. */}
                      {r.varde ? (
                        <span
                          className={
                            /^\d+$/.test(r.varde)
                              ? 'shrink-0 grid place-items-center min-w-7 h-7 px-1.5 rounded-full bg-[var(--c-bg)] text-[0.875rem] font-bold tabular-nums text-[var(--c-text)] dark:text-[var(--c-solid)]'
                              : 'shrink-0 text-[0.8125rem] text-stone-500 dark:text-stone-400'
                          }
                        >
                          {r.varde}
                        </span>
                      ) : (
                        !r.harData && (
                          <span aria-hidden="true" className="shrink-0 text-stone-400 dark:text-stone-500">
                            →
                          </span>
                        )
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
            )
          })}
        </div>
      </section>
    </div>
  )
}
