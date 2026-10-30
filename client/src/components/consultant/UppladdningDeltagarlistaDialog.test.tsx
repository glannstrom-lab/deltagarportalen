import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react'

const mock = vi.hoisted(() => ({
  insert: vi.fn(),
  getSession: vi.fn(),
  profiler: vi.fn(),
  inbjudningar: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: mock.getSession },
    from: (tabell: string) => tabell === 'profiles'
      ? { select: () => ({ eq: () => ({ range: mock.profiler }) }) }
      : {
          insert: (v: unknown) => ({ select: () => ({ single: () => mock.insert(v) }) }),
          select: () => ({ eq: () => ({ is: () => ({ gt: () => ({ range: mock.inbjudningar }) }) }) }),
        },
  },
}))
vi.mock('@/lib/anvandareFranSession', () => ({
  anvandareFranSession: async () => ({ data: { user: { id: 'k1' } } }),
}))

import { UppladdningDeltagarlistaDialog } from './UppladdningDeltagarlistaDialog'

function fil(text: string, namn = 'lista.csv') {
  const bytes = new TextEncoder().encode(text)
  const f = new File([bytes], namn, { type: 'text/csv' })
  Object.defineProperty(f, 'arrayBuffer', { value: async () => bytes.buffer })
  return f
}

function visa() {
  const props = { onClose: vi.fn(), onKlar: vi.fn(), onEnskild: vi.fn() }
  render(<UppladdningDeltagarlistaDialog isOpen {...props} />)
  return props
}

async function ladda(text: string, namn?: string) {
  const input = screen.getByLabelText('Välj CSV-fil') as HTMLInputElement
  fireEvent.change(input, { target: { files: [fil(text, namn)] } })
}

describe('UppladdningDeltagarlistaDialog', () => {
  beforeEach(() => {
    mock.insert.mockReset(); mock.getSession.mockReset(); mock.profiler.mockReset(); mock.inbjudningar.mockReset()
    mock.profiler.mockResolvedValue({ data: [{ email: 'kopplad@x.se' }], error: null })
    mock.inbjudningar.mockResolvedValue({ data: [], error: null })
    mock.getSession.mockResolvedValue({ data: { session: { access_token: 't' } } })
    mock.insert.mockImplementation(async (v: { email: string }) => ({ data: { id: 'id-' + v.email }, error: null }))
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: { body: string }) => ({
      ok: true, status: 200,
      json: async () => ({ results: (JSON.parse(init.body).invitationIds as string[]).map((invitationId) => ({ invitationId, success: !invitationId.includes('dålig') })) }),
    })))
  })
  afterEach(() => { cleanup(); vi.unstubAllGlobals() })

  it('förhandsgranskning: riktiga kolumnrubriker och status i ord för varje rad, ingenting skickat än', async () => {
    visa()
    await ladda('Namn;E-post;Ärendenummer;Startdatum\nAnna Svensson;anna@x.se;K1;2026-11-03\nKopplad;kopplad@x.se;;\nTrasig;inte-en-adress;;\nAnna igen;ANNA@x.se;;')
    const tabell = await screen.findByRole('table')
    for (const rubrik of ['Rad', 'Namn', 'E-post', 'Ärendenummer', 'Startdatum', 'Status']) {
      expect(within(tabell).getByRole('columnheader', { name: rubrik })).toBeInTheDocument()
    }
    expect(within(tabell).getByText('Redo att skickas')).toBeInTheDocument()
    expect(within(tabell).getByText('Redan kopplad')).toBeInTheDocument()
    expect(within(tabell).getByText('Rättas i filen')).toBeInTheDocument()
    expect(within(tabell).getByText('Dubblett i filen')).toBeInTheDocument()
    expect(within(tabell).getByText(/ser inte ut som en adress/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Skicka 1 inbjudan' })).toBeEnabled()
    expect(mock.insert).not.toHaveBeenCalled()
  })

  it('bekräftelse skickar och resultatet visar delfel per rad i ord', async () => {
    const p = visa()
    await ladda('E-post\nbra@x.se\ndålig@x.se')
    fireEvent.click(await screen.findByRole('button', { name: 'Skicka 2 inbjudningar' }))
    const resultat = await screen.findByText(/1 av 2 inbjudningar skickade/, undefined, { timeout: 5000 })
    expect(resultat).toBeInTheDocument()
    expect(screen.getByText('Inbjudan skickad')).toBeInTheDocument()
    expect(screen.getByText('Sparad, mejlet uteblev')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Stäng' }).at(-1)!)
    expect(p.onKlar).toHaveBeenCalled()
  })

  it('Excel-fil nekas med instruktion, fil utan e-postrubrik nekas med skäl', async () => {
    visa()
    await ladda('x', 'lista.xlsx')
    expect(await screen.findByRole('alert')).toHaveTextContent('Spara som > CSV')
    await ladda('Namn;Telefon\nA;1')
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Namn, Telefon'))
  })

  it('misslyckad dubblettkontroll stoppar före granskning (skickar aldrig blint)', async () => {
    mock.inbjudningar.mockResolvedValue({ data: null, error: { message: 'nätverk' } })
    visa()
    await ladda('E-post\na@x.se')
    expect(await screen.findByRole('alert')).toHaveTextContent('nätverk')
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('"Bjud in en i taget" går tillbaka till enskilda formuläret', () => {
    const p = visa()
    fireEvent.click(screen.getByRole('button', { name: 'Bjud in en i taget' }))
    expect(p.onEnskild).toHaveBeenCalled()
  })
})
