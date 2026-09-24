/**
 * profileEnhancementsApi KASTAR vid läsfel sedan 2026-09-24. De fyra
 * profilsektionerna loggade tidigare bara felet och visade sedan samma sak
 * som en tom lista ("Inga dokument uppladdade än") — laddning/fel är inte
 * tomhet. Nu ska ett läsfel synas som ett fel, med en väg att försöka igen.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ComponentType } from 'react'

const { skills, documents, shares, history } = vi.hoisted(() => ({
  skills: vi.fn(),
  documents: vi.fn(),
  shares: vi.fn(),
  history: vi.fn(),
}))

vi.mock('@/services/profileEnhancementsApi', () => ({
  profileSkillsApi: { getAll: skills },
  profileDocumentsApi: { getAll: documents },
  profileShareApi: { getAll: shares, getShareUrl: (c: string) => `https://x/${c}` },
  profileHistoryApi: { getAll: history },
}))

import { SkillsSection } from './SkillsSection'
import { DocumentsSection } from './DocumentsSection'
import { ProfileSharing } from './ProfileSharing'
import { ProfileHistory } from './ProfileHistory'

const fall: Array<[string, ComponentType, ReturnType<typeof vi.fn>, RegExp, RegExp]> = [
  ['SkillsSection', SkillsSection, skills, /kunde inte hämta dina kompetenser/i, /lägg till|kompetenser \(0\)/i],
  ['DocumentsSection', DocumentsSection, documents, /kunde inte hämta dina dokument/i, /inga dokument uppladdade/i],
  ['ProfileSharing', ProfileSharing, shares, /kunde inte hämta dina delningslänkar/i, /inga delningslänkar/i],
  ['ProfileHistory', ProfileHistory, history, /kunde inte hämta ändringshistoriken/i, /ändringshistorik/i],
]

describe('profilsektionerna — läsfel syns som fel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it.each(fall)('%s visar ett felläge, inte en tom lista, när läsningen kastar', async (_namn, Komp, api, felText) => {
    api.mockRejectedValue(new Error('nätverksfel'))
    render(<Komp />)

    const larm = await screen.findByRole('alert')
    expect(larm).toHaveTextContent(felText)
    expect(screen.queryByText(/inga dokument uppladdade|inga delningslänkar skapade/i)).toBeNull()
  })

  it.each(fall)('%s: "Försök igen" hämtar på nytt och lämnar felläget', async (_namn, Komp, api, felText, klartText) => {
    api.mockRejectedValueOnce(new Error('nätverksfel')).mockResolvedValue([])
    render(<Komp />)

    fireEvent.click(await screen.findByRole('button', { name: /försök igen/i }))

    expect((await screen.findAllByText(klartText)).length).toBeGreaterThan(0)
    expect(screen.queryByText(felText)).toBeNull()
    expect(api).toHaveBeenCalledTimes(2)
  })
})
