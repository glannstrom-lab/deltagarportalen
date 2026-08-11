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
  AI_ENABLED_EXEMPT_FUNCTIONS: Set<string>
  checkAiEnabled: (
    supabase: unknown,
    userId: string
  ) => Promise<{ allowed: boolean; reason?: string }>
  PROMPTS: Record<string, (data: Record<string, unknown>) => { system: string; user: string }>
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
  it('täcker de funktioner som tar emot särskilda kategorier', () => {
    expect([...aiHandler.ART9_FUNCTIONS].sort()).toEqual([
      'adaptation-conversation',
      'adaptation-recommendations',
      'ai-team-chat',
      'vecko-reflektion',
    ])
  })

  // B16 (2026-08-05): `ai-team-chat` låg utanför grinden trots att prompten
  // aktivt bygger in energinivå och användarens egna beskrivna hinder. Den
  // egna assertionen finns för att raden ska vara svår att ta bort av misstag
  // — listtestet ovan går att "fixa" genom att bara stryka namnet.
  it('grindar AI-team-chatten — energinivå och stödmål är art. 9-data om användaren själv', () => {
    expect(aiHandler.ART9_FUNCTIONS.has('ai-team-chat')).toBe(true)
  })

  // Vakt mot att grinden "harmoniseras" bort: prompten för arbetsterapeuten
  // säger uttryckligen att agenten har användarens energinivå. Ändras det
  // ska någon aktivt ta ställning till om grinden fortfarande behövs.
  it('arbetsterapeut-prompten bär fortfarande hälsokontext (motiverar grinden)', () => {
    const prompt = aiHandler.PROMPTS['ai-team-chat']({ agentTyp: 'arbetsterapeut' })
    expect(prompt.system.toLowerCase()).toContain('energinivå')
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
 * B28 (2026-08-12) — den allmänna AI-av-grinden i `client/api/ai.js`.
 *
 * `checkArt9Consent` ovan kollar `ai_enabled` bara för de fyra ART9-
 * funktionerna. `checkAiEnabled` är den motsvarande grinden för de andra 14
 * — samma profil-uppslag, samma fail-closed-policy, men bara `ai_enabled`
 * (art. 9-funktionerna kräver DESSUTOM `ai_consent_at`, vilket hör hemma i
 * `checkArt9Consent`, inte här).
 */
describe('AI_ENABLED_EXEMPT_FUNCTIONS', () => {
  it('undantar exakt de fyra konsulentfunktionerna — inte fler, inte färre', () => {
    expect([...aiHandler.AI_ENABLED_EXEMPT_FUNCTIONS].sort()).toEqual([
      'konsulent-rapportutkast',
      'sta-doa-sammanfattning',
      'sta-document-draft',
      'sta-week-summary',
    ])
  })

  it('undantar INTE art. 6-funktionerna — där är läckan B28 hittade', () => {
    expect(aiHandler.AI_ENABLED_EXEMPT_FUNCTIONS.has('personligt-brev')).toBe(false)
    expect(aiHandler.AI_ENABLED_EXEMPT_FUNCTIONS.has('chatbot')).toBe(false)
    expect(aiHandler.AI_ENABLED_EXEMPT_FUNCTIONS.has('cv-writing')).toBe(false)
  })
})

describe('checkAiEnabled', () => {
  it('tillåter när ai_enabled är true', async () => {
    const supabase = stubSupabase({ data: { ai_enabled: true }, error: null })
    await expect(aiHandler.checkAiEnabled(supabase, 'u1')).resolves.toEqual({ allowed: true })
  })

  it('tillåter när ai_enabled är null/odefinierat (default TRUE)', async () => {
    const supabase = stubSupabase({ data: { ai_enabled: null }, error: null })
    await expect(aiHandler.checkAiEnabled(supabase, 'u1')).resolves.toEqual({ allowed: true })
  })

  it('blockerar när användaren stängt av AI (ai_enabled = false) — själva B28-buggen', async () => {
    const supabase = stubSupabase({ data: { ai_enabled: false }, error: null })
    await expect(aiHandler.checkAiEnabled(supabase, 'u1')).resolves.toEqual({
      allowed: false,
      reason: 'opted_out',
    })
  })

  it('FAIL CLOSED: blockerar när uppslaget ger fel', async () => {
    const supabase = stubSupabase({ data: null, error: { message: 'RLS denied' } })
    await expect(aiHandler.checkAiEnabled(supabase, 'u1')).resolves.toEqual({
      allowed: false,
      reason: 'lookup_failed',
    })
  })

  it('FAIL CLOSED: blockerar när uppslaget kastar', async () => {
    const supabase = stubSupabase(new Error('nätverket dog'))
    await expect(aiHandler.checkAiEnabled(supabase, 'u1')).resolves.toEqual({
      allowed: false,
      reason: 'lookup_failed',
    })
  })

  it('FAIL CLOSED: blockerar när profilraden saknas helt', async () => {
    const supabase = stubSupabase({ data: null, error: null })
    await expect(aiHandler.checkAiEnabled(supabase, 'u1')).resolves.toEqual({
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

  // B28: samma kopplingsfälla gäller den nya allmänna grinden — en framtida
  // refaktorering som råkar skicka `supabase` (anon) i stället för
  // `supabaseAsUser` skulle neka ALLA 14 funktioner permanent, tyst.
  it('skickar den tokenbärande klienten till checkAiEnabled — inte den oautentiserade', () => {
    const call = source.match(/await\s+checkAiEnabled\(\s*([A-Za-z_$][\w$]*)\s*,/)
    expect(call, 'checkAiEnabled anropas inte alls i ai.js').not.toBeNull()

    const klientnamn = call![1]
    expect(
      klientnamn,
      'checkAiEnabled fick den oautentiserade klienten — då går uppslaget som anon och grinden nekar alla'
    ).not.toBe('supabase')

    const deklaration = new RegExp(
      `const ${klientnamn} = createClient\\([\\s\\S]{0,400}?Authorization`
    )
    expect(source).toMatch(deklaration)
  })
})
