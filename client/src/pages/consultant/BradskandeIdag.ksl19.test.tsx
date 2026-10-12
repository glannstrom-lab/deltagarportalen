/** KSL19: läkarintygsflaggan visas bara när regelverket är känt som kommun. */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BradskandeIdag } from './BradskandeIdag'
import { attGoraIdag, minDagPersoner, type AttGoraPass } from './oversiktRegler'
import { DeltagarHuvud } from './DeltagarHuvud'

afterEach(() => cleanup())
const NU = new Date(2026, 9, 8, 10, 0)
const pass = (dag: number): AttGoraPass => ({
  id: `s${dag}`, plan_id: 'p', participant_id: 'anna', date: `2026-10-0${dag}`, start_time: '09:00', end_time: '12:00',
  title: 'Verkstad', activity_type: 'group_activity', attendance: 'sick_certified', sick_certificate_received: false,
}) as AttGoraPass
const personer = minDagPersoner({
  attGora: attGoraIdag({ deltagare: [{ participant_id: 'anna' }], pass: Array.from({ length: 8 }, (_, i) => pass(i + 1)), idag: NU }),
  bradskande: [], leverantor: null, moten: [], deadlines: [], kontakter: [], idag: NU,
})
const rita = (regelverk: 'kommun' | 'leverantor' | null) =>
  render(<MemoryRouter><BradskandeIdag personer={personer} nu={NU} namnFor={() => 'Anna Exempel'} regelverk={regelverk} /></MemoryRouter>)

describe('BradskandeIdag — läkarintygsflagga dag 8', () => {
  it('visas för kommun', () => {
    rita('kommun')
    expect(screen.getAllByText(/Läkarintyg behövs från dag 8/).length).toBeGreaterThan(0)
  })
  it.each([['leverantor' as const], [null]])('visas inte för %s', (rv) => {
    rita(rv)
    expect(screen.queryByText(/Läkarintyg behövs/)).not.toBeInTheDocument()
  })
})

describe('DeltagarHuvud — läkarintygsflagga', () => {
  const huvud = (regelverk: 'kommun' | 'leverantor' | null) => render(
    <MemoryRouter>
      <DeltagarHuvud namn="Anna Exempel" bildUrl={null} epost="a@b.se" telefon={null} status="ACTIVE" placeringsrad={null} laget={null}
        loggarSamtal={false} onMeddelande={() => {}} onBokaMote={() => {}} onLoggaSamtal={() => {}} onRegistreraPlacering={() => {}} plan={null}
        lakarintyg="Läkarintyg behövs från dag 8" regelverk={regelverk} />
    </MemoryRouter>,
  )
  it('syns bara för kommun', () => {
    huvud('kommun')
    expect(screen.getByTestId('lakarintyg-dag8')).toHaveTextContent('Läkarintyg behövs från dag 8')
    cleanup(); huvud('leverantor')
    expect(screen.queryByTestId('lakarintyg-dag8')).not.toBeInTheDocument()
    cleanup(); huvud(null)
    expect(screen.queryByTestId('lakarintyg-dag8')).not.toBeInTheDocument()
  })
})
