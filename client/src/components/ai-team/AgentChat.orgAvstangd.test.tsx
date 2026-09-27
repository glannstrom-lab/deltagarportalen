/**
 * RD7 (rollspelet 2026-09-27): när organisationen stängt av AI bad AI-teamet
 * Anna "Godkänna AI-behandling i Inställningar". Hon gjorde det — och fick
 * samma besked igen, för det var aldrig hennes samtycke som saknades.
 *
 * Nu visar AI-teamet organisationens beslut direkt när sidan öppnas, och tre
 * saker hon kan göra i stället. Inget skrivfält som aldrig kan lyckas, och
 * inget AI-anrop.
 *
 * Mutation: ta bort `if (orgSparr)`-grenen i AgentChat → testet faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const sparr = { varde: null as null | { org_id: string; org_name: string; ai_enabled: boolean } }
vi.mock('@/hooks/useOrgAiSparr', () => ({ useOrgAiSparr: () => sparr.varde }))

const callAIStream = vi.fn()
vi.mock('@/services/aiApi', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/services/aiApi')>()
  return { ...original, callAIStream: (...a: unknown[]) => callAIStream(...a) }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: async () => ({ data: { session: null } }) },
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
      upsert: async () => ({ error: null }),
      insert: async () => ({ error: null }),
    }),
  },
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: Object.assign(
    () => ({ user: { id: 'u1' } }),
    { getState: () => ({ profile: { ai_consent_at: '2026-09-27T10:00:00Z', ai_enabled: true } }) }
  ),
}))
vi.mock('@/hooks/useAITeamContext', () => ({
  useAITeamContext: () => ({ context: {} }),
  formatAITeamContext: () => '',
}))
vi.mock('@/hooks/useVoiceInput', () => ({
  useVoiceInput: () => ({ isRecording: false, isSupported: false, toggleRecording: vi.fn(), stopRecording: vi.fn() }),
}))
vi.mock('@/hooks/useVoiceOutput', () => ({
  useVoiceOutput: () => ({ isSpeaking: false, isSupported: false, speak: vi.fn(), stop: vi.fn() }),
}))

import { AgentChat } from './AgentChat'

const rita = () => render(<MemoryRouter><AgentChat /></MemoryRouter>)

beforeEach(() => {
  callAIStream.mockReset()
})

describe('AgentChat när organisationen stängt av AI (RD7)', () => {
  it('visar organisationens beslut och tre vägar i stället — inget skrivfält, ingen samtyckesfråga', () => {
    sparr.varde = { org_id: 'o1', org_name: 'Demostads kommun', ai_enabled: false }
    rita()
    expect(screen.getByRole('heading', { name: /valt att inte använda AI|chosen not to use AI/i })).toBeInTheDocument()
    expect(document.body.textContent).toContain('Demostads kommun')
    const lankar = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(lankar).toEqual(expect.arrayContaining(['/my-consultant', '/knowledge-base', '/cv']))
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(document.body.textContent).not.toMatch(/Godkänn AI-behandling|Inställningar/)
    expect(callAIStream).not.toHaveBeenCalled()
  })

  it('utan spärr är chatten som vanligt', () => {
    sparr.varde = null
    rita()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /valt att inte använda AI|chosen not to use AI/i })).toBeNull()
  })
})
