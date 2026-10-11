/**
 * Min dag i omtaget "Kvarter" (steg 3, 2026-10-11): en rad per människa,
 * ETT nästa steg i förslagets ordning, dagens pass att markera och veckan i en
 * mening — bara det datan bär.
 *
 * Motprov (körda): (1) byt ordningen i valjNastaSteg så passet kommer före
 * frånvaron → "frånvaro utan anteckning går före passet" faller. (2) ta bort
 * grupperingen per person i minDagPersoner → "en rad per människa" faller.
 * (3) låt veckanIEnMening räkna dagens pass → "dagens pass räknas inte" faller.
 */
import { describe, it, expect } from 'vitest'
import {
  antalSaker,
  dagOrd,
  radSammanfattning,
  minDagPersoner,
  passAttMarkera,
  passMening,
  utanNastaSteg,
  valjNastaSteg,
  veckanIEnMening,
  type AttGora,
  type AttGoraPass,
  type Bradskande,
} from './oversiktRegler'

// Måndag 13 oktober 2026, 12:30 lokal tid.
const NU = new Date(2026, 9, 13, 12, 30)

const pass = (o: Partial<AttGoraPass>): AttGoraPass => ({
  id: 's1', plan_id: 'pl', participant_id: 'leila', date: '2026-10-13', start_time: '13:00', end_time: '14:00',
  title: 'Gruppträff', activity_type: 'group', attendance: null, ...o,
})
const att = (typ: AttGora['typ'], p: AttGoraPass): AttGora => ({ typ, participantId: p.participant_id, pass: p, text: typ })

const tomt = { attGora: [], bradskande: [], leverantor: null, moten: [], deadlines: [], kontakter: [], idag: NU }

describe('dagOrd — ord före siffror, bara inom en vecka', () => {
  it('i dag, i går, i fredags, på torsdag, annars datum', () => {
    expect(dagOrd('2026-10-13', '2026-10-13')).toBe('i dag')
    expect(dagOrd('2026-10-12', '2026-10-13')).toBe('i går')
    expect(dagOrd('2026-10-10', '2026-10-13')).toBe('i lördags')
    expect(dagOrd('2026-10-09', '2026-10-13')).toBe('i fredags')
    expect(dagOrd('2026-10-15', '2026-10-13')).toBe('på torsdag')
    expect(dagOrd('2026-09-30', '2026-10-13')).toBe('30 sep')
  })
})

describe('minDagPersoner — personen är enheten', () => {
  it('en rad per människa, mest brådskande först, och "+N till" är resten', () => {
    const fre = pass({ id: 'a', date: '2026-10-09', attendance: 'absent_invalid' })
    const egen = pass({ id: 'b', participant_id: 'goran', date: '2026-10-12', activity_type: 'jobsearch_own', title: 'Eget jobbsökande' })
    const personer = minDagPersoner({
      ...tomt,
      attGora: [att('franvaro_utan_anteckning', fre), att('kvittera', egen)],
      kontakter: [{ participantId: 'leila', text: 'Ej kontaktad på 9 dagar' }],
      deadlines: [{ goalId: 'g', goalTitle: 'Skicka tre ansökningar', participantId: 'leila', daysLeft: -2 }],
    })
    expect(personer.map((p) => p.participantId)).toEqual(['leila', 'goran'])
    expect(personer[0].punkter.map((p) => p.typ)).toEqual(['franvaro_utan_anteckning', 'deadline', 'kontakt'])
    expect(personer[0].punkter[0].lage).toBe('Var inte på Gruppträff i fredags')
    expect(personer[0].punkter[1].lage).toBe('Målet ”Skicka tre ansökningar” skulle ha varit klart för 2 dagar sedan')
    expect(personer[1].punkter[0].lage).toBe('Har redovisat eget jobbsökande i går')
  })

  it('en incheckning på ett av dagens pass står i passet, inte som egen rad; eget jobbsökande står kvar', () => {
    const incheckad = pass({ id: 'i', participant_id: 'sami', self_checkin_at: '2026-10-13T10:55:00Z' })
    const egen = pass({ id: 'e', participant_id: 'goran', activity_type: 'jobsearch_own', title: 'Eget jobbsökande' })
    const personer = minDagPersoner({ ...tomt, attGora: [att('kvittera', incheckad), att('kvittera', egen)] })
    expect(personer.map((p) => p.participantId)).toEqual(['goran'])
  })

  it('en frånvaro som redan står som Att göra-punkt står inte en gång till som brådskande', () => {
    const fre = pass({ id: 'a', date: '2026-10-09', attendance: 'absent_invalid' })
    const brad: Bradskande[] = [{ participantId: 'leila', typ: 'franvaro', text: 'Ogiltig frånvaro 9 okt' }]
    const [leila] = minDagPersoner({ ...tomt, attGora: [att('franvaro_utan_anteckning', fre)], bradskande: brad })
    expect(leila.punkter.map((p) => p.typ)).toEqual(['franvaro_utan_anteckning'])
  })

  it('leverantörens "utan fysiskt möte" står inte bredvid en mötesrad om samma person', () => {
    const personer = minDagPersoner({
      ...tomt,
      bradskande: [{ participantId: 'sami', typ: 'mote', text: 'Senaste möte 20 dagar sedan — gränsen är 14' }],
      leverantor: { bedomdaPlaner: 1, underTimkravet: [], utanFysisktMote: [{ participantId: 'sami', text: 'x' }], uppfoljningar: [] },
    })
    expect(personer[0].punkter.map((p) => p.typ)).toEqual(['mote_over_gransen'])
  })
})

describe('valjNastaSteg — ett, i förslagets ordning', () => {
  const idagPass = pass({ id: 'p1', participant_id: 'sami', self_checkin_at: '2026-10-13T10:55:00Z' })

  it('frånvaro utan anteckning går före passet att markera', () => {
    const personer = minDagPersoner({ ...tomt, attGora: [att('franvaro_utan_anteckning', pass({ id: 'a', date: '2026-10-09', attendance: 'absent_invalid' }))] })
    const val = valjNastaSteg(personer, passAttMarkera([idagPass], NU), NU)
    expect(val?.typ === 'punkt' && val.punkt.typ).toBe('franvaro_utan_anteckning')
  })

  it('passet att markera går före kvittenser och möten', () => {
    const personer = minDagPersoner({
      ...tomt,
      attGora: [att('kvittera', pass({ id: 'b', participant_id: 'goran', date: '2026-10-12', activity_type: 'jobsearch_own' }))],
      moten: [{ id: 'm', participantId: 'sami', scheduledAt: new Date(2026, 9, 13, 15, 30).toISOString(), meetingType: 'physical', meetingLink: null, latestNote: null }],
    })
    const val = valjNastaSteg(personer, passAttMarkera([idagPass], NU), NU)
    expect(val?.typ).toBe('pass')
  })

  it('utan pass: kvittensen före mötet, mötet före kontakten', () => {
    const mote = { id: 'm', participantId: 'sami', scheduledAt: new Date(2026, 9, 13, 15, 30).toISOString(), meetingType: 'physical', meetingLink: null, latestNote: null }
    const kontakt = { participantId: 'ahmed', text: 'Aldrig kontaktad' }
    const medKvittens = minDagPersoner({ ...tomt, attGora: [att('kvittera', pass({ id: 'b', participant_id: 'goran', date: '2026-10-12' }))], moten: [mote], kontakter: [kontakt] })
    expect((valjNastaSteg(medKvittens, [], NU) as { punkt: { typ: string } }).punkt.typ).toBe('kvittera')
    const utan = minDagPersoner({ ...tomt, moten: [mote], kontakter: [kontakt] })
    expect((valjNastaSteg(utan, [], NU) as { punkt: { typ: string } }).punkt.typ).toBe('mote_idag')
  })

  it('ett möte som varit för länge sedan blir inte nästa steg', () => {
    const morgon = { id: 'm', participantId: 'sami', scheduledAt: new Date(2026, 9, 13, 9, 0).toISOString(), meetingType: null, meetingLink: null, latestNote: null }
    expect(valjNastaSteg(minDagPersoner({ ...tomt, moten: [morgon] }), [], NU)).toBeNull()
  })

  it('ingenting att göra → null; och nästa steg står inte en gång till i listan', () => {
    expect(valjNastaSteg([], [], NU)).toBeNull()
    const personer = minDagPersoner({ ...tomt, attGora: [att('kvittera', pass({ id: 'b', participant_id: 'goran', date: '2026-10-12' }))] })
    expect(utanNastaSteg(personer, valjNastaSteg(personer, [], NU))).toEqual([])
  })
})

describe('passAttMarkera — dagens pass som ska markeras nu', () => {
  it('grupperar samma tid och titel, räknar incheckade och anmälda, hoppar över eget jobbsökande', () => {
    const lista = [
      pass({ id: '1', participant_id: 'a', self_checkin_at: 'x' }),
      pass({ id: '2', participant_id: 'b', self_checkin_at: 'x' }),
      pass({ id: '3', participant_id: 'c', absence_reported_at: 'x' }),
      pass({ id: '4', participant_id: 'd', attendance: 'present' }),
      pass({ id: '5', participant_id: 'e', activity_type: 'jobsearch_own', title: 'Eget', start_time: '08:00', end_time: '17:00' }),
    ]
    const [g, ...resten] = passAttMarkera(lista, NU)
    expect(resten).toEqual([])
    expect(g).toMatchObject({ title: 'Gruppträff', start_time: '13:00', deltagare: 4, incheckade: 2, anmalda: 1, omarkerade: 3 })
    expect(passMening(g)).toBe('Fyra deltagare. Två har checkat in själva, en har anmält frånvaro.')
  })

  it('ett pass som börjar om mer än en timme, eller är helt markerat, är inte "nu"', () => {
    expect(passAttMarkera([pass({ start_time: '14:00', end_time: '15:00' })], NU)).toEqual([])
    expect(passAttMarkera([pass({ attendance: 'present' })], NU)).toEqual([])
    expect(passAttMarkera([pass({ date: '2026-10-12' })], NU)).toEqual([])
  })
})

describe('veckanIEnMening — bara det datan bär', () => {
  const del = [{ participant_id: 'a' }, { participant_id: 'b' }, { participant_id: 'c' }]

  it('räknar deltagare med pass måndag–i går; omarkerade pass sägs rakt ut', () => {
    // Onsdag 15 okt: måndag och tisdag har varit.
    const ons = new Date(2026, 9, 15, 9, 0)
    const lista = [
      pass({ id: '1', participant_id: 'a', date: '2026-10-13', attendance: 'present' }),
      pass({ id: '2', participant_id: 'a', date: '2026-10-14', attendance: 'external' }),
      pass({ id: '3', participant_id: 'b', date: '2026-10-13', attendance: 'absent_invalid' }),
      pass({ id: '4', participant_id: 'c', date: '2026-10-14', attendance: null }),
    ]
    expect(veckanIEnMening(lista, del, ons)).toBe('En av tre deltagare med pass den här veckan har varit på alla sina. Ett pass är inte markerat än.')
  })

  it('dagens pass räknas inte, och utan underlag finns ingen mening', () => {
    expect(veckanIEnMening([pass({ participant_id: 'a', date: '2026-10-13', attendance: 'present' })], del, NU)).toBeNull()
    expect(veckanIEnMening([], del, NU)).toBeNull()
  })
})

describe('radSammanfattning — tio omarkerade pass är en sak om Dana', () => {
  it('sammanfattar samma sort och räknar bara det andra som "+N till"', () => {
    const omarkerade = [1, 2, 3, 4].map((i) => att('omarkerat', pass({ id: `o${i}`, participant_id: 'dana', date: `2026-09-2${i}`, title: 'Verkstad' })))
    const [dana] = minDagPersoner({ ...tomt, attGora: omarkerade, kontakter: [{ participantId: 'dana', text: 'Aldrig kontaktad' }] })
    expect(radSammanfattning(dana)).toEqual({ lage: 'Fyra pass är inte markerade', detalj: 'Det första: Verkstad 21 sep', fler: 1 })
    expect(antalSaker([dana], [])).toBe(5)
  })

  it('en enda punkt står som den är', () => {
    const [dana] = minDagPersoner({ ...tomt, kontakter: [{ participantId: 'dana', text: 'Aldrig kontaktad' }] })
    expect(radSammanfattning(dana)).toEqual({ lage: 'Aldrig kontaktad', detalj: expect.any(String), fler: 0 })
  })
})
