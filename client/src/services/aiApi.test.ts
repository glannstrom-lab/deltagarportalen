/**
 * Tester för aiApi — central client för alla AI-anrop. Verifierar:
 * - Auth-token läggs till i request
 * - Korrekta error-meddelanden för 401/429/403/övrigt
 * - Art. 9-grinden (UX13): hälsodata lämnar aldrig webbläsaren utan samtycke
 * - generateCoverLetter routar till rätt function-namn
 *
 * Mockar fetch + supabase.auth.getSession + authStore-profilen.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { callAI, callAIStream, sanitizeAiPayload, generateCoverLetter, AiConsentRequiredError } from './aiApi'

const mockGetSession = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
  },
}))

let mockProfile: { ai_consent_at: string | null; ai_enabled?: boolean } | null = null
vi.mock('@/stores/authStore', () => ({
  useAuthStore: { getState: () => ({ profile: mockProfile }) },
}))

const mockFetch = vi.fn()

beforeEach(() => {
  mockGetSession.mockReset()
  mockFetch.mockReset()
  global.fetch = mockFetch
  // Default: samtycke finns — art. 9-grinden testas explicit nedan
  mockProfile = { ai_consent_at: '2026-08-01T10:00:00Z', ai_enabled: true }
})

describe('callAI', () => {
  it('kastar fel om användaren saknar session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })

    await expect(callAI('test-fn', {})).rejects.toThrow(
      'Du måste vara inloggad för att använda AI-funktioner.'
    )
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('skickar Authorization-header med session-token', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'tok-abc-123' } },
    })
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })

    await callAI('cv-writing', { cvText: 'min CV' })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/ai',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer tok-abc-123',
          'Content-Type': 'application/json',
        }),
      })
    )

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body).toEqual({
      function: 'cv-writing',
      data: { cvText: 'min CV' },
    })
  })

  it('mappar 401 till sessions-utgångs-meddelande', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'tok' } },
    })
    mockFetch.mockResolvedValue({ ok: false, status: 401 })

    await expect(callAI('test', {})).rejects.toThrow(
      'Din session har gått ut. Vänligen logga in igen.'
    )
  })

  it('mappar 429 till rate-limit-meddelande', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'tok' } },
    })
    mockFetch.mockResolvedValue({ ok: false, status: 429 })

    await expect(callAI('test', {})).rejects.toThrow(
      'För många förfrågningar. Försök igen om en stund.'
    )
  })

  it('mappar övriga fel till generiskt meddelande', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'tok' } },
    })
    mockFetch.mockResolvedValue({ ok: false, status: 500 })

    await expect(callAI('test', {})).rejects.toThrow(
      'Ett fel uppstod vid kommunikation med AI-tjänsten.'
    )
  })
})

/**
 * UX13 — art. 9-grinden. Buggen var att `vecko-reflektion` skickade
 * dagboksanteckningar och måendesiffror till OpenRouter (USA) medan
 * inställningarna visade "AI-behandling och profilering — Ej godkänt".
 *
 * Kravet dessa tester låser: **fetch får aldrig anropas** för en art. 9-funktion
 * utan samtycke. Att bara kontrollera felmeddelandet räcker inte — det som är
 * olagligt är att uppgifterna lämnar webbläsaren, inte att svaret visas.
 */
describe('callAI — art. 9-samtycke (UX13)', () => {
  const ART9 = ['vecko-reflektion', 'adaptation-recommendations', 'adaptation-conversation']

  beforeEach(() => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } })
  })

  it.each(ART9)('skickar INTE %s när ai_consent_at saknas', async (fn) => {
    mockProfile = { ai_consent_at: null }

    await expect(callAI(fn, { diary: [{ content: 'Jag mådde dåligt i tisdags' }] }))
      .rejects.toBeInstanceOf(AiConsentRequiredError)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('skickar INTE när användaren invänt mot AI (art. 21, ai_enabled=false)', async () => {
    mockProfile = { ai_consent_at: '2026-08-01T10:00:00Z', ai_enabled: false }

    await expect(callAI('vecko-reflektion', { moods: [{ mood: 2 }] }))
      .rejects.toThrow('Du har stängt av AI-behandling')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('skickar INTE när profilen inte är laddad alls', async () => {
    mockProfile = null

    await expect(callAI('vecko-reflektion', {})).rejects.toBeInstanceOf(AiConsentRequiredError)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('släpper igenom art. 9-anrop när samtycke finns', async () => {
    mockProfile = { ai_consent_at: '2026-08-01T10:00:00Z', ai_enabled: true }
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) })

    await callAI('vecko-reflektion', { moods: [] })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(JSON.parse(mockFetch.mock.calls[0][1].body).function).toBe('vecko-reflektion')
  })

  it('grindar INTE vanliga art. 6-funktioner (CV/brev fortsätter fungera utan AI-samtycke)', async () => {
    mockProfile = { ai_consent_at: null }
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) })

    await callAI('cv-writing', { cvText: 'min CV' })

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('översätter serverns 403 AI_CONSENT_REQUIRED till AiConsentRequiredError', async () => {
    // Servern är den bindande grinden: även om klientens profil ser OK ut
    // (t.ex. inaktuell cache) ska dess besked nå användaren ordagrant.
    mockProfile = { ai_consent_at: '2026-08-01T10:00:00Z', ai_enabled: true }
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Serverns text', code: 'AI_CONSENT_REQUIRED', reason: 'no_consent' }),
    })

    await expect(callAI('vecko-reflektion', {})).rejects.toThrow('Serverns text')
  })

  it('mappar 403 utan samtyckeskod till det generiska felet', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 403, json: async () => ({ error: 'nåt annat' }) })

    await expect(callAI('vecko-reflektion', {})).rejects.toThrow(
      'Ett fel uppstod vid kommunikation med AI-tjänsten.'
    )
  })
})

/**
 * B15 (2026-08-05) — strömmande anrop måste gå genom samma grindar.
 *
 * `AgentChat` gjorde ett eget `fetch` för att `callAI` inte klarar SSE. Därför
 * finns `callAIStream`, och därför testas den mot **samma** krav: art. 9-grind,
 * PII-sanering på alla nivåer, och samma HTTP-felöversättning.
 */
function sseResponse(lines: string[], init: { ok?: boolean; status?: number } = {}) {
  const encoder = new TextEncoder()
  let i = 0
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    body: {
      getReader: () => ({
        read: async () =>
          i < lines.length
            ? { done: false, value: encoder.encode(lines[i++]) }
            : { done: true, value: undefined },
      }),
    },
  }
}

describe('callAIStream', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } })
  })

  it('sätter stream: true och skickar Authorization-header', async () => {
    mockFetch.mockResolvedValue(sseResponse(['data: {"content":"hej"}\n\n', 'data: [DONE]\n\n']))

    const full = await callAIStream('ai-team-chat', { meddelande: 'hej' })

    expect(full).toBe('hej')
    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe('/api/ai')
    expect(init.headers).toMatchObject({ Authorization: 'Bearer tok' })
    expect(JSON.parse(init.body)).toMatchObject({
      function: 'ai-team-chat',
      stream: true,
      data: { meddelande: 'hej' },
    })
  })

  it('saniterar nyttolasten på alla nivåer innan den lämnar webbläsaren', async () => {
    mockFetch.mockResolvedValue(sseResponse(['data: [DONE]\n\n']))

    await callAIStream('ai-team-chat', {
      meddelande: 'Jag är 19850101-1234',
      historik: [{ roll: 'användare', innehall: 'Tidigare skrev jag 19850101-1234' }],
    })

    const body = mockFetch.mock.calls[0][1].body as string
    expect(body).not.toContain('19850101-1234')
    expect(body.match(/BORTTAGET-PERSONNUMMER/g)).toHaveLength(2)
  })

  it('sätter ihop chunkar och rapporterar dem löpande', async () => {
    mockFetch.mockResolvedValue(
      sseResponse(['data: {"content":"Hej "}\n\n', 'data: {"content":"Anna"}\n\n', 'data: [DONE]\n\n'])
    )
    const chunks: string[] = []

    const full = await callAIStream('ai-team-chat', {}, { onChunk: (c) => chunks.push(c) })

    expect(chunks).toEqual(['Hej ', 'Anna'])
    expect(full).toBe('Hej Anna')
  })

  it('accepterar legacy-fältet { token } lika väl som { content }', async () => {
    mockFetch.mockResolvedValue(sseResponse(['data: {"token":"abc"}\n\n', 'data: [DONE]\n\n']))
    await expect(callAIStream('ai-team-chat', {})).resolves.toBe('abc')
  })

  it('läser chunkar som delas mitt i en SSE-rad', async () => {
    mockFetch.mockResolvedValue(
      sseResponse(['data: {"cont', 'ent":"delad"}\n\n', 'data: [DONE]\n\n'])
    )
    await expect(callAIStream('ai-team-chat', {})).resolves.toBe('delad')
  })

  it('tar med sista raden även utan avslutande radbrytning', async () => {
    mockFetch.mockResolvedValue(sseResponse(['data: {"content":"sist"}']))
    await expect(callAIStream('ai-team-chat', {})).resolves.toBe('sist')
  })

  it('rapporterar följdfrågor', async () => {
    mockFetch.mockResolvedValue(
      sseResponse(['data: {"suggestions":["A?","B?",3]}\n\n', 'data: [DONE]\n\n'])
    )
    const onSuggestions = vi.fn()

    await callAIStream('ai-team-chat', {}, { onSuggestions })

    expect(onSuggestions).toHaveBeenCalledWith(['A?', 'B?'])
  })

  it('kastar serverns fel i strömmen i stället för att svälja det', async () => {
    // Gamla AgentChat-koden hade `throw` inuti samma try som fångade trasig
    // JSON — serverfel försvann tyst och användaren fick ett tomt svar.
    mockFetch.mockResolvedValue(sseResponse(['data: {"error":"AI request failed"}\n\n']))

    await expect(callAIStream('ai-team-chat', {})).rejects.toThrow('AI request failed')
  })

  it('hoppar över trasig JSON utan att avbryta strömmen', async () => {
    mockFetch.mockResolvedValue(
      sseResponse(['data: {inte json}\n\n', 'data: {"content":"ok"}\n\n', 'data: [DONE]\n\n'])
    )
    await expect(callAIStream('ai-team-chat', {})).resolves.toBe('ok')
  })

  it('mappar HTTP-fel som callAI (401)', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401 })
    await expect(callAIStream('ai-team-chat', {})).rejects.toThrow('Din session har gått ut')
  })

  it('översätter serverns 403 AI_CONSENT_REQUIRED', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Serverns text', code: 'AI_CONSENT_REQUIRED' }),
    })
    await expect(callAIStream('ai-team-chat', {})).rejects.toBeInstanceOf(AiConsentRequiredError)
  })

  it('kräver inloggning', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })
    await expect(callAIStream('ai-team-chat', {})).rejects.toThrow('Du måste vara inloggad')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('respekterar art. 9-grinden — data lämnar inte webbläsaren utan samtycke', async () => {
    mockProfile = { ai_consent_at: null }
    await expect(callAIStream('vecko-reflektion', { note: 'mådde dåligt' }))
      .rejects.toBeInstanceOf(AiConsentRequiredError)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('avbryter när anroparens signal aborterar, och släpper igenom AbortError', async () => {
    const controller = new AbortController()
    // Som riktig fetch: avvisar direkt om signalen redan är aborterad,
    // annars när den aborteras.
    mockFetch.mockImplementation((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        const fail = () => reject(new DOMException('Aborted', 'AbortError'))
        if (init.signal?.aborted) fail()
        else init.signal?.addEventListener('abort', fail)
      })
    )

    const promise = callAIStream('ai-team-chat', {}, { signal: controller.signal })
    controller.abort()

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
  })
})

describe('sanitizeAiPayload', () => {
  it('saniterar strängar i nästlade objekt och arrayer', () => {
    const { sanitized, stripped } = sanitizeAiPayload({
      cvData: {
        workExperience: [{ description: 'Kontonr 12345 678 901 2 för lönen' }],
      },
      titel: 'Utvecklare',
    })

    const cv = sanitized.cvData as { workExperience: Array<{ description: string }> }
    expect(cv.workExperience[0].description).toContain('[BORTTAGET-BANKKONTO]')
    expect(sanitized.titel).toBe('Utvecklare')
    expect(stripped.bankAccount).toBe(1)
  })

  it('muterar inte indatan', () => {
    const input = { historik: [{ innehall: '19850101-1234' }] }
    sanitizeAiPayload(input)
    expect(input.historik[0].innehall).toBe('19850101-1234')
  })

  it('lämnar icke-strängvärden och specialobjekt orörda', () => {
    const date = new Date('2026-08-05T00:00:00Z')
    const { sanitized } = sanitizeAiPayload({ n: 5, b: true, nil: null, date })
    expect(sanitized).toMatchObject({ n: 5, b: true, nil: null })
    expect(sanitized.date).toBe(date)
  })
})

describe('generateCoverLetter', () => {
  it('routar till "personligt-brev"-functionen med rätt data', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'tok' } },
    })
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, brev: 'Hej Acme...' }),
    })

    const result = await generateCoverLetter({
      companyName: 'Acme AB',
      jobTitle: 'Utvecklare',
      jobbAnnons: 'Vi söker en frontend-utvecklare med React-erfarenhet.',
      ton: 'professionell',
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.function).toBe('personligt-brev')
    expect(body.data).toMatchObject({
      companyName: 'Acme AB',
      jobTitle: 'Utvecklare',
      ton: 'professionell',
    })
    expect(result).toEqual({ success: true, brev: 'Hej Acme...' })
  })
})
