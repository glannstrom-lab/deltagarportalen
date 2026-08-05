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
import {
  callAI,
  callAIStream,
  sanitizeAiPayload,
  generateCoverLetter,
  generateProfileSummary,
  generateDoaSummary,
  AiConsentRequiredError,
} from './aiApi'

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
  const ART9 = [
    'vecko-reflektion',
    'adaptation-recommendations',
    'adaptation-conversation',
    // B16 (2026-08-05): AI-teamets arbetsterapeut- och motivationscoach-agenter
    // får energinivå och `supportGoals.challenges` inbakade i prompten av
    // `useAITeamContext`. Chatten låg utanför grinden fram till nu.
    'ai-team-chat',
  ]

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

  // B16: AI-teamet är portalens mest använda AI-yta. Ett fel som talar om
  // dagboksanteckningar när användaren står i en chatt gör det svårare, inte
  // lättare, att förstå vad som behöver göras.
  it('förklarar art. 9-stoppet i AI-teamets termer, inte dagbokens', async () => {
    mockProfile = { ai_consent_at: null }

    await expect(callAI('ai-team-chat', { meddelande: 'Hej' })).rejects.toThrow(/AI-teamet/)
    await expect(callAI('vecko-reflektion', {})).rejects.toThrow(/anteckningar om hälsa/)
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

  // B16: den här är den som räknas i praktiken. AI-teamet är den ENDA ytan som
  // går via `callAIStream`, och det är den vägen energinivån och stödmålen tar
  // ut ur webbläsaren. Testet ovan (`vecko-reflektion`) körs aldrig strömmande
  // i drift — det skulle alltså vara grönt även med grinden avstängd för
  // AI-teamet.
  it('stoppar AI-team-chatten utan samtycke — energinivå och stödmål lämnar inte webbläsaren', async () => {
    mockProfile = { ai_consent_at: null }

    await expect(
      callAIStream('ai-team-chat', {
        agentTyp: 'arbetsterapeut',
        userDataContext: '[ENERGINIVÅ]\nLåg energi - ge kortare svar',
      })
    ).rejects.toBeInstanceOf(AiConsentRequiredError)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('stoppar AI-team-chatten när användaren invänt mot AI (ai_enabled=false)', async () => {
    mockProfile = { ai_consent_at: '2026-08-01T10:00:00Z', ai_enabled: false }

    await expect(callAIStream('ai-team-chat', { meddelande: 'hej' }))
      .rejects.toThrow('Du har stängt av AI-behandling')
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

/**
 * B17 (2026-08-05) — ovaliderad modelloutput.
 *
 * Två wrappers castade AI-svaret rakt av. Konsekvensen var inte en krasch utan
 * något tystare: `profile-summary` kunde skriva **tomma strängen** till
 * `profiles.ai_summary` (anroparens `|| ''`-kedja), och
 * `sta-doa-sammanfattning` kunde lägga fel typ i en ruta i AF:s blankett.
 */
describe('generateProfileSummary — B17', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } })
  })

  it('returnerar den trimmade sammanfattningen när svaret är giltigt', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, summary: '  Erfaren snickare med …  ' }),
    })

    const result = await generateProfileSummary({ name: 'Anna' })

    expect(result.summary).toBe('Erfaren snickare med …')
  })

  it('kastar i stället för att låta tomma strängen sparas som sammanfattning', async () => {
    // `profileEnhancementsApi` skriver resultatet till profiles.ai_summary utan
    // egen kontroll. Kastar vi inte här sparas '' och användaren får en tom ruta
    // som ser genererad ut — med ai_summary_updated_at satt.
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, summary: '   ' }) })

    await expect(generateProfileSummary({ name: 'Anna' })).rejects.toThrow(
      'AI-tjänsten gav ingen sammanfattning'
    )
  })

  it('kastar när svaret har oväntad form', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, summary: { text: 'fel form' } }),
    })

    await expect(generateProfileSummary({ name: 'Anna' })).rejects.toThrow(
      'AI-tjänsten gav ingen sammanfattning'
    )
  })
})

describe('generateDoaSummary — B17', () => {
  const giltig = {
    malPlanering: 'Deltagaren fortsätter mot arbetsprövning.',
    kategorier: [{ title: 'Fysisk förmåga', resurserBegransningar: 'God rörlighet.' }],
  }

  beforeEach(() => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } })
  })

  it('returnerar den validerade sammanfattningen', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, sammanfattning: giltig }),
    })

    const result = await generateDoaSummary({ categories: [] })

    expect(result.sammanfattning).toEqual(giltig)
  })

  it('kastar när kategorierna saknar text — tom ruta i AF-blanketten är inget svar', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        sammanfattning: { malPlanering: 'x', kategorier: [{ title: 'Fysisk förmåga' }] },
      }),
    })

    await expect(generateDoaSummary({ categories: [] })).rejects.toThrow('oväntat format')
  })

  it('kastar när svaret är en sträng i stället för ett objekt', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, sammanfattning: 'Deltagaren har god rörlighet.' }),
    })

    await expect(generateDoaSummary({ categories: [] })).rejects.toThrow('oväntat format')
  })
})

describe('callAI — serverns formkontroll (502 AI_INVALID_RESPONSE)', () => {
  it('visar serverns förklaring i stället för det generiska kommunikationsfelet', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } })
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({
        error: 'AI-svaret hade inte det format som behövdes. Försök igen om en stund.',
        code: 'AI_INVALID_RESPONSE',
      }),
    })

    await expect(callAI('intervju-simulator', {})).rejects.toThrow(
      'AI-svaret hade inte det format som behövdes'
    )
  })

  it('faller tillbaka på det generiska felet för andra 502:or', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } })
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: 'AI request failed' }),
    })

    await expect(callAI('personligt-brev', {})).rejects.toThrow(
      'Ett fel uppstod vid kommunikation med AI-tjänsten.'
    )
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
