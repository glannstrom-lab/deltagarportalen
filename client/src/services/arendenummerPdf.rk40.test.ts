/**
 * RK40 (rollspelet 2026-09-27): ärendenumret står på plan-PDF:en,
 * närvarointyget och underlagspaketet — så handlingen matchas hos
 * handläggaren utan personnummer. Läser byteströmmen som de andra PDF-testerna.
 */
import { describe, it, expect, vi } from 'vitest'
import { generateAktivitetsplanBlob } from './aktivitetsplanPdf'
import { generateNarvaroIntygBlob } from './narvaroIntygPdf'
import { generateUnderlagspaketBlob, type UnderlagspaketInput } from './underlagspaketPdf'
import type { ActivityPlan, ActivitySession } from './aktivitetApi'

vi.mock('./orgApi', () => ({ orgApi: { myMemberships: vi.fn(async () => []) } }))

const avEskapera = (rå: string) => rå.replace(/\\([()\\])/g, '$1')
/** Etiketten bryts över två rader i den smala kolumnen — läs ihop raderna. */
const ihop = (pdf: string) => pdf.replace(/\) Tj\s*T\* \(/g, ' ')
async function text(blob: Blob): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const läsare = new FileReader()
    läsare.onload = () => resolve(String(läsare.result))
    läsare.onerror = () => reject(läsare.error)
    läsare.readAsBinaryString(blob)
  }).then(avEskapera).then(ihop)
}

const plan = (o: Partial<ActivityPlan> = {}): ActivityPlan => ({
  id: 'plan1', participant_id: 'p1', consultant_id: 'c1', org_id: null, template_id: 't1', template_name: 'Verkstad',
  start_date: '2026-10-05', end_date: '2026-12-27', weekly_hours_target: 30, jobsearch_hours_per_week: 5, target_reason: null,
  status: 'active', plan_text: null, decided_at: '2026-10-01', forsorjningshinder: null, nedsattning_underlag_lamnat_at: null, af_registered_at: null,
  created_at: '', updated_at: '', ...o,
})
const pass: ActivitySession = {
  id: 's1', plan_id: 'plan1', participant_id: 'p1', date: '2026-10-05', start_time: '09:00', end_time: '12:00', title: 'Verkstad',
  activity_type: 'jobsearch', location: null, notes: null, attendance: 'present', attendance_note: null, sick_certificate_received: false,
  marked_by: null, marked_at: null, self_checkin_at: null, created_at: '', updated_at: '',
}

describe('plan-PDF:en', () => {
  it('skriver ärendenumret med kommunens etikett', async () => {
    const pdf = await text(await generateAktivitetsplanBlob({ plan: plan({ case_reference: 'KS-2026/0042' }), sessions: [pass], participantName: 'Anna', consultantName: 'Kalle', regelverk: 'kommun', visaArende: true }))
    expect(pdf).toContain('Ärendenummer i verksamhetssystemet')
    expect(pdf).toContain('KS-2026/0042')
  })

  it('leverantören får AF:s ärende-id, och ett tomt nummer blir ett streck', async () => {
    const pdf = await text(await generateAktivitetsplanBlob({ plan: plan(), sessions: [pass], participantName: 'Anna', consultantName: 'Kalle', regelverk: 'leverantor', visaArende: true }))
    expect(pdf).toContain('Ärende-id hos Arbetsförmedlingen')
  })

  it('före migrationen finns ingen rad', async () => {
    const pdf = await text(await generateAktivitetsplanBlob({ plan: plan({ case_reference: 'KS-2026/0042' }), sessions: [pass], participantName: 'Anna', consultantName: 'Kalle', regelverk: 'kommun', visaArende: false }))
    expect(pdf).not.toContain('KS-2026/0042')
    expect(pdf).not.toContain('Ärendenummer')
  })
})

describe('närvarointyget', () => {
  it('skriver numret när planen har ett — och ingen tom rad när den inte har det', async () => {
    const med = await text(await generateNarvaroIntygBlob({ participantName: 'Dana', manad: '2026-10', sessions: [pass], idag: '2026-10-20', regelverk: 'leverantor', caseReference: 'A-778899' }))
    expect(med).toContain('Ärende-id hos Arbetsförmedlingen')
    expect(med).toContain('A-778899')
    const utan = await text(await generateNarvaroIntygBlob({ participantName: 'Dana', manad: '2026-10', sessions: [pass], idag: '2026-10-20', regelverk: 'kommun' }))
    expect(utan).not.toContain('Ärende')
  })
})

describe('underlagspaketet', () => {
  const input: UnderlagspaketInput = {
    underlag: { recipient: 'Anna Andersson', period_from: '2026-10-01', period_to: '2026-10-20', handed_over_at: '2026-10-20T08:00:00Z', summary: {}, note: null, withdrawn_at: null, withdrawn_reason: null },
    participantId: 'p1', participantName: 'Omar', lamnatAv: 'Karin', organizationName: 'Demokommun', sessions: [pass], namn: {},
    regelverk: 'kommun', nu: new Date('2026-10-20T08:05:00Z'),
  }

  it('skriver ärendenumret', async () => {
    const pdf = await text(await generateUnderlagspaketBlob({ ...input, caseReference: 'KS-2026/0042', visaArende: true }))
    expect(pdf).toContain('Ärendenummer i verksamhetssystemet')
    expect(pdf).toContain('KS-2026/0042')
  })

  it('före migrationen finns ingen rad', async () => {
    const pdf = await text(await generateUnderlagspaketBlob({ ...input, caseReference: 'KS-2026/0042', visaArende: false }))
    expect(pdf).not.toContain('KS-2026/0042')
  })
})
