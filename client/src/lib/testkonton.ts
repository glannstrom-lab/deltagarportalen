/**
 * testkonton — en delad allowlist över konton som är testtrafik (BL5).
 *
 * Varför: granskningen 2026-09-07 mätte att 91 av 104 AI-anrop senaste 30
 * dagarna kom från två Playwright-konton, och 30 av 31 konsulentrelationer
 * låg på Mikaels adminkonto. Varje adminmått som räknar rakt ur `profiles`
 * ljuger därför om verklig användning. Reglerna bor på ETT ställe så att
 * varje mått filtrerar likadant.
 *
 * Reglerna, och varför var och en finns:
 *   - `@jobin.test`      — domänen som alla Playwright- och KM-testkonton
 *                          skapas under (claude-playwright-consultant,
 *                          km-konsulent, km-deltagare). Domänen finns inte
 *                          på riktigt, så en riktig användare kan inte ha den.
 *   - `@example.com`     — reserverad domän (RFC 2606): test@example.com,
 *                          testuser@example.com m.fl.
 *   - exakt adress        — claude-playwright-test@jobin.se ligger på den
 *                          RIKTIGA domänen och kan bara kännas igen på hela
 *                          adressen; det är kontot vars lösenord låg i git-
 *                          historiken (SK1).
 *   - `jobin.uxtest.*@gmail.com` — UX-persona-kontona från testet 2026-07-23.
 *
 * Skiftlägesokänsligt. En riktig adress (anna@orebro.se) träffas aldrig.
 */

export const TESTKONTO_DOMANER: readonly string[] = ['jobin.test', 'example.com'] as const

export const TESTKONTO_ADRESSER: readonly string[] = ['claude-playwright-test@jobin.se'] as const

/** Prefix på lokaldelen + exakt domän. */
export const TESTKONTO_MONSTER: readonly { lokalPrefix: string; doman: string }[] = [
  { lokalPrefix: 'jobin.uxtest.', doman: 'gmail.com' },
] as const

export function arTestkonto(email: string | null | undefined): boolean {
  if (!email) return false
  const e = email.trim().toLowerCase()
  const at = e.lastIndexOf('@')
  if (at < 1) return false
  const lokal = e.slice(0, at)
  const doman = e.slice(at + 1)
  if (TESTKONTO_ADRESSER.includes(e)) return true
  if (TESTKONTO_DOMANER.includes(doman)) return true
  return TESTKONTO_MONSTER.some((m) => m.doman === doman && lokal.startsWith(m.lokalPrefix))
}
