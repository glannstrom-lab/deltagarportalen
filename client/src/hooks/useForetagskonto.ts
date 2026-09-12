/**
 * useForetagskonto — är den inloggade personen en kontaktperson i ett
 * företagskonto (AG6, 2026-09-13)?
 *
 * Företaget är en ORGANISATION av slaget `arbetsgivare` (organizations.kind),
 * inte en profilroll. Personen är USER på profilnivå, precis som en deltagare,
 * och skiljs bara av medlemsraden i organization_members (role = 'arbetsgivare').
 * Därför räcker inte `profile.role` — vi måste fråga medlemskapen.
 *
 * Personal (CONSULTANT/ADMIN/SUPERADMIN) kan inte vara företag: triggern
 * employer_invitations_insert nekar personalkonton, så frågan ställs inte alls
 * för dem (enabled: false) — och då är `isLoading` false, inte "okänt".
 *
 * Tre lägen enligt CLAUDE.md ("laddning är inte tomhet"): så länge svaret inte
 * är inne ska ingen sida påstå att personen är deltagare. App.tsx och Layout
 * väntar på `isLoading` innan de väljer skal.
 */

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { orgApi, type Organization } from '@/services/orgApi'

export const FORETAGSKONTO_QUERY_KEY = ['foretagskonto'] as const

export interface Foretagskonto {
  /** Företagsorganisationen, eller null när personen inte är företagskontakt. */
  org: Organization | null
  /** true tills första svaret är inne (bara för USER-konton). */
  isLoading: boolean
  isEmployer: boolean
  error: unknown
}

export async function hamtaForetagskonto(): Promise<Organization | null> {
  const medlemskap = await orgApi.myMemberships()
  const traff = medlemskap.find(
    (m) => m.organization?.kind === 'arbetsgivare' && m.role === 'arbetsgivare',
  )
  return traff?.organization ?? null
}

export function useForetagskonto(): Foretagskonto {
  const userId = useAuthStore((s) => s.user?.id ?? null)
  const roll = useAuthStore((s) => s.profile?.activeRole || s.profile?.role || 'USER')
  const kanVaraForetag = !!userId && roll === 'USER'

  const q = useQuery({
    queryKey: [...FORETAGSKONTO_QUERY_KEY, userId],
    queryFn: hamtaForetagskonto,
    enabled: kanVaraForetag,
    staleTime: 5 * 60_000,
    retry: 1,
  })

  const org = q.data ?? null
  return {
    org,
    isLoading: kanVaraForetag && q.data === undefined && !q.error,
    isEmployer: org !== null,
    error: q.error,
  }
}
