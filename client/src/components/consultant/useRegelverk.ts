/**
 * Konsulentens kundtyp som hook (slipningen 2026-10-11).
 *
 * Granskningen i kommunläget fann samma rot i fyra fynd: Rusta och matcha-
 * begrepp (möteskadensen, nivå A/B/C, "fysiskt (härlett)") visades för kommunens
 * konsulenter. Varje del som bara gäller den ena kundtypen ska fråga här.
 *
 * - `useOrgTypVisning().visaAvtalskrav` — visa leverantörens delar. Sant för
 *   leverantör, för blandat medlemskap och utan organisation (samma regel som
 *   AvtalskravKort). Falskt bara när alla organisationer är kommuner.
 * - `useRegelverk()` — vilket regelverk en TEXT ska tala om.
 *
 * Båda är `null` medan medlemskapen laddar — då visas ingen kundtypsspecifik
 * del, hellre än fel del i en sekund. Vid läsfel: som utan organisation.
 */
import { useQuery } from '@tanstack/react-query'
import { orgApi, type OrgKind } from '@/services/orgApi'
import { orgTypVisning, regelverk, type OrgTypVisning, type Regelverk } from './orgTypVisning'

function useKinds(): OrgKind[] | null {
  const medlemskapQ = useQuery({
    queryKey: ['org-medlemskap'],
    queryFn: () => orgApi.myMemberships(),
    staleTime: 5 * 60_000,
  })
  if (medlemskapQ.isError) return []
  if (!medlemskapQ.isSuccess) return null
  return medlemskapQ.data.map((m) => m.organization?.kind).filter((k): k is OrgKind => !!k)
}

export function useOrgTypVisning(): OrgTypVisning | null {
  const kinds = useKinds()
  return kinds === null ? null : orgTypVisning(kinds)
}

export function useRegelverk(): Regelverk | null {
  const kinds = useKinds()
  return kinds === null ? null : regelverk(kinds)
}
