/**
 * Tester för aiApi — central client för alla AI-anrop. Verifierar:
 * - Auth-token läggs till i request
 * - Korrekta error-meddelanden för 401/429/övrigt
 * - generateCoverLetter routar till rätt function-namn
 *
 * Mockar fetch + supabase.auth.getSession.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { callAI, generateCoverLetter } from './aiApi'

const mockGetSession = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
  },
}))

const mockFetch = vi.fn()

beforeEach(() => {
  mockGetSession.mockReset()
  mockFetch.mockReset()
  global.fetch = mockFetch
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

    await callAI('cv-optimering', { cvText: 'min CV' })

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
      function: 'cv-optimering',
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
