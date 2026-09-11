/**
 * Vad plan-PDF:en (KM5) faktiskt lägger på pappret. Läser byteströmmen som
 * artikelPdf.test.ts — och av-eskaperar parenteser först, annars är ett
 * `toContain('(…)')` mot en PDF-ström alltid falskt (fällan 2026-08-23).
 */
import { describe, it, expect } from 'vitest'
import { forstaVeckansPass, generateAktivitetsplanBlob, veckoschemaRader } from './aktivitetsplanPdf'
import type { ActivityPlan, ActivitySession } from './aktivitetApi'

const plan = (o: Partial<ActivityPlan> = {}): ActivityPlan => ({
  id: 'plan1', participant_id: 'p1', consultant_id: 'c1', org_id: null, template_id: 't1', template_name: 'Verkstad 30 h',
  start_date: '2026-10-05', end_date: '2026-12-27', weekly_hours_target: 30, jobsearch_hours_per_week: 5, target_reason: null,
  status: 'active', plan_text: null, decided_at: '2026-10-01', forsorjningshinder: 'arbetslos', nedsattning_underlag_lamnat_at: null,
  created_at: '', updated_at: '', ...o,
})

const pass = (o: Partial<ActivitySession>): ActivitySession => ({
  id: 's1', plan_id: 'plan1', participant_id: 'p1', date: '2026-10-05', start_time: '09:00', end_time: '12:00', title: 'Jobbsökarverkstad',
  activity_type: 'jobsearch', location: 'Hjernet', notes: null, attendance: null, attendance_note: null, sick_certificate_received: false,
  marked_by: null, marked_at: null, self_checkin_at: null, created_at: '', updated_at: '', ...o,
})

const avEskapera = (rå: string) => rå.replace(/\\([()\\])/g, '$1')

async function textenIPdf(p: ActivityPlan, sessions: ActivitySession[]): Promise<string> {
  const blob = await generateAktivitetsplanBlob({ plan: p, sessions, participantName: 'Anna Andersson', consultantName: 'Kalle Konsulent', organizationName: 'Hällefors kommun' })
  return await new Promise<string>((resolve, reject) => {
    const läsare = new FileReader()
    läsare.onload = () => resolve(String(läsare.result))
    läsare.onerror = () => reject(läsare.error)
    läsare.readAsBinaryString(blob)
  }).then(avEskapera)
}

describe('veckoschemat ur passen', () => {
  it('tar första veckan med pass, sorterad, och skriver typ-etiketter', () => {
    const rader = veckoschemaRader([
      pass({ id: 'b', date: '2026-10-14', start_time: '13:00', end_time: '16:00', title: 'Språkcafé', activity_type: 'language' }),
      pass({ id: 'a', date: '2026-10-07', start_time: '13:00', end_time: '16:00', title: 'Språkcafé', activity_type: 'language', location: null }),
      pass({ id: 'c', date: '2026-10-05' }),
    ])
    expect(rader).toEqual([
      ['Måndag', '09:00-12:00', 'Jobbsökarverkstad', 'Jobbsökande', 'Hjernet'],
      ['Onsdag', '13:00-16:00', 'Språkcafé', 'Språk', '-'],
    ])
    expect(forstaVeckansPass([])).toEqual([])
  })
})

describe('generateAktivitetsplanPDF', () => {
  it('skriver rubrik, veckomål, signaturrad, sidfot och schemat', async () => {
    const pdf = await textenIPdf(plan({ plan_text: 'Mål: praktik inom vården till våren.' }), [pass({})])
    expect(pdf).toContain('Individuell plan för aktivitet enligt socialtjänstlagen 12 kap.')
    expect(pdf).toContain('30 timmar per vecka')
    expect(pdf).toContain('Deltagare, underskrift och datum')
    expect(pdf).toContain('Beslut om försörjningsstöd fattas av socialnämnden')
    expect(pdf).toContain('Mål: praktik inom vården till våren.')
    expect(pdf).toContain('Jobbsökarverkstad')
    expect(pdf).toContain('Arbetslös')
    expect(pdf).toContain('Hällefors kommun')
  }, 30000)

  it('skriver ett streck när plantext saknas, inte tomt och inte påhittad text', async () => {
    const pdf = await textenIPdf(plan({ plan_text: null, target_reason: null }), [])
    // jsPDF med Helvetica skriver INTE tankstreck (cellen blir `() Tj`, tom) — uppmätt
    // 2026-09-11. Därför bindestreck, och testet kräver att cellen efter etiketten
    // faktiskt bär ett tecken: `(-) Tj`, inte `() Tj`.
    const efterMotivering = pdf.slice(pdf.indexOf('Motivering till veckomålet'), pdf.indexOf('Motivering till veckomålet') + 200)
    expect(efterMotivering).toContain('(-) Tj')
    expect(efterMotivering).not.toContain('() Tj')
    expect(pdf).toContain('Inga pass är planerade än.')
    // 'null' förekommer i PDF-syntaxen själv (objektreferenser) — bara 'undefined' är ett JS-läckage.
    expect(pdf).not.toContain('undefined')
  }, 30000)
})
