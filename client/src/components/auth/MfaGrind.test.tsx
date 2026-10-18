/**
 * KSL25 / spår KF: tvåstegsinloggningens två grindar.
 *  - KravTvaSteg: chef/admin utan verifierad faktor ser påslaget, inte arbetsytan.
 *  - MfaGrind: en session på aal1 med aal2 som nästa nivå får kodrutan.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

const m = vi.hoisted(() => ({
  roller: [] as string[],
  demo: false,
  faktorer: [] as Array<{ id: string; namn: string | null; verifierad: boolean; skapad: string }>,
  assurans: { nuvarande: 'aal1', nasta: 'aal1' } as { nuvarande: string; nasta: string },
}))

vi.mock('@/services/orgApi', () => ({
  orgApi: { myMemberships: vi.fn(async () => m.roller.map((role, i) => ({ id: `m${i}`, role, organization: { id: 'o', name: 'Org', is_demo: m.demo } }))) },
}))
vi.mock('@/services/mfaApi', async (orig) => {
  const riktig = await orig<typeof import('@/services/mfaApi')>()
  return {
    ...riktig,
    mfaApi: {
      faktorer: vi.fn(async () => m.faktorer),
      assurans: vi.fn(async () => m.assurans),
      paborja: vi.fn(), verifiera: vi.fn(), tabort: vi.fn(),
    },
  }
})

import { KravTvaSteg, MfaGrind } from './MfaGrind'
import { useAuthStore } from '@/stores/authStore'

function med(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

const VERIFIERAD = { id: 'f1', namn: 'Jobin', verifierad: true, skapad: '2026-10-18' }

describe('KravTvaSteg — chef och admin måste ha tvåsteg', () => {
  beforeEach(() => { m.roller = []; m.faktorer = []; m.demo = false })

  it('chef utan faktor ser påslaget, inte arbetsytan', async () => {
    m.roller = ['chef']
    med(<KravTvaSteg><p>ARBETSYTAN</p></KravTvaSteg>)
    expect(await screen.findByRole('button', { name: /slå på tvåstegsinloggning/i })).toBeInTheDocument()
    expect(screen.queryByText('ARBETSYTAN')).not.toBeInTheDocument()
  })

  it('admin med verifierad faktor släpps in', async () => {
    m.roller = ['admin']; m.faktorer = [VERIFIERAD]
    med(<KravTvaSteg><p>ARBETSYTAN</p></KravTvaSteg>)
    expect(await screen.findByText('ARBETSYTAN')).toBeInTheDocument()
  })

  it('konsulent utan faktor släpps in — frivilligt för konsulenter', async () => {
    m.roller = ['konsulent']
    med(<KravTvaSteg><p>ARBETSYTAN</p></KravTvaSteg>)
    expect(await screen.findByText('ARBETSYTAN')).toBeInTheDocument()
  })

  it('chef i en demoorganisation släpps in — delat demokonto kan inte ha en app (regression 2026-10-18)', async () => {
    m.roller = ['chef']; m.demo = true
    med(<KravTvaSteg><p>ARBETSYTAN</p></KravTvaSteg>)
    expect(await screen.findByText('ARBETSYTAN')).toBeInTheDocument()
  })

  it('en overifierad (avbruten) faktor räknas inte', async () => {
    m.roller = ['chef']; m.faktorer = [{ ...VERIFIERAD, verifierad: false }]
    med(<KravTvaSteg><p>ARBETSYTAN</p></KravTvaSteg>)
    expect(await screen.findByRole('button', { name: /slå på tvåstegsinloggning/i })).toBeInTheDocument()
    expect(screen.queryByText('ARBETSYTAN')).not.toBeInTheDocument()
  })
})

describe('MfaGrind — koden efter lösenordet', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: { id: 'u1' } as never })
    m.faktorer = [VERIFIERAD]
  })

  it('aal1 med aal2 som nästa nivå visar kodrutan', async () => {
    m.assurans = { nuvarande: 'aal1', nasta: 'aal2' }
    med(<MfaGrind />)
    expect(await screen.findByRole('dialog', { name: /skriv in koden/i })).toBeInTheDocument()
  })

  it('aal2 visar ingenting', async () => {
    m.assurans = { nuvarande: 'aal2', nasta: 'aal2' }
    med(<MfaGrind />)
    await new Promise((r) => setTimeout(r, 30))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('utan tvåsteg (aal1 → aal1) visar ingenting', async () => {
    m.assurans = { nuvarande: 'aal1', nasta: 'aal1' }
    med(<MfaGrind />)
    await new Promise((r) => setTimeout(r, 30))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
