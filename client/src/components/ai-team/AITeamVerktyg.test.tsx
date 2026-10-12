/**
 * UT3: när organisationen stängt av AI ska sidopanelens verktyg inte renderas.
 * Mutation: ta bort `if (orgSparr) return null` -> första testet faller.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const sparr = { varde: null as null | { org_id: string; org_name: string; ai_enabled: boolean } }
vi.mock('@/hooks/useOrgAiSparr', () => ({ useOrgAiSparr: () => sparr.varde }))
vi.mock('./PersonalityDropdown', () => ({ PersonalityDropdown: () => <div>personlighet</div> }))
vi.mock('./ResponseModeSelector', () => ({ ResponseModeSelector: () => <div>svarslangd</div> }))
vi.mock('./QuickActions', () => ({ QuickActions: () => <button>snabb</button> }))

import { AITeamVerktyg } from './AITeamVerktyg'

describe('AITeamVerktyg (UT3)', () => {
  it('renderar inget när organisationen stängt av AI', () => {
    sparr.varde = { org_id: 'o1', org_name: 'Kommun', ai_enabled: false }
    render(<AITeamVerktyg onQuickAction={() => {}} />)
    expect(screen.queryByRole('button', { name: 'snabb' })).toBeNull()
    expect(screen.queryByText('personlighet')).toBeNull()
  })
  it('renderar alla tre utan spärr', () => {
    sparr.varde = null
    render(<AITeamVerktyg onQuickAction={() => {}} />)
    expect(screen.getByRole('button', { name: 'snabb' })).toBeInTheDocument()
    expect(screen.getByText('personlighet')).toBeInTheDocument()
    expect(screen.getByText('svarslangd')).toBeInTheDocument()
  })
})
