/**
 * Kopplingsförfrågan (beslut 2026-10-11, KOPPLINGSFORFRAGAN_FINNS): konsulenten gör
 * samma sak oavsett om adressen har ett konto — en rad i invitations — och får
 * samma kvitto. Servern avgör om det blir en förfrågan. Dialogen får alltså inte
 * kunna användas för att ta reda på vem som har ett konto.
 *
 * Mutationer som ska fälla: behåll CR1-kastet för befintligt konto när flaggan är
 * på → test 2 faller (olika svar); ta bort det neutrala kvittot → test 1 faller.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'

const stat = vi.hoisted(() => ({
  profil: null as null | { id: string; first_name: string; last_name: string; consultant_id: string | null },
  inbjudningar: [] as unknown[],
}))
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user: { id: 'konsulent-1' } }, error: null }),
      getSession: async () => ({ data: { session: { user: { id: 'konsulent-1' }, access_token: 't' } }, error: null }),
    },
    from: (tabell: string) => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: tabell === 'profiles' ? stat.profil : null, error: null }) }),
      }),
      insert: (rad: unknown) => {
        stat.inbjudningar.push(rad)
        return { select: () => ({ single: async () => ({ data: { id: 'inv-1' }, error: null }) }) }
      },
    }),
  },
}))

import { InviteParticipantDialog } from './InviteParticipantDialog'

beforeEach(() => {
  stat.profil = null
  stat.inbjudningar = []
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, statusText: 'OK' })))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

async function skicka(epost: string) {
  fireEvent.change(screen.getByPlaceholderText('anna@example.com'), { target: { value: epost } })
  fireEvent.click(screen.getByRole('button', { name: /^skicka$/i }))
}

describe('InviteParticipantDialog — kopplingsförfrågan utan uppräkning', () => {
  it('ny adress: inbjudan + neutralt kvitto', async () => {
    render(<InviteParticipantDialog isOpen onClose={vi.fn()} onSuccess={vi.fn()} forfraganAktiv />)
    await skicka('ny@example.com')
    expect(await screen.findByTestId('invite-neutral-kvitto')).toHaveTextContent('Har adressen redan ett konto')
    expect(stat.inbjudningar).toHaveLength(1)
  })

  it('befintligt konto som konsulenten kan se (admin): samma väg och samma kvitto', async () => {
    stat.profil = { id: 'd1', first_name: 'Anna', last_name: 'A', consultant_id: 'en-annan' }
    render(<InviteParticipantDialog isOpen onClose={vi.fn()} onSuccess={vi.fn()} forfraganAktiv />)
    await skicka('anna@example.com')
    expect(await screen.findByTestId('invite-neutral-kvitto')).toBeInTheDocument()
    expect(stat.inbjudningar).toHaveLength(1)
    expect(screen.queryByText(/har redan ett konto hos jobin/i)).toBeNull()
  })

  it('redan min deltagare: säger det (det vet konsulenten redan) och skriver inget', async () => {
    stat.profil = { id: 'd1', first_name: 'Anna', last_name: 'A', consultant_id: 'konsulent-1' }
    render(<InviteParticipantDialog isOpen onClose={vi.fn()} onSuccess={vi.fn()} forfraganAktiv />)
    await skicka('anna@example.com')
    await waitFor(() => expect(screen.getByText('Denna deltagare är redan kopplad till dig')).toBeInTheDocument())
    expect(stat.inbjudningar).toEqual([])
  })
})
