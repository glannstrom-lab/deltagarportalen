/**
 * KSL15: vilka flikar konsulentvyn visar för den inloggade. Handläggare
 * (org-roll `handlaggare` i alla sina organisationer) får Översikt, Rapporter
 * och Inställningar.
 *
 * Medan medlemskapen laddas visas bara den delmängd som är säker för båda
 * rollerna (handläggarens flikar) och en dold sökväg renderas inte (se
 * Consultant.tsx) — i stället för att "visa allt" och låta en flik blinka förbi.
 * Misslyckas frågan (isError, efter react-querys omförsök) är `laddar` falskt och
 * alla flikar visas: en vanlig konsulent ska inte stå med en permanent
 * handläggarvy för att ett nätfel slog till, och datan skyddas ändå av RLS.
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
  const laddar = q.isPending
  return { enbartHandlaggare, laddar, flikar: flikarForRoll(enbartHandlaggare || laddar) }
}

/**
 * KSL15: navigationen (TopNav/HubBottomNav) läser bara det Consultant.tsx
 * redan hämtat — ingen egen fråga, och den klarar sig utan QueryClientProvider
 * (navtesterna renderar utan). Samma regel som useKonsulentFlikar: medan svaret
 * saknas visas bara handläggarens flikar, så en dold länk inte blinkar förbi.
 * Misslyckas frågan visas alla (direktlänkarna skyddas ändå i Consultant.tsx).
 */
export function useEnbartHandlaggareICache(): boolean {
  const klient = useContext(QueryClientContext)
  const prenumerera = useCallback(
    (cb: () => void) => (klient ? klient.getQueryCache().subscribe(cb) : () => {}),
    [klient]
  )
  const lage = useSyncExternalStore(prenumerera, () => {
    if (!klient) return 'okand'
    const state = klient.getQueryState<{ role: string }[]>(['org-medlemskap'])
    if (state?.status === 'error') return 'okand'
    if (state?.status !== 'success' || !state.data) return 'laddar'
    return arEnbartHandlaggare(state.data.map((m) => m.role)) ? 'handlaggare' : 'konsulent'
  })
  return lage === 'laddar' || lage === 'handlaggare'
}
