/**
 * Tester för unifiedProfileApi — aggregerar profil/cv/intresseresultat.
 * Fokus: KÄLLKODSOBSERVATIONER kring felsväljning (getProfile/syncFromCV/
 * syncToCV fångar ALLA fel tyst och returnerar default/void i stället för
 * att låta anroparen få reda på det), samt kolumn-/statusmappning i
 * updateCore/updateCareer. Mockar Supabase + Toast.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- supabase-builder-mock kräver any-typad chainable */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { unifiedProfileApi } from './unifiedProfileApi'

const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockFromBuilder: any = {}
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: () => mockGetUser() },
    from: (...args: unknown[]) => {
      mockFrom(...args)
      return mockFromBuilder
    },
  },
}))

vi.mock('@/components/Toast', () => ({
  showToast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}))

// Kö-baserad thenable för kedjor som awaitas direkt (upsert/update/select utan
// .single()/.maybeSingle()). Varje await konsumerar nästa post i ordning.
type ThenResult = { data?: unknown; error?: unknown; count?: number | null } | { __reject: unknown }
let thenQueue: ThenResult[] = []
function queueResult(r: ThenResult) {
  thenQueue.push(r)
}

beforeEach(() => {
  mockGetUser.mockReset()
  mockFrom.mockReset()
  mockToastSuccess.mockReset()
  mockToastError.mockReset()
  thenQueue = []

  mockFromBuilder.select = vi.fn(() => mockFromBuilder)
  mockFromBuilder.insert = vi.fn(() => mockFromBuilder)
  mockFromBuilder.update = vi.fn(() => mockFromBuilder)
  mockFromBuilder.upsert = vi.fn(() => mockFromBuilder)
  mockFromBuilder.eq = vi.fn(() => mockFromBuilder)
  mockFromBuilder.order = vi.fn(() => mockFromBuilder)
  mockFromBuilder.limit = vi.fn(() => mockFromBuilder)
  mockFromBuilder.single = vi.fn()
  mockFromBuilder.maybeSingle = vi.fn()
  mockFromBuilder.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => {
    const next = thenQueue.shift() ?? { data: null, error: null }
    if (next && '__reject' in next) {
      return Promise.reject(next.__reject).then(resolve, reject)
    }
    return Promise.resolve(next).then(resolve, reject)
  }

  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

function loggedIn(id = 'user-1', email = 'anna@example.com') {
  mockGetUser.mockResolvedValue({ data: { user: { id, email } } })
}

function loggedOut() {
  mockGetUser.mockResolvedValue({ data: { user: null } })
}

describe('unifiedProfileApi.getProfile', () => {
  it('KÄLLKODSOBSERVATION: sväljer "Inte inloggad"-felet — returnerar tom default-profil i stället för att kasta', async () => {
    loggedOut()
    const result = await unifiedProfileApi.getProfile()
    expect(result).toEqual({
      core: { firstName: '', lastName: '', email: '', phone: '', location: '', summary: '' },
      professional: { skills: [], languages: [], workExperience: [], education: [] },
      career: { preferredRoles: [] },
      usage: { coverLettersCount: 0, applicationsCount: 0 },
    })
  })

  it('aggregerar profil, cv, intresseresultat och unified_profiles-override', async () => {
    loggedIn()
    // Ordning matchar Promise.all i källkoden:
    mockFromBuilder.single.mockResolvedValueOnce({
      data: {
        first_name: 'Bas-Anna',
        last_name: 'Andersson',
        email: 'anna@example.com',
        phone: '070',
        employment_status: 'employed',
        career_goals: { shortTerm: 'kort', preferredRoles: ['Utvecklare'] },
      },
      error: null,
    }) // profiles
    mockFromBuilder.maybeSingle
      .mockResolvedValueOnce({
        data: { summary: 'CV-sammanfattning', skills: ['React'], work_experience: [{ title: 'X' }], education: [] },
        error: null,
      }) // cvs
      .mockResolvedValueOnce({
        data: { riasec_scores: { realistic: 3 }, top_occupations: ['Snickare'] },
        error: null,
      }) // interest_results
      .mockResolvedValueOnce({
        data: { first_name: 'Override-Anna', profile_image_url: 'img.png' },
        error: null,
      }) // unified_profiles
    queueResult({ count: 2, error: null }) // cover_letters count
    queueResult({ count: 5, error: null }) // job_applications count

    const result = await unifiedProfileApi.getProfile()

    expect(result.core?.firstName).toBe('Override-Anna') // unified_profiles vinner över profiles
    expect(result.core?.lastName).toBe('Andersson') // faller tillbaka till profiles när unified saknar
    expect(result.core?.summary).toBe('CV-sammanfattning') // faller tillbaka till cv.summary
    expect(result.professional?.skills).toEqual(['React'])
    expect(result.career?.employmentStatus).toBe('employed')
    expect(result.career?.riasecScores).toEqual({ realistic: 3 })
    expect(result.usage?.coverLettersCount).toBe(2)
    expect(result.usage?.applicationsCount).toBe(5)
  })

  it('KÄLLKODSOBSERVATION: om en delfråga kraschar sväljs HELA felet — returnerar tom default utan signal om vilken query som föll', async () => {
    loggedIn()
    mockFromBuilder.single.mockRejectedValueOnce(new Error('profiles-tabellen otillgänglig'))
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: null, error: null })
    queueResult({ count: 0, error: null })
    queueResult({ count: 0, error: null })

    const result = await unifiedProfileApi.getProfile()
    expect(result.core?.firstName).toBe('') // default, inte ett kastat fel
    expect(console.error).toHaveBeenCalledWith(
      'Fel vid hämtning av unified profile:',
      expect.any(Error)
    )
  })
})

describe('unifiedProfileApi.updateCore', () => {
  it('kastar "Inte inloggad" om ingen user (fångas INTE av try/catch-swallow — rethrows)', async () => {
    loggedOut()
    await expect(unifiedProfileApi.updateCore({ firstName: 'X' })).rejects.toThrow('Inte inloggad')
  })

  it('upsertar unified_profiles med onConflict user_id + visar success-toast', async () => {
    loggedIn()
    queueResult({ data: null, error: null }) // unified_profiles upsert
    queueResult({ data: null, error: null }) // profiles update (backcompat)
    await unifiedProfileApi.updateCore({ firstName: 'Ny', lastName: 'Namn', phone: '070' })
    expect(mockFrom).toHaveBeenNthCalledWith(1, 'unified_profiles')
    expect(mockFromBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        first_name: 'Ny',
        last_name: 'Namn',
        phone: '070',
      }),
      { onConflict: 'user_id' }
    )
    expect(mockToastSuccess).toHaveBeenCalledWith('Profilen sparad')
  })

  it('kastar och visar error-toast om primärskrivningen (unified_profiles) failar', async () => {
    loggedIn()
    queueResult({ data: null, error: new Error('upsert-fel') })
    await expect(unifiedProfileApi.updateCore({ firstName: 'X' })).rejects.toThrow('upsert-fel')
    expect(mockToastError).toHaveBeenCalledWith('Kunde inte spara profilen')
  })

  it('KÄLLKODSOBSERVATION: bakåtkompat-skrivningen till profiles kontrollerar aldrig sitt error-fält — ett fel där syns aldrig', async () => {
    loggedIn()
    queueResult({ data: null, error: null }) // unified_profiles upsert OK
    queueResult({ data: null, error: new Error('profiles-update-fel, aldrig kollad') }) // ignoreras helt
    await expect(unifiedProfileApi.updateCore({ firstName: 'X' })).resolves.toBeUndefined()
    expect(mockToastSuccess).toHaveBeenCalledWith('Profilen sparad')
  })
})

describe('unifiedProfileApi.updateCareer', () => {
  it('mappar giltig employmentStatus rakt av', async () => {
    loggedIn()
    queueResult({ data: null, error: null }) // profiles update
    await unifiedProfileApi.updateCareer({ employmentStatus: 'student' })
    expect(mockFromBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ employment_status: 'student' })
    )
  })

  it('mappar ogiltig employmentStatus till "other" och varnar i konsolen', async () => {
    loggedIn()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    queueResult({ data: null, error: null })
    await unifiedProfileApi.updateCareer({ employmentStatus: 'nagot-ogiltigt' as any })
    expect(mockFromBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ employment_status: 'other' })
    )
  })

  it('tom sträng/null för employmentStatus mappas till null (rensar fältet)', async () => {
    loggedIn()
    queueResult({ data: null, error: null })
    await unifiedProfileApi.updateCareer({ employmentStatus: '' as any })
    expect(mockFromBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ employment_status: null })
    )
  })

  it('mergar career_goals med befintliga värden och lägger till preferredRoles/targetIndustries', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({
      data: { career_goals: { shortTerm: 'gammal kort', longTerm: 'gammal lång' } },
      error: null,
    })
    queueResult({ data: null, error: null }) // profiles update
    queueResult({ data: null, error: null }) // unified_profiles upsert (backcompat)
    await unifiedProfileApi.updateCareer({
      careerGoals: { shortTerm: 'ny kort', longTerm: 'gammal lång' },
      preferredRoles: ['Snickare'],
    })
    const updateArg = mockFromBuilder.update.mock.calls[0][0]
    expect(updateArg.career_goals).toMatchObject({
      shortTerm: 'ny kort',
      longTerm: 'gammal lång',
      preferredRoles: ['Snickare'],
    })
  })

  it('kastar och visar error-toast om profiles-update failar', async () => {
    loggedIn()
    queueResult({ data: null, error: new Error('career-update-fel') })
    await expect(unifiedProfileApi.updateCareer({ employmentStatus: 'employed' })).rejects.toThrow(
      'career-update-fel'
    )
    expect(mockToastError).toHaveBeenCalledWith('Kunde inte spara karriärprofilen')
  })
})

describe('unifiedProfileApi.syncFromCV / syncToCV', () => {
  it('syncFromCV KÄLLKODSOBSERVATION: sväljer fel helt — inget kastas, ingen toast', async () => {
    loggedOut() // getUser-felet fångas tyst
    await expect(unifiedProfileApi.syncFromCV()).resolves.toBeUndefined()
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it('syncFromCV kopierar cv.summary till unified_profiles om cv finns', async () => {
    loggedIn()
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: { summary: 'CV-text' }, error: null })
    queueResult({ data: null, error: null })
    await unifiedProfileApi.syncFromCV()
    expect(mockFromBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', summary: 'CV-text' }),
      { onConflict: 'user_id' }
    )
  })

  it('syncFromCV gör ingenting om inget cv finns', async () => {
    loggedIn()
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: null, error: null })
    await unifiedProfileApi.syncFromCV()
    expect(mockFromBuilder.upsert).not.toHaveBeenCalled()
  })

  it('syncToCV KÄLLKODSOBSERVATION: sväljer fel helt — inget kastas', async () => {
    loggedOut()
    await expect(unifiedProfileApi.syncToCV()).resolves.toBeUndefined()
  })

  it('syncToCV kopierar unified_profiles.summary tillbaka till cvs', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({ data: { summary: 'Ny sammanfattning' }, error: null })
    queueResult({ data: null, error: null })
    await unifiedProfileApi.syncToCV()
    expect(mockFrom).toHaveBeenNthCalledWith(2, 'cvs')
    expect(mockFromBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ summary: 'Ny sammanfattning' })
    )
  })
})

describe('unifiedProfileApi.uploadProfileImage', () => {
  it('kastar och visar error-toast om ingen user är inloggad', async () => {
    loggedOut()
    const file = new File(['x'], 'bild.png', { type: 'image/png' })
    await expect(unifiedProfileApi.uploadProfileImage(file)).rejects.toThrow('Inte inloggad')
    expect(mockToastError).toHaveBeenCalledWith('Kunde inte ladda upp bild')
  })
})

describe('unifiedProfileApi.calculateCompleteness', () => {
  it('returnerar 0 för en helt tom profil', () => {
    expect(unifiedProfileApi.calculateCompleteness({})).toBe(0)
  })

  it('returnerar 100 när alla fält är ifyllda', () => {
    const full = {
      core: {
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.se',
        phone: '070',
        location: 'Karlstad',
        summary: 'Sammanfattning',
      },
      professional: {
        skills: ['React'],
        languages: [],
        workExperience: [{ title: 'X', company: 'Y' }],
        education: [{ degree: 'X', school: 'Y' }],
      },
      career: {
        riasecScores: {
          realistic: 1, investigative: 1, artistic: 1, social: 1, enterprising: 1, conventional: 1,
        },
        careerGoals: { shortTerm: 'kort', longTerm: 'lång' },
        preferredRoles: ['Snickare'],
        targetIndustries: [],
      },
      usage: { coverLettersCount: 0, applicationsCount: 0 },
    }
    expect(unifiedProfileApi.calculateCompleteness(full)).toBe(100)
  })

  it('räknar delvis ifylld profil proportionerligt', () => {
    const partial = {
      core: { firstName: 'A', lastName: '', email: '', phone: '', location: '', summary: '' },
    }
    // Bara firstName (8p) av core (max 40), inget professional/career
    expect(unifiedProfileApi.calculateCompleteness(partial)).toBe(8)
  })
})
