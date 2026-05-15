/**
 * Tester för userApi — verifierar profile-CRUD, preferences,
 * onboarding-progress + desired_jobs-normalisering. Mockar Supabase.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- supabase-builder-mock kräver any-typad chainable */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { userApi } from './userApi'

// Mock supabase
const mockGetUser = vi.fn()
const mockFromBuilder: any = {}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: () => mockGetUser() },
    from: vi.fn(() => mockFromBuilder),
  },
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: { getState: () => ({ profile: null, setProfile: vi.fn() }) },
}))

beforeEach(() => {
  mockGetUser.mockReset()
  // Återskapa builder så varje test får färska metoder
  mockFromBuilder.select = vi.fn(() => mockFromBuilder)
  mockFromBuilder.update = vi.fn(() => mockFromBuilder)
  mockFromBuilder.insert = vi.fn(() => mockFromBuilder)
  mockFromBuilder.upsert = vi.fn(() => mockFromBuilder)
  mockFromBuilder.eq = vi.fn(() => mockFromBuilder)
  mockFromBuilder.single = vi.fn()
  mockFromBuilder.maybeSingle = vi.fn()
})

describe('userApi.getProfile', () => {
  it('kastar UNAUTHORIZED om ingen session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await expect(userApi.getProfile()).rejects.toThrow('Inte inloggad')
  })

  it('hämtar profil för inloggad user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockFromBuilder.single.mockResolvedValue({
      data: { id: 'user-123', email: 'test@example.com', first_name: 'Anna' },
      error: null,
    })
    const result = await userApi.getProfile()
    expect(result).toMatchObject({ id: 'user-123', first_name: 'Anna' })
  })
})

describe('userApi.updateProfile', () => {
  it('kastar UNAUTHORIZED om ingen session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await expect(userApi.updateProfile({ first_name: 'X' })).rejects.toThrow(
      'Inte inloggad'
    )
  })

  it('uppdaterar profil och returnerar resultat', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFromBuilder.single.mockResolvedValue({
      data: { id: 'user-1', first_name: 'Anna' },
      error: null,
    })
    const result = await userApi.updateProfile({ first_name: 'Anna' })
    expect(mockFromBuilder.update).toHaveBeenCalledWith({ first_name: 'Anna' })
    expect(result).toMatchObject({ id: 'user-1', first_name: 'Anna' })
  })
})

describe('userApi.getPreferences', () => {
  it('returnerar default-preferences när profile saknar data', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFromBuilder.single.mockResolvedValue({
      data: { desired_jobs: null },
      error: null,
    })
    const prefs = await userApi.getPreferences()
    expect(prefs).toBeDefined()
    expect(Array.isArray(prefs.desired_jobs)).toBe(true)
    expect(prefs.desired_jobs).toHaveLength(0)
  })

  it('normaliserar legacy string[]-format för desired_jobs', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFromBuilder.single.mockResolvedValue({
      data: { desired_jobs: ['Utvecklare', 'Designer'] },
      error: null,
    })
    const prefs = await userApi.getPreferences()
    expect(prefs.desired_jobs).toHaveLength(2)
    expect(prefs.desired_jobs[0]).toMatchObject({ label: 'Utvecklare', priority: 1 })
    expect(prefs.desired_jobs[1]).toMatchObject({ label: 'Designer', priority: 2 })
  })

  it('bevarar nytt strukturerat format för desired_jobs', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFromBuilder.single.mockResolvedValue({
      data: {
        desired_jobs: [
          { label: 'UX-designer', priority: 2, conceptId: 'abc' },
          { label: 'Frontend', priority: 1, ssyk: '2521' },
        ],
      },
      error: null,
    })
    const prefs = await userApi.getPreferences()
    expect(prefs.desired_jobs).toHaveLength(2)
    // Sorterat på priority → Frontend (1) före UX-designer (2)
    expect(prefs.desired_jobs[0]).toMatchObject({ label: 'Frontend', priority: 1, ssyk: '2521' })
    expect(prefs.desired_jobs[1]).toMatchObject({ label: 'UX-designer', priority: 2, conceptId: 'abc' })
  })

  it('hoppar över items med tom label', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFromBuilder.single.mockResolvedValue({
      data: { desired_jobs: ['  ', { label: '  ' }, { label: 'Giltig' }] },
      error: null,
    })
    const prefs = await userApi.getPreferences()
    expect(prefs.desired_jobs).toHaveLength(1)
    expect(prefs.desired_jobs[0].label).toBe('Giltig')
  })

  it('omindexerar priority till 1..n', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFromBuilder.single.mockResolvedValue({
      data: {
        desired_jobs: [
          { label: 'A', priority: 5 },
          { label: 'B', priority: 10 },
          { label: 'C', priority: 99 },
        ],
      },
      error: null,
    })
    const prefs = await userApi.getPreferences()
    expect(prefs.desired_jobs.map(j => j.priority)).toEqual([1, 2, 3])
  })
})
