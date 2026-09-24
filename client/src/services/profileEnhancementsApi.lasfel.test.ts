/**
 * Läsfel i profilens fyra listor ska nå anroparen (2026-09-24).
 *
 * Alla fyra `getAll` hade `if (error) throw error` INUTI ett try vars catch
 * returnerade `[]`. Kastet kunde alltså aldrig lämna funktionen: ett RLS-fel
 * eller nätverksglapp såg ut som "inga kompetenser/dokument/delningar/
 * ändringar", och profileStore räknade `skillsCount: 0` för någon med tio.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- supabase-builder-mock kräver any-typad chainable */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  profileSkillsApi,
  profileDocumentsApi,
  profileShareApi,
  profileHistoryApi,
} from './profileEnhancementsApi'

let resultat: any
const builder: any = {}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'user-1' } } }) },
    from: () => builder,
  },
}))

beforeEach(() => {
  resultat = { data: null, error: null }
  for (const m of ['select', 'eq', 'order', 'limit']) builder[m] = vi.fn(() => builder)
  builder.then = (res: any, rej: any) => Promise.resolve(resultat).then(res, rej)
})

const LASFEL = { code: '42501', message: 'permission denied for table' }

describe.each([
  ['profileSkillsApi', () => profileSkillsApi.getAll()],
  ['profileDocumentsApi', () => profileDocumentsApi.getAll()],
  ['profileShareApi', () => profileShareApi.getAll()],
  ['profileHistoryApi', () => profileHistoryApi.getAll()],
])('%s.getAll', (_namn, hamta) => {
  it('kastar vid läsfel i stället för att svara []', async () => {
    resultat = { data: null, error: LASFEL }
    await expect(hamta()).rejects.toMatchObject({ code: '42501' })
  })

  it('returnerar [] när det verkligen inte finns några rader', async () => {
    resultat = { data: [], error: null }
    await expect(hamta()).resolves.toEqual([])
  })
})

it('profileSkillsApi.getAll lämnar raderna i prod-formen orörda', async () => {
  const rad = {
    id: '6f1c2d3e-0000-4000-8000-000000000001',
    user_id: 'user-1',
    name: 'Truckkörning',
    category: 'technical',
    level: 4,
    years_experience: 2.5,
    verified: false,
    created_at: '2026-09-01T08:12:00+00:00',
    updated_at: '2026-09-01T08:12:00+00:00',
  }
  resultat = { data: [rad], error: null }
  await expect(profileSkillsApi.getAll()).resolves.toEqual([rad])
})
