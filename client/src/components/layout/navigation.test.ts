import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  navHubs,
  pageToHub,
  getActiveHub,
  navGroups,
  navItems,
  registreraBesok,
  senasteBesok,
} from './navigation'

describe('navHubs structure', () => {
  it('Test 1: navHubs has exactly 5 entries with correct ids in order', () => {
    expect(navHubs).toHaveLength(5)
    expect(navHubs.map(h => h.id)).toEqual([
      'oversikt',
      'jobb',
      'karriar',
      'resurser',
      'min-vardag',
    ])
  })

  it('Test 2: navHubs path values are exactly the 5 hub paths in order', () => {
    expect(navHubs.map(h => h.path)).toEqual([
      '/oversikt',
      '/jobb',
      '/karriar',
      '/resurser',
      '/min-vardag',
    ])
  })

  it('Test 3: navHubs domain values are exactly the 5 new domain values', () => {
    expect(navHubs.map(h => h.domain)).toEqual([
      'action',
      'activity',
      'coaching',
      'info',
      'wellbeing',
    ])
  })
})

describe('pageToHub lookup map', () => {
  it('Test 4: pageToHub maps /cv to jobb hub', () => {
    expect(pageToHub['/cv']).toBe('jobb')
  })

  it('Test 5: pageToHub maps /career to karriar hub', () => {
    expect(pageToHub['/career']).toBe('karriar')
  })

  it('Test 6: pageToHub maps /wellness to min-vardag hub', () => {
    expect(pageToHub['/wellness']).toBe('min-vardag')
  })

  it('Test 7: pageToHub maps /knowledge-base to resurser hub', () => {
    expect(pageToHub['/knowledge-base']).toBe('resurser')
  })

  it('Test 8: pageToHub maps / (root) to oversikt hub', () => {
    expect(pageToHub['/']).toBe('oversikt')
  })

  it('Test 13: Every memberPath in every hub also appears as a key in pageToHub', () => {
    for (const hub of navHubs) {
      for (const memberPath of hub.memberPaths) {
        expect(pageToHub[memberPath]).toBe(hub.id)
      }
    }
  })
})

describe('getActiveHub helper', () => {
  it('Test 9: getActiveHub(/applications) returns the jobb hub', () => {
    const hub = getActiveHub('/applications')
    expect(hub).toBeDefined()
    expect(hub!.id).toBe('jobb')
  })

  it('Test 10: getActiveHub(/cv/builder) resolves sub-path to jobb hub', () => {
    const hub = getActiveHub('/cv/builder')
    expect(hub).toBeDefined()
    expect(hub!.id).toBe('jobb')
  })

  it('Test 11: getActiveHub(/oversikt) returns the oversikt hub', () => {
    const hub = getActiveHub('/oversikt')
    expect(hub).toBeDefined()
    expect(hub!.id).toBe('oversikt')
  })

  it('Test 12: getActiveHub(/some-unknown-path) returns undefined', () => {
    expect(getActiveHub('/some-unknown-path')).toBeUndefined()
  })
})

describe('legacy navigation preserved', () => {
  it('Test 14: navGroups export still exists with length 3', () => {
    expect(navGroups).toHaveLength(3)
  })

  it('Test 15: navItems still contains /cv and /job-search', () => {
    const paths = navItems.map(item => item.path)
    expect(paths).toContain('/cv')
    expect(paths).toContain('/job-search')
  })
})

/**
 * Besökshistoriken bakom TopNavs "Senast besökt".
 *
 * Tillagt 2026-09-24 efter ett mutationsstickprov: både dubblettfiltret och
 * taket på 20 poster kunde tas bort ur registreraBesok() utan att ett enda
 * test föll. Utan filtret fylls listan med samma sida om och om igen; utan
 * taket växer nyckeln i localStorage för evigt.
 */
describe('registreraBesok / senasteBesok', () => {
  const NYCKEL = 'jobin_senaste_sidor'
  let klocka = 1_000

  beforeEach(() => {
    localStorage.removeItem(NYCKEL)
    klocka = 1_000
    vi.spyOn(Date, 'now').mockImplementation(() => ++klocka)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.removeItem(NYCKEL)
  })

  it('samma sida två gånger ger EN post, flyttad först', () => {
    registreraBesok('/cv')
    registreraBesok('/diary')
    registreraBesok('/cv')
    expect(senasteBesok().map((p) => p.path)).toEqual(['/cv', '/diary'])
  })

  it('sparar högst 20 poster, de senaste', () => {
    const sidor = [...new Set(navItems.map((i) => i.path).concat(navHubs.flatMap((h) => h.items.map((i) => i.path))))]
    expect(sidor.length, 'behöver fler än 20 kända sidor för att pröva taket').toBeGreaterThan(20)
    for (const s of sidor) registreraBesok(s)
    const lista = senasteBesok()
    expect(lista).toHaveLength(20)
    expect(lista[0].path).toBe(sidor[sidor.length - 1])
    expect(JSON.parse(localStorage.getItem(NYCKEL) ?? '[]')).toHaveLength(20)
  })

  it('sparar inte sökvägar som inte finns i navigationen', () => {
    registreraBesok('/login')
    registreraBesok('/oversikt')
    expect(senasteBesok()).toEqual([])
  })

  it('procentkodade sökvägar sparas avkodade', () => {
    registreraBesok('/spontanans%C3%B6kan')
    expect(senasteBesok().map((p) => p.path)).toEqual(['/spontanansökan'])
  })
})
