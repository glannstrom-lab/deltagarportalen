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
import { callAI, generateCoverLetter, AiConsentRequiredError } from './aiApi'

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
