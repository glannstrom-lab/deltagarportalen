/**
 * Centralt register för att nollställa Zustand-stores vid utloggning och
 * kontobyte.
 *
 * Bakgrund (uppdrag 2026-09-22, "persistens och utloggning"): React
 * Query-cachen rensas redan vid signOut och kontobyte (`rensaAllCache`,
 * `lib/queryClient.ts`, KA2), localStorage-utkasten likaså (A31,
 * `clearUserScopedStorage` i `utils/safeStorage.ts`), och IndexedDB
 * (`careerOfflineCache.rensaAllt()`). Ingen av dem rör Zustand-storesens
 * EGNA in-memory state.
 *
 * En Zustand-store är ett modulnivå-singleton — den lever så länge fliken
 * gör det. `useAITeamStore.messages` (samtal med AI-coachen, kan beröra
 * mående), `useProfileStore.preferences` (lön, önskade yrken,
 * stödmål/utmaningar) och `useProfileStore.pendingUpdates` (en offline-kö
 * som SKICKAS till servern vid nästa `updatePreferences`-anrop) ligger kvar
 * i minnet tills något skriver över dem. Loggar nästa deltagare in i samma
 * flik utan en full omladdning — utgången session, eller `onAuthStateChange`
 * med ett nytt `user.id` — ser hon annars fortfarande föregående deltagares
 * data. Exakt samma buggklass som React Query-cache-läckan 2026-08-19, en
 * våning ned.
 *
 * Mönstret: varje store som håller deltagarinnehåll registrerar en
 * rensningsfunktion här när modulen laddas (se t.ex. `stores/profileStore.ts`
 * längst ned). `authStore.signOut()` och `hanteraAuthByte`
 * (`SIGNED_OUT` + kontobyte) anropar `rensaVidUtloggning()` en gång — de
 * behöver inte känna till enskilda stores, och en ny store som läggs till
 * glöms inte bort så länge den registrerar sig här.
 *
 * Nycklar/fält som ska överleva utloggning med flit (språk, tema,
 * tillgänglighetsinställningar som inte är personuppgifter) rörs INTE av
 * någon rensare — varje store avgör själv vad som är innehåll och vad som
 * är en inställning, och motiverar undantaget i sin egen rensningsfunktion
 * (se `stores/settingsStore.ts`).
 */

type Rensare = () => void

const rensare: Rensare[] = []

/**
 * Registrerar en rensningsfunktion. Anropas en gång per store-modul, vid
 * modulladdning (samma mönster som `authStore.registreraAuthLyssnare`).
 */
export function registreraRensning(fn: Rensare): void {
  rensare.push(fn)
}

/**
 * Kör alla registrerade rensningar. Fail-safe per rensare — samma princip
 * som `clearUserScopedStorage`: en trasig store ska inte hindra att de andra
 * rensas, för det är den totala rensningen som skyddar nästa deltagare.
 */
export function rensaVidUtloggning(): void {
  for (const fn of rensare) {
    try {
      fn()
    } catch (error) {
      console.error('rensaVidUtloggning: en rensare kastade', error)
    }
  }
}

/**
 * Test-hjälp: nollställ registret mellan tester så de inte ärver rensare
 * som andra testfiler registrerat (modulerna laddas en gång per testkörning
 * och registrerar sig då — utan detta delar alla tester samma lista).
 */
export function _rensaRegisterForTest(): void {
  rensare.length = 0
}
