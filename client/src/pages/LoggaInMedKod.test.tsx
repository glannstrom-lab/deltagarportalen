/**
 * KC6: sidan för inloggning med engångskod. Prövar båda vägarna — koden som
 * skrivs in (verifyOtp type 'email' med adressen) och länken ur mejlet
 * (verifyOtp type 'magiclink' med token_hash) — och att ett fel aldrig loggar in.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const invoke = vi.fn()
const verifyOtp = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => invoke(...a) }, auth: { verifyOtp: (...a: unknown[]) => verifyOtp(...a) } },
}))
vi.mock('@/components/ui/OptimizedImage', () => ({
  OptimizedImage: (props: { alt: string }) => <img alt={props.alt} />,
}))

import LoggaInMedKod from './LoggaInMedKod'

const reload = vi.fn()
const replace = vi.fn()
const originalLocation = window.location

beforeEach(() => {
  invoke.mockReset()
  verifyOtp.mockReset()
  reload.mockReset()
  replace.mockReset()
  Object.defineProperty(window, 'location', { configurable: true, value: { ...originalLocation, pathname: '/', reload, replace } })
})
afterEach(() => {
  cleanup()
  Object.defineProperty(window, 'location', { configurable: true, value: originalLocation })
})

const visa = (path = '/logga-in-med-kod') =>
  render(<MemoryRouter initialEntries={[path]}><LoggaInMedKod /></MemoryRouter>)

describe('KC6: logga in med engångskod', () => {
  it('skickar adressen, tar emot koden och loggar in med type email', async () => {
    invoke.mockResolvedValue({ data: { ok: true }, error: null })
    verifyOtp.mockResolvedValue({ error: null })
    visa()
    fireEvent.change(screen.getByLabelText(/e-post/i), { target: { value: 'Anna@Exempel.se ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Skicka kod' }))
    await waitFor(() => expect(invoke).toHaveBeenCalledWith('engangskod', { body: { email: 'Anna@Exempel.se' } }))

    const falt = await screen.findByLabelText('Koden från mejlet')
    fireEvent.change(falt, { target: { value: '123 456' } })
    fireEvent.click(screen.getByRole('button', { name: /logga in/i }))
    await waitFor(() => expect(verifyOtp).toHaveBeenCalledWith({ email: 'anna@exempel.se', token: '123456', type: 'email' }))
    expect(reload).toHaveBeenCalled()
  })

  it('fel kod loggar inte in och säger varför', async () => {
    invoke.mockResolvedValue({ data: { ok: true }, error: null })
    verifyOtp.mockResolvedValue({ error: { message: 'Token has expired or is invalid' } })
    visa()
    fireEvent.change(screen.getByLabelText(/e-post/i), { target: { value: 'a@b.se' } })
    fireEvent.click(screen.getByRole('button', { name: 'Skicka kod' }))
    fireEvent.change(await screen.findByLabelText('Koden från mejlet'), { target: { value: '000000' } })
    fireEvent.click(screen.getByRole('button', { name: /logga in/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/stämmer inte/)
    expect(reload).not.toHaveBeenCalled()
  })

  it('en kod som inte är sex siffror skickas aldrig', async () => {
    invoke.mockResolvedValue({ data: { ok: true }, error: null })
    visa()
    fireEvent.change(screen.getByLabelText(/e-post/i), { target: { value: 'a@b.se' } })
    fireEvent.click(screen.getByRole('button', { name: 'Skicka kod' }))
    fireEvent.change(await screen.findByLabelText('Koden från mejlet'), { target: { value: '12a' } })
    fireEvent.click(screen.getByRole('button', { name: /logga in/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/sex siffror/)
    expect(verifyOtp).not.toHaveBeenCalled()
  })

  it('länken ur mejlet löses in med token_hash', async () => {
    verifyOtp.mockResolvedValue({ error: null })
    visa('/logga-in-med-kod?th=hash123')
    await waitFor(() => expect(verifyOtp).toHaveBeenCalledWith({ token_hash: 'hash123', type: 'magiclink' }))
    await waitFor(() => expect(reload).toHaveBeenCalled())
  })

  it('en gammal länk säger det och erbjuder en ny kod', async () => {
    verifyOtp.mockResolvedValue({ error: { message: 'expired' } })
    visa('/logga-in-med-kod?th=gammal')
    expect(await screen.findByRole('alert')).toHaveTextContent(/fungerar inte längre/)
    expect(reload).not.toHaveBeenCalled()
  })
})
