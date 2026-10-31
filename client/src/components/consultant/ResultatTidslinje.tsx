/**
 * RM1 — Resultatklockan som tidslinje per placering (konsulentvyn, översätts inte).
 * Logiken bor i services/resultatTidslinje.ts. Saknad data visas som "—" med skäl.
 */
import { byggTidslinje, type TidslinjePlacering } from '@/services/resultatTidslinje'
import { BETALSTATUS_ETIKETT } from '@/services/resultatklocka'
import { kr, ROM2_KALLA } from '@/services/rom2Ersattning'
import { langtDatum } from './aktivitetEtiketter'

export function ResultatTidslinje({ placering, idag }: { placering: TidslinjePlacering; idag: string }) {
  const t = byggTidslinje(placering, idag)
  return (
    <div className="mt-2 text-xs text-[var(--j-blak-2)]" data-testid="resultattidslinje" title={ROM2_KALLA}>
      <p className="m-0 font-semibold text-[var(--j-blak)]">Resultatklockan</p>
      <ol className="m-0 mt-1 p-0 list-none grid gap-1" aria-label="Tidslinje för resultatersättningen">
        <li data-testid="rt-start">Start: {t.start ? langtDatum(t.start) : '— startdatum saknas'}</li>
        {t.punkter.map((p) => (
          <li key={p.vilken} data-testid={`rt-${p.vilken}`}>
            {p.vilken === '3m' ? '3 månader' : '6 månader'}:{' '}
            {p.datum ? `${langtDatum(p.datum)} (${p.lage === 'passerad' ? 'passerad' : 'kommande'})` : '— startdatum saknas'}
            {' · '}
            {p.hogstBelopp !== null ? `högst ${kr(p.hogstBelopp)}` : 'belopp — (nivå saknas)'}
            {' · '}
            {p.status ? BETALSTATUS_ETIKETT[p.status] : '— (uppföljningen är inte registrerad)'}
          </li>
        ))}
        <li data-testid="rt-tilltrade">
          Tillträde senast: {t.tilltradeSenast ? `${langtDatum(t.tilltradeSenast)} (2 månader efter avslutad placering)` : '— (slutdatum saknas)'}
        </li>
        <li data-testid="rt-tillagg">
          Tillägg om resultatet nås inom första halvåret: {t.tillagg !== null ? kr(t.tillagg) : '— (nivå saknas)'}
        </li>
      </ol>
    </div>
  )
}
