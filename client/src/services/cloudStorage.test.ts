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

  /*
    Testet hette "kastar inte vid databasfel — felet sväljs" och asserterade
    `resolves.toBeUndefined()`. Det cementerade defekten: eftersom anropet
    aldrig kunde misslyckas visade TestTab den gröna bocken "Sparat" även när
    ingenting sparats. Samma familj som `journey_goals`-testet och
    `useJobsokHubSummary.test.ts` — ett test som låser fast det trasiga.

    Kontraktet nu: kastar fortfarande inte (anroparen ska inte behöva
    try/catch per tangenttryck), men returnerar false så UI:t kan säga
    sanningen. (2026-08-21)
  */
  it('returnerar false vid databasfel i stället för att se ut att lyckas', async () => {
    loggedIn()
    setResult({ error: { code: '42501', message: 'RLS' } })
    await expect(interestGuideApi.saveProgress({ current_step: 1 })).resolves.toBe(false)
  })

  it('returnerar true när raden faktiskt skrevs', async () => {
    loggedIn()
    setResult({ error: null })
    await expect(interestGuideApi.saveProgress({ current_step: 1 })).resolves.toBe(true)
  })

  it('returnerar false när ingen är inloggad', async () => {
    loggedOut()
    await expect(interestGuideApi.saveProgress({ current_step: 1 })).resolves.toBe(false)
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

/**
 * Verkliga former, inte tomma objekt. Fixturerna var "riasec_profile: { R: 1 }"
 * och "icf_profile: {}" — de gick igenom mot Record<string, number> och testade
 * därför att koden fungerar på data som inte finns. Samma fälla som
 * CV-kompetenserna 2026-08-03. Skalorna nedan är de riktiga: RIASEC och ICF
 * 1–5, Big Five och intressen 0–100.
 */
const RIASEC = { R: 1, I: 3, A: 5, S: 4, E: 2, C: 3 }
const BIGFIVE = { openness: 75, conscientiousness: 50, extraversion: 25, agreeableness: 60, stability: 40 }
const ICF = { kognitiv: 4, kommunikation: 3, koncentration: 2, motorik: 5, sensorisk: 3, energi: 4 }
const INTRESSEN = {
  teknik_mekanik: 50, natur_vetenskap: 25, konst_kultur: 75, social_vard: 100,
  affarer_forsaljning: 0, administration_kontor: 50, utomhusarbete: 25,
  ledarskap_organisation: 50, data_it: 75, undervisning_pedagogik: 50,
}

  it('saveToHistory insertar med user_id + completed_at och returnerar raden', async () => {
    loggedIn('user-42')
    const entry = {
      answers: { q1: 3 },
      riasec_profile: RIASEC,
      bigfive_profile: BIGFIVE,
      icf_profile: ICF,
      strong_interest: INTRESSEN,
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
      answers: {}, riasec_profile: RIASEC, bigfive_profile: BIGFIVE,
      icf_profile: ICF, strong_interest: INTRESSEN, top_occupations: [],
    })
    expect(result).toBeNull()
  })
})

// ============================================
// SPARADE JOBB
// ============================================
// savedJobsApi-testerna flyttade till jobsApi.savedJobs.test.ts (E12, 2026-07-28).
// Implementationen ligger inte längre här: applicationsApi äger saved_jobs och
// jobsApi exponerar radformen. De gamla testerna asserterade dessutom exakta
// frågeformer (kolumnlista, delete-by-job_id) i stället för beteende.

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

  it('saveAuditAnswers upsertar INTE mot user_id', async () => {
    /*
      Testet hette tidigare "upsertar answers + poäng med onConflict user_id"
      och asserterade exakt det anrop som ger 42P10 i prod:
      `personal_brand_audit` har inget unikt index på `user_id`, bara
      primärnyckeln på `id` (verifierat 2026-08-21). Mot en mockad klient går
      ett omöjligt `ON CONFLICT` alltid igenom — samma fälla som
      `journey_goals`. Testet cementerade alltså en skrivväg som aldrig
      kunnat lyckas, medan sidan sa "Dina svar sparas automatiskt i molnet".
    */
    loggedIn('user-42')
    setResult({ data: null, error: null })
    await personalBrandApi.saveAuditAnswers({ q1: true }, 80, { profil: 90 })
    expect(mockFromBuilder.upsert).not.toHaveBeenCalled()
    expect(mockFromBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-42',
        answers: { q1: true },
        total_score: 80,
        category_scores: { profil: 90 },
      })
    )
  })

  it('saveAuditAnswers kastar när skrivningen failar', async () => {
    // Felet sväljdes tidigare av `handleStorageError`, och svaren lades i
    // localStorage som ingen läsväg hämtade dem ur.
    loggedIn('user-42')
    setResult({ data: null, error: { code: 'XX000', message: 'boom' } })
    await expect(personalBrandApi.saveAuditAnswers({ q1: true }, 1, {})).rejects.toThrow()
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

  it('addPortfolioItem kastar vid databasfel i stället för att låtsas lyckas', async () => {
    /*
      Testet hette "faller tillbaka på localStorage vid databasfel" och
      asserterade att `setItem` anropades — men aldrig att objektet gick att
      läsa TILLBAKA. Det gick det inte: `getPortfolioItems` hämtar bara
      localStorage när SELECT failar, och för en inloggad användare med
      fungerande läsning möttes de två aldrig. Objektet låg i webbläsaren,
      syntes aldrig, och raderades vid nästa utloggning. Användaren fick se
      formuläret stängas och listan vara oförändrad.
    */
    loggedIn()
    setResult({ data: null, error: { code: 'XX000', message: 'boom' } })
    vi.mocked(window.localStorage.getItem).mockReturnValue('[]')
    await expect(personalBrandApi.addPortfolioItem(item)).rejects.toThrow()
    expect(window.localStorage.setItem).not.toHaveBeenCalledWith(
      'portfolio-items',
      expect.any(String)
    )
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
