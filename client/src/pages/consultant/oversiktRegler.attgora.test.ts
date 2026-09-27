/**
 * RK35 + RR26 (rollspelet 2026-09-27): "Att göra i dag" och leverantörens
 * vecka mot avtalet — reglerna i oversiktRegler.ts.
 *
 * Motprov (körda): (1) ta bort `!p.attendance_note?.trim()` → "ogiltig frånvaro
 * MED anteckning" blir en punkt och testet faller. (2) låt varje förklaring
 * räknas som ny oavsett marked_at → "konsulenten har tagit ställning" faller. (3) byt `OMARKERAT_EFTER_DAGAR` mot 1 → gårdagens pass blir en punkt.
 * (4) räkna `v.uppfylld` som alltid false → "uppfylld vecka" faller.
 * (5) ta bort `k.bokatFysiskt`-villkoret → "bokat fysiskt möte" faller.
 */
import { describe, it, expect } from 'vitest'
import {
  attGoraFonster,
  attGoraForPass,
  attGoraIdag,
  bradskandeUtanDubbletter,
  leverantorsLage,
  leverantorSammanfattning,
  type AttGoraPass,
  type Bradskande,
} from './oversiktRegler'

const IDAG = new Date(2026, 8, 27, 14, 0) // sön 27 sep 2026
const DAG = '2026-09-27'

const pass = (o: Partial<AttGoraPass>): AttGoraPass => ({
  id: 's1', plan_id: 'plan1', participant_id: 'anna', date: '2026-09-25', start_time: '09:00', end_time: '12:00',
  title: 'Jobbsökarverkstad', activity_type: 'jobsearch', attendance: null, attendance_note: null,
  sick_certificate_received: false, marked_at: null, self_checkin_at: null, location: null, ...o,
})

describe('attGoraFonster', () => {
  it('14 dagar bakåt inklusive i dag, 7 framåt', () => {
    expect(attGoraFonster(IDAG)).toEqual({ fran: '2026-09-14', till: '2026-10-04' })
  })
})

describe('attGoraForPass — en punkt per pass, första regeln vinner', () => {
  it('ogiltig frånvaro utan anteckning är en punkt; med anteckning är den inte det', () => {
    expect(attGoraForPass(pass({ attendance: 'absent_invalid', marked_at: '2026-09-25T15:00:00Z' }), DAG)?.typ).toBe('franvaro_utan_anteckning')
    expect(attGoraForPass(pass({ attendance: 'absent_invalid', attendance_note: 'Kom inte', marked_at: '2026-09-25T15:00:00Z' }), DAG)).toBeNull()
    expect(attGoraForPass(pass({ attendance: 'absent_invalid', attendance_note: '   ' }), DAG)?.typ).toBe('franvaro_utan_anteckning')
  })

  it('texten säger vilket pass det gäller, med dag, titel och tid', () => {
    const p = attGoraForPass(pass({ attendance: 'absent_invalid' }), DAG)!
    expect(p.text).toBe('Ogiltig frånvaro 25 sep (Jobbsökarverkstad, 09:00–12:00) saknar anteckning')
  })

  it('deltagarens förklaring EFTER markeringen är en punkt — och går före den saknade anteckningen', () => {
    const efter = pass({
      attendance: 'absent_invalid', marked_at: '2026-09-25T15:00:00Z',
      participant_explanation: 'Bussen kom inte', participant_explanation_at: '2026-09-26T08:00:00Z',
    })
    const p = attGoraForPass(efter, DAG)!
    expect(p.typ).toBe('forklaring')
    expect(p.text).toContain('markerad som ogiltig')
    expect(p.text).toContain('”Bussen kom inte”')
    // Konsulenten har tagit ställning (markerat om) efter förklaringen → ingen punkt om förklaringen
    const bedomd = { ...efter, marked_at: '2026-09-26T09:00:00Z', attendance_note: 'Godtar inte förklaringen' }
    expect(attGoraForPass(bedomd, DAG)).toBeNull()
  })

  it('förklaring på giltig frånvaro är också en punkt', () => {
    expect(attGoraForPass(pass({
      attendance: 'absent_valid', marked_at: '2026-09-25T15:00:00Z',
      participant_explanation: 'Läkarbesök', participant_explanation_at: '2026-09-25T16:00:00Z',
    }), DAG)?.typ).toBe('forklaring')
  })

  it('sjuk utan intyg är en punkt; med intyg inte', () => {
    expect(attGoraForPass(pass({ attendance: 'sick_certified', sick_certificate_received: false }), DAG)?.typ).toBe('sjuk_utan_intyg')
    expect(attGoraForPass(pass({ attendance: 'sick_certified', sick_certificate_received: true }), DAG)).toBeNull()
  })

  it('närvaro och annan aktivitet är klara', () => {
    expect(attGoraForPass(pass({ attendance: 'present' }), DAG)).toBeNull()
    expect(attGoraForPass(pass({ attendance: 'external' }), DAG)).toBeNull()
  })

  it('anmäld frånvaro i förväg, även framåt i tiden, med orsak och deltagarens not', () => {
    const p = attGoraForPass(pass({
      date: '2026-09-29', absence_reported_at: '2026-09-27T07:00:00Z', absence_reason: 'child_care', absence_note: 'Förskolan stängd',
    }), DAG)!
    expect(p.typ).toBe('anmald_franvaro')
    expect(p.text).toBe('Har anmält frånvaro 29 sep (Jobbsökarverkstad, 09:00–12:00): vård av barn — ”Förskolan stängd”')
  })

  it('egen redovisning och incheckning väntar på kvittens (samma regel som egenrapport.ts)', () => {
    expect(attGoraForPass(pass({ date: DAG, activity_type: 'jobsearch_own', start_time: '08:00', end_time: '17:00' }), DAG)?.typ).toBe('kvittera')
    expect(attGoraForPass(pass({ date: '2026-09-26', self_checkin_at: '2026-09-26T07:05:00Z' }), DAG)?.text).toMatch(/^Incheckning 26 sep/)
    // Framtida egen redovisning väntar inte på något än
    expect(attGoraForPass(pass({ date: '2026-09-29', activity_type: 'jobsearch_own' }), DAG)).toBeNull()
  })

  it('ett anvisat pass som inte markerats på två dagar — i går räcker inte', () => {
    expect(attGoraForPass(pass({ date: '2026-09-25' }), DAG)?.typ).toBe('omarkerat')
    expect(attGoraForPass(pass({ date: '2026-09-26' }), DAG)).toBeNull()
    expect(attGoraForPass(pass({ date: DAG }), DAG)).toBeNull()
  })

  it('utanför fönstret blir inget en punkt', () => {
    expect(attGoraForPass(pass({ date: '2026-09-13', attendance: 'absent_invalid' }), DAG)).toBeNull()
    expect(attGoraForPass(pass({ date: '2026-10-05', absence_reported_at: '2026-09-27T07:00:00Z', absence_reason: 'sick' }), DAG)).toBeNull()
  })
})

describe('attGoraIdag', () => {
  it('bara egna deltagare, i ordning: förklaring, anteckning, intyg, anmälan, kvittens, omarkerat', () => {
    const punkter = attGoraIdag({
      deltagare: [{ participant_id: 'anna' }, { participant_id: 'omar' }],
      pass: [
        pass({ id: 'o', date: '2026-09-22' }),
        pass({ id: 'k', date: DAG, activity_type: 'jobsearch_own' }),
        pass({ id: 'a', date: '2026-09-30', absence_reported_at: '2026-09-27T07:00:00Z', absence_reason: 'sick' }),
        pass({ id: 's', attendance: 'sick_certified' }),
        pass({ id: 'f', attendance: 'absent_invalid' }),
        pass({ id: 'e', participant_id: 'omar', attendance: 'absent_valid', marked_at: '2026-09-25T15:00:00Z', participant_explanation: 'x', participant_explanation_at: '2026-09-26T08:00:00Z' }),
        pass({ id: 'x', participant_id: 'nagon-annans', attendance: 'absent_invalid' }),
      ],
      idag: IDAG,
    })
    expect(punkter.map((p) => p.pass.id)).toEqual(['e', 'f', 's', 'a', 'k', 'o'])
  })
})

describe('bradskandeUtanDubbletter', () => {
  const b: Bradskande[] = [
    { participantId: 'anna', typ: 'franvaro', text: 'Ogiltig frånvaro 25 sep' },
    { participantId: 'anna', typ: 'mote', text: 'Senaste möte 20 dagar sedan — gränsen är 14' },
    { participantId: 'omar', typ: 'franvaro', text: 'Ogiltig frånvaro 24 sep' },
  ]
  it('frånvaroraden försvinner när samma deltagares frånvaro redan är en punkt; mötesraden står kvar', () => {
    const punkter = attGoraIdag({ deltagare: [{ participant_id: 'anna' }], pass: [pass({ attendance: 'absent_invalid' })], idag: IDAG })
    expect(bradskandeUtanDubbletter(b, punkter).map((x) => `${x.participantId}:${x.typ}`)).toEqual(['anna:mote', 'omar:franvaro'])
  })
})

describe('leverantorsLage — RR26', () => {
  const deltagare = [
    { participant_id: 'anna', status: 'ACTIVE' },
    { participant_id: 'omar', status: 'ACTIVE' },
    { participant_id: 'lisa', status: 'INACTIVE' },
  ]
  // Senaste avslutade vecka sett från sön 27/9 = mån 14/9–sön 20/9 (v. 38)
  const plans = [
    { id: 'pa', participant_id: 'anna', start_date: '2026-08-01', end_date: null, status: 'active' as const },
    { id: 'po', participant_id: 'omar', start_date: '2026-08-01', end_date: null, status: 'active' as const },
    { id: 'pl', participant_id: 'lisa', start_date: '2026-08-01', end_date: null, status: 'ended' as const },
  ]
  const passen = [
    pass({ id: '1', plan_id: 'pa', participant_id: 'anna', date: '2026-09-15', start_time: '09:00', end_time: '09:30', attendance: 'present' }),
    pass({ id: '2', plan_id: 'po', participant_id: 'omar', date: '2026-09-16', start_time: '09:00', end_time: '11:00', attendance: 'present', location: 'Kontoret' }),
    // eget jobbsökande räknas inte mot avtalet (RR1)
    pass({ id: '3', plan_id: 'pa', participant_id: 'anna', date: '2026-09-17', activity_type: 'jobsearch_own', start_time: '08:00', end_time: '16:00', attendance: 'present' }),
  ]
  const moten = [
    { participant_id: 'anna', scheduled_at: new Date(2026, 8, 20, 10).toISOString(), meeting_type: 'physical' as const, status: 'completed' as const },
    { participant_id: 'omar', scheduled_at: new Date(2026, 7, 10, 10).toISOString(), meeting_type: 'physical' as const, status: 'completed' as const },
  ]
  const placeringar = [
    { participant_id: 'anna', employer_name: 'Nordfrakt', start_date: '2026-07-01', followup_3m: false, followup_6m: false }, // 3 mån = 1 okt → om 4 dagar
    { participant_id: 'omar', employer_name: 'Lagret', start_date: '2026-09-01', followup_3m: false, followup_6m: false }, // 1 dec → inte inom 14 dagar
  ]

  it('under timkravet, utan fysiskt möte och uppföljningar inom 14 dagar — ur samma regler som avtalsloggen', () => {
    const l = leverantorsLage({ deltagare, plans, pass: passen, moten, placeringar, idag: IDAG })
    expect(l.bedomdaPlaner).toBe(2)
    expect(l.underTimkravet).toEqual([{ participantId: 'anna', text: 'Vecka 38: 0,5 h närvaro mot kravet 1 h' }])
    expect(l.utanFysisktMote).toEqual([{ participantId: 'omar', text: 'Senaste fysiska möte 48 dagar sedan — gränsen är 28' }])
    expect(l.uppfoljningar).toEqual([{ participantId: 'anna', text: '3-månadersuppföljning om 4 dagar — Nordfrakt' }])
    expect(leverantorSammanfattning(l)).toEqual(['1 deltagare under timkravet', '1 utan fysiskt möte', '1 uppföljning inom 14 dagar'])
  })

  it('ett bokat fysiskt möte är omhändertaget; en inaktiv deltagare flaggas inte', () => {
    const bokat = [...moten, { participant_id: 'omar', scheduled_at: new Date(2026, 8, 30, 10).toISOString(), meeting_type: 'physical' as const, status: 'scheduled' as const }]
    const l = leverantorsLage({ deltagare, plans, pass: passen, moten: bokat, placeringar, idag: IDAG })
    expect(l.utanFysisktMote).toEqual([])
  })

  it('utan en enda bedömd vecka står det så — inte "0 under timkravet"', () => {
    const l = leverantorsLage({ deltagare, plans: [], pass: [], moten, placeringar: [], idag: IDAG })
    expect(l.bedomdaPlaner).toBe(0)
    expect(leverantorSammanfattning(l)[0]).toBe('Timkravet: ingen avslutad vecka att bedöma')
    expect(l.utanFysisktMote.map((p) => p.participantId)).toEqual(['omar'])
  })

  it('en deltagare utan fysiskt möte alls säger det rakt ut', () => {
    const l = leverantorsLage({ deltagare: [{ participant_id: 'ny', status: 'ACTIVE' }], plans: [], pass: [], moten: [], placeringar: [], idag: IDAG })
    expect(l.utanFysisktMote[0].text).toBe('Inget genomfört fysiskt möte de senaste 90 dagarna')
  })
})
