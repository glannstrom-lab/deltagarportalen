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

/**
 * A19 — kopplingsvakt.
 *
 * Testerna ovan stubbar Supabase-klienten och kan därför per definition inte se
 * VILKEN klient handlern skickar in. Precis den luckan gömde en bugg i drift:
 * `auth.getUser(token)` validerar token men sätter ingen session, så en klient
 * byggd på enbart anon-nyckeln gick som `anon`, RLS gav 0 rader, `.single()`
 * blev PGRST116 och den fail closed-grindade kontrollen nekade ALLA — även de
 * 17 användare som faktiskt hade lämnat samtycke. Alla tester var gröna.
 *
 * Vakten läser källan i stället för att köra den. Det är trubbigt, men det är
 * det enda som fångar ett kopplingsfel som mockarna är blinda för.
 */
describe('A19: art. 9-uppslaget måste göras med användarens token', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path')
  const source: string = fs.readFileSync(path.join(__dirname, '../../api/ai.js'), 'utf8')

  it('bygger en tokenbärande klient för uppslaget', () => {
    expect(source).toMatch(/global:\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer \$\{token\}`/)
  })

  it('skickar den tokenbärande klienten till checkArt9Consent — inte den oautentiserade', () => {
    // `await` skiljer anropet från funktionsdeklarationen längre upp i filen.
    const call = source.match(/await\s+checkArt9Consent\(\s*([A-Za-z_$][\w$]*)\s*,/)
    expect(call, 'checkArt9Consent anropas inte alls i ai.js').not.toBeNull()

    const klientnamn = call![1]
    expect(
      klientnamn,
      'checkArt9Consent fick den oautentiserade klienten — då går uppslaget som anon och grinden nekar alla'
    ).not.toBe('supabase')

    // Den klient som skickas in ska vara den som konstrueras med Authorization-headern.
    const deklaration = new RegExp(
      `const ${klientnamn} = createClient\\([\\s\\S]{0,400}?Authorization`
    )
    expect(source).toMatch(deklaration)
  })
})
