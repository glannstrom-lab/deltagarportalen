/**
 * Kopplingsförfrågan på Min konsulent (beslut 2026-10-11). Beteenden som kan falla:
 *   1. Flaggan av (före migrationen): ingenting renderas och tabellen läses inte.
 *   2. Ja kräver båda kryssrutorna, och samtyckestexten som sparas är den hon läste.
 *   3. Nej skickar ingen samtyckestext, och kortet försvinner.
 *   4. Har hon redan en konsulent sägs det rakt ut — och står i den sparade texten.
 *   5. Ett läsfel är inte "inga förfrågningar".
 * Mutationer: ta bort `|| !delning || !uppsagning` → test 2 faller; skicka texten
 * även vid nej → test 3 faller.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'

const stat = vi.hoisted(() => ({
  lista: vi.fn(),
  besvara: vi.fn(),
  profil: { consultant_id: null as string | null },
}))
vi.mock('@/services/kopplingsforfraganApi', () => ({
  KOPPLINGSFORFRAGAN_FINNS: false,
  kopplingsforfraganApi: { listaVantande: stat.lista, besvara: stat.besvara },
}))
vi.mock('@/stores/authStore', () => {
  const state = { get profile() { return stat.profil } }
  return { useAuthStore: (sel: (s: typeof state) => unknown) => sel(state) }
})

import { Kopplingsforfragan } from './Kopplingsforfragan'

const forfragan = {
  id: 'r1', consultant_id: 'k1', status: 'PENDING', message: 'Hej Anna!', created_at: '2026-10-11T10:00:00Z',
  konsulent_namn: 'Kim Konsulent', organisation_namn: 'Rusta Bemanning',
}

beforeEach(() => {
  stat.lista.mockReset().mockResolvedValue([forfragan])
  stat.besvara.mockReset().mockResolvedValue('ACCEPTED')
  stat.profil = { consultant_id: null }
})
afterEach(cleanup)

describe('Kopplingsforfragan', () => {
  it('flaggan av: ingenting, och ingen läsning', async () => {
    const { container } = render(<Kopplingsforfragan />)
    await new Promise((r) => setTimeout(r, 0))
    expect(container).toBeEmptyDOMElement()
    expect(stat.lista).not.toHaveBeenCalled()
  })

  it('ja kräver båda kryssrutorna och sparar texten hon läste', async () => {
    const onKopplad = vi.fn()
    render(<Kopplingsforfragan aktiv onKopplad={onKopplad} />)
    expect(await screen.findByRole('heading', { name: /Kim Konsulent på Rusta Bemanning/ })).toBeInTheDocument()
    expect(screen.getByText('Hej Anna!')).toBeInTheDocument()
    const ja = screen.getByRole('button', { name: 'Ja, koppla oss' })
    expect(ja).toBeDisabled()
    const [delning, uppsagning] = screen.getAllByRole('checkbox')
    fireEvent.click(delning)
    expect(ja).toBeDisabled()
    fireEvent.click(uppsagning)
    expect(ja).toBeEnabled()
    fireEvent.click(ja)
    await waitFor(() => expect(onKopplad).toHaveBeenCalled())
    const [id, svar, text] = stat.besvara.mock.calls[0]
    expect(id).toBe('r1')
    expect(svar).toBe(true)
    expect(text).toContain('Kim Konsulent på Rusta Bemanning vill bli din konsulent i Jobin.')
    expect(text).toContain('hur många jobb du har sparat')
    expect(text).toContain('Jag samtycker till att Kim Konsulent ser uppgifterna ovan.')
    expect(text).not.toContain('{{')
  })

  it('nej skickar ingen samtyckestext och kortet försvinner', async () => {
    stat.besvara.mockResolvedValue('DECLINED')
    render(<Kopplingsforfragan aktiv onKopplad={vi.fn()} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Nej tack' }))
    await waitFor(() => expect(screen.queryByTestId('kopplingsforfragan')).toBeNull())
    expect(stat.besvara).toHaveBeenCalledWith('r1', false, undefined)
    expect(screen.getByRole('status')).toHaveTextContent('Du sa nej')
  })

  it('har hon redan en konsulent står det i kortet och i den sparade texten', async () => {
    stat.profil = { consultant_id: 'annan' }
    render(<Kopplingsforfragan aktiv onKopplad={vi.fn()} />)
    expect(await screen.findByTestId('kopplingsforfragan-byte')).toHaveTextContent('Du har redan en konsulent')
    for (const box of screen.getAllByRole('checkbox')) fireEvent.click(box)
    fireEvent.click(screen.getByRole('button', { name: 'Ja, koppla oss' }))
    await waitFor(() => expect(stat.besvara).toHaveBeenCalled())
    expect(stat.besvara.mock.calls[0][2]).toContain('Du har redan en konsulent')
  })

  it('ett läsfel visas — det är inte "inga förfrågningar"', async () => {
    stat.lista.mockRejectedValue(new Error('nät'))
    render(<Kopplingsforfragan aktiv />)
    expect(await screen.findByRole('alert')).toHaveTextContent('kunde inte hämta')
  })

  it('ett misslyckat svar säger det, och knapparna går att trycka igen', async () => {
    stat.besvara.mockRejectedValue(new Error('22023'))
    render(<Kopplingsforfragan aktiv onKopplad={vi.fn()} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Nej tack' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('kunde inte sparas')
    expect(screen.getByRole('button', { name: 'Nej tack' })).toBeEnabled()
  })
})
