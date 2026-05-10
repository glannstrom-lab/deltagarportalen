/**
 * Onboarding Coordinator — frequency-cap för onboarding-modaler.
 *
 * KONTRAKT (DESIGN.md §12):
 *   - Max 1 onboarding-modal per session
 *   - Andra anrop i samma session returnerar false → komponenten visar inte
 *   - Persisterar BARA i sessionStorage (ny session = ny chans)
 *   - Använder ID-baserad coordinator: första som claim:ar vinner
 *
 * EXEMPEL:
 *   const canShow = claimOnboardingSession('cv-builder')
 *   if (canShow) setShowModal(true)
 *
 * Detta löser bug B2 som visade flera onboardings samtidigt på AI Team-sidan
 * (ett av problemen i audit-2026-05-10/RAPPORT.md). När en användare först
 * landar och en onboarding-modal claim:ar sessionen kan inga andra dyka upp.
 */

const SESSION_KEY = 'jobin-onboarding-session-claimed'

/**
 * Försök claim:a session för en specifik onboarding. Returnerar true om
 * denna komponent får visa sig (ingen annan har claim:at än), annars false.
 *
 * @param ownerId Unik identifier för komponenten som vill visa onboarding
 *                (t.ex. 'cv-builder', 'ai-team', 'profile-welcome')
 * @returns true om komponenten får visa onboarding, false annars
 */
export function claimOnboardingSession(ownerId: string): boolean {
  try {
    const claimed = sessionStorage.getItem(SESSION_KEY)
    if (claimed && claimed !== ownerId) {
      // Någon annan komponent har redan claim:at sessionen
      return false
    }
    sessionStorage.setItem(SESSION_KEY, ownerId)
    return true
  } catch {
    // sessionStorage kan vara blockerat (privat-läge etc) — låt onboardings
    // visas i fallback-läge så användare inte missar funktionen
    return true
  }
}

/**
 * Släpp sessionsclaimen — anropas när onboarding-komponenten avmonteras eller
 * användaren klar / dismiss:ar den. Tillåter andra onboardings att visa sig
 * efter sidnavigation om sessionen är "klar".
 */
export function releaseOnboardingSession(ownerId: string): void {
  try {
    const current = sessionStorage.getItem(SESSION_KEY)
    if (current === ownerId) {
      sessionStorage.removeItem(SESSION_KEY)
    }
  } catch {
    // ignore
  }
}

/**
 * Kontrollera om en specifik onboarding redan har visats permanent
 * (localStorage). Använd med en `key` som identifierar onboarding-typen.
 *
 * Detta separat från session-claim eftersom localStorage är persistent
 * (har visat innan?) medan sessionStorage är "just nu".
 */
export function hasCompletedOnboarding(key: string): boolean {
  try {
    return localStorage.getItem(`onboarding-completed:${key}`) === 'true'
  } catch {
    return false
  }
}

export function markOnboardingCompleted(key: string): void {
  try {
    localStorage.setItem(`onboarding-completed:${key}`, 'true')
  } catch {
    // ignore
  }
}
