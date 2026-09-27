/**
 * RK11 (rollspelet 2026-09-27): konsultrapportens PDF skrev "Genomsnittlig
 * placeringstid: 0 dagar" och kohortens "Snitt tid 0" där vyn visar "—", och
 * "Sep 0%" för en månadsserie som är ett antal, inte en procentsats.
 */
import { describe, it, expect } from 'vitest'
import { framstegRader, generateConsultantReport, kohortRader, placeringstidText, type ReportData } from './pdfReportGenerator'

const data: ReportData = {
  totalParticipants: 4,
  activeParticipants: 3,
  completedParticipants: 0,
  cvCompletionRate: 70,
  goalsCompletionRate: 20,
  engagementRate: 50,
  averageTimeToPlacement: null,
  averageTimeToPlacementNote: 'Inga placeringar i perioden.',
  monthlyProgress: [{ month: 'Sep', value: 2 }],
  statusDistribution: [],
  topGoalCategories: [],
  cohortData: [{ cohort: 'Q3 2026', participants: 4, cvComplete: 75, placed: 0, avgTime: 0 }],
}

describe('RK11: konsultrapporten visar — där underlag saknas', () => {
  it('placeringstid utan underlag är —, inte 0 dagar', () => {
    expect(placeringstidText(null)).toBe('—')
    expect(placeringstidText(70)).toBe('70 dagar')
  })

  it('en kohort utan mätbar placering har ingen snittid', () => {
    expect(kohortRader(data.cohortData)[0]).toEqual(['Q3 2026', '4', '75%', '0%', '—'])
  })

  it('månadsserien är ett antal, inte procent', () => {
    expect(framstegRader(data.monthlyProgress)).toEqual([['Sep', '2']])
  })

  it('PDF:en bär strecket och förklaringen, och ingen "0 dagar"', async () => {
    const doc = await generateConsultantReport(data)
    const text = String(doc.output()).replace(/\\([()\\])/g, '$1')
    expect(text).not.toContain('0 dagar')
    expect(text).toContain('Inga placeringar i perioden.')
    expect(text).not.toMatch(/\(2%\)/)
  })
})
