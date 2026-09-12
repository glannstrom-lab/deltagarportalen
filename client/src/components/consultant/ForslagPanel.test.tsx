/**
 * ForslagPanel — de fem deltagarstatusarna, företagets svar (bara på ett ja),
 * knapparna per status, och företagets avstämningar.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ForslagPanel } from './ForslagPanel'
import type { Delningsforslag } from '@/services/delningsforslagApi'
import type { Foretagsavstamning } from '@/services/placeringarApi'

function forslag(overrides: Partial<Delningsforslag> = {}): Delningsforslag {
  return {
    id: 'f-' + Math.random().toString(36).slice(2, 8),
    placement_id: 'w1',
    participant_id: 'p1',
    consultant_id: 'c1',
    company_account_id: 'org-1',
    show_contact: false,
    show_summary: false,
    show_skills: false,
    show_experience: false,
    show_education: false,
    show_documents: false,
    presentation_text: null,
    status: 'pending',
    participant_message: null,
    decided_at: null,
    expires_at: null,
    max_views: null,
    view_count: 0,
    last_viewed_at: null,
    employer_response: 'pending',
    employer_message: null,
    employer_responded_at: null,
    created_at: '2026-09-13T10:00:00Z',
    updated_at: '2026-09-13T10:00:00Z',
    ...overrides,
  }
}

describe('ForslagPanel — deltagarens fem statusar', () => {
  it('renderar alla fem statusetiketterna', () => {
    render(
      <ForslagPanel
        forslag={[
          forslag({ id: 'a', status: 'pending' }),
          forslag({ id: 'b', status: 'accepted', decided_at: '2026-09-14T10:00:00Z' }),
          forslag({ id: 'c', status: 'declined', decided_at: '2026-09-14T10:00:00Z', participant_message: 'Vill inte jobba natt' }),
          forslag({ id: 'd', status: 'withdrawn', decided_at: '2026-09-15T10:00:00Z' }),
          forslag({ id: 'e', status: 'expired', decided_at: '2026-09-30T10:00:00Z' }),
        ]}
      />
    )
    expect(screen.getByText('Väntar på deltagaren')).toBeInTheDocument()
    expect(screen.getByText('Deltagaren sa ja')).toBeInTheDocument()
    expect(screen.getByText('Tackade nej')).toBeInTheDocument()
    expect(screen.getByText('Återkallat')).toBeInTheDocument()
    expect(screen.getByText('Utgånget')).toBeInTheDocument()
    // Deltagarens meddelande vid nej
    expect(screen.getByText(/Vill inte jobba natt/)).toBeInTheDocument()
  })

  it('företagets svar visas BARA på ett accepterat förslag', () => {
    render(
      <ForslagPanel
        forslag={[
          forslag({ id: 'a', status: 'pending', employer_response: 'pending' }),
          forslag({ id: 'b', status: 'accepted', decided_at: '2026-09-14T10:00:00Z', employer_response: 'pending' }),
        ]}
      />
    )
    expect(screen.getAllByText('Företaget: Väntar på företaget')).toHaveLength(1)
  })

  it('företagets tre svar: väntar / vill gå vidare / tackade nej med meddelande', () => {
    render(
      <ForslagPanel
        forslag={[
          forslag({ id: 'a', status: 'accepted', decided_at: '2026-09-14T10:00:00Z', employer_response: 'pending' }),
          forslag({ id: 'b', status: 'accepted', decided_at: '2026-09-14T10:00:00Z', employer_response: 'interested', employer_message: 'Ring oss på måndag' }),
          forslag({ id: 'c', status: 'accepted', decided_at: '2026-09-14T10:00:00Z', employer_response: 'declined', employer_message: 'Tyvärr tillsatt' }),
        ]}
      />
    )
    expect(screen.getByText('Företaget: Väntar på företaget')).toBeInTheDocument()
    expect(screen.getByText('Företaget: Vill gå vidare')).toBeInTheDocument()
    expect(screen.getByText('Företaget: Tackade nej')).toBeInTheDocument()
    expect(screen.getByText(/Ring oss på måndag/)).toBeInTheDocument()
    expect(screen.getByText(/Tyvärr tillsatt/)).toBeInTheDocument()
  })

  it('"Ta bort utkast" bara på pending, "Öppna tråd" bara på accepted', () => {
    const onTaBortUtkast = vi.fn()
    const onOppnaTrad = vi.fn()
    const { rerender } = render(
      <ForslagPanel forslag={[forslag({ status: 'pending' })]} onTaBortUtkast={onTaBortUtkast} onOppnaTrad={onOppnaTrad} />
    )
    expect(screen.getByRole('button', { name: /Ta bort utkast/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Öppna tråd/ })).not.toBeInTheDocument()

    rerender(
      <ForslagPanel
        forslag={[forslag({ status: 'accepted', decided_at: '2026-09-14T10:00:00Z' })]}
        onTaBortUtkast={onTaBortUtkast}
        onOppnaTrad={onOppnaTrad}
      />
    )
    expect(screen.queryByRole('button', { name: /Ta bort utkast/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Öppna tråd/ })).toBeInTheDocument()

    for (const status of ['declined', 'withdrawn', 'expired'] as const) {
      rerender(
        <ForslagPanel
          forslag={[forslag({ status, decided_at: '2026-09-14T10:00:00Z' })]}
          onTaBortUtkast={onTaBortUtkast}
          onOppnaTrad={onOppnaTrad}
        />
      )
      expect(screen.queryByRole('button', { name: /Ta bort utkast/ })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Öppna tråd/ })).not.toBeInTheDocument()
    }
  })

  it('listar de föreslagna fälten, och säger det när inga fält är valda', () => {
    render(
      <ForslagPanel
        forslag={[
          forslag({ id: 'a', show_skills: true, show_education: true }),
          forslag({ id: 'b' }),
        ]}
      />
    )
    expect(screen.getByText('Föreslaget att dela: Kompetenser, Utbildning')).toBeInTheDocument()
    expect(screen.getByText(/Inga fält föreslagna/)).toBeInTheDocument()
  })

  it('renderar företagets avstämningar när rader finns, och inget alls när både förslag och avstämningar saknas', () => {
    const avstamningar: Foretagsavstamning[] = [
      { id: 'a1', placement_id: 'w1', org_id: 'org-1', author_id: null, milestone_week: 12, going_well: 'Sköter sig fint', concerns: 'Trött på eftermiddagen', continue_interest: 'kanske', created_at: '2026-09-13T10:00:00Z' },
    ]
    const { container, rerender } = render(<ForslagPanel forslag={[]} avstamningar={avstamningar} />)
    expect(screen.getByText('Företagets avstämningar')).toBeInTheDocument()
    expect(screen.getByText('Vecka 12')).toBeInTheDocument()
    expect(screen.getByText(/Sköter sig fint/)).toBeInTheDocument()
    expect(screen.getByText(/Trött på eftermiddagen/)).toBeInTheDocument()
    expect(screen.getByText('Kanske fortsätta')).toBeInTheDocument()

    rerender(<ForslagPanel forslag={[]} avstamningar={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
