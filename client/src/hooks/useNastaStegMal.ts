/**
 * Användarens nästa steg som mål { vag, fokus } — för menyns prick och för
 * pulsen på knappen (2026-10-19). Se lib/nastaStegMal.ts.
 *
 * Rollen läses ur var man är: konsulentvyn och företagsvyn har egna mål som
 * deras Översikt publicerar; allt annat är deltagarens portal, vars mål
 * NastaStegBeraknare (i Layout) räknar ur samma sammanfattning och regler som
 * staden och rådgivaren. Hooken läser bara storen — den hämtar ingenting.
 *
 * Laddning är inte tomhet: `undefined` i storen betyder att svaret inte är
 * inne, och då finns inget mål och ingen prick (CLAUDE.md).
 */
import { useLocation } from 'react-router-dom'
import { avkodaSokvag } from '@/lib/sokvag'
import type { NastaStegMal } from '@/lib/nastaStegMal'
import { useNastaStegStore } from '@/stores/nastaStegStore'

export type NastaStegRoll = 'deltagare' | 'konsulent' | 'foretag'

export function rollForVag(pathname: string): NastaStegRoll {
  const v = avkodaSokvag(pathname)
  if (v === '/consultant' || v.startsWith('/consultant/')) return 'konsulent'
  if (v === '/foretag' || v.startsWith('/foretag/')) return 'foretag'
  return 'deltagare'
}

export function useNastaStegMal(): NastaStegMal | null {
  const { pathname } = useLocation()
  const roll = rollForVag(pathname)
  const mal = useNastaStegStore((s) => s[roll]) ?? null
  const klickade = useNastaStegStore((s) => s.klickade)
  // Ett steg vars knapp redan klickats i den här sessionen är gjort tills
  // underlaget säger något nytt — då kommer ett annat steg med annan nyckel.
  if (mal?.fokus && klickade.includes(mal.fokus)) return null
  return mal
}
