/**
 * AIX13 i ReportDraftDialog — utkastet granskas mot exakt den text AI:n fick.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ReportDraftDialog } from './ReportDraftDialog'
import { rapportUnderlag } from './rapportUnderlag'
import { callAI } from '@/services/aiApi'

function makeBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {}
  const chain = () => builder
  builder.select = vi.fn(chain)
  builder.eq = vi.fn(chain)
  builder.order = vi.fn(chain)
  builder.gte = vi.fn(chain)
  builder.then = (resolve: (v: unknown) => void) => resolve(result)
  return builder
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'consultant-1' } } })) },
    from: vi.fn((table: string) =>
      makeBuilder(
        table === 'consultant_journal'
          ? { data: [{ content: 'Deltagaren har sökt 3 jobb den här perioden.', category: 'GENERAL', created_at: '2026-08-01T12:00:00Z' }], error: null }
          : { data: [], error: null }
      )
    ),
  },
}))
vi.mock('@/services/aiApi', () => ({ callAI: vi.fn() }))

beforeEach(() => sessionStorage.clear())
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  sessionStorage.clear()
})

async function genereraUtkast(text: string) {
  vi.mocked(callAI).mockResolvedValueOnce({ utkast: text } as unknown as Awaited<ReturnType<typeof callAI>>)
  fireEvent.click(screen.getByRole('button', { name: /skapa utkast/i }))
  await screen.findByLabelText('Rapportutkast')
  return screen.findByTestId('utkast-granskning')
}

describe('ReportDraftDialog — utkastgranskning (AIX13)', () => {
  it('ett utkast som håller sig till underlaget är rent — men säger ändå att det inte är sanningen', async () => {
    render(<ReportDraftDialog isOpen onClose={vi.fn()} participantId="p1" />)
    const g = await genereraUtkast('Deltagaren har sökt 3 jobb under perioden. [journal 2026-08-01]')
    expect(g).toHaveTextContent(/Inga avvikelser mot underlaget/)
    expect(g).toHaveTextContent(/inte mot sanningen/)
  })

  it('ett tal och ett datum som inte finns i underlaget flaggas, ett värdeomdöme likaså', async () => {
    render(<ReportDraftDialog isOpen onClose={vi.fn()} participantId="p1" />)
    const g = await genereraUtkast('Deltagaren har sökt 12 jobb. Hon var motiverad den 3 augusti.')
    expect(g).toHaveTextContent(/2 meningar att kontrollera/)
    expect(g).toHaveTextContent(/"12"/)
    expect(g).toHaveTextContent(/"3 augusti"/)
    expect(g).toHaveTextContent(/"motiverad"/)
  })

  it('granskningen följer handredigeringen: rättas meningen försvinner flaggan', async () => {
    render(<ReportDraftDialog isOpen onClose={vi.fn()} participantId="p1" />)
    await genereraUtkast('Deltagaren har sökt 12 jobb.')
    fireEvent.change(screen.getByLabelText('Rapportutkast'), { target: { value: 'Deltagaren har sökt 3 jobb.' } })
    expect(await screen.findByTestId('utkast-granskning')).toHaveTextContent(/Inga avvikelser/)
  })

  it('ett återställt utkast behåller sin granskning (underlaget sparas med utkastet)', async () => {
    const { unmount } = render(<ReportDraftDialog isOpen onClose={vi.fn()} participantId="p1" />)
    await genereraUtkast('Deltagaren har sökt 12 jobb.')
    unmount()

    render(<ReportDraftDialog isOpen onClose={vi.fn()} participantId="p1" />)
    fireEvent.click(await screen.findByRole('button', { name: /fortsätt på utkastet/i }))
    expect(await screen.findByTestId('utkast-granskning')).toHaveTextContent(/1 mening att kontrollera/)
  })
})

describe('rapportUnderlag', () => {
  it('innehåller allt AI:n fick: period, journalrader (med datum) och mål (med deadline och framsteg)', () => {
    const u = rapportUnderlag({
      periodLabel: 'senaste 30 dagarna',
      entries: [{ date: '2026-08-01', category: 'GENERAL', content: 'Ringde Lagret AB.' }],
      goals: [{ title: 'Körkort', status: 'active', deadline: '2026-12-15', progress: 60 }],
    })
    expect(u).toContain('senaste 30 dagarna')
    expect(u).toContain('[2026-08-01]')
    expect(u).toContain('Ringde Lagret AB.')
    expect(u).toContain('deadline: 2026-12-15')
    expect(u).toContain('framsteg: 60%')
  })
})
