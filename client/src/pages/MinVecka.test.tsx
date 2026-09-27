/**
 * Min vecka — tre tester som kan falla (kontrollerat 2026-09-11):
 *   1. `getMyPlan → null` måste ge tomtillståndets rubrik, inte saldoraden.
 *      Mutation: låt sidan rendera saldot även utan plan → faller.
 *   2. Saldoraden ska räkna passens timmar (veckosaldo), inte planens mål.
 *      Mutation: byt `saldo.planeradeTimmar` mot 0 → faller.
 *   3. "Jag är här" ska anropa checkin med DET passets id, bara för dagens pass.
 *      Mutation: skicka första passets id i stället → faller.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor, userEvent } from '@/test/utils'
import MinVecka from './MinVecka'
import { formatLocalDate, veckansMandag, addDays } from '@/services/aktivitetSchema'

vi.mock('@/components/layout/PageLayout', () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const getMyPlan = vi.fn()
const listMySessions = vi.fn()
const checkin = vi.fn()

const minaJobbsok = vi.fn()
vi.mock('@/services/jobbsokAktivitet', async () => {
  const riktig = await vi.importActual<typeof import('@/services/jobbsokAktivitet')>('@/services/jobbsokAktivitet')
  return { ...riktig, jobbsokAktivitetApi: { minaJobbsok: (...a: unknown[]) => minaJobbsok(...a) } }
})

// F1: frånvaroanmälan mockas bort — komponenten testas i FranvaroAnmalan.test.tsx
vi.mock('@/services/franvaroApi', async () => {
  const riktig = await vi.importActual<typeof import('@/services/franvaroApi')>('@/services/franvaroApi')
  return { ...riktig, franvaroApi: { anmal: vi.fn(), angra: vi.fn() } }
})

// F5/F8: intyget och frågan testas i egna filer; här räcker att de finns på sidan
const downloadNarvaroIntygPDF = vi.fn()
vi.mock('@/services/narvaroIntygPdf', async () => {
  const riktig = await vi.importActual<typeof import('@/services/narvaroIntygPdf')>('@/services/narvaroIntygPdf')
  return { ...riktig, downloadNarvaroIntygPDF: (...a: unknown[]) => downloadNarvaroIntygPDF(...a) }
})
vi.mock('@/services/konsulentMeddelandeApi', () => ({
  konsulentMeddelandeApi: { skickaTillMinKonsulent: vi.fn(), minKonsulent: vi.fn().mockResolvedValue({ id: 'k1', namn: 'Kim' }) },
}))
vi.mock('@/lib/supabase', () => ({
  supabase: { from: () => ({ select: () => ({ limit: async () => ({ data: [{ org_name: 'Testkommun' }], error: null }) }) }) },
}))

// RD3: planens regelverk ur vyn my_ai_policy. Standard = kommunens plan (org1).
let policyRader: Array<Record<string, unknown>> = []
vi.mock('@/services/laslogg', () => ({ laslogg: { minAiPolicy: async () => policyRader } }))

// NF1: byggIcs körs på riktigt, bara själva nedladdningen fångas
const laddaNerIcs = vi.fn()
vi.mock('@/lib/ics', async () => {
  const riktig = await vi.importActual<typeof import('@/lib/ics')>('@/lib/ics')
  return { ...riktig, laddaNerIcs: (...a: unknown[]) => laddaNerIcs(...a) }
})

// RD4: konsulentens möten i veckan. Standard: inga.
const hamtaMoten = vi.fn()
vi.mock('@/components/minvecka/konsulentMoten', async () => {
  const riktig = await vi.importActual<typeof import('@/components/minvecka/konsulentMoten')>('@/components/minvecka/konsulentMoten')
  return { ...riktig, hamtaMoten: (...a: unknown[]) => hamtaMoten(...a) }
})

vi.mock('@/services/aktivitetApi', () => ({
  minVeckaApi: {
    getMyPlan: (...a: unknown[]) => getMyPlan(...a),
    listMySessions: (...a: unknown[]) => listMySessions(...a),
    checkin: (...a: unknown[]) => checkin(...a),
  },
}))

const idag = formatLocalDate(new Date())
const mandag = veckansMandag(idag)

const plan = {
  id: 'plan-1',
  participant_id: 'u1',
  consultant_id: 'k1',
  org_id: 'org1',
  template_id: null,
  template_name: 'Jobbsökarverkstad',
  start_date: mandag,
  end_date: null,
  weekly_hours_target: 30,
  jobsearch_hours_per_week: 5,
  target_reason: null,
  status: 'active',
  plan_text: null,
  decided_at: null,
  created_at: '',
  updated_at: '',
}

const pass = (o: Record<string, unknown>) => ({
  id: 's-x',
  plan_id: 'plan-1',
  participant_id: 'u1',
  date: idag,
  start_time: '09:00',
  end_time: '12:00',
  title: 'Verkstad',
  activity_type: 'jobsearch',
  location: 'Hjernet',
  notes: null,
  attendance: null,
  attendance_note: null,
  sick_certificate_received: false,
  marked_by: null,
  marked_at: null,
  self_checkin_at: null,
  created_at: '',
  updated_at: '',
  ...o,
})

const tomtJobbsok = { vecka: mandag, sparadeJobb: 0, ansokningar: 0, cvUppdaterad: false, intervjutraningar: 0, brev: 0 }

beforeEach(() => {
  getMyPlan.mockReset()
  listMySessions.mockReset()
  checkin.mockReset()
  minaJobbsok.mockReset()
  minaJobbsok.mockResolvedValue(tomtJobbsok)
  laddaNerIcs.mockReset()
  hamtaMoten.mockReset()
  hamtaMoten.mockResolvedValue([])
  policyRader = [{ org_id: 'org1', org_name: 'Testkommun', ai_enabled: true, org_kind: 'kommun' }]
})
afterEach(cleanup)

describe('Min vecka', () => {
  it('visar tomtillståndet när ingen plan finns', async () => {
    getMyPlan.mockResolvedValue(null)
    render(<MinVecka />)
    expect(await screen.findByText('Ingen vecka planerad än')).toBeInTheDocument()
    expect(screen.queryByText(/timmar den här veckan/)).not.toBeInTheDocument()
    expect(listMySessions).not.toHaveBeenCalled()
  })

  it('räknar veckans planerade timmar ur passen och listar dem', async () => {
    getMyPlan.mockResolvedValue(plan)
    // Ett pass en annan dag i veckan så att båda ligger inom mån–sön oavsett
    // vilken veckodag testet körs: dagens + måndagen (kan vara samma dag).
    const annanDag = idag === mandag ? addDays(mandag, 1) : mandag
    listMySessions.mockResolvedValue([
      pass({ id: 's-1', date: annanDag, title: 'Språkcafé', activity_type: 'language', start_time: '13:00', end_time: '15:00' }),
      pass({ id: 's-2', title: 'Verkstad' }),
    ])
    render(<MinVecka />)
    expect(await screen.findByText(/Du har 5 av 25 timmar i anvisade pass den här veckan\./)).toBeInTheDocument()
    expect(screen.getByText('Språkcafé')).toBeInTheDocument()
    expect(screen.getByText('Verkstad')).toBeInTheDocument()
    expect(screen.getByText(/Eget jobbsökande räknas för sig: 5 timmar i veckan enligt planen/)).toBeInTheDocument()
  })

  it('visar veckans jobbsökande som deltagarens egen redovisning', async () => {
    getMyPlan.mockResolvedValue(plan)
    listMySessions.mockResolvedValue([pass({ id: 's-2', title: 'Verkstad' })])
    minaJobbsok.mockResolvedValue({ vecka: mandag, sparadeJobb: 3, ansokningar: 1, cvUppdaterad: true, intervjutraningar: 0, brev: 0 })
    render(<MinVecka />)
    expect(await screen.findByText('3 jobb sparade · 1 ansökan skickad · CV uppdaterat')).toBeInTheDocument()
    expect(minaJobbsok).toHaveBeenCalledWith(mandag)
    expect(screen.queryByText(/Inget registrerat än/)).not.toBeInTheDocument()
  })

  it('en tom vecka är en invit, inte en nolla', async () => {
    getMyPlan.mockResolvedValue(plan)
    listMySessions.mockResolvedValue([pass({ id: 's-2', title: 'Verkstad' })])
    render(<MinVecka />)
    expect(await screen.findByText(/Inget registrerat än den här veckan/)).toBeInTheDocument()
    expect(screen.queryByText(/0 jobb/)).not.toBeInTheDocument()
  })

  it('PG7: saldoraden förklarar målet och vad som återstår, med länk till guiden', async () => {
    getMyPlan.mockResolvedValue(plan)
    listMySessions.mockResolvedValue([pass({ id: 's-2', title: 'Verkstad' })])
    render(<MinVecka />)
    // RK1/RD12: målet är den anvisade delen, 30 − 5 = 25 — samma tal som konsulentens ampel
    expect(await screen.findByText(/Din konsulent har satt 25 timmar i veckan som mål/)).toBeInTheDocument()
    // 3 timmar planerade av 25 → 22 kvar, och det är konsulentens uppgift att planera dem
    expect(screen.getByText(/^22 timmar återstår att planera/)).toBeInTheDocument()
    const guide = screen.getByRole('link', { name: /Läs om aktivitetskravet/ })
    expect(guide).toHaveAttribute('href', '/guider/aktivitetskrav-forsorjningsstod/')
  })

  it('F1: ett kommande pass visar "Jag kan inte komma", dagens pass med incheckning gör det inte', async () => {
    getMyPlan.mockResolvedValue(plan)
    const omTvaDagar = addDays(idag, 2)
    listMySessions.mockResolvedValue([
      pass({ id: 's-framtid', date: omTvaDagar, title: 'Framtidspass' }),
      pass({ id: 's-checkad', title: 'Dagens', self_checkin_at: new Date().toISOString() }),
    ])
    render(<MinVecka />)
    await screen.findByText('Framtidspass')
    // Passet om två dagar ligger i veckan om det inte är fredag/helg — då finns ingen knapp att hitta,
    // och testet ska ändå inte tro att något är fel. Räkna därför bara när passet syns.
    if (screen.queryByText('Framtidspass')) {
      const sondag = addDays(mandag, 6)
      if (omTvaDagar <= sondag) expect(screen.getAllByRole('button', { name: 'Jag kan inte komma' })).toHaveLength(1)
    }
    // Det incheckade passet får ingen knapp
    const kort = screen.getByText('Dagens').closest('div')!
    expect(kort.querySelector('button')?.textContent ?? '').not.toContain('Jag kan inte komma')
  })

  it('"Jag är här" checkar in dagens pass med rätt id, och bara dagens', async () => {
    getMyPlan.mockResolvedValue(plan)
    const imorgon = addDays(idag, 1)
    listMySessions.mockResolvedValue([
      pass({ id: 's-tomorrow', date: imorgon, title: 'Imorgonpass' }),
      pass({ id: 's-today', title: 'Dagens pass' }),
    ])
    checkin.mockResolvedValue(pass({ id: 's-today', self_checkin_at: new Date().toISOString() }))
    render(<MinVecka />)
    const knappar = await screen.findAllByRole('button', { name: 'Jag är här' })
    // Imorgonpasset ligger utanför veckan om i dag är söndag; annars ska det
    // ändå INTE ha någon knapp.
    expect(knappar).toHaveLength(1)
    await userEvent.click(knappar[0])
    await waitFor(() => expect(checkin).toHaveBeenCalledWith('s-today'))
    expect(checkin).not.toHaveBeenCalledWith('s-tomorrow')
  })

  it('Skav 15 (persona 2026-09-12): en tom INNEVARANDE vecka säger "ledig", inte "ingen plan" och inte "än"', async () => {
    // Mutation: byt villkoret `mandag > veckansMandag(dagens)` mot `true`
    // (eller ta bort grenen helt) → RÖD, "framtid"-texten visas i stället.
    getMyPlan.mockResolvedValue(plan)
    listMySessions.mockResolvedValue([])
    render(<MinVecka />)
    expect(await screen.findByText(/En ledig vecka enligt planen/)).toBeInTheDocument()
    expect(screen.queryByText(/Inga pass inplanerade än/)).not.toBeInTheDocument()
  })

  it('Skav 15: en tom FRAMTIDA vecka säger att inget är inplanerat ÄN, inte "ledig"', async () => {
    // Mutation: byt villkoret mot `false` → RÖD, "ledig"-texten visas i stället
    // för veckan konsulenten helt enkelt inte hunnit lägga upp.
    getMyPlan.mockResolvedValue(plan)
    listMySessions.mockResolvedValue([])
    render(<MinVecka />)
    await screen.findByText(/En ledig vecka enligt planen/)
    await userEvent.click(screen.getByRole('button', { name: 'Nästa vecka' }))
    expect(await screen.findByText(/Inga pass inplanerade än den här veckan/)).toBeInTheDocument()
    expect(screen.queryByText(/En ledig vecka enligt planen/)).not.toBeInTheDocument()
  })

  it('F5/F8: närvarointyget kan laddas ner för en vald månad, och varje anvisat pass har "Fråga om passet"', async () => {
    getMyPlan.mockResolvedValue(plan)
    listMySessions.mockResolvedValue([
      pass({ id: 's-a', title: 'Verkstad' }),
      pass({ id: 's-egen', title: 'Eget sök', activity_type: 'jobsearch_own' }),
    ])
    downloadNarvaroIntygPDF.mockResolvedValue(undefined)
    render(<MinVecka />)
    expect(await screen.findByRole('heading', { name: 'Närvarointyg' })).toBeInTheDocument()
    // Månadsvalet börjar på innevarande månad
    const val = screen.getByRole('combobox', { name: 'Månad' }) as HTMLSelectElement
    expect(val.value).toBe(idag.slice(0, 7))
    await userEvent.click(screen.getByRole('button', { name: 'Ladda ner närvarointyg' }))
    await waitFor(() => expect(downloadNarvaroIntygPDF).toHaveBeenCalledTimes(1))
    const input = downloadNarvaroIntygPDF.mock.calls[0][0] as { manad: string; organizationName: string | null }
    expect(input.manad).toBe(idag.slice(0, 7))
    expect(input.organizationName).toBe('Testkommun')
    // Sidan har redan en sr-only statusrad — leta på texten, inte rollen
    expect(await screen.findByText(/nedladdat/i)).toBeInTheDocument()
    // Eget jobbsökande får ingen fråga-knapp; det anvisade passet får en
    expect(screen.getAllByRole('button', { name: 'Fråga om passet' })).toHaveLength(1)
  })
  /*
   * NF1 (2026-09-24): "Lägg till i kalendern" per pass.
   * Mutation: skicka första passets data i stället för det klickade → RÖD
   * (fel UID/titel). Mutation: visa knappen även för passerade pass → RÖD.
   */
  it('NF1: "Lägg till i kalendern" laddar ner en .ics för DET passet, och bara för pass som inte har varit', async () => {
    getMyPlan.mockResolvedValue(plan)
    // Ett passerat pass finns bara i veckan om i dag inte är måndag
    const igar = idag === mandag ? null : addDays(idag, -1)
    listMySessions.mockResolvedValue([
      ...(igar ? [pass({ id: 's-igar', date: igar, title: 'Gårdagens pass' })] : []),
      pass({ id: 's-idag', title: 'Språkcafé, nivå 2', location: 'Storgatan 1; plan 3', start_time: '09:00', end_time: '11:30' }),
    ])
    render(<MinVecka />)
    await screen.findByText('Språkcafé, nivå 2')
    const knappar = screen.getAllByRole('button', { name: /i kalendern/ })
    expect(knappar).toHaveLength(1)
    expect(knappar[0]).toHaveAccessibleName('Lägg till Språkcafé, nivå 2 i kalendern')
    await userEvent.click(knappar[0])
    expect(laddaNerIcs).toHaveBeenCalledTimes(1)
    const [ics, filnamn] = laddaNerIcs.mock.calls[0] as [string, string]
    const utvikt = ics.replace(/\r\n /g, '')
    expect(utvikt).toContain('UID:s-idag@jobin.se\r\n')
    expect(utvikt).toContain('SUMMARY:Språkcafé\\, nivå 2\r\n')
    expect(utvikt).toContain('LOCATION:Storgatan 1\\; plan 3\r\n')
    expect(utvikt).toMatch(/DTSTART:\d{8}T0[78]0000Z\r\n/)
    expect(filnamn).toBe(`Språkcafé, nivå 2 ${idag}.ics`)
    expect(await screen.findByText(/Kalenderfilen är nedladdad/)).toBeInTheDocument()
  })

  /*
   * RD3 (rollspelet 2026-09-27): Sara (Rusta och matcha) fick "kommunens krav
   * enligt socialtjänstlagen" och "handläggare på försörjningsstöd".
   * Motprov: använd alltid nyckeln `mal` (kommunens) → leverantörs- och
   * neutraltestet faller.
   */
  it('RD3: en plan från en Rusta och matcha-leverantör nämner Arbetsförmedlingen, inte kommunen', async () => {
    policyRader = [{ org_id: 'org1', org_name: 'Demoleverantör', ai_enabled: true, org_kind: 'leverantor' }]
    getMyPlan.mockResolvedValue(plan)
    listMySessions.mockResolvedValue([pass({ id: 's-2', title: 'Verkstad' })])
    render(<MinVecka />)
    expect(await screen.findByText(/Arbetsförmedlingens tjänst Rusta och matcha/)).toBeInTheDocument()
    expect(screen.getByText(/handläggare på Arbetsförmedlingen/)).toBeInTheDocument()
    expect(screen.queryByText(/kommun|socialtjänstlagen|försörjningsstöd/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Rusta och matcha/ })).toHaveAttribute('href', '/guider/rusta-och-matcha/')
    expect(screen.queryByRole('link', { name: /aktivitetskravet/ })).not.toBeInTheDocument()
  })

  it('RD3: utan belägg för organisationens typ (vyn saknar kolumnen) blir texten neutral — aldrig kommunens juridik', async () => {
    policyRader = [{ org_id: 'org1', org_name: 'Någon', ai_enabled: true }]
    getMyPlan.mockResolvedValue(plan)
    listMySessions.mockResolvedValue([pass({ id: 's-2', title: 'Verkstad' })])
    render(<MinVecka />)
    expect(await screen.findByText(/Din konsulent har satt 25 timmar i veckan som mål för aktiviteterna i din plan\./)).toBeInTheDocument()
    expect(screen.queryByText(/kommun|socialtjänstlagen|försörjningsstöd|Arbetsförmedlingen/)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /aktivitetskravet|Rusta och matcha/ })).not.toBeInTheDocument()
  })

  it('RD3: intyget får planens regelverk med sig till PDF:en', async () => {
    policyRader = [{ org_id: 'org1', org_name: 'Demoleverantör', ai_enabled: true, org_kind: 'leverantor' }]
    getMyPlan.mockResolvedValue(plan)
    listMySessions.mockResolvedValue([])
    downloadNarvaroIntygPDF.mockResolvedValue(undefined)
    render(<MinVecka />)
    await screen.findByText(/handläggare på Arbetsförmedlingen/)
    await userEvent.click(screen.getByRole('button', { name: 'Ladda ner närvarointyg' }))
    await waitFor(() => expect(downloadNarvaroIntygPDF).toHaveBeenCalled())
    expect(downloadNarvaroIntygPDF.mock.calls.at(-1)?.[0]).toMatchObject({ regelverk: 'leverantor' })
  })

  /*
   * RD12 (rollspelet 2026-09-27): "Du har 8 av 11 timmar" medan veckan visade
   * 20 timmar pass. Målet 11 inkluderade 3 timmar eget jobbsökande, och
   * konsulentens ampel mäter mot den anvisade delen (anvisatVeckomal = 8).
   * Deltagaren och konsulenten ska se SAMMA tal, och det ska stå vid talet vad
   * som räknas. Mutation: visa plan.weekly_hours_target som mål → faller.
   */
  it('RD12: saldot mäter mot samma anvisade mål som konsulentens ampel, och säger vad som räknas', async () => {
    const annasPlan = { ...plan, weekly_hours_target: 11, jobsearch_hours_per_week: 3, target_reason: 'Heltidsaktivitet enligt aktivitetskravet.' }
    getMyPlan.mockResolvedValue(annasPlan)
    const d = (n: number) => addDays(mandag, n)
    listMySessions.mockResolvedValue([
      pass({ id: 'a', date: d(0), start_time: '09:00', end_time: '12:00', activity_type: 'jobsearch' }),
      pass({ id: 'b', date: d(1), start_time: '09:00', end_time: '11:00', activity_type: 'motivation', title: 'Motivationsgrupp' }),
      pass({ id: 'c', date: d(2), start_time: '09:00', end_time: '12:00', activity_type: 'jobsearch_own', title: 'Eget jobbsökande' }),
      pass({ id: 'e', date: d(3), start_time: '13:00', end_time: '16:00', activity_type: 'workplace', title: 'Praktikbesök' }),
      pass({ id: 'f', date: d(6), start_time: '08:00', end_time: '17:00', activity_type: 'jobsearch_own', title: 'Eget jobbsökande' }),
    ])
    render(<MinVecka />)
    expect(await screen.findByText(/Du har 8 av 8 timmar i anvisade pass den här veckan\./)).toBeInTheDocument()
    expect(screen.getByText(/Här räknas bara pass som din konsulent har planerat\. Eget jobbsökande räknas för sig: 3 timmar i veckan enligt planen\./)).toBeInTheDocument()
    expect(screen.getByText('Den här veckan är fullplanerad.')).toBeInTheDocument()
    expect(screen.queryByText(/av 11 timmar/)).toBeNull()
    expect(screen.queryByText(/återstår att planera/)).toBeNull()
    // "Skäl: …aktivitetskravet.." — ingen dubbelpunkt
    expect(document.body.textContent).not.toContain('..')
  })

  /*
   * Skav (rollspelet 2026-09-27): "Du har 11 av 8 timmar" när veckan har mer än
   * målet. "av" läser som en del av en helhet; över målet säger raden i stället
   * att det är mer än målet. Mutation: ta bort radOver-grenen → faller.
   */
  it('över målet: "11 timmar … mer än målet på 8", aldrig "11 av 8"', async () => {
    getMyPlan.mockResolvedValue({ ...plan, weekly_hours_target: 11, jobsearch_hours_per_week: 3 })
    const d = (n: number) => addDays(mandag, n)
    listMySessions.mockResolvedValue([
      pass({ id: 'a', date: d(0), start_time: '08:00', end_time: '14:00' }),
      pass({ id: 'b', date: d(1), start_time: '08:00', end_time: '13:00', activity_type: 'motivation' }),
    ])
    render(<MinVecka />)
    expect(await screen.findByText('Du har 11 timmar i anvisade pass den här veckan, mer än målet på 8.')).toBeInTheDocument()
    expect(screen.queryByText(/11 av 8/)).toBeNull()
  })

  /*
   * RD4 (rollspelet 2026-09-27): mötet med konsulenten kl 12 syntes bara på
   * Min konsulent, inte i veckan. Mutation: rendera inte mötena → faller.
   */
  it('RD4: veckans möten med konsulenten syns i Min vecka, på rätt dag', async () => {
    getMyPlan.mockResolvedValue(plan)
    const dag = addDays(mandag, 0)
    listMySessions.mockResolvedValue([])
    hamtaMoten.mockResolvedValue([
      { id: 'm1', scheduled_at: new Date(`${dag}T12:00:00`).toISOString(), duration_minutes: 45, meeting_type: 'physical', location: 'Rum 2', meeting_link: null, status: 'scheduled' },
    ])
    render(<MinVecka />)
    expect(await screen.findByText(/Möte med din konsulent/)).toBeInTheDocument()
    expect(screen.getByText(/12:00–12:45/)).toBeInTheDocument()
    expect(screen.getByText('Rum 2')).toBeInTheDocument()
    expect(hamtaMoten).toHaveBeenCalledWith(mandag, addDays(mandag, 6))
    // En vecka med bara ett möte är ingen "ledig vecka"
    expect(screen.queryByText(/En ledig vecka enligt planen/)).toBeNull()
  })

  it('RD4: ett fel vid hämtning av möten sägs, i stället för att tyst se ut som inga möten', async () => {
    getMyPlan.mockResolvedValue(plan)
    listMySessions.mockResolvedValue([pass({ id: 's-2', title: 'Verkstad' })])
    hamtaMoten.mockImplementation(async () => { throw new Error('nät') })
    render(<MinVecka />)
    expect(await screen.findByText(/Dina möten med konsulenten kunde inte hämtas just nu/)).toBeInTheDocument()
  })

  it('RD11: en markerad frånvaro kan förklaras direkt i veckan', async () => {
    getMyPlan.mockResolvedValue(plan)
    const igarEllerIdag = idag === mandag ? idag : addDays(idag, -1)
    listMySessions.mockResolvedValue([
      pass({ id: 's-fr', date: igarEllerIdag, attendance: 'absent_invalid', participant_explanation: null, participant_explanation_at: null }),
    ])
    render(<MinVecka />)
    expect(await screen.findByRole('button', { name: 'Förklara frånvaron' })).toBeInTheDocument()
  })
})

// RD24/RD5/RD6 (rollspelet 2026-09-27): "1 timmar" och "De 1 timmarna" på Lätt
// svenska, "1 hours" på engelska. Pluralformen ska följa talet på alla tre språken.
describe('Min vecka — plural och språk (RD24)', () => {
  const litenPlan = { ...plan, weekly_hours_target: 3, jobsearch_hours_per_week: 1 } // anvisat mål 2
  const ettPass = () => [pass({ id: 's-1', title: 'Praktik', start_time: '08:00', end_time: '09:00' })]

  afterEach(async () => {
    const { sattLattSvenska } = await import('@/i18n/lattSvenska')
    const { default: i18n } = await import('@/i18n/config')
    await sattLattSvenska(false)
    await i18n.changeLanguage('sv')
  })

  it('svenska: "1 timme", inte "1 timmar"', async () => {
    getMyPlan.mockResolvedValue(litenPlan)
    listMySessions.mockResolvedValue(ettPass())
    render(<MinVecka />)
    expect(await screen.findByText(/Eget jobbsökande räknas för sig: 1 timme i veckan/)).toBeInTheDocument()
    expect(screen.getByText(/1 timme återstår att planera/)).toBeInTheDocument()
    expect(screen.queryByText(/\b1 timmar\b/)).toBeNull()
  })

  it('svenska: målet i singular när det är en timme', async () => {
    getMyPlan.mockResolvedValue({ ...plan, weekly_hours_target: 2, jobsearch_hours_per_week: 1 })
    listMySessions.mockResolvedValue(ettPass())
    render(<MinVecka />)
    expect(await screen.findByText(/Du har 1 av 1 timme i anvisade pass/)).toBeInTheDocument()
  })

  it('engelska: "1 hour", inte "1 hours"', async () => {
    const { default: i18n } = await import('@/i18n/config')
    const { default: en } = await import('@/i18n/locales/en.json')
    i18n.addResourceBundle('en', 'translation', en, true, true)
    await i18n.changeLanguage('en')
    getMyPlan.mockResolvedValue(litenPlan)
    listMySessions.mockResolvedValue(ettPass())
    render(<MinVecka />)
    expect(await screen.findByText(/1 hour is still to be planned/)).toBeInTheDocument()
    expect(screen.getByText(/counts separately: 1 hour per week/)).toBeInTheDocument()
    expect(screen.queryByText(/\b1 hours\b/)).toBeNull()
  })

  it('Lätt svenska: "1 timme är kvar"', async () => {
    const { sattLattSvenska } = await import('@/i18n/lattSvenska')
    await sattLattSvenska(true)
    getMyPlan.mockResolvedValue(litenPlan)
    listMySessions.mockResolvedValue(ettPass())
    render(<MinVecka />)
    expect(await screen.findByText(/1 timme är kvar att planera\. Din konsulent planerar den med dig/)).toBeInTheDocument()
    expect(screen.queryByText(/\b1 timmar/)).toBeNull()
  })
})
