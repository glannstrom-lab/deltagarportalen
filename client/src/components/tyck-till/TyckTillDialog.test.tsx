import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TyckTillDialog } from './TyckTillDialog'
import { useTyckTillStore } from '@/stores/tyckTillStore'
import { _nollstallKlientfel, registreraKlientfel } from '@/lib/senasteKlientfel'

const skicka = vi.fn()
vi.mock('@/services/tyckTillApi', () => ({ skickaTyckTill: (...a: unknown[]) => skicka(...a) }))

const authState = { user: { id: 'u1' } as { id: string } | null }
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (sel: (s: typeof authState) => unknown) => sel(authState),
}))

function visa() {
  return render(
    <MemoryRouter initialEntries={['/cv']}>
      <TyckTillDialog />
    </MemoryRouter>
  )
}

beforeEach(() => {
  skicka.mockReset()
  _nollstallKlientfel()
  authState.user = { id: 'u1' }
  useTyckTillStore.setState({ oppen: false, typ: 'ide', bifogatFel: null, utkast: '' })
})

describe('TyckTillDialog', () => {
  it('syns inte förrän någon öppnar den', () => {
    visa()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('skickar typ, text, sida och klientfel bara för felrapporter', async () => {
    skicka.mockResolvedValue({ ok: true })
    registreraKlientfel('TypeError: x is undefined')
    visa()
    act(() => useTyckTillStore.getState().oppna('fel'))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Knappen gör inget' } })
    fireEvent.click(screen.getByRole('button', { name: /skicka/i }))
    await waitFor(() => expect(skicka).toHaveBeenCalledTimes(1))
    const arg = skicka.mock.calls[0][0]
    expect(arg).toMatchObject({ typ: 'fel', meddelande: 'Knappen gör inget', sida: '/cv', farKontakta: false })
    expect(arg.klientfel[0]).toMatch(/TypeError/)
    expect(await screen.findByRole('status')).toBeTruthy()
  })

  it('skickar inga klientfel med en idé', async () => {
    skicka.mockResolvedValue({ ok: true })
    registreraKlientfel('TypeError: x')
    visa()
    act(() => useTyckTillStore.getState().oppna('ide'))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Mörkt läge' } })
    fireEvent.click(screen.getByRole('button', { name: /skicka/i }))
    await waitFor(() => expect(skicka).toHaveBeenCalled())
    expect(skicka.mock.calls[0][0].klientfel).toEqual([])
  })

  it('Skicka är avstängd tills något är skrivet', () => {
    visa()
    act(() => useTyckTillStore.getState().oppna())
    expect((screen.getByRole('button', { name: /skicka/i }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('visar ett fel och behåller texten när det inte gick att skicka', async () => {
    skicka.mockResolvedValue({ ok: false, fel: 'okant' })
    visa()
    act(() => useTyckTillStore.getState().oppna())
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Min idé' } })
    fireEvent.click(screen.getByRole('button', { name: /skicka/i }))
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('Min idé')
  })

  it('ber den som inte är inloggad att logga in', () => {
    authState.user = null
    visa()
    act(() => useTyckTillStore.getState().oppna())
    expect(screen.queryByRole('textbox')).toBeNull()
  })
})
