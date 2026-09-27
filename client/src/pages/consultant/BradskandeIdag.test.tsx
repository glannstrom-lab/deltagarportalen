/**
 * BradskandeIdag — "Att göra i dag" (RK35/RR26, rollspelet 2026-09-27).
 * Varje rad leder direkt till åtgärden: knappen i raden anropar rätt
 * handling med rätt indata.
 *
 * Motprov (körda): (1) skicka inte med `note: pass.attendance_note` vid
 * ommarkering → "Intyget har kommit"-testet faller (anteckningen skulle
 * skrivas över). (2) låt "Kvittera" markera 'external' → kvittenstestet
 * faller. (3) ta bort leverantörsraden → RR26-testet faller.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BradskandeIdag } from './BradskandeIdag'
import type { AttGora, AttGoraPass, LeverantorLage } from './oversiktRegler'

afterEach(() => cleanup())

const pass = (o: Partial<AttGoraPass>): AttGoraPass => ({
  id: 's1', plan_id: 'plan1', participant_id: 'anna', date: '2026-09-25', start_time: '09:00', end_time: '12:00',
  title: 'Jobbsökarverkstad', activity_type: 'jobsearch', attendance: null, attendance_note: null,
  sick_certificate_received: false, marked_at: null, self_checkin_at: null, ...o,
})
const punkt = (typ: AttGora['typ'], p: AttGoraPass, text = `${typ}-text`): AttGora => ({ typ, participantId: p.participant_id, pass: p, text })
const namnFor = (id: string) => ({ anna: 'Anna Exempel', omar: 'Omar Demo' } as Record<string, string>)[id] ?? id

function rita(props: Partial<Parameters<typeof BradskandeIdag>[0]> = {}) {
  return render(
    <MemoryRouter>
      <BradskandeIdag punkter={[]} fel={false} namnFor={namnFor} {...props} />
    </MemoryRouter>,
  )
}

describe('Att göra i dag', () => {
  it('ritar ingenting när inget väntar och det inte är en leverantör', () => {
    const { container } = rita()
    expect(container).toBeEmptyDOMElement()
  })

  it('underlagsfel sägs rakt ut, aldrig ett tyst "inget"', () => {
    rita({ fel: true })
    expect(screen.getByRole('alert')).toHaveTextContent('det som ska göras i dag visas inte just nu')
  })

  it('Kvittera markerar egenrapporten som närvarande', async () => {
    const onMarkera = vi.fn(async () => {})
    const p = pass({ activity_type: 'jobsearch_own' })
    rita({ attGora: [punkt('kvittera', p, 'Egen redovisning 27 sep väntar på kvittens')], onMarkera })
    expect(screen.getByRole('heading', { name: 'Att göra i dag' })).toBeInTheDocument()
    expect(screen.getByText('Egen redovisning 27 sep väntar på kvittens')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Kvittera' }))
    await waitFor(() => expect(onMarkera).toHaveBeenCalledWith(p, { attendance: 'present', note: null, sickCertificateReceived: false }))
  })

  it('"Intyget har kommit" behåller sjukmarkeringen och anteckningen och sätter intyget', async () => {
    const onMarkera = vi.fn(async () => {})
    const p = pass({ attendance: 'sick_certified', attendance_note: 'Ringde 08.10' })
    rita({ attGora: [punkt('sjuk_utan_intyg', p)], onMarkera })
    fireEvent.click(screen.getByRole('button', { name: 'Intyget har kommit' }))
    await waitFor(() => expect(onMarkera).toHaveBeenCalledWith(p, { attendance: 'sick_certified', note: 'Ringde 08.10', sickCertificateReceived: true }))
  })

  it('en saknad anteckning skrivs direkt i raden', async () => {
    const onSparaAnteckning = vi.fn(async () => {})
    const p = pass({ attendance: 'absent_invalid' })
    rita({ attGora: [punkt('franvaro_utan_anteckning', p)], onSparaAnteckning })
    const knapp = screen.getByRole('button', { name: 'Spara anteckning' })
    expect(knapp).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Anteckning om frånvaron för Anna Exempel'), { target: { value: '  Kom inte, svarade inte  ' } })
    fireEvent.click(knapp)
    await waitFor(() => expect(onSparaAnteckning).toHaveBeenCalledWith(p, 'Kom inte, svarade inte'))
  })

  it('en förklaring kan godtas (ändra till giltig) eller avslås (behåll ogiltig)', async () => {
    const onMarkera = vi.fn(async () => {})
    const p = pass({ attendance: 'absent_invalid', attendance_note: 'Kom inte' })
    rita({ attGora: [punkt('forklaring', p)], onMarkera })
    fireEvent.click(screen.getByRole('button', { name: 'Ändra till giltig' }))
    await waitFor(() => expect(onMarkera).toHaveBeenLastCalledWith(p, { attendance: 'absent_valid', note: 'Kom inte', sickCertificateReceived: false }))
    fireEvent.click(screen.getByRole('button', { name: 'Behåll ogiltig' }))
    await waitFor(() => expect(onMarkera).toHaveBeenLastCalledWith(p, { attendance: 'absent_invalid', note: 'Kom inte', sickCertificateReceived: false }))
  })

  it('ett omarkerat pass får samma fyra val som Dagens pass', () => {
    rita({ attGora: [punkt('omarkerat', pass({}))], onMarkera: vi.fn(async () => {}) })
    for (const namn of ['Närvarande', 'Frånvaro, giltig', 'Frånvaro, ogiltig', 'Sjuk']) {
      expect(screen.getByRole('button', { name: namn })).toBeInTheDocument()
    }
  })

  it('ett fel vid sparning visas i raden', async () => {
    const onMarkera = vi.fn(async () => { throw new Error('Nekad av databasen') })
    rita({ attGora: [punkt('kvittera', pass({ activity_type: 'jobsearch_own' }))], onMarkera })
    fireEvent.click(screen.getByRole('button', { name: 'Kvittera' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Nekad av databasen')
  })

  it('RR26: leverantörens vecka mot avtalet, och "Boka fysiskt möte" går till rätt deltagare', () => {
    const onBokaFysiskt = vi.fn()
    const leverantor: LeverantorLage = {
      bedomdaPlaner: 2,
      underTimkravet: [{ participantId: 'anna', text: 'Vecka 38: 0,5 h närvaro mot kravet 1 h' }],
      utanFysisktMote: [{ participantId: 'omar', text: 'Senaste fysiska möte 48 dagar sedan — gränsen är 28' }],
      uppfoljningar: [],
    }
    rita({ leverantor, onBokaFysiskt })
    expect(screen.getByLabelText('Veckan mot avtalet')).toHaveTextContent('1 deltagare under timkravet · 1 utan fysiskt möte · 0 uppföljningar inom 14 dagar')
    expect(screen.getByRole('link', { name: 'Se aktivitetsloggen' })).toHaveAttribute('href', '/consultant/analytics#avtalskrav')
    fireEvent.click(screen.getByRole('button', { name: 'Boka fysiskt möte' }))
    expect(onBokaFysiskt).toHaveBeenCalledWith('omar')
  })

  it('RR26: en mötesrad i brådskande-listan och en "utan fysiskt möte"-rad för samma person visas inte båda', () => {
    const leverantor: LeverantorLage = {
      bedomdaPlaner: 0, underTimkravet: [], uppfoljningar: [],
      utanFysisktMote: [{ participantId: 'omar', text: 'Senaste fysiska möte 48 dagar sedan — gränsen är 28' }],
    }
    rita({ leverantor, punkter: [{ participantId: 'omar', typ: 'mote', text: 'Senaste fysiska möte 48 dagar sedan — gränsen är 28' }], onBokaFysiskt: vi.fn() })
    expect(screen.getAllByText('Senaste fysiska möte 48 dagar sedan — gränsen är 28')).toHaveLength(1)
    // Sammanfattningen räknar ändå deltagaren
    expect(screen.getByLabelText('Veckan mot avtalet')).toHaveTextContent('1 utan fysiskt möte')
  })
})
