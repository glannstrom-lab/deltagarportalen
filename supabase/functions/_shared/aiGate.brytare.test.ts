/**
 * AI-brytarens BETEENDE i edge-vägen (2026-09-22).
 *
 * Kör: npx -y deno@2.9.6 test --allow-read --allow-env supabase/functions/_shared/aiGate.brytare.test.ts
 *
 * Mutationsstickprovet 2026-09-22 (docs/review-2026-09-22/kvalitet/RAPPORT.md, M6)
 * bytte `if (!enabled) return { allowed: false, reason: 'opted_out' }` mot
 * `if (false) …` — och ingenting föll. `ai-sanningsregel.test.ts` kontrollerar
 * bara att de fem Perplexity-funktionerna ANROPAR `checkAiEnabled`, inte vad den
 * gör. Utan det här testet kan brytaren slås av tyst, och ett konto med
 * `ai_enabled = false` får då AI-svar från alla fem — exakt buggen som uppmättes
 * i drift 2026-08-19.
 *
 * Klienten är en fejk i prod-form: samma kedja som supabase-js
 * (`from().select().eq().maybeSingle()` resp. en thenable för listfrågorna) och
 * samma svarsform `{ data, error }`. Supabase-js KASTAR INTE vid databasfel —
 * felet kommer som `error` — så båda vägarna prövas: `{ error }` och ett kast.
 */

import { checkAiEnabled, checkOrgAiEnabled } from './aiGate.ts'

function assert(villkor: unknown, meddelande: string): asserts villkor {
  if (!villkor) throw new Error(meddelande)
}

type Svar = { data: unknown; error: { message: string } | null }
/** Per tabell: svaret, eller ett kast. */
type Tabellsvar = Record<string, Svar | Error>

/**
 * Fejkklient i supabase-js-form. Varje `from(tabell)` ger en byggare där
 * select/eq/in/limit returnerar byggaren själv, `maybeSingle()` ger svaret som
 * promise, och byggaren är en thenable (så `await client.from(x).select().eq()`
 * fungerar som i supabase-js). Tabeller testet inte nämner ger ett högljutt fel,
 * så grinden inte råkar tolka ett ofullständigt test som "ingen koppling".
 */
function fejkKlient(svar: Tabellsvar) {
  const lasta: string[] = []
  const klient = {
    from(tabell: string) {
      lasta.push(tabell)
      const utfall = (): Promise<Svar> => {
        const s = svar[tabell]
        if (s === undefined) return Promise.reject(new Error(`testet definierade inget svar för ${tabell}`))
        if (s instanceof Error) return Promise.reject(s)
        return Promise.resolve(s)
      }
      const byggare: Record<string, unknown> = {
        select: () => byggare,
        eq: () => byggare,
        in: () => byggare,
        limit: () => byggare,
        maybeSingle: () => utfall(),
        then: (ok: (v: Svar) => unknown, fel?: (e: unknown) => unknown) => utfall().then(ok, fel),
      }
      return byggare
    },
  }
  // deno-lint-ignore no-explicit-any
  return { klient: klient as any, lasta }
}

const INGEN_KOPPLING: Tabellsvar = {
  consultant_participants: { data: [], error: null },
}

Deno.test('ai_enabled = false blockerar med reason opted_out', async () => {
  const { klient } = fejkKlient({
    profiles: { data: { ai_enabled: false, ai_consent_at: '2026-01-01' }, error: null },
    ...INGEN_KOPPLING,
  })
  const r = await checkAiEnabled(klient, 'u1')
  assert(r.allowed === false, `ai_enabled=false släpptes igenom: ${JSON.stringify(r)}`)
  assert(r.reason === 'opted_out', `fel skäl: ${JSON.stringify(r)} (väntade opted_out)`)
})

Deno.test('ai_enabled = true släpps igenom (positiv kontroll — grinden stänger inte allt)', async () => {
  const { klient, lasta } = fejkKlient({
    profiles: { data: { ai_enabled: true, ai_consent_at: null }, error: null },
    ...INGEN_KOPPLING,
  })
  const r = await checkAiEnabled(klient, 'u1')
  assert(r.allowed === true && r.reason === undefined, JSON.stringify(r))
  assert(lasta[0] === 'profiles', `läste ${lasta.join(', ')} — brytaren ska läsas ur profiles`)
})

Deno.test('ai_enabled = null behandlas som påslaget (DEFAULT true i prod)', async () => {
  const { klient } = fejkKlient({
    profiles: { data: { ai_enabled: null, ai_consent_at: null }, error: null },
    ...INGEN_KOPPLING,
  })
  const r = await checkAiEnabled(klient, 'u1')
  assert(r.allowed === true, JSON.stringify(r))
})

Deno.test('FAIL CLOSED: uppslaget svarar { error } → lookup_failed', async () => {
  const { klient } = fejkKlient({
    profiles: { data: null, error: { message: 'connection refused' } },
    ...INGEN_KOPPLING,
  })
  const r = await checkAiEnabled(klient, 'u1')
  assert(r.allowed === false && r.reason === 'lookup_failed', JSON.stringify(r))
})

Deno.test('FAIL CLOSED: uppslaget kastar → lookup_failed', async () => {
  const { klient } = fejkKlient({ profiles: new Error('nät'), ...INGEN_KOPPLING })
  const r = await checkAiEnabled(klient, 'u1')
  assert(r.allowed === false && r.reason === 'lookup_failed', JSON.stringify(r))
})

Deno.test('FAIL CLOSED: ingen profilrad (RLS gav 0 rader) → lookup_failed', async () => {
  const { klient } = fejkKlient({ profiles: { data: null, error: null }, ...INGEN_KOPPLING })
  const r = await checkAiEnabled(klient, 'u1')
  assert(r.allowed === false && r.reason === 'lookup_failed', JSON.stringify(r))
})

Deno.test('FAIL CLOSED: saknad klient eller userId → lookup_failed', async () => {
  const { klient } = fejkKlient({})
  const utanId = await checkAiEnabled(klient, '')
  // deno-lint-ignore no-explicit-any
  const utanKlient = await checkAiEnabled(null as any, 'u1')
  assert(utanId.allowed === false && utanId.reason === 'lookup_failed', JSON.stringify(utanId))
  assert(utanKlient.allowed === false && utanKlient.reason === 'lookup_failed', JSON.stringify(utanKlient))
})

Deno.test('organisationens brytare: ai_enabled=false på organisationen blockerar med org_disabled', async () => {
  const { klient } = fejkKlient({
    profiles: { data: { ai_enabled: true, ai_consent_at: null }, error: null },
    consultant_participants: { data: [{ consultant_id: 'k1' }], error: null },
    organization_members: { data: [{ org_id: 'o1', organizations: { ai_enabled: false } }], error: null },
  })
  const r = await checkAiEnabled(klient, 'u1')
  assert(r.allowed === false && r.reason === 'org_disabled', JSON.stringify(r))
})

Deno.test('organisationens brytare: fail closed när kopplingsuppslaget svarar { error }', async () => {
  const { klient } = fejkKlient({
    consultant_participants: { data: null, error: { message: 'timeout' } },
  })
  const r = await checkOrgAiEnabled(klient, 'u1')
  assert(r.allowed === false && r.reason === 'lookup_failed', JSON.stringify(r))
})
