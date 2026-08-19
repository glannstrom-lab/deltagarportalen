/**
 * Vakt för att AI-företagssökningen inte skickar personuppgifter vidare.
 *
 * Bakgrund: anrop till `/api/ai` går genom `prepareAiRequest`, som sanerar
 * nyttolasten innan den lämnar webbläsaren. Den här vägen går i stället direkt
 * till en Supabase edge-funktion och hade därför INGEN sanering alls fram till
 * 2026-08-19 — söktexten skickades ordagrant till Perplexity, som dessutom gör
 * en webbsökning på den. Söktexten är fritext, så det som skrivs där är det som
 * skickas.
 *
 * Testet mockar `fetch` och läser vad som faktiskt hamnar i kroppen. Det kan
 * falla: tas saneringen bort går första testet rött (mutationskontrollerat).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { searchCompaniesWithAI } from './aiCompanySearchApi'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: { access_token: 'test-token' } } }),
    },
  },
}))
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: { access_token: 'test-token' } } }),
    },
  },
}))

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true, query: '', companies: [], totalFound: 0, verified: 0 }),
  })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

/** Plockar ut den JSON-kropp som skickades i det senaste fetch-anropet. */
function skickadKropp(): Record<string, unknown> {
  expect(fetchMock).toHaveBeenCalled()
  const [, init] = fetchMock.mock.calls[0]
  return JSON.parse((init as RequestInit).body as string)
}

describe('searchCompaniesWithAI — PII lämnar inte webbläsaren', () => {
  it('stryker personnummer ur söktexten', async () => {
    await searchCompaniesWithAI('bagerier nära 19850612-1234 i Göteborg')
    const kropp = skickadKropp()
    expect(kropp.query).not.toContain('19850612-1234')
    expect(String(kropp.query)).toContain('[BORTTAGET-PERSONNUMMER]')
    // Resten av frågan ska vara kvar — saneringen får inte äta sökningen.
    expect(String(kropp.query)).toContain('bagerier')
    expect(String(kropp.query)).toContain('Göteborg')
  })

  it('stryker samordningsnummer, inte bara vanliga personnummer', async () => {
    await searchCompaniesWithAI('vårdföretag 19850672-1234')
    expect(String(skickadKropp().query)).not.toContain('19850672-1234')
  })

  it('lämnar en vanlig sökning orörd', async () => {
    await searchCompaniesWithAI('arkitektkontor i Malmö')
    expect(skickadKropp().query).toBe('arkitektkontor i Malmö')
  })
})

describe('searchCompaniesWithAI — maxResults klampas', () => {
  it('klampar orimligt höga värden', async () => {
    await searchCompaniesWithAI('bagerier', 9999)
    expect(skickadKropp().maxResults).toBe(25)
  })

  it('klampar noll och negativa värden till minst 1', async () => {
    await searchCompaniesWithAI('bagerier', 0)
    expect(skickadKropp().maxResults).toBe(1)
  })

  it('gör om ett icke-tal till standardvärdet — värdet interpoleras in i en systemprompt', async () => {
    await searchCompaniesWithAI('bagerier', Number.NaN)
    expect(skickadKropp().maxResults).toBe(10)
  })
})

describe('searchCompaniesWithAI — grundkrav', () => {
  it('kastar innan något skickas när söktexten är för kort', async () => {
    await expect(searchCompaniesWithAI('ab')).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
