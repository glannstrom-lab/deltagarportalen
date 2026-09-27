/**
 * RR4 (rollspelet 2026-09-27): "Genomsnittlig placeringstid – Från start till
 * jobb" räknade `start_date − created_at` med golvet 1, alltså hur sent
 * placeringen registrerades. Fixturerna är prod-raderna 2026-09-27
 * (consultant_placements + consultant_participants.assigned_at): Amina
 * kopplad 30/4, jobb från 9/7 (70 dagar), registrerat 27/9; Sara kopplad
 * 29/7, jobb från 19/10 (framåt), registrerat 27/9. Kortet visade "11 dagar".
 */
import { describe, it, expect } from 'vitest'
import { placeringstid } from './analytics'

const deltagare = [
  { participant_id: 'amina', assigned_at: '2026-04-30T08:00:00+00:00' },
  { participant_id: 'sara', assigned_at: '2026-07-29T08:00:00+00:00' },
]
const amina = { participant_id: 'amina', start_date: '2026-07-09', created_at: '2026-09-27T09:00:00+00:00' }
const sara = { participant_id: 'sara', start_date: '2026-10-19', created_at: '2026-09-27T09:10:00+00:00' }
const IDAG = '2026-09-27'

describe('RR4: placeringstid från kopplingen till jobbets start', () => {
  it('Amina: 70 dagar från kopplingen, inte 1 dag från registreringen', () => {
    const r = placeringstid([amina], deltagare, IDAG)
    expect(r.snittDagar).toBe(70)
    expect(r.forklaring).toBeNull()
  })

  it('en placering vars jobb inte har börjat räknas inte, och det sägs', () => {
    const r = placeringstid([amina, sara], deltagare, IDAG)
    expect(r.snittDagar).toBe(70) // var "11 dagar" före rättelsen
    expect(r.kommande).toBe(1)
    expect(r.forklaring).toBe('Räknat på 1 placering; 1 placering har startdatum framåt och räknas när jobbet har börjat.')
  })

  it('utan mätbart underlag är snittet null med en rad om varför — aldrig 0 eller 1', () => {
    expect(placeringstid([], deltagare, IDAG)).toMatchObject({ snittDagar: null, forklaring: 'Inga placeringar i perioden.' })
    const utanKoppling = placeringstid([amina], [], IDAG)
    expect(utanKoppling.snittDagar).toBeNull()
    expect(utanKoppling.forklaring).toMatch(/^Ingen placering går att mäta än: 1 placering saknar kopplingsdatum/)
    const bara = placeringstid([sara], deltagare, IDAG)
    expect(bara.snittDagar).toBeNull()
    expect(bara.forklaring).toMatch(/startdatum framåt/)
  })

  it('en placering som startade före kopplingen ger inget negativt tal och inget golv', () => {
    const r = placeringstid([{ participant_id: 'amina', start_date: '2026-04-01' }], deltagare, IDAG)
    expect(r.snittDagar).toBeNull()
    expect(r.utanUnderlag).toBe(1)
  })
})
