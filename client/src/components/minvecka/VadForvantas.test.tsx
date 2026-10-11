/**
 * VadForvantas — "Vad förväntas av mig?" i Min vecka (2026-10-11, omtaget steg 6).
 *   1. Under laddning: ingenting (kortet nämner konsulenten vid namn).
 *   2. Kommun och Rusta och matcha får olika text om konsulenten; bara
 *      leverantören får raden om aktivitetsrapporten.
 *   3. Raden om eget jobbsökande bara när planen har timmar för det.
 *   4. Passens timmar är planens anvisade mål, med rätt plural.
 *   5. Genomgången visas bara på begäran, och går att hoppa över.
 *   6. Kortet döljs, sparas som dolt, och tas fram igen med knappen.
 * "Det här gör du nu" flyttade till nästa steg överst (NastaPass) och testas i MinVecka.test.tsx.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, userEvent, cleanup } from '@/test/utils'
import { VadForvantas, VAD_FORVANTAS_KORT } from './VadForvantas'

const minKonsulent = vi.fn()
vi.mock('@/services/konsulentMeddelandeApi', () => ({ konsulentMeddelandeApi: { minKonsulent: () => minKonsulent() } }))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (sel: (s: { user: { id: string } | null }) => unknown) => sel({ user: { id: 'u1' } }),
}))

beforeEach(() => {
  cleanup()
  localStorage.clear()
  minKonsulent.mockReset().mockResolvedValue({ id: 'k1', namn: 'Karin Konsulent' })
})

describe('VadForvantas', () => {
  it('visar ingenting medan konsulenten hämtas', async () => {
    minKonsulent.mockReturnValue(new Promise(() => {}))
    render(<VadForvantas regelverk="kommun" jobbsokTimmar={0} />)
    await waitFor(() => expect(minKonsulent).toHaveBeenCalled())
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByTestId('vad-forvantas')).toBeNull()
    expect(screen.queryByTestId('vad-forvantas-oppna')).toBeNull()
  })

  it('kommun: konsulenten och vad som förväntas, utan Arbetsförmedlingen', async () => {
    render(<VadForvantas regelverk="kommun" jobbsokTimmar={0} />)
    expect(await screen.findByTestId('vad-forvantas-vem')).toHaveTextContent('Karin Konsulent är din konsulent. Hen hjälper dig med din plan och med att komma närmare ett jobb.')
    const rader = screen.getByTestId('vad-forvantas-rader')
    expect(rader).toHaveTextContent('Jag är här')
    expect(rader).toHaveTextContent('Jag kan inte komma')
    expect(rader).not.toHaveTextContent(/Arbetsförmedlingen|Sök jobb/)
  })

  it('Rusta och matcha: konsulenten i Rusta och matcha och aktivitetsrapporten', async () => {
    render(<VadForvantas regelverk="leverantor" jobbsokTimmar={0} />)
    expect(await screen.findByTestId('vad-forvantas-vem')).toHaveTextContent(/i Rusta och matcha/)
    expect(screen.getByTestId('vad-forvantas-rader')).toHaveTextContent(/Lämna din aktivitetsrapport.*Till Arbetsförmedlingen/)
  })

  it('okänt regelverk: ingen myndighet', async () => {
    render(<VadForvantas regelverk={null} jobbsokTimmar={0} />)
    const kort = await screen.findByTestId('vad-forvantas')
    expect(kort.textContent).not.toMatch(/Arbetsförmedlingen|Rusta och matcha|socialnämnd/)
  })

  it('raden om eget jobbsökande bara när planen har timmar', async () => {
    render(<VadForvantas regelverk="kommun" jobbsokTimmar={5} />)
    expect(await screen.findByTestId('vad-forvantas-rader')).toHaveTextContent('Sök jobb på egen hand5 timmar i veckan enligt din plan.')
  })

  it('tre rader utan jobbsökande och rapport: komma, säga till, och inget mer', async () => {
    // Mutation: lägg alltid till jobbsöksraden → faller.
    render(<VadForvantas regelverk="kommun" jobbsokTimmar={0} passTimmar={8} />)
    const rader = await screen.findByTestId('vad-forvantas-rader')
    expect(rader.querySelectorAll('li')).toHaveLength(2)
  })

  it('passens timmar är planens anvisade mål, med plural som följer talet', async () => {
    const { unmount } = render(<VadForvantas regelverk="kommun" jobbsokTimmar={0} passTimmar={8} />)
    expect(await screen.findByTestId('vad-forvantas-rader')).toHaveTextContent('8 timmar i veckan enligt din plan.')
    unmount()
    render(<VadForvantas regelverk="kommun" jobbsokTimmar={0} passTimmar={1} />)
    const rader = await screen.findByTestId('vad-forvantas-rader')
    expect(rader).toHaveTextContent('1 timme i veckan enligt din plan.')
    expect(rader).not.toHaveTextContent(/1 timmar/)
  })

  it('genomgången: bara på begäran, stegvis och hoppbar', async () => {
    render(<VadForvantas regelverk="kommun" jobbsokTimmar={0} />)
    await screen.findByTestId('vad-forvantas')
    expect(screen.queryByTestId('vad-forvantas-genomgang')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Visa en kort genomgång' }))
    expect(screen.getByText('Steg 1 av 4')).toBeInTheDocument()
    await userEvent.click(screen.getByTestId('vad-forvantas-nasta'))
    expect(screen.getByText('Steg 2 av 4')).toBeInTheDocument()
    await userEvent.click(screen.getByTestId('vad-forvantas-hoppa'))
    expect(screen.queryByTestId('vad-forvantas-genomgang')).toBeNull()
  })

  it('kortet döljs, förblir dolt, och tas fram med knappen', async () => {
    const { unmount } = render(<VadForvantas regelverk="kommun" jobbsokTimmar={0} />)
    await screen.findByTestId('vad-forvantas')
    await userEvent.click(screen.getByRole('button', { name: 'Dölj Vad förväntas av mig' }))
    expect(screen.queryByTestId('vad-forvantas')).toBeNull()
    expect(screen.getByRole('button', { name: 'Vad förväntas av mig?' })).toHaveFocus()
    expect(localStorage.getItem(`jobin-guide:${VAD_FORVANTAS_KORT}:u1`)).toBe('stangd')
    unmount()

    render(<VadForvantas regelverk="kommun" jobbsokTimmar={0} />)
    const oppna = await screen.findByRole('button', { name: 'Vad förväntas av mig?' })
    expect(screen.queryByTestId('vad-forvantas')).toBeNull()
    await userEvent.click(oppna)
    expect(screen.getByTestId('vad-forvantas')).toBeInTheDocument()
  })

})
