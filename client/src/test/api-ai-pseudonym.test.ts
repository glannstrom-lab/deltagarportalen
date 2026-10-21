/**
 * KC3 (2026-10-21): pseudonymisering före AI för organisationskonton.
 *
 * Carriera säljer på att namn, ålder och kön tas bort innan AI:n ser texten.
 * Jobin skickade namnet rakt av ("NEVER STRIP: Namn" i piiSanitizer.ts). För
 * konton som hör till en organisation byter nu `client/api/_utils/pseudonym.js`
 * användarens eget namn och födelseuppgifter mot platshållare innan anropet
 * lämnar servern, och sätter tillbaka dem i svaret.
 *
 * Grinden prövar tre lager:
 *  1. modulen själv (ersätter, återställer, klarar platshållare delade mellan tokens),
 *  2. varje funktion i PROMPTS — ingen prompt får bära namnet efter ersättningen,
 *  3. den riktiga handlern med stubbat nät: organisationskonto → inget namn i
 *     OpenRouter-anropet, namnet tillbaka i svaret; fristående konto → oförändrat;
 *     namnuppslaget fallerar → 503 och inget anrop alls.
 *
 * Kan falla: ta bort `pseudo.in(data)` i ai.js (lager 3 fäller), eller
 * namnreglerna i pseudonym.js (lager 1 och 2 fäller).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const AI = resolve(__dirname, '../../api/ai.js')
const LOGG = resolve(__dirname, '../../api/_utils/ai-usage-log.js')
const PSEUDO = resolve(__dirname, '../../api/_utils/pseudonym.js')

type Pseudo = {
  namnord: number
  in: (v: unknown) => unknown
  ut: (v: unknown) => unknown
  strom: () => { push: (t: string) => string; flush: () => string }
}
const { skapaPseudonymiserare } = require(PSEUDO) as {
  skapaPseudonymiserare: (p: Record<string, string | null> | null) => Pseudo
}

const PROFIL = { first_name: 'Annika', last_name: 'Lindqvist', full_name: 'Annika Lindqvist' }
const NAMN = /Annika|Lindqvist|ANNIKA|LINDQVIST/

describe('KC3: pseudonym.js', () => {
  it('ersätter eget namn, födelse, ålder och kön — och sätter tillbaka exakt', () => {
    const p = skapaPseudonymiserare(PROFIL)
    const text = 'Jag heter Annika Lindqvist (ANNIKA LINDQVIST i CV:t), född 1985-03-12, jag är 41 år. Ålder: 41. Kön: kvinna.'
    const ut = p.in(text) as string
    expect(ut).not.toMatch(NAMN)
    expect(ut).not.toMatch(/1985|41|kvinna/)
    expect(ut).toContain('[FÖRNAMN]')
    expect(ut).toContain('[EFTERNAMN]')
    expect(p.ut(ut)).toBe(text.replace('ANNIKA LINDQVIST', 'Annika Lindqvist'))
  })

  it('tar inte vanliga ord som råkar vara ett efternamn med gemen', () => {
    const p = skapaPseudonymiserare({ first_name: 'Sten', last_name: 'Berg' })
    expect(p.in('Vi vandrade på ett berg av sten.')).toBe('Vi vandrade på ett berg av sten.')
    expect(p.in('Sten Berg')).toBe('[FÖRNAMN] [EFTERNAMN]')
  })

  it('rör inte erfarenhetsår eller andra tal utan ledtråd', () => {
    const p = skapaPseudonymiserare(PROFIL)
    const text = '10 års erfarenhet, 2019–2023 på Lager AB, 41 kollin i timmen.'
    expect(p.in(text)).toBe(text)
  })

  it('går in i nästlade objekt och listor', () => {
    const p = skapaPseudonymiserare(PROFIL)
    const ut = p.in({ cvData: { firstName: 'Annika', lastName: 'Lindqvist' }, historik: [{ text: 'Hej Annika' }] })
    expect(JSON.stringify(ut)).not.toMatch(NAMN)
  })

  it('återställer platshållare som delats mellan strömmens tokens', () => {
    const p = skapaPseudonymiserare(PROFIL)
    p.in('Annika Lindqvist')
    const s = p.strom()
    let ut = ''
    for (const t of ['Hej [FÖR', 'NAMN] [EF', 'TERNAMN]', ', [x] klart']) ut += s.push(t)
    ut += s.flush()
    expect(ut).toBe('Hej Annika Lindqvist, [x] klart')
  })

  it('återställer även när modellen ändrat skiftläge i platshållaren', () => {
    const p = skapaPseudonymiserare(PROFIL)
    expect(p.ut('Hej [Förnamn]!')).toBe('Hej Annika!')
  })

  it('profil utan namn ger inga namnregler, och full_name räcker ensamt', () => {
    expect(skapaPseudonymiserare(null).namnord).toBe(0)
    const p = skapaPseudonymiserare({ first_name: null, last_name: null, full_name: 'Annika Lindqvist' })
    expect(p.in('Annika Lindqvist')).toBe('[FÖRNAMN] [EFTERNAMN]')
  })
})

describe('KC3: ingen prompt i PROMPTS bär namnet efter ersättningen', () => {
  // Namnet i alla fält en funktion kan tänkas läsa. En prompt som bygger en
  // sträng av ett fält vi inte förutsett får ändå inte läcka, eftersom
  // ersättningen sker på hela data-objektet före promptbygget.
  const UNDERLAG = {
    name: 'Annika Lindqvist', firstName: 'Annika', lastName: 'Lindqvist',
    cvData: { firstName: 'Annika', lastName: 'Lindqvist', summary: 'Annika Lindqvist, född 1985' },
    cvText: 'ANNIKA LINDQVIST\nfödd 1985-03-12', content: 'Jag heter Annika Lindqvist.',
    meddelande: 'Hej, jag är Annika och jag är 41 år.', userDataContext: 'Namn: Annika Lindqvist',
    text: 'Annika Lindqvist', cv: 'Annika Lindqvist', fritext: 'Annika', answer: 'Annika',
    question: 'Annika?', history: [{ role: 'user', content: 'Annika Lindqvist' }],
    historik: [{ roll: 'user', text: 'Annika Lindqvist' }],
  }

  function laddaPrompts() {
    delete require.cache[LOGG]
    delete require.cache[AI]
    return (require(AI) as { PROMPTS: Record<string, (d: unknown) => { system?: string; user?: string }> }).PROMPTS
  }

  const PROMPTS = laddaPrompts()
  it('hittar funktionerna (annars mäter grinden ingenting)', () => {
    expect(Object.keys(PROMPTS).length).toBeGreaterThanOrEqual(15)
  })

  it.each(Object.keys(PROMPTS))('%s', (fn) => {
    const p = skapaPseudonymiserare(PROFIL)
    let prompt: { system?: string; user?: string }
    try {
      prompt = PROMPTS[fn](p.in(UNDERLAG))
    } catch {
      // Ett fåtal prompter kräver en egen form på underlaget och kastar på
      // vårt generiska. Då går de heller inte att läcka med det.
      return
    }
    expect(`${prompt.system ?? ''}\n${prompt.user ?? ''}`).not.toMatch(NAMN)
  })
})

// ---------- Lager 3: den riktiga handlern ----------

function makeRes() {
  const skrivet: string[] = []
  const res = {
    statusCode: 200, headersSent: false, writableEnded: false,
    setHeader: vi.fn(), on: vi.fn(), off: vi.fn(),
    status(code: number) { res.statusCode = code; return res },
    json(body: unknown) { skrivet.push(JSON.stringify(body)); res.writableEnded = true; return res },
    write(s: string) { res.headersSent = true; skrivet.push(s); return true },
    end() { res.writableEnded = true },
  }
  return { res, skrivet }
}

const kodare = new TextEncoder()

function stubNetwork(opts: { org: boolean; medlem?: boolean; orgAv?: boolean; namnFel?: boolean; svar: string; strom?: string[] }) {
  const openrouter: Array<{ messages: Array<{ content: string }> }> = []
  global.fetch = vi.fn(async (input: unknown, init?: { method?: string; body?: string }) => {
    const url = String(typeof input === 'string' ? input : (input as { url: string }).url)
    const method = (init?.method || 'GET').toUpperCase()
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    if (url.includes('openrouter.ai')) {
      const body = JSON.parse(init?.body || '{}')
      openrouter.push(body)
      if (body.stream) {
        const strom = new ReadableStream<Uint8Array>({
          start(ctrl) {
            for (const t of opts.strom || []) ctrl.enqueue(kodare.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`))
            ctrl.close()
          },
        })
        return new Response(strom, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
      }
      return json({ choices: [{ message: { content: opts.svar } }], usage: { total_tokens: 40 } })
    }
    if (url.includes('/auth/v1/user')) return json({ id: 'u1', aud: 'authenticated' })
    if (url.includes('/rest/v1/rpc/check_rate_limit')) return json([{ allowed: true, remaining: 9 }])
    if (url.includes('/rest/v1/profiles') && url.includes('first_name')) {
      if (opts.namnFel) return json({ message: 'nere', code: 'XX000' }, 500)
      return json(PROFIL)
    }
    if (url.includes('/rest/v1/profiles')) return json({ ai_consent_at: '2026-08-01T10:00:00Z', ai_enabled: true })
    // Personalens eget medlemskap (KC3/KF8): både användarklientens uppslag och
    // service-klientens organisationsgrind går hit.
    if (url.includes('/rest/v1/organization_members')) {
      return json(opts.medlem ? [{ org_id: 'o1', organizations: { name: 'Testkommun', ai_enabled: !opts.orgAv } }] : [])
    }
    if (url.includes('/rest/v1/my_ai_policy')) return json(opts.org ? [{ org_name: 'Demokommunen', ai_enabled: true }] : [])
    if (url.includes('/rest/v1/ai_usage_logs') && method === 'POST') return new Response(null, { status: 201 })
    if (url.includes('/rest/v1/ai_usage_logs')) return json([])
    throw new Error(`Oväntat nätverksanrop i test: ${method} ${url}`)
  }) as unknown as typeof fetch
  return { openrouter }
}

const ENV_KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'OPENROUTER_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_KEY', 'SENTRY_DSN']
const saved: Record<string, string | undefined> = {}
const originalFetch = global.fetch

beforeEach(() => {
  for (const k of ENV_KEYS) saved[k] = process.env[k]
  process.env.VITE_SUPABASE_URL = 'https://stub.supabase.co'
  process.env.VITE_SUPABASE_ANON_KEY = 'anon-stub'
  process.env.OPENROUTER_API_KEY = 'or-stub'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-stub'
  delete process.env.SUPABASE_SERVICE_KEY
  delete process.env.SENTRY_DSN
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
  global.fetch = originalFetch
  vi.restoreAllMocks()
})

function laddaAi() {
  delete require.cache[LOGG]
  delete require.cache[AI]
  return require(AI) as (req: unknown, res: unknown) => Promise<unknown>
}

const req = (fn: string, data: Record<string, unknown>, stream = false) => ({
  method: 'POST',
  headers: { authorization: 'Bearer tok', origin: 'https://jobin.se' },
  body: { function: fn, stream, data },
})

const BREV = { jobTitle: 'Lagerarbetare', companyName: 'Lager AB', cvData: { firstName: 'Annika', lastName: 'Lindqvist', summary: 'Annika Lindqvist, född 1985, har kört truck.' } }

describe('KC3: /api/ai pseudonymiserar för organisationskonton', () => {
  it('organisationskonto: inget namn eller födelseår i anropet, namnet tillbaka i svaret', async () => {
    const { openrouter } = stubNetwork({ org: true, svar: 'Jag, [FÖRNAMN] [EFTERNAMN], söker tjänsten.' })
    const { res, skrivet } = makeRes()
    await laddaAi()(req('personligt-brev', BREV), res)

    expect(res.statusCode).toBe(200)
    expect(openrouter).toHaveLength(1)
    const skickat = openrouter[0].messages.map((m) => m.content).join('\n')
    expect(skickat).not.toMatch(NAMN)
    expect(skickat).not.toContain('1985')
    expect(skickat).toContain('pseudonymiserat')
    expect(skrivet.join('')).toContain('Jag, Annika Lindqvist, söker tjänsten.')
  })

  it('organisationskonto, ström: namnet återställs även över tokengränser', async () => {
    const { openrouter } = stubNetwork({ org: true, svar: '[]', strom: ['Hej [FÖR', 'NAMN]! Bra fråga.'] })
    const { res, skrivet } = makeRes()
    await laddaAi()(req('ai-team-chat', { meddelande: 'Jag heter Annika Lindqvist, vad gör jag nu?' }, true), res)

    expect(openrouter[0].messages.map((m) => m.content).join('\n')).not.toMatch(NAMN)
    const tokens = skrivet
      .filter((s) => s.startsWith('data: {'))
      .map((s) => JSON.parse(s.slice(6)).token)
      .filter(Boolean)
      .join('')
    expect(tokens).toBe('Hej Annika! Bra fråga.')
  })

  it('fristående konto: oförändrat beteende, namnet följer med', async () => {
    const { openrouter } = stubNetwork({ org: false, svar: 'Brevtext.' })
    const { res } = makeRes()
    await laddaAi()(req('personligt-brev', BREV), res)
    expect(openrouter[0].messages.map((m) => m.content).join('\n')).not.toContain('pseudonymiserat')
  })

  it('personal i en organisation, deltagarfunktion för egen del: pseudonymiseras och går strikt till Irland', async () => {
    const { openrouter } = stubNetwork({ org: false, medlem: true, svar: '[FÖRNAMN] [EFTERNAMN] är lagerarbetare.' })
    const { res, skrivet } = makeRes()
    await laddaAi()(req('personligt-brev', BREV), res)
    expect(res.statusCode).toBe(200)
    const skickat = openrouter[0] as unknown as { provider: { order: string[]; allow_fallbacks: boolean }; messages: Array<{ content: string }> }
    expect(skickat.messages.map((m) => m.content).join(' ')).not.toMatch(NAMN)
    expect(skickat.provider.order).toEqual(['amazon-bedrock/eu-west-1'])
    expect(skickat.provider.allow_fallbacks).toBe(false)
    expect(skrivet.join('')).toContain('Annika Lindqvist är lagerarbetare.')
  })

  it('personal i en organisation som stängt av AI: 403, inget anrop', async () => {
    const { openrouter } = stubNetwork({ org: false, medlem: true, orgAv: true, svar: 'x' })
    const { res } = makeRes()
    await laddaAi()(req('personligt-brev', BREV), res)
    expect(res.statusCode).toBe(403)
    expect(openrouter).toHaveLength(0)
  })

  it('namnuppslaget fallerar: 503 och inget anrop till OpenRouter (fail closed)', async () => {
    const { openrouter } = stubNetwork({ org: true, namnFel: true, svar: 'x' })
    const { res, skrivet } = makeRes()
    await laddaAi()(req('personligt-brev', BREV), res)
    expect(res.statusCode).toBe(503)
    expect(skrivet.join('')).toContain('AI_PSEUDONYM_FAILED')
    expect(openrouter).toHaveLength(0)
  })
})
