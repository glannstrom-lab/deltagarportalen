import { describe, it, expect } from 'vitest'
import { EJ_ANGIVET_ETIKETT, ivoKvartalsunderlag, kvartalForDatum, kvartalGranser, planAktivIPeriod, tillTsv } from './ivoKvartal'

const plan = (o: Partial<{ id: string; start_date: string; end_date: string | null; forsorjningshinder: string | null; nedsattning_underlag_lamnat_at: string | null }>) => ({
  id: 'p1',
  start_date: '2026-10-05',
  end_date: null,
  forsorjningshinder: null,
  nedsattning_underlag_lamnat_at: null, af_registered_at: null,
  ...o,
}) as never

const pass = (plan_id: string, date: string, attendance: string | null) => ({ plan_id, date, attendance }) as never

describe('kvartalGranser', () => {
  it('ger rätt gränser för alla fyra kvartal, inklusive skottår', () => {
    expect(kvartalGranser(2026, 4)).toEqual({ from: '2026-10-01', to: '2026-12-31' })
    expect(kvartalGranser(2027, 1)).toEqual({ from: '2027-01-01', to: '2027-03-31' })
    expect(kvartalGranser(2028, 1)).toEqual({ from: '2028-01-01', to: '2028-03-31' })
    expect(kvartalGranser(2026, 2)).toEqual({ from: '2026-04-01', to: '2026-06-30' })
    expect(kvartalGranser(2026, 3)).toEqual({ from: '2026-07-01', to: '2026-09-30' })
  })
  it('kvartalForDatum hittar innevarande kvartal', () => {
    expect(kvartalForDatum('2026-09-11')).toEqual({ ar: 2026, kvartal: 3 })
    expect(kvartalForDatum('2026-12-31')).toEqual({ ar: 2026, kvartal: 4 })
    expect(kvartalForDatum('2027-01-01')).toEqual({ ar: 2027, kvartal: 1 })
  })
})

describe('planAktivIPeriod', () => {
  const q4 = kvartalGranser(2026, 4)
  it('räknar en plan utan slutdatum som startade före kvartalet', () => {
    expect(planAktivIPeriod({ start_date: '2026-09-01', end_date: null }, q4)).toBe(true)
  })
  it('räknar inte en plan som slutade före kvartalet', () => {
    expect(planAktivIPeriod({ start_date: '2026-07-01', end_date: '2026-09-30' }, q4)).toBe(false)
  })
  it('räknar inte en plan som börjar efter kvartalet', () => {
    expect(planAktivIPeriod({ start_date: '2027-01-01', end_date: null }, q4)).toBe(false)
  })
  it('räknar en plan som slutade mitt i kvartalet', () => {
    expect(planAktivIPeriod({ start_date: '2026-10-05', end_date: '2026-11-15' }, q4)).toBe(true)
  })
})

describe('ivoKvartalsunderlag', () => {
  it('lägger planer utan försörjningshinder under "Ej angivet"', () => {
    const u = ivoKvartalsunderlag([plan({ id: 'a' })], [], { ar: 2026, kvartal: 4 })
    const ej = u.rader.find((r) => r.nyckel === 'ej_angivet')!
    expect(ej.etikett).toBe(EJ_ANGIVET_ETIKETT)
    expect(ej.antal_anvisade).toBe(1)
    expect(u.summa.antal_anvisade).toBe(1)
  })

  it('fördelar per kategori och räknar ogiltig frånvaro per plan, inte per pass', () => {
    const u = ivoKvartalsunderlag(
      [
        plan({ id: 'a', forsorjningshinder: 'arbetslos' }),
        plan({ id: 'b', forsorjningshinder: 'arbetslos' }),
        plan({ id: 'c', forsorjningshinder: 'sprakhinder' }),
      ],
      [
        pass('a', '2026-10-06', 'absent_invalid'),
        pass('a', '2026-10-07', 'absent_invalid'),
        pass('b', '2026-10-06', 'absent_valid'),
        pass('c', '2026-10-06', 'present'),
      ],
      { ar: 2026, kvartal: 4 },
    )
    const arbetslos = u.rader.find((r) => r.nyckel === 'arbetslos')!
    expect(arbetslos.antal_anvisade).toBe(2)
    expect(arbetslos.antal_med_ogiltig_franvaro).toBe(1)
    expect(u.rader.find((r) => r.nyckel === 'sprakhinder')!.antal_med_ogiltig_franvaro).toBe(0)
    expect(u.summa).toEqual({ antal_anvisade: 3, antal_med_ogiltig_franvaro: 1, antal_underlag_lamnat: 0 })
  })

  it('F10: med underlagslistan räknas lämnade underlag per plan ur raderna, ångrade ignoreras', () => {
    const u = ivoKvartalsunderlag(
      [plan({ id: 'a', forsorjningshinder: 'arbetslos' }), plan({ id: 'b', forsorjningshinder: 'arbetslos' }), plan({ id: 'c', forsorjningshinder: 'arbetslos' })],
      [],
      { ar: 2026, kvartal: 4 },
      [
        { plan_id: 'a', handed_over_at: '2026-10-06T07:00:00Z', withdrawn_at: null },
        { plan_id: 'a', handed_over_at: '2026-11-06T07:00:00Z', withdrawn_at: null }, // samma plan två gånger = räknas en gång
        { plan_id: 'b', handed_over_at: '2026-10-06T07:00:00Z', withdrawn_at: '2026-10-06T09:00:00Z' }, // ångrat
        { plan_id: 'c', handed_over_at: '2027-01-06T07:00:00Z', withdrawn_at: null }, // nästa kvartal
      ],
    )
    expect(u.rader.find((r) => r.nyckel === 'arbetslos')!.antal_underlag_lamnat).toBe(1)
    expect(u.summa.antal_underlag_lamnat).toBe(1)
  })

  it('räknar bara ogiltig frånvaro och underlag som ligger inom kvartalet', () => {
    const u = ivoKvartalsunderlag(
      [plan({ id: 'a', forsorjningshinder: 'arbetslos', nedsattning_underlag_lamnat_at: '2027-01-05' }), plan({ id: 'b', forsorjningshinder: 'arbetslos', nedsattning_underlag_lamnat_at: '2026-12-20' })],
      [pass('a', '2027-01-04', 'absent_invalid'), pass('b', '2026-12-19', 'absent_invalid')],
      { ar: 2026, kvartal: 4 },
    )
    const r = u.rader.find((x) => x.nyckel === 'arbetslos')!
    expect(r.antal_anvisade).toBe(2)
    expect(r.antal_med_ogiltig_franvaro).toBe(1)
    expect(r.antal_underlag_lamnat).toBe(1)
  })

  it('räknar inte en plan som slutade före kvartalet', () => {
    const u = ivoKvartalsunderlag([plan({ id: 'a', start_date: '2026-07-01', end_date: '2026-09-30', forsorjningshinder: 'arbetslos' })], [], { ar: 2026, kvartal: 4 })
    expect(u.summa.antal_anvisade).toBe(0)
  })

  it('har alltid alla kategorier med, i fast ordning, även när de är noll', () => {
    const u = ivoKvartalsunderlag([], [], { ar: 2026, kvartal: 4 })
    expect(u.rader.map((r) => r.nyckel)).toEqual([
      'arbetslos', 'sjukskriven_med_intyg', 'sjuk_eller_aktivitetsersattning', 'arbetshinder_sociala_skal',
      'foraldraledig', 'arbetar_deltid', 'sprakhinder', 'utan_forsorjningshinder', 'annat', 'ej_angivet',
    ])
  })
})

describe('tillTsv', () => {
  it('skriver rubrik, en rad per kategori och en summarad', () => {
    const u = ivoKvartalsunderlag([plan({ id: 'a', forsorjningshinder: 'arbetslos' })], [], { ar: 2026, kvartal: 4 })
    const tsv = tillTsv(u)
    const rader = tsv.split('\n')
    expect(rader[0]).toBe('Aktivitetskravet – kvartalsunderlag till IVO\t2026 Q4 (2026-10-01 – 2026-12-31)')
    expect(rader).toContain('Arbetslös\t1\t0\t0')
    expect(rader).toContain('Summa\t1\t0\t0')
    expect(rader.filter((r) => r.startsWith('Ej angivet'))).toHaveLength(1)
  })
})

/**
 * GG1 (2026-09-20): det som gjorde den här buggen dyr var att reservvägen
 * SÅG rätt ut. Triggern `activity_plan_handovers_sync_plan()` sätter
 * `nedsattning_underlag_lamnat_at` till `max(handed_over_at)` över all tid,
 * utan kvartalsfilter — så ett andra underlag i Q2 skriver om Q1 bakåt.
 */
describe('GG1: underlag räknas per kvartal, inte ur planens omskrivna kolumn', () => {
  const underlag = (plan_id: string, handed_over_at: string, withdrawn_at: string | null = null) =>
    ({ plan_id, handed_over_at, withdrawn_at })

  // Planen fick underlag både i Q1 och i Q2. Kolumnen bär bara Q2-datumet,
  // eftersom triggern skrev över det tidigare.
  const planenMedTvaUnderlag = plan({
    id: 'p1',
    start_date: '2027-01-05',
    forsorjningshinder: 'arbetslos',
    nedsattning_underlag_lamnat_at: '2027-05-04',
  })
  const raderna = [underlag('p1', '2027-02-10T09:00:00Z'), underlag('p1', '2027-05-04T09:00:00Z')]

  it('Q1 räknas rätt med raderna — och fel utan dem', () => {
    const medRader = ivoKvartalsunderlag([planenMedTvaUnderlag], [], { ar: 2027, kvartal: 1 }, raderna)
    expect(medRader.summa.antal_underlag_lamnat).toBe(1)

    // Reservvägen: kolumnen säger 2027-05-04, som inte ligger i Q1.
    const utanRader = ivoKvartalsunderlag([planenMedTvaUnderlag], [], { ar: 2027, kvartal: 1 })
    expect(utanRader.summa.antal_underlag_lamnat).toBe(0)
  })

  it('Q2 räknas rätt på båda vägarna — därför syntes felet aldrig i det senaste kvartalet', () => {
    expect(ivoKvartalsunderlag([planenMedTvaUnderlag], [], { ar: 2027, kvartal: 2 }, raderna).summa.antal_underlag_lamnat).toBe(1)
    expect(ivoKvartalsunderlag([planenMedTvaUnderlag], [], { ar: 2027, kvartal: 2 }).summa.antal_underlag_lamnat).toBe(1)
  })

  it('ångrade underlag räknas inte, och en plan räknas en gång per kvartal', () => {
    const angrat = [underlag('p1', '2027-02-10T09:00:00Z', '2027-02-10T15:00:00Z')]
    expect(ivoKvartalsunderlag([planenMedTvaUnderlag], [], { ar: 2027, kvartal: 1 }, angrat).summa.antal_underlag_lamnat).toBe(0)

    const tvaSammaKvartal = [underlag('p1', '2027-02-10T09:00:00Z'), underlag('p1', '2027-03-01T09:00:00Z')]
    expect(ivoKvartalsunderlag([planenMedTvaUnderlag], [], { ar: 2027, kvartal: 1 }, tvaSammaKvartal).summa.antal_underlag_lamnat).toBe(1)
  })
})
