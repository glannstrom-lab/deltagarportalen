/**
 * InviteParticipantDialog — kvittot får inte lova ett mejl som inte skickats
 * (städpasset 2026-09-22).
 *
 * Inbjudan sparas i `invitations`, och mejlet skickas sedan av edge-funktionen
 * `send-invite-email`. Gick mejlet fel (icke-2xx, nätverksfel, ingen session)
 * loggades det bara som `console.warn` — och dialogen sa ändå "Anna har fått en
 * inbjudan via email." Konsulenten väntade på en deltagare som aldrig fått
 * något. Rättelsen säger som det är, och stänger inte av sig själv i det läget.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user: { id: 'konsulent-1' } } }),
      getSession: async () => ({ data: { session: { access_token: 't' } } }),
    },
    from: (tabell: string) => {
      if (tabell === 'profiles') {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }
      }
      return { insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'inv-1' }, error: null }) }) }) }
    },
  },
}))

import { InviteParticipantDialog } from './InviteParticipantDialog'

let fetchOk = true

beforeEach(() => {
  fetchOk = true
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: fetchOk, status: fetchOk ? 200 : 500, statusText: '' })))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

async function skickaInbjudan() {
  const onSuccess = vi.fn()
  const onClose = vi.fn()
  render(<InviteParticipantDialog isOpen onClose={onClose} onSuccess={onSuccess} />)
  const epost = document.body.querySelector('input[type="email"]') as HTMLInputElement
  fireEvent.change(epost, { target: { value: 'anna@example.com' } })
  fireEvent.submit(epost.closest('form') as HTMLFormElement)
  return { onSuccess, onClose }
}

describe('InviteParticipantDialog — mejlutfallet', () => {
  it('när mejlet gick iväg: "fått en inbjudan via email"', async () => {
    await skickaInbjudan()
    expect(await screen.findByText(/har fått en inbjudan via email/)).toBeInTheDocument()
  })

  it('när mejlet INTE gick iväg: säger det, och lovar inget mejl', async () => {
    fetchOk = false
    await skickaInbjudan()
    expect(await screen.findByText(/mejlet kunde inte skickas/i)).toBeInTheDocument()
    expect(screen.queryByText(/har fått en inbjudan via email/)).not.toBeInTheDocument()
  })
})
