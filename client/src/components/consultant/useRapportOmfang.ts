/**
 * CH1 (rollspelet 2026-09-28): omfånget för Rapporters planbaserade delar, och en
 * rad som säger det. Se rapportOmfang.ts för varför.
 * Svenska literaler: konsulentvyn översätts inte (DESIGN.md §2).
 */
import { useQuery } from '@tanstack/react-query'
import { orgApi, type Colleague } from '@/services/orgApi'
import { planOmfang, type Omfang } from './rapportOmfang'

export interface RapportOmfang {
  omfang: Omfang
  orgNamn: string | null
  kollegor: Colleague[]
}

export function useRapportOmfang(): RapportOmfang {
  // Samma nyckel som AnalyticsTab — en hämtning delas.
  const medlemskap = useQuery({ queryKey: ['org-medlemskap'], queryFn: () => orgApi.myMemberships(), staleTime: 5 * 60_000 })
  const omfang = planOmfang((medlemskap.data ?? []).map((m) => m.role))
  const kollegor = useQuery({
    queryKey: ['org-kollegor'],
    queryFn: () => orgApi.colleagues(),
    staleTime: 5 * 60_000,
    enabled: omfang === 'enheten',
  })
  const chefsOrg = (medlemskap.data ?? []).find((m) => m.role === 'chef' || m.role === 'admin')
  return {
    omfang,
    orgNamn: chefsOrg?.organization?.name ?? null,
    kollegor: kollegor.data ?? [],
  }
}
