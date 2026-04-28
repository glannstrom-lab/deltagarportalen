import { describe, it, expect } from 'vitest'
import {
  navHubs,
  pageToHub,
  getActiveHub,
  navGroups,
  navItems,
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
