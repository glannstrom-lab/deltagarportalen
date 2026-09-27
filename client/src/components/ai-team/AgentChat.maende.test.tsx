/**
 * RD19 (rollspelet 2026-09-27): AI-teamet sa "AI-teamet får med sig hur du mår
 * och vad du beskrivit som svårt" — utan förklaring och utan val. För en orolig
 * person låter det som övervakning.
 *
 * Nu är det ett val i chatten, avslaget från början: energinivån och det man
 * skrivit som svårt följer bara med till arbetsterapeuten och
 * motivationscoachen om deltagaren själv kryssar i det.
 *
 * Mutationer: låt formatAITeamContext ta med [STÖDMÅL]/[ENERGINIVÅ] oavsett
 * valet, eller ta bort kryssrutan → testerna faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { formatAITeamContext, type AITeamUserContext } from '@/hooks/useAITeamContext'

vi.mock('@/hooks/useOrgAiSparr', () => ({ useOrgAiSparr: () => null }))
vi.mock('@/hooks/useAITeamContext', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/hooks/useAITeamContext')>()
  return { ...original, useAITeamContext: () => ({ context: {} }) }
})
vi.mock('@/services/aiApi', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/services/aiApi')>()
  return { ...original, callAIStream: vi.fn() }
})
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: async () => ({ data: { session: null } }) },
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
      upsert: async () => ({ error: null }),
    }),
  },
}))
vi.mock('@/stores/authStore', () => ({
  useAuthStore: Object.assign(() => ({ user: { id: 'u1' } }), { getState: () => ({ profile: {} }) }),
}))
vi.mock('@/hooks/useVoiceInput', () => ({
  useVoiceInput: () => ({ isRecording: false, isSupported: false, toggleRecording: vi.fn(), stopRecording: vi.fn() }),
}))
vi.mock('@/hooks/useVoiceOutput', () => ({
  useVoiceOutput: () => ({ isSpeaking: false, isSupported: false, speak: vi.fn(), stop: vi.fn() }),
}))

import { AgentChat } from './AgentChat'
import { useAITeamStore } from '@/stores/aiTeamStore'

const kontext = {
  energyLevel: 'low',
  language: 'sv',
  supportGoals: { challenges: ['Ångest i grupp'], goals: ['Orka mer'] },
} as unknown as AITeamUserContext

beforeEach(() => {
  try { localStorage.clear() } catch { /* ok */ }
})

describe('Hur du mår följer bara med om du väljer det (RD19)', () => {
  it('utan val: varken energi eller det du skrivit som svårt skickas', () => {
    const ut = formatAITeamContext(kontext, 'arbetsterapeut', { medMaende: false })
    expect(ut).not.toMatch(/ENERGINIVÅ|STÖDMÅL|Ångest/)
  })

  it('med val: arbetsterapeuten får det', () => {
    const ut = formatAITeamContext(kontext, 'arbetsterapeut', { medMaende: true })
    expect(ut).toMatch(/\[ENERGINIVÅ\]/)
    expect(ut).toMatch(/Ångest i grupp/)
  })

  it('chatten med arbetsterapeuten har ett eget val, avslaget från början, som förklarar vad som följer med', async () => {
    useAITeamStore.setState({ selectedAgent: 'arbetsterapeut' })
    render(<MemoryRouter><AgentChat /></MemoryRouter>)
    const val = screen.getByRole('checkbox', { name: /hur jag mår/i })
    expect(val).not.toBeChecked()
    expect(document.body.textContent).toMatch(/energi/i)
    await userEvent.click(val)
    expect(val).toBeChecked()
  })

  it('beskedet om samtycke påstår inte längre att måendet alltid följer med', async () => {
    const { AiConsentRequiredError } = await import('@/services/aiApi')
    expect(AiConsentRequiredError).toBeDefined()
    const kallkod = (await import('@/services/aiApi?raw')).default as string
    expect(kallkod).not.toContain('AI-teamet får med sig hur du mår')
  })
})
