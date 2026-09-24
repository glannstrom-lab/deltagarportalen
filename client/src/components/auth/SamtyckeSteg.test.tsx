/**
 * DP1 — samtyckessteget i efterhand (2026-09-24).
 *
 * Supabase-klienten mockas bara på `rpc`. Det är avsiktligt: den riktiga
 * `consentApi` körs, så testet ser vilken RPC som anropas med vilket argument —
 * `grant_consent` är vägen som skriver `consent_history` (art. 7.1). Skulle
 * komponenten gå förbi registret med `.from('profiles').update(...)` finns ingen
 * `from` i mocken och testet faller.
 *
 * Mutationer (kontrollerade, se rapporten för utfallen):
 *   · villkoret `saknade.length > 0` → `true`          → "visas inte när båda finns" faller
 *   · `kanFortsatta` utan `integritet`                  → "knappen är låst …" faller
 *   · spärren i `godkann` borttagen + knappen olåst     → "Enter i en kryssruta …" faller
 *   · `beviljaSamtycke` ersatt med `updateProfile`      → "skriver via grant_consent" faller
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

type RpcSvar = { data: boolean | null; error: { code: string; message: string } | null }
const rpc = vi.fn(async (_namn: string, _args: Record<string, unknown>): Promise<RpcSvar> => ({ data: true, error: null }))

vi.mock('@/lib/supabase', () => ({
  supabase: { rpc: (namn: string, args: Record<string, unknown>) => rpc(namn, args) },
}))

import { useAuthStore, type Profile } from '@/stores/authStore'
import { SamtyckeSteg } from './SamtyckeSteg'

const signOut = vi.fn(async () => {})

function sattProfil(delar: Partial<Profile> | null) {
  useAuthStore.setState({
    profile: delar
      ? ({
          id: 'u1',
          role: 'USER',
          terms_accepted_at: null,
          privacy_accepted_at: null,
          ai_consent_at: null,
          ...delar,
        } as Profile)
      : null,
    signOut,
  })
}

function rendera(props: { visaAiVal?: boolean } = {}) {
  return render(
    <MemoryRouter initialEntries={['/oversikt']}>
      <Routes>
        <Route path="/oversikt" element={<SamtyckeSteg {...props} />} />
        <Route path="/login" element={<div>inloggningssidan</div>} />
      </Routes>
    </MemoryRouter>
  )
}

const TID = '2026-01-01T00:00:00Z'

beforeEach(() => {
  rpc.mockReset()
  rpc.mockResolvedValue({ data: true, error: null })
  signOut.mockClear()
})
afterEach(() => {
  cleanup()
  useAuthStore.setState({ profile: null })
})

describe('vem som får steget', () => {
  it('visas för ett konto som saknar båda (Google-kontot)', () => {
    sattProfil({})
    rendera()
    const dialog = screen.getByRole('dialog', { name: 'Ett steg kvar innan du fortsätter' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('visas när bara integritetspolicyn saknas', () => {
    sattProfil({ terms_accepted_at: TID })
    rendera()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('visas INTE när båda redan finns', () => {
    sattProfil({ terms_accepted_at: TID, privacy_accepted_at: TID })
    rendera()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByTestId('samtyckessteg')).toBeNull()
  })

  it('visas INTE när profilen inte är laddad — ingen spärr på en gissning', () => {
    sattProfil(null)
    rendera()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('visas för konsulent som saknar villkoren — rollen undantar inte (medvetet val)', () => {
    sattProfil({ role: 'CONSULTANT' })
    rendera()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

describe('går inte att komma förbi utan de obligatoriska kryssen', () => {
  it('knappen är låst tills båda är ikryssade, och AI-rutan krävs inte', async () => {
    sattProfil({})
    rendera()
    const knapp = screen.getByRole('button', { name: 'Godkänn och fortsätt' })
    expect(knapp).toBeDisabled()

    await userEvent.click(screen.getByLabelText(/användarvillkoren/))
    expect(knapp).toBeDisabled()
    await userEvent.click(screen.getByLabelText(/AI-behandling/))
    expect(knapp).toBeDisabled()

    await userEvent.click(screen.getByLabelText(/integritetspolicyn/))
    expect(knapp).toBeEnabled()
  })

  it('Enter i en kryssruta (formulärsubmit) skriver ingenting med bara ett kryss', async () => {
    sattProfil({})
    rendera()
    await userEvent.click(screen.getByLabelText(/användarvillkoren/))
    fireEvent.submit(screen.getByLabelText(/användarvillkoren/).closest('form')!)
    await Promise.resolve()
    expect(rpc).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('Escape stänger inte steget', async () => {
    sattProfil({})
    rendera()
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('utvägen är att logga ut, inte att hoppa över', async () => {
    sattProfil({})
    rendera()
    await userEvent.click(screen.getByRole('button', { name: 'Logga ut i stället' }))
    expect(signOut).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('inloggningssidan')).toBeInTheDocument()
    expect(rpc).not.toHaveBeenCalled()
  })
})

describe('att godkänna skriver via registret', () => {
  it('skriver terms och privacy via grant_consent och stänger steget', async () => {
    sattProfil({})
    rendera()
    await userEvent.click(screen.getByLabelText(/användarvillkoren/))
    await userEvent.click(screen.getByLabelText(/integritetspolicyn/))
    await userEvent.click(screen.getByRole('button', { name: 'Godkänn och fortsätt' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(rpc.mock.calls).toEqual([
      ['grant_consent', { p_consent_type: 'terms' }],
      ['grant_consent', { p_consent_type: 'privacy' }],
    ])
    const p = useAuthStore.getState().profile!
    expect(p.terms_accepted_at).toBeTruthy()
    expect(p.privacy_accepted_at).toBeTruthy()
    expect(p.ai_consent_at).toBeNull()
  })

  it('ger bara det som saknas — ett redan godkänt villkor loggas inte igen', async () => {
    sattProfil({ terms_accepted_at: TID })
    rendera()
    await userEvent.click(screen.getByLabelText(/användarvillkoren/))
    await userEvent.click(screen.getByLabelText(/integritetspolicyn/))
    await userEvent.click(screen.getByRole('button', { name: 'Godkänn och fortsätt' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(rpc.mock.calls).toEqual([['grant_consent', { p_consent_type: 'privacy' }]])
  })

  it('AI-samtycket skrivs först och bara när det är ikryssat', async () => {
    sattProfil({})
    rendera()
    await userEvent.click(screen.getByLabelText(/AI-behandling/))
    await userEvent.click(screen.getByLabelText(/användarvillkoren/))
    await userEvent.click(screen.getByLabelText(/integritetspolicyn/))
    await userEvent.click(screen.getByRole('button', { name: 'Godkänn och fortsätt' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(rpc.mock.calls.map((c) => c[1].p_consent_type)).toEqual(['ai_processing', 'terms', 'privacy'])
  })

  it('företagskontot får ingen AI-ruta', () => {
    sattProfil({})
    rendera({ visaAiVal: false })
    expect(screen.queryByLabelText(/AI-behandling/)).toBeNull()
  })

  it('fel vid sparandet visas och steget står kvar — inget ser godkänt ut', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'permission denied' } })
    sattProfil({})
    rendera()
    await userEvent.click(screen.getByLabelText(/användarvillkoren/))
    await userEvent.click(screen.getByLabelText(/integritetspolicyn/))
    await userEvent.click(screen.getByRole('button', { name: 'Godkänn och fortsätt' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Det gick inte att spara')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(useAuthStore.getState().profile!.terms_accepted_at).toBeNull()
  })

  it('källan skriver aldrig kolumnerna direkt', () => {
    const kalla = readFileSync(resolve(__dirname, 'SamtyckeSteg.tsx'), 'utf8')
    expect(kalla).toMatch(/await beviljaSamtycke\(typ\)/)
    expect(kalla).not.toMatch(/updateProfile\s*\(|\.from\(\s*['"]profiles['"]/)
  })
})

describe('tangentbord och fokus', () => {
  it('fokus hamnar i dialogen och Tab stannar i den', async () => {
    sattProfil({})
    rendera()
    const dialog = screen.getByRole('dialog')
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
    for (let i = 0; i < 12; i++) {
      await userEvent.tab()
      expect(dialog.contains(document.activeElement)).toBe(true)
    }
  })

  it('kryssrutorna går att kryssa med mellanslag', async () => {
    sattProfil({})
    rendera()
    const villkor = screen.getByLabelText(/användarvillkoren/)
    villkor.focus()
    await userEvent.keyboard(' ')
    expect(villkor).toBeChecked()
  })
})
