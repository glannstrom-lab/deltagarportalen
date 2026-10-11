/**
 * BradskandeIdag — nästa steg + en rad per människa (omtaget "Kvarter",
 * steg 3, 2026-10-11). Åtgärderna är desamma som i Att göra i dag
 * (RK35/RR26): varje knapp anropar rätt handling med rätt indata.
 *
 * Testerna hittar element på roll och testid, inte på löptext.
 *
 * Motprov (körda): (1) skicka inte med `note: pass.attendance_note` vid
 * ommarkering → "Intyget har kommit"-testet faller (anteckningen skulle
 * skrivas över). (2) låt "Kvittera" markera 'external' → kvittenstestet
 * faller. (3) rita nästa steg även när `visaNastaSteg` är falskt →
 * läsfelstestet faller. (4) ta bort `utanNastaSteg` → "står inte två gånger" faller.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { BradskandeIdag } from './BradskandeIdag'
import { minDagPersoner, type AttGora, type AttGoraPass, type LeverantorLage, type PassAttMarkera } from './oversiktRegler'

afterEach(() => cleanup())

const NU = new Date(2026, 8, 25, 12, 0)
const pass = (o: Partial<AttGoraPass>): AttGoraPass => ({
  id: 's1', plan_id: 'plan1', participant_id: 'anna', date: '2026-09-25', start_time: '09:00', end_time: '12:00',
  title: 'Jobbsökarverkstad', activity_type: 'jobsearch', attendance: null, attendance_note: null,
  sick_certificate_received: false, marked_at: null, self_checkin_at: null, ...o,
})
const punkt = (typ: AttGora['typ'], p: AttGoraPass): AttGora => ({ typ, participantId: p.participant_id, pass: p, text: typ })
const namnFor = (id: string) => ({ anna: 'Anna Exempel', omar: 'Omar Demo', jonas: 'Jonas Berg' } as Record<string, string>)[id] ?? id

function personer(args: { attGora?: AttGora[]; leverantor?: LeverantorLage | null; kontakt?: string[] } = {}) {
  return minDagPersoner({
    attGora: args.attGora ?? [],
    bradskande: [],
    leverantor: args.leverantor ?? null,
    moten: [],
    deadlines: [],
    kontakter: (args.kontakt ?? []).map((id) => ({ participantId: id, text: 'Aldrig kontaktad' })),
    idag: NU,
  })
}

function Plats() {
  const l = useLocation()
  return <output data-testid="plats">{l.pathname + l.search + l.hash}</output>
}

function rita(props: Partial<Parameters<typeof BradskandeIdag>[0]> = {}) {
  return render(
    <MemoryRouter initialEntries={['/consultant']}>
      <Routes>
        <Route path="/consultant" element={<BradskandeIdag personer={[]} nu={NU} namnFor={namnFor} {...props} />} />
        <Route path="*" element={<Plats />} />
      </Routes>
    </MemoryRouter>,
  )
}

const nasta = () => screen.getByTestId('mindag-nasta-steg')

describe('Min dag — nästa steg och en rad per människa', () => {
  it('ritar ingenting när inget väntar', () => {
    const { container } = rita()
    expect(container).toBeEmptyDOMElement()
  })

  it('läsfel: inget nästa steg påstås, raderna står kvar', () => {
    rita({ personer: personer({ kontakt: ['jonas'] }), visaNastaSteg: false })
    expect(screen.queryByTestId('mindag-nasta-steg')).not.toBeInTheDocument()
    expect(screen.getByTestId('mindag-person-jonas')).toBeInTheDocument()
  })

  it('frånvaro utan anteckning: raden skrivs i nästa steg och sparas genom saveAttendanceNote', async () => {
    const onSparaAnteckning = vi.fn().mockResolvedValue(undefined)
    const p = pass({ attendance: 'absent_invalid', date: '2026-09-24' })
    rita({ personer: personer({ attGora: [punkt('franvaro_utan_anteckning', p)] }), onSparaAnteckning })
    const steg = nasta()
    expect(steg).toHaveAttribute('data-typ', 'franvaro_utan_anteckning')
    expect(within(steg).getByRole('heading', { level: 2 })).toHaveTextContent('Skriv en rad om Annas frånvaro')
    const spara = within(steg).getByRole('button', { name: 'Spara raden' })
    expect(spara).toBeDisabled()
    fireEvent.change(within(steg).getByRole('textbox'), { target: { value: 'Svarade inte i telefon' } })
    fireEvent.click(spara)
    await waitFor(() => expect(onSparaAnteckning).toHaveBeenCalledWith(p, 'Svarade inte i telefon'))
    // Samma sak står inte två gånger: Anna har ingen rad i listan.
    expect(screen.queryByTestId('mindag-person-anna')).not.toBeInTheDocument()
  })

  it('Kvittera markerar egenrapporten som närvarande', async () => {
    const onMarkera = vi.fn().mockResolvedValue(undefined)
    const p = pass({ activity_type: 'jobsearch_own', title: 'Eget jobbsökande' })
    rita({ personer: personer({ attGora: [punkt('kvittera', p)] }), onMarkera })
    fireEvent.click(within(nasta()).getByRole('button', { name: 'Kvittera' }))
    await waitFor(() => expect(onMarkera).toHaveBeenCalledWith(p, { attendance: 'present', note: null, sickCertificateReceived: false }))
  })

  it('"Intyget har kommit" behåller sjukmarkeringen och anteckningen och sätter intyget', async () => {
    const onMarkera = vi.fn().mockResolvedValue(undefined)
    const p = pass({ attendance: 'sick_certified', attendance_note: 'Ringde in' })
    rita({ personer: personer({ attGora: [punkt('sjuk_utan_intyg', p)] }), onMarkera })
    fireEvent.click(within(nasta()).getByRole('button', { name: 'Intyget har kommit' }))
    await waitFor(() => expect(onMarkera).toHaveBeenCalledWith(p, { attendance: 'sick_certified', note: 'Ringde in', sickCertificateReceived: true }))
  })

  it('en förklaring kan godtas (ändra till giltig) eller avslås (behåll ogiltig)', async () => {
    const onMarkera = vi.fn().mockResolvedValue(undefined)
    const p = pass({ attendance: 'absent_invalid', participant_explanation: 'Var hos läkaren', participant_explanation_at: '2026-09-25T10:00:00Z', marked_at: '2026-09-25T09:00:00Z' })
    rita({ personer: personer({ attGora: [punkt('forklaring', p)] }), onMarkera })
    fireEvent.click(within(nasta()).getByRole('button', { name: 'Godta, ändra till giltig' }))
    await waitFor(() => expect(onMarkera).toHaveBeenLastCalledWith(p, expect.objectContaining({ attendance: 'absent_valid' })))
    fireEvent.click(within(nasta()).getByRole('button', { name: 'Behåll ogiltig' }))
    await waitFor(() => expect(onMarkera).toHaveBeenLastCalledWith(p, expect.objectContaining({ attendance: 'absent_invalid' })))
  })

  it('en rad per människa: tre saker om Omar är en rad med "+2 till", och raden fälls ut med alla tre', async () => {
    const onMarkera = vi.fn().mockResolvedValue(undefined)
    const franvaro = pass({ id: 'k', participant_id: 'anna', attendance: 'absent_invalid', date: '2026-09-24' })
    const omarkerat = pass({ id: 'o', participant_id: 'omar', date: '2026-09-22' })
    const anmald = pass({ id: 'a', participant_id: 'omar', date: '2026-09-26', absence_reported_at: '2026-09-24T08:00:00Z', absence_reason: 'sick' })
    rita({ personer: personer({ attGora: [punkt('franvaro_utan_anteckning', franvaro), punkt('omarkerat', omarkerat), punkt('anmald_franvaro', anmald)], kontakt: ['omar'] }), onMarkera })
    const lista = screen.getByTestId('mindag-lista')
    expect(within(lista).getAllByRole('listitem').filter((li) => li.dataset.testid?.startsWith('mindag-person-'))).toHaveLength(1)
    const omar = screen.getByTestId('mindag-person-omar')
    expect(omar).toHaveAttribute('data-typ', 'anmald_franvaro')
    expect(omar).toHaveTextContent('+2 till')
    const bedom = within(omar).getByRole('button', { name: 'Bedöm: Omar Demo' })
    expect(bedom).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(bedom)
    expect(bedom).toHaveAttribute('aria-expanded', 'true')
    const panel = within(omar).getByRole('list', { name: 'Allt om Omar Demo i dag' })
    expect(within(panel).getAllByRole('listitem')).toHaveLength(3)
    // Det omarkerade passet markeras med radiogruppen — samma fyra val som Dagens pass.
    const grupp = within(panel).getByRole('radiogroup')
    expect(within(grupp).getAllByRole('radio').map((r) => r.textContent)).toEqual(['Här', 'Giltig', 'Ogiltig', 'Sjuk'])
    fireEvent.click(within(grupp).getByRole('radio', { name: /Ogiltig/ }))
    await waitFor(() => expect(onMarkera).toHaveBeenCalledWith(omarkerat, { attendance: 'absent_invalid', note: null, sickCertificateReceived: false }))
  })

  it('ett fel vid sparning visas där handlingen gjordes', async () => {
    const onMarkera = vi.fn().mockRejectedValue(new Error('Nekad av databasen'))
    rita({ personer: personer({ attGora: [punkt('kvittera', pass({ activity_type: 'jobsearch_own' }))] }), onMarkera })
    fireEvent.click(within(nasta()).getByRole('button', { name: 'Kvittera' }))
    expect(await within(nasta()).findByRole('alert')).toHaveTextContent('Nekad av databasen')
  })

  it('RR26: "Boka fysiskt möte" i raden går till rätt deltagare med fysiskt förvalt', () => {
    const onBokaMote = vi.fn()
    const lev: LeverantorLage = {
      bedomdaPlaner: 1,
      underTimkravet: [],
      utanFysisktMote: [{ participantId: 'omar', text: 'Inget genomfört fysiskt möte än' }],
      uppfoljningar: [],
    }
    rita({ personer: personer({ attGora: [punkt('kvittera', pass({ activity_type: 'jobsearch_own' }))], leverantor: lev }), onBokaMote })
    fireEvent.click(within(screen.getByTestId('mindag-person-omar')).getByRole('button', { name: 'Boka fysiskt möte: Omar Demo' }))
    expect(onBokaMote).toHaveBeenCalledWith('omar', true)
  })

  it('ett pass att markera blir nästa steg och leder till närvaron för hela passet', () => {
    const p: PassAttMarkera = { title: 'Gruppträff', date: '2026-09-25', start_time: '13:00', end_time: '14:00', deltagare: 6, incheckade: 4, anmalda: 1, omarkerade: 6 }
    rita({ pass: [p] })
    expect(nasta()).toHaveAttribute('data-typ', 'pass')
    expect(nasta()).toHaveTextContent('Sex deltagare. Fyra har checkat in själva, en har anmält frånvaro.')
    fireEvent.click(within(nasta()).getByRole('button', { name: 'Markera närvaro' }))
    expect(decodeURIComponent(screen.getByTestId('plats').textContent ?? '')).toBe('/consultant/pass/grupp?datum=2026-09-25&start=13:00&slut=14:00&titel=Gruppträff')
  })

  it('en vy, en primärknapp', () => {
    rita({ personer: personer({ attGora: [punkt('kvittera', pass({ activity_type: 'jobsearch_own' })), punkt('kvittera', pass({ id: 's2', participant_id: 'omar', activity_type: 'jobsearch_own' }))], kontakt: ['jonas'] }) })
    expect(document.querySelectorAll('[data-variant="primary"]')).toHaveLength(1)
  })
})
