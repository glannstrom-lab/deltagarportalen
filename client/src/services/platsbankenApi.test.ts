/**
 * Tester för platsbankenApi (cloudStorage.ts).
 * Verifierar saveJob upsert, isSaved, getSavedJobs auto-migration,
 * och localStorage-fallback vid Supabase-fel.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { platsbankenApi } from './cloudStorage'

// Riktig localStorage-mock (Map-baserad) som överrider den vi.fn()-mock från setup.ts
const storage = new Map<string, string>()

// Supabase-mocking
const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: () => mockGetUser() },
    from: (table: string) => mockFrom(table),
  },
}))

vi.mock('@/lib/logger', () => ({
  storageLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

beforeEach(() => {
  storage.clear()
  mockGetUser.mockReset()
  mockFrom.mockReset()

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => {
        storage.set(k, v)
      },
      removeItem: (k: string) => {
        storage.delete(k)
      },
      clear: () => storage.clear(),
    },
  })
})

const sampleJob = {
  id: 'job-123',
  title: 'Frontend-utvecklare',
  employer: { name: 'Acme AB' },
}

describe('platsbankenApi.saveJob', () => {
  it('sparar lokalt om ingen user är inloggad', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await platsbankenApi.saveJob(sampleJob)
    const stored = JSON.parse(storage.get('platsbanken_saved_jobs') || '[]')
    expect(stored).toEqual([sampleJob])
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('hoppar över duplikat i localStorage-fallen', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    storage.set('platsbanken_saved_jobs', JSON.stringify([sampleJob]))

    await platsbankenApi.saveJob(sampleJob)

    const stored = JSON.parse(storage.get('platsbanken_saved_jobs') || '[]')
    expect(stored.length).toBe(1)
  })

  it('använder Supabase upsert med onConflict när inloggad', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const upsert = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ upsert })

    await platsbankenApi.saveJob(sampleJob)

    expect(mockFrom).toHaveBeenCalledWith('platsbanken_saved_jobs')
    expect(upsert).toHaveBeenCalledWith(
      { user_id: 'user-1', job_id: 'job-123', job_data: sampleJob },
      { onConflict: 'user_id,job_id', ignoreDuplicates: true }
    )
  })

  it('faller tillbaka till localStorage vid Supabase-fel', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const upsert = vi.fn().mockResolvedValue({
      error: { code: '500', message: 'server error' },
    })
    mockFrom.mockReturnValue({ upsert })

    await platsbankenApi.saveJob(sampleJob)

    const stored = JSON.parse(storage.get('platsbanken_saved_jobs') || '[]')
    expect(stored).toEqual([sampleJob])
  })
})

describe('platsbankenApi.isSaved', () => {
  it('läser från localStorage om ingen user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    storage.set('platsbanken_saved_jobs', JSON.stringify([sampleJob]))

    expect(await platsbankenApi.isSaved('job-123')).toBe(true)
    expect(await platsbankenApi.isSaved('job-456')).toBe(false)
  })

  it('frågar Supabase med explicit user_id-filter när inloggad', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const limit = vi.fn().mockResolvedValue({ data: [{ id: 'row-1' }], error: null })
    const eqUser = vi.fn().mockReturnValue({ limit })
    const eqJob = vi.fn().mockReturnValue({ eq: eqUser })
    const select = vi.fn().mockReturnValue({ eq: eqJob })
    mockFrom.mockReturnValue({ select })

    const result = await platsbankenApi.isSaved('job-123')

    expect(mockFrom).toHaveBeenCalledWith('platsbanken_saved_jobs')
    expect(select).toHaveBeenCalledWith('id')
    expect(eqJob).toHaveBeenCalledWith('job_id', 'job-123')
    expect(eqUser).toHaveBeenCalledWith('user_id', 'user-1')
    expect(result).toBe(true)
  })

  it('returnerar false när Supabase ger tom data', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const limit = vi.fn().mockResolvedValue({ data: [], error: null })
    const eqUser = vi.fn().mockReturnValue({ limit })
    const eqJob = vi.fn().mockReturnValue({ eq: eqUser })
    const select = vi.fn().mockReturnValue({ eq: eqJob })
    mockFrom.mockReturnValue({ select })

    expect(await platsbankenApi.isSaved('job-456')).toBe(false)
  })

  it('faller tillbaka till localStorage vid Supabase-fel', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    storage.set('platsbanken_saved_jobs', JSON.stringify([sampleJob]))
    const limit = vi.fn().mockResolvedValue({
      data: null,
      error: { code: '500', message: 'down' },
    })
    const eqUser = vi.fn().mockReturnValue({ limit })
    const eqJob = vi.fn().mockReturnValue({ eq: eqUser })
    const select = vi.fn().mockReturnValue({ eq: eqJob })
    mockFrom.mockReturnValue({ select })

    expect(await platsbankenApi.isSaved('job-123')).toBe(true)
  })
})

describe('platsbankenApi.removeSavedJob', () => {
  it('tar bort lokalt om ingen user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    storage.set('platsbanken_saved_jobs', JSON.stringify([sampleJob]))

    await platsbankenApi.removeSavedJob('job-123')

    expect(JSON.parse(storage.get('platsbanken_saved_jobs') || '[]')).toEqual([])
  })

  it('synkar localStorage vid lyckad molnradering', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    storage.set('platsbanken_saved_jobs', JSON.stringify([sampleJob]))

    const eqUser = vi.fn().mockResolvedValue({ error: null })
    const eqJob = vi.fn().mockReturnValue({ eq: eqUser })
    const del = vi.fn().mockReturnValue({ eq: eqJob })
    mockFrom.mockReturnValue({ delete: del })

    await platsbankenApi.removeSavedJob('job-123')

    expect(eqJob).toHaveBeenCalledWith('job_id', 'job-123')
    expect(eqUser).toHaveBeenCalledWith('user_id', 'user-1')
    // localStorage-fallback ska också vara nollställd så ny inloggning inte ser jobbet
    expect(JSON.parse(storage.get('platsbanken_saved_jobs') || '[]')).toEqual([])
  })

  it('behåller localStorage vid molnradering-fel', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    storage.set('platsbanken_saved_jobs', JSON.stringify([sampleJob]))

    const eqUser = vi.fn().mockResolvedValue({
      error: { code: '500', message: 'down' },
    })
    const eqJob = vi.fn().mockReturnValue({ eq: eqUser })
    const del = vi.fn().mockReturnValue({ eq: eqJob })
    mockFrom.mockReturnValue({ delete: del })

    await platsbankenApi.removeSavedJob('job-123')

    // Vid fel: lokal radering ska göras som fallback (jobbet syns ej för user lokalt heller)
    expect(JSON.parse(storage.get('platsbanken_saved_jobs') || '[]')).toEqual([])
  })
})

describe('platsbankenApi.getSavedJobs (med auto-migration)', () => {
  it('returnerar localStorage om ingen user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    storage.set('platsbanken_saved_jobs', JSON.stringify([sampleJob]))

    const result = await platsbankenApi.getSavedJobs()
    expect(result).toEqual([sampleJob])
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('migrerar localStorage-jobb till cloud vid första anrop', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    storage.set('platsbanken_saved_jobs', JSON.stringify([sampleJob]))

    // Migration-upsert
    const migrationUpsert = vi.fn().mockResolvedValue({ error: null })
    // SELECT-kedja
    const order = vi.fn().mockResolvedValue({ data: [], error: null })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    mockFrom.mockReturnValue({ upsert: migrationUpsert, select })

    await platsbankenApi.getSavedJobs()

    expect(migrationUpsert).toHaveBeenCalledWith(
      [{ user_id: 'user-1', job_id: 'job-123', job_data: sampleJob }],
      { onConflict: 'user_id,job_id', ignoreDuplicates: true }
    )
    expect(storage.get('platsbanken_migrated_to_cloud')).toBe('true')
  })

  it('hoppar över migration om redan markerad klar', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    storage.set('platsbanken_migrated_to_cloud', 'true')
    storage.set('platsbanken_saved_jobs', JSON.stringify([sampleJob]))

    const upsert = vi.fn().mockResolvedValue({ error: null })
    const order = vi.fn().mockResolvedValue({ data: [], error: null })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    mockFrom.mockReturnValue({ upsert, select })

    await platsbankenApi.getSavedJobs()

    expect(upsert).not.toHaveBeenCalled()
  })

  it('returnerar mappad data från Supabase (job_data-extraktion)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    storage.set('platsbanken_migrated_to_cloud', 'true')

    const order = vi.fn().mockResolvedValue({
      data: [{ id: 'row-1', job_data: sampleJob }],
      error: null,
    })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    mockFrom.mockReturnValue({ select })

    const result = await platsbankenApi.getSavedJobs()
    expect(result).toEqual([sampleJob])
  })

  it('faller tillbaka till localStorage vid Supabase-fel', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    storage.set('platsbanken_migrated_to_cloud', 'true')
    storage.set('platsbanken_saved_jobs', JSON.stringify([sampleJob]))

    const order = vi.fn().mockResolvedValue({
      data: null,
      error: { code: '500', message: 'down' },
    })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    mockFrom.mockReturnValue({ select })

    const result = await platsbankenApi.getSavedJobs()
    expect(result).toEqual([sampleJob])
  })
})
