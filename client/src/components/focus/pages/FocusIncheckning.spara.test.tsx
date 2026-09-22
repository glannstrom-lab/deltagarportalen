/**
 * Fokuslägets dagboks- och mående-incheckning — sparningen ska vara sann.
 *
 * Två fel, båda upptäckta 2026-09-22:
 *
 * 1. `diaryEntriesApi.create` och `moodLogsApi.upsert` KASTAR INTE vid fel —
 *    de returnerar `null` (services/diaryApi.ts). MV3-fixen i mående-guiden
 *    fångade bara kast, så ett nekat sparande (t.ex. saknat samtycke, MV2)
 *    gav ändå "sparat" och stängde guiden. Dagboksguiden hade inte ens MV3:
 *    den stängde vid fel och texten var borta.
 * 2. `log_date`/`entry_date` räknades i UTC. Strax efter midnatt svensk tid
 *    blev det gårdagens datum — och `mood_logs` upsertas på
 *    `user_id,log_date`, så gårdagens mående skrevs över.
 *
 * 3. Karriärguiden stängde vid fel precis som dagboksguiden, och
 *    profilguiden svalde felet utan ett ord.
 *
 * Mutationer: ta bort `if (!rad) throw` → RÖD (onExit anropas);
 * byt tillbaka till `toISOString().slice(0, 10)` → RÖD (datumtestet).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

const api = vi.hoisted(() => ({ create: vi.fn(), upsert: vi.fn() }))
vi.mock('@/services/diaryApi', () => ({
  diaryEntriesApi: { create: api.create },
  moodLogsApi: { upsert: api.upsert },
}))
const karriar = vi.hoisted(() => ({ create: vi.fn() }))
vi.mock('@/services/careerApi', () => ({ careerPlanApi: { create: karriar.create } }))
const profil = vi.hoisted(() => ({ updateProfile: vi.fn(), toastError: vi.fn() }))
vi.mock('@/services/userApi', () => ({ userApi: { updateProfile: profil.updateProfile } }))
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => ({ profile: null }) }))
vi.mock('@/components/Toast', () => ({ showToast: { error: profil.toastError, success: vi.fn(), info: vi.fn() } }))

import { FocusDiaryWizard } from './FocusDiaryWizard'
import { FocusWellnessWizard } from './FocusWellnessWizard'
import { FocusCareerWizard } from './FocusCareerWizard'
import { FocusProfileWizard } from './FocusProfileWizard'
import { formatLocalDate } from '@/services/aktivitetSchema'

const ursprungligTz = process.env.TZ

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const nasta = () => fireEvent.click(screen.getByRole('button', { name: /Nästa|Klar/ }))

async function fyllDagbok() {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ringde två företag.' } })
  nasta() // → feeling
  nasta() // → tomorrow
  nasta() // → done
  nasta() // spara
}

async function fyllMaende() {
  fireEvent.click(screen.getByRole('button', { name: '3' }))
  nasta() // → reason
  nasta() // → next
  nasta() // → done
  nasta() // spara
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
  process.env.TZ = ursprungligTz
})

describe('FocusDiaryWizard', () => {
  it('ett nekat sparande (null) stänger INTE guiden och säger till', async () => {
    api.create.mockResolvedValue(null)
    const onExit = vi.fn()
    render(<FocusDiaryWizard onExit={onExit} />, { wrapper })
    await fyllDagbok()

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(onExit).not.toHaveBeenCalled()
  })

  it('ett lyckat sparande stänger guiden', async () => {
    api.create.mockResolvedValue({ id: 'd1' })
    const onExit = vi.fn()
    render(<FocusDiaryWizard onExit={onExit} />, { wrapper })
    await fyllDagbok()
    await waitFor(() => expect(onExit).toHaveBeenCalled())
  })
})

describe('FocusWellnessWizard', () => {
  it('ett nekat sparande (null) stänger INTE guiden och säger till', async () => {
    api.upsert.mockResolvedValue(null)
    const onExit = vi.fn()
    render(<FocusWellnessWizard onExit={onExit} />, { wrapper })
    await fyllMaende()

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(onExit).not.toHaveBeenCalled()
    expect(screen.queryByText(/sparat i din dagbok/i)).not.toBeInTheDocument()
  })

  it('log_date är det LOKALA dygnet — 00:30 svensk tid är inte gårdagen', async () => {
    process.env.TZ = 'Europe/Stockholm'
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-22T22:30:00Z')) // 00:30 den 23:e i Stockholm
    api.upsert.mockResolvedValue({ id: 'm1' })
    render(<FocusWellnessWizard onExit={vi.fn()} />, { wrapper })
    await fyllMaende()

    await waitFor(() => expect(api.upsert).toHaveBeenCalled())
    expect(api.upsert.mock.calls[0][0].log_date).toBe('2026-09-23')
  })
})

describe('FocusCareerWizard', () => {
  it('ett misslyckat sparande stänger INTE guiden och säger till', async () => {
    karriar.create.mockRejectedValue(new Error('nätet borta'))
    const onExit = vi.fn()
    render(<FocusCareerWizard onExit={onExit} />, { wrapper })
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Jobba i lager.' } })
    nasta()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ringa en konsulent.' } })
    nasta()
    fireEvent.click(screen.getByRole('button', { name: /Spara plan/ }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(onExit).not.toHaveBeenCalled()
  })
})

describe('FocusProfileWizard', () => {
  it('ett misslyckat sparande säger till — steget står kvar', async () => {
    profil.updateProfile.mockRejectedValue(new Error('nätet borta'))
    render(<FocusProfileWizard onExit={vi.fn()} />, { wrapper })
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Anna' } })
    nasta()
    await waitFor(() => expect(profil.toastError).toHaveBeenCalled())
    expect(screen.getByRole('textbox')).toHaveValue('Anna')
  })
})

describe('formatLocalDate', () => {
  it('ger lokalt dygn, inte UTC', () => {
    process.env.TZ = 'Europe/Stockholm'
    expect(formatLocalDate(new Date('2026-09-22T22:30:00Z'))).toBe('2026-09-23')
    expect(formatLocalDate(new Date('2026-01-15T23:10:00Z'))).toBe('2026-01-16')
  })
})
