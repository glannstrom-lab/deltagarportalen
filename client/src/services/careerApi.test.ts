/**
 * Tester för careerApi — verifierar auth-guards, happy paths och felpropagering
 * för de viktigaste del-API:erna: careerPlanApi, milestonesApi, adaptationsApi,
 * favoriteOccupationsApi, skillsAnalysisApi och careerPathApi. Mockar Supabase
 * och offlineStorage.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- supabase-builder-mock kräver any-typad chainable */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  careerPlanApi,
  milestonesApi,
  adaptationsApi,
  favoriteOccupationsApi,
  skillsAnalysisApi,
  careerPathApi,
  APIError,
} from './careerApi'

// Mock supabase
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockFromBuilder: any = {}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: () => mockGetUser() },
    from: (...args: unknown[]) => {
      mockFrom(...args)
      return mockFromBuilder
    },
  },
}))

// Mock offlineStorage — online som default så anropen går mot supabase-mocken
const mockIsOnline = vi.fn(() => true)
vi.mock('./offlineStorage', () => ({
  offlineStorage: { isOnline: () => mockIsOnline() },
  careerOfflineCache: {
    getCachedNetworkContacts: vi.fn(async () => []),
    cacheNetworkContacts: vi.fn(async () => undefined),
    getCachedCareerPlan: vi.fn(async () => null),
    cacheCareerPlan: vi.fn(async () => undefined),
    cacheMilestones: vi.fn(async () => undefined),
    getCachedSkillsAnalysis: vi.fn(async () => null),
    cacheSkillsAnalysis: vi.fn(async () => undefined),
  },
}))

// Resultat som thenable-kedjor (utan .single/.maybeSingle) resolvar till
let builderResult: { data: unknown; error: unknown }

beforeEach(() => {
  mockGetUser.mockReset()
  mockFrom.mockReset()
  mockIsOnline.mockReset()
  mockIsOnline.mockReturnValue(true)
  builderResult = { data: null, error: null }

  // Återskapa builder så varje test får färska metoder
  mockFromBuilder.select = vi.fn(() => mockFromBuilder)
  mockFromBuilder.insert = vi.fn(() => mockFromBuilder)
  mockFromBuilder.update = vi.fn(() => mockFromBuilder)
  mockFromBuilder.upsert = vi.fn(() => mockFromBuilder)
  mockFromBuilder.delete = vi.fn(() => mockFromBuilder)
  mockFromBuilder.eq = vi.fn(() => mockFromBuilder)
  mockFromBuilder.gte = vi.fn(() => mockFromBuilder)
  mockFromBuilder.order = vi.fn(() => mockFromBuilder)
  mockFromBuilder.limit = vi.fn(() => mockFromBuilder)
  mockFromBuilder.single = vi.fn()
  mockFromBuilder.maybeSingle = vi.fn()
  // Thenable: kedjor som awaitas direkt (utan .single()) resolvar builderResult
  mockFromBuilder.then = (
    resolve: (v: { data: unknown; error: unknown }) => unknown,
    reject?: (e: unknown) => unknown
  ) => Promise.resolve(builderResult).then(resolve, reject)

  // handleError loggar via console.error — håll testutskriften ren
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

function loggedIn(id = 'user-1') {
  mockGetUser.mockResolvedValue({ data: { user: { id } } })
}

function loggedOut() {
  mockGetUser.mockResolvedValue({ data: { user: null } })
}

// ===== careerPlanApi =====

describe('careerPlanApi.getActive', () => {
  it('kastar UNAUTHORIZED om ingen session', async () => {
    loggedOut()
    await expect(careerPlanApi.getActive()).rejects.toThrow('Inte inloggad')
  })

  it('hämtar aktiv plan med milestones för inloggad user', async () => {
    loggedIn()
    const plan = {
      id: 'plan-1',
      user_id: 'user-1',
      goal: 'Bli utvecklare',
      is_active: true,
      milestones: [{ id: 'ms-1', title: 'Lär dig TypeScript' }],
    }
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: plan, error: null })

    const result = await careerPlanApi.getActive()

    expect(mockFrom).toHaveBeenCalledWith('career_plans')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('is_active', true)
    expect(result).toMatchObject({ id: 'plan-1', goal: 'Bli utvecklare' })
  })

  it('propagerar supabase-error som APIError', async () => {
    loggedIn()
    mockFromBuilder.maybeSingle.mockResolvedValue({
      data: null,
      error: { code: 'XX000', message: 'databasen small' },
    })
    await expect(careerPlanApi.getActive()).rejects.toThrow('databasen small')
    await expect(careerPlanApi.getActive()).rejects.toBeInstanceOf(APIError)
  })
})

describe('careerPlanApi.create', () => {
  it('kastar UNAUTHORIZED om ingen session', async () => {
    loggedOut()
    await expect(
      careerPlanApi.create({ current_situation: 'Arbetssökande', goal: 'Nytt jobb' })
    ).rejects.toThrow('Inte inloggad')
  })

  it('avaktiverar befintlig plan och skapar ny med is_active=true', async () => {
    loggedIn()
    const created = { id: 'plan-2', goal: 'Nytt jobb', is_active: true }
    mockFromBuilder.single.mockResolvedValue({ data: created, error: null })

    const result = await careerPlanApi.create({
      current_situation: 'Arbetssökande',
      goal: 'Nytt jobb',
    })

    // Först avaktiveras ev. aktiv plan
    expect(mockFromBuilder.update).toHaveBeenCalledWith({ is_active: false })
    // Sedan skapas den nya med defaults
    expect(mockFromBuilder.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        user_id: 'user-1',
        goal: 'Nytt jobb',
        is_active: true,
        total_progress: 0,
      }),
    ])
    expect(result).toMatchObject({ id: 'plan-2' })
  })

  it('propagerar supabase-error vid insert', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key' },
    })
    await expect(
      careerPlanApi.create({ current_situation: 'A', goal: 'B' })
    ).rejects.toThrow('Denna post finns redan')
  })
})

describe('careerPlanApi.update', () => {
  it('uppdaterar plan och sätter updated_at', async () => {
    loggedIn()
    const updated = { id: 'plan-1', goal: 'Nytt mål' }
    mockFromBuilder.single.mockResolvedValue({ data: updated, error: null })

    const result = await careerPlanApi.update('plan-1', { goal: 'Nytt mål' })

    expect(mockFromBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ goal: 'Nytt mål', updated_at: expect.any(String) })
    )
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('id', 'plan-1')
    expect(result).toMatchObject({ goal: 'Nytt mål' })
  })
})

describe('careerPlanApi.delete', () => {
  it('raderar plan scopat till user', async () => {
    loggedIn()
    await careerPlanApi.delete('plan-1')
    expect(mockFromBuilder.delete).toHaveBeenCalled()
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('id', 'plan-1')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1')
  })
})

// ===== milestonesApi =====

describe('milestonesApi.getByPlanId', () => {
  it('kastar UNAUTHORIZED om ingen session', async () => {
    loggedOut()
    await expect(milestonesApi.getByPlanId('plan-1')).rejects.toThrow('Inte inloggad')
  })

  it('hämtar milestones sorterade på sort_order', async () => {
    loggedIn()
    builderResult = {
      data: [{ id: 'ms-1', title: 'Steg 1' }, { id: 'ms-2', title: 'Steg 2' }],
      error: null,
    }
    const result = await milestonesApi.getByPlanId('plan-1')

    expect(mockFrom).toHaveBeenCalledWith('career_milestones')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('plan_id', 'plan-1')
    expect(mockFromBuilder.order).toHaveBeenCalledWith('sort_order', { ascending: true })
    expect(result).toHaveLength(2)
  })

  it('propagerar supabase-error som APIError', async () => {
    loggedIn()
    builderResult = { data: null, error: { code: 'XX000', message: 'trasigt' } }
    await expect(milestonesApi.getByPlanId('plan-1')).rejects.toThrow('trasigt')
  })
})

describe('milestonesApi.create', () => {
  it('skapar milestone med defaults (steps=[], progress=0)', async () => {
    loggedIn()
    const created = { id: 'ms-1', title: 'Ny milstolpe', progress: 0 }
    mockFromBuilder.single.mockResolvedValue({ data: created, error: null })

    const result = await milestonesApi.create({ plan_id: 'plan-1', title: 'Ny milstolpe' })

    expect(mockFromBuilder.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        user_id: 'user-1',
        plan_id: 'plan-1',
        title: 'Ny milstolpe',
        steps: [],
        progress: 0,
        is_completed: false,
      }),
    ])
    expect(result).toMatchObject({ id: 'ms-1' })
  })
})

describe('milestonesApi.toggleComplete', () => {
  it('togglar från ej klar till klar med progress 100', async () => {
    loggedIn()
    // Första .single() hämtar nuvarande state, andra returnerar uppdaterad rad
    mockFromBuilder.single
      .mockResolvedValueOnce({ data: { is_completed: false }, error: null })
      .mockResolvedValueOnce({
        data: { id: 'ms-1', is_completed: true, progress: 100 },
        error: null,
      })

    const result = await milestonesApi.toggleComplete('ms-1')

    expect(mockFromBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ is_completed: true, progress: 100 })
    )
    expect(result).toMatchObject({ is_completed: true })
  })
})

describe('milestonesApi.updateProgress', () => {
  it('clampar progress till max 100 och markerar som klar', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({
      data: { id: 'ms-1', progress: 100, is_completed: true },
      error: null,
    })

    await milestonesApi.updateProgress('ms-1', 150)

    expect(mockFromBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ progress: 100, is_completed: true })
    )
  })

  it('clampar negativ progress till 0', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({
      data: { id: 'ms-1', progress: 0, is_completed: false },
      error: null,
    })

    await milestonesApi.updateProgress('ms-1', -10)

    expect(mockFromBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ progress: 0, is_completed: false })
    )
  })
})

// ===== adaptationsApi =====

describe('adaptationsApi.get', () => {
  it('kastar UNAUTHORIZED om ingen session', async () => {
    loggedOut()
    await expect(adaptationsApi.get()).rejects.toThrow('Inte inloggad')
  })

  it('hämtar anpassningar för inloggad user', async () => {
    loggedIn()
    const row = { id: 'adapt-1', physical_adaptations: ['Höj- och sänkbart skrivbord'] }
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: row, error: null })

    const result = await adaptationsApi.get()

    expect(mockFrom).toHaveBeenCalledWith('user_adaptations')
    expect(result).toMatchObject({ id: 'adapt-1' })
  })

  it('returnerar null när ingen rad finns', async () => {
    loggedIn()
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: null, error: null })
    const result = await adaptationsApi.get()
    expect(result).toBeNull()
  })
})

describe('adaptationsApi.save', () => {
  const payload = {
    physical_adaptations: ['Ergonomisk stol'],
    cognitive_adaptations: [],
    organizational_adaptations: ['Flexibla tider'],
    social_adaptations: [],
  }

  it('kastar UNAUTHORIZED om ingen session', async () => {
    loggedOut()
    await expect(adaptationsApi.save(payload)).rejects.toThrow('Inte inloggad')
  })

  it('upsertar med onConflict user_id', async () => {
    loggedIn()
    const saved = { id: 'adapt-1', ...payload }
    mockFromBuilder.single.mockResolvedValue({ data: saved, error: null })

    const result = await adaptationsApi.save(payload)

    expect(mockFromBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        physical_adaptations: ['Ergonomisk stol'],
        updated_at: expect.any(String),
      }),
      { onConflict: 'user_id' }
    )
    expect(result).toMatchObject({ id: 'adapt-1' })
  })

  it('propagerar supabase-error som APIError', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({
      data: null,
      error: { code: '23503', message: 'fk violation' },
    })
    await expect(adaptationsApi.save(payload)).rejects.toThrow('Ogiltig referens')
  })
})

// ===== favoriteOccupationsApi =====

describe('favoriteOccupationsApi.getAll', () => {
  it('kastar UNAUTHORIZED om ingen session', async () => {
    loggedOut()
    await expect(favoriteOccupationsApi.getAll()).rejects.toThrow('Inte inloggad')
  })

  it('hämtar favorityrken för inloggad user', async () => {
    loggedIn()
    builderResult = {
      data: [{ id: 'fav-1', occupation_id: 'occ-1', occupation_title: 'Snickare' }],
      error: null,
    }
    const result = await favoriteOccupationsApi.getAll()

    expect(mockFrom).toHaveBeenCalledWith('favorite_occupations')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ occupation_title: 'Snickare' })
  })

  it('propagerar supabase-error som APIError', async () => {
    loggedIn()
    builderResult = { data: null, error: { code: 'PGRST116', message: 'not found' } }
    await expect(favoriteOccupationsApi.getAll()).rejects.toThrow('Resursen hittades inte')
  })
})

describe('favoriteOccupationsApi.add', () => {
  it('lägger till favorit med user_id', async () => {
    loggedIn()
    const added = { id: 'fav-1', occupation_id: 'occ-1', occupation_title: 'Snickare' }
    mockFromBuilder.single.mockResolvedValue({ data: added, error: null })

    const result = await favoriteOccupationsApi.add({
      occupation_id: 'occ-1',
      occupation_title: 'Snickare',
    })

    expect(mockFromBuilder.insert).toHaveBeenCalledWith([
      expect.objectContaining({ user_id: 'user-1', occupation_id: 'occ-1' }),
    ])
    expect(result).toMatchObject({ id: 'fav-1' })
  })
})

describe('favoriteOccupationsApi.isFavorite', () => {
  it('returnerar false (kastar inte) när utloggad', async () => {
    loggedOut()
    await expect(favoriteOccupationsApi.isFavorite('occ-1')).resolves.toBe(false)
  })

  it('returnerar true när rad finns', async () => {
    loggedIn()
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: { id: 'fav-1' }, error: null })
    await expect(favoriteOccupationsApi.isFavorite('occ-1')).resolves.toBe(true)
  })
})

describe('favoriteOccupationsApi.toggle', () => {
  it('tar bort och returnerar false när yrket redan är favorit', async () => {
    loggedIn()
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: { id: 'fav-1' }, error: null })

    const result = await favoriteOccupationsApi.toggle({
      occupation_id: 'occ-1',
      occupation_title: 'Snickare',
    })

    expect(result).toBe(false)
    expect(mockFromBuilder.delete).toHaveBeenCalled()
    expect(mockFromBuilder.insert).not.toHaveBeenCalled()
  })

  it('lägger till och returnerar true när yrket inte är favorit', async () => {
    loggedIn()
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: null, error: null })
    mockFromBuilder.single.mockResolvedValue({
      data: { id: 'fav-1', occupation_id: 'occ-1' },
      error: null,
    })

    const result = await favoriteOccupationsApi.toggle({
      occupation_id: 'occ-1',
      occupation_title: 'Snickare',
    })

    expect(result).toBe(true)
    expect(mockFromBuilder.insert).toHaveBeenCalled()
    expect(mockFromBuilder.delete).not.toHaveBeenCalled()
  })
})

// ===== skillsAnalysisApi =====

describe('skillsAnalysisApi.getLatest', () => {
  it('kastar UNAUTHORIZED om ingen session', async () => {
    loggedOut()
    await expect(skillsAnalysisApi.getLatest()).rejects.toThrow('Inte inloggad')
  })

  it('hämtar senaste analysen (limit 1)', async () => {
    loggedIn()
    const analysis = { id: 'an-1', dream_job: 'Utvecklare', match_percentage: 72 }
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: analysis, error: null })

    const result = await skillsAnalysisApi.getLatest()

    expect(mockFrom).toHaveBeenCalledWith('skills_analyses')
    expect(mockFromBuilder.limit).toHaveBeenCalledWith(1)
    expect(result).toMatchObject({ dream_job: 'Utvecklare' })
  })
})

describe('skillsAnalysisApi.create', () => {
  it('skapar analys med tomma defaults för listfält', async () => {
    loggedIn()
    const created = { id: 'an-1', dream_job: 'Utvecklare', match_percentage: 0 }
    mockFromBuilder.single.mockResolvedValue({ data: created, error: null })

    const result = await skillsAnalysisApi.create({
      dream_job: 'Utvecklare',
      match_percentage: 0,
      skills_comparison: [],
      recommended_courses: [],
      action_plan: [],
    })

    expect(mockFromBuilder.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        user_id: 'user-1',
        dream_job: 'Utvecklare',
        match_percentage: 0,
        skills_comparison: [],
        recommended_courses: [],
        action_plan: [],
      }),
    ])
    expect(result).toMatchObject({ id: 'an-1' })
  })

  it('propagerar supabase-error som APIError', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({
      data: null,
      error: { code: 'XX000', message: 'insert small' },
    })
    await expect(
      skillsAnalysisApi.create({
        dream_job: 'Utvecklare',
        match_percentage: 0,
        skills_comparison: [],
        recommended_courses: [],
        action_plan: [],
      })
    ).rejects.toThrow('insert small')
  })
})

// ===== careerPathApi =====

describe('careerPathApi.getAll', () => {
  it('kastar UNAUTHORIZED om ingen session', async () => {
    loggedOut()
    await expect(careerPathApi.getAll()).rejects.toThrow('Inte inloggad')
  })

  it('hämtar karriärvägar sorterade nyast först', async () => {
    loggedIn()
    builderResult = {
      data: [{ id: 'cp-1', target_occupation: 'Projektledare' }],
      error: null,
    }
    const result = await careerPathApi.getAll()

    expect(mockFrom).toHaveBeenCalledWith('career_paths')
    expect(mockFromBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result).toHaveLength(1)
  })

  it('returnerar tom lista när data är null', async () => {
    loggedIn()
    builderResult = { data: null, error: null }
    const result = await careerPathApi.getAll()
    expect(result).toEqual([])
  })

  it('mappar duplicate-error (23505) till APIError DUPLICATE', async () => {
    loggedIn()
    builderResult = { data: null, error: { code: '23505', message: 'dup' } }
    const promise = careerPathApi.getAll()
    await expect(promise).rejects.toBeInstanceOf(APIError)
    await expect(careerPathApi.getAll()).rejects.toThrow('Denna post finns redan')
  })
})
