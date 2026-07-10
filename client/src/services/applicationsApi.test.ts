/**
 * Tester för applicationsApi — verifierar auth-krav, transformering
 * (status-lowercase, companyName-fallback), filter, kolumnmappning vid
 * create/update samt contacts/reminders. Mockar Supabase.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- supabase-builder-mock kräver any-typad chainable */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  applicationsApi,
  applicationContactsApi,
  applicationRemindersApi,
} from './applicationsApi'

// Mock supabase
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockFromBuilder: any = {}
// Resultat som returneras när kedjan awaitas direkt (utan .single())
let awaitedResult: { data: unknown; error: unknown }

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: () => mockGetUser() },
    from: (...args: any[]) => mockFrom(...args),
  },
}))

beforeEach(() => {
  mockGetUser.mockReset()
  mockFrom.mockReset()
  mockFrom.mockImplementation(() => mockFromBuilder)
  awaitedResult = { data: [], error: null }
  // Återskapa builder så varje test får färska metoder
  mockFromBuilder.select = vi.fn(() => mockFromBuilder)
  mockFromBuilder.insert = vi.fn(() => mockFromBuilder)
  mockFromBuilder.update = vi.fn(() => mockFromBuilder)
  mockFromBuilder.delete = vi.fn(() => mockFromBuilder)
  mockFromBuilder.eq = vi.fn(() => mockFromBuilder)
  mockFromBuilder.in = vi.fn(() => mockFromBuilder)
  mockFromBuilder.is = vi.fn(() => mockFromBuilder)
  mockFromBuilder.not = vi.fn(() => mockFromBuilder)
  mockFromBuilder.lt = vi.fn(() => mockFromBuilder)
  mockFromBuilder.lte = vi.fn(() => mockFromBuilder)
  mockFromBuilder.order = vi.fn(() => mockFromBuilder)
  mockFromBuilder.limit = vi.fn(() => mockFromBuilder)
  mockFromBuilder.single = vi.fn().mockResolvedValue({ data: null, error: null })
  mockFromBuilder.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
  // Kedjor som awaitas direkt (t.ex. getAll slutar på .order) — gör buildern thenable
  mockFromBuilder.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(awaitedResult).then(resolve)
})

const inloggad = () =>
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

describe('applicationsApi.getAll', () => {
  it('kastar om ingen user är inloggad', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await expect(applicationsApi.getAll()).rejects.toThrow('Not authenticated')
  })

  it('returnerar transformerade rader — status lowercase + companyName-fallback', async () => {
    inloggad()
    awaitedResult = {
      data: [
        {
          id: 'app-1',
          user_id: 'user-1',
          job_id: 'job-1',
          status: 'APPLIED',
          company_name: null,
          job_title: null,
          job_data: {
            headline: 'Utvecklare',
            employer: { name: 'Acme AB' },
          },
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-02T00:00:00Z',
        },
      ],
      error: null,
    }
    const result = await applicationsApi.getAll()
    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('applied')
    expect(result[0].companyName).toBe('Acme AB')
    expect(result[0].jobTitle).toBe('Utvecklare')
    expect(mockFrom).toHaveBeenCalledWith('saved_jobs')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('applicerar status-filter som in() med UPPERCASE-värden', async () => {
    inloggad()
    await applicationsApi.getAll({ status: ['applied', 'interview'] })
    expect(mockFromBuilder.in).toHaveBeenCalledWith('status', ['APPLIED', 'INTERVIEW'])
  })

  it('applicerar archived=false som is(archived_at, null)', async () => {
    inloggad()
    await applicationsApi.getAll({ archived: false })
    expect(mockFromBuilder.is).toHaveBeenCalledWith('archived_at', null)
  })

  it('sorterar på created_at desc som default', async () => {
    inloggad()
    await applicationsApi.getAll()
    expect(mockFromBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('kastar vidare supabase-fel', async () => {
    inloggad()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    awaitedResult = { data: null, error: new Error('db-fel') }
    await expect(applicationsApi.getAll()).rejects.toThrow('db-fel')
  })
})

describe('applicationsApi.getById', () => {
  it('kastar om ingen user är inloggad', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await expect(applicationsApi.getById('app-1')).rejects.toThrow('Not authenticated')
  })

  it('returnerar null vid PGRST116 (ingen rad hittad)', async () => {
    inloggad()
    mockFromBuilder.single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'No rows' },
    })
    const result = await applicationsApi.getById('finns-ej')
    expect(result).toBeNull()
  })

  it('returnerar transformerad ansökan vid träff', async () => {
    inloggad()
    mockFromBuilder.single.mockResolvedValue({
      data: {
        id: 'app-1',
        user_id: 'user-1',
        job_id: 'job-1',
        status: 'INTERVIEW',
        company_name: 'Volvo',
        job_title: 'Tekniker',
        job_data: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    })
    const result = await applicationsApi.getById('app-1')
    expect(result).toMatchObject({ id: 'app-1', status: 'interview', companyName: 'Volvo' })
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('id', 'app-1')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('kastar vidare andra supabase-fel', async () => {
    inloggad()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFromBuilder.single.mockResolvedValue({
      data: null,
      error: Object.assign(new Error('rls-fel'), { code: '42501' }),
    })
    await expect(applicationsApi.getById('app-1')).rejects.toThrow('rls-fel')
  })
})

describe('applicationsApi.create', () => {
  const jobData: any = {
    id: 'pb-123',
    headline: 'Snickare',
    employer: { name: 'Bygg AB' },
    workplace_address: { municipality: 'Karlstad' },
    webpage_url: 'https://example.com/jobb',
  }

  it('kastar om ingen user är inloggad', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await expect(applicationsApi.create({ jobData })).rejects.toThrow('Not authenticated')
  })

  it('insertar med UPPERCASE-status och denormaliserade fält från jobData', async () => {
    inloggad()
    mockFromBuilder.single.mockResolvedValue({
      data: {
        id: 'app-ny',
        user_id: 'user-1',
        job_id: 'pb-123',
        status: 'APPLIED',
        company_name: 'Bygg AB',
        job_title: 'Snickare',
        job_data: jobData,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    })
    const result = await applicationsApi.create({ jobData, status: 'applied' })
    expect(mockFrom).toHaveBeenCalledWith('saved_jobs')
    expect(mockFromBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        job_id: 'pb-123',
        status: 'APPLIED',
        company_name: 'Bygg AB',
        job_title: 'Snickare',
        location: 'Karlstad',
        job_url: 'https://example.com/jobb',
      })
    )
    expect(result.status).toBe('applied')
  })

  it('genererar manual-jobId när jobId och jobData.id saknas', async () => {
    inloggad()
    const manuellt: any = { headline: 'Egen ansökan', employer: { name: 'Firma' } }
    mockFromBuilder.single.mockResolvedValue({
      data: {
        id: 'app-m',
        user_id: 'user-1',
        job_id: 'manual-1',
        status: 'SAVED',
        job_data: manuellt,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    })
    await applicationsApi.create({ jobData: manuellt })
    const insertArg = mockFromBuilder.insert.mock.calls[0][0]
    expect(insertArg.job_id).toMatch(/^manual-/)
    expect(insertArg.status).toBe('SAVED')
  })

  it('kastar vidare supabase-fel vid insert', async () => {
    inloggad()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFromBuilder.single.mockResolvedValue({ data: null, error: new Error('insert-fel') })
    await expect(applicationsApi.create({ jobData })).rejects.toThrow('insert-fel')
  })
})

describe('applicationsApi.update', () => {
  it('kastar om ingen user är inloggad', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await expect(applicationsApi.update('app-1', { notes: 'x' })).rejects.toThrow(
      'Not authenticated'
    )
  })

  it('mappar camelCase-input till snake_case-kolumner och UPPERCASE-status', async () => {
    inloggad()
    mockFromBuilder.single.mockResolvedValue({
      data: {
        id: 'app-1',
        user_id: 'user-1',
        job_id: 'job-1',
        status: 'INTERVIEW',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      },
      error: null,
    })
    await applicationsApi.update('app-1', {
      status: 'interview',
      applicationDate: '2026-01-05',
      interviewDate: '2026-01-10',
      cvVersionId: 'cv-1',
      coverLetterId: 'cl-1',
      followUpDate: '2026-01-15',
      companyName: 'Nya Bolaget',
      jobTitle: 'Chef',
      jobUrl: 'https://example.com',
      notes: 'anteckning',
    })
    expect(mockFromBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'INTERVIEW',
        application_date: '2026-01-05',
        interview_date: '2026-01-10',
        cv_version_id: 'cv-1',
        cover_letter_id: 'cl-1',
        follow_up_date: '2026-01-15',
        company_name: 'Nya Bolaget',
        job_title: 'Chef',
        job_url: 'https://example.com',
        notes: 'anteckning',
        updated_at: expect.any(String),
      })
    )
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('id', 'app-1')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('utelämnar fält som inte skickats in', async () => {
    inloggad()
    mockFromBuilder.single.mockResolvedValue({
      data: {
        id: 'app-1',
        user_id: 'user-1',
        job_id: 'job-1',
        status: 'SAVED',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      },
      error: null,
    })
    await applicationsApi.update('app-1', { notes: 'bara notes' })
    const updateArg = mockFromBuilder.update.mock.calls[0][0]
    expect(Object.keys(updateArg).sort()).toEqual(['notes', 'updated_at'])
  })

  it('kastar vidare supabase-fel vid update', async () => {
    inloggad()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFromBuilder.single.mockResolvedValue({ data: null, error: new Error('update-fel') })
    await expect(applicationsApi.update('app-1', { notes: 'x' })).rejects.toThrow('update-fel')
  })
})

describe('applicationContactsApi.create', () => {
  it('insertar i application_contacts och loggar historik', async () => {
    inloggad()
    // Första single() = kontakten, andra = historik-loggen (ignoreras)
    mockFromBuilder.single.mockResolvedValueOnce({
      data: {
        id: 'contact-1',
        application_id: 'app-1',
        user_id: 'user-1',
        name: 'Eva Rekryterare',
        is_primary: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    })
    const result = await applicationContactsApi.create({
      applicationId: 'app-1',
      name: 'Eva Rekryterare',
      email: 'eva@example.com',
      isPrimary: true,
    })
    expect(mockFrom).toHaveBeenCalledWith('application_contacts')
    expect(mockFromBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        application_id: 'app-1',
        user_id: 'user-1',
        name: 'Eva Rekryterare',
        email: 'eva@example.com',
        is_primary: true,
      })
    )
    // Historik loggas i application_history
    expect(mockFrom).toHaveBeenCalledWith('application_history')
    expect(mockFromBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        application_id: 'app-1',
        event_type: 'contact_added',
        note: 'Added contact: Eva Rekryterare',
      })
    )
    expect(result).toMatchObject({ id: 'contact-1', name: 'Eva Rekryterare', isPrimary: true })
  })

  it('kastar om ingen user är inloggad', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await expect(
      applicationContactsApi.create({ applicationId: 'app-1', name: 'X' })
    ).rejects.toThrow('Not authenticated')
  })
})

describe('applicationRemindersApi.create', () => {
  it('insertar i application_reminders och loggar historik', async () => {
    inloggad()
    mockFromBuilder.single.mockResolvedValueOnce({
      data: {
        id: 'rem-1',
        application_id: 'app-1',
        user_id: 'user-1',
        reminder_type: 'follow_up',
        reminder_date: '2026-02-01',
        title: 'Följ upp ansökan',
        is_completed: false,
        created_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    })
    const result = await applicationRemindersApi.create({
      applicationId: 'app-1',
      reminderType: 'follow_up',
      reminderDate: '2026-02-01',
      title: 'Följ upp ansökan',
    })
    expect(mockFrom).toHaveBeenCalledWith('application_reminders')
    expect(mockFromBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        application_id: 'app-1',
        user_id: 'user-1',
        reminder_type: 'follow_up',
        reminder_date: '2026-02-01',
        title: 'Följ upp ansökan',
      })
    )
    expect(mockFrom).toHaveBeenCalledWith('application_history')
    expect(result).toMatchObject({
      id: 'rem-1',
      reminderType: 'follow_up',
      title: 'Följ upp ansökan',
    })
  })

  it('kastar om ingen user är inloggad', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await expect(
      applicationRemindersApi.create({
        applicationId: 'app-1',
        reminderType: 'custom',
        reminderDate: '2026-02-01',
        title: 'X',
      })
    ).rejects.toThrow('Not authenticated')
  })

  it('kastar vidare supabase-fel vid insert', async () => {
    inloggad()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFromBuilder.single.mockResolvedValueOnce({
      data: null,
      error: new Error('reminder-fel'),
    })
    await expect(
      applicationRemindersApi.create({
        applicationId: 'app-1',
        reminderType: 'deadline',
        reminderDate: '2026-02-01',
        title: 'X',
      })
    ).rejects.toThrow('reminder-fel')
  })
})
