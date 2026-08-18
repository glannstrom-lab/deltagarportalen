import { useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useSupabase'
import { supabase } from '@/lib/supabase'
import type { HubId } from '@/components/layout/navigation'
import { OVERSIKT_HUB_KEY } from './useOversiktHubSummary'

/**
 * Antecknar att användaren besökt en hubb, i `profiles.onboarded_hubs`.
 *
 * ── Rättat 2026-08-18: listan nollställdes vid varje kall sidladdning ──────
 *
 * Mutationen läste tidigare `queryClient.getQueryData(OVERSIKT_HUB_KEY)` för
 * att få reda på vad som redan stod i kolumnen. Effekten kör vid mount, medan
 * profilfrågan fortfarande är en nätverksrundtur — vid kall cache var svaret
 * alltså `undefined`, `current` blev `[]`, och skrivningen la `[hubId]` ÖVER
 * det som stod i databasen. Varje kall laddning raderade historiken och lämnade
 * kvar den hubb man råkade landa på.
 *
 * Prod-fördelningen 2026-08-18 var förenlig med det: av 92 konton hade 59 noll
 * hubbar, 15 exakt en och 14 exakt två — mönstret för "senaste sessionen",
 * inte för ackumulering över tid.
 *
 * Nu läses nuläget från **servern**, inte från cachen. Det kostar en SELECT per
 * hubbmount, men det är den enda källan som kan svara på frågan mutationen
 * ställer. Cachen synkas inte längre med `setQueryData` — den invalideras, och
 * bara när en skrivning faktiskt skedde. Skälet: `setQueryData` skrev ett
 * objekt utan `full_name` och `profile_image_url` när cachen var tom, vilket
 * gjorde `summary` giltig för tidigt och fick hälsningen att visa "God kväll"
 * utan namn en kort stund. En nyckel = en form = en ägare.
 *
 * ── Läsare: noll ──────────────────────────────────────────────────────────
 *
 * Kolumnen har ingen konsument i appen (verifierat 2026-08-18 mot hela
 * `client/src` och `supabase/`). Docstringen motiverade tidigare cache-synken
 * med "so the OnboardingWidget reflects returning-user state" — den komponenten
 * ligger i `archive/`. Att hooken ska finnas kvar alls är därför en öppen
 * fråga; den är lagad, inte försvarad.
 */
export function useOnboardedHubsTracking(hubId: HubId) {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const queryClient = useQueryClient()
  const hasRunRef = useRef(false)

  const mutation = useMutation({
    mutationFn: async (): Promise<{ skrev: boolean }> => {
      // Läs från servern. Cachen kan vara tom just nu — det var hela buggen.
      const nuR = await supabase
        .from('profiles')
        .select('onboarded_hubs')
        .eq('id', userId)
        .maybeSingle()
      if (nuR.error) throw nuR.error

      const current = ((nuR.data as { onboarded_hubs?: string[] | null } | null)?.onboarded_hubs ?? [])
        .filter((h): h is string => typeof h === 'string')
      if (current.includes(hubId)) return { skrev: false }

      const r = await supabase
        .from('profiles')
        .update({ onboarded_hubs: [...current, hubId] })
        .eq('id', userId)
      if ((r as { error?: { message?: string } | null }).error) {
        throw (r as { error: { message?: string } }).error
      }
      return { skrev: true }
    },
    onSuccess: ({ skrev }) => {
      // Bara när något faktiskt ändrades. Invalidering i stället för
      // `setQueryData`: ägaren av nyckeln är `useOversiktHubSummary`, och den
      // vet vilken form raden ska ha.
      if (skrev) void queryClient.invalidateQueries({ queryKey: OVERSIKT_HUB_KEY(userId) })
    },
  })

  useEffect(() => {
    if (!userId || hasRunRef.current) return
    hasRunRef.current = true
    mutation.mutate()
    // mutation is stable from useMutation; intentionally excluded from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, hubId])
}
