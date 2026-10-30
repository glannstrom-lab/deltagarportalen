/**
 * Nästa-steg-kortet lovar bara det portalen kan belägga.
 *
 * Varje kandidat läser ett faktum ur sammanfattningen. Testerna nedan prövar
 * varje villkor åt båda hållen — att det tänds när faktumet finns och att det
 * INTE tänds när underlaget saknas. Det andra hållet är det som räknas:
 * lärdomen 2026-08-09 var att ett påhittat värde alltid föredragits framför
 * ett tomt fält, och det här är precis den plats där en gissning skulle bli
 * ett råd till en människa.
 */

import { describe, it, expect } from 'vitest'
import { kandidater, valjNastaSteg, FOLJ_UPP_EFTER_DAGAR, CV_GAMMALT_EFTER_DAGAR } from './nastaStegRegler'
import type { OversiktSummary } from '@/hooks/useOversiktHubSummary'
import type { JobsokSummary, KarriarSummary, MinVardagSummary, ResurserSummary } from '@/hooks/hubSummaryTypes'

const NU = new Date('2026-09-10T12:00:00')
const DYGN = 86_400_000
const forDagarSedan = (n: number) => new Date(NU.getTime() - n * DYGN).toISOString()
const datum = (n: number) => new Date(NU.getTime() + n * DYGN).toISOString().slice(0, 10)

const JOBSOK_TOMT: JobsokSummary = {
  cv: null,
  coverLetters: [],
  interviewSessions: [],
  applicationStats: { total: 0, byStatus: {}, segments: [], awaitingSince: null },
  spontaneousCount: 0,
  spontaneousFollowups: { count: 0, nextDate: null },
}
const KARRIAR_TOMT: KarriarSummary = {
  careerGoals: null,
  linkedinUrl: null,
  latestSkillsAnalysis: null,
  latestBrandAudit: null,
}
const RESURSER_TOMT: ResurserSummary = {
  cv: null,
  coverLetters: [],
  recentArticles: [],
  articleCompletedCount: 0,
  aiTeamSessions: [],
  aiTeamSessionCount: 0,
}
const VARDAG_TOMT: MinVardagSummary = {
  recentMoodLogs: [],
  diaryEntryCount: 0,
  latestDiaryEntry: null,
  upcomingEvents: [],
  networkContactsCount: 0,
  consultant: null,
}

/** En användare där ingenting är angeläget: CV nytt, mående loggat, analys gjord. */
function lugn(over: Partial<OversiktSummary> = {}): OversiktSummary {
  return {
    profile: { onboarded_hubs: [], full_name: 'Test', profile_image_url: null },
    jobsok: {
      ...JOBSOK_TOMT,
      cv: { id: 'cv', updated_at: forDagarSedan(3) },
      coverLetters: [{ id: 'b', created_at: forDagarSedan(1) }],
      applicationStats: { total: 2, byStatus: {}, segments: [{ key: 'saved', count: 2 }], awaitingSince: null },
    },
    karriar: {
      ...KARRIAR_TOMT,
      latestSkillsAnalysis: { dream_job: 'Snickare', skills_comparison: null, match_percentage: 50, created_at: forDagarSedan(5) },
    },
    resurser: RESURSER_TOMT,
    minVardag: { ...VARDAG_TOMT, recentMoodLogs: [{ mood_level: 3, energy_level: 3, log_date: datum(-1) }] },
    ...over,
  }
}

const ids = (s: OversiktSummary) => kandidater(s, NU).map((k) => k.id)

describe('inget underlag, inget förslag', () => {
  it('returnerar null utan sammanfattning', () => {
    expect(valjNastaSteg(undefined, NU)).toBeNull()
  })

  it('returnerar null när inget villkor är uppfyllt', () => {
    expect(valjNastaSteg(lugn(), NU)).toBeNull()
  })

  it('föreslår inget om CV:t när jobbskivan inte är hämtad', () => {
    // `jobsok: undefined` betyder att vi inte vet — inte att CV saknas.
    expect(ids(lugn({ jobsok: undefined }))).not.toContain('createCv')
  })
})

describe('följ upp ansökan', () => {
  it('tänds när den äldsta obesvarade ansökan är minst en vecka gammal', () => {
    const s = lugn()
    s.jobsok!.applicationStats.awaitingSince = forDagarSedan(FOLJ_UPP_EFTER_DAGAR).slice(0, 10)
    const [primar] = kandidater(s, NU)
    expect(primar.id).toBe('followUp')
    expect(primar.till).toBe('/applications')
    expect(primar.varden.dagar).toBeGreaterThanOrEqual(FOLJ_UPP_EFTER_DAGAR)
  })

  it('tänds INTE när ansökan är yngre än en vecka', () => {
    const s = lugn()
    s.jobsok!.applicationStats.awaitingSince = forDagarSedan(FOLJ_UPP_EFTER_DAGAR - 1).slice(0, 10)
    expect(ids(s)).not.toContain('followUp')
  })

  it('tänds INTE när ansökan väntar men saknar datum — då vet vi inte hur länge', () => {
    const s = lugn()
    s.jobsok!.applicationStats.segments = [{ key: 'awaiting', count: 1 }]
    s.jobsok!.applicationStats.awaitingSince = null
    expect(ids(s)).not.toContain('followUp')
  })
})

describe('spontanansökan och kalender', () => {
  it('spontanansökan tänds när en uppföljning förfaller inom tre dagar', () => {
    const s = lugn()
    s.jobsok!.spontaneousFollowups = { count: 1, nextDate: datum(2) }
    expect(ids(s)).toContain('spontaneous')
  })

  it('spontanansökan tänds INTE när uppföljningen ligger om en vecka', () => {
    const s = lugn()
    s.jobsok!.spontaneousFollowups = { count: 1, nextDate: datum(7) }
    expect(ids(s)).not.toContain('spontaneous')
  })

  it('kalendern tänds för i dag och i morgon, inte för nästa vecka', () => {
    const idag = lugn()
    idag.minVardag!.upcomingEvents = [{ id: 'e', title: 'Möte med Sara', date: datum(0), time: null, type: null }]
    const k = kandidater(idag, NU).find((x) => x.id === 'event')!
    expect(k.varden.titel).toBe('Möte med Sara')
    expect(k.varden.idag).toBe(true)

    const imorgon = lugn()
    imorgon.minVardag!.upcomingEvents = [{ id: 'e', title: 'Möte', date: datum(1), time: null, type: null }]
    expect(kandidater(imorgon, NU).find((x) => x.id === 'event')!.varden.idag).toBe(false)

    const nastaVecka = lugn()
    nastaVecka.minVardag!.upcomingEvents = [{ id: 'e', title: 'Möte', date: datum(6), time: null, type: null }]
    expect(ids(nastaVecka)).not.toContain('event')
  })
})

describe('CV:t', () => {
  it('"skapa CV" när det saknas, "fyll på" när det är gammalt, inget när det är färskt', () => {
    const saknas = lugn()
    saknas.jobsok!.cv = null
    expect(ids(saknas)).toContain('createCv')
    expect(ids(saknas)).not.toContain('updateCv')

    const gammalt = lugn()
    gammalt.jobsok!.cv = { id: 'cv', updated_at: forDagarSedan(CV_GAMMALT_EFTER_DAGAR) }
    expect(ids(gammalt)).toContain('updateCv')
    expect(ids(gammalt)).not.toContain('createCv')

    expect(ids(lugn())).not.toContain('updateCv')
  })

  it('FN4: påbörjat CV med tom sektion pekar på den första tomma — före "fyll på"', () => {
    const s = lugn()
    s.jobsok!.cv = { id: 'cv', updated_at: forDagarSedan(3), paborjat: true, tommaSektioner: ['work_experience', 'skills'] }
    const k = kandidater(s, NU)
    const steg = k.find((x) => x.id === 'continueCv')
    expect(steg?.varden.sektion).toBe('work_experience')
    expect(steg?.till).toBe('/cv')

    s.jobsok!.cv = { id: 'cv', updated_at: forDagarSedan(CV_GAMMALT_EFTER_DAGAR), paborjat: true, tommaSektioner: ['skills'] }
    const ordning = ids(s)
    expect(ordning.indexOf('continueCv')).toBeGreaterThanOrEqual(0)
    expect(ordning.indexOf('continueCv')).toBeLessThan(ordning.indexOf('updateCv'))
  })

  it('FN4: inget "fortsätt" när inget saknas, när CV:t inte är påbörjat, eller när vi inte vet', () => {
    const komplett = lugn()
    komplett.jobsok!.cv = { id: 'cv', updated_at: forDagarSedan(3), paborjat: true, tommaSektioner: [] }
    expect(ids(komplett)).not.toContain('continueCv')

    const tomRad = lugn()
    tomRad.jobsok!.cv = { id: 'cv', updated_at: forDagarSedan(3), paborjat: false, tommaSektioner: ['summary', 'skills'] }
    expect(ids(tomRad)).not.toContain('continueCv')

    // Skivan utan fältet (laddar / äldre cache) får inte påstå något.
    expect(ids(lugn())).not.toContain('continueCv')
  })

  it('"första jobbet" bara när CV finns och inga ansökningar', () => {
    const s = lugn()
    s.jobsok!.applicationStats = { total: 0, byStatus: {}, segments: [], awaitingSince: null }
    expect(ids(s)).toContain('firstJob')

    const utanCv = lugn()
    utanCv.jobsok!.cv = null
    utanCv.jobsok!.applicationStats = { total: 0, byStatus: {}, segments: [], awaitingSince: null }
    expect(ids(utanCv)).not.toContain('firstJob')
  })

  it('"första brevet" bara när ansökningar finns och inget brev', () => {
    const s = lugn()
    s.jobsok!.coverLetters = []
    expect(ids(s)).toContain('firstLetter')
    expect(ids(lugn())).not.toContain('firstLetter')
  })
})

describe('karriär och mående', () => {
  it('kompetensanalys föreslås när ingen är gjord — men inte när skivan saknas', () => {
    const s = lugn()
    s.karriar!.latestSkillsAnalysis = null
    expect(ids(s)).toContain('skills')
    expect(ids(lugn({ karriar: undefined }))).not.toContain('skills')
  })

  it('mående föreslås efter en vecka utan loggning, inte dagen efter', () => {
    const gammal = lugn()
    gammal.minVardag!.recentMoodLogs = [{ mood_level: 3, energy_level: 3, log_date: datum(-8) }]
    expect(ids(gammal)).toContain('mood')

    const aldrig = lugn()
    aldrig.minVardag!.recentMoodLogs = []
    expect(ids(aldrig)).toContain('mood')

    expect(ids(lugn())).not.toContain('mood')
  })
})

describe('ordning och urval', () => {
  it('det som har ett datum som rinner går före det som bara är ogjort', () => {
    const s = lugn()
    s.jobsok!.cv = null
    s.jobsok!.applicationStats = { total: 1, byStatus: {}, segments: [{ key: 'awaiting', count: 1 }], awaitingSince: forDagarSedan(10).slice(0, 10) }
    const val = valjNastaSteg(s, NU)!
    expect(val.primar.id).toBe('followUp')
    expect(val.alternativ.map((a) => a.id)).toContain('createCv')
  })

  it('ett förslag och högst två alternativ, aldrig fler', () => {
    const s = lugn()
    s.jobsok!.cv = null
    s.jobsok!.coverLetters = []
    s.karriar!.latestSkillsAnalysis = null
    s.minVardag!.recentMoodLogs = []
    expect(kandidater(s, NU).length).toBeGreaterThan(3)
    const val = valjNastaSteg(s, NU)!
    expect(val.alternativ).toHaveLength(2)
    expect(val.alternativ.map((a) => a.id)).not.toContain(val.primar.id)
  })
})

// 2026-10-19: deltagarens styrning ledde aldrig till Min vecka, fast dagens
// pass är det viktigaste för den som har aktivitetskrav.
describe('dagens pass', () => {
  const idag = datum(0)
  const konsulent = { id: 'k', full_name: 'Kim', avatar_url: null }
  const pass = (over: Partial<NonNullable<MinVardagSummary['nastaPass']>> = {}) => ({
    id: 'p1', title: 'Jobbsökarverkstad', date: idag, start_time: '09:00:00',
    self_checkin_at: null, attendance: null, absence_reported_at: null, ...over,
  })
  const med = (vardag: Partial<MinVardagSummary>, over: Partial<OversiktSummary> = {}) =>
    lugn({ minVardag: { ...VARDAG_TOMT, recentMoodLogs: [{ mood_level: 3, energy_level: 3, log_date: datum(-1) }], ...vardag }, ...over })

  it('går före allt annat, även en ansökan som väntat länge', () => {
    const s = med({ consultant: konsulent, nastaPass: pass() }, {
      jobsok: { ...JOBSOK_TOMT, cv: null, applicationStats: { total: 1, byStatus: {}, segments: [], awaitingSince: forDagarSedan(20) } },
    })
    const val = valjNastaSteg(s, NU)
    expect(val?.primar.id).toBe('todaysPass')
    expect(val?.primar.till).toBe('/min-vecka')
    expect(val?.alternativ[0].id).toBe('followUp')
  })

  it('bara med konsulent', () => {
    expect(kandidater(med({ consultant: null, nastaPass: pass() }), NU).map((k) => k.id)).not.toContain('todaysPass')
  })

  it('inte när passet är incheckat, markerat eller frånvaroanmält', () => {
    for (const over of [{ self_checkin_at: '2026-09-10T08:55:00Z' }, { attendance: 'present' }, { absence_reported_at: '2026-09-09T20:00:00Z' }]) {
      expect(kandidater(med({ consultant: konsulent, nastaPass: pass(over) }), NU).map((k) => k.id)).not.toContain('todaysPass')
    }
  })

  it('inte för ett pass en annan dag', () => {
    expect(kandidater(med({ consultant: konsulent, nastaPass: pass({ date: datum(1) }) }), NU).map((k) => k.id)).not.toContain('todaysPass')
  })
})

describe('intervjun (FN2)', () => {
  const med = (type: string | null, dagar: number) => {
    const s = lugn()
    s.minVardag!.upcomingEvents = [{ id: 'e', title: 'Intervju hos Nordfrakt', date: datum(dagar), time: '10:00', type }]
    return s
  }

  it('en intervju i dag eller i morgon blir steget "interview" och leder till simulatorn', () => {
    const k = kandidater(med('interview', 0), NU)
    expect(k[0].id).toBe('interview')
    expect(k[0].till).toBe('/interview-simulator')
    expect(k[0].varden.idag).toBe(true)
    expect(kandidater(med('interview', 1), NU)[0].varden.idag).toBe(false)
  })

  it('intervjun dubbleras inte som en vanlig kalenderhändelse', () => {
    expect(ids(med('interview', 0))).not.toContain('event')
  })

  it('en annan typ av bokning är fortfarande en vanlig händelse', () => {
    expect(ids(med('meeting', 0))).toContain('event')
    expect(ids(med('meeting', 0))).not.toContain('interview')
    expect(ids(med(null, 0))).not.toContain('interview')
  })

  it('en intervju om en vecka ger inget steg', () => {
    expect(ids(med('interview', 6))).not.toContain('interview')
  })

  it('intervjun går före uppföljningen av en gammal ansökan', () => {
    const s = med('interview', 1)
    s.jobsok!.applicationStats.awaitingSince = forDagarSedan(10).slice(0, 10)
    expect(kandidater(s, NU)[0].id).toBe('interview')
  })
})

describe('"Hur gick intervjun?" (FN3)', () => {
  const med = (dagar: number | null) => {
    const s = lugn()
    s.minVardag!.senasteIntervju =
      dagar === null ? null : { id: 'i', title: 'Intervju', date: datum(-dagar), job_application_id: null }
    return s
  }

  it('frågan ställs dagen efter, med ansökan först och dagboken som andra val', () => {
    const k = kandidater(med(1), NU)[0]
    expect(k.id).toBe('interviewDone')
    expect(k.till).toBe('/applications')
    expect(k.sekundar?.till).toBe('/diary')
  })

  it('ställs också dagen därpå, men inte efter tre dagar', () => {
    expect(ids(med(2))).toContain('interviewDone')
    expect(ids(med(3))).not.toContain('interviewDone')
  })

  it('ställs INTE på intervjudagen själv eller när intervjun ligger framåt', () => {
    expect(ids(med(0))).not.toContain('interviewDone')
    expect(ids(med(-1))).not.toContain('interviewDone')
  })

  it('ställs INTE utan underlag: ingen intervju, eller skivan ej hämtad', () => {
    expect(ids(med(null))).not.toContain('interviewDone')
    expect(ids(lugn())).not.toContain('interviewDone')
  })
})

describe('mjukt första steg efter överhoppad välkomsttur (FN5)', () => {
  const med = (prog: Record<string, boolean> | null, cv = false) => {
    const s = lugn()
    s.profile!.onboarding_progress = prog
    s.jobsok = { ...s.jobsok!, cv: cv ? { id: 'cv', updated_at: forDagarSedan(3) } : null }
    return s
  }

  it('tänds när turen hoppades över och inget steg är gjort — och ersätter "skapa CV"', () => {
    const k = kandidater(med({ valkomstHoppad: true }), NU)
    expect(k.map((x) => x.id)).toContain('firstStep')
    expect(k.find((x) => x.id === 'firstStep')!.till).toBe('/cv')
    expect(k.map((x) => x.id)).not.toContain('createCv')
  })

  it('försvinner så fort ett av stegen är gjort', () => {
    for (const steg of ['cv', 'interest', 'jobSearch', 'career', 'spontaneous']) {
      expect(ids(med({ valkomstHoppad: true, [steg]: true }))).not.toContain('firstStep')
    }
  })

  it('tänds INTE utan överhoppning, utan underlag, eller när CV redan finns', () => {
    expect(ids(med({}))).not.toContain('firstStep')
    expect(ids(med(null))).not.toContain('firstStep')
    expect(ids(med({ valkomstHoppad: true }, true))).not.toContain('firstStep')
  })

  it('en intervju i morgon går före det mjuka steget', () => {
    const s = med({ valkomstHoppad: true })
    s.minVardag!.upcomingEvents = [{ id: 'e', title: 'Intervju', date: datum(1), time: null, type: 'interview' }]
    expect(kandidater(s, NU)[0].id).toBe('interview')
  })
})
