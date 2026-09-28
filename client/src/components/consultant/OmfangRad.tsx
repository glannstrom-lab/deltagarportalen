/**
 * CH1 (rollspelet 2026-09-28): en rad under rubriken som säger vilka deltagare
 * delen räknar. Svenska literaler: konsulentvyn översätts inte (DESIGN.md §2).
 */
import type { Omfang } from './rapportOmfang'

/** En rad under rubriken: vilka deltagare den här delen räknar. */
export function OmfangRad({ omfang, orgNamn }: { omfang: Omfang; orgNamn: string | null }) {
  return (
    <p className="text-xs font-medium text-stone-600 dark:text-stone-300" data-testid="rapport-omfang">
      {omfang === 'enheten'
        ? `Omfattar hela ${orgNamn ?? 'enheten'} — alla planer, även kollegornas deltagare.`
        : 'Omfattar dina egna deltagare.'}
    </p>
  )
}
