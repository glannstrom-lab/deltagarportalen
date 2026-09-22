/**
 * ai-career-assistant svarade 500 på en trasig begäran (2026-09-22).
 *
 * Kör: npx -y deno@2.9.6 test --allow-read supabase/functions/ai-career-assistant/begaran.test.ts
 *
 * `const { type, params } = body` kontrollerade bara `type`. Saknades `params`
 * kastade `buildSalaryCompassPrompt(undefined)` på `params.occupation`, och
 * det yttre catch-blocket svarade 500 "Ett fel uppstod" — och larmade i
 * Sentry — för vad som är ett klientfel. Samma för en kropp som inte är JSON.
 * Och det hände EFTER auth, AI-grind, tokentak och rate limit: fyra
 * databasuppslag för en begäran som aldrig kunde lyckas.
 */

import { tolkaBegaran } from './begaran.ts'

function assert(villkor: unknown, meddelande: string): asserts villkor {
  if (!villkor) throw new Error(meddelande)
}

Deno.test('giltig begäran godtas', () => {
  const r = tolkaBegaran({ type: 'salary-compass', params: { occupation: 'Undersköterska' } })
  assert(r.ok && r.type === 'salary-compass' && r.params.occupation === 'Undersköterska', JSON.stringify(r))
})

Deno.test('saknade eller felformade params ger ett klientfel, inte ett kast', () => {
  for (const body of [
    { type: 'salary-compass' },
    { type: 'interview-prep', params: null },
    { type: 'networking-help', params: 'text' },
    { type: 'education-guide', params: ['a'] },
  ]) {
    const r = tolkaBegaran(body)
    assert(!r.ok, `borde avvisas: ${JSON.stringify(body)}`)
  }
})

Deno.test('okänd typ och icke-objekt avvisas', () => {
  for (const body of [null, 'x', [], { type: 'annat', params: {} }, { params: {} }]) {
    assert(!tolkaBegaran(body).ok, `borde avvisas: ${JSON.stringify(body)}`)
  }
})

Deno.test('GRIND: index.ts tolkar begäran FÖRE auth och svarar 400 på trasig JSON', () => {
  const kalla = Deno.readTextFileSync(new URL('./index.ts', import.meta.url)).replace(/\r\n/g, '\n')
  const tolkning = kalla.indexOf('tolkaBegaran(')
  const auth = kalla.indexOf("req.headers.get('Authorization')")
  assert(tolkning > 0, 'index.ts använder inte tolkaBegaran()')
  assert(tolkning < auth, 'begäran ska tolkas före auth-uppslaget')
  assert(!/const \{ type, params \} = body/.test(kalla), 'den gamla otolkade destruktureringen finns kvar')
  // req.json() får inte ligga ofångad i det stora try-blocket (→ 500).
  assert(/await req\.json\(\)[^\n]*\.catch\(|try \{\s*\n\s*body = await req\.json\(\)/.test(kalla), 'req.json() fångas inte separat')
})
