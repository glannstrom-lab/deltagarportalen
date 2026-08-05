/**
 * B16 + B17 — att grindarna är WIRED, inte bara att de finns.
 *
 * `aiServerResponses.test.ts` testar validatorerna som funktioner och
 * `aiServerConsentGate.test.ts` testar art. 9-uppslaget som funktion. Ingen av
 * dem fångar att handlern slutar ANROPA dem: en mutation som byter
 * `RESPONSE_VALIDATORS[fn]` mot `undefined` lämnar båda filerna gröna medan
 * modelloutput åter går ovaliderad till UI:t. Samma familj som lärdomen om
 * permissiva dubblettpolicyer i CLAUDE.md — att grinden finns är inget bevis
 * för att den gäller.
 *
 * Därför kör den här filen den riktiga Vercel-handlern hela vägen. Ingenting
 * inuti `ai.js` mockas: `supabase-js` körs på riktigt och stubben ligger på
 * **nätverkslagret** (`global.fetch`), så både auth-uppslaget, rate limit-RPC:n,
 * profil-uppslaget och OpenRouter-anropet går genom samma kod som i drift.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const handler = require('../../api/ai.js') as (req: unknown, res: unknown) => Promise<unknown>

const SUPABASE_URL = 'https://stub.supabase.co'

interface CapturedResponse {
  status: number
  body: Record<string, unknown> | null
}

/** Minimal Vercel-res som fångar status + JSON-kropp. */
function makeRes() {
  const captured: CapturedResponse = { status: 0, body: null }
  const res = {
    setHeader: vi.fn(),
    status(code: number) {
      captured.status = code
      return res
    },
    json(body: Record<string, unknown>) {
      captured.body = body
      return res
    },
    end: vi.fn(),
    write: vi.fn(),
  }
  return { res, captured }
}

function makeReq(fn: string, data: Record<string, unknown> = {}) {
  return {
    method: 'POST',
    headers: { authorization: 'Bearer tok', origin: 'https://jobin.se' },
    body: { function: fn, data },
  }
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Router-stub för nätverket.
 *
 * @param modelContent vad OpenRouter "svarade" med
 * @param profile profilraden art. 9-grinden läser
 */
function stubNetwork(
  modelContent: string,
  profile: { ai_consent_at: string | null; ai_enabled: boolean } = {
    ai_consent_at: '2026-08-01T10:00:00Z',
    ai_enabled: true,
  }
) {
  const openRouterCalls: string[] = []
  const fetchStub = vi.fn(async (input: unknown, init?: { body?: string }) => {
    void init
    const url = String(typeof input === 'string' ? input : (input as { url: string }).url)

    if (url.includes('openrouter.ai')) {
      openRouterCalls.push(url)
      return jsonResponse({
        choices: [{ message: { content: modelContent } }],
        usage: { total_tokens: 10 },
      })
    }
    if (url.includes('/auth/v1/user')) {
      // supabase-js v2 accepterar både `{ user }` och en bar användarrad.
      return jsonResponse({ id: 'u1', user: { id: 'u1' }, aud: 'authenticated' })
    }
    if (url.includes('/rest/v1/rpc/check_rate_limit')) {
      // Tom lista → handlern tolkar det som "inom kvoten".
      return jsonResponse([])
    }
    if (url.includes('/rest/v1/profiles')) {
      return jsonResponse(profile)
    }
    throw new Error(`Oväntat nätverksanrop i test: ${url}`)
  })

  global.fetch = fetchStub as unknown as typeof fetch
  return { fetchStub, openRouterCalls }
}

const savedEnv: Record<string, string | undefined> = {}
const ENV_KEYS = [
  'VITE_SUPABASE_URL',
  'SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SERVICE_KEY',
  'OPENROUTER_API_KEY',
]

beforeEach(() => {
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key]
  process.env.VITE_SUPABASE_URL = SUPABASE_URL
  process.env.VITE_SUPABASE_ANON_KEY = 'anon-stub'
  process.env.OPENROUTER_API_KEY = 'or-stub'
  delete process.env.SUPABASE_URL
  delete process.env.SUPABASE_ANON_KEY
  // Token-taket hoppas över när service-nyckeln saknas — håller stubben liten.
  delete process.env.SUPABASE_SERVICE_ROLE_KEY
  delete process.env.SUPABASE_SERVICE_KEY
})

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key]
    else process.env[key] = savedEnv[key]
  }
  vi.restoreAllMocks()
})

describe('handlern kör formkontrollen på JSON-svar (B17)', () => {
  it('svarar 502 AI_INVALID_RESPONSE när intervjusvaret saknar användbart innehåll', async () => {
    // Före B17 gick `{"kommentar":"…"}` rakt igenom: klienten fick ett objekt
    // utan feedback och utan nästa fråga, och visade en hårdkodad reservfråga
    // som såg ut att komma från AI:n.
    stubNetwork('{"kommentar":"Jag vet inte"}')
    const { res, captured } = makeRes()

    await handler(makeReq('intervju-simulator', { roll: 'Snickare', anvandarSvar: 'Jag är noggrann' }), res)

    expect(captured.status).toBe(502)
    expect(captured.body).toMatchObject({ code: 'AI_INVALID_RESPONSE' })
  })

  it('svarar 502 när DOA-sammanfattningen saknar malPlanering', async () => {
    stubNetwork('{"kategorier":[]}')
    const { res, captured } = makeRes()

    await handler(makeReq('sta-doa-sammanfattning', { categories: [] }), res)

    expect(captured.status).toBe(502)
    expect(captured.body).toMatchObject({ code: 'AI_INVALID_RESPONSE' })
  })

  it('släpper igenom ett giltigt intervjusvar och normaliserar bort skräpfält', async () => {
    stubNetwork('{"rating":4,"feedback":"  Konkret exempel  ","nastaFraga":"Vad hände sen?","extra":"skräp"}')
    const { res, captured } = makeRes()

    await handler(makeReq('intervju-simulator', { roll: 'Snickare', anvandarSvar: 'x' }), res)

    expect(captured.status).toBe(200)
    expect(captured.body?.resultat).toEqual({
      rating: 4,
      feedback: 'Konkret exempel',
      nastaFraga: 'Vad hände sen?',
    })
  })

  it('räddar ett svar som modellen lade i en markdown-fence', async () => {
    stubNetwork('```json\n{"rating":3,"feedback":"Okej","nastaFraga":"Berätta mer?"}\n```')
    const { res, captured } = makeRes()

    await handler(makeReq('intervju-simulator', { roll: 'Snickare', anvandarSvar: 'x' }), res)

    expect(captured.status).toBe(200)
    expect(captured.body?.resultat).toMatchObject({ rating: 3, feedback: 'Okej' })
  })

  it('behåller { raw }-fallbacken för funktioner som Zod-validerar hos anroparen', async () => {
    // `karriarplan` har KarriarPlanSchema i klienten och visar ett ärligt
    // formatfel. Att fälla anropet på servern hade tagit bort den vägen.
    stubNetwork('Tyvärr, jag kan inte skapa en plan.')
    const { res, captured } = makeRes()

    await handler(makeReq('karriarplan', { goal: 'Bli snickare' }), res)

    expect(captured.status).toBe(200)
    expect(captured.body?.plan).toEqual({ raw: 'Tyvärr, jag kan inte skapa en plan.' })
  })
})

describe('handlerns art. 9-grind gäller AI-team-chatten (B16)', () => {
  it('svarar 403 utan samtycke — och prompten byggs aldrig', async () => {
    // Klientgrinden i aiApi.ts går att kringgå med ett direkt POST mot
    // /api/ai. Serverns är den bindande.
    const { openRouterCalls } = stubNetwork('borde aldrig anropas', {
      ai_consent_at: null,
      ai_enabled: true,
    })
    const { res, captured } = makeRes()

    await handler(makeReq('ai-team-chat', { meddelande: 'Jag orkar inte idag' }), res)

    expect(captured.status).toBe(403)
    expect(captured.body).toMatchObject({ code: 'AI_CONSENT_REQUIRED', reason: 'no_consent' })
    expect(openRouterCalls).toEqual([])
  })

  it('svarar 403 när användaren invänt mot AI (ai_enabled = false)', async () => {
    const { openRouterCalls } = stubNetwork('borde aldrig anropas', {
      ai_consent_at: '2026-08-01T10:00:00Z',
      ai_enabled: false,
    })
    const { res, captured } = makeRes()

    await handler(makeReq('ai-team-chat', { meddelande: 'hej' }), res)

    expect(captured.status).toBe(403)
    expect(captured.body).toMatchObject({ reason: 'opted_out' })
    expect(openRouterCalls).toEqual([])
  })

  it('släpper igenom AI-team-chatten när samtycke finns', async () => {
    const { openRouterCalls } = stubNetwork('Hej! Vad kan jag hjälpa till med?')
    const { res, captured } = makeRes()

    await handler(makeReq('ai-team-chat', { meddelande: 'hej', agentTyp: 'arbetsterapeut' }), res)

    expect(captured.status).toBe(200)
    expect(openRouterCalls).toHaveLength(1)
  })
})

describe('modell-låsningen gäller i det faktiska anropet (B18)', () => {
  it('skickar den låsta modellen till OpenRouter — även med AI_MODEL_HAIKU satt', async () => {
    const savedHaiku = process.env.AI_MODEL_HAIKU
    const savedModel = process.env.AI_MODEL
    process.env.AI_MODEL_HAIKU = 'anthropic/claude-3-haiku'
    delete process.env.AI_MODEL

    const { fetchStub } = stubNetwork('Ett personligt brev.')
    const { res, captured } = makeRes()

    try {
      await handler(makeReq('personligt-brev', { jobbAnnons: 'Vi söker en snickare.' }), res)

      expect(captured.status).toBe(200)
      const openRouterCall = fetchStub.mock.calls.find((c) =>
        String(c[0]).includes('openrouter.ai')
      )
      expect(openRouterCall).toBeDefined()
      const body = JSON.parse(openRouterCall![1]?.body ?? '{}')
      expect(body.model).toBe('openai/gpt-oss-120b')
    } finally {
      if (savedHaiku === undefined) delete process.env.AI_MODEL_HAIKU
      else process.env.AI_MODEL_HAIKU = savedHaiku
      if (savedModel === undefined) delete process.env.AI_MODEL
      else process.env.AI_MODEL = savedModel
    }
  })
})
