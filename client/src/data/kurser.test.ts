/**
 * KC15 — kurskatalogens integritet och genomförd-logiken.
 * Katalogen är data; det som kan gå fel tyst är en slug som slutat finnas,
 * en lästid som glidit isär, eller en kurs som räknas klar för tidigt.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { KURSER, kursMinuter, kursStatus, kursTillPass, laggTillMinuter } from './kurser'

interface Rad { slug: string; reading_time: number }
const snapshot = JSON.parse(readFileSync(resolve(__dirname, '../../content/articles.snapshot.json'), 'utf8')) as { articles: Rad[] }
const artiklar = new Map(snapshot.articles.map((a) => [a.slug, a]))

describe('kurskatalogen', () => {
  it('har minst tre kurser med unika id och minst tre delar var', () => {
    expect(KURSER.length).toBeGreaterThanOrEqual(3)
    expect(new Set(KURSER.map((k) => k.id)).size).toBe(KURSER.length)
    for (const k of KURSER) expect(k.delar.length).toBeGreaterThanOrEqual(3)
  })
  it('varje del är en publicerad artikel i snapshoten', () => {
    for (const k of KURSER) for (const d of k.delar) expect(artiklar.has(d.slug), `${k.id}: ${d.slug}`).toBe(true)
  })
  it('lästiden i katalogen är artikelns reading_time', () => {
    for (const k of KURSER) for (const d of k.delar) expect(d.minuter, d.slug).toBe(artiklar.get(d.slug)?.reading_time)
  })
  it('ingen slug förekommer två gånger i samma kurs', () => {
    for (const k of KURSER) expect(new Set(k.delar.map((d) => d.slug)).size).toBe(k.delar.length)
  })
})

describe('kursMinuter', () => {
  it('summerar och avrundar uppåt till närmaste 5', () => {
    expect(kursMinuter([{ minuter: 4 }, { minuter: 5 }, { minuter: 2 }, { minuter: 4 }, { minuter: 2 }])).toBe(20) // 17
    expect(kursMinuter([{ minuter: 5 }, { minuter: 5 }])).toBe(10) // exakt gräns avrundas inte upp
    expect(kursMinuter([{ minuter: 6 }])).toBe(10)
  })
})

describe('kursStatus', () => {
  const delar = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }]
  it('är genomförd först när alla delar är lästa', () => {
    expect(kursStatus(delar, new Set(['a', 'b'])).genomford).toBe(false)
    expect(kursStatus(delar, new Set(['a', 'b', 'c'])).genomford).toBe(true)
  })
  it('räknar bara kursens egna delar och skiljer ej påbörjad från påbörjad', () => {
    expect(kursStatus(delar, new Set(['x', 'y']))).toEqual({ totalt: 3, klara: 0, genomford: false, paborjad: false })
    expect(kursStatus(delar, new Set(['a', 'x']))).toMatchObject({ klara: 1, paborjad: true })
  })
  it('en kurs utan delar är aldrig genomförd', () => {
    expect(kursStatus([], new Set()).genomford).toBe(false)
  })
})

describe('kursTillPass', () => {
  it('lägger sluttiden start + uppskattad tid och tar rubrik ur kursnamnet', () => {
    const kurs = KURSER[0]
    const p = kursTillPass(kurs, '09:00')
    expect(p.title).toBe(`Kurs: ${kurs.namn}`)
    expect(p.start_time).toBe('09:00')
    expect(p.end_time).toBe(laggTillMinuter('09:00', kursMinuter(kurs.delar)))
    expect(p.end_time > p.start_time).toBe(true)
  })
  it('kapar vid 23:59 så att slut aldrig hamnar före start', () => {
    expect(laggTillMinuter('23:50', 25)).toBe('23:59')
    expect(laggTillMinuter('09:00', 20)).toBe('09:20')
  })
})
