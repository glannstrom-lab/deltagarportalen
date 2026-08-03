/**
 * UX13 — serversidans art. 9-grind i `client/api/ai.js`.
 *
 * Klientens `AiConsentGate` och `aiApi`-kontrollen går båda att kringgå med ett
 * direkt `POST /api/ai`. Den här grinden är den enda som faktiskt hindrar att
 * dagboksanteckningar, måendesiffror och anpassningsbehov skickas till
 * OpenRouter i USA. Därför testas den — särskilt **fail closed**: kan samtycket
 * inte kontrolleras ska anropet blockeras, inte släppas igenom.
 *
 * (Testfilen ligger under src/ eftersom vitest bara inkluderar src/**.)
 */
import { describe, it, expect, vi } from 'vitest'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const aiHandler = require('../../api/ai.js') as {
  ART9_FUNCTIONS: Set<string>
  checkArt9Consent: (
    supabase: unknown,
    userId: string
  ) => Promise<{ allowed: boolean; reason?: string }>
}

/** Minimal Supabase-stub: from().select().eq().single() */
function stubSupabase(result: { data?: unknown; error?: unknown } | Error) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => {
            if (result instanceof Error) throw result
            return result
          }),
        })),
      })),
    })),
  }
}

describe('ART9_FUNCTIONS', () => {
  it('täcker de tre funktioner som tar emot särskilda kategorier', () => {
    expect([...aiHandler.ART9_FUNCTIONS].sort()).toEqual([
      'adaptation-conversation',
      'adaptation-recommendations',
      'vecko-reflektion',
    ])
  })

  it('grindar INTE konsulentfunktionerna — där är den registrerade en annan person', () => {
    // Att grinda dem på konsulentens eget samtycke vore fel person och falsk
    // trygghet. Rättslig grund för de vägarna är en fråga för AI-juristen (A2).
    expect(aiHandler.ART9_FUNCTIONS.has('konsulent-rapportutkast')).toBe(false)
    expect(aiHandler.ART9_FUNCTIONS.has('sta-week-summary')).toBe(false)
    expect(aiHandler.ART9_FUNCTIONS.has('sta-doa-sammanfattning')).toBe(false)
  })

  it('grindar INTE art. 6-funktionerna (CV/brev ska fortsätta fungera)', () => {
    expect(aiHandler.ART9_FUNCTIONS.has('personligt-brev')).toBe(false)
    expect(aiHandler.ART9_FUNCTIONS.has('cv-writing')).toBe(false)
  })
})

describe('checkArt9Consent', () => {
  it('tillåter när samtycke finns och AI inte är avstängt', async () => {
    const supabase = stubSupabase({
      data: { ai_consent_at: '2026-08-01T10:00:00Z', ai_enabled: true },
      error: null,
    })
    await expect(aiHandler.checkArt9Consent(supabase, 'u1')).resolves.toEqual({ allowed: true })
  })

  it('tillåter när ai_enabled är null/odefinierat (default TRUE)', async () => {
    const supabase = stubSupabase({
      data: { ai_consent_at: '2026-08-01T10:00:00Z', ai_enabled: null },
      error: null,
    })
    await expect(aiHandler.checkArt9Consent(supabase, 'u1')).resolves.toEqual({ allowed: true })
  })

  it('blockerar när ai_consent_at är NULL — själva UX13-buggen', async () => {
    const supabase = stubSupabase({ data: { ai_consent_at: null, ai_enabled: true }, error: null })
    await expect(aiHandler.checkArt9Consent(supabase, 'u1')).resolves.toEqual({
      allowed: false,
      reason: 'no_consent',
    })
  })

  it('blockerar när användaren invänt mot AI (art. 21)', async () => {
    const supabase = stubSupabase({
      data: { ai_consent_at: '2026-08-01T10:00:00Z', ai_enabled: false },
      error: null,
    })
    await expect(aiHandler.checkArt9Consent(supabase, 'u1')).resolves.toEqual({
      allowed: false,
      reason: 'opted_out',
    })
  })

  it('FAIL CLOSED: blockerar när uppslaget ger fel', async () => {
    const supabase = stubSupabase({ data: null, error: { message: 'RLS denied' } })
    await expect(aiHandler.checkArt9Consent(supabase, 'u1')).resolves.toEqual({
      allowed: false,
      reason: 'lookup_failed',
    })
  })

  it('FAIL CLOSED: blockerar när uppslaget kastar', async () => {
    const supabase = stubSupabase(new Error('nätverket dog'))
    await expect(aiHandler.checkArt9Consent(supabase, 'u1')).resolves.toEqual({
      allowed: false,
      reason: 'lookup_failed',
    })
  })

  it('FAIL CLOSED: blockerar när profilraden saknas helt', async () => {
    const supabase = stubSupabase({ data: null, error: null })
    await expect(aiHandler.checkArt9Consent(supabase, 'u1')).resolves.toEqual({
      allowed: false,
      reason: 'lookup_failed',
    })
  })
})
