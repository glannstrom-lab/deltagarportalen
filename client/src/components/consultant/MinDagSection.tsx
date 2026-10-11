/**
 * MinDagSection — konsulentens Översikt som EN vy (omtaget "Kvarter", steg 3, 2026-10-11).
 *
 * Mikael: "så fort ett motstånd eller okunskap finns så kommer de lägga bort
 * sina telefoner och datorer." Förslaget svarar med en fråga per sida — här
 * "Vad ska jag göra nu?" — och en ordning:
 *
 *   1. Kontoret som scen, datum och hälsning, "N saker i dag".
 *   2. ETT nästa steg (NastaSteg) — eller, för en ny konsulent, Kom igång.
 *   3. En rad per människa (PersonRad), det mest brådskande först.
 *   4. Dagens pass; i sidospalten veckan i en mening (och mot avtalet) och Kom igång.
 *   5. Tomläget med bilden "Klart för i dag" — bara när allt verkligen är tomt.
 *
 * Tidigare Min dag (möten, mål, kontakter), Kräver uppmärksamhet och
 * snabbåtgärderna är ihopslagna: punkterna står i personraderna, och
 * snabbåtgärderna i Mer-menyn bredvid hälsningen. Nyckeltal, Målöversikt och
 * Senaste aktivitet finns under Rapporter (OversiktSiffror).
 *
 * Tre lägen, aldrig ett påstående utan underlag: under laddning står scenen och
 * hälsningen men inget nästa steg och ingen räkning; vid läsfel en rad om felet
 * — aldrig "allt klart".
 *
 * Konsulentvyn översätts inte (DESIGN.md §2) — svenska literaler med flit.
 */

import type { ReactNode } from 'react'
import { MerMeny, type MerMenyVal } from '@/components/ui/MerMeny'
import { Button } from '@/components/ui/Button'
import { KvarterIkon } from '@/components/ui/icons/kvarter/KvarterIkon'
import { halsning, sakerIDag } from './minDagText'

export type MinDagLage = 'laddar' | 'klart'

interface MinDagSectionProps {
  lage: MinDagLage
  /** Konsulentens förnamn — "God morgon, Karin". Null → bara hälsningen. */
  fornamn: string | null
  /** Antal saker i dag (personer + pass att markera). Null när det inte går att veta. */
  antalSaker: number | null
  /** En rad om ett delvis läsfel (t.ex. passen kunde inte hämtas). Stänger av tomläget. */
  fel?: string | null
  /** Nästa steg + listan per person (BradskandeIdag), eller Kom igång för en ny konsulent. */
  children?: ReactNode
  /** Dagens pass (DagensPass). */
  pass?: ReactNode
  /** "Veckan i en mening" — null visas inte. */
  veckan?: string | null
  /** Leverantörens vecka mot avtalet (leverantorSammanfattning) — bara för leverantörer. */
  avtal?: readonly string[] | null
  /** Allt är tomt: inga punkter, inga pass att markera, inga pass i dag. */
  tomt: boolean
  /** Handling i tomläget, t.ex. "Se alla deltagare". */
  onSeAlla?: () => void
  /** Snabbåtgärderna (bjud in, gruppmeddelande, boka möte …). */
  meny?: readonly MerMenyVal[]
  /** Under listan i huvudspalten, t.ex. handläggarens underlag. */
  efter?: ReactNode
  /** I sidospalten under veckan, t.ex. Kom igång för den som redan har deltagare. */
  sido?: ReactNode
  /** För tester: tiden "nu". */
  nu?: Date
}

function datumText(nu: Date): string {
  // Stor bokstav bara först ("Måndag 13 oktober"), inte på månaden.
  const d = nu.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })
  return d.charAt(0).toUpperCase() + d.slice(1)
}

function Scen({ src, srcSet, className }: { src: string; srcSet: string; className?: string }) {
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes="(min-width: 1024px) 1100px, 100vw"
      alt=""
      decoding="async"
      className={className}
    />
  )
}

export function MinDagSection({
  lage,
  fornamn,
  antalSaker,
  fel,
  children,
  pass,
  veckan,
  avtal,
  tomt,
  onSeAlla,
  meny = [],
  efter,
  sido,
  nu = new Date(),
}: MinDagSectionProps) {
  const visaTomt = lage === 'klart' && tomt && !fel
  const eftermiddag = nu.getHours() >= 12

  return (
    <div className="grid gap-5 sm:gap-6 font-text text-j-blak" data-testid="min-dag">
      {/* Kontoret som scen. Dekorativ: hälsningen bär innehållet. */}
      <div className="relative">
        <div className="overflow-hidden rounded-j-l bg-j-sankt">
          <Scen
            src="/kontor/kontoret-1280.webp"
            srcSet="/kontor/kontoret-720.webp 720w, /kontor/kontoret-1280.webp 1280w"
            className="block w-full h-[150px] sm:h-[200px] lg:h-[236px] object-cover object-[62%_58%] dark:brightness-[0.82]"
          />
        </div>

        <div className="relative mx-0 sm:mx-5 -mt-6 sm:-mt-14 bg-j-kort border border-j-linje rounded-j-m shadow-j px-4 py-4 sm:px-6 sm:py-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-j-blak-3">{datumText(nu)}</p>
            <h2 className="mt-1 font-rubrik text-[1.75rem] sm:text-[2rem] leading-[1.1] font-bold text-j-blak">
              {halsning(nu)}{fornamn ? `, ${fornamn}` : ''}
            </h2>
            <p className="mt-1.5 text-[0.9375rem] text-j-blak-2" role="status" aria-live="polite" data-testid="mindag-antal">
              {lage === 'laddar'
                ? 'Hämtar din dag …'
                : fel
                  ? 'Allt kunde inte hämtas. Det som syns stämmer, men något kan saknas.'
                  : antalSaker === null
                    ? null
                    : antalSaker === 0
                      ? 'Inget väntar på dig just nu.'
                      : `${sakerIDag(antalSaker)} Det som brådskar står först.`}
            </p>
          </div>
          {meny.length > 0 && <MerMeny val={meny} etikett="Mer" className="shrink-0 -mr-2" />}
        </div>
      </div>

      {fel && (
        <p role="alert" className="flex items-start gap-2 px-4 py-3 rounded-j-m bg-[var(--s-ogiltig-bg)] text-[var(--s-ogiltig-text)] text-[0.9375rem]">
          <KvarterIkon namn="varning" size={20} ton="ogiltig" className="shrink-0 mt-0.5" />
          <span>{fel}</span>
        </p>
      )}

      <div className="grid gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
        <div className="grid gap-5 sm:gap-6 min-w-0">
          {lage === 'laddar' ? (
            // Under laddning påstås ingenting om dagen — ingen tom lista, inget nästa steg.
            <div className="h-24 rounded-j-m bg-j-kort border border-j-linje animate-pulse motion-reduce:animate-none" aria-hidden="true" />
          ) : visaTomt ? (
            <section aria-labelledby="mindag-klart" data-testid="mindag-tomt" className="overflow-hidden rounded-j-m bg-j-kort border border-j-linje shadow-j">
              <Scen
                src="/kontor/klart-900.webp"
                srcSet="/kontor/klart-600.webp 600w, /kontor/klart-900.webp 900w"
                className="block w-full h-[170px] sm:h-[220px] object-cover object-[50%_60%] dark:brightness-[0.82]"
              />
              <div className="p-5 sm:p-6 grid gap-2">
                <p className="text-[0.8125rem] font-bold uppercase tracking-[0.08em] text-j-gran-text">
                  {eftermiddag ? 'Bra jobbat i dag' : 'Lugn start'}
                </p>
                <h2 id="mindag-klart" className="font-rubrik text-[1.375rem] sm:text-[1.5rem] leading-[1.15] font-bold">
                  {eftermiddag ? 'Allt för i dag är gjort' : 'Inget väntar på dig just nu'}
                </h2>
                <p className="text-[0.9375rem] text-j-blak-2">
                  Ingen väntar på svar, ingen frånvaro saknar en rad och inget pass i dag behöver markeras.
                </p>
                {onSeAlla && (
                  <div className="mt-2">
                    <Button ton="kvarter" variant="primary" onClick={onSeAlla} className="w-full sm:w-auto">
                      Se alla deltagare
                    </Button>
                  </div>
                )}
              </div>
            </section>
          ) : (
            children
          )}
          {/* Dagens pass i huvudspalten: raderna behöver bredden (tid, namn, knapp). */}
          {lage === 'klart' && pass && !visaTomt && (
            <div className="bg-j-kort border border-j-linje rounded-j-m px-4 sm:px-5 pt-4 pb-1">{pass}</div>
          )}
          {lage === 'klart' && efter}
        </div>

        {lage === 'klart' && (veckan || (avtal && avtal.length > 0) || sido) && (
          <aside className="grid gap-5 sm:gap-6 min-w-0" aria-label="Veckan">
            {avtal && avtal.length > 0 && (
              <section className="bg-j-kort border border-j-linje rounded-j-m p-4 sm:p-5 grid gap-2">
                <h2 className="text-[0.8125rem] font-bold uppercase tracking-[0.08em] text-j-blak-3">
                  Veckan mot avtalet
                </h2>
                <ul aria-label="Veckan mot avtalet" className="grid gap-1 text-[0.9375rem] text-j-blak">
                  {avtal.map((rad) => <li key={rad}>{rad}</li>)}
                </ul>
              </section>
            )}
            {veckan && (
              <section aria-labelledby="mindag-veckan" className="bg-j-kort border border-j-linje rounded-j-m p-4 sm:p-5 grid gap-1.5">
                <h2 id="mindag-veckan" className="text-[0.8125rem] font-bold uppercase tracking-[0.08em] text-j-blak-3">
                  Veckan i en mening
                </h2>
                <p className="text-[0.9375rem] leading-[1.45] text-j-blak" data-testid="mindag-veckan">{veckan}</p>
              </section>
            )}
            {sido}
          </aside>
        )}
      </div>
    </div>
  )
}
