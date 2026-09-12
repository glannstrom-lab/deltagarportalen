/**
 * ForeslaDialog — förslaget är opt-in per fält (AG5). Supabase mockas på
 * klientnivå (som placeringarApi.test.ts) så att den RIKTIGA
 * delningsforslagApi.skapa körs och insert-raden kan kontrolleras.
 *
 * Mutationsvakten: byt en `false` i tommaFalt() till `true` — testet
 * "allt avbockat som standard" ska falla.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { ForeslaDialog } from './ForeslaDialog'
import type { Placering } from '@/services/placeringarApi'

const mockInsert = vi.fn()
const mockFrom = vi.fn()
let insertResultat: { data: unknown; error: unknown } = { data: null, error: null }

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'konsulent-1' } }, error: null }) },
    from: (tabell: string) => {
      mockFrom(tabell)
      return {
        insert: (rad: unknown) => {
          mockInsert(rad)
          return { select: () => ({ single: async () => insertResultat }) }
        },
      }
    },
  },
}))

const plats = {
  id: 'w1',
  consultant_id: 'konsulent-1',
  participant_id: 'p1',
  company_account_id: 'org-1',
  place_id: null,
  company_name: 'Provbolaget',
  placement_type: 'praktik',
  status: 'planerad',
} as unknown as Placering

function renderDialog(overrides: Partial<React.ComponentProps<typeof ForeslaDialog>> = {}) {
  const onClose = vi.fn()
  const onSkapad = vi.fn()
  render(<ForeslaDialog open placering={plats} deltagarNamn="Anna" onClose={onClose} onSkapad={onSkapad} {...overrides} />)
  return { onClose, onSkapad }
}

beforeEach(() => {
  vi.clearAllMocks()
  insertResultat = { data: { id: 'f1', status: 'pending' }, error: null }
})

describe('ForeslaDialog — opt-in per fält', () => {
  it('skickar allt avbockat som standard: alla fem show_* är false', async () => {
    const { onSkapad, onClose } = renderDialog()
    const dialog = screen.getByRole('dialog', { name: /Föreslå Anna för Provbolaget/ })

    for (const ruta of within(dialog).getAllByRole('checkbox')) {
      expect(ruta).not.toBeChecked()
    }

    fireEvent.click(within(dialog).getByRole('button', { name: /Skicka frågan till Anna/ }))
    await waitFor(() => expect(mockInsert).toHaveBeenCalledTimes(1))

    expect(mockFrom).toHaveBeenCalledWith('employer_share_proposals')
    expect(mockInsert.mock.calls[0][0]).toMatchObject({
      placement_id: 'w1',
      participant_id: 'p1',
      consultant_id: 'konsulent-1',
      show_contact: false,
      show_summary: false,
      show_skills: false,
      show_experience: false,
      show_education: false,
      presentation_text: null,
      max_views: null,
    })
    // Inga dokument i etapp 1 — flaggan skickas inte alls (serverdefault false).
    expect(mockInsert.mock.calls[0][0]).not.toHaveProperty('show_documents')
    // Aldrig född besvarad — status sätts inte av klienten.
    expect(mockInsert.mock.calls[0][0]).not.toHaveProperty('status')
    await waitFor(() => expect(onSkapad).toHaveBeenCalledWith({ id: 'f1', status: 'pending' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('skickar exakt de fält konsulenten kryssat i, med text, giltighet och max visningar', async () => {
    renderDialog()
    const dialog = screen.getByRole('dialog')

    fireEvent.click(within(dialog).getByLabelText(/Kompetenser/))
    fireEvent.click(within(dialog).getByLabelText(/Arbetslivserfarenhet/))
    fireEvent.change(within(dialog).getByLabelText(/Din presentation av Anna/), { target: { value: '  Noggrann och punktlig  ' } })
    fireEvent.change(within(dialog).getByLabelText(/Gäller till/), { target: { value: '2026-10-01' } })
    fireEvent.change(within(dialog).getByLabelText(/Max antal visningar/), { target: { value: '3' } })

    fireEvent.click(within(dialog).getByRole('button', { name: /Skicka frågan/ }))
    await waitFor(() => expect(mockInsert).toHaveBeenCalledTimes(1))

    const rad = mockInsert.mock.calls[0][0] as Record<string, unknown>
    expect(rad).toMatchObject({
      show_contact: false,
      show_summary: false,
      show_skills: true,
      show_experience: true,
      show_education: false,
      presentation_text: 'Noggrann och punktlig',
      max_views: 3,
    })
    expect(String(rad.expires_at)).toMatch(/^2026-10-0[12]T/)
  })

  it('har ingen kryssruta för dokument (ingen filväg i etapp 1)', () => {
    renderDialog()
    expect(screen.queryByLabelText(/Dokument/)).not.toBeInTheDocument()
    expect(screen.getAllByRole('checkbox')).toHaveLength(5)
  })

  it('bär texten om att deltagaren bestämmer och att AI inte används', () => {
    renderDialog()
    expect(
      screen.getByText(/Deltagaren får frågan och bestämmer\. Företaget ser inget förrän hon sagt ja, och bara det hon kryssat ja till\./)
    ).toBeInTheDocument()
    expect(screen.getByText(/AI används inte här/)).toBeInTheDocument()
  })

  it('visar databasens fel i dialogen och stänger inte', async () => {
    insertResultat = { data: null, error: { message: 'Ett delningsförslag skapas alltid som pending — bara deltagaren kan besvara det', code: '42501' } }
    const { onClose, onSkapad } = renderDialog()
    fireEvent.click(screen.getByRole('button', { name: /Skicka frågan/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('bara deltagaren kan besvara det')
    expect(onSkapad).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('vägrar utan företagskonto — inget insert', async () => {
    renderDialog({ placering: { ...plats, company_account_id: null } })
    fireEvent.click(screen.getByRole('button', { name: /Skicka frågan/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('saknar företagskonto')
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
