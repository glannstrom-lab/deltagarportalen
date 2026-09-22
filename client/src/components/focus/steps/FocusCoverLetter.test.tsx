/**
 * FocusCoverLetter — "Sparat!" ska vara sant.
 *
 * Två fel upptäckta 2026-09-22:
 *  · Efter en lyckad sparning stod "Sparat!" kvar även när personen fortsatte
 *    skriva i brevet. Ändringarna sparades aldrig, och ingen knapp fanns kvar
 *    att spara dem med. Mutation: ta bort `setIsSaved(false)` i onChange → RÖD.
 *  · Ett misslyckat sparande loggades bara till konsolen. Mutation: ta bort
 *    `showToast.error` i handleSave → RÖD.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

const m = vi.hoisted(() => ({ create: vi.fn(), toastError: vi.fn() }))
vi.mock('@/services/coverLetterApi', () => ({ coverLetterApi: { create: m.create } }))
vi.mock('@/services/userApi', () => ({ userApi: { getPreferences: vi.fn().mockResolvedValue(null) } }))
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => ({ profile: { first_name: 'Anna', last_name: 'Ek' } }) }))
vi.mock('@/hooks/useAnvandarnyckel', () => ({ useAnvandarnyckel: () => (k: unknown[]) => ['u1', ...k] }))
vi.mock('@/components/Toast', () => ({ showToast: { error: m.toastError, success: vi.fn(), info: vi.fn() } }))

import { FocusCoverLetter } from './FocusCoverLetter'

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

async function tillBrevet() {
  render(<FocusCoverLetter onComplete={vi.fn()} onSkip={vi.fn()} onBack={vi.fn()} />, { wrapper })
  fireEvent.change(screen.getByLabelText(/Tjänst/), { target: { value: 'Lagerarbetare' } })
  fireEvent.click(screen.getByRole('button', { name: /Nästa/ })) // → mall
  fireEvent.click(screen.getByRole('button', { name: /Nästa/ })) // → motivering
  fireEvent.click(screen.getByRole('button', { name: /Skapa brev/ })) // → brevet
  return (await screen.findByLabelText(/Ditt personliga brev/)) as HTMLTextAreaElement
}

beforeEach(() => vi.clearAllMocks())

describe('FocusCoverLetter — sparningen', () => {
  it('en ändring EFTER sparning tar bort "Sparat!" och ger tillbaka Spara-knappen', async () => {
    m.create.mockResolvedValue({ id: 'b1' })
    const brev = await tillBrevet()
    fireEvent.click(screen.getByRole('button', { name: /^Spara$/ }))
    await waitFor(() => expect(screen.getByText('Sparat!')).toBeInTheDocument())

    fireEvent.change(brev, { target: { value: brev.value + '\n\nEn rad till.' } })

    expect(screen.queryByText('Sparat!')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Spara$/ })).toBeInTheDocument()
  })

  it('ett misslyckat sparande säger till', async () => {
    m.create.mockRejectedValue(new Error('nätet borta'))
    await tillBrevet()
    fireEvent.click(screen.getByRole('button', { name: /^Spara$/ }))
    await waitFor(() => expect(m.toastError).toHaveBeenCalled())
    expect(screen.queryByText('Sparat!')).not.toBeInTheDocument()
  })

  it('kopieringsknappen har ett namn', async () => {
    await tillBrevet()
    expect(screen.getByRole('button', { name: 'Kopiera' })).toBeInTheDocument()
  })
})
