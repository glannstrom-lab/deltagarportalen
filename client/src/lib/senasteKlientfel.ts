/**
 * De senaste felen i webbläsaren, för felrapporten i Tyck till.
 *
 * En ringbuffert med högst fem korta rader (meddelande, aldrig stack eller
 * data). Läses bara när användaren själv skickar en felrapport — ingenting
 * skickas automatiskt. Sentry har sitt eget, sanerade spår; det här är bara
 * det användaren kan se bifogas.
 */
const MAX = 5
const fel: string[] = []

export function registreraKlientfel(meddelande: unknown): void {
  const text = String(meddelande ?? '').trim().slice(0, 300)
  if (!text) return
  const rad = `${new Date().toISOString().slice(11, 19)} ${text}`
  fel.push(rad)
  if (fel.length > MAX) fel.shift()
}

export function senasteKlientfel(): string[] {
  return [...fel]
}

let installerad = false

/** Lyssnar på okända fel och avvisade löften. Anropas en gång från main.tsx. */
export function installeraKlientfelBuffert(): void {
  if (installerad || typeof window === 'undefined') return
  installerad = true
  window.addEventListener('error', (e) => registreraKlientfel(e.message))
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason
    registreraKlientfel(r instanceof Error ? r.message : r)
  })
}

/** Bara för tester. */
export function _nollstallKlientfel(): void {
  fel.length = 0
}
