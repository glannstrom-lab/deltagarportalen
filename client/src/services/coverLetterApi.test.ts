/**
 * Tester för coverLetterApi — CRUD mot `cover_letters`. Verifierar
 * auth-guards (APIError/UNAUTHORIZED), PGRST116→null-vägen i getById,
 * kolumnskrivningar (user_id/updated_at) och felpropagering. Mockar Supabase.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- supabase-builder-mock kräver any-typad chainable */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { coverLetterApi } from './coverLetterApi'

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
  mockFromBuilder.order = vi.fn(() => mockFromBuilder)
  mockFromBuilder.single = vi.fn()
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

describe('coverLetterApi.getAll', () => {
  it('kastar APIError(UNAUTHORIZED) om ingen user är inloggad', async () => {
    loggedOut()
    await expect(coverLetterApi.getAll()).rejects.toThrow('Inte inloggad')
    await expect(coverLetterApi.getAll()).rejects.toMatchObject({ code: 'UNAUTHORIZED', status: 401 })
  })

  it('hämtar brev för inloggad user, sorterat nyast först', async () => {
    loggedIn()
    thenResult = { data: [{ id: 'cl-1' }], error: null }
    const result = await coverLetterApi.getAll()
    expect(mockFrom).toHaveBeenCalledWith('cover_letters')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(mockFromBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result).toEqual([{ id: 'cl-1' }])
  })

  it('returnerar tom array om data är null', async () => {
    loggedIn()
    thenResult = { data: null, error: null }
    expect(await coverLetterApi.getAll()).toEqual([])
  })

  it('kastar vidare supabase-fel', async () => {
    loggedIn()
    thenResult = { data: null, error: new Error('db-fel') }
    await expect(coverLetterApi.getAll()).rejects.toThrow('db-fel')
  })
})

describe('coverLetterApi.getById', () => {
  it('kastar APIError(UNAUTHORIZED) om ingen user är inloggad', async () => {
    loggedOut()
    await expect(coverLetterApi.getById('cl-1')).rejects.toThrow('Inte inloggad')
  })

  it('returnerar null vid PGRST116 (hittades inte)', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'No rows' },
    })
    expect(await coverLetterApi.getById('finns-ej')).toBeNull()
  })

  it('returnerar brevet och filtrerar på id + user_id', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'cl-1' }, error: null })
    const result = await coverLetterApi.getById('cl-1')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('id', 'cl-1')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(result).toEqual({ id: 'cl-1' })
  })

  it('kastar vidare andra supabase-fel (inte PGRST116)', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({
      data: null,
      error: { code: '42501', message: 'rls-fel' },
    })
    await expect(coverLetterApi.getById('cl-1')).rejects.toThrow('Åtkomst nekad')
  })
})

describe('coverLetterApi.create', () => {
  it('kastar APIError(UNAUTHORIZED) om ingen user är inloggad', async () => {
    loggedOut()
    await expect(coverLetterApi.create({ content: 'x' })).rejects.toThrow('Inte inloggad')
  })

  it('insertar brevdata + user_id från inloggad user', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'cl-ny' }, error: null })
    const result = await coverLetterApi.create({ content: 'Mitt brev', title: 'Ansökan' })
    expect(mockFrom).toHaveBeenCalledWith('cover_letters')
    expect(mockFromBuilder.insert).toHaveBeenCalledWith({
      content: 'Mitt brev',
      title: 'Ansökan',
      user_id: 'user-1',
    })
    expect(result).toEqual({ id: 'cl-ny' })
  })

  it('kastar vidare supabase-fel vid insert', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({ data: null, error: new Error('insert-fel') })
    await expect(coverLetterApi.create({ content: 'x' })).rejects.toThrow('insert-fel')
  })
})

describe('coverLetterApi.update', () => {
  it('kastar APIError(UNAUTHORIZED) om ingen user är inloggad', async () => {
    loggedOut()
    await expect(coverLetterApi.update('cl-1', { content: 'x' })).rejects.toThrow('Inte inloggad')
  })

  it('uppdaterar med ny updated_at och filtrerar på id + user_id', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({ data: { id: 'cl-1', content: 'Nytt' }, error: null })
    const result = await coverLetterApi.update('cl-1', { content: 'Nytt' })
    expect(mockFromBuilder.update).toHaveBeenCalledWith({
      content: 'Nytt',
      updated_at: expect.any(String),
    })
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('id', 'cl-1')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(result).toEqual({ id: 'cl-1', content: 'Nytt' })
  })

  it('kastar vidare supabase-fel vid update', async () => {
    loggedIn()
    mockFromBuilder.single.mockResolvedValue({ data: null, error: new Error('update-fel') })
    await expect(coverLetterApi.update('cl-1', { content: 'x' })).rejects.toThrow('update-fel')
  })
})

describe('coverLetterApi.delete', () => {
  it('kastar APIError(UNAUTHORIZED) om ingen user är inloggad', async () => {
    loggedOut()
    await expect(coverLetterApi.delete('cl-1')).rejects.toThrow('Inte inloggad')
  })

  it('raderar filtrerat på id + user_id och returnerar true', async () => {
    loggedIn()
    thenResult = { data: null, error: null }
    const result = await coverLetterApi.delete('cl-1')
    expect(mockFromBuilder.delete).toHaveBeenCalled()
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('id', 'cl-1')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(result).toBe(true)
  })

  it('kastar vidare supabase-fel vid delete', async () => {
    loggedIn()
    thenResult = { data: null, error: new Error('delete-fel') }
    await expect(coverLetterApi.delete('cl-1')).rejects.toThrow('delete-fel')
  })
})
