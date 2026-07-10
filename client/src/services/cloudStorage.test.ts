/**
 * Tester för cloudStorage — låser nuvarande beteende hos de 5 mest använda
 * del-API:erna (interestGuideApi, savedJobsApi, moodApi, personalBrandApi,
 * calendarApi) inför uppdelning av filen (E3).
 *
 * Verifierar: auth-guards, rätt tabell + kolumner, felfall (sväljs med
 * fallback — propagerar ALDRIG), samt normalisering/transformation av rader.
 * Mockar Supabase enligt mönstret i userApi.test.ts, med thenable builder
 * (jfr useJobsokHubSummary.test.ts) för kedjor som awaitas direkt.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- supabase-builder-mock kräver any-typad chainable */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  interestGuideApi,
  savedJobsApi,
  moodApi,
  personalBrandApi,
  calendarApi,
} from './cloudStorage'

// Mock supabase
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockFromBuilder: any = {}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: () => mockGetUser() },
    from: (table: string) => mockFrom(table),
  },
}))

vi.mock('@/lib/logger', () => ({
  storageLogger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// Resultat som builder-kedjan resolvar till — sätts per test via setResult()
let builderResult: any

function setResult(result: any) {
  builderResult = result
}

function loggedIn(id = 'user-1') {
  mockGetUser.mockResolvedValue({ data: { user: { id } } })
}

function loggedOut() {
  mockGetUser.mockResolvedValue({ data: { user: null } })
}

beforeEach(() => {
  mockGetUser.mockReset()
  mockFrom.mockReset()
  mockFrom.mockImplementation(() => mockFromBuilder)
  builderResult = { data: null, error: null }

  // Återskapa builder så varje test får färska metoder
  for (const method of [
    'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'gte', 'lte', 'order', 'limit',
  ]) {
    mockFromBuilder[method] = vi.fn(() => mockFromBuilder)
  }
  mockFromBuilder.single = vi.fn(() => Promise.resolve(builderResult))
  mockFromBuilder.maybeSingle = vi.fn(() => Promise.resolve(builderResult))
  // Thenable: kedjor som awaitas direkt (t.ex. .upsert(...), .delete().eq(...))
  mockFromBuilder.then = (resolve: any, reject: any) =>
    Promise.resolve(builderResult).then(resolve, reject)

  vi.mocked(window.localStorage.getItem).mockReturnValue(null)
})

// ============================================
// INTRESSEGUIDE
// ============================================
describe('interestGuideApi.getProgress', () => {
  it('returnerar null utan inloggad användare — utan att röra databasen', async () => {
    loggedOut()
    const result = await interestGuideApi.getProgress()
    expect(result).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('hämtar progress från interest_guide_progress filtrerat på user_id', async () => {
    loggedIn('user-42')
    setResult({ data: { current_step: 3, is_completed: false }, error: null })
    const result = await interestGuideApi.getProgress()
    expect(mockFrom).toHaveBeenCalledWith('interest_guide_progress')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('user_id', 'user-42')
    expect(mockFromBuilder.maybeSingle).toHaveBeenCalled()
    expect(result).toMatchObject({ current_step: 3 })
  })

  it('returnerar null när rad saknas', async () => {
    loggedIn()
    setResult({ data: null, error: null })
    const result = await interestGuideApi.getProgress()
    expect(result).toBeNull()
  })
})

describe('interestGuideApi.saveProgress', () => {
  it('upsertar med user_id, progress-fält och onConflict user_id', async () => {
    loggedIn('user-42')
    setResult({ error: null })
    await interestGuideApi.saveProgress({ current_step: 2, is_completed: false })
    expect(mockFrom).toHaveBeenCalledWith('interest_guide_progress')
    expect(mockFromBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-42',
        current_step: 2,
        is_completed: false,
        updated_at: expect.any(String),
      }),
      { onConflict: 'user_id' }
    )
  })

  it('gör inget utan inloggad användare', async () => {
    loggedOut()
    await interestGuideApi.saveProgress({ current_step: 1 })
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('kastar inte vid databasfel — felet sväljs', async () => {
    loggedIn()
    setResult({ error: { code: '42501', message: 'RLS' } })
    await expect(interestGuideApi.saveProgress({ current_step: 1 })).resolves.toBeUndefined()
  })
})

describe('interestGuideApi historik', () => {
  it('getHistory returnerar [] utan användare', async () => {
    loggedOut()
    await expect(interestGuideApi.getHistory()).resolves.toEqual([])
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('getHistory hämtar interest_guide_history sorterat på completed_at med limit', async () => {
    loggedIn('user-42')
    const rows = [{ id: 'h1' }, { id: 'h2' }]
    setResult({ data: rows, error: null })
    const result = await interestGuideApi.getHistory(5)
    expect(mockFrom).toHaveBeenCalledWith('interest_guide_history')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('user_id', 'user-42')
    expect(mockFromBuilder.order).toHaveBeenCalledWith('completed_at', { ascending: false })
    expect(mockFromBuilder.limit).toHaveBeenCalledWith(5)
    expect(result).toEqual(rows)
  })

  it('getHistory returnerar [] vid databasfel — propagerar inte', async () => {
    loggedIn()
    setResult({ data: null, error: { code: 'XX000', message: 'boom' } })
    await expect(interestGuideApi.getHistory()).resolves.toEqual([])
  })

  it('getHistoryCount returnerar count från head-query', async () => {
    loggedIn()
    setResult({ count: 7, error: null })
    const result = await interestGuideApi.getHistoryCount()
    expect(mockFrom).toHaveBeenCalledWith('interest_guide_history')
    expect(mockFromBuilder.select).toHaveBeenCalledWith('*', { count: 'exact', head: true })
    expect(result).toBe(7)
  })

  it('saveToHistory insertar med user_id + completed_at och returnerar raden', async () => {
    loggedIn('user-42')
    const entry = {
      answers: { q1: 3 },
      riasec_profile: { R: 1 },
      bigfive_profile: { O: 2 },
      icf_profile: {},
      strong_interest: {},
      top_occupations: [{ name: 'Snickare', matchPercentage: 88 }],
    }
    setResult({ data: { id: 'h1', ...entry }, error: null })
    const result = await interestGuideApi.saveToHistory(entry)
    expect(mockFrom).toHaveBeenCalledWith('interest_guide_history')
    expect(mockFromBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-42',
        answers: { q1: 3 },
        completed_at: expect.any(String),
      })
    )
    expect(result).toMatchObject({ id: 'h1' })
  })

  it('saveToHistory returnerar null vid databasfel', async () => {
    loggedIn()
    setResult({ data: null, error: { code: 'XX000', message: 'boom' } })
    const result = await interestGuideApi.saveToHistory({
      answers: {}, riasec_profile: {}, bigfive_profile: {},
      icf_profile: {}, strong_interest: {}, top_occupations: [],
    })
    expect(result).toBeNull()
  })
})

// ============================================
// SPARADE JOBB
// ============================================
describe('savedJobsApi.getAll', () => {
  it('hämtar saved_jobs sorterade på created_at fallande', async () => {
    const rows = [{ id: '1', job_id: 'j1' }]
    setResult({ data: rows, error: null })
    const result = await savedJobsApi.getAll()
    expect(mockFrom).toHaveBeenCalledWith('saved_jobs')
    expect(mockFromBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result).toEqual(rows)
  })

  it('faller tillbaka på localStorage vid databasfel', async () => {
    setResult({ data: null, error: { code: 'XX000', message: 'boom' } })
    vi.mocked(window.localStorage.getItem).mockReturnValue('[{"id":"local-1"}]')
    const result = await savedJobsApi.getAll()
    expect(window.localStorage.getItem).toHaveBeenCalledWith('savedJobs')
    expect(result).toEqual([{ id: 'local-1' }])
  })
})

describe('savedJobsApi.add', () => {
  it('sparar till localStorage och returnerar jobbet utan inloggad användare', async () => {
    loggedOut()
    vi.mocked(window.localStorage.getItem).mockReturnValue('[]')
    const job = { id: 'j1', title: 'Utvecklare' }
    const result = await savedJobsApi.add(job)
    expect(mockFrom).not.toHaveBeenCalled()
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'savedJobs',
      JSON.stringify([job])
    )
    expect(result).toEqual(job)
  })

  it('insertar user_id, job_id och job_data för inloggad användare', async () => {
    loggedIn('user-42')
    const job = { id: 'j1', title: 'Utvecklare' }
    setResult({ data: { id: 'row-1', job_id: 'j1' }, error: null })
    const result = await savedJobsApi.add(job)
    expect(mockFrom).toHaveBeenCalledWith('saved_jobs')
    expect(mockFromBuilder.insert).toHaveBeenCalledWith({
      user_id: 'user-42',
      job_id: 'j1',
      job_data: job,
    })
    expect(result).toMatchObject({ id: 'row-1' })
  })
})

describe('savedJobsApi.remove', () => {
  it('raderar via job_id och user_id', async () => {
    loggedIn('user-42')
    setResult({ error: null })
    await savedJobsApi.remove('j1')
    expect(mockFrom).toHaveBeenCalledWith('saved_jobs')
    expect(mockFromBuilder.delete).toHaveBeenCalled()
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('job_id', 'j1')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('user_id', 'user-42')
  })

  it('delete är alias för remove', async () => {
    loggedIn('user-42')
    setResult({ error: null })
    await savedJobsApi.delete('j1')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('job_id', 'j1')
  })
})

describe('savedJobsApi.isSaved', () => {
  it('returnerar true när jobbet finns sparat', async () => {
    loggedIn()
    setResult({ data: [{ id: 'row-1' }], error: null })
    await expect(savedJobsApi.isSaved('j1')).resolves.toBe(true)
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('job_id', 'j1')
    expect(mockFromBuilder.limit).toHaveBeenCalledWith(1)
  })

  it('returnerar false när jobbet inte finns', async () => {
    loggedIn()
    setResult({ data: [], error: null })
    await expect(savedJobsApi.isSaved('j1')).resolves.toBe(false)
  })
})

// ============================================
// HUMÖR (mood_logs)
// ============================================
describe('moodApi.getTodaysMood', () => {
  it('returnerar null utan inloggad användare', async () => {
    loggedOut()
    await expect(moodApi.getTodaysMood()).resolves.toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('hämtar dagens rad och konverterar mood_level 5 till "great"', async () => {
    loggedIn('user-42')
    setResult({ data: { mood_level: 5, note: 'Bra dag' }, error: null })
    const result = await moodApi.getTodaysMood()
    const today = new Date().toISOString().split('T')[0]
    expect(mockFrom).toHaveBeenCalledWith('mood_logs')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('user_id', 'user-42')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('log_date', today)
    expect(result).toEqual({ mood: 'great', note: 'Bra dag' })
  })

  it('returnerar null vid databasfel — propagerar inte', async () => {
    loggedIn()
    setResult({ data: null, error: { code: 'XX000', message: 'boom' } })
    await expect(moodApi.getTodaysMood()).resolves.toBeNull()
  })
})

describe('moodApi.logMood', () => {
  it('upsertar mood_level konverterad från MoodType med onConflict user_id,log_date', async () => {
    loggedIn('user-42')
    setResult({ error: null })
    const ok = await moodApi.logMood('good', 'En anteckning')
    const today = new Date().toISOString().split('T')[0]
    expect(mockFrom).toHaveBeenCalledWith('mood_logs')
    expect(mockFromBuilder.upsert).toHaveBeenCalledWith(
      { user_id: 'user-42', mood_level: 4, note: 'En anteckning', log_date: today },
      { onConflict: 'user_id,log_date' }
    )
    expect(ok).toBe(true)
  })

  it('returnerar false utan inloggad användare', async () => {
    loggedOut()
    await expect(moodApi.logMood('okay')).resolves.toBe(false)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returnerar false vid databasfel', async () => {
    loggedIn()
    setResult({ error: { code: 'XX000', message: 'boom' } })
    await expect(moodApi.logMood('terrible')).resolves.toBe(false)
  })
})

describe('moodApi.getHistory', () => {
  it('mappar rader till { mood, note, logged_at } med nivå→typ-konvertering', async () => {
    loggedIn()
    setResult({
      data: [
        { mood_level: 1, note: 'Tungt', log_date: '2026-07-09' },
        { mood_level: 3, note: undefined, log_date: '2026-07-08' },
      ],
      error: null,
    })
    const result = await moodApi.getHistory(14)
    expect(mockFromBuilder.limit).toHaveBeenCalledWith(14)
    expect(result).toEqual([
      { mood: 'terrible', note: 'Tungt', logged_at: '2026-07-09' },
      { mood: 'okay', note: undefined, logged_at: '2026-07-08' },
    ])
  })

  it('returnerar [] vid databasfel', async () => {
    loggedIn()
    setResult({ data: null, error: { code: 'XX000', message: 'boom' } })
    await expect(moodApi.getHistory()).resolves.toEqual([])
  })
})

describe('moodApi.getStreak', () => {
  const localDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  it('returnerar 0 utan inloggad användare', async () => {
    loggedOut()
    await expect(moodApi.getStreak()).resolves.toBe(0)
  })

  it('räknar sammanhängande dagar bakåt från idag/igår', async () => {
    loggedIn()
    const today = new Date()
    const yesterday = new Date(today.getTime() - 86400000)
    setResult({
      data: [
        { log_date: localDateStr(today) },
        { log_date: localDateStr(yesterday) },
      ],
      error: null,
    })
    await expect(moodApi.getStreak()).resolves.toBe(2)
  })

  it('returnerar 0 när senaste loggen är äldre än igår', async () => {
    loggedIn()
    const old = new Date(Date.now() - 5 * 86400000)
    setResult({ data: [{ log_date: localDateStr(old) }], error: null })
    await expect(moodApi.getStreak()).resolves.toBe(0)
  })
})

// ============================================
// PERSONAL BRAND
// ============================================
describe('personalBrandApi audit', () => {
  it('getAuditAnswers läser localStorage utan inloggad användare', async () => {
    loggedOut()
    vi.mocked(window.localStorage.getItem).mockReturnValue('{"q1":true}')
    const result = await personalBrandApi.getAuditAnswers()
    expect(window.localStorage.getItem).toHaveBeenCalledWith('brand-audit-answers')
    expect(result).toEqual({ q1: true })
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('getAuditAnswers returnerar answers från senaste raden i personal_brand_audit', async () => {
    loggedIn('user-42')
    setResult({ data: [{ answers: { q1: true, q2: false } }], error: null })
    const result = await personalBrandApi.getAuditAnswers()
    expect(mockFrom).toHaveBeenCalledWith('personal_brand_audit')
    expect(mockFromBuilder.order).toHaveBeenCalledWith('updated_at', { ascending: false })
    expect(mockFromBuilder.limit).toHaveBeenCalledWith(1)
    expect(result).toEqual({ q1: true, q2: false })
  })

  it('getAuditAnswers returnerar {} när ingen rad finns', async () => {
    loggedIn()
    setResult({ data: [], error: null })
    await expect(personalBrandApi.getAuditAnswers()).resolves.toEqual({})
  })

  it('saveAuditAnswers upsertar answers + poäng med onConflict user_id', async () => {
    loggedIn('user-42')
    setResult({ error: null })
    await personalBrandApi.saveAuditAnswers({ q1: true }, 80, { profil: 90 })
    expect(mockFromBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-42',
        answers: { q1: true },
        total_score: 80,
        category_scores: { profil: 90 },
      }),
      { onConflict: 'user_id' }
    )
  })

  it('saveAuditAnswers sparar till localStorage utan inloggad användare', async () => {
    loggedOut()
    await personalBrandApi.saveAuditAnswers({ q1: false }, 0, {})
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'brand-audit-answers',
      JSON.stringify({ q1: false })
    )
    expect(mockFrom).not.toHaveBeenCalled()
  })
})

describe('personalBrandApi portfolio', () => {
  const item = { title: 'Projekt X', item_type: 'project' as const, tags: ['react'] }

  it('getPortfolioItems hämtar portfolio_items sorterat på sort_order', async () => {
    loggedIn('user-42')
    setResult({ data: [{ id: 'p1', title: 'Projekt X' }], error: null })
    const result = await personalBrandApi.getPortfolioItems()
    expect(mockFrom).toHaveBeenCalledWith('portfolio_items')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('user_id', 'user-42')
    expect(mockFromBuilder.order).toHaveBeenCalledWith('sort_order', { ascending: true })
    expect(result).toEqual([{ id: 'p1', title: 'Projekt X' }])
  })

  it('addPortfolioItem insertar med user_id och returnerar raden', async () => {
    loggedIn('user-42')
    setResult({ data: { id: 'p1', ...item }, error: null })
    const result = await personalBrandApi.addPortfolioItem(item)
    expect(mockFromBuilder.insert).toHaveBeenCalledWith({ ...item, user_id: 'user-42' })
    expect(result).toMatchObject({ id: 'p1', title: 'Projekt X' })
  })

  it('addPortfolioItem faller tillbaka på localStorage vid databasfel', async () => {
    loggedIn()
    setResult({ data: null, error: { code: 'XX000', message: 'boom' } })
    vi.mocked(window.localStorage.getItem).mockReturnValue('[]')
    const result = await personalBrandApi.addPortfolioItem(item)
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'portfolio-items',
      expect.any(String)
    )
    expect(result).toMatchObject({ title: 'Projekt X', id: expect.any(String) })
  })

  it('deletePortfolioItem raderar med id + user_id', async () => {
    loggedIn('user-42')
    setResult({ error: null })
    await personalBrandApi.deletePortfolioItem('p1')
    expect(mockFrom).toHaveBeenCalledWith('portfolio_items')
    expect(mockFromBuilder.delete).toHaveBeenCalled()
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('id', 'p1')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('user_id', 'user-42')
  })
})

// ============================================
// KALENDER
// ============================================
describe('calendarApi.getEvents', () => {
  it('returnerar localStorage-cache utan inloggad användare', async () => {
    loggedOut()
    vi.mocked(window.localStorage.getItem).mockReturnValue('[{"id":"e1","title":"Möte"}]')
    const result = await calendarApi.getEvents()
    expect(window.localStorage.getItem).toHaveBeenCalledWith('calendar_events')
    expect(result).toEqual([{ id: 'e1', title: 'Möte' }])
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('transformerar snake_case-rader till camelCase och cachar resultatet', async () => {
    loggedIn()
    setResult({
      data: [{
        id: 'e1',
        title: 'Intervju',
        date: '2026-07-15',
        time: '10:00',
        end_time: '11:00',
        type: 'interview',
        is_video: true,
        with_person: 'Anna',
        job_application_id: 'app-1',
        tasks: null,
        reminders: null,
        shared_with: null,
      }],
      error: null,
    })
    const result = await calendarApi.getEvents()
    expect(mockFrom).toHaveBeenCalledWith('calendar_events')
    expect(mockFromBuilder.order).toHaveBeenCalledWith('date', { ascending: true })
    expect(mockFromBuilder.order).toHaveBeenCalledWith('time', { ascending: true })
    expect(result[0]).toMatchObject({
      id: 'e1',
      endTime: '11:00',
      isVideo: true,
      with: 'Anna',
      jobApplicationId: 'app-1',
      tasks: [],       // null normaliseras till []
      reminders: [],
      sharedWith: [],
    })
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'calendar_events',
      expect.any(String)
    )
  })

  it('faller tillbaka på cache vid databasfel', async () => {
    loggedIn()
    setResult({ data: null, error: { code: 'XX000', message: 'boom' } })
    vi.mocked(window.localStorage.getItem).mockReturnValue('[{"id":"cached"}]')
    await expect(calendarApi.getEvents()).resolves.toEqual([{ id: 'cached' }])
  })
})

describe('calendarApi.createEvent', () => {
  const event = {
    title: 'Intervju',
    date: '2026-07-15',
    time: '10:00',
    type: 'interview',
    with_person: 'Anna',
  }

  it('insertar mappade kolumner med user_id och defaults', async () => {
    loggedIn('user-42')
    setResult({ data: { id: 'e1', ...event }, error: null })
    const result = await calendarApi.createEvent(event)
    expect(mockFrom).toHaveBeenCalledWith('calendar_events')
    expect(mockFromBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-42',
        title: 'Intervju',
        date: '2026-07-15',
        time: '10:00',
        with_person: 'Anna',
        tasks: [],
        reminders: [],
        shared_with: [],
        is_shared: false,
      })
    )
    expect(result).toMatchObject({ id: 'e1' })
  })

  it('returnerar null vid databasfel', async () => {
    loggedIn()
    setResult({ data: null, error: { code: 'XX000', message: 'boom' } })
    await expect(calendarApi.createEvent(event)).resolves.toBeNull()
  })
})

describe('calendarApi.updateEvent', () => {
  it('skickar bara definierade fält i update-payloaden', async () => {
    loggedIn()
    setResult({ error: null })
    const ok = await calendarApi.updateEvent('e1', { title: 'Ny titel', time: '13:00' })
    expect(mockFromBuilder.update).toHaveBeenCalledWith({ title: 'Ny titel', time: '13:00' })
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('id', 'e1')
    expect(ok).toBe(true)
  })

  it('returnerar false vid databasfel', async () => {
    loggedIn()
    setResult({ error: { code: 'XX000', message: 'boom' } })
    await expect(calendarApi.updateEvent('e1', { title: 'X' })).resolves.toBe(false)
  })
})

describe('calendarApi.deleteEvent', () => {
  it('raderar via id och returnerar true', async () => {
    loggedIn()
    setResult({ error: null })
    const ok = await calendarApi.deleteEvent('e1')
    expect(mockFromBuilder.delete).toHaveBeenCalled()
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('id', 'e1')
    expect(ok).toBe(true)
  })

  it('returnerar false vid databasfel', async () => {
    loggedIn()
    setResult({ error: { code: 'XX000', message: 'boom' } })
    await expect(calendarApi.deleteEvent('e1')).resolves.toBe(false)
  })
})

describe('calendarApi.getGoals', () => {
  it('transformerar start_date till startDate', async () => {
    loggedIn()
    setResult({
      data: [{ id: 'g1', type: 'applications', target: 5, period: 'week', start_date: '2026-07-06' }],
      error: null,
    })
    const result = await calendarApi.getGoals()
    expect(mockFrom).toHaveBeenCalledWith('calendar_goals')
    expect(result).toEqual([
      { id: 'g1', type: 'applications', target: 5, period: 'week', startDate: '2026-07-06' },
    ])
  })
})

describe('calendarApi.saveMoodEntry', () => {
  it('upsertar med onConflict user_id,date och returnerar raden', async () => {
    loggedIn('user-42')
    const entry = { date: '2026-07-10', level: 4, energy_level: 3 }
    setResult({ data: { ...entry, user_id: 'user-42' }, error: null })
    const result = await calendarApi.saveMoodEntry(entry)
    expect(mockFrom).toHaveBeenCalledWith('calendar_mood_entries')
    expect(mockFromBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-42', date: '2026-07-10', level: 4, energy_level: 3 }),
      { onConflict: 'user_id,date' }
    )
    expect(result).toMatchObject({ date: '2026-07-10', level: 4 })
  })

  it('returnerar null vid databasfel', async () => {
    loggedIn()
    setResult({ data: null, error: { code: 'XX000', message: 'boom' } })
    await expect(
      calendarApi.saveMoodEntry({ date: '2026-07-10', level: 2 })
    ).resolves.toBeNull()
  })
})
