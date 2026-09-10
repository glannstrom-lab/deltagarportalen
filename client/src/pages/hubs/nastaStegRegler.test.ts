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
