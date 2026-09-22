/**
 * 2026-09-22 — "Spara i dagbok" i AI-teamet hade två fel samtidigt:
 *
 * 1. Ett nekat insert gav ingen reaktion. `diary_entries` har sedan MV2
 *    `check_wellness_consent` i WITH CHECK på INSERT — på VARJE rad, även
 *    utan humör. Utan hälsosamtycke svarar databasen 42501, och knappen såg
 *    ut att inte göra något alls.
 * 2. När sparningen GICK visades ändå aldrig bocken: `diarySuccess` sattes
 *    till dagboksradens id men jämfördes mot meddelandets id.
 *
 * Mutation (kontrollerad): återställ `setDiarySuccess(entry.id)` → test 1
 * faller; ta bort `showToast.error` i nej-grenen → test 2 och 3 faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AgentChat } from './AgentChat'
import { useAITeamStore } from '@/stores/aiTeamStore'

const skapaMock = vi.fn()

vi.mock('@/services/diaryApi', () => ({
  diaryEntriesApi: { skapa: (...a: unknown[]) => skapaMock(...a) },
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: async () => ({ data: { session: { access_token: 'tok-test' } } }) },
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
  formatAITeamContext: () => '',
}))
vi.mock('@/hooks/useVoiceInput', () => ({
  useVoiceInput: () => ({ isRecording: false, isSupported: false, toggleRecording: vi.fn(), stopRecording: vi.fn() }),
}))
vi.mock('@/hooks/useVoiceOutput', () => ({
  useVoiceOutput: () => ({ isSpeaking: false, isSupported: false, speak: vi.fn(), stop: vi.fn() }),
}))

const toastErrorMock = vi.fn()
vi.mock('@/components/Toast', () => ({
  showToast: {
    success: vi.fn(),
    error: (...args: unknown[]) => toastErrorMock(...args),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

Element.prototype.scrollIntoView = vi.fn()

beforeEach(() => {
  skapaMock.mockReset()
  toastErrorMock.mockReset()
  useAITeamStore.setState({
    messages: [
      {
        id: 'm1',
        role: 'assistant',
        content: 'Skriv ner tre saker du lyckats med i veckan',
        agentId: 'arbetskonsulent',
        personalityId: 'professional',
        timestamp: new Date(),
      },
    ],
    isLoading: false,
    error: null,
  })
})

const sparaKnapp = () => screen.getByRole('button', { name: 'Spara' })

describe('AgentChat — Spara i dagbok', () => {
  it('visar bocken på rätt bubbla när sparningen lyckas', async () => {
    skapaMock.mockResolvedValue({ ok: true, entry: { id: 'dagboksrad-99' } })
    render(<AgentChat />)
    fireEvent.click(sparaKnapp())

    await waitFor(() => expect(screen.getByRole('button', { name: 'Sparat!' })).toBeInTheDocument())
    expect(toastErrorMock).not.toHaveBeenCalled()
  })

  it('säger att samtycket saknas när databasen nekar (42501) — inte tystnad', async () => {
    skapaMock.mockResolvedValue({ ok: false, orsak: 'samtycke' })
    render(<AgentChat />)
    fireEvent.click(sparaKnapp())

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledTimes(1))
    const [rubrik, text] = toastErrorMock.mock.calls[0] as [string, string]
    expect(rubrik).toMatch(/dagbok/i)
    expect(text).toMatch(/mående/i)
    expect(screen.queryByRole('button', { name: 'Sparat!' })).not.toBeInTheDocument()
  })

  it('visar ett fel vid övriga fel', async () => {
    skapaMock.mockResolvedValue({ ok: false, orsak: 'fel' })
    render(<AgentChat />)
    fireEvent.click(sparaKnapp())

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledTimes(1))
    expect(screen.queryByRole('button', { name: 'Sparat!' })).not.toBeInTheDocument()
  })
})
