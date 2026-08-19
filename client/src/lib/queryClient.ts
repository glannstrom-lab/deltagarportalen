/**
 * Appens delade React Query-klient.
 *
 * Låg i `main.tsx` till 2026-08-19 och gick därför inte att nå utanför
 * React-trädet. Det spelade roll: `authStore.signOut()` ligger i en
 * zustand-store och kunde inte rensa cachen, så **allt hämtat innehåll
 * överlevde utloggningen**.
 *
 * Följden var inte teoretisk. Cachenycklar utan användar-id — t.ex.
 * `['spontaneous-companies']` — matchar nästa inloggade person i samma flik.
 * Med `gcTime: 10 min` och `staleTime` på frågan hann ingen refetch ske:
 * deltagare B fick se deltagare A:s sparade företag. A31 löste exakt det här
 * problemet för localStorage med motiveringen att målgruppen ofta sitter på
 * delade datorer — men cachen glömdes.
 *
 * Modulen finns alltså för att `rensaAllCache()` ska gå att anropa därifrån.
 * Lägg inte tillbaka klienten i `main.tsx`.
 */

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  },
})

/**
 * Tömmer hela cachen. Anropas vid utloggning.
 *
 * `clear()` och inte `invalidateQueries()`: invalidering markerar bara datan
 * som inaktuell och LÄMNAR KVAR den tills en ny hämtning svarat — vilket är
 * precis det fönster där fel persons uppgifter syns. Vi vill att den är borta,
 * inte färsk.
 *
 * `cancelQueries` först, så att en hämtning som redan är i luften inte hinner
 * skriva tillbaka den gamla användarens svar i den tömda cachen.
 */
export async function rensaAllCache(): Promise<void> {
  try {
    await queryClient.cancelQueries()
  } catch {
    // Avbrott är best effort — en fråga som inte gick att avbryta ska inte
    // hindra själva tömningen, som är det som skyddar nästa användare.
  }
  queryClient.clear()
}
