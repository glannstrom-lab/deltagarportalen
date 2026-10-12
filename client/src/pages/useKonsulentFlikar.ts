/**
 * KSL15: vilka flikar konsulentvyn visar för den inloggade. Handläggare
 * (org-roll `handlaggare` i alla sina organisationer) får Översikt, Rapporter
 * och Inställningar. Medan medlemskapen laddas gäller ingen begränsning, men
 * `laddar` är sant så att en dold sökväg inte hinner rendera en tom vy.
 */
import { useCallback, useContext, useSyncExternalStore } from 'react'
import { QueryClientContext, useQuery } from '@tanstack/react-query'
import { orgApi } from '@/services/orgApi'
import { arEnbartHandlaggare, flikarForRoll } from '@/data/consultantTabs'

export function useKonsulentFlikar() {
  const q = useQuery({
    queryKey: ['org-medlemskap'],
    queryFn: () => orgApi.myMemberships(),
    staleTime: 5 * 60_000,
  })
  const enbartHandlaggare = q.isSuccess && arEnbartHandlaggare(q.data.map((m) => m.role))
  return { enbartHandlaggare, laddar: q.isPending, flikar: flikarForRoll(enbartHandlaggare) }
}

/**
 * KSL15: navigationen (TopNav/HubBottomNav) läser bara det Consultant.tsx
 * redan hämtat — ingen egen fråga, och den klarar sig utan QueryClientProvider
 * (navtesterna renderar utan). Saknas svaret visas alla flikar; direktlänkarna
 * skyddas ändå i Consultant.tsx.
 */
export function useEnbartHandlaggareICache(): boolean {
  const klient = useContext(QueryClientContext)
  const prenumerera = useCallback(
    (cb: () => void) => (klient ? klient.getQueryCache().subscribe(cb) : () => {}),
    [klient]
  )
  const roller = useSyncExternalStore(prenumerera, () =>
    klient?.getQueryData<{ role: string }[]>(['org-medlemskap'])
  )
  return !!roller && arEnbartHandlaggare(roller.map((m) => m.role))
}
