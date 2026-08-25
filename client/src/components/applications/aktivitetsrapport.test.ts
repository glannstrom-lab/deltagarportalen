/**
 * Aktivitetsrapportens uträkning (O3, 2026-08-25).
 *
 * ## Varför den här filen finns
 *
 * Rapporten är ett underlag användaren fyller i hos Arbetsförmedlingen. Ett
 * jobb som tappas bort ur listan, eller ett datum som hamnar i fel månad,
 * blir alltså inte ett kosmetiskt fel utan en felaktig uppgift till en
 * myndighet. Varje test nedan är skrivet för att kunna **falla**:
 *
 * - Byter man ut strängparsningen i `manadsnyckel` mot `new Date(...)` faller
 *   "första i månaden", eftersom UTC-midnatt visas som föregående dag väster
 *   om Greenwich.
 * - Tar man bort `harSokt`-filtret faller "bokmärken räknas inte".
 * - Ändrar man `<= 14` till `< 14` faller gränsdagstestet.
 * - Slutar man räkna `utanDatum` faller testet som kräver att raderna syns.
 */

import { describe, it, expect } from 'vitest'
import type { Application, ApplicationStatus } from '@/types/application.types'
import {
  byggManadsrapport,
  foregaendeManad,
  foreslagenManad,
  manadsnyckel,
  manadsnyckelAv,
  manadsalternativ,
} from './aktivitetsrapport'

function ansokan(over: Partial<Application> & { id: string; status: ApplicationStatus }): Application {
  return {
    userId: 'u1',
    jobId: `job-${over.id}`,
    jobData: { headline: 'Jobb', employer: { name: 'Företag' } },
    source: 'manual',
    priority: 'medium',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  } as Application
}

describe('manadsnyckel', () => {
  it('läser månaden ur strängen, inte ur en tidszon', () => {
    // Det här är testet som faller om någon byter till new Date(...).getMonth().
    expect(manadsnyckel('2026-03-01')).toBe('2026-03')
    expect(manadsnyckel('2026-01-01T00:00:00.000Z')).toBe('2026-01')
    expect(manadsnyckel('2026-12-31')).toBe('2026-12')
  })

  it('ger null för det som inte är ett datum', () => {
    expect(manadsnyckel(null)).toBeNull()
    expect(manadsnyckel(undefined)).toBeNull()
    expect(manadsnyckel('')).toBeNull()
    expect(manadsnyckel('snart')).toBeNull()
    expect(manadsnyckel('2026-13-01')).toBeNull()
  })
})

describe('foregaendeManad', () => {
  it('går över årsskiftet', () => {
    expect(foregaendeManad('2026-01')).toBe('2025-12')
    expect(foregaendeManad('2026-08')).toBe('2026-07')
  })
})

describe('foreslagenManad', () => {
  it('öppnar på förra månaden till och med den 14:e', () => {
    expect(foreslagenManad(new Date(2026, 7, 14))).toBe('2026-07')
    expect(foreslagenManad(new Date(2026, 7, 1))).toBe('2026-07')
  })

  it('öppnar på innevarande månad från den 15:e', () => {
    expect(foreslagenManad(new Date(2026, 7, 15))).toBe('2026-08')
    expect(foreslagenManad(new Date(2026, 7, 31))).toBe('2026-08')
  })

  it('hanterar januari', () => {
    expect(foreslagenManad(new Date(2026, 0, 5))).toBe('2025-12')
  })
})

describe('manadsalternativ', () => {
  it('har alltid innevarande och föregående månad, även utan data', () => {
    const alt = manadsalternativ([], new Date(2026, 7, 20))
    expect(alt).toEqual(['2026-08', '2026-07'])
  })

  it('tar med månader som har sökta jobb, nyast först', () => {
    const alt = manadsalternativ(
      [
        ansokan({ id: '1', status: 'applied', applicationDate: '2026-05-04' }),
        ansokan({ id: '2', status: 'rejected', applicationDate: '2026-02-11' }),
        // Bokmärke — ska INTE skapa en månad.
        ansokan({ id: '3', status: 'saved', applicationDate: '2025-09-01' }),
      ],
      new Date(2026, 7, 20)
    )
    expect(alt).toEqual(['2026-08', '2026-07', '2026-05', '2026-02'])
  })
})

describe('byggManadsrapport', () => {
  const nu = '2026-06'

  it('tar med sökta jobb och utelämnar bokmärken', () => {
    const rapport = byggManadsrapport(
      [
        ansokan({ id: 'sokt', status: 'applied', applicationDate: '2026-06-03' }),
        ansokan({ id: 'bokmarkt', status: 'saved', applicationDate: '2026-06-04' }),
        ansokan({ id: 'intresserad', status: 'interested', applicationDate: '2026-06-05' }),
      ],
      nu
    )
    expect(rapport.rader.map((r) => r.id)).toEqual(['sokt'])
  })

  it('räknar avslag som sökt — man kan inte få avslag utan att ha sökt', () => {
    const rapport = byggManadsrapport(
      [ansokan({ id: 'avslag', status: 'rejected', applicationDate: '2026-06-09' })],
      nu
    )
    expect(rapport.rader).toHaveLength(1)
  })

  it('räknar återkallad som sökt bara när det finns ett datum', () => {
    const medDatum = byggManadsrapport(
      [ansokan({ id: 'a', status: 'withdrawn', applicationDate: '2026-06-09' })],
      nu
    )
    expect(medDatum.rader).toHaveLength(1)

    const utanDatum = byggManadsrapport(
      [ansokan({ id: 'b', status: 'withdrawn' })],
      nu
    )
    expect(utanDatum.rader).toHaveLength(0)
    // Den räknas inte heller som "saknar datum" — den har aldrig sökts.
    expect(utanDatum.utanDatum).toBe(0)
  })

  it('räknar sökta jobb utan datum i stället för att tappa dem tyst', () => {
    const rapport = byggManadsrapport(
      [
        ansokan({ id: 'utan1', status: 'applied' }),
        ansokan({ id: 'utan2', status: 'interview' }),
        ansokan({ id: 'med', status: 'applied', applicationDate: '2026-06-02' }),
      ],
      nu
    )
    expect(rapport.rader).toHaveLength(1)
    expect(rapport.utanDatum).toBe(2)
  })

  it('tar bara med den valda månaden', () => {
    const rapport = byggManadsrapport(
      [
        ansokan({ id: 'maj', status: 'applied', applicationDate: '2026-05-31' }),
        ansokan({ id: 'juni', status: 'applied', applicationDate: '2026-06-01' }),
        ansokan({ id: 'juli', status: 'applied', applicationDate: '2026-07-01' }),
      ],
      nu
    )
    expect(rapport.rader.map((r) => r.id)).toEqual(['juni'])
  })

  it('sorterar raderna kronologiskt', () => {
    const rapport = byggManadsrapport(
      [
        ansokan({ id: 'sen', status: 'applied', applicationDate: '2026-06-28' }),
        ansokan({ id: 'tidig', status: 'applied', applicationDate: '2026-06-02' }),
        ansokan({ id: 'mitten', status: 'applied', applicationDate: '2026-06-15' }),
      ],
      nu
    )
    expect(rapport.rader.map((r) => r.id)).toEqual(['tidig', 'mitten', 'sen'])
  })

  it('tar med arkiverade ansökningar — städning ändrar inte att jobbet söktes', () => {
    const rapport = byggManadsrapport(
      [
        ansokan({
          id: 'arkiverad',
          status: 'rejected',
          applicationDate: '2026-06-10',
          archivedAt: '2026-06-20T10:00:00.000Z',
        }),
      ],
      nu
    )
    expect(rapport.rader).toHaveLength(1)
  })

  it('lämnar tomma fält som null i stället för att hitta på ett värde', () => {
    const rapport = byggManadsrapport(
      [
        ansokan({
          id: 'tunn',
          status: 'applied',
          applicationDate: '2026-06-10',
          companyName: '   ',
          jobTitle: undefined,
          applicationMethod: undefined,
          jobUrl: '',
        }),
      ],
      nu
    )
    const rad = rapport.rader[0]
    expect(rad.arbetsgivare).toBeNull()
    expect(rad.tjanst).toBeNull()
    expect(rad.hurDuSokte).toBeNull()
    expect(rad.lank).toBeNull()
  })

  it('släpper igenom okända metodvärden som "inte ifyllt"', () => {
    const rapport = byggManadsrapport(
      [
        ansokan({
          id: 'skum',
          status: 'applied',
          applicationDate: '2026-06-10',
          applicationMethod: 'brevduva' as Application['applicationMethod'],
        }),
      ],
      nu
    )
    expect(rapport.rader[0].hurDuSokte).toBeNull()
  })

  it('behåller datumet som YYYY-MM-DD även när källan är en tidsstämpel', () => {
    const rapport = byggManadsrapport(
      [ansokan({ id: 'ts', status: 'applied', applicationDate: '2026-06-10T22:30:00.000Z' })],
      nu
    )
    expect(rapport.rader[0].datum).toBe('2026-06-10')
  })
})

describe('manadsnyckelAv', () => {
  it('nollställer inte månaden vid årets första dag', () => {
    expect(manadsnyckelAv(new Date(2026, 0, 1))).toBe('2026-01')
    expect(manadsnyckelAv(new Date(2026, 11, 31))).toBe('2026-12')
  })
})
