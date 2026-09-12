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
  org_id: null,
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
    expect(await screen.findByText(/Du har 5 av 30 timmar den här veckan\./)).toBeInTheDocument()
    expect(screen.getByText('Språkcafé')).toBeInTheDocument()
    expect(screen.getByText('Verkstad')).toBeInTheDocument()
    expect(screen.getByText(/5 timmar för eget jobbsökande/)).toBeInTheDocument()
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
    expect(await screen.findByText(/Din konsulent har satt 30 timmar i veckan som mål/)).toBeInTheDocument()
    // 3 timmar planerade av 30 → 27 kvar, och det är konsulentens uppgift att planera dem
    expect(screen.getByText(/3 timmar är inplanerade\. 27 timmar återstår att planera/)).toBeInTheDocument()
    expect(screen.getByText(/5 timmarna för eget jobbsökande kommer utöver/)).toBeInTheDocument()
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
})
