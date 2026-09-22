/**
 * Förbrukningsloggen som tokentaket räknar på (2026-09-22).
 *
 * Kör: npx -y deno@2.9.6 test --allow-read --allow-env supabase/functions/_shared/aiGate.test.ts
 *
 * Före: varje AI-funktion skrev raden själv i `try { await …insert() } catch {}`.
 * supabase-js kastar inte vid databasfel, så ett misslyckat insert försvann
 * tyst; raden skrevs dessutom först efter tolkningen, så ett svar som inte gick
 * att tolka förbrukade tokens som taket aldrig såg, och `ai-company-search`
 * loggade bara det första av sina två modellanrop.
 */

import { loggaAiAnvandning, tokensIUsage } from './aiGate.ts'

function assert(villkor: unknown, meddelande: string): asserts villkor {
  if (!villkor) throw new Error(meddelande)
}

type Rad = Record<string, unknown>

/** Minimal klient: `from(tabell).insert(rad)` → det svar testet väljer. */
function fejkKlient(svar: () => Promise<{ error: { message: string } | null }>) {
  const skrivet: Array<{ tabell: string; rad: Rad }> = []
  const klient = {
    from: (tabell: string) => ({
      insert: (rad: Rad) => {
        skrivet.push({ tabell, rad })
        return svar()
      },
    }),
  }
  // deno-lint-ignore no-explicit-any
  return { klient: klient as any, skrivet }
}

Deno.test('loggaAiAnvandning skriver rätt kolumner till ai_usage_logs', async () => {
  const { klient, skrivet } = fejkKlient(() => Promise.resolve({ error: null }))
  const ok = await loggaAiAnvandning(klient, { userId: 'u1', funktion: 'company-search', model: 'm', tokens: 123 })
  assert(ok === true, 'lyckat insert gav inte true')
  assert(skrivet.length === 1 && skrivet[0].tabell === 'ai_usage_logs', JSON.stringify(skrivet))
  const rad = skrivet[0].rad
  assert(rad.user_id === 'u1' && rad.function_name === 'company-search' && rad.model === 'm' && rad.tokens_used === 123,
    JSON.stringify(rad))
})

Deno.test('ett databasfel ({ error }, inget kast) rapporteras — det gamla catch-blocket nåddes aldrig', async () => {
  const { klient } = fejkKlient(() => Promise.resolve({ error: { message: 'permission denied' } }))
  const ok = await loggaAiAnvandning(klient, { userId: 'u1', funktion: 'x', model: 'm', tokens: 5 })
  assert(ok === false, 'ett misslyckat insert rapporterades som lyckat')
})

Deno.test('ett kastat fel fäller inte svaret användaren redan betalat för', async () => {
  const { klient } = fejkKlient(() => Promise.reject(new Error('nät')))
  const ok = await loggaAiAnvandning(klient, { userId: 'u1', funktion: 'x', model: 'm', tokens: 5 })
  assert(ok === false, 'kastat fel gav inte false')
})

Deno.test('tokensIUsage läser total_tokens och ger 0 för saknat/skräp', () => {
  assert(tokensIUsage({ usage: { total_tokens: 812 } }) === 812, 'läste inte total_tokens')
  assert(tokensIUsage({}) === 0, 'saknat usage')
  assert(tokensIUsage(null) === 0, 'null')
  assert(tokensIUsage({ usage: { total_tokens: 'x' } }) === 0, 'sträng')
  assert(tokensIUsage({ usage: { total_tokens: -4 } }) === 0, 'negativt')
})

// ─── GRIND över de fem AI-funktionerna ─────────────────────────────────────

const ROT = new URL('../', import.meta.url)

function aiFunktioner(): Array<{ namn: string; kalla: string }> {
  const ut: Array<{ namn: string; kalla: string }> = []
  for (const d of Deno.readDirSync(ROT)) {
    if (!d.isDirectory || d.name.startsWith('_')) continue
    try {
      const kalla = Deno.readTextFileSync(new URL(`${d.name}/index.ts`, ROT)).replace(/\r\n/g, '\n')
      if (kalla.includes('OPENROUTER_API_URL')) ut.push({ namn: d.name, kalla })
    } catch { /* katalog utan index.ts */ }
  }
  return ut
}

Deno.test('GRIND: grinden hittar AI-funktionerna (annars prövar den ingenting)', () => {
  assert(aiFunktioner().length >= 5, `hittade bara ${aiFunktioner().length}`)
})

Deno.test('GRIND: ingen AI-funktion skriver ai_usage_logs själv — bara via loggaAiAnvandning', () => {
  const egna = aiFunktioner().filter((f) => /from\(\s*['"]ai_usage_logs['"]\s*\)\s*\.insert/.test(f.kalla))
  assert(egna.length === 0, `skriver själv: ${egna.map((f) => f.namn).join(', ')}`)
})

Deno.test('GRIND: varje modellsvar loggas innan det tolkas', () => {
  const brister: string[] = []
  for (const f of aiFunktioner()) {
    const anrop = [...f.kalla.matchAll(/await fetchMedTimeout\(OPENROUTER_API_URL/g)].length
    const loggar = [...f.kalla.matchAll(/await loggaAiAnvandning\(/g)].length
    if (loggar < anrop) brister.push(`${f.namn}: ${anrop} modellanrop men ${loggar} loggningar`)
    const forstaLogg = f.kalla.indexOf('await loggaAiAnvandning(')
    const forstaSvar = f.kalla.indexOf('await aiResponse.json()')
    const tolkningsfel = f.kalla.search(/Kunde inte tolka|parseCompaniesFromResponse\(content\)/)
    if (!(forstaSvar < forstaLogg && forstaLogg < tolkningsfel)) {
      brister.push(`${f.namn}: loggningen ligger inte mellan modellsvaret och tolkningen`)
    }
  }
  assert(brister.length === 0, brister.join('\n'))
})
