/**
 * savedJobsApi — jobbsökningens vy på saved_jobs.
 *
 * Flyttad hit från cloudStorage.test.ts i E12-konsolideringen (2026-07-28).
 * Implementationen ligger inte längre i cloudStorage: `applicationsApi` äger
 * all åtkomst till `saved_jobs`, och det här objektet översätter till radformen.
 *
 * Testerna asserterar BETEENDE, inte frågeform. De gamla låste fast exakt
 * kolumnlista och `delete`-villkor, vilket gjorde dem omöjliga att flytta utan
 * att skriva om — och de sa ingenting om vad användaren faktiskt får.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { savedJobsApi } from './jobsApi'
import { applicationsApi } from './applicationsApi'

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) } },
}))

const app = (over: Record<string, unknown> = {}) => ({
  id: 'row-1',
  userId: 'u1',
  jobId: 'j1',
  jobData: { headline: 'Lagerarbetare' },
  status: 'saved',
  source: 'job_search',
  priority: 'medium',
  createdAt: '2026-07-01T00:00:00Z',
  updatedAt: '2026-07-01T00:00:00Z',
  archivedAt: null,
  ...over,
}) as never

beforeEach(() => {
  vi.restoreAllMocks()
  // localStorage är mockad globalt i testuppsättningen — styr den via vi.mocked
  vi.mocked(window.localStorage.getItem).mockReturnValue(null)
  vi.mocked(window.localStorage.setItem).mockClear()
})

describe('savedJobsApi — radform och skiftläge', () => {
  it('översätter Application till radform med VERSAL status', async () => {
    vi.spyOn(applicationsApi, 'getAll').mockResolvedValue([app()])

    const rows = await savedJobsApi.getAll()

    expect(rows).toHaveLength(1)
    expect(rows[0].job_id).toBe('j1')
    // Databasen lagrar VERSALER, appen arbetar i gemener — översättningen sker
    // här så konsumenterna får samma form som före konsolideringen.
    expect(rows[0].status).toBe('SAVED')
    expect(rows[0].job_data).toEqual({ headline: 'Lagerarbetare' })
  })

  it('updateStatus skickar gemen status vidare till applicationsApi', async () => {
    const spy = vi.spyOn(applicationsApi, 'updateByJobId').mockResolvedValue(app({ status: 'applied' }))

    const row = await savedJobsApi.updateStatus('j1', 'APPLIED')

    expect(spy).toHaveBeenCalledWith('j1', { status: 'applied' })
    expect(row.status).toBe('APPLIED')
  })

  it('getByStatus normaliserar inskickade statusar', async () => {
    const spy = vi.spyOn(applicationsApi, 'getByStatus').mockResolvedValue([])

    await savedJobsApi.getByStatus(['SAVED', 'Applied'])

    expect(spy).toHaveBeenCalledWith(['saved', 'applied'])
  })

  it('isSaved delegerar till applicationsApi', async () => {
    vi.spyOn(applicationsApi, 'isSaved').mockResolvedValue(true)
    await expect(savedJobsApi.isSaved('j1')).resolves.toBe(true)
  })
})

describe('savedJobsApi — offline-reserven (bara vid skrivning sedan 2026-09-22)', () => {
  // 2026-09-22: getAll föll tillbaka på den lokala kopian (för en inloggad
  // användare nästan alltid []) — ett läsfel såg ut som "inga sparade jobb",
  // och Resources/CoverLetterWrite:s felvyer kunde aldrig visas.
  // Mutation: återställ try/catch → offline.read() → testet faller.
  it('getAll KASTAR när molnet inte svarar — ett fel är ingen tom lista', async () => {
    vi.spyOn(applicationsApi, 'getAll').mockRejectedValue(new Error('nätverk'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(window.localStorage.getItem).mockReturnValue('[{"id":"local-1"}]')

    await expect(savedJobsApi.getAll()).rejects.toThrow('nätverk')
  })

  it('add sparar lokalt när användaren inte är inloggad', async () => {
    vi.spyOn(applicationsApi, 'saveJob').mockRejectedValue(new Error('Not authenticated'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.mocked(window.localStorage.getItem).mockReturnValue('[]')

    const job = { id: 'j9', headline: 'Vaktmästare' }
    const result = await savedJobsApi.add(job)

    expect(result).toEqual(job)
    expect(window.localStorage.setItem).toHaveBeenCalledWith('savedJobs', JSON.stringify([job]))
  })

  it('remove tar bort lokalt när molnet inte svarar', async () => {
    vi.spyOn(applicationsApi, 'deleteByJobId').mockRejectedValue(new Error('nätverk'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(window.localStorage.getItem).mockReturnValue('[{"id":"j9"},{"id":"j8"}]')

    await savedJobsApi.remove('j9')

    expect(window.localStorage.setItem).toHaveBeenCalledWith('savedJobs', JSON.stringify([{ id: 'j8' }]))
  })
})
