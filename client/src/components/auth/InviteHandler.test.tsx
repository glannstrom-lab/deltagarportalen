/**
 * Inbjudningslänken (driftgenomgången 2026-09-22, KRITISKT).
 *
 * Rutten är `/invite/:code` (App.tsx), och send-invite-email bygger länken som
 * `/#/invite/<token>`. InviteHandler läste `useParams().token` — alltid
 * undefined — och anropade `get_invitation_by_token` med `{ p_token: undefined }`,
 * som serialiseras till `{}` → PGRST202 i prod. Varje inbjuden såg "ogiltig
 * eller utgången inbjudan" sedan 2026-05-22.
 *
 * Testet monterar komponenten under SAMMA ruttmönster som App.tsx, så ett
 * namnbyte på parametern på endera sidan fäller det.
 *
 * Mutation: läs `token` i stället för `code` → testet faller.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const rpc = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...a: unknown[]) => rpc(...a),
    auth: { signUp: vi.fn() },
  },
}))

import { InviteHandler } from './InviteHandler'

// Ruttmönstret hämtas ur App.tsx — inte hårdkodat här — så testet prövar
// den rutt som faktiskt finns.
const appTsx = readFileSync(join(__dirname, '..', '..', 'App.tsx'), 'utf8')
const RUTT = appTsx.match(/path="(\/invite\/:[a-zA-Z]+)"/)![1]

beforeEach(() => {
  rpc.mockReset()
  rpc.mockReturnValue({ maybeSingle: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } }) })
})
afterEach(() => cleanup())

function rendera(sokvag: string) {
  render(
    <MemoryRouter initialEntries={[sokvag]}>
      <Routes>
        <Route path={RUTT} element={<InviteHandler />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('InviteHandler', () => {
  it('skickar token ur länken till get_invitation_by_token', async () => {
    rendera('/invite/abc123')
    await waitFor(() => expect(rpc).toHaveBeenCalled())
    expect(rpc).toHaveBeenCalledWith('get_invitation_by_token', { p_token: 'abc123' })
  })

  it('länken som send-invite-email bygger matchar rutten', () => {
    const edge = readFileSync(
      join(__dirname, '..', '..', '..', '..', 'supabase', 'functions', 'send-invite-email', 'index.ts'),
      'utf8'
    )
    expect(edge).toMatch(/\/#\/invite\/\$\{invitation\.token\}/)
    expect(RUTT.startsWith('/invite/:')).toBe(true)
  })

  it('visar felet för en ogiltig inbjudan', async () => {
    rendera('/invite/finns-inte')
    expect((await screen.findAllByText(/ogiltig|utgången|invalid|expired/i)).length).toBeGreaterThan(0)
  })

  // STA arkiverades 2026-09-12. Inbjudan hade en egen gren med ett samtycke om
  // "STA-data" och två tvingande kryssrutor. Ingen kod skapar sådana inbjudningar
  // längre (0 rader i prod 2026-09-24), men en rad med gammalt metadata ska
  // behandlas som vilken inbjudan som helst — inte be om samtycke till ett
  // program som inte finns.
  it('en inbjudan med program=steg_till_arbete får det vanliga formuläret, utan STA-samtycke', async () => {
    rpc.mockReturnValue({
      maybeSingle: () =>
        Promise.resolve({
          data: {
            id: 'i1',
            email: 'anna@example.com',
            role: 'USER',
            metadata: { program: 'steg_till_arbete', consent_text: 'Jag samtycker till STA-data' },
          },
          error: null,
        }),
    })
    rendera('/invite/abc123')
    await screen.findByText('anna@example.com')
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
    expect(screen.queryByText(/STA-data/)).toBeNull()
    expect(screen.getByRole('button', { name: /skapa|create/i })).toBeEnabled()
  })
})
