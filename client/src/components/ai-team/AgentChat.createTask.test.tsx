/**
 * H20 (2026-08-12) — "Skapa uppgift i kalendern" kunde strukturellt aldrig
 * lyckas.
 *
 * `handleCreateTask` skickade tidigare `event_type`/`start_time`/`status`/
 * `is_all_day`/`metadata` till `.from('calendar_events').insert(...)` — inga
 * av dem finns i prod-tabellen (verifierat mot
 * `information_schema.columns` 2026-08-12) — och utelämnade det NOT NULL-
 * fältet `date`. Insertet kastade alltså alltid ett constraint-/kolumnfel,
 * och felet svaldes tyst av `if (!error) { ...visa lyckat... }`: deltagaren
 * klickade, ingenting hände, och ingen fick veta varför.
 *
 * Testet nedan kör den riktiga komponenten (inte en avskalad hjälpfunktion)
 * och läser den faktiska payloaden som går till `supabase.from('calendar_events').insert(...)`,
 * plus vad som visas för användaren när databasen svarar med ett fel.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AgentChat } from './AgentChat'
import { useAITeamStore } from '@/stores/aiTeamStore'

// Parametern deklareras explicit så mock.calls[0][0] blir typad — utan den ser
// tsc en tom argumenttupel och testet kan inte läsa raden det ska assertera på.
const insertMock = vi.fn(async (_row: Record<string, unknown>) => ({
  error: null as { message: string } | null,
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: async () => ({ data: { session: { access_token: 'tok-test' } } }) },
    from: (table: string) => {
      if (table === 'calendar_events') {
        return { insert: (row: Record<string, unknown>) => insertMock(row) }
      }
      // Andra tabeller (t.ex. participant_data_sharing) rörs inte av det här testet.
      return {
        select: () => ({
          eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
        }),
        upsert: async () => ({ error: null }),
        insert: async () => ({ error: null }),
      }
    },
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
  insertMock.mockReset()
  insertMock.mockResolvedValue({ error: null })
  toastErrorMock.mockReset()
  useAITeamStore.setState({
    messages: [
      {
        id: 'm1',
        role: 'assistant',
        content: 'Boka in en uppföljning nästa vecka',
        agentId: 'arbetskonsulent',
        personalityId: 'professional',
        timestamp: new Date(),
      },
    ],
    isLoading: false,
    error: null,
  })
})

function clickCreateTask() {
  const button = screen.getByRole('button', { name: 'Skapa uppgift' })
  fireEvent.click(button)
}

describe('H20: AgentChat "Skapa uppgift" skriver till calendar_events med rätt kolumner', () => {
  it('skickar bara kolumner som finns i prod-schemat, inklusive det NOT NULL:a date-fältet', async () => {
    render(<AgentChat />)
    clickCreateTask()

    await waitFor(() => expect(insertMock).toHaveBeenCalledTimes(1))

    const row = insertMock.mock.calls[0][0]

    // De fem obefintliga kolumnerna får aldrig skickas igen.
    expect(row).not.toHaveProperty('event_type')
    expect(row).not.toHaveProperty('start_time')
    expect(row).not.toHaveProperty('status')
    expect(row).not.toHaveProperty('is_all_day')
    expect(row).not.toHaveProperty('metadata')

    // Det NOT NULL-fältet date måste vara satt, i rätt format (date, inte timestamp).
    expect(row.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    // Kolumner som faktiskt finns i calendar_events.
    expect(row).toMatchObject({
      user_id: 'u1',
      title: 'AI Team: Boka in en uppföljning nästa vecka',
      description: 'Boka in en uppföljning nästa vecka',
      type: 'task',
    })
  })

  it('visar ett fel för deltagaren i stället för att svälja det tyst när insertet misslyckas', async () => {
    insertMock.mockResolvedValue({ error: { message: 'column "event_type" does not exist' } })

    render(<AgentChat />)
    clickCreateTask()

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledTimes(1))

    // Ingen falsk bekräftelse — knappen ska inte gå över till "klart"-läget.
    expect(screen.getByRole('button', { name: 'Skapa uppgift' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Uppgift skapad!' })).not.toBeInTheDocument()
  })

  it('visar bekräftelsen bara när insertet faktiskt lyckas', async () => {
    render(<AgentChat />)
    clickCreateTask()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Uppgift skapad!' })).toBeInTheDocument()
    )
    expect(toastErrorMock).not.toHaveBeenCalled()
  })
})
