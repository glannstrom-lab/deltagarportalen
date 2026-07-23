/**
 * Tester för cvApi — verifierar auth-guards (via handleError/APIError),
 * snake_case↔camelCase-transformering, insert-vs-update-vägvalet i
 * updateCV, samt cv_versions/cv_shares. Mockar Supabase.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- supabase-builder-mock kräver any-typad chainable */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cvApi } from './cvApi'
import { APIError } from './apiError'

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

let thenResult: { data: unknown; error: unknown }

beforeEach(() => {
  mockGetUser.mockReset()
  mockFrom.mockReset()
  thenResult = { data: null, error: null }

  mockFromBuilder.select = vi.fn(() => mockFromBuilder)
  mockFromBuilder.insert = vi.fn(() => mockFromBuilder)
  mockFromBuilder.update = vi.fn(() => mockFromBuilder)
  mockFromBuilder.delete = vi.fn(() => mockFromBuilder)
  mockFromBuilder.eq = vi.fn(() => mockFromBuilder)
  mockFromBuilder.gt = vi.fn(() => mockFromBuilder)
  mockFromBuilder.order = vi.fn(() => mockFromBuilder)
  mockFromBuilder.single = vi.fn()
  mockFromBuilder.maybeSingle = vi.fn()
  mockFromBuilder.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
    Promise.resolve(thenResult).then(resolve, reject)

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

describe('cvApi.getCV', () => {
  it('kastar APIError(UNAUTHORIZED) om ingen user är inloggad', async () => {
    loggedOut()
    await expect(cvApi.getCV()).rejects.toThrow('Inte inloggad')
    await expect(cvApi.getCV()).rejects.toMatchObject({ code: 'UNAUTHORIZED', status: 401 })
  })

  it('returnerar null om ingen rad finns', async () => {
    loggedIn()
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: null, error: null })
    expect(await cvApi.getCV()).toBeNull()
  })

  it('transformerar snake_case till camelCase och exkluderar dubbletter', async () => {
    loggedIn()
    mockFromBuilder.maybeSingle.mockResolvedValue({
      data: {
        id: 'cv-1',
        user_id: 'user-1',
        work_experience: [{ title: 'Utvecklare' }],
        color_scheme: 'blue',
        first_name: 'Anna',
        last_name: 'Andersson',
        profile_image: 'img.png',
        title: 'CV-titel',
      },
      error: null,
    })
    const result = await cvApi.getCV()
    expect(result).toMatchObject({
      id: 'cv-1',
      workExperience: [{ title: 'Utvecklare' }],
      colorScheme: 'blue',
      firstName: 'Anna',
      lastName: 'Andersson',
      profileImage: 'img.png',
      title: 'CV-titel',
    })
    // Snake_case-nycklarna ska inte finnas kvar i resultatet (undviker konflikt vid sparning)
    expect(result).not.toHaveProperty('work_experience')
    expect(result).not.toHaveProperty('color_scheme')
    expect(result).not.toHaveProperty('first_name')
    expect(result).not.toHaveProperty('last_name')
    expect(result).not.toHaveProperty('profile_image')
  })

  it('defaultar workExperience till tom array om saknas', async () => {
    loggedIn()
    mockFromBuilder.maybeSingle.mockResolvedValue({
      data: { id: 'cv-1', user_id: 'user-1', work_experience: null },
      error: null,
    })
    const result = await cvApi.getCV()
    expect(result?.workExperience).toEqual([])
  })

  it('kastar vidare supabase-fel via handleError', async () => {
    loggedIn()
    mockFromBuilder.maybeSingle.mockResolvedValue({
      data: null,
      error: { code: '42501', message: 'rls' },
    })
    await expect(cvApi.getCV()).rejects.toThrow('Åtkomst nekad')
  })
})

describe('cvApi.updateCV', () => {
  it('kastar APIError(UNAUTHORIZED) om ingen user är inloggad', async () => {
    loggedOut()
    await expect(cvApi.updateCV({ title: 'x' })).rejects.toThrow('Inte inloggad')
  })

  it('uppdaterar befintlig rad om en CV redan finns', async () => {
    loggedIn()
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: { id: 'cv-1' }, error: null })
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'cv-1', title: 'Ny titel' }, error: null })
    const result = await cvApi.updateCV({ title: 'Ny titel' })
    expect(mockFromBuilder.update).toHaveBeenCalled()
    expect(mockFromBuilder.insert).not.toHaveBeenCalled()
    expect(result).toMatchObject({ id: 'cv-1', title: 'Ny titel' })
  })

  it('skapar ny rad om ingen CV finns sedan tidigare', async () => {
    loggedIn()
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: null, error: null })
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'cv-ny' }, error: null })
    await cvApi.updateCV({ title: 'Första CV:t' })
    expect(mockFromBuilder.insert).toHaveBeenCalled()
    expect(mockFromBuilder.update).not.toHaveBeenCalled()
  })

  it('mappar camelCase till snake_case och prioriterar camelCase över existerande snake_case', async () => {
    loggedIn()
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: null, error: null })
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'cv-1' }, error: null })
    await cvApi.updateCV({
      firstName: 'Ny',
      first_name: 'Gammal',
      workExperience: [{ title: 'A' }] as any,
      work_experience: [{ title: 'B' }] as any,
      colorScheme: 'green',
    })
    const insertArg = mockFromBuilder.insert.mock.calls[0][0]
    expect(insertArg.first_name).toBe('Ny')
    expect(insertArg.work_experience).toEqual([{ title: 'A' }])
    expect(insertArg.color_scheme).toBe('green')
  })

  it('tar bort undefined-fält innan skrivning', async () => {
    loggedIn()
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: null, error: null })
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'cv-1' }, error: null })
    await cvApi.updateCV({ title: 'Bara titel' })
    const insertArg = mockFromBuilder.insert.mock.calls[0][0]
    expect(insertArg).not.toHaveProperty('email')
    expect(insertArg).not.toHaveProperty('phone')
    expect(insertArg.title).toBe('Bara titel')
    expect(insertArg.user_id).toBe('user-1')
  })

  it('kastar vidare supabase-fel vid insert', async () => {
    loggedIn()
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: null, error: null })
    mockFromBuilder.single.mockResolvedValue({ data: null, error: new Error('insert-fel') })
    await expect(cvApi.updateCV({ title: 'x' })).rejects.toThrow('insert-fel')
  })

  it('kastar vidare supabase-fel vid update', async () => {
    loggedIn()
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: { id: 'cv-1' }, error: null })
    mockFromBuilder.single.mockResolvedValue({ data: null, error: new Error('update-fel') })
    await expect(cvApi.updateCV({ title: 'x' })).rejects.toThrow('update-fel')
  })
})

describe('cvApi.getATSAnalysis', () => {
  it('returnerar null om ingen CV finns', async () => {
    loggedIn()
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: null, error: null })
    expect(await cvApi.getATSAnalysis()).toBeNull()
  })

  it('returnerar score + feedback från CV:t', async () => {
    loggedIn()
    mockFromBuilder.maybeSingle.mockResolvedValue({
      data: { id: 'cv-1', user_id: 'user-1', ats_score: 82, ats_feedback: ['bra struktur'] },
      error: null,
    })
    const result = await cvApi.getATSAnalysis()
    expect(result).toEqual({ score: 82, feedback: ['bra struktur'] })
  })

  it('defaultar score till 0 och feedback till tom array om saknas', async () => {
    loggedIn()
    mockFromBuilder.maybeSingle.mockResolvedValue({
      data: { id: 'cv-1', user_id: 'user-1' },
      error: null,
    })
    const result = await cvApi.getATSAnalysis()
    expect(result).toEqual({ score: 0, feedback: [] })
  })
})

describe('cvApi.getVersions', () => {
  it('kastar APIError om ingen user är inloggad', async () => {
    loggedOut()
    await expect(cvApi.getVersions()).rejects.toThrow('Inte inloggad')
  })

  it('hämtar versioner sorterat nyast först', async () => {
    loggedIn()
    thenResult = { data: [{ id: 'v1' }], error: null }
    const result = await cvApi.getVersions()
    expect(mockFrom).toHaveBeenCalledWith('cv_versions')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(mockFromBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result).toEqual([{ id: 'v1' }])
  })

  it('returnerar tom array om data är null', async () => {
    loggedIn()
    thenResult = { data: null, error: null }
    expect(await cvApi.getVersions()).toEqual([])
  })
})

describe('cvApi.saveVersion', () => {
  it('insertar namn + hela cv-datat i cv_versions', async () => {
    loggedIn()
    const cvData: any = { title: 'Mitt CV' }
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'v1' }, error: null })
    await cvApi.saveVersion('Version 1', cvData)
    expect(mockFrom).toHaveBeenCalledWith('cv_versions')
    expect(mockFromBuilder.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      name: 'Version 1',
      data: cvData,
    })
  })
})

describe('cvApi.restoreVersion', () => {
  it('hämtar data-fältet för given version + user', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({ data: { data: { title: 'Återställd' } }, error: null })
    const result = await cvApi.restoreVersion('v1')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('id', 'v1')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(result).toEqual({ title: 'Återställd' })
  })
})

describe('cvApi.deleteVersion', () => {
  it('kastar APIError om ingen user är inloggad', async () => {
    loggedOut()
    await expect(cvApi.deleteVersion('v1')).rejects.toThrow('Inte inloggad')
  })

  it('raderar version filtrerat på id + user_id och returnerar true', async () => {
    loggedIn()
    thenResult = { data: null, error: null }
    const result = await cvApi.deleteVersion('v1')
    expect(mockFromBuilder.delete).toHaveBeenCalled()
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('id', 'v1')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(result).toBe(true)
  })
})

describe('cvApi.shareCV', () => {
  it('kastar APIError om ingen user är inloggad', async () => {
    loggedOut()
    await expect(cvApi.shareCV()).rejects.toThrow('Inte inloggad')
  })

  it('genererar share-kod, sätter expires_at 30 dagar fram och bygger share-URL', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'share-1' }, error: null })
    const result = await cvApi.shareCV()
    expect(mockFrom).toHaveBeenCalledWith('cv_shares')
    const insertArg = mockFromBuilder.insert.mock.calls[0][0]
    expect(insertArg.user_id).toBe('user-1')
    expect(insertArg.share_code).toEqual(result.shareCode)
    expect(result.shareUrl).toContain(result.shareCode)
    expect(result.qrCode).toContain(encodeURIComponent(result.shareUrl))
    const expiresAt = new Date(result.expiresAt)
    const daysDiff = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    expect(daysDiff).toBeGreaterThan(29)
    expect(daysDiff).toBeLessThan(31)
  })
})

describe('cvApi.getSharedCV', () => {
  it('hämtar cv_shares join:ad med cvs, filtrerat på icke-utgången kod', async () => {
    mockFromBuilder.single.mockResolvedValue({
      data: { share_code: 'abc123', cvs: { title: 'Delat CV' } },
      error: null,
    })
    const result = await cvApi.getSharedCV('abc123')
    expect(mockFrom).toHaveBeenCalledWith('cv_shares')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('share_code', 'abc123')
    expect(mockFromBuilder.gt).toHaveBeenCalledWith('expires_at', expect.any(String))
    expect(result).toMatchObject({ share_code: 'abc123' })
  })

  it('kastar APIError(NOT_FOUND) vid PGRST116 (utgången/ogiltig kod)', async () => {
    mockFromBuilder.single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'No rows' },
    })
    await expect(cvApi.getSharedCV('utgangen')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    })
  })
})

describe('APIError', () => {
  it('exporteras och kan matchas mot instanceof', async () => {
    loggedOut()
    await expect(cvApi.getCV()).rejects.toBeInstanceOf(APIError)
  })
})
