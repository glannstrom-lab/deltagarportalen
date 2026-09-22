/**
 * En OpenRouter-timeout svarade 500 i stället för 504 (2026-09-22).
 *
 * Kör: npx -y deno@2.9.6 test --allow-read supabase/functions/_shared/felstatus.test.ts
 *
 * `fetchMedTimeout` kastar `TidsgransError` när tidsgränsen löper ut (ST4).
 * Alla fem AI-funktionerna fångade det i sitt yttre catch-block och svarade
 * 500 "Ett fel uppstod" — samma kod som en krasch i vår egen kod, och
 * medFelrapport larmade för båda likadant. En motpart som inte svarar i tid
 * är en 504: felet ligger uppströms, och ett nytt försök kan lyckas.
 */

import { felstatus } from './felstatus.ts'
import { TidsgransError } from './fetchMedTimeout.ts'

function assert(villkor: unknown, meddelande: string): asserts villkor {
  if (!villkor) throw new Error(meddelande)
}

Deno.test('TidsgransError → 504', () => {
  const r = felstatus(new TidsgransError('https://openrouter.ai/api/v1/chat/completions', 55_000))
  assert(r.status === 504, `status ${r.status}`)
  assert(!r.error.includes('openrouter'), 'motpartens URL ska inte ut i svaret')
})

Deno.test('allt annat → 500', () => {
  for (const e of [new Error('x'), new TypeError('y'), 'sträng', null]) {
    assert(felstatus(e).status === 500, `borde vara 500: ${String(e)}`)
  }
})

Deno.test('GRIND: varje AI-funktions yttre catch går via felstatus()', () => {
  for (const fn of ['ai-career-assistant', 'ai-commute-planner', 'ai-company-analysis', 'ai-company-search', 'ai-industry-radar']) {
    const kalla = Deno.readTextFileSync(new URL(`../${fn}/index.ts`, import.meta.url)).replace(/\r\n/g, '\n')
    // Det sista catch-blocket i filen är den yttre fångsten runt hela hanteraren.
    const sista = kalla.slice(kalla.lastIndexOf('} catch ('))
    assert(sista.includes('felstatus('), `${fn}: yttre catch svarar inte via felstatus() — en timeout blir 500`)
  }
})
