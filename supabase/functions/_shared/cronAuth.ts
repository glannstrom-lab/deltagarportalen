// A18: delad cron-autentisering för edge-funktioner som körs server-till-server.
//
// Bakgrund: `send-inactivity-warning` hade ingen autentisering alls. Den kör med
// service role, läser `email_queue` och skickar mejl via Resend. Så länge kön är
// tom (pg_cron är inte installerat, se A6/H11) returnerar den `{processed: 0}`
// för alla — men i samma stund retention-jobbet aktiveras blir en oautentiserad
// POST en mejlutskickstrigger. Vem som helst med anon-nyckeln hade kunnat loopa
// den och skicka "ditt konto raderas snart" i otid till riktiga användare.
//
// Mönstret är hämtat från `client/api/job-alerts.js:56-80`, som redan gör rätt.
//
// **Fail closed:** saknas `CRON_SECRET` i miljön nekas anropet. En felkonfigurerad
// deploy ska vara stängd, inte öppen — det är hela poängen med den här filen.

/** Konstant-tids strängjämförelse — skyddar mot timing-attacker. */
function constantTimeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

export type CronAuthResult =
  | { ok: true }
  | { ok: false; status: number; error: string }

/**
 * Verifierar att anropet kommer från cron/en betrodd server.
 *
 * Två format stöds:
 *   1. `x-cron-secret: <secret>`        — pg_cron, GitHub Actions, externa cron
 *   2. `Authorization: Bearer <secret>` — Vercel Crons konvention
 *
 * OBS: Supabase edge-funktioner får ofta en `Authorization: Bearer <anon-jwt>`
 * från plattformen. Den matchar inte hemligheten och nekas därför korrekt —
 * anropare måste sätta `x-cron-secret` när anon-nyckeln redan upptar headern.
 */
export function verifyCronSecret(req: Request): CronAuthResult {
  const expected = Deno.env.get('CRON_SECRET')
  if (!expected) {
    console.error('[cronAuth] CRON_SECRET saknas i miljön — nekar (fail closed)')
    return { ok: false, status: 503, error: 'Cron authentication not configured' }
  }

  const xHeader = req.headers.get('x-cron-secret')
  if (xHeader && constantTimeEqual(xHeader, expected)) return { ok: true }

  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    if (constantTimeEqual(authHeader.substring(7), expected)) return { ok: true }
  }

  return { ok: false, status: 401, error: 'Unauthorized' }
}
