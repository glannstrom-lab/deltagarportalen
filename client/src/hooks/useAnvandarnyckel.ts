/**
 * KA2 — användar-id i React Query-nycklarna.
 *
 * Bakgrunden: 40 av 40 nycklar var globala. Cachen tömdes bara av
 * utloggningsknappen, så ett kontobyte som INTE gick den vägen — en session
 * som gick ut, en token som byttes, två konton i samma flik — serverade nästa
 * användare föregående användares CV, dashboard eller måendelogg ur minnet.
 * Spontanansökan-läckan 19 augusti lagades på ett ställe av 41.
 *
 * 2026-09-08 tätades den akuta luckan: `authStore` tömmer allt centralt vid
 * `SIGNED_OUT` och vid kontobyte. Det här är andra halvan — nyckeln bär vems
 * data det är, så en träff på fel användare inte ens kan uppstå medan
 * tömningen är på väg.
 *
 * **Lägg id:t SIST i nyckeln.** React Query matchar `invalidateQueries` på
 * prefix, så `invalidateQueries({ queryKey: ['cv'] })` fortsätter träffa
 * `['cv', userId]`. Med id:t först hade varje invalidering i kodbasen behövt
 * skrivas om — och den som glömdes hade blivit en tyst icke-uppdatering.
 */
import { useAuthStore } from '@/stores/authStore'

/**
 * Den inloggades id, eller `null` innan sessionen är läst.
 *
 * `null` är ett eget nyckelvärde och alltså skilt från en riktig användare:
 * data som hämtats före inloggning kan inte serveras efter den.
 */
export function useAnvandarId(): string | null {
  return useAuthStore((state) => state.user?.id ?? null)
}

/**
 * Bygger en användarbunden nyckel. `anvandarnyckel(['cv'], id)` ger
 * `['cv', id]`.
 */
export function anvandarnyckel(
  bas: readonly unknown[],
  anvandarId: string | null,
): unknown[] {
  return [...bas, anvandarId]
}

/**
 * Hook-varianten: `const nyckel = useAnvandarnyckel()` och sedan
 * `nyckel(['cv'])`.
 */
export function useAnvandarnyckel(): (bas: readonly unknown[]) => unknown[] {
  const id = useAnvandarId()
  return (bas: readonly unknown[]) => anvandarnyckel(bas, id)
}
