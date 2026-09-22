/**
 * 2026-09-22: 429-svaret speglade godtycklig Origin.
 *
 * Kör: npx -y deno@2.9.6 test --allow-read --allow-env supabase/functions/_shared/rateLimit.test.ts
 *
 * `createRateLimitResponse(retryAfter, origin)` satte
 * `Access-Control-Allow-Origin: <vad anroparen än skickade>`. Alla andra svar
 * går genom `getCorsHeaders()` i cors.ts, som bara släpper igenom
 * allowlistade origins. Anroparna (proxyGuard och tre ai-*-funktioner)
 * skickar in rå `req.headers.get('origin')`, och i proxyGuard sker
 * rate-limit-kontrollen FÖRE origin-valideringen — en främmande sajt fick
 * alltså läsa 429-svaret, och svaret saknade `Vary: Origin` så en cache
 * kunde servera en främlings ACAO till nästa anropare.
 */

import { createRateLimitResponse } from './rateLimit.ts'

function assert(villkor: unknown, meddelande: string): asserts villkor {
  if (!villkor) throw new Error(meddelande)
}

Deno.test('429: en okänd origin speglas inte', () => {
  const svar = createRateLimitResponse(30, 'https://ond.example')
  assert(svar.status === 429, `status ${svar.status}`)
  assert(svar.headers.get('Access-Control-Allow-Origin') === null,
    `ACAO speglade en främmande origin: ${svar.headers.get('Access-Control-Allow-Origin')}`)
  assert(svar.headers.get('Retry-After') === '30', 'Retry-After saknas')
})

Deno.test('429: en tillåten origin får samma CORS-headers som andra svar', () => {
  const svar = createRateLimitResponse(30, 'https://www.jobin.se')
  assert(svar.headers.get('Access-Control-Allow-Origin') === 'https://www.jobin.se', 'ACAO saknas för jobin.se')
  assert(svar.headers.get('Vary') === 'Origin', 'Vary: Origin saknas')
})

Deno.test('429: maskinanrop utan Origin får inga CORS-headers', () => {
  const svar = createRateLimitResponse(5, null)
  assert(svar.headers.get('Access-Control-Allow-Origin') === null, 'ACAO utan Origin')
})
