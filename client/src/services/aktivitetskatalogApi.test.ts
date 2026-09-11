import { describe, it, expect, vi, beforeEach } from 'vitest'

const fraga = vi.hoisted(() => ({
  from: vi.fn(),
  getUser: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: fraga.getUser },
    from: fraga.from,
  },
}))

import { aktivitetskatalogApi, katalogpostTillMallrad, type CatalogItem } from './aktivitetskatalogApi'

/** En kedjbar attrapp av supabase-frågebyggaren som svarar med `svar` i slutet. */
function byggare(svar: { data: unknown; error: unknown }) {
  const b: Record<string, unknown> = {}
  for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'order']) {
    b[m] = vi.fn(() => b)
  }
  b.single = vi.fn(async () => svar)
  // `.order()` sist i list(): gör byggaren awaitbar.
  b.then = (res: (v: unknown) => unknown) => Promise.resolve(svar).then(res)
  return b as unknown as { insert: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> } & Record<string, unknown>
}

const post: CatalogItem = {
  id: 'k1', org_id: 'o1', owner_id: 'u1', title: 'Språkcafé', activity_type: 'language',
  description: null, location: 'Hjernet', weekday: 2, start_time: '13:00', end_time: '15:00',
  capacity: 12, contact: null, is_active: true, created_at: '', updated_at: '',
}

describe('aktivitetskatalogApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fraga.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
  })

  it('kastar när ingen är inloggad — sväljer inte till tom lista', async () => {
    fraga.getUser.mockResolvedValue({ data: { user: null }, error: null })
    await expect(aktivitetskatalogApi.list()).rejects.toThrow('Inte inloggad')
    expect(fraga.from).not.toHaveBeenCalled()
  })

  it('kastar databasfelet vidare', async () => {
    fraga.from.mockReturnValue(byggare({ data: null, error: new Error('42501') }))
    await expect(aktivitetskatalogApi.list()).rejects.toThrow('42501')
  })

  it('kortar Postgres-tider till HH:MM', async () => {
    fraga.from.mockReturnValue(byggare({ data: [{ ...post, start_time: '13:00:00', end_time: '15:00:00' }], error: null }))
    const [p] = await aktivitetskatalogApi.list()
    expect(p.start_time).toBe('13:00')
    expect(p.end_time).toBe('15:00')
  })

  it('create sätter owner_id till den inloggade och tömmer tomma strängar till null', async () => {
    const b = byggare({ data: post, error: null })
    fraga.from.mockReturnValue(b)
    await aktivitetskatalogApi.create({ title: '  Språkcafé ', activity_type: 'language', location: '  ', weekday: 2, start_time: '13:00', end_time: '15:00' })
    expect(b.insert).toHaveBeenCalledWith(expect.objectContaining({
      owner_id: 'u1', org_id: null, title: 'Språkcafé', location: null, weekday: 2, is_active: true,
    }))
  })

  it('setActive skickar bara is_active', async () => {
    const b = byggare({ data: { ...post, is_active: false }, error: null })
    fraga.from.mockReturnValue(b)
    const r = await aktivitetskatalogApi.setActive('k1', false)
    expect(b.update).toHaveBeenCalledWith({ is_active: false })
    expect(r.is_active).toBe(false)
  })
})

describe('katalogpostTillMallrad', () => {
  it('bär rubrik, typ, plats, dag och tid', () => {
    expect(katalogpostTillMallrad(post)).toEqual({
      weekday: 2, start_time: '13:00', end_time: '15:00', title: 'Språkcafé', activity_type: 'language', location: 'Hjernet', notes: '',
    })
  })

  it('fyller måndag 09–12 när posten saknar dag och tid', () => {
    const rad = katalogpostTillMallrad({ ...post, weekday: null, start_time: null, end_time: null, location: null })
    expect(rad).toMatchObject({ weekday: 1, start_time: '09:00', end_time: '12:00', location: '' })
  })
})
