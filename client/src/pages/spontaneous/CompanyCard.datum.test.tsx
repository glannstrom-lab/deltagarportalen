/**
 * Uppföljningsdatum i Spontanansökan — lokal dag, inte UTC-dag.
 *
 * "Om 1 vecka" räknade `toISOString()` på dagens datum + 7. Klickar man
 * mellan 00 och 02 svensk tid är UTC-datumet gårdagen, så uppföljningen
 * hamnade en dag för tidigt. Samma fel gav datumfältets `min` gårdagen.
 * Visningen var dessutom hårdkodad till 'sv-SE' även på engelska.
 *
 * Mutation: återställ `addDaysIso` till `toISOString().split('T')[0]` →
 * första testet faller (2026-09-28 i stället för 2026-09-29).
 */
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@/test/utils'
import i18n from '@/i18n/config'
import { CompanyCard } from './CompanyCard'
import type { SpontaneousCompany } from '@/services/supabaseApi'

vi.mock('@/services/applicationsApi', () => ({ applicationsApi: { getAll: vi.fn(), create: vi.fn() } }))

const ursprungligTz = process.env.TZ
beforeAll(() => { process.env.TZ = 'Europe/Stockholm' })
afterAll(() => { process.env.TZ = ursprungligTz })
afterEach(async () => {
  vi.useRealTimers()
  cleanup()
  await i18n.changeLanguage('sv')
})

const foretag = (o: Partial<SpontaneousCompany> = {}): SpontaneousCompany => ({
  id: 'c1',
  user_id: 'u1',
  org_number: '5560000000',
  company_name: 'Testbolaget AB',
  company_data: null,
  status: 'contacted',
  priority: 'normal',
  notes: null,
  followup_date: null,
  outreach_date: null,
  created_at: '2026-09-01T10:00:00Z',
  updated_at: '2026-09-01T10:00:00Z',
  ...o,
} as unknown as SpontaneousCompany)

const props = () => ({
  onUpdateStatus: vi.fn(),
  onDelete: vi.fn(),
  onUpdate: vi.fn(),
})

describe('CompanyCard — datum', () => {
  it('"Om 1 vecka" räknar från den lokala dagen strax efter midnatt', () => {
    // 2026-09-22 00:30 svensk tid = 2026-09-21 22:30 UTC
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-09-21T22:30:00Z') })
    const p = props()
    render(<CompanyCard company={foretag()} {...p} />)
    fireEvent.click(screen.getByRole('button', { name: 'Om 1 vecka' }))
    expect(p.onUpdate).toHaveBeenCalledWith({ followup_date: '2026-09-29' })
  })

  it('visar datum på engelska när gränssnittet är engelskt', async () => {
    await i18n.changeLanguage('en')
    render(<CompanyCard company={foretag({ outreach_date: '2026-09-03' })} {...props()} />)
    // sv-SE ger "2026-09-03"; en-GB ger "03/09/2026"
    expect(screen.getByText(/03\/09\/2026/)).toBeInTheDocument()
  })
})
