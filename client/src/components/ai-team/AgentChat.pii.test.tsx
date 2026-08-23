/**
 * B15 — AgentChat får inte gå förbi PII-saneringen.
 *
 * AgentChat gjorde fram till 2026-08-05 ett eget `fetch('/api/ai')` i stället
 * för att gå via `aiApi`. Portalens mest använda AI-yta skickade därför
 * personnummer, kortnummer och bankkonton osaniterade till OpenRouter (USA).
 *
 * Det som testas här är **vad som faktiskt lämnar webbläsaren**, inte att en
 * hjälpfunktion blev anropad: `aiApi`, `piiSanitizer` och komponenten körs på
 * riktigt, och assertionen läser den JSON-kropp som gick in i `fetch`. Ett test
 * som mockar `callAIStream` hade gått grönt även med det gamla råa fetch:et
 * kvar (jfr. lärdomarna om mockar/fixturer i CLAUDE.md).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRef } from 'react'
import { render, act } from '@testing-library/react'
import { AgentChat, type AgentChatHandle } from './AgentChat'
import { useAITeamStore } from '@/stores/aiTeamStore'

const mockGetSession = vi.fn(async () => ({
  data: { session: { access_token: 'tok-test' } },
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: () => mockGetSession() },
    from: () => ({
      select: () => ({
        eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
      }),
      upsert: async () => ({ error: null }),
      insert: async () => ({ error: null }),
    }),
  },
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: Object.assign(
    () => ({ user: { id: 'u1' } }),
    { getState: () => ({ profile: { ai_consent_at: '2026-08-01T10:00:00Z', ai_enabled: true } }) }
  ),
}))

vi.mock('@/hooks/useAITeamContext', () => ({
  useAITeamContext: () => ({ context: { hasCV: false } }),
  // Kontextsträngen byggs normalt av profil-/CV-data. Att lägga ett
  // personnummer här speglar verkligheten: fältet är fri text från användaren.
  formatAITeamContext: () => 'Bio: Ring mig på 19850101-1234 om det behövs.',
}))

vi.mock('@/hooks/useVoiceInput', () => ({
  useVoiceInput: () => ({ isRecording: false, isSupported: false, toggleRecording: vi.fn(), stopRecording: vi.fn() }),
}))
vi.mock('@/hooks/useVoiceOutput', () => ({
  useVoiceOutput: () => ({ isSpeaking: false, isSupported: false, speak: vi.fn(), stop: vi.fn() }),
}))

/** Bygger ett Response-liknande objekt med en riktig SSE-ström. */
function sseResponse(lines: string[]) {
  const encoder = new TextEncoder()
  let i = 0
  return {
    ok: true,
    status: 200,
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

const mockFetch = vi.fn()

// jsdom saknar scrollIntoView — AgentChat autoscrollar vid varje nytt meddelande.
Element.prototype.scrollIntoView = vi.fn()

/** JSON-kroppen som skickades till /api/ai i anrop nr `n` (0-indexerat). */
function sentBody(n = 0) {
  return JSON.parse(mockFetch.mock.calls[n][1].body) as {
    function: string
    stream?: boolean
    data: Record<string, unknown>
  }
}

beforeEach(() => {
  mockFetch.mockReset()
  global.fetch = mockFetch as unknown as typeof fetch
  mockFetch.mockResolvedValue(sseResponse(['data: {"content":"Hej!"}\n\n', 'data: [DONE]\n\n']))
  useAITeamStore.setState({ messages: [], isLoading: false, error: null })
})

async function sendViaChat(text: string) {
  const ref = createRef<AgentChatHandle>()
  render(<AgentChat ref={ref} />)
  await act(async () => {
    await ref.current!.sendMessage(text)
  })
}

describe('B15: AgentChat saniterar PII innan anropet lämnar webbläsaren', () => {
  it('strippar personnummer ur meddelandet', async () => {
    await sendViaChat('Mitt personnummer är 19850101-1234, kan du hjälpa mig?')

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const body = sentBody()
    expect(body.function).toBe('ai-team-chat')
    expect(body.stream).toBe(true)
    expect(body.data.meddelande).toBe(
      'Mitt personnummer är [BORTTAGET-PERSONNUMMER], kan du hjälpa mig?'
    )
  })

  it('inget personnummer finns kvar någonstans i den skickade kroppen', async () => {
    await sendViaChat('19850101-1234 är mitt personnummer')

    // Den hårda regeln: siffrorna får inte förekomma i råkroppen alls —
    // oavsett vilket fält de skulle ha råkat hamna i.
    expect(mockFetch.mock.calls[0][1].body).not.toContain('19850101-1234')
    expect(mockFetch.mock.calls[0][1].body).toContain('[BORTTAGET-PERSONNUMMER]')
  })

  it('saniterar även userDataContext (CV-/profildata, inte bara det som skrivs i chatten)', async () => {
    await sendViaChat('Hej')

    expect(sentBody().data.userDataContext).toBe(
      'Bio: Ring mig på [BORTTAGET-PERSONNUMMER] om det behövs.'
    )
  })

  it('saniterar historiken — inte bara toppnivåns strängar', async () => {
    // Regressionsvakt: `sanitizeObjectForAi` tittar bara på toppnivån. Med den
    // hade det första meddelandet strippats och sedan följt med osaniterat i
    // varje efterföljande anrop via `historik`.
    useAITeamStore.setState({
      messages: [
        {
          id: 'm1',
          role: 'user',
          content: 'Jag heter Anna, 19850101-1234',
          agentId: 'arbetskonsulent',
          personalityId: 'professional',
          timestamp: new Date(),
        },
      ],
    })

    await sendViaChat('Vad kan du hjälpa mig med?')

    const historik = sentBody().data.historik as Array<{ roll: string; innehall: string }>
    expect(historik).toHaveLength(1)
    expect(historik[0].innehall).toBe('Jag heter Anna, [BORTTAGET-PERSONNUMMER]')
    expect(mockFetch.mock.calls[0][1].body).not.toContain('19850101-1234')
  })

  it('strippar kortnummer (Luhn-giltigt) ur meddelandet', async () => {
    await sendViaChat('Kortet 4539 1488 0343 6467 drogs fel')

    expect(sentBody().data.meddelande).toContain('[BORTTAGET-KORTNUMMER]')
    expect(mockFetch.mock.calls[0][1].body).not.toContain('4539')
  })

  it('skickar Authorization-header från sessionen', async () => {
    await sendViaChat('Hej')

    expect(mockFetch.mock.calls[0][0]).toBe('/api/ai')
    expect(mockFetch.mock.calls[0][1].headers).toMatchObject({
      Authorization: 'Bearer tok-test',
    })
  })

  it('lägger AI-svaret i store när strömmen är klar', async () => {
    mockFetch.mockResolvedValue(
      sseResponse(['data: {"content":"Hej "}\n\n', 'data: {"content":"Anna!"}\n\n', 'data: [DONE]\n\n'])
    )

    await sendViaChat('Hej')

    const messages = useAITeamStore.getState().messages
    expect(messages.at(-1)).toMatchObject({ role: 'assistant', content: 'Hej Anna!' })
  })
})

/**
 * Källvakt. Testerna ovan kan bara se det fetch som faktiskt körs — de kan inte
 * se om NÅGON lägger tillbaka ett rått `/api/ai`-anrop i en annan kodväg i
 * komponenten. Vakten läser källan i stället, samma trubbiga men effektiva
 * grepp som A19-vakten i aiServerConsentGate.test.ts.
 */
describe('B15: ai-team-komponenterna har inget eget /api/ai-anrop kvar', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path')

  const dir = __dirname
  const files = fs.readdirSync(dir).filter((f) => /\.tsx?$/.test(f) && !f.includes('.test.'))

  it.each(files)('%s anropar inte /api/ai direkt', (file) => {
    const source = fs.readFileSync(path.join(dir, file), 'utf8')
    expect(
      source,
      `${file} gör ett eget anrop till /api/ai — då körs varken PII-saneringen eller art. 9-grinden. Gå via callAI/callAIStream i @/services/aiApi.`
    ).not.toMatch(/fetch\(\s*['"`]\/api\/ai/)
  })
})

/**
 * Dubbelsändningsspärren.
 *
 * `sendMessage` börjar med `if (!text || isLoading || isStreaming) return`.
 * Vakten fanns, men INGET test prövade den: en riktad mutation som tog bort
 * `isLoading || isStreaming` 2026-08-23 lämnade samtliga 26 tester gröna.
 * Ett andra anrop mitt i ett pågående svar hade skickat en ny fråga till
 * modellen — dubbel kostnad, och två svar som skriver över varandra i vyn.
 */
describe('AgentChat spärrar ett andra anrop medan svaret hämtas', () => {
  it('skickar bara ett anrop när två meddelanden avfyras samtidigt', async () => {
    // En ström som inte blir klar förrän vi säger till — håller anropet igång.
    let släpp: (() => void) | null = null
    const hänger = new Promise<void>((r) => { släpp = r })
    mockFetch.mockReset()
    mockFetch.mockImplementation(async () => ({
      ok: true,
      status: 200,
      body: {
        getReader: () => ({
          read: async () => {
            await hänger
            return { done: true, value: undefined }
          },
        }),
      },
    }))

    const ref = createRef<AgentChatHandle>()
    render(<AgentChat ref={ref} />)

    // Starta det första anropet utan att vänta in det — det är poängen.
    let första: Promise<void> | undefined
    await act(async () => {
      första = ref.current!.sendMessage('Första frågan')
      await Promise.resolve()
    })

    await act(async () => {
      await ref.current!.sendMessage('Andra frågan')
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)

    släpp!()
    await act(async () => { await första })
  })
})
